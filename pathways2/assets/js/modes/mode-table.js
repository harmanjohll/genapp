// Mode TABLE. The board game: two to six students, one device, one lesson.
//
// WHY THIS IS A BOARD GAME AND NOT A SHARED SAVE FILE. Everyone at the table
// lives the same years off the same shuffled deck, and the interesting thing is
// never the outcome, it is the moment the choices are laid side by side. So the
// round is: the chapter is read out once, each player decides in private behind
// a pass screen, and then everything is revealed at once and argued about. That
// argument is the lesson. The app's job is to run the clock and hold the cards.
//
// WHAT IT REFUSES TO DO. No winner, no score, no ranking, no leaderboard, and
// no ordering of players by anything. The reveal is alphabetical by nothing: it
// is in seating order, always, so the layout itself cannot imply a placing.
// Nothing is stored beyond the tab: a table is a lesson, not an account.

import { esc, onAction } from '../components/dom.js';
import { icon } from '../components/icons.js';
import { decorate, bindGlossary } from '../components/glossary.js';
import { cue } from '../sound.js';
import { possibilitiesFor, forkNeed } from '../engine/possible.js';
import {
  createRun, currentStage, ageAt, sequenceFor, visibleChoices, applyChoices,
  answerNS, respondToChance, finish, pointsFor, strongestTrack,
} from '../engine/journey4.js';
import { getState } from '../state.js';

const MAX_PLAYERS = 6;
const MIN_PLAYERS = 2;
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTUVWXYZ';
const DISP_WORD = {
  curiosity: 'curious', persistence: 'persistent', flexibility: 'flexible',
  optimism: 'hopeful', risk: 'bold',
};

let T = null;          // the table, or null before setup
let picked = [];
let repaint = () => {};

export function resetTable() { T = null; picked = []; }

export function renderTable(host, data, ctx, again) {
  repaint = () => renderTable(host, data, ctx, again);
  // Setup keeps its half built table in T so the seat count, the names and the
  // typed code survive a re-render. Anything without seats is still setup.
  if (!T || !T.players) return setupScreen(host, data);
  if (T.phase === 'pass') return passScreen(host, data);
  if (T.phase === 'reveal') return revealScreen(host, data);
  if (T.phase === 'ending') return endingScreen(host, data);
  return turnScreen(host, data);
}

// --------------------------------------------------------------------------
// Setup

function code(seed) {
  let out = '';
  for (let i = 0; i < 5; i += 1) out += ALPHABET[(seed >> (i * 5)) % ALPHABET.length];
  return out;
}

function setupScreen(host, data) {
  const t = data.copy.table;
  const n = (T && T.count) || 4;
  const suggested = (T && T.seedCode) || code(Math.floor(Date.now() / 60000) % 0x7fffffff);
  host.innerHTML = `
    <div class="wrap">
      <div class="section fade-up" style="margin-top:var(--s-6);max-width:44rem">
        <p class="caps">${esc(t.head)}</p>
        <h1 class="serif" tabindex="-1" style="font-size:var(--t-hero);line-height:var(--lh-hero)">${esc(t.title)}</h1>
        <p class="lede">${esc(t.lede)}</p>
        <div class="panel" style="margin-top:var(--s-5)">
          <p class="caps">${esc(t.howMany)}</p>
          <div class="btn-row" style="margin-top:var(--s-2)" role="group" aria-label="${esc(t.howMany)}">
            ${Array.from({ length: MAX_PLAYERS - MIN_PLAYERS + 1 }, (_, i) => i + MIN_PLAYERS).map((k) => `
              <button class="btn ${k === n ? 'accent' : ''}" type="button" data-action="count" data-n="${k}"
                      aria-pressed="${k === n}">${k}</button>`).join('')}
          </div>
          <div class="tnames" style="margin-top:var(--s-4)">
            ${Array.from({ length: n }, (_, i) => `
              <label class="tname">
                <span class="micro mute">${esc(t.seat)} ${i + 1}</span>
                <input type="text" maxlength="14" data-ref="nm${i}" autocomplete="off"
                       placeholder="${esc(t.namePlaceholder)}" value="${esc((T && T.names && T.names[i]) || '')}">
              </label>`).join('')}
          </div>
          <label class="tname" style="margin-top:var(--s-4);max-width:16rem">
            <span class="micro mute">${esc(t.codeLabel)}</span>
            <input type="text" maxlength="6" class="stagebox" data-ref="seed" value="${esc(suggested)}"
                   autocomplete="off" autocapitalize="characters">
          </label>
          <p class="micro mute" style="margin-top:var(--s-2)">${esc(t.codeNote)}</p>
          <div class="btn-row" style="margin-top:var(--s-5)">
            <button class="btn accent" type="button" data-action="begin">${esc(t.begin)}</button>
          </div>
        </div>
        <p class="small mute" style="margin-top:var(--s-4)">${esc(t.privacy)}</p>
      </div>
    </div>`;
  const h1 = host.querySelector('h1');
  if (h1) h1.focus();
  onAction(host, {
    count: (btn) => {
      const seedEl = host.querySelector('[data-ref="seed"]');
      T = {
        count: Number(btn.dataset.n),
        names: readNames(host, MAX_PLAYERS),
        seedCode: seedEl ? seedEl.value.trim().toUpperCase() : '',
      };
      repaint();
    },
    begin: () => start(host, data, n),
  });
}

