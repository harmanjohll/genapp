// Two vocabularies, one look.
//
// Plain words are the default: a first-time student should never have to
// learn a metaphor before they can read an answer. Line mode turns on the
// transit vocabulary (departures, tickets, a pass) for students who enjoy
// it; the visuals are the same in both. The choice is stored on the device.

import { getState } from '../state.js?v=4.0.0';

const WORDS = {
  plain: {
    answer: 'What is open',
    answerFrom: (y) => `What your ${y} levels open`,
    state_open: 'Open',
    'state_within-reach': 'Nearly',
    'state_longer-route': 'Further',
    'state_other-route': 'Another way in',
    move: 'Move',
    nextMove: 'Your next move',
    moreMoves: 'More moves',
    pairMoves: 'Two moves together',
    movesTab: 'Next move',
    keep: 'Save',
    kept: 'Saved',
    keptList: 'Saved moves',
    keptCount: (n) => `${n} ${n === 1 ? 'move' : 'moves'} saved`,
    noneKept: 'No moves saved yet. Every move has a Save button.',
    plan: 'My plan',
    years: 'Your school years',
  },
  line: {
    answer: 'Departures',
    answerFrom: (y) => `Departures from ${y}`,
    state_open: 'Open',
    'state_within-reach': 'Nearly',
    'state_longer-route': 'Longer',
    'state_other-route': 'Other road',
    move: 'Ticket',
    nextMove: 'Your best ticket',
    moreMoves: 'More tickets',
    pairMoves: 'Two tickets together',
    movesTab: 'Tickets',
    keep: 'Keep',
    kept: 'Kept',
    keptList: 'Tickets kept',
    keptCount: (n) => `${n} ${n === 1 ? 'ticket' : 'tickets'} kept`,
    noneKept: 'No tickets kept yet. Every ticket has a Keep button.',
    plan: 'My pass',
    years: 'The line',
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

export function stateWord(state) {
  return t(`state_${state}`);
}
