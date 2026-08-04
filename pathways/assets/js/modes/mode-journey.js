// Mode JOURNEY v3. Play your life forward, then play it again differently.
//
// The compare screen is still the point: two runs from the same start, side by
// side, both fine. Everything else earns that screen. What changed is that the
// turns are now decisions rather than a survey: a want gives the run a spine,
// two attention points make every year a trade off, chance cards ask for a
// response instead of printing a receipt, and the story remembers what you did.
//
// Accessibility is structural here: focus moves to the heading on every screen,
// one polite live region narrates state changes, and the disposition bars are
// real bars now.

import { esc, onAction } from '../components/dom.js';
import { icon } from '../components/icons.js';
import { decorate, bindGlossary } from '../components/glossary.js';
import { openSheet, onSheetAction, close as closeSheet } from '../components/sheet.js';
import {
  createRun, stagesFor, currentStage, visibleChoices, applyChoices, applyReflection,
  respondToChance, askMet, finish, diffRuns, POINTS_PER_TURN, wantAffinity,
} from '../engine/journey.js';
import { getState, saveRun, clearRuns, setLiveRun, currentYear, setSubjectLevel, setMode } from '../state.js';

let PATHS = {};
let DOORS = {};
let run = null;
let stages = [];
let picked = [];            // selected choice indices this turn
let justResolved = null;    // chance outcome awaiting Continue
let justLived = null;       // the year just committed, awaiting Continue
let restartArmed = false;   // first tap arms, second tap clears the run
let compareSel = [];        // run indices picked for comparison
let rerender = () => {};
let DATA = null;

export function renderJourney(host, data, ctx, repaint) {
  rerender = repaint;
  DATA = data;
  PATHS = Object.fromEntries((data.journey.paths || []).map((p) => [p.id, p]));
  DOORS = data.journey.doorsCatalog || {};
  const st = getState();
  const j = data.journey;

  if (!run && st.liveRun) {
    run = st.liveRun;
    stages = stagesFor(j.stages, run.startAge);
  }

  document.body.dataset.journey = run && !run.done ? 'true' : 'false';

  // The run survives a refresh on purpose: a reload must not cost a student
  // twenty minutes of story. The cost of that persistence is that a stuck or
  // regretted story needs a way out, so every in-run screen's rail carries
  // Start over. Armed on the first tap, so one stray touch cannot end it.
  restartArmed = false;
  onAction(host, {
    restart: (btn) => {
      if (!restartArmed) {
        restartArmed = true;
        btn.textContent = data.copy.journey.startOverArm;
        return;
      }
      setLiveRun(null);
      resetJourney();
      rerender();
    },
  });

  if (!run) return introScreen(host, data, st);
  if (run.done) return endingScreen(host, data, st);

  const stage = currentStage(run, stages);
  if (!stage) {
    finish(run, data);
    saveRun(structuredCloneSafe(run));
    rerender();
    return;
  }

  if (justLived) return livedScreen(host, data);
  if (justResolved) return chanceOutcome(host, data);
  if (run.pending) {
    const card = data.chances.cards.find((c) => c.id === run.pending.cardId);
    if (card) return chanceAsk(host, card, data);
    run.pending = null; run.stepIndex += 1;
  }

  if ((stage.format || 'turn') === 'reflect') return reflectScreen(host, stage, data);
  if ((stage.format || 'turn') === 'fork') return forkScreen(host, stage, data);
  return turnScreen(host, stage, data);
}

export function resetJourney() {
  run = null; picked = []; justResolved = null; justLived = null;
  document.body.dataset.journey = 'false';
}

function startRun(data, want) {
  const j = data.journey;
  const st = getState();
  // No clamp. A Sec 1 student plays Sec 1. The old floor of 15 silently aged a
  // thirteen year old forward two years and then offered them, at the stage it
  // called Sec 3, the chance to ask to move a level up: the one thing that was
  // actually available in the year it had just skipped.
  stages = stagesFor(j.stages, currentYear().age);
  const n = st.runs.length + 1;
  // The run carries a copy of the plan, not a reference to it. A student who
  // edits their subjects in NOW next week must not silently rewrite the story
  // they already played, and the compare screen has to hold two combinations
  // at once for the comparison to mean anything.
  run = createRun(stages[0].age, `Story ${n}`, want, st.plan);
  picked = []; justResolved = null;
  setLiveRun(run);
}

/** Name and offered levels per subject, so a raise cannot invent a level. */
function subjectMeta(data) {
  const all = (data.subjects && data.subjects.subjects) || [];
  return Object.fromEntries(all.map((x) => [x.id, { name: x.shortName || x.name, levels: x.levels || [] }]));
}

/** The subjects in a plan, as data rows, in subject list order. */
function planRows(data, plan) {
  const all = (data.subjects && data.subjects.subjects) || [];
  return all.filter((s) => plan && plan[s.id]).map((s) => ({ ...s, level: plan[s.id] }));
}

function subjectChips(rows, max) {
  const shown = max ? rows.slice(0, max) : rows;
  const rest = rows.length - shown.length;
  return shown
    .map((s) => `<span class="subjchip">${esc(s.shortName || s.name)}<b class="lv lv-${s.level.toLowerCase()}">${esc(s.level)}</b></span>`)
    .join('') + (rest > 0 ? `<span class="subjchip more">and ${rest} more</span>` : '');
}

/**
 * The picker lives in the sheet rather than on the page. Thirty one subject
 * names and ninety level chips would be the loudest thing in the mode and
 * would bury the one question the intro is actually asking. It writes to the
 * same plan Mode NOW uses, so picking here fills that in too.
 */