function readNames(host, n) {
  return Array.from({ length: n }, (_, i) => {
    const el = host.querySelector(`[data-ref="nm${i}"]`);
    return el ? el.value.trim() : '';
  });
}

function start(host, data, n) {
  const names = readNames(host, n);
  const seedEl = host.querySelector('[data-ref="seed"]');
  const raw = (seedEl ? seedEl.value : '').trim().toUpperCase() || 'TABLE';
  const seed = (parseInt(raw, 36) % 0x7fffffff) || 7;
  const st = getState();
  const startAge = 15;
  T = {
    count: n,
    names,
    seedCode: raw,
    round: 0,
    turn: 0,
    phase: 'turn',
    players: Array.from({ length: n }, (_, i) => {
      const run = createRun(startAge, `Seat ${i + 1}`, null, st.plan);
      run.seed = seed;              // one deck, dealt to everybody
      run.short = true;
      run.classSeed = raw;
      return { name: names[i] || `Player ${i + 1}`, run, lastChoices: [], lastCard: null };
    }),
  };
  picked = [];
  repaint();
}

const me = () => T.players[T.turn];
const rounds = (data) => sequenceFor(data.journey, T.players[0].run).length;

// --------------------------------------------------------------------------
// A turn

function turnScreen(host, data) {
  const t = data.copy.table;
  const p = me();
  const stage = currentStage(data.journey, p.run);
  if (!stage) { T.phase = 'ending'; return repaint(); }
  const age = ageAt(data.journey, p.run, p.run.stepIndex);

  if ((stage.format || 'turn') === 'ask-ns') return nsScreen(host, data, stage, p);
  if (p.run.pending) return chanceScreen(host, data, p);

  const isFork = (stage.format || 'turn') === 'fork';
  const pool = visibleChoices(stage, p.run, (data.moves && data.moves.moves) || [], age);
  const { points } = pointsFor(p.run, stage, data, age);
  const spent = picked.reduce((sum, i) => sum + (pool[i].cost || 1), 0);
  const left = isFork ? 1 : points - spent;

  host.innerHTML = `
    <div class="wrap">
      <div class="tgame fade-up">
        ${boardStrip(data)}
        <div class="tchapter">
          <span class="turn-age" aria-hidden="true">${age}</span>
          <h1 class="serif" tabindex="-1">${esc(stage.chapter || stage.title)}</h1>
        </div>
        <p class="lede j-sit">${decorate(stage.situation || '')}</p>
        <div class="tseat">
          <p class="caps">${esc(p.name)}${esc(t.yourTurn)}</p>
          ${isFork ? '' : `<span class="pts" aria-label="${left} of ${points} left">${'●'.repeat(Math.max(0, left))}${'○'.repeat(spent)}</span>`}
        </div>
        <div class="grid j-choices" role="group" aria-label="${esc(t.choices)}">
          ${pool.map((c, i) => {
            const on = picked.includes(i);
            const cost = c.cost || 1;
            const need = isFork && c.opens ? forkNeed(data, c.opens) : '';
            return `
              <button class="choice sel ${on ? 'on' : ''}" type="button" data-action="pick" data-i="${i}"
                      aria-pressed="${on}" ${!on && cost > left ? 'data-dim="true"' : ''}>
                ${isFork ? '' : `<span class="c-cost" aria-label="${cost} point${cost > 1 ? 's' : ''}">${'●'.repeat(cost)}</span>`}
                <span class="c-label">${esc(c.label)}</span>
                ${need ? `<span class="fork-need">${decorate(need)}</span>` : ''}
              </button>`;
          }).join('')}
        </div>
        ${possibleFold(data, p.run, age)}
        <div class="btn-row" style="margin-top:var(--s-4)">
          ${picked.length ? `<button class="btn accent" type="button" data-action="lock">${esc(t.lockIn)}</button>` : ''}
        </div>
      </div>
    </div>`;
  focusHead(host);
  bindGlossary(host);
  onAction(host, {
    pick: (btn) => {
      const i = Number(btn.dataset.i);
      const cost = pool[i].cost || 1;
      if (isFork) picked = [i];
      else if (picked.includes(i)) picked = picked.filter((x) => x !== i);
      else if (cost <= left) picked = [...picked, i];
      repaint();
    },
    lock: () => {
      p.lastChoices = picked.map((i) => pool[i].label);
      applyChoices(p.run, data.journey, stage, picked, data.chances.cards,
        subjectMeta(data), (data.moves && data.moves.moves) || []);
      picked = [];
      if (p.run.pending) { cue('chance'); repaint(); return; }
      advance(host, data);
    },
  });
}

