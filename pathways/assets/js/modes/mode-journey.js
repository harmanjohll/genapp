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
import { decorate, bindGlossary } from '../components/glossary.js';
import {
  createRun, stagesFor, currentStage, visibleChoices, applyChoices, applyReflection,
  respondToChance, askMet, finish, diffRuns, POINTS_PER_TURN,
} from '../engine/journey.js';
import { getState, saveRun, clearRuns, setLiveRun, currentYear } from '../state.js';

let PATHS = {};
let DOORS = {};
let run = null;
let stages = [];
let picked = [];            // selected choice indices this turn
let justResolved = null;    // chance outcome awaiting Continue
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

  if (!run) return introScreen(host, data, st);
  if (run.done) return endingScreen(host, data, st);

  const stage = currentStage(run, stages);
  if (!stage) {
    finish(run, data);
    saveRun(structuredCloneSafe(run));
    rerender();
    return;
  }

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
  run = null; picked = []; justResolved = null;
  document.body.dataset.journey = 'false';
}

function startRun(data, want) {
  const j = data.journey;
  stages = stagesFor(j.stages, Math.max(15, currentYear().age));
  const n = getState().runs.length + 1;
  run = createRun(stages[0].age, `Story ${n}`, want);
  picked = []; justResolved = null;
  setLiveRun(run);
}

// --------------------------------------------------------------------------
// Screens

function introScreen(host, data, st) {
  const jc = data.copy.journey;
  const wants = data.journey.wants || [];
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
        <p class="lede" style="max-width:40ch;margin-top:var(--s-3)">You choose. Things turn up. Nothing ends it.</p>
        <div class="wantbox">
          <p class="want-q">${esc(jc.wantPrompt)}</p>
          <p class="micro mute">${esc(jc.wantHint)}</p>
          <div class="grid two" style="margin-top:var(--s-3)">
            ${wants.map((w) => `
              <button class="future-btn" type="button" data-action="want" data-id="${w.id}">
                <span class="want" style="font-size:1rem">${esc(w.label)}</span>
              </button>`).join('')}
          </div>
        </div>
        ${runsList}
        ${st.runs.length ? `<button class="btn ghost small" type="button" data-action="clearruns" style="margin-top:var(--s-4)">Clear stories</button>` : ''}
      </div>
    </div>`;
  focusH1(host);
  bindGlossary(host);
  onAction(host, {
    want: (btn) => {
      const w = (data.journey.wants || []).find((x) => x.id === btn.dataset.id);
      startRun(data, w && w.id !== 'unsure' ? { id: w.id, label: w.label } : null);
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
  const pool = visibleChoices(stage, run);
  const spent = picked.reduce((n, i) => n + (pool[i].cost || 1), 0);
  const left = POINTS_PER_TURN - spent;
  const prev = lastStory();

  const choices = pool.map((c, i) => {
    const on = picked.includes(i);
    const cost = c.cost || 1;
    const disabledByBudget = !on && cost > left;
    return `
      <button class="choice sel ${on ? 'on' : ''}" type="button" data-action="pick" data-i="${i}"
              aria-pressed="${on}" ${disabledByBudget ? 'data-dim="true"' : ''}>
        <span class="c-cost" aria-label="${cost} point${cost > 1 ? 's' : ''}">${'●'.repeat(cost)}</span>
        <span class="c-label">${decorate(c.label)}</span>
        <span class="c-chips">${gainChips(c)}</span>
      </button>`;
  }).join('');

  host.innerHTML = shell(`
    ${turnMeta(stage)}
    <p class="lede j-sit">${decorate(stage.situation)}</p>
    <div class="pointsrow" role="status">
      <span class="caps">${esc(jc.points)}</span>
      <span class="pts" aria-label="${left} of ${POINTS_PER_TURN} points left">${'●'.repeat(left)}${'○'.repeat(spent)}</span>
    </div>
    <div class="grid j-choices" role="group" aria-label="Your choices">${choices}</div>
    <div class="btn-row" style="margin-top:var(--s-4)">
      ${spent >= POINTS_PER_TURN ? `<button class="btn accent" type="button" data-action="live">${esc(jc.liveIt)}</button>` : ''}
      ${spent === 1 ? `<button class="btn ghost" type="button" data-action="justthis">${esc(jc.justThis)}</button>` : ''}
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
      if (picked.reduce((n, x) => n + (pool[x].cost || 1), 0) >= POINTS_PER_TURN) commit(data);
      else rerender();
    },
    live: () => commit(data),
    justthis: () => commit(data),
  });
}