function openPicker(data, trigger) {
  const jc = data.copy.journey;
  const groups = data.subjects.groups || [];
  const all = data.subjects.subjects || [];

  const paint = () => {
    const plan = getState().plan;
    const body = groups.map((g) => {
      const rows = all.filter((s) => s.group === g.id);
      if (!rows.length) return '';
      return `
        <div class="pk-group">
          <p class="caps">${esc(g.label)}</p>
          ${rows.map((s) => `
            <div class="pk-row">
              <span class="pk-name">${esc(s.shortName || s.name)}</span>
              <span class="pk-lv">
                ${(s.levels || []).map((lv) => `
                  <button type="button" class="lvchip lv-${lv.toLowerCase()} ${plan[s.id] === lv ? 'on' : ''}"
                    data-action="pklv" data-id="${esc(s.id)}" data-lv="${lv}" data-name="${esc(s.shortName || s.name)}"
                    aria-pressed="${plan[s.id] === lv}">${lv}</button>`).join('')}
              </span>
            </div>`).join('')}
        </div>`;
    }).join('');
    const n = Object.keys(plan).length;
    return `
      <h2 id="sheet-title">${esc(jc.comboPick)}</h2>
      <p class="small mute">${esc(jc.comboSheet)}</p>
      <div class="picker">${body}</div>
      <div class="btn-row" style="margin-top:var(--s-4)">
        <button class="btn accent" type="button" data-action="pkdone">${esc(jc.comboDone)}${n ? ` (${n})` : ''}</button>
      </div>`;
  };

  const host = openSheet(paint(), trigger);
  onSheetAction({
    pklv: (btn) => {
      const { id, lv, name } = btn.dataset;
      const cur = getState().plan[id];
      setSubjectLevel(id, cur === lv ? null : lv, name);
      host.innerHTML = paint();
    },
    pkdone: () => { closeSheet(); rerender(); },
  });
}

// --------------------------------------------------------------------------
// Screens

function introScreen(host, data, st) {
  const jc = data.copy.journey;
  const wants = data.journey.wants || [];
  const rows = planRows(data, st.plan);
  const hasPlan = rows.length > 0;

  // Combination first, want second. The order matters: the combination is a
  // fact about this year and the want is a guess about ten years out, and
  // asking for the guess first makes the fact feel like a consequence of it.
  //
  // Neither one gates the other. Mode NOW renders a full screen from an empty
  // plan, because an unset combination closes nothing, so a student can arrive
  // here having seen counters and destinations without ever setting a level.
  // Gating the wants behind the combination meant that student got a near empty
  // screen whose only live control sent them back to the mode they just left:
  // a loop with no exit that reads as the tap having done nothing. The run
  // engine has always tolerated an empty plan (see line ~682), so the gate was
  // never load bearing. The combination sits above as a refinement you can take
  // or leave, and the wants are always live.

  const comboBlock = `
    <div class="combobox">
      <p class="caps">${esc(jc.comboHead)}</p>
      ${hasPlan ? `
        <p class="chips subjchips">${subjectChips(rows)}</p>
        <div class="btn-row" style="margin-top:var(--s-3)">
          <button class="btn ghost small" type="button" data-action="pick">${esc(jc.comboChange)}</button>
        </div>` : `
        <p class="lede" style="margin:var(--s-2) 0">${esc(jc.comboPrompt)}</p>
        <div class="btn-row">
          <button class="btn accent" type="button" data-action="pick">${esc(jc.comboPick)}</button>
        </div>`}
      <p class="micro mute" style="margin-top:var(--s-3)">${esc(jc.comboNote)}</p>
    </div>`;

  const runsList = st.runs.length ? `
    <div class="section">
      <p class="caps">${esc(jc.pickTwo)}</p>
      <div class="chipsel">
        ${st.runs.map((r, i) => `
          <button type="button" class="chip-btn" data-action="pickrun" data-i="${i}"
            aria-pressed="${compareSel.includes(i)}">${esc(r.label)}${r.pathLabel ? ` · ${esc(r.pathLabel)}` : ''}</button>`).join('')}
      </div>
      ${compareSel.length === 2 ? `<button class="btn" type="button" data-action="compare" style="margin-top:var(--s-3)">${esc(jc.compareCta)}</button>` : ''}
    </div>` : '';

  host.innerHTML = `
    <div class="wrap">
      <div class="section fade-up" style="margin-top:var(--s-6)">
        <p class="caps">Journey</p>
        <h1 class="serif" style="font-size:var(--t-hero);line-height:var(--lh-hero)" tabindex="-1">Play it forward.</h1>
        <p class="lede" style="max-width:40ch;margin-top:var(--s-3)">Pick what you do each year, from now to 48. Life happens in between. No choice ends your story.</p>
        ${comboBlock}
        <div class="wantbox">
          <p class="caps rail-q">${icon('q_where')}${esc(jc.q2)}</p>
          <p class="want-q">${esc(jc.wantPrompt)}</p>
          <p class="micro mute">${esc(hasPlan ? jc.wantHint : jc.comboGate)}</p>
          <div class="grid two" style="margin-top:var(--s-3)">
            ${wants.map((w) => `
              <button class="future-btn" type="button" data-action="want" data-id="${w.id}">
                <span class="want" style="font-size:1rem">${esc(w.label)}</span>
                ${w.kind ? `<span class="kind-chip">${esc(w.kind)}</span>` : ''}
              </button>`).join('')}
          </div>
          <p class="micro mute" style="margin-top:var(--s-2)">${esc(jc.kindsNote)}</p>
        </div>
        ${runsList}
        ${st.runs.length ? `<button class="btn ghost small" type="button" data-action="clearruns" style="margin-top:var(--s-4)">Clear stories</button>` : ''}
      </div>
    </div>`;
  focusH1(host);
  bindGlossary(host);
  onAction(host, {
    pick: (btn) => openPicker(data, btn),
    want: (btn) => {
      const w = (data.journey.wants || []).find((x) => x.id === btn.dataset.id);
      startRun(data, w && w.id !== 'unsure' ? { id: w.id, label: w.label, riasec: w.riasec, kind: w.kind } : null);
      rerender();
    },
    pickrun: (btn) => {
      const i = Number(btn.dataset.i);
      compareSel = compareSel.includes(i) ? compareSel.filter((x) => x !== i) : [...compareSel, i].slice(-2);
      rerender();
    },
    compare: () => showDiff(host, data, compareSel.map((i) => st.runs[i])),
    clearruns: () => { clearRuns(); compareSel = []; rerender(); },
  });
}

function shell(inner, rail) {
  return `
    <div class="wrap">
      <div class="journey-grid">
        <div class="j-scene fade-up">${inner}</div>
        <aside class="j-rail" aria-label="What you are carrying">${rail}</aside>
      </div>
    </div>`;
}