function nsScreen(host, data, stage, p) {
  const t = data.copy.table;
  const jc = data.copy.journey;
  host.innerHTML = `
    <div class="wrap">
      <div class="tgame fade-up">
        ${boardStrip(data)}
        <div class="ns-ask">
          <p class="caps">${esc(p.name)}${esc(t.yourTurn)} ${esc(jc.nsKicker)}</p>
          <h1 class="serif" tabindex="-1">${esc(stage.chapter || stage.title)}</h1>
          <p class="lede">${decorate(stage.situation || '')}</p>
          <div class="btn-row" style="margin-top:var(--s-4)">
            <button class="btn accent" type="button" data-action="ns" data-yes="1">${esc(jc.nsYes)}</button>
            <button class="btn" type="button" data-action="ns" data-yes="">${esc(jc.nsNo)}</button>
          </div>
        </div>
      </div>
    </div>`;
  focusHead(host);
  bindGlossary(host);
  onAction(host, {
    ns: (btn) => {
      answerNS(p.run, !!btn.dataset.yes, stage);
      p.lastChoices = [btn.dataset.yes ? jc.nsYes : jc.nsNo];
      advance(host, data);
    },
  });
}

function chanceScreen(host, data, p) {
  const t = data.copy.table;
  const card = data.chances.cards.find((c) => c.id === p.run.pending.cardId);
  if (!card) { p.run.pending = null; p.run.stepIndex += 1; return advance(host, data); }
  host.innerHTML = `
    <div class="wrap">
      <div class="tgame fade-up">
        ${boardStrip(data)}
        <div class="chance">
          <p class="caps">${esc(p.name)}${esc(t.dealt)}</p>
          <h1 class="serif" tabindex="-1">${esc(card.title)}</h1>
          <p class="lede">${decorate(card.body)}</p>
          <div class="grid j-choices" style="margin-top:var(--s-4)">
            ${(card.responses || []).map((r, i) => `
              <button class="choice sel" type="button" data-action="respond" data-i="${i}">
                <span class="c-label">${esc(r.label)}</span>
              </button>`).join('')}
          </div>
        </div>
      </div>
    </div>`;
  focusHead(host);
  bindGlossary(host);
  onAction(host, {
    respond: (btn) => {
      respondToChance(p.run, card, Number(btn.dataset.i));
      const step = p.run.steps[p.run.steps.length - 1];
      p.lastCard = step && step.chance ? step.chance : null;
      advance(host, data);
    },
  });
}

