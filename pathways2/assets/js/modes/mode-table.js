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

import { esc, onAction } from '../components/dom.js?v=2.12.0';
import { icon } from '../components/icons.js?v=2.12.0';
import { decorate, bindGlossary } from '../components/glossary.js?v=2.12.0';
import { cue } from '../sound.js?v=2.12.0';
import { possibilitiesFor, forkNeed } from '../engine/possible.js?v=2.12.0';
import {
  createRun, currentStage, ageAt, sequenceFor, visibleChoices, applyChoices,
  answerNS, respondToChance, applyReflection, finish, pointsFor, strongestTrack, askMet, CAPACITY_CAP,
} from '../engine/journey4.js?v=2.12.0';
import { getState } from '../state.js?v=2.12.0';

const MAX_PLAYERS = 6;
const MIN_PLAYERS = 2;
// Backing another seat is the game's only cooperative resource, and it is
// finite on purpose. Social capital in a real life is finite too: you can
// vouch for people, but not endlessly, so you spend it on someone who needs
// it. Two per seat is enough that every table uses it and no table mashes it.
const BACKS_PER_SEAT = 2;
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
    helper: null,
    helps: 0,
    players: Array.from({ length: n }, (_, i) => {
      const run = createRun(startAge, `Seat ${i + 1}`, null, st.plan);
      run.seed = seed;              // one deck, dealt to everybody
      run.short = true;
      run.classSeed = raw;
      return {
        name: names[i] || `Player ${i + 1}`, run, lastChoices: [], lastCard: null,
        backs: BACKS_PER_SEAT, helped: 0, spoke: 0,
      };
    }),
  };
  picked = [];
  repaint();
}

const me = () => T.players[T.turn];
// Reflect stages are solo beats the table skips, so they are not rounds.
const rounds = (data) => sequenceFor(data.journey, T.players[0].run)
  .filter((s) => (s.format || 'turn') !== 'reflect').length;

// --------------------------------------------------------------------------
// A turn