function turnScreen(host, stage, data) {
  const jc = data.copy.journey;
  const pool = visibleChoices(stage, run, MV(data));
  const spent = picked.reduce((n, i) => n + (pool[i].cost || 1), 0);
  const left = POINTS_PER_TURN - spent;
  const prev = lastStory();

  const choices = pool.map((c, i) => {
    const on = picked.includes(i);
    const cost = c.cost || 1;
    const disabledByBudget = !on && cost > left;
    // A choice that points the way your want points is marked, never pushed:
    // the mark is information about fit, and picking against it is a choice
    // the story respects like any other.
    const near = run.want && run.want.riasec && wantAffinity(c, run.want.riasec) >= 2;
    return `
      <button class="choice sel ${on ? 'on' : ''} ${c.isMove ? 'mv' : ''}" type="button" data-action="pick" data-i="${i}"
              aria-pressed="${on}" ${disabledByBudget ? 'data-dim="true"' : ''}>
        <span class="c-cost" aria-label="${cost} point${cost > 1 ? 's' : ''}">${'●'.repeat(cost)}</span>
        <span class="c-label">${c.isMove ? icon(c.ic) : ''}${esc(c.label)}</span>
        <span class="c-chips">${c.isMove ? `<span class="mv-tag">${esc(jc.moveTag)}</span>` : ''}${gainChips(c)}${near ? `<span class="near-chip">${esc(jc.nearWant)}</span>` : ''}${on ? `<span class="undo-chip">${esc(jc.removeHint)}</span>` : ''}</span>
      </button>`;
  }).join('');

  // The turn used to commit itself the moment the points were spent, so a
  // 2 point choice jumped to the next screen while a 1 point choice sat
  // waiting, and the confirm button in this template could never render.
  // Two behaviours for one gesture reads as broken. Now every turn ends the
  // same way: pick, then one button, and the first turn says the rule.
  host.innerHTML = shell(`
    ${turnMeta(stage)}
    <p class="lede j-sit">${situation(data, stage)}</p>
    ${run.stepIndex === 0 ? `<div class="panel tight" style="margin-top:var(--s-3)"><p class="small" style="margin:0">${esc(jc.turnHint)}</p></div>` : ''}
    <div class="pointsrow" role="status">
      <span class="caps">${esc(jc.points)}</span>
      <span class="pts" aria-label="${left} of ${POINTS_PER_TURN} points left">${'●'.repeat(left)}${'○'.repeat(spent)}</span>
    </div>
    <div class="grid j-choices" role="group" aria-label="Your choices">${choices}</div>
    <div class="btn-row" style="margin-top:var(--s-4)">
      ${picked.length ? `<button class="btn accent" type="button" data-action="live">${esc(jc.liveIt)}</button>` : ''}
      ${picked.length && left > 0 ? `<span class="small mute" style="align-self:center">${esc(jc.leftHint)}</span>` : ''}
    </div>
    ${prev}`, rail(data));

  focusH1(host);
  bindGlossary(host);
  onAction(host, {
    pick: (btn) => {
      const i = Number(btn.dataset.i);
      const cost = (pool[i].cost || 1);
      if (picked.includes(i)) picked = picked.filter((x) => x !== i);
      else if (cost <= left) picked = [...picked, i];
      // A big choice tapped without the points for it takes over the turn
      // instead of dead clicking: the tap means "this one", so honour it.
      else picked = [i];
      rerender();
    },
    live: () => commit(data),
  });
}

function commit(data) {
  if (!picked.length) return;
  const stage = currentStage(run, stages);
  // Capture the chosen rows and the before state now: applyChoices advances
  // the run, and the lived screen has to speak about the year that was, not
  // the year that is next.
  const pool = visibleChoices(stage, run, MV(data));
  const chosen = picked.map((i) => pool[i]).filter(Boolean);
  const before = snapshot();
  applyChoices(run, stage, picked, data.chances.cards, subjectMeta(data), MV(data));
  justLived = { age: stage.age, chosen, delta: delta(before) };
  announce(`Age ${stage.age} lived.`);
  picked = [];
  setLiveRun(run);
  rerender();
}

function forkScreen(host, stage, data) {
  const pool = visibleChoices(stage, run, MV(data));
  host.innerHTML = `
    <div class="wrap">
      <div class="fork fade-up">
        ${turnMeta(stage)}
        <p class="lede j-sit" style="max-width:44ch">${situation(data, stage)}</p>
        <div class="fork-choices" role="group" aria-label="Your choice">
          ${pool.map((c, i) => `
            <button class="choice fork-c" type="button" data-action="fork" data-i="${i}">
              <span class="c-label">${esc(c.label)}</span>
              <span class="c-chips">${gainChips(c)}</span>
            </button>`).join('')}
        </div>
      </div>
    </div>`;
  focusH1(host);
  bindGlossary(host);
  onAction(host, {
    fork: (btn) => {
      const i = Number(btn.dataset.i);
      const chosen = [pool[i]].filter(Boolean);
      const before = snapshot();
      applyChoices(run, stage, [i], data.chances.cards, subjectMeta(data), MV(data));
      justLived = { age: stage.age, chosen, delta: delta(before) };
      announce(`Chosen. Age ${stage.age}.`);
      setLiveRun(run);
      rerender();
    },
  });
}