/** Next seat, or the reveal when the table has been round once. */
function advance(host, data) {
  if (T.turn + 1 < T.players.length) {
    T.turn += 1;
    T.phase = 'pass';
  } else {
    T.turn = 0;
    T.phase = 'reveal';
  }
  repaint();
}

/**
 * The pass screen exists so nobody plays to the person who went before them.
 * A board game keeps hands hidden; this is the hand.
 */
function passScreen(host, data) {
  const t = data.copy.table;
  host.innerHTML = `
    <div class="wrap">
      <div class="tpass fade-up">
        <p class="caps">${esc(t.passHead)}</p>
        <h1 class="serif" tabindex="-1">${esc(me().name)}</h1>
        <p class="lede">${esc(t.passBody)}</p>
        <div class="btn-row" style="margin-top:var(--s-4)">
          <button class="btn accent" type="button" data-action="ready">${esc(t.ready)}</button>
        </div>
      </div>
    </div>`;
  focusHead(host);
  onAction(host, { ready: () => { T.phase = 'turn'; repaint(); } });
}

// --------------------------------------------------------------------------
// The reveal: the whole point of playing at a table

function revealScreen(host, data) {
  const t = data.copy.table;
  const done = T.players[0].run.done || !currentStage(data.journey, T.players[0].run);
  const sameCard = new Set(T.players.map((p) => (p.lastCard ? p.lastCard.id : ''))).size === 1;
  const anyCard = T.players.some((p) => p.lastCard);
  cue('door');
  host.innerHTML = `
    <div class="wrap">
      <div class="section fade-up" style="margin-top:var(--s-5)">
        ${boardStrip(data)}
        <p class="caps">${esc(t.revealHead)}</p>
        <h1 class="serif" tabindex="-1">${esc(anyCard && sameCard ? t.revealSame : t.revealTitle)}</h1>
        <div class="treveal">
          ${T.players.map((p) => `
            <article class="tcard">
              <p class="tcard-name">${esc(p.name)}</p>
              <ul class="tcard-list">
                ${(p.lastChoices || []).map((c) => `<li>${esc(c)}</li>`).join('') || `<li class="mute">${esc(t.nothingYet)}</li>`}
              </ul>
              ${p.lastCard ? `
                <p class="tcard-card"><span class="tcard-deal">${esc(p.lastCard.title)}</span>
                  ${esc(t.took)} ${esc(p.lastCard.response)}</p>` : ''}
              ${p.run.doors.length ? `
                <p class="chips doorchips small">${p.run.doors.slice(-3).map((d) => `<span>${icon(d)}${esc(doorLabel(data, d))}</span>`).join('')}</p>` : ''}
            </article>`).join('')}
        </div>
        <div class="panel tight" style="margin-top:var(--s-4)">
          <p class="caps">${esc(t.talkHead)}</p>
          <p>${esc(prompt(data))}</p>
        </div>
        <div class="btn-row" style="margin-top:var(--s-4)">
          <button class="btn accent" type="button" data-action="next">${esc(done ? t.toEnding : t.nextChapter)}</button>
        </div>
      </div>
    </div>`;
  focusHead(host);
  bindGlossary(host);
  onAction(host, {
    next: () => {
      if (done) { T.players.forEach((p) => finish(p.run, data)); T.phase = 'ending'; }
      else { T.round += 1; T.phase = T.players.length > 1 ? 'pass' : 'turn'; }
      repaint();
    },
  });
}

