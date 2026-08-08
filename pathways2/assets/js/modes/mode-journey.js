// Mode PLAY (Journey v4). Live one life forward, then live it again.
//
// The beat structure changed from v3. A year is: decide, then the year's
// chance arrives, then ONE lived screen tells the whole year: what you did,
// what life dealt, what grew, what a door opening sounds like, and the one
// line for the road not taken. One Continue per year, not two.
//
// The screen sets the era: the paper cools as the decades pass, and nothing
// semantic ever changes hue with it.

import { esc, onAction } from '../components/dom.js';
import { icon } from '../components/icons.js';
import { decorate, bindGlossary } from '../components/glossary.js';
import { openSheet, onSheetAction, setSheetFoot, close as closeSheet } from '../components/sheet.js';
import { cue } from '../sound.js';
import { drawStoryMap, saveStoryCard } from '../components/storymap.js';
import {
  possibilitiesFor, markShown, forkNeed, possibilitiesMissed,
} from '../engine/possible.js';
import {
  createRun, sequenceFor, chapterCount, currentStage, ageAt, answerNS, visibleChoices,
  applyChoices, applyReflection, respondToChance, askMet, finish, diffRuns, CAPACITY_CAP,
  wantAffinity, pointsFor, dealHand, playAsk, HAND_LIMIT, ASKS_PER_YEAR, grantYield,
} from '../engine/journey4.js';
import {
  getState, saveRun, clearRuns, setLiveRun, currentYear, setSubjectLevel,
  setMode, setAim,
} from '../state.js';

let DOORS = {};
let run = null;
let picked = [];
let pickedAsks = [];
let pendingLived = null;   // captured at commit, resolved after the chance
let justLived = null;
let restartArmed = false;
let staleNote = null;
let lastYear = null;
let compareSel = [];
let rerender = () => {};
let DATA = null;

const MV = (data) => (data.moves && data.moves.moves) || [];

export function renderJourney(host, data, ctx, repaint) {
  markPlace(host);
  rerender = repaint;
  DATA = data;
  DOORS = data.journey.doorsCatalog || {};
  const st = getState();
  const j = data.journey;

  if (!run && st.liveRun) run = st.liveRun;

  document.body.dataset.journey = run && !run.done ? 'true' : 'false';

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

  if (!run) { setEra(13); return introScreen(host, data, st); }
  if (run.done) { setEra(49); return endingScreen(host, data, st); }

  const stage = currentStage(j, run);
  if (!stage) {
    finish(run, data);
    saveRun(structuredCloneSafe(run));
    rerender();
    return;
  }

  const age = ageAt(j, run, run.stepIndex);
  setEra(age);
  staleNote = staleCheck(data, st);

  if (justLived) return livedScreen(host, data);
  if (run.pending) {
    const card = data.chances.cards.find((c) => c.id === run.pending.cardId);
    if (card) return chanceAsk(host, card, data);
    run.pending = null; run.stepIndex += 1;
  }

  const fmt = stage.format || 'turn';
  if (fmt === 'ask-ns') return nsScreen(host, stage, data);
  if (fmt === 'reflect') return reflectScreen(host, stage, data);
  if (fmt === 'fork') return forkScreen(host, stage, data, age);
  return turnScreen(host, stage, data, age);
}

export function resetJourney() {
  run = null; picked = []; pickedAsks = []; justLived = null; pendingLived = null; lastYear = null;
  lastScreen = null;
  document.body.dataset.journey = 'false';
  document.body.dataset.era = 'school';
}

function setEra(age) {
  const era = age <= 16 ? 'school' : age <= 21 ? 'postsec' : age <= 29 ? 'twenties' : age <= 39 ? 'thirties' : 'later';
  if (document.body.dataset.era !== era) document.body.dataset.era = era;
}

function startRun(data, want, short, seedCode) {
  const st = getState();
  const n = st.runs.length + 1;
  run = createRun(currentYear().age, `Story ${n}`, want, st.plan);
  run.short = !!short;
  // A class play code seeds the luck, so a room lives the same life and the
  // debrief compares answers instead of dice. It carries nothing else.
  if (seedCode && /^[a-z0-9]{3,8}$/i.test(seedCode.trim())) {
    run.classSeed = seedCode.trim().toUpperCase();
    run.seed = (parseInt(run.classSeed, 36) % 0x7fffffff) || run.seed;
  }
  run.activities = [...(st.activities || [])];
  picked = []; pickedAsks = []; justLived = null; pendingLived = null; lastYear = null;
  setLiveRun(run);
}

function subjectMeta(data) {
  const all = (data.subjects && data.subjects.subjects) || [];
  return Object.fromEntries(all.map((x) => [x.id, { name: x.shortName || x.name, levels: x.levels || [] }]));
}

function planRows(data, plan) {
  const all = (data.subjects && data.subjects.subjects) || [];
  return all.filter((s) => plan && plan[s.id]).map((s) => ({ ...s, level: plan[s.id] }));
}

function subjectChips(rows, max) {
  const shown = max ? rows.slice(0, max) : rows;
  const rest = rows.length - shown.length;
  return shown
    .map((s) => `<span class="subjchip">${esc(s.shortName || s.name)} <b class="lv lv-${s.level.toLowerCase()}">${esc(s.level)}</b></span>`)
    .join('') + (rest > 0 ? `<span class="subjchip more">and ${rest} more</span>` : '');
}