function reflectScreen(host, stage, data) {
  const r = data.journey.reflection;
  const jc = data.copy.journey;
  // The want re-check. A goal named at fifteen is allowed to be wrong at
  // thirty eight; ECG treats revising it as progress, not failure, so the
  // game does too. The original is kept so the ending can tell both halves.
  const wants = (data.journey.wants || []).filter((w) => w.id !== 'unsure' && w.id !== (run.want && run.want.id));
  const wantCheck = `
    <div class="wantcheck" data-ref="wantblock">
      <p class="small">${esc(run.want
        ? fill(jc.stillTrue, { age: run.startAge, want: run.want.label })
        : fill(jc.stillTrueNone, { age: run.startAge }))} <strong>${esc(jc.stillTrueAsk)}</strong></p>
      <div class="btn-row" style="margin-top:var(--s-2)">
        ${run.want ? `<button class="btn ghost small" type="button" data-action="keepwant">${esc(jc.keepWant)}</button>` : ''}
        <button class="btn ghost small" type="button" data-action="changewant">${esc(run.want ? jc.changeWant : jc.nameWant)}</button>
      </div>
    </div>`;
  host.innerHTML = `
    <div class="wrap">
      <div class="reflect fade-up">
        ${turnMeta(stage)}
        <p class="lede j-sit">${esc(stage.situation)}</p>
        <p class="caps" style="margin-top:var(--s-4)">${esc(jc.ikigaiReflect)}</p>
        ${ikigaiPanel(run, jc, true)}
        ${wantCheck}
        <h2 class="serif" style="margin-top:var(--s-4)">${esc(r.prompt)}</h2>
        <div class="btn-row" style="margin-top:var(--s-4)">
          ${r.options.map((o) => `<button class="btn ghost" type="button" data-action="rpick" data-t="${esc(o)}">${esc(o)}</button>`).join('')}
        </div>
        <label class="rfree">
          <span class="sr-only">Or write your own</span>
          <input type="text" maxlength="140" placeholder="Or write your own" data-ref="rtext">
        </label>
        <p class="micro mute">${esc(r.hint)}</p>
        <div class="btn-row" style="margin-top:var(--s-3)">
          <button class="btn" type="button" data-action="rgo">${esc(data.copy.journey.continue)}</button>
        </div>
      </div>
    </div>`;
  focusH1(host);
  const block = () => host.querySelector('[data-ref="wantblock"]');
  onAction(host, {
    rpick: (btn) => { const inp = host.querySelector('[data-ref="rtext"]'); if (inp) inp.value = btn.dataset.t; },
    keepwant: () => { const b = block(); if (b) b.innerHTML = `<p class="small mute">${esc(run.want.label)}. Kept.</p>`; },
    changewant: () => {
      const b = block(); if (!b) return;
      b.innerHTML = `
        <p class="small"><strong>${esc(jc.q2)}</strong></p>
        <div class="btn-row" style="margin-top:var(--s-2)">
          ${wants.map((w) => `<button class="btn ghost small" type="button" data-action="wantset" data-id="${esc(w.id)}">${esc(w.label)}</button>`).join('')}
        </div>`;
    },
    wantset: (btn) => {
      const w = (data.journey.wants || []).find((x) => x.id === btn.dataset.id);
      if (!w) return;
      if (run.wantWas === undefined) run.wantWas = run.want;
      run.want = { id: w.id, label: w.label, riasec: w.riasec, kind: w.kind };
      setLiveRun(run);
      const b = block(); if (b) b.innerHTML = `<p class="small mute">Now: ${esc(w.label)}.</p>`;
    },
    rgo: () => {
      const inp = host.querySelector('[data-ref="rtext"]');
      applyReflection(run, stage, inp ? inp.value : '');
      setLiveRun(run);
      rerender();
    },
  });
}

function chanceAsk(host, card, data) {
  const jc = data.copy.journey;
  const kind = card.type === 'setback' ? 'Something goes wrong' : card.type === 'encounter' ? 'Someone turns up' : 'A chance appears';
  const asks = card.asks ? `
    <p class="askline">${esc(fill(jc.asks, {
      disp: dispLabel(card.asks.disposition),
      have: `${run.disp[card.asks.disposition] || 0} of ${card.asks.min}`,
    }))}</p>` : '';
  const met = askMet(run, card);

  host.innerHTML = shell(`
    <div class="chance ${card.type === 'setback' ? 'setback' : ''}">
      <span class="ch-mark" aria-hidden="true">${icon(`ch_${card.type}`)}</span>
      <p class="kind">${icon(`ch_${card.type}`)}${esc(kind)}</p>
      <h1 class="serif" tabindex="-1" style="margin:var(--s-2) 0 var(--s-3)">${esc(card.title)}</h1>
      <p>${decorate(card.body)}</p>
      ${asks}
      <div class="grid" role="group" aria-label="How you respond" style="margin-top:var(--s-4)">
        ${(card.responses || []).map((r, i) => `
          <button class="choice resp" type="button" data-action="respond" data-i="${i}">
            <span class="c-label">${esc(r.label)}</span>
            ${r.needsAsk ? `<span class="c-note">${esc(met ? jc.metChip : jc.stretchChip)}</span>` : ''}
          </button>`).join('')}
      </div>
      ${card.type === 'setback' && card.onwardMoves ? `
        <details style="margin-top:var(--s-3)"><summary class="small mute">What you can do from here</summary>
        <ul class="small">${card.onwardMoves.map((m) => `<li>${decorate(m)}</li>`).join('')}</ul></details>` : ''}
    </div>`, rail(data));

  focusH1(host);
  bindGlossary(host);
  onAction(host, {
    respond: (btn) => {
      const r = (card.responses || [])[Number(btn.dataset.i)];
      const before = snapshot();
      respondToChance(run, card, Number(btn.dataset.i));
      // Taking the demanding response is a mastery experience, which is where
      // self efficacy actually comes from, so the outcome screen says so.
      justResolved = { card, delta: delta(before), step: run.steps[run.steps.length - 1], stretch: !!(r && r.needsAsk) };
      setLiveRun(run);
      rerender();
    },
  });
}

// The five dispositions are Krumboltz's planned happenstance skills, and the
// identity words are how the rail answers "Who am I?" without showing a chart.
const DISP_WORD = { curiosity: 'curious', persistence: 'persistent', flexibility: 'flexible', optimism: 'hopeful', risk: 'bold' };

function idWords(r, jc) {
  const top = Object.entries(r.disp).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 2);
  return top.length ? top.map(([k]) => DISP_WORD[k]).join(' and ') : jc.identityNone.toLowerCase();
}

// --------------------------------------------------------------------------
// Ikigai. The four circles are not a quiz here: they are computed from the
// story as played. The want you named and the appetite you showed are what
// you love. The Can do ledger and the levels you moved are what you are good
// at. Know me, the people who would vouch for you, is the teenage form of
// what the world needs. Doors held and things made are what can pay you.
// Nothing is asked that the run has not already answered.

function ikigaiScores(r) {
  const clamp = (x) => Math.max(0, Math.min(1, x));
  return {
    love: clamp((r.disp.curiosity + r.disp.optimism) / 6 + (r.want ? 0.15 : 0) + Math.min(0.3, (r.aligned || 0) * 0.06)),
    good: clamp(r.ledger.skills / 12 + (r.raises || []).length * 0.15),
    needs: clamp(r.ledger.network / 10),
    pay: clamp((r.doors || []).length / 4 + r.ledger.portfolio / 16),
  };
}