function prompt(data) {
  const list = data.copy.table.prompts || [];
  return list[T.round % list.length] || '';
}

// --------------------------------------------------------------------------
// The end of the table

function endingScreen(host, data) {
  const t = data.copy.table;
  const paths = new Set(T.players.map((p) => p.run.pathLabel).filter(Boolean));
  host.innerHTML = `
    <div class="wrap">
      <div class="section fade-up" style="margin-top:var(--s-5)">
        <p class="caps">${esc(t.endHead)}</p>
        <h1 class="serif" tabindex="-1" style="font-size:var(--t-hero);line-height:var(--lh-hero)">${esc(
          paths.size > 1 ? t.endSplit : t.endTogether)}</h1>
        <p class="lede">${esc(t.endBody)}</p>
        <div class="treveal end">
          ${T.players.map((p) => `
            <article class="tcard">
              <p class="tcard-name">${esc(p.name)}</p>
              <p class="tcard-path">${esc(p.run.pathLabel || t.noPath)}${p.run.ns === true ? esc(t.withNs) : ''}</p>
              <p class="idwords serif" style="font-size:1.1rem">${esc(became(p.run))}</p>
              <p class="chips doorchips small">${p.run.doors.map((d) => `<span>${icon(d)}${esc(doorLabel(data, d))}</span>`).join('') || `<span class="mute">${esc(t.noDoors)}</span>`}</p>
            </article>`).join('')}
        </div>
        <div class="panel" style="margin-top:var(--s-5)">
          <p class="caps">${esc(t.closeHead)}</p>
          <p>${esc(t.closeBody)}</p>
        </div>
        <div class="btn-row" style="margin-top:var(--s-5)">
          <button class="btn accent" type="button" data-action="print">${esc(t.printPack)}</button>
          <button class="btn" type="button" data-action="againtable">${esc(t.playAgain)}</button>
        </div>
        ${printPack(data)}
      </div>
    </div>`;
  focusHead(host);
  bindGlossary(host);
  onAction(host, {
    print: () => window.print(),
    againtable: () => { resetTable(); repaint(); },
  });
}

/**
 * The pack a teacher prints: the eight destinations as a board, the chapter
 * track, and the table's own results filled in. Screen hides it; print shows
 * only it. A group that played on one phone can still leave with something on
 * paper, which is what gets stuck on a noticeboard.
 */
function printPack(data) {
  const dests = [...data.pathways.destinations].sort((a, b) => a.railName.localeCompare(b.railName));
  const seq = sequenceFor(data.journey, T.players[0].run).filter((s) => (s.format || 'turn') !== 'ask-ns');
  return `
    <div class="printpack" aria-hidden="true">
      <h2>${esc(data.copy.table.packHead)} ${esc(T.seedCode)}</h2>
      <p class="pp-note">${esc(data.copy.table.packNote)}</p>
      <h3>${esc(data.copy.table.packBoard)}</h3>
      <ul class="pp-board">
        ${dests.map((d) => `<li><strong>${esc(d.railName)}</strong><span>${esc((d.leadsTo || ''))}</span></li>`).join('')}
      </ul>
      <h3>${esc(data.copy.table.packTrack)}</h3>
      <ol class="pp-track">
        ${seq.map((s) => `<li>${esc(s.chapter || s.title)}</li>`).join('')}
      </ol>
      <h3>${esc(data.copy.table.packSeats)}</h3>
      <table class="pp-table">
        <thead><tr><th>${esc(data.copy.table.seat)}</th><th>${esc(data.copy.table.packRoad)}</th><th>${esc(data.copy.table.packDoors)}</th></tr></thead>
        <tbody>
          ${T.players.map((p) => `
            <tr><td>${esc(p.name)}</td><td>${esc(p.run.pathLabel || '')}</td>
            <td>${esc(p.run.doors.map((d) => doorLabel(data, d)).join(', '))}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

// --------------------------------------------------------------------------

function boardStrip(data) {
  const total = rounds(data);
  const at = T.players[0].run.stepIndex;
  return `
    <p class="turn-meta caps tstrip">
      <span>${esc(data.copy.table.head)}</span>
      <span class="pathchip seed">${esc(T.seedCode)}</span>
      <span class="lifestrip" role="img" aria-label="${at + 1} of ${total}">
        ${Array.from({ length: total }, (_, i) => `<i class="${i < at ? 'on' : ''}${i === at ? ' now' : ''}"></i>`).join('')}
      </span>
    </p>`;
}

function possibleFold(data, run, age) {
  const list = possibilitiesFor(data, run, age, 2);
  if (!list.length) return '';
  return `
    <details class="poss">
      <summary>${icon('q_how')}${esc(data.copy.journey.possHead)}</summary>
      <ul class="poss-list">
        ${list.map((p) => `
          <li class="poss-row">
            <p class="poss-label">${decorate(p.label)}</p>
            <p class="small" style="margin:0">${decorate(p.needs)}</p>
          </li>`).join('')}
      </ul>
    </details>`;
}

function doorLabel(data, id) {
  const cat = (data.journey.doorsCatalog || {})[id] || {};
  return cat.label || id;
}

function became(run) {
  const top = Object.entries(run.disp || {}).filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]).slice(0, 2);
  return top.length ? top.map(([k]) => DISP_WORD[k]).join(' and ') : 'still working it out';
}