function commit(data) {
  if (!picked.length) return;
  const stage = currentStage(run, stages);
  applyChoices(run, stage, picked, data.chances.cards);
  announce(`Age ${stage.age} lived.`);
  picked = [];
  setLiveRun(run);
  rerender();
}

function forkScreen(host, stage, data) {
  const pool = visibleChoices(stage, run);
  host.innerHTML = `
    <div class="wrap">
      <div class="fork fade-up">
        ${turnMeta(stage)}
        <p class="lede j-sit" style="max-width:44ch">${decorate(stage.situation)}</p>
        <div class="fork-choices" role="group" aria-label="Your choice">
          ${pool.map((c, i) => `
            <button class="choice fork-c" type="button" data-action="fork" data-i="${i}">
              <span class="c-label">${decorate(c.label)}</span>
              <span class="c-chips">${gainChips(c)}</span>
            </button>`).join('')}
        </div>
      </div>
    </div>`;
  focusH1(host);
  bindGlossary(host);
  onAction(host, {
    fork: (btn) => {
      applyChoices(run, stage, [Number(btn.dataset.i)], data.chances.cards);
      announce(`Chosen. Age ${stage.age}.`);
      setLiveRun(run);
      rerender();
    },
  });
}

function reflectScreen(host, stage, data) {
  const r = data.journey.reflection;
  host.innerHTML = `
    <div class="wrap">
      <div class="reflect fade-up">
        ${turnMeta(stage)}
        <p class="lede j-sit">${esc(stage.situation)}</p>
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
  onAction(host, {
    rpick: (btn) => { const inp = host.querySelector('[data-ref="rtext"]'); if (inp) inp.value = btn.dataset.t; },
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
      <p class="kind">${esc(kind)}</p>
      <h1 class="serif" tabindex="-1" style="margin:var(--s-2) 0 var(--s-3)">${esc(card.title)}</h1>
      <p>${decorate(card.body)}</p>
      ${asks}
      <div class="grid" role="group" aria-label="How you respond" style="margin-top:var(--s-4)">
        ${(card.responses || []).map((r, i) => `
          <button class="choice resp" type="button" data-action="respond" data-i="${i}">
            <span class="c-label">${decorate(r.label)}</span>
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
      const before = snapshot();
      respondToChance(run, card, Number(btn.dataset.i));
      justResolved = { card, delta: delta(before), step: run.steps[run.steps.length - 1] };
      setLiveRun(run);
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
      ${d.length ? `<p class="delta">${d.map((x) => `<span class="dchip pop">${esc(x)}</span>`).join('')}</p>` : ''}
      <div class="btn-row" style="margin-top:var(--s-4)">
        <button class="btn" type="button" data-action="go">${esc(jc.continue)}</button>
      </div>
    </div>`, rail(data));
  announce([ch.response, ...d].filter(Boolean).join('. '));
  focusH1(host);
  bindGlossary(host);
  onAction(host, { go: () => { justResolved = null; rerender(); } });
}

function endingScreen(host, data, st) {
  const jc = data.copy.journey;
  const wantLine = run.want
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
          <p class="caps">${esc(jc.doorsHead)}</p>
          <p class="chips doorchips">${run.doors.map((d) => `<span>${esc((DOORS[d] || {}).label || d)}</span>`).join('') || '<span class="mute">The next turn opens some.</span>'}</p>
        </div>
        ${run.reflection ? `<p class="small mute" style="margin-top:var(--s-4)">At thirty eight you wrote: ${esc(run.reflection)}</p>` : ''}
        ${story ? storyCard(story) : ''}
        <div class="panel" style="margin-top:var(--s-6);border:2px solid var(--accent)">
          <h2>${esc(jc.playAgain)}</h2>
          <p class="small mute">Same start. A different want, or different years.</p>
          <div class="btn-row" style="margin-top:var(--s-3)">
            <button class="btn accent" type="button" data-action="again">${esc(jc.playAgain)}</button>
            ${st.runs.length >= 2 ? `<button class="btn" type="button" data-action="compare2">${esc(jc.compareCta)}</button>` : ''}
            <button class="btn ghost" type="button" data-action="done">Back</button>
          </div>
        </div>
      </div>
    </div>`;
  focusH1(host);
  bindGlossary(host);
  onAction(host, {
    again: () => { run = null; rerender(); },
    compare2: () => showDiff(host, data, st.runs.slice(-2)),
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
          <div class="diff-want">${d.wants[0] ? esc(d.wants[0].label) : 'Not sure yet'}</div>
          <div class="diff-want">${d.wants[1] ? esc(d.wants[1].label) : 'Not sure yet'}</div>
          ${rows}
        </div>
        <div class="section">
          <p class="caps">${esc(jc.sharedDoors)}</p>
          <p class="chips doorchips">${d.shared.map((x) => `<span>${esc(doorName(x))}</span>`).join('') || '<span class="mute">·</span>'}</p>
          ${d.onlyA.length ? `<p class="small mute">${esc(a.label)} also holds: ${d.onlyA.map(doorName).map(esc).join(', ')}</p>` : ''}
          ${d.onlyB.length ? `<p class="small mute">${esc(b.label)} also holds: ${d.onlyB.map(doorName).map(esc).join(', ')}</p>` : ''}
        </div>
        ${d.reflections.some(Boolean) ? `
          <div class="section"><p class="caps">At thirty eight you wrote</p>
          <div class="grid two">
            <p class="small">${esc(d.reflections[0] || '·')}</p>
            <p class="small">${esc(d.reflections[1] || '·')}</p>
          </div></div>` : ''}
        <div class="diff-verdict">
          <h2>${esc(jc.verdictHead)}</h2>
          <p style="margin-bottom:0">${esc(jc.verdict)}</p>
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
  return `
    <p class="turn-meta caps">Step ${n} of ${stages.length} ${label} ${want}</p>
    <div class="turn-head"><span class="turn-age" aria-hidden="true">${stage.age}</span>
      <h1 class="serif" tabindex="-1">${esc(stage.title)}</h1></div>`;
}

function rail(data) {
  const jc = data.copy.journey;
  const bars = ['skills', 'network', 'portfolio'].map((k) => {
    const lab = { skills: 'Can do', network: 'Know me', portfolio: 'Made' }[k];
    const pct = Math.round((run.ledger[k] / 24) * 100);
    return `<div class="disp-row"><span>${lab}</span>
      <span class="disp-track" role="img" aria-label="${lab}, ${run.ledger[k]} of 24"><span class="disp-fill" style="width:${pct}%"></span></span><span></span></div>`;
  }).join('');
  const dbars = Object.entries(run.disp).map(([k, v]) => {
    const max = Math.max(4, ...Object.values(run.disp));
    return `<div class="disp-row"><span>${esc(dispLabel(k))}</span>
      <span class="disp-track" role="img" aria-label="${esc(dispLabel(k))}, ${v}"><span class="disp-fill" style="width:${Math.round((v / max) * 100)}%"></span></span><span></span></div>`;
  }).join('');
  return `
    <p class="caps">${esc(jc.doorsHead)}</p>
    <p class="chips doorchips">${run.doors.map((d) => `<span>${esc((DOORS[d] || {}).label || d)}</span>`).join('') || '<span class="mute small">None yet. They come.</span>'}</p>
    <p class="caps" style="margin-top:var(--s-4)">${esc(jc.carryHead)}</p>
    <div class="disp-bars">${bars}</div>
    <details style="margin-top:var(--s-3)"><summary class="small mute">How you tend to act</summary>
      <div class="disp-bars" style="margin-top:var(--s-2)">${dbars}</div></details>
    ${storySoFar(data)}`;
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
    const lab = { skills: '▲ Can do', network: '● Know me', portfolio: '◆ Made' }[k];
    if (lab && v > 0) chips.push(lab);
  });
  Object.entries(c.disp || {}).forEach(([k, v]) => { if (v > 0) chips.push(`+ ${dispLabel(k)}`); });
  if (c.opens) chips.push(`◇ opens a door`);
  return chips.slice(0, 3).map((x) => `<span class="gchip">${esc(x)}</span>`).join('');
}

function snapshot() {
  return { doors: [...run.doors], disp: { ...run.disp }, ledger: { ...run.ledger } };
}
function delta(before) {
  const out = [];
  run.doors.filter((d) => !before.doors.includes(d)).forEach((d) => out.push(`Door: ${(DOORS[d] || {}).label || d}`));
  Object.keys(run.disp).forEach((k) => { const g = run.disp[k] - (before.disp[k] || 0); if (g > 0) out.push(`+${g} ${dispLabel(k)}`); });
  Object.keys(run.ledger).forEach((k) => {
    const g = run.ledger[k] - (before.ledger[k] || 0);
    const lab = { skills: 'Can do', network: 'Know me', portfolio: 'Made' }[k];
    if (g > 0) out.push(`+${g} ${lab}`);
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
