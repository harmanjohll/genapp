// Two vocabularies, one look.
//
// Plain words are the default: a first-time student should never have to
// learn a metaphor before they can read an answer. Line mode turns on the
// transit vocabulary (departures, tickets, a pass) for students who enjoy
// it; the visuals are the same in both. The choice is stored on the device.

import { getState } from '../state.js?v=4.2.0';

const WORDS = {
  plain: {
    answer: 'What is open',
    answerFrom: (y) => `What your ${y} levels open`,
    // State words match the engine's distance bands (reach.js): open, within
    // 2 level moves, within 5, further. Counted, so nothing is left to guess.
    state_open: 'Open now',
    // Sec 1 and 2: nothing is open before the SEC, so an open state reads as
    // on track for what the SEC will ask.
    state_open_lower: 'On track',
    answerFromLower: (y) => `What your ${y} levels keep on track`,
    'state_within-reach': '1 to 2 moves away',
    'state_longer-route': '3 to 5 moves away',
    'state_other-route': 'Another route in',
    move: 'Move',
    nextMove: 'Your best move',
    moreMoves: 'Other moves that help',
    pairMoves: 'Two moves together',
    movesTab: 'Best moves',
    movesShort: 'Moves',
    keep: 'Save move',
    kept: 'Saved',
    keptList: 'Saved moves',
    keptCount: (n) => `${n} ${n === 1 ? 'move' : 'moves'} saved`,
    noneKept: 'No moves saved yet. Every move has a Save move button.',
    plan: 'Saved',
    planTitle: 'Your saved moves and summary',
    openPlan: 'See saved moves',
    years: 'Your school years',
    afterTitle: '8 places to go after secondary school',
    allPlaces: 'All 8 places',
  },
  line: {
    answer: 'Departures',
    answerFrom: (y) => `Departures from ${y}`,
    state_open: 'Open',
    state_open_lower: 'On track',
    answerFromLower: (y) => `Departures from ${y}`,
    'state_within-reach': 'Nearly',
    'state_longer-route': 'Longer',
    'state_other-route': 'Other road',
    move: 'Ticket',
    nextMove: 'Your best ticket',
    moreMoves: 'More tickets',
    pairMoves: 'Two tickets together',
    movesTab: 'Tickets',
    movesShort: 'Tickets',
    keep: 'Keep',
    kept: 'Kept',
    keptList: 'Tickets kept',
    keptCount: (n) => `${n} ${n === 1 ? 'ticket' : 'tickets'} kept`,
    noneKept: 'No tickets kept yet. Every ticket has a Keep button.',
    plan: 'My pass',
    planTitle: 'My pass',
    openPlan: 'Open my pass',
    years: 'The line',
    afterTitle: 'Eight lines out of secondary school',
    allPlaces: 'All eight lines',
  },
};

export function lineMode() {
  return getState().labelMode === 'line';
}

/** A label in the reader's chosen vocabulary. Functions take arguments. */
export function t(key, ...args) {
  const set = WORDS[getState().labelMode] || WORDS.plain;
  const v = key in set ? set[key] : WORDS.plain[key];
  if (typeof v === 'function') return v(...args);
  return v == null ? key : v;
}

/** The state word. Rows from reach() carry `lens`; lower years read "On track". */
export function stateWord(state, lens) {
  if (state === 'open' && lens === 'lower') return t('state_open_lower');
  return t(`state_${state}`);
}

/** "open" or "on track", for counts like "5 of 8 open". */
export function openWord(rows) {
  return rows && rows.length && rows[0].lens === 'lower' ? 'on track' : 'open';
}