function turnScreen(host, data) {
  const t = data.copy.table;
  const p = me();
  const stage = currentStage(data.journey, p.run);
  if (!stage) { T.phase = 'ending'; return repaint(); }
  const age = ageAt(data.journey, p.run, p.run.stepIndex);

  // Results eve is written for one student alone with a phone the night before.
  // A table of six cannot hold that silence, so every seat sits with it unwritten
  // and the game moves to results day. The solo game is where the words happen.
  if ((stage.format || 'turn') === 'reflect') {
    T.players.forEach((x) => {
      const s2 = currentStage(data.journey, x.run);
      if (s2 && (s2.format || 'turn') === 'reflect') applyReflection(x.run, data.journey, s2, '');
    });
    return repaint();
  }
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
                ${c.capacity && p.run.capacity < CAPACITY_CAP ? `<span class="c-chips"><span class="grow-tag">${esc(data.copy.journey.growTag)}</span></span>` : ''}
                ${need ? `<span class="fork-need">${esc(need)}</span>` : ''}
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
  // The ask is only offered when it would change something. A card whose hard
  // answer this player can already reach on their own does not need the table,
  // and a button that does nothing teaches nothing.
  const stretch = (card.responses || []).find((r) => r.needsAsk);
  const wouldHelp = !!stretch && !askMet(p.run, card);
  const others = T.players.filter((x) => x !== p);
  const canBack = others.filter((o) => (o.backs || 0) > 0);
  host.innerHTML = `
    <div class="wrap">
      <div class="tgame fade-up">
        ${boardStrip(data)}
        <div class="chance">
          <p class="caps">${esc(p.name)}${esc(t.dealt)}</p>
          <h1 class="serif" tabindex="-1">${esc(card.title)}</h1>
          <p class="lede">${decorate(card.body)}</p>
          ${T.helper ? `<p class="tbacked">${esc(fill(t.askedBy, { helper: T.helper, asker: p.name }))}</p>` : ''}
          ${/* The ask comes before the answers, because it changes which of
                them the year will actually give you. */ ''}
          ${!T.helper && wouldHelp && others.length ? `
            <div class="tasktable">
              <p class="caps">${esc(t.askHead)}</p>
              <p class="small mute">${esc(t.askBody)}</p>
              ${canBack.length ? `
                <p class="micro mute" style="margin-top:var(--s-3)">${esc(t.askWho)}</p>
                <div class="btn-row" style="margin-top:var(--s-2)">
                  ${canBack.map((o) => `
                    <button class="btn" type="button" data-action="helper" data-i="${T.players.indexOf(o)}">
                      ${esc(o.name)} <span class="backdots" aria-label="${o.backs} left">${'●'.repeat(o.backs)}</span>
                    </button>`).join('')}
                </div>`
              : `<p class="small mute" style="margin-top:var(--s-3)">${esc(t.askSpent)}</p>`}
            </div>` : ''}
          <div class="grid j-choices" style="margin-top:var(--s-4)">
            ${(card.responses || []).map((r, i) => `
              <button class="choice sel" type="button" data-action="respond" data-i="${i}">
                <span class="c-label">${esc(r.label)}</span>
                ${r.needsAsk && T.helper ? `<span class="c-chips"><span class="near-chip">${esc(t.helpTag)}</span></span>` : ''}
              </button>`).join('')}
          </div>
        </div>
      </div>
    </div>`;
  focusHead(host);
  bindGlossary(host);
  onAction(host, {
    // Someone at the table vouches. The harder answer becomes possible for the
    // asker, and the helper is credited: this is the only mechanic in the game
    // where one player's turn improves another player's year.
    helper: (btn) => {
      const h = T.players[Number(btn.dataset.i)];
      if (!h || (h.backs || 0) <= 0) return;
      T.helper = h.name;
      h.backs -= 1;
      h.helped = (h.helped || 0) + 1;
      // Vouching for someone is how you come to know people, so the seat that
      // spends the back gains the network, not the one that receives it.
      h.run.ledger.network = Math.min(24, h.run.ledger.network + 1);
      T.helps = (T.helps || 0) + 1;
      cue('door');
      repaint();
    },
    respond: (btn) => {
      respondToChance(p.run, card, Number(btn.dataset.i), T.helper || null);
      const step = p.run.steps[p.run.steps.length - 1];
      p.lastCard = step && step.chance ? step.chance : null;
      p.lastHelper = T.helper || null;
      T.helper = null;
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
  // How many ways the one card actually went, which is not the seat count: two
  // seats can answer identically, and then the headline should say so.
  const ways = new Set(T.players.map((p) => (p.lastCard ? p.lastCard.response : ''))).size;
  const sameHead = ways > 1 ? fill(t.revealSame, { n: ways }) : t.revealSameOne;
  cue('door');
  host.innerHTML = `
    <div class="wrap">
      <div class="section fade-up" style="margin-top:var(--s-5)">
        ${boardStrip(data)}
        <p class="caps">${esc(t.revealHead)}</p>
        <h1 class="serif" tabindex="-1">${esc(anyCard && sameCard ? sameHead : t.revealTitle)}</h1>
        <div class="treveal">
          ${T.players.map((p) => `
            <article class="tcard">
              <p class="tcard-name">${esc(p.name)}</p>
              <ul class="tcard-list">
                ${(p.lastChoices || []).map((c) => `<li>${esc(c)}</li>`).join('') || `<li class="mute">${esc(t.nothingYet)}</li>`}
              </ul>
              ${p.lastCard ? `
                <p class="tcard-card"><span class="tcard-deal">${esc(p.lastCard.title)}</span>
                  <span class="tcard-took">${esc(t.took)}: ${esc(p.lastCard.response)}</span></p>` : ''}
              ${p.lastHelper ? `<p class="tcard-help">${esc(fill(t.askedBy, { helper: p.lastHelper, asker: p.name }))}</p>` : ''}
              ${p.run.doors.length ? `
                <p class="chips doorchips small">${p.run.doors.slice(-3).map((d) => `<span>${icon(d)}${esc(doorLabel(data, d))}</span>`).join('')}</p>` : ''}
            </article>`).join('')}
        </div>
        ${(() => {
          const b = between(data);
          if (!b.roads && !b.doors && !b.moves) return '';
          const solo = T.players.length > 1 && (b.roads ? b.roads === 1 : b.moves === 1);
          return `
            <div class="tbetween">
              <p class="caps">${esc(t.sharedHead)}</p>
              <p>${b.roads
                ? esc(fill(t.sharedRoads, { n: b.roads, total: b.total }))
                : esc(b.moves === 1 ? t.sharedMoves1 : fill(t.sharedMoves, { n: b.moves }))}
                 ${b.doors ? esc(doorsLine(t, b.doors)) : ''}</p>
              ${solo ? `<p class="small mute">${esc(t.sharedNudge)}</p>` : ''}
            </div>`;
        })()}
        <div class="panel tight" style="margin-top:var(--s-4)">
          <p class="caps">${esc(t.talkHead)} <span class="cc-tag">${esc(prompt(data).cc || '')}</span></p>
          <p>${esc(prompt(data).q || '')}</p>
          ${(() => {
            const note = tableNote(data, T.players, T.round);
            return note ? `<p class="tnote">${esc(note)}</p>` : '';
          })()}
          <p class="tfloor">${esc(fill(t.floor, { name: floorSeat().name }))}</p>
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
      else {
        // A new round starts with nothing carried over, or a seat that draws no
        // card this year would still be shown last year's card as if it were
        // this year's news.
        T.players.forEach((x) => { x.lastCard = null; x.lastHelper = null; x.lastChoices = []; });
        T.round += 1;
        T.phase = T.players.length > 1 ? 'pass' : 'turn';
      }
      repaint();
    },
  });
}

function prompt(data) {
  const list = data.copy.table.prompts || [];
  return list[T.round % list.length] || { q: '', cc: '' };
}

/**
 * Who answers first this round.
 *
 * Rotating the floor is the cheapest classroom fix there is. Without it the
 * same confident student answers every prompt and the quiet ones learn to wait
 * it out; with it, everybody has spoken first by the time the game ends. It
 * rotates by seat, so it can never look like a ranking.
 */
const seatWithFloor = (players, round) => players[round % players.length];
const floorSeat = () => seatWithFloor(T.players, T.round);

/**
 * One true, naming sentence about this table, so the argument has somewhere to
 * start. Every note points at a difference between seats rather than at a
 * placing, and it never says better or worse.
 *
 * Takes the seats rather than reading the module's table, so the dev sweep can
 * hand it a made up table and check every branch produces a finished sentence.
 */
export function tableNote(data, players, round) {
  const t = data.copy.table;
  const notes = [];
  const count = (key) => players.filter((x) => x.run.pathLabel === key).length;

  // Alone on a road, or nobody alone at all.
  const roads = players.map((x) => x.run.pathLabel).filter(Boolean);
  const alone = players.find((x) => x.run.pathLabel && count(x.run.pathLabel) === 1);
  if (alone) notes.push(fill(t.noteAlone, { name: alone.name, road: alone.run.pathLabel }));
  else if (roads.length === players.length && new Set(roads).size === 1) {
    notes.push(fill(t.noteAllSame, { road: roads[0] }));
  }

  // A door only one seat holds.
  const held = {};
  players.forEach((x) => x.run.doors.forEach((d) => { held[d] = (held[d] || 0) + 1; }));
  const solo = players.find((x) => x.run.doors.some((d) => held[d] === 1));
  if (solo) {
    const d = solo.run.doors.find((k) => held[k] === 1);
    notes.push(fill(t.noteDoor, { name: solo.name, door: midSentence(doorLabel(data, d)) }));
  }

  // The same card, answered two different ways.
  const dealt = players.filter((x) => x.lastCard);
  for (let i = 0; i < dealt.length; i += 1) {
    for (let k = i + 1; k < dealt.length; k += 1) {
      if (dealt[i].lastCard.id === dealt[k].lastCard.id
        && dealt[i].lastCard.response !== dealt[k].lastCard.response) {
        notes.push(fill(t.noteSplit, {
          a: dealt[i].name, b: dealt[k].name, card: dealt[i].lastCard.title,
        }));
        i = dealt.length; break;
      }
    }
  }

  // Somebody spent a back this round.
  const backed = players.find((x) => x.lastHelper);
  if (backed) {
    const h = players.find((x) => x.name === backed.lastHelper);
    if (h) {
      notes.push(h.backs
        ? fill(t.noteBacked, { helper: h.name, asker: backed.name, n: h.backs })
        : fill(t.noteBacked0, { helper: h.name, asker: backed.name }));
    }
  }

  return notes.length ? notes[round % notes.length] : '';
}

/**
 * What this table has between them, rather than what any one of them has.
 *
 * The point of playing together is that a table which all picks the same road
 * learns the least, so the one running total on screen is the one that rewards
 * spreading out. It is never per player and it is never a score.
 */
function between(data) {
  const roads = new Set(T.players.map((x) => x.run.pathLabel).filter(Boolean));
  const doors = new Set(T.players.flatMap((x) => x.run.doors));
  // Roads and doors take a few years to appear. What the table has between it
  // in year one is the spread of what each seat spent the year on, so that is
  // the line that shows from the first reveal.
  const moves = new Set(T.players.flatMap((x) => x.lastChoices || []));
  const fork = (data.journey.stages || []).find((x) => x.id === 's_results');
  const total = fork ? (fork.choices || []).length : 8;
  return { roads: roads.size, total, doors: doors.size, moves: moves.size };
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
        ${(() => {
          const b = between(data);
          const helps = T.helps || 0;
          const backers = T.players.filter((x) => x.helped > 0);
          const everyone = T.round + 1 >= T.players.length;   // rounds played, not the index
          const used = [
            ['Communication and Collaboration', helps
              ? `${helps === 1 ? t.ccHelped1 : fill(t.ccHelped, { n: helps })} ${
                fill(t.ccBackers, { names: listNames(backers.map((x) => x.name)) })}`
              : t.ccHelpedNone],
            ['Social Awareness', b.roads === 1 ? t.ccRoads1 : fill(t.ccRoads, { n: b.roads })],
            ['Responsible Decision Making', doorsLine(t, b.doors)],
            ['Self Awareness', everyone ? t.ccFloorAll : t.ccFloorSome],
          ];
          return `
            <div class="section">
              <p class="caps">${esc(t.ccHead)}</p>
              <p class="small mute">${esc(t.ccNote)}</p>
              <ul class="cc-list">
                ${used.map(([name, ev]) => `
                  <li><span class="cc-tag">${esc(name)}</span> <span>${esc(ev)}</span></li>`).join('')}
              </ul>
            </div>`;
        })()}
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
  const seq = sequenceFor(data.journey, T.players[0].run)
    .filter((s) => !['ask-ns', 'reflect'].includes(s.format || 'turn'));
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
        <thead><tr><th>${esc(data.copy.table.seat)}</th><th>${esc(data.copy.table.packRoad)}</th>
          <th>${esc(data.copy.table.packDoors)}</th><th>${esc(data.copy.table.packBacked)}</th></tr></thead>
        <tbody>
          ${T.players.map((p) => `
            <tr><td>${esc(p.name)}</td><td>${esc(p.run.pathLabel || '')}</td>
            <td>${esc(p.run.doors.map((d) => doorLabel(data, d)).join(', '))}</td>
            <td>${esc(String(p.helped || 0))}</td></tr>`).join('')}
        </tbody>
      </table>
      ${/* The debrief, on paper, so the lesson does not end when the tab does. */ ''}
      <h3>${esc(data.copy.table.packTalk)}</h3>
      <ul class="pp-talk">
        ${(data.copy.table.prompts || []).map((pr) => `
          <li><strong>${esc(pr.cc)}</strong><span>${esc(pr.q)}</span></li>`).join('')}
      </ul>
    </div>`;
}

// --------------------------------------------------------------------------

function boardStrip(data) {
  const total = rounds(data);
  const r0 = T.players[0].run;
  const at = r0.stepIndex - r0.steps.filter((s) => s.format === 'reflect').length;
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

function fill(tpl, vars) {
  return String(tpl || '').replace(/\{(\w+)\}/g, (_, k) => (vars[k] == null ? '' : vars[k]));
}

/** Door labels are written to open a line. Dropped into one, they need this. */
const midSentence = (s) => String(s || '').replace(/^The /, 'the ').replace(/^A /, 'a ');

/** One door reads differently from four, and a table notices bad grammar. */
const doorsLine = (t, n) => (n === 1 ? t.sharedDoors1 : fill(t.sharedDoors, { n }));

/** "Rina", "Rina and Danish", "Rina, Danish and Cheryl". Never a ranking. */
function listNames(names) {
  const n = names.filter(Boolean);
  if (!n.length) return '';
  if (n.length === 1) return n[0];
  return `${n.slice(0, -1).join(', ')} and ${n[n.length - 1]}`;
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
    const seats = Array.from({ length: n }, (_, i) => {
      const run = createRun(15, `s${i}`, null, {});
      run.seed = 4242; run.short = true;
      return { name: `S${i}`, run, backs: BACKS_PER_SEAT, helped: 0, lastCard: null, lastHelper: null };
    });
    const players = seats.map((s) => s.run);
    let guard = 0;
    let sameFirstCard = null;
    let asksOffered = 0;
    while (guard++ < 400) {
      const live = players.filter((r) => !r.done && currentStage(data.journey, r));
      if (!live.length) break;
      live.forEach((run, k) => {
        const stage = currentStage(data.journey, run);
        if (!stage) { finish(run, data); return; }
        const fmt = stage.format || 'turn';
        const age = ageAt(data.journey, run, run.stepIndex);
        if (fmt === 'ask-ns') { answerNS(run, k % 2 === 0, stage); return; }
        if (fmt === 'reflect') { applyReflection(run, data.journey, stage, ''); return; }
        if (run.pending) {
          const card = data.chances.cards.find((c) => c.id === run.pending.cardId);
          if (run.stepIndex === 1 && k === 0) sameFirstCard = card ? card.id : null;
          // Model the ask exactly as the screen offers it: only when the card
          // has a stretch this seat cannot reach alone, and only from a seat
          // with a back left to spend.
          const seat = seats.find((s) => s.run === run);
          const wants = (card.responses || []).findIndex((r) => r.needsAsk);
          let helper = null;
          if (wants >= 0 && !askMet(run, card)) {
            asksOffered += 1;
            const giver = seats.find((s) => s !== seat && s.backs > 0);
            if (giver) { giver.backs -= 1; giver.helped += 1; helper = giver.name; }
          }
          respondToChance(run, card, helper ? wants : k % Math.max(1, (card.responses || []).length), helper);
          const last = run.steps[run.steps.length - 1];
          if (seat) { seat.lastCard = last && last.chance ? last.chance : null; seat.lastHelper = helper; }
          if (helper && !(last && last.chance && last.chance.met)) {
            failures.push({ n, card: card.id, why: 'a backed stretch still resolved as unmet' });
          }
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

    // Backing is a finite resource, spent on other people, and it can never go
    // negative or be refilled by playing on.
    seats.forEach((s, k) => {
      if (s.backs < 0 || s.backs > BACKS_PER_SEAT) failures.push({ n, seat: k, why: `backs out of range at ${s.backs}` });
      if (s.helped + s.backs !== BACKS_PER_SEAT) failures.push({ n, seat: k, why: 'backs given and backs left do not add up' });
    });
    if (!asksOffered) failures.push({ n, why: 'a whole table played and was never offered the ask' });

    // The floor rotates by seat, so over one lap everybody has answered first.
    const spoke = new Set();
    for (let round = 0; round < n; round += 1) spoke.add(seatWithFloor(seats, round).name);
    if (spoke.size !== n) failures.push({ n, why: `the floor reached only ${spoke.size} of ${n} seats in a lap` });

    // Every table note is a finished sentence with nothing left unfilled.
    for (let round = 0; round < 8; round += 1) {
      const note = tableNote(data, seats, round);
      if (note && /\{\w+\}/.test(note)) failures.push({ n, round, why: `table note left a blank: ${note}` });
      if (note && /\bundefined\b/.test(note)) failures.push({ n, round, why: `table note said undefined: ${note}` });
    }
  }
  // Every discussion prompt names the competency it exercises, or a teacher
  // cannot point at what just happened.
  ((data.copy && data.copy.table && data.copy.table.prompts) || []).forEach((pr, i) => {
    if (!pr || typeof pr !== 'object') failures.push({ prompt: i, why: 'prompt is not an object with a competency' });
    else {
      if (!pr.q) failures.push({ prompt: i, why: 'prompt with no question' });
      if (!pr.cc) failures.push({ prompt: i, why: 'prompt with no competency named' });
    }
  });
  // Every string this mode reaches for has to be in the copy file, or a table
  // plays a round with a blank where a sentence should be.
  [
    'askHead', 'askBody', 'askWho', 'askSpent', 'askedBy', 'helpTag',
    'sharedHead', 'sharedRoads', 'sharedDoors', 'sharedDoors1', 'sharedNudge',
    'sharedMoves', 'sharedMoves1',
    'floor', 'noteAlone', 'noteAllSame', 'noteDoor', 'noteSplit', 'noteBacked', 'noteBacked0',
    'ccHead', 'ccNote', 'ccHelped', 'ccHelped1', 'ccBackers', 'ccHelpedNone',
    'ccRoads', 'ccRoads1', 'ccFloorAll', 'ccFloorSome',
    'revealTitle', 'revealSame', 'revealSameOne', 'took', 'packBacked', 'packTalk',
  ].forEach((k) => {
    if (!((data.copy && data.copy.table) || {})[k]) failures.push({ key: k, why: 'table copy missing' });
  });
  const ok = failures.length === 0;
  console.log(
    `%cTable game: ${ok ? 'PASS' : 'FAIL'} (${MIN_PLAYERS} to ${MAX_PLAYERS} seats simulated)`,
    ok ? 'color:#2F7D5B;font-weight:700' : 'color:#B23A2A;font-weight:700'
  );
  if (!ok) console.table(failures.slice(0, 20));
  return { ok, failures };
}