function ikigaiPanel(r, jc, small) {
  const s = ikigaiScores(r);
  const names = { love: jc.ikigaiLove, good: jc.ikigaiGood, needs: jc.ikigaiNeeds, pay: jc.ikigaiPay };
  const op = (v) => (0.12 + v * 0.5).toFixed(2);
  const size = small ? 190 : 300;
  const svg = `
    <svg viewBox="0 0 320 340" width="${size}" role="img"
         aria-label="Four circles: ${Object.entries(s).map(([k, v]) => `${names[k]} ${Math.round(v * 100)} percent`).join(', ')}">
      <g fill="var(--accent)" stroke="var(--rule)" stroke-width="1">
        <circle cx="160" cy="112" r="78" fill-opacity="${op(s.love)}"/>
        <circle cx="218" cy="170" r="78" fill-opacity="${op(s.pay)}"/>
        <circle cx="160" cy="228" r="78" fill-opacity="${op(s.good)}"/>
        <circle cx="102" cy="170" r="78" fill-opacity="${op(s.needs)}"/>
      </g>
      <g font-size="12" fill="var(--ink-soft)" text-anchor="middle" font-family="inherit">
        <text x="160" y="24">${esc(names.love)}</text>
        <text x="272" y="170" transform="rotate(90 272 170)">${esc(names.pay)}</text>
        <text x="160" y="326">${esc(names.good)}</text>
        <text x="48" y="170" transform="rotate(-90 48 170)">${esc(names.needs)}</text>
      </g>
    </svg>`;
  if (small) return `<div class="ikigai">${svg}</div>`;
  const ranked = Object.entries(s).sort((a, b) => b[1] - a[1]);
  const line = fill(jc.ikigaiLine, {
    a: names[ranked[0][0]].toLowerCase(),
    b: names[ranked[ranked.length - 1][0]].toLowerCase(),
  });
  return `
    <div class="ikigai">
      ${svg}
      <p class="small">${esc(line)}</p>
      <p class="micro mute">${esc(jc.ikigaiNote)}</p>
    </div>`;
}

// Holland's hexagon has real opposites: Realistic across from Social,
// Investigative from Enterprising, Artistic from Conventional. The replay
// nudge uses them, so "try the opposite kind of life" is the hexagon
// speaking, not a shuffle.
const RIASEC_OPPOSITE = { R: 'S', S: 'R', I: 'E', E: 'I', A: 'C', C: 'A' };

function contrastWant(data, r) {
  if (!r.want) return null;
  // Resolve the letter from data by id, not from the run: a run saved before
  // the wants carried types still deserves the nudge.
  const wants = data.journey.wants || [];
  const played = wants.find((w) => w.id === r.want.id);
  const letter = r.want.riasec || (played && played.riasec);
  if (!letter) return null;
  return wants.find((w) => w.riasec === RIASEC_OPPOSITE[letter]) || null;
}

/** The hand of moves, from data. */
const MV = (data) => (data.moves && data.moves.moves) || [];

/** The RIASEC kind behind a want id, in the student word. Codes stay off stage. */
function wantKind(id) {
  const w = DATA && (DATA.journey.wants || []).find((x) => x.id === id);
  return w && w.kind ? w.kind : '';
}

/** A run's want as a story: what was named, and what it became if it moved. */
function wantStory(r) {
  const label = (w) => (w ? w.label : 'Not sure yet');
  const changed = r.wantWas !== undefined && (r.wantWas ? r.wantWas.id : null) !== (r.want ? r.want.id : null);
  return changed ? `${esc(label(r.wantWas))}, then ${esc(label(r.want))}` : esc(label(r.want));
}

/**
 * The ECG question a stage leans on. The three run through every year, but
 * each screen leads with one: early turns are about noticing who you are,
 * forks are the moments you choose a direction, and the long middle is the
 * work of getting there.
 */
function stageQuestion(stage, jc) {
  const f = stage.format || 'turn';
  if (f === 'fork') return { ic: 'q_where', label: jc.q2 };
  if (f === 'reflect') return { ic: 'q_who', label: jc.q1 };
  return stage.age <= 16 ? { ic: 'q_who', label: jc.q1 } : { ic: 'q_how', label: jc.q3 };
}

/**
 * The beat that was missing. Every choice carries an authored outcome
 * sentence, and it used to surface only in the small print of the next turn
 * and the ending. Committing a year now shows what that year did to you
 * before the next one starts, the same way a chance card resolves.
 */
function livedScreen(host, data) {
  const jc = data.copy.journey;
  const { age, chosen, delta: d } = justLived;
  const grew = [...new Set(chosen.flatMap((c) => Object.keys(c.disp || {})))].map((k) => DISP_WORD[k]);
  const becoming = grew.length ? fill(jc.becoming, { words: grew.slice(0, 2).join(' and ') }) : '';
  host.innerHTML = shell(`
    <div class="chance-out lived">
      <p class="lived-age serif" aria-hidden="true">${age}</p>
      <p class="caps">${esc(fill(jc.livedHead, { age }))}</p>
      ${chosen.map((c) => `
        <div class="lived-row">
          <p class="lived-choice serif">${c.isMove ? icon(c.ic) : ''}${esc(c.label)}</p>
          ${c.isMove && c.body ? `<p class="small mute">${esc(c.body)}</p>` : ''}
          ${c.outcome ? `<p class="lede">${decorate(c.outcome)}</p>` : ''}
          ${c.isMove && c.check ? `<p class="micro mute">${esc(c.check)}</p>` : ''}
        </div>`).join('')}
      ${d.length ? `<p class="delta">${d.map((x) => `<span class="dchip pop">${icon(x.ic)}${esc(x.text)}</span>`).join('')}</p>` : ''}
      ${becoming ? `<p class="small mute" style="margin-top:var(--s-3)">${esc(becoming)}</p>` : ''}
      <div class="btn-row" style="margin-top:var(--s-4)">
        <button class="btn accent" type="button" data-action="go">${esc(jc.continue)}</button>
      </div>
    </div>`, rail(data));
  announce([fill(jc.livedHead, { age }), ...chosen.map((c) => c.outcome).filter(Boolean)].join(' '));
  focusH1(host);
  bindGlossary(host);
  onAction(host, { go: () => { justLived = null; rerender(); } });
}