function subjectMeta(data) {
  return Object.fromEntries(((data.subjects && data.subjects.subjects) || [])
    .map((s) => [s.id, { name: s.shortName || s.name, levels: s.levels || [] }]));
}

function focusHead(host) {
  const h = host.querySelector('h1');
  if (h) h.focus();
}

/** Sweep: a table of every size completes, and nothing ranks the players. */
export function tableSweep(data) {
  const failures = [];
  const moves = (data.moves && data.moves.moves) || [];
  const meta = subjectMeta(data);
  for (let n = MIN_PLAYERS; n <= MAX_PLAYERS; n += 1) {
    const players = Array.from({ length: n }, (_, i) => {
      const run = createRun(15, `s${i}`, null, {});
      run.seed = 4242; run.short = true;
      return run;
    });
    let guard = 0;
    let sameFirstCard = null;
    while (guard++ < 400) {
      const live = players.filter((r) => !r.done && currentStage(data.journey, r));
      if (!live.length) break;
      live.forEach((run, k) => {
        const stage = currentStage(data.journey, run);
        if (!stage) { finish(run, data); return; }
        const fmt = stage.format || 'turn';
        const age = ageAt(data.journey, run, run.stepIndex);
        if (fmt === 'ask-ns') { answerNS(run, k % 2 === 0, stage); return; }
        if (run.pending) {
          const card = data.chances.cards.find((c) => c.id === run.pending.cardId);
          if (run.stepIndex === 1 && k === 0) sameFirstCard = card ? card.id : null;
          respondToChance(run, card, k % Math.max(1, (card.responses || []).length));
          return;
        }
        const pool = visibleChoices(stage, run, moves, age);
        const idx = k % pool.length;
        applyChoices(run, data.journey, stage, [idx], data.chances.cards, meta, moves);
      });
    }
    players.forEach((r) => { if (!r.done) finish(r, data); });
    players.forEach((r, k) => {
      if (!r.steps.length) failures.push({ n, seat: k, why: 'seat played no turns' });
      if (r.steps.length < 4) failures.push({ n, seat: k, why: `seat lived only ${r.steps.length} turns` });
    });
    if (sameFirstCard === undefined) failures.push({ n, why: 'no shared card dealt' });
  }
  const ok = failures.length === 0;
  console.log(
    `%cTable game: ${ok ? 'PASS' : 'FAIL'} (${MIN_PLAYERS} to ${MAX_PLAYERS} seats simulated)`,
    ok ? 'color:#2F7D5B;font-weight:700' : 'color:#B23A2A;font-weight:700'
  );
  if (!ok) console.table(failures.slice(0, 20));
  return { ok, failures };
}
