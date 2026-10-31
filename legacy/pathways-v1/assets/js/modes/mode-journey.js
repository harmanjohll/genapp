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
  respondToChance, askMet, finish, diffRuns, wantAffinity,
  pointsFor, dealHand, playAsk, HAND_LIMIT, ASKS_PER_YEAR,
  loadOf, loadBand, grantYield,
} from '../engine/journey.js';
import { getState, saveRun, clearRuns, setLiveRun, currentYear, setSubjectLevel, setMode } from '../state.js';

let PATHS = {};
let DOORS = {};
let run = null;
let stages = [];
let picked = [];            // selected choice indices this turn
let pickedAsks = [];        // ask ids staged this turn, spent on Live this year
let justResolved = null;    // chance outcome awaiting Continue
let justLived = null;       // the year just committed, awaiting Continue
let restartArmed = false;   // first tap arms, second tap clears the run
let staleNote = null;       // set when the live run's start no longer matches NOW
let lastYear = null;        // the run as it stood before the current year, for undo
let compareSel = [];        // run indices picked for comparison
let rerender = () => {};
let DATA = null;

export function renderJourney(host, data, ctx, repaint) {
  // Before anything replaces the DOM, note where the student is standing and
  // what they are touching. See settle() at the foot of this file.
  markPlace(host);
  rerender = repaint;
  DATA = data;
  PATHS = Object.fromEntries((data.journey.paths || []).map((p) => [p.id, p]));
  DOORS = data.journey.doorsCatalog || {};
  const st = getState();
  const j = data.journey;

  if (!run && st.liveRun) {
    run = st.liveRun;
    stages = stagesFor(j.stages, run.startAge);
    // A short run must resume short, or a refresh silently signs the student
    // up for nine more years they never chose.
    if (run.short) stages = stages.filter((x) => x.age <= SHORT_END);
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

  staleNote = staleCheck(data, st);
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
  run = null; picked = []; pickedAsks = []; justResolved = null; justLived = null; lastYear = null;
  // Leaving the mode ends the screen you were on, so coming back is a new
  // screen and starts at the top rather than restoring a scroll from Now.
  lastScreen = null;
  document.body.dataset.journey = 'false';
}

/**
 * How far to play, asked once, at the moment it matters.
 *
 * Fifteen stages is a long game for a thirteen year old with forty five
 * minutes, and a lesson that runs out of clock before the ending never
 * reaches the compare screen, which is the whole point of the mode. A student
 * can stop at eighteen instead: the same engine, the same cards, the same
 * ending, just the school years. Nothing is withheld from the short run, and
 * the long one is not the correct answer.
 */
const SHORT_END = 18;

function startRun(data, want, short) {
  const j = data.journey;
  const st = getState();
  // No clamp. A Sec 1 student plays Sec 1. The old floor of 15 silently aged a
  // thirteen year old forward two years and then offered them, at the stage it
  // called Sec 3, the chance to ask to move a level up: the one thing that was
  // actually available in the year it had just skipped.
  stages = stagesFor(j.stages, currentYear().age);
  if (short) stages = stages.filter((x) => x.age <= SHORT_END);
  const n = st.runs.length + 1;
  // The run carries a copy of the plan, not a reference to it. A student who
  // edits their subjects in NOW next week must not silently rewrite the story
  // they already played, and the compare screen has to hold two combinations
  // at once for the comparison to mean anything.
  run = createRun(stages[0].age, `Story ${n}`, want, st.plan);
  run.short = !!short;
  // Copied for the same reason the plan is: what a student carries this term
  // is part of the story they played, and changing a CCA next month must not
  // rewrite a run they already finished.
  run.activities = [...(st.activities || [])];
  picked = []; justResolved = null; lastYear = null;
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
  settle(host, 'intro');
  bindGlossary(host);
  onAction(host, {
    pick: (btn) => openPicker(data, btn),
    want: (btn) => {
      const w = (data.journey.wants || []).find((x) => x.id === btn.dataset.id);
      const want = w && w.id !== 'unsure' ? { id: w.id, label: w.label, riasec: w.riasec, kind: w.kind } : null;
      openStartSheet(data, want, btn);
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
  const { points: PTS, reasons } = pointsFor(run, stage, data);
  const spent = picked.reduce((n, i) => n + (pool[i].cost || 1), 0);
  const left = PTS - spent;
  dealHand(run, MV(data), stage.age);
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
        <span class="c-chips">${c.isMove ? `<span class="mv-tag">${esc(jc.commitTag)}</span>` : ''}${gainChips(c)}${near ? `<span class="near-chip">${esc(jc.nearWant)}</span>` : ''}${on ? `<span class="undo-chip">${esc(jc.removeHint)}</span>` : ''}</span>
      </button>`;
  }).join('');

  // The turn used to commit itself the moment the points were spent, so a
  // 2 point choice jumped to the next screen while a 1 point choice sat
  // waiting, and the confirm button in this template could never render.
  // Two behaviours for one gesture reads as broken. Now every turn ends the
  // same way: pick, then one button, and the first turn says the rule.
  host.innerHTML = shell(`
    ${staleBanner(data)}
    ${turnMeta(stage)}
    <p class="lede j-sit">${situation(data, stage)}</p>
    ${run.stepIndex === 0 ? `<div class="panel tight" style="margin-top:var(--s-3)"><p class="small" style="margin:0">${esc(jc.turnHint)}</p></div>` : ''}
    <div class="pointsrow" role="status">
      <span class="caps">${esc(jc.points)}</span>
      <span class="pts" aria-label="${left} of ${PTS} points left">${'●'.repeat(Math.max(0, left))}${'○'.repeat(spent)}</span>
      <span class="pts-why">${esc(pointsWhy(jc, PTS, reasons))}</span>
    </div>
    <div class="grid j-choices" role="group" aria-label="Your choices">${choices}</div>
    ${yearSummary(data, stage, pool)}
    <div class="btn-row" style="margin-top:var(--s-4)">
      ${(picked.length || pickedAsks.length) ? `<button class="btn accent" type="button" data-action="live">${esc(jc.liveIt)}</button>` : ''}
      ${picked.length && left > 0 ? `<span class="small mute" style="align-self:center">${esc(jc.leftHint)}</span>` : ''}
    </div>
    ${prev}`, rail(data, stage));

  settle(host, `turn:${run.stepIndex}`);
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
    stalekeep: () => {
      run.staleAck = `${JSON.stringify(getState().plan || {})}|${currentYear().age}`;
      setLiveRun(run);
      staleNote = null;
      rerender();
    },
    stalefresh: () => { setLiveRun(null); resetJourney(); rerender(); },
    // An ask is staged, never fired on the spot. Tapping one used to end the
    // year immediately, which is the same mistake the choice grid used to make
    // and it was worse here: a tap on a panel at the side of the screen threw
    // the student into the next year before they had finished deciding this
    // one. The year is decided as a whole and lived on one button.
    ask: (btn) => {
      const id = btn.dataset.id;
      if (pickedAsks.includes(id)) pickedAsks = pickedAsks.filter((x) => x !== id);
      else if (pickedAsks.length < ASKS_PER_YEAR - (run.asksThisYear || 0)) pickedAsks = [...pickedAsks, id];
      rerender();
    },
  });
}

/**
 * A run keeps the subjects and the year it began with, on purpose: a story you
 * already played must stay true when you edit your plan next week. The cost is
 * that the two can silently diverge, and silence is the worst of the options.
 * A student who set Sec 1 subjects, played a story, then switched to Sec 3 and
 * rebuilt their combination was left with a Sec 1 story wearing a Sec 3 label
 * and no explanation. So the run says what it is playing and offers the two
 * honest choices: keep this story, or start one from the subjects you have now.
 * Nothing is auto destroyed, because a story in progress is twenty minutes of
 * somebody's thinking.
 */
function staleCheck(data, st) {
  if (!run || run.done) return null;
  const same = JSON.stringify(run.plan || {}) === JSON.stringify(st.plan || {});
  const yearAge = currentYear().age;
  const sameYear = run.startAge === yearAge;
  if (same && sameYear) return null;
  // Keeping the story is a decision, and a decision that has to be re-made on
  // every repaint is not one. It is remembered against the exact state that
  // prompted it, so a later, different change asks again.
  const sig = `${JSON.stringify(st.plan || {})}|${yearAge}`;
  if (run.staleAck === sig) return null;
  const rows = planRows(data, run.plan);
  return {
    subjects: !same,
    year: !sameYear,
    oldLabel: rows.length ? subjectChips(rows, 4) : data.copy.journey.comboNone,
    oldAge: run.startAge,
    newAge: yearAge,
  };
}

function staleBanner(data) {
  if (!staleNote) return '';
  const jc = data.copy.journey;
  const lines = [];
  if (staleNote.subjects) lines.push(fill(jc.staleBody, { old: 'subjects' }));
  if (staleNote.year) lines.push(fill(jc.staleYear, { old: staleNote.oldAge, new: staleNote.newAge }));
  return `
    <div class="stalebar">
      <p class="caps">${esc(jc.staleHead)}</p>
      <p class="small">${lines.map(esc).join(' ')}</p>
      ${staleNote.subjects ? `<p class="chips subjchips">${staleNote.oldLabel}</p>` : ''}
      <div class="btn-row" style="margin-top:var(--s-3)">
        <button class="btn ghost small" type="button" data-action="stalekeep">${esc(jc.staleKeep)}</button>
        <button class="btn accent small" type="button" data-action="stalefresh">${esc(jc.staleFresh)}</button>
      </div>
    </div>`;
}

/**
 * What this year adds up to, before you live it. The three questions are the
 * frame: what you do is how you get there, who you ask is part of who you are
 * becoming, and both are read against where you said you were going. A year is
 * decided as a whole, so the whole is shown before the button.
 */
function yearSummary(data, stage, pool) {
  const jc = data.copy.journey;
  if (!picked.length && !pickedAsks.length) return '';
  const doing = picked.map((i) => pool[i]).filter(Boolean).map((c) => c.label);
  const asking = pickedAsks.map((id) => (MV(data).find((m) => m.id === id) || {}).label).filter(Boolean);
  return `
    <div class="yearsum">
      <p class="caps">${esc(fill(jc.yearHead, { age: stage.age }))}</p>
      ${doing.length ? `<p class="small"><b>${esc(jc.yearDoing)}</b> ${esc(doing.join('. '))}.</p>` : ''}
      ${asking.length ? `<p class="small"><b>${esc(jc.yearAsking)}</b> ${esc(asking.join('. '))}.</p>` : ''}
      <p class="micro mute">${esc(run.want ? fill(jc.yearWant, { want: run.want.label }) : jc.yearNoWant)}</p>
    </div>`;
}

/** Why this year has the points it has, in the student's words. */
function pointsWhy(jc, n, reasons) {
  const map = {
    full: jc.whyFull, light: jc.whyLight, cca: jc.whyCca, freer: jc.whyFreer,
    week: jc.whyWeek, room: jc.whyRoom,
  };
  const why = reasons.length ? reasons.map((r) => map[r.k]).filter(Boolean).join(' ') : jc.whyPlain;
  return fill(jc.pointsWhy, { n, why });
}

/**
 * The hand of superpowers, above the year's choices and visibly not part of
 * them. Asking costs courage, not hours, so these are free and sit outside the
 * points economy entirely. One a year, and playing one draws another.
 */
function handStrip(data, stage) {
  const jc = data.copy.journey;
  const held = (run.hand || []).map((id) => MV(data).find((m) => m.id === id)).filter(Boolean);
  const usedUp = (run.asksThisYear || 0) >= ASKS_PER_YEAR;
  const leftN = ASKS_PER_YEAR - (run.asksThisYear || 0);
  if (!held.length && !usedUp) return '';
  return `
    <div class="hand">
      <p class="caps">${icon('d_people')}${esc(jc.handHead)} <span class="hand-count">${held.length}/${HAND_LIMIT}</span></p>
      <p class="micro mute">${esc(usedUp ? jc.handUsed : fill(jc.handLeft, { n: leftN }))}</p>
      ${held.length ? `<div class="handcol">
        ${held.map((m) => {
          const on = pickedAsks.includes(m.id);
          const full = !on && pickedAsks.length >= (ASKS_PER_YEAR - (run.asksThisYear || 0));
          return `
          <button class="askcard ${on ? 'on' : ''}" type="button" data-action="ask" data-id="${esc(m.id)}"
                  aria-pressed="${on}" ${full ? 'data-dim="true"' : ''}>
            <span class="ac-ic">${icon(m.ic)}</span>
            <span class="ac-label">${esc(m.label)}</span>
            ${on ? `<span class="undo-chip">${esc(jc.removeHint)}</span>` : ''}
          </button>`;
        }).join('')}
      </div>` : `<p class="small mute">${esc(jc.handEmpty)}</p>`}
      <p class="micro mute" style="margin-top:var(--s-2)">${esc(jc.handRule)}</p>
    </div>`;
}

function commit(data) {
  if (!picked.length && !pickedAsks.length) return;
  const stage = currentStage(run, stages);
  // Capture the chosen rows and the before state now: applyChoices advances
  // the run, and the lived screen has to speak about the year that was, not
  // the year that is next.
  const pool = visibleChoices(stage, run, MV(data));
  const chosen = picked.map((i) => pool[i]).filter(Boolean);
  const before = snapshot();
  // The whole run as it stood before this year. A mis-tap used to cost the
  // student the entire story, because Start over was the only way back, and a
  // game about trying things cannot punish a slip of the thumb.
  lastYear = structuredCloneSafe(run);
  // The week pays in before anything is spent. A CCA played twice a week for
  // four years builds something in every one of those weeks whether or not a
  // turn was spent on it, and a game that only counted the turns would tell
  // the busiest students their week was worth nothing.
  const paid = grantYield(run, data, stage.age);
  const weekRows = paid ? [{
    label: data.copy.journey.weekPaid,
    outcome: fill(data.copy.journey.weekPaidNote, { what: carriedPhrase(data) }),
    isMove: false,
  }] : [];
  // Asks first, so a door one opens is already held when the year resolves.
  const askRows = [];
  pickedAsks.forEach((id) => {
    const m = MV(data).find((x) => x.id === id);
    if (m && playAsk(run, m, stage.age, MV(data))) {
      askRows.push({ label: m.label, outcome: m.outcome, body: m.body, check: m.check, ic: m.ic, isMove: true, gain: m.gain, disp: m.disp || {} });
    }
  });
  if (picked.length) applyChoices(run, stage, picked, data.chances.cards, subjectMeta(data), MV(data));
  else { run.asksThisYear = 0; run.stepIndex += 1; }
  justLived = { age: stage.age, chosen: [...chosen, ...askRows, ...weekRows], delta: delta(before) };
  announce(`Age ${stage.age} lived.`);
  picked = []; pickedAsks = [];
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
  settle(host, `fork:${run.stepIndex}`);
  bindGlossary(host);
  onAction(host, {
    fork: (btn) => {
      const i = Number(btn.dataset.i);
      const chosen = [pool[i]].filter(Boolean);
      const before = snapshot();
      // A fork is still a year lived, so the week pays into it too.
      const paid = grantYield(run, data, stage.age);
      const weekRows = paid ? [{
        label: data.copy.journey.weekPaid,
        outcome: fill(data.copy.journey.weekPaidNote, { what: carriedPhrase(data) }),
        isMove: false,
      }] : [];
      applyChoices(run, stage, [i], data.chances.cards, subjectMeta(data), MV(data));
      justLived = { age: stage.age, chosen: [...chosen, ...weekRows], delta: delta(before) };
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
  settle(host, `reflect:${run.stepIndex}`);
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

  settle(host, `chance:${card.id}`);
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

/**
 * Between naming a want and playing, two things the student needs: how a turn
 * works, and how long they are signing up for. Three lines and a choice, once,
 * in the sheet, rather than a wall of rules on the intro that nobody reads and
 * nobody can find again.
 */
function openStartSheet(data, want, trigger) {
  const jc = data.copy.journey;
  openSheet(`
    <h2 id="sheet-title">${esc(jc.tourHead)}</h2>
    <ol class="small tourlist">
      <li>${esc(jc.tour1)}</li>
      <li>${esc(jc.tour2)}</li>
      <li>${esc(jc.tour3)}</li>
    </ol>
    <p class="caps" style="margin-top:var(--s-5)">${esc(jc.runPick)}</p>
    <div class="runpick">
      <button class="btn accent" type="button" data-action="golong">${esc(jc.runLong)}</button>
      <p class="micro mute">${esc(jc.runLongNote)}</p>
      <button class="btn ghost" type="button" data-action="goshort" style="margin-top:var(--s-3)">${esc(jc.runShort)}</button>
      <p class="micro mute">${esc(jc.runShortNote)}</p>
    </div>`, trigger);
  onSheetAction({
    golong: () => { closeSheet(); startRun(data, want, false); rerender(); },
    goshort: () => { closeSheet(); startRun(data, want, true); rerender(); },
  });
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
      <h1 class="caps" tabindex="-1" style="margin:0">${esc(fill(jc.livedHead, { age }))}</h1>
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
        ${lastYear ? `<button class="btn ghost small" type="button" data-action="undoyear">${esc(jc.undoYear)}</button>` : ''}
      </div>
      ${lastYear ? `<p class="micro mute">${esc(jc.undoNote)}</p>` : ''}
    </div>`, rail(data));
  announce([fill(jc.livedHead, { age }), ...chosen.map((c) => c.outcome).filter(Boolean)].join(' '));
  settle(host, `lived:${run.stepIndex}`);
  bindGlossary(host);
  onAction(host, {
    go: () => { justLived = null; lastYear = null; rerender(); },
    undoyear: () => {
      if (!lastYear) return;
      run = lastYear; lastYear = null;
      justLived = null; picked = []; pickedAsks = [];
      setLiveRun(run);
      announce('That year is back the way it was.');
      rerender();
    },
  });
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
  settle(host, `outcome:${run.stepIndex}`);
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
  settle(host, 'ending');
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
  settle(host, 'diff');
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
function rail(data, stage) {
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
    ${stage ? handStrip(data, stage) : ''}
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

/** The run's own activities, named, so the week reads as theirs and not a stat. */
function carriedPhrase(data) {
  const all = (data.activities && data.activities.activities) || [];
  // Mid sentence, so the label's leading capital comes off. Every label in
  // activities.json starts with an ordinary word, never a name.
  const use = (run.activities || []).map((id) => all.find((a) => a.id === id))
    .filter(Boolean).map((a) => a.label.charAt(0).toLowerCase() + a.label.slice(1)).slice(0, 2);
  if (!use.length) return 'what you carry';
  if (use.length === 1) return use[0];
  return `${use[0]} and ${use[1]}`;
}

/** Situation text, with the student's own subjects folded in where authored. */
function situation(data, stage) {
  return decorate(fill(stage.situation, { subjects: subjectsPhrase(data, run) }));
}

// --- keeping your place ---------------------------------------------------
//
// Every screen here paints by replacing the mode's whole innerHTML, and the
// old code then moved focus to the heading. On a genuinely new screen that is
// right, and required: a screen reader has to be told the page changed.
//
// On a repaint of the screen you are already standing on it is wrong twice
// over. Staging a choice, staging an ask, or untapping either one rebuilds the
// same turn, and focusing the heading scrolls it back into view. A student who
// had scrolled down to reach the choices was thrown to the top of the page on
// every single tap, and lost the control they had just pressed along with it.
// The turn screen is the one place in the app where you tap several times
// before anything advances, so it took the whole of the damage.
//
// So a paint now says which screen it is. A different screen goes to the top
// and announces the heading, exactly as before. The same screen keeps the
// scroll where the student put it and puts focus back on the control they
// pressed, found again by what it does rather than by identity, since the
// element itself no longer exists.

let lastScreen = null;
let keep = null;   // { y, sel }, captured before the DOM is replaced

function attrEsc(v) {
  return String(v).replace(/["\\]/g, '\\$&');
}

/** Called at the top of a paint, while the outgoing DOM is still standing. */
function markPlace(host) {
  const a = document.activeElement;
  let sel = null;
  if (a && host && host.contains(a) && a.dataset && a.dataset.action) {
    const bits = [`[data-action="${attrEsc(a.dataset.action)}"]`];
    // data-id and data-i are what tell two otherwise identical controls apart.
    ['id', 'i'].forEach((k) => {
      if (a.dataset[k] !== undefined) bits.push(`[data-${k}="${attrEsc(a.dataset[k])}"]`);
    });
    sel = bits.join('');
  }
  keep = { y: window.scrollY, sel };
}

function settle(host, key) {
  const same = key !== null && key === lastScreen;
  lastScreen = key;
  if (!same) {
    window.scrollTo(0, 0);
    focusH1(host);
    return;
  }
  const y = keep ? keep.y : window.scrollY;
  let target = null;
  if (keep && keep.sel) { try { target = host.querySelector(keep.sel); } catch { target = null; } }
  window.scrollTo(0, y);
  // The control can legitimately be gone: the Live button appears only once
  // something is staged, and disappears again when the last thing is untapped.
  // Focus falls back to the heading so a keyboard user is never left on body,
  // but quietly, without dragging the page along with it.
  if (!target) {
    const h = host.querySelector('h1[tabindex="-1"]');
    if (h) h.focus({ preventScroll: true });
    return;
  }
  // The page is held where the student left it and the layout reflows around
  // it, which is what a disclosure opening anywhere else on the web does.
  // Holding the tapped control still instead was tried and is worse: the
  // summary that appears when you stage something is feedback about the tap,
  // and pinning the control pushes that feedback off the top of the screen.
  target.focus({ preventScroll: true });
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