function chanceOutcome(host, data) {
  const jc = data.copy.journey;
  const { step, delta: d } = justResolved;
  const ch = step.chance || {};
  host.innerHTML = shell(`
    <div class="chance-out">
      <p class="caps">${esc(ch.title || '')}</p>
      <h1 class="serif" tabindex="-1" style="font-size:var(--t-h2)">${esc(ch.response || '')}</h1>
      <p class="lede" style="margin-top:var(--s-3)">${decorate(ch.text || '')}</p>
      ${d.length ? `<p class="delta">${d.map((x) => `<span class="dchip pop">${icon(x.ic)}${esc(x.text)}</span>`).join('')}</p>` : ''}
      ${justResolved.stretch ? `<p class="small mute" style="margin-top:var(--s-3)">${esc(jc.efficacyLine)}</p>` : ''}
      <div class="btn-row" style="margin-top:var(--s-4)">
        <button class="btn" type="button" data-action="go">${esc(jc.continue)}</button>
      </div>
    </div>`, rail(data));
  announce([ch.response, ...d.map((x) => x.text)].filter(Boolean).join('. '));
  focusH1(host);
  bindGlossary(host);
  onAction(host, { go: () => { justResolved = null; rerender(); } });
}

function endingScreen(host, data, st) {
  const jc = data.copy.journey;
  const contrast = contrastWant(data, run);
  const wantChanged = run.wantWas !== undefined
    && (run.wantWas ? run.wantWas.id : null) !== (run.want ? run.want.id : null);
  const wantLine = wantChanged && run.want
    ? fill(jc.endWantChanged, { age: run.startAge, was: run.wantWas ? run.wantWas.label : 'not sure', want: run.want.label })
    : run.want
      ? fill(jc.endWant, { age: run.startAge, want: run.want.label })
      : fill(jc.endWantUnsure, { age: run.startAge });
  const pathLine = run.pathLabel ? fill(jc.endPath, { path: run.pathLabel }) : '';
  const moments = (run.moments || []).map((m) => `
    <p><strong>Age ${m.age}.</strong> ${decorate([m.outcome, m.chance ? m.chance.text : ''].filter(Boolean).join(' '))}</p>`).join('');
  const story = (data.stories.typicalPaths || [])[lcgPick(run.seed, (data.stories.typicalPaths || []).length)];

  host.innerHTML = `
    <div class="wrap">
      <div class="section fade-up" style="margin-top:var(--s-6)">
        <p class="caps">Your story</p>
        <h1 class="serif" tabindex="-1" style="font-size:var(--t-hero);line-height:var(--lh-hero)">${esc(wantLine)}</h1>
        ${pathLine ? `<p class="lede">${esc(pathLine)}</p>` : ''}
        <div class="panel" style="margin-top:var(--s-5)">${moments || '<p>You lived it steadily, which is a way of living it.</p>'}</div>
        <div class="section">
          <p class="caps">${esc(jc.becameHead)}</p>
          <p class="idwords serif">${esc(idWords(run, jc))}</p>
        </div>
        <div class="section">
          <p class="caps">${esc(jc.ikigaiHead)}</p>
          ${ikigaiPanel(run, jc)}
        </div>
        <div class="section">
          <p class="caps">${esc(jc.doorsHead)}</p>
          <p class="chips doorchips">${run.doors.map((d) => `<span>${icon(d)}${esc((DOORS[d] || {}).label || d)}</span>`).join('') || '<span class="mute">The next turn opens some.</span>'}</p>
        </div>
        ${(run.movesMade || []).length ? `
          <div class="section">
            <p class="caps">${esc(jc.movesYouMade)}</p>
            <ul class="small raised">${run.movesMade.map((mm) => {
              const m = ((data.moves && data.moves.moves) || []).find((x) => x.id === mm.id);
              return m ? `<li>${icon(m.ic)} ${esc(m.label)}, at ${mm.age}.</li>` : '';
            }).join('')}</ul>
          </div>` : ''}
        ${(run.raises || []).length ? `
          <div class="section">
            <p class="caps">${esc(jc.raisedHead)}</p>
            <ul class="small raised">${run.raises.map((r) => `
              <li>${esc(r.name)}, ${esc(r.from)} to ${esc(r.to)}, at ${r.age}.</li>`).join('')}</ul>
          </div>` : ''}
        ${planRows(data, run.plan).length ? `
          <div class="section">
            <p class="caps">${esc(jc.comboRail)}</p>
            <p class="chips subjchips">${subjectChips(planRows(data, run.plan))}</p>
            <p class="micro mute">${esc(jc.comboNote)}</p>
          </div>` : ''}
        ${run.reflection ? `<p class="small mute" style="margin-top:var(--s-4)">At 38 you wrote: ${esc(run.reflection)}</p>` : ''}
        ${story ? storyCard(story) : ''}
        <div class="panel" style="margin-top:var(--s-6);border:2px solid var(--accent)">
          <h2>${esc(jc.playAgain)}</h2>
          <p class="small mute">Same start. A different want, or different years.</p>
          ${contrast ? `
            <p class="small" style="margin-top:var(--s-3)">${esc(fill(jc.tryContrast, { a: run.want.kind || wantKind(run.want.id) }))}</p>
            <div class="btn-row" style="margin-top:var(--s-2)">
              <button class="btn" type="button" data-action="againas">${esc(contrast.label)} <span class="kind-chip">${esc(contrast.kind)}</span></button>
            </div>` : ''}
          <div class="btn-row" style="margin-top:var(--s-3)">
            <button class="btn accent" type="button" data-action="again">${esc(jc.playAgain)}</button>
            ${st.runs.length >= 2 ? `<button class="btn" type="button" data-action="compare2">${esc(jc.compareCta)}</button>` : ''}
            <button class="btn ghost" type="button" data-action="tonow">${esc(jc.seeInNow)}</button>
            <button class="btn ghost" type="button" data-action="done">Back</button>
          </div>
        </div>
      </div>
    </div>`;
  focusH1(host);
  bindGlossary(host);
  onAction(host, {
    again: () => { run = null; rerender(); },
    againas: () => {
      if (!contrast) return;
      startRun(data, { id: contrast.id, label: contrast.label, riasec: contrast.riasec, kind: contrast.kind });
      rerender();
    },
    compare2: () => showDiff(host, data, st.runs.slice(-2)),
    // The loop closes here: the combination you just played forward is the one
    // sitting in NOW, where you can see what it currently reaches.
    tonow: () => { run = null; setMode('now'); },
    done: () => { run = null; rerender(); },
  });
}

