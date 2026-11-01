// The departures board: the answer to every tap, as a transit board.
//
// Eight destinations, one row each, in data order (never ranked). The status
// column is the reach state in board words; when a tap changes a row, that
// row flips, which is the feedback a student's eye is already trained on at
// every MRT platform. Tapping a row opens the destination.
//
// Ethics carried: no row ever says closed. The weakest word on the board is
// OTHER ROAD, and it is true: every destination keeps a road in.

import { esc } from './dom.js?v=4.2.0';
import { stateWord, openWord, t } from './labels.js?v=4.2.0';

// Board words follow the reader's vocabulary (plain by default), and a lower
// secondary row reads "On track" where an upper one reads "Open now".
export const BOARD_WORD = new Proxy({}, { get: (_, k) => stateWord(String(k)) });
export function boardWord(r) { return stateWord(r.state, r.lens); }
export const LINE = {
  'open': 'var(--line-open)',
  'within-reach': 'var(--line-within)',
  'longer-route': 'var(--line-longer)',
  'other-route': 'var(--line-other)',
};

// What the board last showed, per destination, so a repaint can flip only
// the rows that changed.
const seen = new Map();

/**
 * @param {Array} rows reach() output, data order
 * @param {Object} o { key: board identity, compact: bool, title: string }
 */
export function boardHtml(rows, o = {}) {
  const key = o.key || 'main';
  const prev = seen.get(key) || {};
  const next = {};
  const open = rows.filter((r) => r.state === 'open').length;
  const html = `
  <div class="board${o.compact ? ' compact' : ''}" role="group" aria-label="${esc(o.title || t('answer'))}">
    <div class="board-top">
      <span class="board-title">${esc(o.title || t('answer'))}</span>
      <span class="board-count"><b>${open}</b>/${rows.length} ${openWord(rows)}</span>
    </div>
    <ol class="board-rows">
      ${rows.map((r) => {
        next[r.id] = r.state;
        const flip = prev[r.id] && prev[r.id] !== r.state;
        return `<li><button type="button" class="brow${flip ? ' flip' : ''}" data-action="dest" data-id="${esc(r.id)}" data-state="${esc(r.state)}">
          <i class="brow-line" style="--c:${LINE[r.state]}" aria-hidden="true"></i>
          <span class="brow-name">${esc(r.railName)}</span>
          <span class="brow-status"><span>${esc(boardWord(r))}</span></span>
          ${o.compact ? '' : `<span class="brow-next">${esc(r.status.text)}</span>`}
        </button></li>`;
      }).join('')}
    </ol>
  </div>`;
  seen.set(key, next);
  return html;
}

/** A pocket version for the phone dock: the count and eight lamps. */
export function lampsHtml(rows) {
  return `<span class="lamps" aria-hidden="true">${rows.map((r) => `<i style="--c:${LINE[r.state]}" data-state="${esc(r.state)}"></i>`).join('')}</span>`;
}