function openPicker(data, trigger) {
  const jc = data.copy.journey;
  const groups = data.subjects.groups || [];
  const all = data.subjects.subjects || [];

  const paint = () => {
    const plan = getState().plan;
    const body = groups.map((g) => {
      const rows = all.filter((s) => s.group === g.id && (s.levels || []).length);
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
    return `
      <h2 id="sheet-title">${esc(jc.comboPick)}</h2>
      <p class="small mute">${esc(jc.comboSheet)}</p>
      <div class="picker">${body}</div>`;
  };

  // The list of subjects is two thousand pixels long on a phone, so the button
  // that accepts the combination is pinned rather than parked at the bottom of
  // it. It also carries the running count, which is the only feedback that a
  // tap landed when the row you tapped has scrolled out of view.
  const footFor = () => {
    const n = Object.keys(getState().plan).length;
    return `<button class="btn accent" type="button" data-action="pkdone">${esc(jc.comboDone)}${n ? ` (${n})` : ''}</button>`;
  };

  const host = openSheet(paint(), trigger, footFor());
  onSheetAction({
    pklv: (btn) => {
      const { id, lv, name } = btn.dataset;
      const cur = getState().plan[id];
      setSubjectLevel(id, cur === lv ? null : lv, name);
      host.innerHTML = paint();
      setSheetFoot(footFor());
    },
    pkdone: () => { closeSheet(); rerender(); },
  });
}

// --------------------------------------------------------------------------
// Screens

function introScreen(host, data, st) {
  const jc = data.copy.journey;
  const wants = data.journey.wants || [];
  // Act stores its answer as a future id, and the ids are shared with this list.
  const known = st.aim ? wants.find((w) => w.id === st.aim && w.id !== 'unsure') : null;
  const rows = planRows(data, st.plan);
  const hasPlan = rows.length > 0;

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
            aria-pressed="${compareSel.includes(i)}">${esc(r.label)}${r.pathLabel ? ` \u00b7 ${esc(r.pathLabel)}` : ''}</button>`).join('')}
      </div>
      ${compareSel.length === 2 ? `<button class="btn" type="button" data-action="compare" style="margin-top:var(--s-3)">${esc(jc.compareCta)}</button>` : ''}
    </div>` : '';

  host.innerHTML = `
    <div class="wrap">
      <div class="section fade-up" style="margin-top:var(--s-6)">
        <p class="caps">Play</p>
        <h1 class="serif" style="font-size:var(--t-hero);line-height:var(--lh-hero)" tabindex="-1">Play it forward.</h1>
        <p class="lede" style="max-width:40ch;margin-top:var(--s-3)">Pick what I do each chapter, from now to 48. Life happens in between. No choice ends my story.</p>
        ${comboBlock}
        <div class="wantbox">
          <p class="caps rail-q">${icon('q_where')}${esc(jc.q2)}</p>
          <p class="want-q">${esc(jc.wantPrompt)}</p>
          <p class="micro mute">${esc(jc.wantHint)}</p>
          ${/* Act asks this same question with the same six kinds. A student
                arriving from there should be shown their answer, not asked it
                again, or the app looks like it was not listening. */ ''}
          ${known ? `
            <div class="wantknown">
              <p class="micro mute">${esc(jc.wantKnown)}</p>
              <button class="future-btn on" type="button" data-action="want" data-id="${known.id}">
                <span class="want" style="font-size:1rem">${esc(known.label)}</span>
                ${known.kind ? `<span class="kind-chip">${esc(known.kind)}</span>` : ''}
                <span class="want-go">${esc(jc.wantKeep)}</span>
              </button>
            </div>
            <p class="caps" style="margin-top:var(--s-4)">${esc(jc.wantOther)}</p>` : ''}
          <div class="grid two" style="margin-top:var(--s-3)">
            ${wants.filter((w) => !known || w.id !== known.id).map((w) => `
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
      // Mark it before the sheet opens. Somebody who dismisses the sheet lands
      // back here, and an unchanged screen reads as a tap that did nothing.
      host.querySelectorAll('.future-btn.on').forEach((b) => b.classList.remove('on'));
      btn.classList.add('on');
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

function openStartSheet(data, want, trigger) {
  const jc = data.copy.journey;
  // The two buttons go in the pinned foot. Everything above them is reading,
  // and the class code is a teacher's tool, so it folds away rather than
  // standing between a student and the start of the game.
  openSheet(`
    <h2 id="sheet-title">${esc(jc.tourHead)}</h2>
    <ol class="small tourlist">
      <li>${esc(jc.tour1)}</li>
      <li>${esc(jc.tour2)}</li>
      <li>${esc(jc.tour3)}</li>
    </ol>
    <p class="small"><strong>${esc(jc.runLong)}</strong> ${esc(jc.runLongNote)}</p>
    <p class="small"><strong>${esc(jc.runShort)}</strong> ${esc(jc.runShortNote)}</p>
    <details class="seedrow">
      <summary class="small">${esc(jc.classSeedLabel)}</summary>
      <input class="seedbox" type="text" maxlength="8" autocapitalize="characters"
             placeholder="${esc(jc.classSeedPlaceholder)}" data-ref="seed" aria-label="${esc(jc.classSeedLabel)}">
      <p class="micro mute">${esc(jc.classSeedHint)}</p>
    </details>`, trigger, `
    <button class="btn accent" type="button" data-action="golong">${esc(jc.runLong)}</button>
    <button class="btn" type="button" data-action="goshort">${esc(jc.runShort)}</button>`);
  const seedVal = () => {
    const el = document.querySelector('dialog.sheet [data-ref="seed"]');
    return el ? el.value : '';
  };
  onSheetAction({
    golong: () => { const s = seedVal(); closeSheet(); startRun(data, want, false, s); rerender(); },
    goshort: () => { const s = seedVal(); closeSheet(); startRun(data, want, true, s); rerender(); },
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

/** Chapter meta: where you are in the whole life, at a glance. */
function chapterMeta(data, stage, age) {
  const jc = data.copy.journey;
  const { n, total } = chapterCount(data.journey, run);
  const label = run.pathLabel ? `<span class="pathchip">${esc(run.pathLabel)}</span>` : '';
  const seedChip = run.classSeed ? `<span class="pathchip seed">${esc(fill(jc.classSeedChip, { code: run.classSeed }))}</span>` : '';
  const want = run.want ? `<span class="wantline">${esc(run.want.label)}</span>` : '';
  const strip = `<span class="lifestrip" role="img" aria-label="${esc(fill(jc.chapterOf, { n, total }))}">${Array.from({ length: total }, (_, i) =>
    `<i class="${i < n - 1 ? 'on' : ''}${i === n - 1 ? ' now' : ''}"></i>`).join('')}</span>`;
  const title = stage.chapter || stage.title;
  return `
    <p class="turn-meta caps">${esc(fill(jc.chapterOf, { n, total }))} ${strip} ${label} ${seedChip} ${want}</p>
    <div class="turn-head"><span class="turn-age" aria-hidden="true">${age}</span>
      <h1 class="serif" tabindex="-1">${esc(title)}</h1></div>`;
}

function turnScreen(host, stage, data, age) {
  const jc = data.copy.journey;
  const pool = visibleChoices(stage, run, MV(data), age);
  const { points: PTS, reasons } = pointsFor(run, stage, data, age);
  const spent = picked.reduce((n, i) => n + (pool[i].cost || 1), 0);
  const left = PTS - spent;
  // The hand deals from the second turn: the first is pure picking, so the
  // systems arrive one at a time.
  const handOpen = run.stepIndex > 0;
  if (handOpen) dealHand(run, MV(data), age);
  const prev = lastStory();

  const choices = pool.map((c, i) => {
    const on = picked.includes(i);
    const cost = c.cost || 1;
    const dim = !on && cost > left;
    const near = run.want && run.want.riasec && wantAffinity(c, run.want.riasec) >= 2;
    return `
      <button class="choice sel ${on ? 'on' : ''} ${c.isMove ? 'mv' : ''} ${c.needsDoor ? 'unlocked' : ''}" type="button" data-action="pick" data-i="${i}"
              aria-pressed="${on}" ${dim ? 'data-dim="true"' : ''}>
        <span class="c-cost" aria-label="${cost} point${cost > 1 ? 's' : ''}">${'\u25cf'.repeat(cost)}</span>
        <span class="c-label">${c.isMove ? icon(c.ic) : ''}${esc(c.label)}</span>
        <span class="c-chips">${c.isMove ? `<span class="mv-tag">${esc(jc.commitTag)}</span>` : ''}${c.needsDoor ? `<span class="door-tag">${icon(c.needsDoor)}${esc(jc.doorTag)}</span>` : ''}${c.capacity && run.capacity < CAPACITY_CAP ? `<span class="grow-tag">${esc(jc.growTag)}</span>` : ''}${gainChips(c)}${near ? `<span class="near-chip">${esc(jc.nearWant)}</span>` : ''}${on ? `<span class="undo-chip">${esc(jc.removeHint)}</span>` : ''}</span>
      </button>`;
  }).join('');

  const wantCheckBlock = stage.wantCheck ? wantCheck(data) : '';

  host.innerHTML = shell(`
    ${staleBanner(data)}
    ${chapterMeta(data, stage, age)}
    <p class="lede j-sit">${situation(data, stage)}</p>
    ${run.stepIndex === 0 ? `<div class="panel tight" style="margin-top:var(--s-3)"><p class="small" style="margin:0">${esc(jc.turnHint)}</p></div>` : ''}
    ${run.stepIndex === 1 ? `<p class="micro mute" style="margin-top:var(--s-2)">${esc(jc.handIntro)}</p>` : ''}
    ${wantCheckBlock}
    <div class="pointsrow" role="status">
      <span class="caps">${esc(jc.points)}</span>
      <span class="pts" aria-label="${left} of ${PTS} points left">${'\u25cf'.repeat(Math.max(0, left))}${'\u25cb'.repeat(spent)}</span>
      <span class="pts-why">${esc(pointsWhy(jc, PTS, reasons))}</span>
    </div>
    <div class="grid j-choices" role="group" aria-label="Your choices">${choices}</div>
    ${possibleBlock(data, age)}
    ${yearSummary(data, stage, pool, age)}
    ${/* Sticky on a phone. Five choices plus the possibilities fold and the
          year summary put this eleven hundred pixels down a six hundred pixel
          window, so a student tapped a choice and saw nothing happen. It only
          appears once there is something to commit, so it is never in the way
          of reading the year. */ ''}
    <div class="btn-row liverow${(picked.length || pickedAsks.length) ? ' armed' : ''}" style="margin-top:var(--s-4)">
      ${(picked.length || pickedAsks.length) ? `<button class="btn accent" type="button" data-action="live">${esc(jc.liveIt)}</button>` : ''}
      ${picked.length && left > 0 ? `<span class="small mute" style="align-self:center">${esc(jc.leftHint)}</span>` : ''}
    </div>
    ${prev}`, rail(data, handOpen ? stage : null, age));

  settle(host, `turn:${run.stepIndex}`);
  bindGlossary(host);
  onAction(host, {
    pick: (btn) => {
      const i = Number(btn.dataset.i);
      const cost = (pool[i].cost || 1);
      if (picked.includes(i)) picked = picked.filter((x) => x !== i);
      else if (cost <= left) picked = [...picked, i];
      else picked = [i];
      rerender();
    },
    live: () => commit(data, age),
    stalekeep: () => {
      run.staleAck = `${JSON.stringify(getState().plan || {})}|${currentYear().age}`;
      setLiveRun(run);
      staleNote = null;
      rerender();
    },
    stalefresh: () => { setLiveRun(null); resetJourney(); rerender(); },
    ask: (btn) => {
      const id = btn.dataset.id;
      if (pickedAsks.includes(id)) pickedAsks = pickedAsks.filter((x) => x !== id);
      else if (pickedAsks.length < ASKS_PER_YEAR - (run.asksThisYear || 0)) pickedAsks = [...pickedAsks, id];
      rerender();
    },
    keepwant: () => { const b = host.querySelector('[data-ref="wantblock"]'); if (b) b.innerHTML = `<p class="small mute">${esc(run.want.label)}. Kept.</p>`; },
    changewant: () => wantChangeUI(host, data),
    wantset: (btn) => wantSet(host, data, btn),
  });
}

/**
 * What is possible from here, folded shut. It sits under the choices because it
 * is not a choice: it is the set of real routes live at this age, with what each
 * asks for. Closed by default, so the turn stays a turn and the first paint
 * budget holds; open once and a student is reading the actual system.
 */
function possibleBlock(data, age) {
  const jc = data.copy.journey;
  const list = possibilitiesFor(data, run, age, 3);
  if (!list.length) return '';
  markShown(run, list);
  const rows = list.map((p) => `
    <li class="poss-row">
      <p class="poss-label">${decorate(p.label)}</p>
      <dl class="poss-dl">
        <dt>${esc(jc.possWhen)}</dt><dd>${decorate(p.when)}</dd>
        <dt>${esc(jc.possNeeds)}</dt><dd>${decorate(p.needs)}</dd>
        <dt>${esc(jc.possLeads)}</dt><dd>${decorate(p.leads)}</dd>
      </dl>
      <p class="poss-truth">${decorate(p.truth)}</p>
    </li>`).join('');
  return `
    <details class="poss">
      <summary>${icon('q_how')}${esc(jc.possHead)}</summary>
      <p class="micro mute" style="margin:var(--s-2) 0 0">${esc(jc.possNote)}</p>
      <ul class="poss-list">${rows}</ul>
    </details>`;
}

/** The mid run want check: a goal named at the start is allowed to move. */
function wantCheck(data) {
  const jc = data.copy.journey;
  return `
    <div class="wantcheck" data-ref="wantblock">
      <p class="small">${esc(run.want
        ? fill(jc.stillTrue, { age: run.startAge, want: run.want.label })
        : fill(jc.stillTrueNone, { age: run.startAge }))} <strong>${esc(jc.stillTrueAsk)}</strong></p>
      <div class="btn-row" style="margin-top:var(--s-2)">
        ${run.want ? `<button class="btn ghost small" type="button" data-action="keepwant">${esc(jc.keepWant)}</button>` : ''}
        <button class="btn ghost small" type="button" data-action="changewant">${esc(run.want ? jc.changeWant : jc.nameWant)}</button>
      </div>
    </div>`;
}

function wantChangeUI(host, data) {
  const jc = data.copy.journey;
  const wants = (data.journey.wants || []).filter((w) => w.id !== 'unsure' && w.id !== (run.want && run.want.id));
  const b = host.querySelector('[data-ref="wantblock"]');
  if (!b) return;
  b.innerHTML = `
    <p class="small"><strong>${esc(jc.q2)}</strong></p>
    <div class="btn-row" style="margin-top:var(--s-2)">
      ${wants.map((w) => `<button class="btn ghost small" type="button" data-action="wantset" data-id="${esc(w.id)}">${esc(w.label)}</button>`).join('')}
    </div>`;
}

function wantSet(host, data, btn) {
  const w = (data.journey.wants || []).find((x) => x.id === btn.dataset.id);
  if (!w) return;
  if (run.wantWas === undefined) run.wantWas = run.want;
  run.want = { id: w.id, label: w.label, riasec: w.riasec, kind: w.kind };
  setLiveRun(run);
  const b = host.querySelector('[data-ref="wantblock"]');
  if (b) b.innerHTML = `<p class="small mute">Now: ${esc(w.label)}.</p>`;
}

function staleCheck(data, st) {
  if (!run || run.done) return null;
  const same = JSON.stringify(run.plan || {}) === JSON.stringify(st.plan || {});
  const yearAge = currentYear().age;
  const sameYear = run.startAge === yearAge;
  if (same && sameYear) return null;
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

function yearSummary(data, stage, pool, age) {
  const jc = data.copy.journey;
  if (!picked.length && !pickedAsks.length) return '';
  const doing = picked.map((i) => pool[i]).filter(Boolean).map((c) => c.label);
  const asking = pickedAsks.map((id) => (MV(data).find((m) => m.id === id) || {}).label).filter(Boolean);
  return `
    <div class="yearsum">
      <p class="caps">${esc(fill(jc.yearHead, { age }))}</p>
      ${doing.length ? `<p class="small"><b>${esc(jc.yearDoing)}</b> ${esc(doing.join('. '))}.</p>` : ''}
      ${asking.length ? `<p class="small"><b>${esc(jc.yearAsking)}</b> ${esc(asking.join('. '))}.</p>` : ''}
      <p class="micro mute">${esc(run.want ? fill(jc.yearWant, { want: run.want.label }) : jc.yearNoWant)}</p>
    </div>`;
}

function pointsWhy(jc, n, reasons) {
  const map = {
    full: jc.whyFull, light: jc.whyLight, cca: jc.whyCca, freer: jc.whyFreer,
    week: jc.whyWeek, room: jc.whyRoom, ns: jc.whyNs,
  };
  const line = (r) => (r.k === 'grown' ? fill(jc.whyGrown, { why: r.why }) : map[r.k]);
  const why = reasons.length ? reasons.map(line).filter(Boolean).join(' ') : jc.whyPlain;
  return fill(jc.pointsWhy, { n, why });
}

function handStrip(data, stage, age) {
  const jc = data.copy.journey;
  const held = (run.hand || []).map((id) => MV(data).find((m) => m.id === id)).filter(Boolean);
  const usedUp = (run.asksThisYear || 0) >= ASKS_PER_YEAR;
  const leftN = ASKS_PER_YEAR - (run.asksThisYear || 0);
  if (!held.length && !usedUp) return '';
  return `
    <div class="hand">
      <p class="caps">${icon('d_people')}${esc(jc.handHead)} <span class="hand-count">${held.length}/${HAND_LIMIT}</span></p>
      <p class="micro mute">${esc(usedUp ? jc.handUsed : fill(jc.handLeft || '{n} left this year.', { n: leftN }))}</p>
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

/**
 * Committing a year. The lived screen waits for the chance to resolve, so a
 * year lands as one beat: choices, the chance, the growth, the missed line.
 */
function commit(data, age) {
  if (!picked.length && !pickedAsks.length) return;
  const j = data.journey;
  const stage = currentStage(j, run);
  const pool = visibleChoices(stage, run, MV(data), age);
  const chosen = picked.map((i) => pool[i]).filter(Boolean);
  const before = snapshot();
  lastYear = structuredCloneSafe(run);

  const paid = grantYield(run, data, age);
  const weekRows = paid ? [{
    label: data.copy.journey.weekPaid,
    outcome: fill(data.copy.journey.weekPaidNote, { what: carriedPhrase(data) }),
    isMove: false,
  }] : [];
  const askRows = [];
  pickedAsks.forEach((id) => {
    const m = MV(data).find((x) => x.id === id);
    if (m && playAsk(run, m, age, MV(data))) {
      askRows.push({ label: m.label, outcome: m.outcome, body: m.body, check: m.check, ic: m.ic, isMove: true, gain: m.gain, disp: m.disp || {} });
    }
  });
  if (picked.length) applyChoices(run, j, stage, picked, data.chances.cards, subjectMeta(data), MV(data));
  else { run.asksThisYear = 0; run.stepIndex += 1; }

  pendingLived = {
    chapter: stage.chapter || stage.title,
    age,
    chosen: [...chosen, ...askRows, ...weekRows],
    before,
  };
  picked = []; pickedAsks = [];

  if (!run.pending) resolveLived(data);
  else cue('chance');
  setLiveRun(run);
  rerender();
}

/** The year's chance resolved (or there was none): build the lived beat. */
function resolveLived(data) {
  const step = run.steps[run.steps.length - 1];
  const d = delta(pendingLived.before);
  justLived = {
    chapter: pendingLived.chapter,
    age: pendingLived.age,
    chosen: pendingLived.chosen,
    chance: step && step.chance ? step.chance : null,
    stretch: !!(step && step.chance && step.chance.met === false),
    missed: step && step.missed ? step.missed : null,
    delta: d,
    doorOpened: d.find((x) => x.door) || null,
  };
  pendingLived = null;
  announce([fill(data.copy.journey.livedHead, { chapter: justLived.chapter }), ...justLived.chosen.map((c) => c.outcome).filter(Boolean)].join(' '));
}

function nsScreen(host, stage, data) {
  const jc = data.copy.journey;
  host.innerHTML = `
    <div class="wrap">
      <div class="ns-ask fade-up">
        <p class="caps">${esc(jc.nsKicker)}</p>
        <h1 class="serif" tabindex="-1" style="font-size:var(--t-h1);max-width:24ch">${esc(stage.chapter)}</h1>
        <p class="lede" style="max-width:52ch">${esc(stage.situation)}</p>
        <div class="ns-choices" role="group" aria-label="Your answer">
          <button class="choice ns-c" type="button" data-action="ns" data-yes="1">${esc(jc.nsYes)}</button>
          <button class="choice ns-c" type="button" data-action="ns" data-yes="">${esc(jc.nsNo)}</button>
        </div>
        <p class="micro mute" style="margin-top:var(--s-3)">${esc(jc.nsNote)}</p>
      </div>
    </div>`;
  settle(host, 'ns-ask');
  onAction(host, {
    ns: (btn) => {
      answerNS(run, !!btn.dataset.yes, stage);
      setLiveRun(run);
      rerender();
    },
  });
}

function forkScreen(host, stage, data, age) {
  const pool = visibleChoices(stage, run, MV(data), age);
  cue('fork');
  host.innerHTML = `
    <div class="wrap">
      <div class="fork fade-up">
        ${chapterMeta(data, stage, age)}
        <p class="lede j-sit" style="max-width:44ch">${situation(data, stage)}</p>
        <div class="fork-choices" role="group" aria-label="Your choice">
          ${pool.map((c, i) => {
            // The biggest decision in the game used to be five unlabelled
            // doors. Each branch now states what it actually asks for, because
            // a fork you cannot cost is not a choice, it is a guess.
            const need = c.opens ? forkNeed(data, c.opens) : '';
            return `
            <button class="choice fork-c ${c.needsDoor ? 'unlocked' : ''}" type="button" data-action="fork" data-i="${i}">
              <span class="c-label">${esc(c.label)}</span>
              ${need ? `<span class="fork-need"><em>${esc(data.copy.journey.possAsks)}</em> ${esc(need)}</span>` : ''}
              <span class="c-chips">${c.needsDoor ? `<span class="door-tag">${icon(c.needsDoor)}${esc(data.copy.journey.doorTag)}</span>` : ''}${gainChips(c)}</span>
            </button>`;
          }).join('')}
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
      lastYear = structuredCloneSafe(run);
      const paid = grantYield(run, data, age);
      const weekRows = paid ? [{
        label: data.copy.journey.weekPaid,
        outcome: fill(data.copy.journey.weekPaidNote, { what: carriedPhrase(data) }),
        isMove: false,
      }] : [];
      applyChoices(run, data.journey, stage, [i], data.chances.cards, subjectMeta(data), MV(data));
      pendingLived = { chapter: stage.chapter || stage.title, age, chosen: [...chosen, ...weekRows], before };
      if (!run.pending) resolveLived(data);
      else cue('chance');
      setLiveRun(run);
      rerender();
    },
  });
}

function reflectScreen(host, stage, data) {
  const r = data.journey.reflection;
  const jc = data.copy.journey;
  const age = ageAt(data.journey, run, run.stepIndex);
  host.innerHTML = `
    <div class="wrap">
      <div class="reflect fade-up">
        ${chapterMeta(data, stage, age)}
        <p class="lede j-sit">${esc(stage.situation)}</p>
        ${wantCheck(data)}
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
          <button class="btn" type="button" data-action="rgo">${esc(jc.continue)}</button>
        </div>
      </div>
    </div>`;
  settle(host, `reflect:${run.stepIndex}`);
  onAction(host, {
    rpick: (btn) => { const inp = host.querySelector('[data-ref="rtext"]'); if (inp) inp.value = btn.dataset.t; },
    keepwant: () => { const b = host.querySelector('[data-ref="wantblock"]'); if (b) b.innerHTML = `<p class="small mute">${esc(run.want.label)}. Kept.</p>`; },
    changewant: () => wantChangeUI(host, data),
    wantset: (btn) => wantSet(host, data, btn),
    rgo: () => {
      const inp = host.querySelector('[data-ref="rtext"]');
      applyReflection(run, data.journey, stage, inp ? inp.value : '');
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
    </div>`, rail(data, null, null));

  settle(host, `chance:${card.id}`);
  bindGlossary(host);
  onAction(host, {
    respond: (btn) => {
      respondToChance(run, card, Number(btn.dataset.i));
      resolveLived(data);
      setLiveRun(run);
      rerender();
    },
  });
}

const DISP_WORD = { curiosity: 'curious', persistence: 'persistent', flexibility: 'flexible', optimism: 'hopeful', risk: 'bold' };

function idWords(r, jc) {
  const top = Object.entries(r.disp).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 2);
  return top.length ? top.map(([k]) => DISP_WORD[k]).join(' and ') : jc.identityNone.toLowerCase();
}

/**
 * The lived screen: the whole year in one beat. If a door opened, the beat
 * opens with it, full width, with the one sound in the app worth hearing.
 */
/**
 * What to say when a student reached past their footing and it half landed.
 *
 * Thirty seven cards now carry an answer that asks for more nerve, miles or
 * curiosity than the run has built, so a bold player meets this about a fifth
 * of the time. One line repeated that often becomes wallpaper, and it also
 * wastes the teachable half: the card knows exactly which quality was short,
 * so the line names it. Never a failure, always the same claim, which is that
 * doing the thing is how the footing gets built.
 *
 * Two phrasings per quality, alternating, because a run that is short on one
 * quality will meet that quality's line several times, and hearing the same
 * sentence four times teaches a student that nobody is reading.
 */
function efficacyLine(data, chance) {
  const jc = data.copy.journey;
  const card = ((data.chances && data.chances.cards) || []).find((c) => c.id === chance.id);
  const disp = card && card.asks && card.asks.disposition;
  if (!disp) return jc.efficacyLine;
  const stem = `efficacy${disp[0].toUpperCase()}${disp.slice(1)}`;
  const alt = run && run.stepIndex % 2 === 1 ? jc[`${stem}2`] : null;
  return alt || jc[stem] || jc.efficacyLine;
}

function livedScreen(host, data) {
  const jc = data.copy.journey;
  const { chapter, age, chosen, chance, stretch, missed, delta: d, doorOpened } = justLived;
  const grew = [...new Set(chosen.flatMap((c) => Object.keys(c.disp || {})))].map((k) => DISP_WORD[k]);
  const becoming = grew.length ? fill(jc.becoming, { words: grew.slice(0, 2).join(' and ') }) : '';
  cue(doorOpened ? 'door' : 'lived');

  host.innerHTML = shell(`
    <div class="chance-out lived">
      ${doorOpened ? `
        <div class="door-open pop">
          <p class="caps">${esc(jc.doorOpened)}</p>
          <p class="door-open-name">${icon(doorOpened.doorId)}${esc(doorOpened.text.replace('Door: ', ''))}</p>
        </div>` : ''}
      <p class="lived-age serif" aria-hidden="true">${age}</p>
      <h1 class="caps" tabindex="-1" style="margin:0">${esc(fill(jc.livedHead, { chapter }))}</h1>
      ${chosen.map((c) => `
        <div class="lived-row">
          <p class="lived-choice serif">${c.isMove ? icon(c.ic) : ''}${esc(c.label)}</p>
          ${c.isMove && c.body ? `<p class="small mute">${esc(c.body)}</p>` : ''}
          ${c.outcome ? `<p class="lede">${decorate(c.outcome)}</p>` : ''}
          ${c.isMove && c.check ? `<p class="micro mute">${esc(c.check)}</p>` : ''}
        </div>`).join('')}
      ${chance ? `
        <div class="lived-chance ${chance.type === 'setback' ? 'setback' : ''}">
          <p class="kind">${icon(`ch_${chance.type}`)}${esc(chance.title)}</p>
          <p class="lived-choice serif">${esc(chance.response)}</p>
          <p class="lede">${decorate(chance.text)}</p>
          ${stretch ? `<p class="small mute">${esc(efficacyLine(data, chance))}</p>` : ''}
        </div>` : ''}
      ${d.length ? `<p class="delta">${d.filter((x) => !x.door).map((x) => `<span class="dchip pop">${icon(x.ic)}${esc(x.text)}</span>`).join('')}</p>` : ''}
      ${missed ? `<p class="meanwhile">${esc(fill(jc.meanwhile, { missed }))}</p>` : ''}
      ${becoming ? `<p class="small mute" style="margin-top:var(--s-3)">${esc(becoming)}</p>` : ''}
      <div class="btn-row" style="margin-top:var(--s-4)">
        <button class="btn accent" type="button" data-action="go">${esc(jc.continue)}</button>
        ${lastYear ? `<button class="btn ghost small" type="button" data-action="undoyear">${esc(jc.undoYear)}</button>` : ''}
      </div>
      ${lastYear ? `<p class="micro mute">${esc(jc.undoNote)}</p>` : ''}
    </div>`, rail(data, null, null));
  settle(host, `lived:${run.stepIndex}`);
  bindGlossary(host);
  onAction(host, {
    go: () => { justLived = null; lastYear = null; rerender(); },
    undoyear: () => {
      if (!lastYear) return;
      run = lastYear; lastYear = null;
      justLived = null; pendingLived = null; picked = []; pickedAsks = [];
      setLiveRun(run);
      announce('That year is back the way it was.');
      rerender();
    },
  });
}

const RIASEC_OPPOSITE = { R: 'S', S: 'R', I: 'E', E: 'I', A: 'C', C: 'A' };

function contrastWant(data, r) {
  if (!r.want) return null;
  const wants = data.journey.wants || [];
  const played = wants.find((w) => w.id === r.want.id);
  const letter = r.want.riasec || (played && played.riasec);
  if (!letter) return null;
  return wants.find((w) => w.riasec === RIASEC_OPPOSITE[letter]) || null;
}

function endingScreen(host, data, st) {
  const jc = data.copy.journey;
  const contrast = contrastWant(data, run);
  const frame = run.ending || {};
  const wantChanged = run.wantWas !== undefined
    && (run.wantWas ? run.wantWas.id : null) !== (run.want ? run.want.id : null);
  const wantLine = wantChanged && run.want
    ? fill(jc.endWantChanged, { age: run.startAge, was: run.wantWas ? run.wantWas.label : 'not sure', want: run.want.label })
    : run.want
      ? fill(jc.endWant, { age: run.startAge, want: run.want.label })
      : fill(jc.endWantUnsure, { age: run.startAge });
  const pathLine = run.pathLabel
    ? fill(jc.endPath, { path: run.pathLabel, ns: run.ns === true ? jc.endNsYes : '' }) : '';
  const moments = (run.moments || []).map((m) => `
    <p><strong>${esc(m.title)}, ${m.age}.</strong> ${decorate([m.outcome, m.chance ? m.chance.text : ''].filter(Boolean).join(' '))}</p>`).join('');
  const tracks = ['skills', 'network', 'portfolio'].map((k) => {
    const lab = { skills: 'Can do', network: 'Know me', portfolio: 'Made' }[k];
    const pct = Math.round((run.ledger[k] / 24) * 100);
    return `<div class="disp-row"><span>${icon(`t_${k}`)}${lab}</span>
      <span class="disp-track" role="img" aria-label="${lab}, ${run.ledger[k]} of 24"><span class="disp-fill" style="width:${pct}%"></span></span><span></span></div>`;
  }).join('');
  const story = (data.stories.typicalPaths || [])[lcgPick(run.seed, (data.stories.typicalPaths || []).length)];
  if (!endedCued.has(run.seed)) { endedCued.add(run.seed); cue('ending'); }

  host.innerHTML = `
    <div class="wrap">
      <div class="section fade-up" style="margin-top:var(--s-6)">
        <p class="caps">${esc(jc.endingHead)}</p>
        <h1 class="serif" tabindex="-1" style="font-size:var(--t-hero);line-height:var(--lh-hero)">${esc(wantLine)}</h1>
        ${pathLine ? `<p class="lede">${esc(pathLine)}</p>` : ''}
        ${frame.head ? `
          <div class="ending-frame">
            <h2 class="serif">${esc(frame.head)}</h2>
            <p class="lede" style="margin-top:var(--s-2)">${decorate(frame.body || '')}</p>
          </div>` : ''}
        <figure class="storymap">
          <figcaption class="caps">${esc(jc.mapHead)}</figcaption>
          <div class="storymap-frame" data-ref="map"></div>
          <p class="micro mute">${esc(jc.mapNote)}</p>
          ${run.reflection ? `
            <label class="mapopt">
              <input type="checkbox" data-action-change="reflectin">
              <span>${esc(jc.mapReflect)}</span>
            </label>` : ''}
        </figure>
        <div class="panel" style="margin-top:var(--s-5)">${moments || '<p>You lived it steadily, which is a way of living it.</p>'}</div>
        <div class="section">
          <p class="caps">${esc(jc.becameHead)}</p>
          <p class="idwords serif">${esc(idWords(run, jc))}</p>
          <div class="disp-bars" style="max-width:420px;margin-top:var(--s-3)">${tracks}</div>
        </div>
        <div class="section">
          <p class="caps">${esc(jc.doorsHead)}</p>
          <p class="chips doorchips">${run.doors.map((d) => `<span>${icon(d)}${esc((DOORS[d] || {}).label || d)}</span>`).join('') || '<span class="mute">The next turn opens some.</span>'}</p>
        </div>
        ${(run.movesMade || []).length ? `
          <div class="section">
            <p class="caps">${esc(jc.movesYouMade)}</p>
            <ul class="small raised">${run.movesMade.map((mm) => {
              const m = MV(data).find((x) => x.id === mm.id);
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
        ${(() => {
          // Not a scolding. A list of routes that were live while this life was
          // being lived, and mostly still are, which is the whole thesis.
          const missed = possibilitiesMissed(data, run, 4);
          if (!missed.length) return '';
          return `
            <div class="section">
              <p class="caps">${esc(jc.possMissedHead)}</p>
              <p class="small mute">${esc(jc.possMissedNote)}</p>
              <ul class="poss-list end">${missed.map((p) => `
                <li class="poss-row">
                  <p class="poss-label">${decorate(p.label)}</p>
                  <p class="small" style="margin:0">${decorate(p.needs)}</p>
                  <p class="poss-truth">${decorate(p.truth)}</p>
                </li>`).join('')}</ul>
            </div>`;
        })()}
        ${run.reflection ? `<p class="small mute" style="margin-top:var(--s-4)">At 38 you wrote: ${esc(run.reflection)}</p>` : ''}
        ${story ? storyCard(story) : ''}
        <div class="panel" style="margin-top:var(--s-6);border:2px solid var(--accent)">
          <h2>${esc(jc.playAgain)}</h2>
          <p class="small mute">Same start. A different want, or different years.</p>
          ${contrast ? `
            <p class="small" style="margin-top:var(--s-3)">${esc(fill(jc.tryContrast, { a: run.want.kind || '' }))}</p>
            <div class="btn-row" style="margin-top:var(--s-2)">
              <button class="btn" type="button" data-action="againas">${esc(contrast.label)} <span class="kind-chip">${esc(contrast.kind)}</span></button>
            </div>` : ''}
          <div class="btn-row" style="margin-top:var(--s-3)">
            <button class="btn accent" type="button" data-action="again">${esc(jc.playAgain)}</button>
            <button class="btn" type="button" data-action="savecard">${esc(jc.cardSave)}</button>
            ${st.runs.length >= 2 ? `<button class="btn" type="button" data-action="compare2">${esc(jc.compareCta)}</button>` : ''}
            <button class="btn ghost" type="button" data-action="toact">${esc(jc.toAct)}</button>
            <button class="btn ghost" type="button" data-action="tonow">${esc(jc.seeInNow)}</button>
          </div>
        </div>
      </div>
    </div>`;
  settle(host, 'ending');
  bindGlossary(host);

  // The map is drawn, on screen, at the ending. The PNG a student saves is the
  // same canvas, so what they share is exactly what they were shown.
  let withReflection = false;
  const mapHost = host.querySelector('[data-ref="map"]');
  const paintMap = () => {
    if (!mapHost) return;
    const cv = drawStoryMap(run, data, { includeReflection: withReflection });
    cv.setAttribute('role', 'img');
    cv.setAttribute('aria-label', jc.mapAlt);
    mapHost.innerHTML = '';
    mapHost.appendChild(cv);
  };
  paintMap();
  const reflectBox = host.querySelector('[data-action-change="reflectin"]');
  if (reflectBox) {
    reflectBox.addEventListener('change', () => { withReflection = reflectBox.checked; paintMap(); });
  }

  onAction(host, {
    savecard: (btn) => {
      saveStoryCard(run, data, { includeReflection: withReflection });
      const old = btn.textContent;
      btn.textContent = jc.cardSaved;
      setTimeout(() => { btn.textContent = old; }, 1600);
    },
    again: () => { run = null; rerender(); },
    againas: () => {
      if (!contrast) return;
      startRun(data, { id: contrast.id, label: contrast.label, riasec: contrast.riasec, kind: contrast.kind });
      rerender();
    },
    compare2: () => showDiff(host, data, st.runs.slice(-2)),
    toact: () => {
      setAim(run.want ? run.want.id : 'unsure');
      run = null;
      setMode('aim');
    },
    tonow: () => { run = null; setMode('now'); },
  });
}

/**
 * Two stories, side by side, aligned on the chapters both lived. The map at
 * the top is the thesis drawn: two lines that part and meet again.
 */
function showDiff(host, data, pair) {
  const [a, b] = pair;
  if (!a || !b) return;
  const jc = data.copy.journey;
  const d = diffRuns(a, b);

  const rows = d.rows.map((r) => `
    <div class="diff-age">${r.age}<span class="diff-ch">${esc(r.title)}</span></div>
    <div class="diff-cell ${r.differs ? 'differs' : ''}">${r.a ? esc(r.a.choices.join(' + ')) : '<span class="faint">\u00b7</span>'}</div>
    <div class="diff-cell ${r.differs ? 'differs' : ''}">${r.b ? esc(r.b.choices.join(' + ')) : '<span class="faint">\u00b7</span>'}</div>`).join('');

  const doorName = (id) => (DOORS[id] || {}).label || id;
  const tail = (t, label) => (t.length ? `
    <div class="diff-tail">
      <p class="caps">${esc(fill(jc.onlyLived, { label }))}</p>
      ${t.map((s) => `<p class="small"><strong>${s.age}</strong> ${esc(s.title)}: ${esc(s.choices.join(' + '))}</p>`).join('')}
    </div>` : '');
  const stopped = [a, b].map((r, i) => (r.short ? `<p class="small mute">${esc(fill(jc.stoppedNote, { label: r.label, age: r.endAge || 18 }))}</p>` : '')).join('');

  const nDiff = d.rows.filter((r) => r.differs).length;
  const map = routeMap(d.rows.length, nDiff, d.tailA.length, d.tailB.length);
  // Two runs that fork apart do not share their later chapters at all, so
  // counting only the shared rows reported one difference for a life that went
  // entirely elsewhere. The chapters only one of you lived are differences too.
  const nApart = nDiff + d.tailA.length + d.tailB.length;
  const bothRoads = d.paths[0] && d.paths[1] && d.paths[0] !== d.paths[1];
  const headline = nApart === 0
    ? jc.compareHeadSame
    : (bothRoads && nApart > 4 ? jc.compareRoads
      : (nApart === 1 ? jc.compareHead1 : fill(jc.compareHead, { n: nApart })));

  host.innerHTML = `
    <div class="wrap">
      <div class="section fade-up" style="margin-top:var(--s-6)">
        <p class="caps">${esc(jc.compareCta)}</p>
        <h1 class="serif" tabindex="-1" style="font-size:var(--t-h1)">${esc(headline)}</h1>
        ${map}
        ${stopped}
        <div class="diff" style="margin-top:var(--s-4)">
          <div></div>
          <div class="diff-head">${esc(a.label)}${d.paths[0] ? ` \u00b7 ${esc(d.paths[0])}` : ''}${d.ns[0] === true ? ' \u00b7 NS' : ''}</div>
          <div class="diff-head">${esc(b.label)}${d.paths[1] ? ` \u00b7 ${esc(d.paths[1])}` : ''}${d.ns[1] === true ? ' \u00b7 NS' : ''}</div>
          <div></div>
          <div class="diff-want">${wantStory(a)}<span class="small mute" style="display:block">became ${esc(idWords(a, jc))}</span></div>
          <div class="diff-want">${wantStory(b)}<span class="small mute" style="display:block">became ${esc(idWords(b, jc))}</span></div>
          <div></div>
          <div class="diff-combo">${subjectChips(planRows(data, d.plans[0]), 4) || '<span class="faint">\u00b7</span>'}</div>
          <div class="diff-combo">${subjectChips(planRows(data, d.plans[1]), 4) || '<span class="faint">\u00b7</span>'}</div>
          ${rows}
        </div>
        <div class="grid two" style="margin-top:var(--s-3)">
          ${tail(d.tailA, a.label)}
          ${tail(d.tailB, b.label)}
        </div>
        <div class="section">
          <p class="caps">${esc(jc.sharedDoors)}</p>
          <p class="chips doorchips">${d.shared.map((x) => `<span>${icon(x)}${esc(doorName(x))}</span>`).join('') || '<span class="mute small">None shared yet. Both lists are young.</span>'}</p>
          ${d.onlyA.length ? `<p class="small mute">${esc(a.label)} also holds: ${d.onlyA.map(doorName).map(esc).join(', ')}</p>` : ''}
          ${d.onlyB.length ? `<p class="small mute">${esc(b.label)} also holds: ${d.onlyB.map(doorName).map(esc).join(', ')}</p>` : ''}
        </div>
        ${d.reflections.some(Boolean) ? `
          <div class="section"><p class="caps">At 38 you wrote</p>
          <div class="grid two">
            <p class="small">${esc(d.reflections[0] || '\u00b7')}</p>
            <p class="small">${esc(d.reflections[1] || '\u00b7')}</p>
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

/** Two route lines: together, apart where the stories differed, together again. */
function routeMap(nShared, nDiff, tailA, tailB) {
  const W = 560; const H = 72; const pad = 16;
  const usable = W - pad * 2;
  const together = Math.max(0, nShared - nDiff);
  const total = Math.max(1, nShared + Math.max(tailA, tailB));
  const xAt = (i) => pad + (usable * i) / total;
  const splitStart = xAt(Math.max(1, Math.floor(together / 2)));
  const splitEnd = xAt(nShared - 1);
  const endX = xAt(total);
  const up = `M ${pad} 36 L ${splitStart} 36 C ${splitStart + 30} 36 ${splitStart + 30} 18 ${splitStart + 60} 18 L ${splitEnd - 40} 18 C ${splitEnd - 10} 18 ${splitEnd - 10} 36 ${splitEnd} 36 L ${endX} 36`;
  const down = `M ${pad} 36 L ${splitStart} 36 C ${splitStart + 30} 36 ${splitStart + 30} 54 ${splitStart + 60} 54 L ${splitEnd - 40} 54 C ${splitEnd - 10} 54 ${splitEnd - 10} 36 ${splitEnd} 36 L ${endX} 36`;
  return `
    <div class="route-map" aria-hidden="true">
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
        <path d="${up}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round"/>
        <path d="${down}" fill="none" stroke="var(--ink-mute)" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="1 6"/>
        <circle cx="${pad}" cy="36" r="4" fill="var(--ink)"/>
        <circle cx="${endX}" cy="36" r="4" fill="var(--ink)"/>
      </svg>
    </div>`;
}

// --------------------------------------------------------------------------
// Pieces

function rail(data, stage, age) {
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
      ? `${esc(run.want.label)}${run.want.kind ? ` <span class="kind-chip">${esc(run.want.kind)}</span>` : ''}`
      : `<span class="mute">${esc(jc.railWhereNone)}</span>`}</p>

    <p class="caps rail-q" style="margin-top:var(--s-4)">${icon('q_how')}${esc(jc.q3)}</p>
    <p class="chips doorchips">${run.doors.map((d) => `<span>${icon(d)}${esc((DOORS[d] || {}).label || d)}</span>`).join('') || '<span class="mute small">No doors yet. They come.</span>'}</p>
    ${combo.length ? `<p class="chips subjchips" style="margin-top:var(--s-2)">${subjectChips(combo, 6)}</p>` : ''}
    ${stage ? handStrip(data, stage, age) : ''}
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
  if (!last || last.format === 'ask-ns') return '';
  return `
    <div class="card j-prev">
      <p class="caps">Last chapter</p>
      <p class="small" style="margin:0"><strong>${esc(last.title)}, ${last.age}.</strong> ${decorate(last.outcome)}${last.chance ? ` ${decorate(last.chance.text)}` : ''}</p>
    </div>`;
}

function gainChips(c) {
  const chips = [];
  Object.entries(c.gain || {}).forEach(([k, v]) => {
    const lab = { skills: 'Can do', network: 'Know me', portfolio: 'Made' }[k];
    if (lab && v > 0) chips.push({ ic: `t_${k}`, text: lab });
  });
  Object.entries(c.disp || {}).forEach(([k, v]) => { if (v > 0) chips.push({ ic: k, text: `+ ${dispLabel(k)}` }); });
  if (c.opens) chips.push({ ic: c.opens, text: 'opens a door' });
  return chips.slice(0, 3)
    .map((x) => `<span class="gchip">${icon(x.ic)}${esc(x.text)}</span>`).join('');
}

function snapshot() {
  return { doors: [...run.doors], disp: { ...run.disp }, ledger: { ...run.ledger } };
}

function delta(before) {
  const out = [];
  run.doors.filter((d) => !before.doors.includes(d))
    .forEach((d) => out.push({ ic: d, doorId: d, door: true, text: `Door: ${(DOORS[d] || {}).label || d}` }));
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
      <span class="kindmark">\u25c7 a pattern, not a person</span>
      <h3>${esc(s.label)}</h3>
      <p class="small">${decorate(s.body)}</p>
    </article>`;
}

function wantStory(r) {
  const label = (w) => (w ? w.label : 'Not sure yet');
  const changed = r.wantWas !== undefined && (r.wantWas ? r.wantWas.id : null) !== (r.want ? r.want.id : null);
  const base = changed ? `${esc(label(r.wantWas))}, then ${esc(label(r.want))}` : esc(label(r.want));
  const kind = r.want && r.want.kind ? ` <span class="kind-chip">${esc(r.want.kind)}</span>` : '';
  return base + kind;
}

function dispLabel(k) {
  return { curiosity: 'Curiosity', persistence: 'Persistence', flexibility: 'Flexibility', optimism: 'Optimism', risk: 'Risk taking' }[k] || k;
}

function fill(tpl, vars) {
  return String(tpl || '').replace(/\{(\w+)\}/g, (_, k) => (vars[k] == null ? '' : vars[k]));
}

function subjectsPhrase(data, r) {
  const rows = planRows(data, r.plan);
  const chosen = rows.filter((s) => !s.compulsory);
  const use = (chosen.length ? chosen : rows).slice(0, 3).map((s) => s.shortName || s.name);
  if (!use.length) return 'a combination you have not set yet';
  if (use.length === 1) return use[0];
  return `${use.slice(0, -1).join(', ')} and ${use[use.length - 1]}`;
}

function carriedPhrase(data) {
  const all = (data.activities && data.activities.activities) || [];
  const use = (run.activities || []).map((id) => all.find((a) => a.id === id))
    .filter(Boolean).map((a) => a.label.charAt(0).toLowerCase() + a.label.slice(1)).slice(0, 2);
  if (!use.length) return 'what you carry';
  if (use.length === 1) return use[0];
  return `${use[0]} and ${use[1]}`;
}

function situation(data, stage) {
  return decorate(fill(stage.situation, { subjects: subjectsPhrase(data, run) }));
}

const endedCued = new Set();

// --- keeping your place, ported from v1 whole ------------------------------

let lastScreen = null;
let keep = null;

function attrEsc(v) {
  return String(v).replace(/["\\]/g, '\\$&');
}

function markPlace(host) {
  const a = document.activeElement;
  let sel = null;
  if (a && host && host.contains(a) && a.dataset && a.dataset.action) {
    const bits = [`[data-action="${attrEsc(a.dataset.action)}"]`];
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
  if (!target) {
    const h = host.querySelector('h1[tabindex="-1"]');
    if (h) h.focus({ preventScroll: true });
    return;
  }
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