function showDiff(host, data, pair) {
  const [a, b] = pair;
  if (!a || !b) return;
  const jc = data.copy.journey;
  const d = diffRuns(a, b);

  const rows = d.rows.map((r) => `
    <div class="diff-age">${r.age}</div>
    <div class="diff-cell ${r.differs ? 'differs' : ''}">${r.a ? esc(r.a.choices.join(' + ')) : '<span class="faint">·</span>'}</div>
    <div class="diff-cell ${r.differs ? 'differs' : ''}">${r.b ? esc(r.b.choices.join(' + ')) : '<span class="faint">·</span>'}</div>`).join('');

  const doorName = (id) => (DOORS[id] || {}).label || id;

  host.innerHTML = `
    <div class="wrap">
      <div class="section fade-up" style="margin-top:var(--s-6)">
        <p class="caps">${esc(jc.compareCta)}</p>
        <h1 class="serif" tabindex="-1" style="font-size:var(--t-h1)">Same start. ${d.rows.filter((r) => r.differs).length} different years.</h1>
        <div class="diff" style="margin-top:var(--s-5)">
          <div></div>
          <div class="diff-head">${esc(a.label)}${d.paths[0] ? ` · ${esc(d.paths[0])}` : ''}</div>
          <div class="diff-head">${esc(b.label)}${d.paths[1] ? ` · ${esc(d.paths[1])}` : ''}</div>
          <div></div>
          <div class="diff-want">${wantStory(a)}${a.want && wantKind(a.want.id) ? ` <span class="kind-chip">${esc(wantKind(a.want.id))}</span>` : ''}<span class="small mute" style="display:block">became ${esc(idWords(a, jc))}</span></div>
          <div class="diff-want">${wantStory(b)}${b.want && wantKind(b.want.id) ? ` <span class="kind-chip">${esc(wantKind(b.want.id))}</span>` : ''}<span class="small mute" style="display:block">became ${esc(idWords(b, jc))}</span></div>
          <div></div>
          <div class="diff-combo">${subjectChips(planRows(data, d.plans[0]), 4) || '<span class="faint">·</span>'}</div>
          <div class="diff-combo">${subjectChips(planRows(data, d.plans[1]), 4) || '<span class="faint">·</span>'}</div>
          ${rows}
        </div>
        <div class="section">
          <p class="caps">${esc(jc.sharedDoors)}</p>
          <p class="chips doorchips">${d.shared.map((x) => `<span>${icon(x)}${esc(doorName(x))}</span>`).join('') || '<span class="mute">·</span>'}</p>
          ${d.onlyA.length ? `<p class="small mute">${esc(a.label)} also holds: ${d.onlyA.map(doorName).map(esc).join(', ')}</p>` : ''}
          ${d.onlyB.length ? `<p class="small mute">${esc(b.label)} also holds: ${d.onlyB.map(doorName).map(esc).join(', ')}</p>` : ''}
        </div>
        <div class="section">
          <p class="caps">${esc(jc.ikigaiCompareHead)}</p>
          <div class="grid two iki-pair">
            <div><p class="small mute">${esc(a.label)}</p>${ikigaiPanel(a, jc, true)}</div>
            <div><p class="small mute">${esc(b.label)}</p>${ikigaiPanel(b, jc, true)}</div>
          </div>
        </div>
        ${d.reflections.some(Boolean) ? `
          <div class="section"><p class="caps">At 38 you wrote</p>
          <div class="grid two">
            <p class="small">${esc(d.reflections[0] || '·')}</p>
            <p class="small">${esc(d.reflections[1] || '·')}</p>
          </div></div>` : ''}
        <div class="diff-verdict">
          <h2>${esc(jc.verdictHead)}</h2>
          <p style="margin-bottom:0">${esc(d.sameCombination ? jc.verdict : jc.verdictCombo)}</p>
        </div>
        <div class="btn-row" style="margin-top:var(--s-5)">
          <button class="btn ghost" type="button" data-action="back">Back</button>
        </div>
      </div>
    </div>`;
  window.scrollTo(0, 0);
  focusH1(host);
  onAction(host, { back: () => rerender() });
}

// --------------------------------------------------------------------------
// Pieces

function turnMeta(stage) {
  const n = run.stepIndex + 1;
  const label = run.pathLabel ? `<span class="pathchip">${esc(run.pathLabel)}</span>` : '';
  const want = run.want ? `<span class="wantline">${esc(run.want.label)}</span>` : '';
  const sq = DATA ? stageQuestion(stage, DATA.copy.journey) : null;
  const q = sq ? `<span class="qchip">${icon(sq.ic)}${esc(sq.label)}</span>` : '';
  const strip = `<span class="lifestrip" role="img" aria-label="Year ${n} of ${stages.length}">${stages.map((s, i) =>
    `<i class="${i < run.stepIndex ? 'on' : ''}${i === run.stepIndex ? ' now' : ''}"></i>`).join('')}</span>`;
  return `
    <p class="turn-meta caps">Step ${n} of ${stages.length} ${strip} ${label} ${want}</p>
    <div class="turn-head"><span class="turn-age" aria-hidden="true">${stage.age}</span>
      <h1 class="serif" tabindex="-1">${esc(stage.title)}</h1>${q}</div>`;
}

/**
 * The rail is the compass: the three ECG questions, answered live from the
 * run. Who you are is the dispositions and what you have built. Where you
 * are going is the want. How you get there is the doors you hold and the
 * subjects you carry. Same data as before, now grouped by the questions a
 * counsellor would actually ask.
 */
function rail(data) {
  const jc = data.copy.journey;
  const bars = ['skills', 'network', 'portfolio'].map((k) => {
    const lab = { skills: 'Can do', network: 'Know me', portfolio: 'Made' }[k];
    const pct = Math.round((run.ledger[k] / 24) * 100);
    return `<div class="disp-row"><span>${icon(`t_${k}`)}${lab}</span>
      <span class="disp-track" role="img" aria-label="${lab}, ${run.ledger[k]} of 24"><span class="disp-fill" style="width:${pct}%"></span></span><span></span></div>`;
  }).join('');
  const dbars = Object.entries(run.disp).map(([k, v]) => {
    const max = Math.max(4, ...Object.values(run.disp));
    return `<div class="disp-row"><span>${icon(k)}${esc(dispLabel(k))}</span>
      <span class="disp-track" role="img" aria-label="${esc(dispLabel(k))}, ${v}"><span class="disp-fill" style="width:${Math.round((v / max) * 100)}%"></span></span><span></span></div>`;
  }).join('');
  const combo = planRows(data, run.plan);
  return `
    <p class="caps rail-q">${icon('q_who')}${esc(jc.q1)}</p>
    <p class="idwords serif">${esc(idWords(run, jc))}</p>
    <div class="disp-bars">${bars}</div>
    <details style="margin-top:var(--s-2)"><summary class="small mute">${esc(jc.carryHead)}</summary>
      <div class="disp-bars" style="margin-top:var(--s-2)">${dbars}</div></details>

    <p class="caps rail-q" style="margin-top:var(--s-4)">${icon('q_where')}${esc(jc.q2)}</p>
    <p class="small">${run.want
      ? `${esc(run.want.label)}${wantKind(run.want.id) ? ` <span class="kind-chip">${esc(wantKind(run.want.id))}</span>` : ''}`
      : `<span class="mute">${esc(jc.railWhereNone)}</span>`}</p>

    <p class="caps rail-q" style="margin-top:var(--s-4)">${icon('q_how')}${esc(jc.q3)}</p>
    <p class="chips doorchips">${run.doors.map((d) => `<span>${icon(d)}${esc((DOORS[d] || {}).label || d)}</span>`).join('') || '<span class="mute small">No doors yet. They come.</span>'}</p>
    ${combo.length ? `<p class="chips subjchips" style="margin-top:var(--s-2)">${subjectChips(combo, 6)}</p>` : ''}
    ${storySoFar(data)}
    <button class="btn ghost small" type="button" data-action="restart" style="margin-top:var(--s-5)">${esc(jc.startOver)}</button>`;
}

function storySoFar(data) {
  if (!run.steps.length) return '';
  const items = run.steps.slice(-3).reverse().map((s) => `
    <li><strong>${s.age}</strong> ${esc(s.choices.join(' + ') || s.title)}</li>`).join('');
  return `
    <details style="margin-top:var(--s-3)"><summary class="small mute">${esc(data.copy.journey.storyHead)}</summary>
      <ul class="small j-log">${items}</ul></details>`;
}

function lastStory() {
  const last = run.steps[run.steps.length - 1];
  if (!last) return '';
  return `
    <div class="card j-prev">
      <p class="caps">Last year</p>
      <p class="small" style="margin:0"><strong>Age ${last.age}.</strong> ${decorate(last.outcome)}${last.chance ? ` ${decorate(last.chance.text)}` : ''}</p>
    </div>`;
}

function gainChips(c) {
  const chips = [];
  Object.entries(c.gain || {}).forEach(([k, v]) => {
    const lab = { skills: 'Can do', network: 'Know me', portfolio: 'Made' }[k];
    if (lab && v > 0) chips.push({ ic: `t_${k}`, text: lab });
  });
  Object.entries(c.disp || {}).forEach(([k, v]) => { if (v > 0) chips.push({ ic: k, text: `+ ${dispLabel(k)}` }); });
  // The icon names which door, the words do not. A student sees that something
  // specific opens without being told what before they have chosen it.
  if (c.opens) chips.push({ ic: c.opens, text: 'opens a door' });
  return chips.slice(0, 3)
    .map((x) => `<span class="gchip">${icon(x.ic)}${esc(x.text)}</span>`).join('');
}

function snapshot() {
  return { doors: [...run.doors], disp: { ...run.disp }, ledger: { ...run.ledger } };
}
/** Returns [{ ic, text }]. Announced as text, rendered with the icon. */
function delta(before) {
  const out = [];
  run.doors.filter((d) => !before.doors.includes(d))
    .forEach((d) => out.push({ ic: d, text: `Door: ${(DOORS[d] || {}).label || d}` }));
  Object.keys(run.disp).forEach((k) => {
    const g = run.disp[k] - (before.disp[k] || 0);
    if (g > 0) out.push({ ic: k, text: `+${g} ${dispLabel(k)}` });
  });
  Object.keys(run.ledger).forEach((k) => {
    const g = run.ledger[k] - (before.ledger[k] || 0);
    const lab = { skills: 'Can do', network: 'Know me', portfolio: 'Made' }[k];
    if (g > 0) out.push({ ic: `t_${k}`, text: `+${g} ${lab}` });
  });
  return out;
}

function storyCard(s) {
  return `
    <article class="story" data-kind="typical" style="margin-top:var(--s-5)">
      <span class="kindmark">◇ a pattern, not a person</span>
      <h3>${esc(s.label)}</h3>
      <p class="small">${decorate(s.body)}</p>
    </article>`;
}

function dispLabel(k) {
  return { curiosity: 'Curiosity', persistence: 'Persistence', flexibility: 'Flexibility', optimism: 'Optimism', risk: 'Risk taking' }[k] || k;
}

function fill(tpl, vars) {
  return String(tpl || '').replace(/\{(\w+)\}/g, (_, k) => (vars[k] == null ? '' : vars[k]));
}

/**
 * Name up to three of the student's own subjects, preferring the ones they
 * chose over the ones everybody takes. A stage that says "you take Chemistry,
 * Art and Computing" is the cheapest possible proof that the game is being
 * played by this student rather than at them.
 */
function subjectsPhrase(data, r) {
  const rows = planRows(data, r.plan);
  const chosen = rows.filter((s) => !s.compulsory);
  const use = (chosen.length ? chosen : rows).slice(0, 3).map((s) => s.shortName || s.name);
  if (!use.length) return 'a combination you have not set yet';
  if (use.length === 1) return use[0];
  return `${use.slice(0, -1).join(', ')} and ${use[use.length - 1]}`;
}

/** Situation text, with the student's own subjects folded in where authored. */
function situation(data, stage) {
  return decorate(fill(stage.situation, { subjects: subjectsPhrase(data, run) }));
}

function focusH1(host) {
  const h = host.querySelector('h1[tabindex="-1"]');
  if (h) h.focus({ preventScroll: false });
}

let liveEl = null;
function announce(text) {
  if (!liveEl) {
    liveEl = document.createElement('p');
    liveEl.className = 'sr-only';
    liveEl.setAttribute('aria-live', 'polite');
    liveEl.setAttribute('aria-atomic', 'true');
    document.body.appendChild(liveEl);
  }
  liveEl.textContent = text;
}

function lcgPick(seed, n) {
  if (!n) return 0;
  let x = (seed * 1103515245 + 12345) & 0x7fffffff;
  return Math.abs(x) % n;
}

function structuredCloneSafe(obj) {
  try { return structuredClone(obj); } catch { return JSON.parse(JSON.stringify(obj)); }
}
