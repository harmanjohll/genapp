// The live signal: the picture that carries the message.
//
// You on the left, eight destinations on the right, one wire to each. A lit
// lamp on a solid wire is open now; a dashed wire is a move or more away; a
// faint dotted wire is another way in. No wire is ever cut, because no road
// is ever closed: that is the app's whole argument, drawn so it can be read
// without a word. When a tap changes a destination, its wire redraws and its
// lamp pops, so cause and effect are visible at the moment they happen.
//
// Data order always (never ranked). SVG is decoration; the list of names and
// states is in the accessible label and in the text beside it.

import { esc } from './dom.js?v=4.1.0';
import { stateWord } from './labels.js?v=4.1.0';

export const DEST_CODE = { sec5: 'S5', arts: 'AR', hnitec: 'HN2', jc: 'JC', mi: 'MI', nitec: 'HN3', pfp: 'PFP', poly: 'PO' };

const seen = new Map();

function changedSet(key, rows) {
  const prev = seen.get(key) || {};
  const out = new Set(rows.filter((r) => prev[r.id] && prev[r.id] !== r.state).map((r) => r.id));
  seen.set(key, Object.fromEntries(rows.map((r) => [r.id, r.state])));
  return out;
}

function summary(rows) {
  return rows.map((r) => `${r.railName}: ${stateWord(r.state)}`).join('. ');
}

/**
 * The full signal.
 * @param {Array} rows reach() output in data order
 * @param {Object} o { key, caption, intro: bool (stagger the reveal) }
 */
export function signalHtml(rows, o = {}) {
  if (o.mini) return miniHtml(rows, o);
  const key = o.key || 'main';
  const changed = changedSet(key, rows);
  const open = rows.filter((r) => r.state === 'open').length;
  const H = 304; const hubY = H / 2; const lampX = 176;
  const y = (i) => 20 + i * ((H - 40) / Math.max(1, rows.length - 1));
  const wires = rows.map((r, i) => {
    const yy = y(i);
    const d = `M58 ${hubY} C 112 ${hubY}, 118 ${yy}, ${lampX - 11} ${yy}`;
    return `<path class="sg-wire${changed.has(r.id) ? ' changed' : ''}" data-state="${esc(r.state)}" d="${d}" pathLength="100" style="--i:${i}"/>`;
  }).join('');
  const lamps = rows.map((r, i) => {
    const yy = y(i);
    return `<g class="sg-lamp${changed.has(r.id) ? ' changed' : ''}" data-state="${esc(r.state)}" style="--i:${i}">
      <circle class="sg-glow" cx="${lampX}" cy="${yy}" r="17"/>
      <circle class="sg-dot" cx="${lampX}" cy="${yy}" r="10"/>
      <text class="sg-name" x="${lampX + 20}" y="${yy + 4.5}">${esc(r.railName)}</text>
    </g>`;
  }).join('');
  return `
  <figure class="signal${o.intro ? ' intro' : ''}" role="img" aria-label="${open} of ${rows.length} open. ${esc(summary(rows))}.">
    <figcaption class="sg-head">
      <span class="sg-count"><b>${open}</b> of ${rows.length} open</span>
      ${o.caption ? `<span class="sg-cap">${esc(o.caption)}</span>` : ''}
    </figcaption>
    <svg class="sg-art" viewBox="0 0 340 ${H}" aria-hidden="true">
      ${wires}
      <g class="sg-hub"><circle cx="34" cy="${hubY}" r="25"/><text x="34" y="${hubY + 4}" text-anchor="middle">YOU</text></g>
      ${lamps}
    </svg>
    <p class="sg-key" aria-hidden="true">
      <span data-k="open">Open now</span><span data-k="near">1 to 2 moves away</span><span data-k="far">3 to 5 moves away</span><span data-k="other">Another route in</span>
    </p>
  </figure>`;
}

/**
 * The mini signal: the same picture at a third of the height, short codes
 * instead of names, so it can sit above a list of switches and answer each
 * tap without pushing the switches off the screen.
 */
function miniHtml(rows, o) {
  const changed = changedSet(o.key || 'mini', rows);
  const open = rows.filter((r) => r.state === 'open').length;
  const H = 140; const hubY = H / 2; const lampX = 166;
  const y = (i) => 10 + i * ((H - 20) / Math.max(1, rows.length - 1));
  const parts = rows.map((r, i) => {
    const yy = y(i);
    return `<path class="sg-wire${changed.has(r.id) ? ' changed' : ''}" data-state="${esc(r.state)}" d="M108 ${hubY} C 138 ${hubY}, 140 ${yy}, ${lampX - 8} ${yy}" pathLength="100"/>
      <g class="sg-lamp${changed.has(r.id) ? ' changed' : ''}" data-state="${esc(r.state)}">
        <circle class="sg-glow" cx="${lampX}" cy="${yy}" r="10"/><circle class="sg-dot" cx="${lampX}" cy="${yy}" r="6"/>
        <text class="sg-code" x="${lampX + 13}" y="${yy + 3.5}">${esc(r.railName)}</text>
      </g>`;
  }).join('');
  return `
  <figure class="signal mini" role="img" aria-label="${open} of ${rows.length} open. ${esc(summary(rows))}.">
    <svg class="sg-art" viewBox="0 0 320 ${H}" aria-hidden="true">
      <g class="sg-hubtext"><text class="sg-big" x="8" y="${hubY + 12}">${open}</text><text class="sg-small" x="${open > 9 ? 48 : 30}" y="${hubY + 12}">/${rows.length}</text><text class="sg-small" x="8" y="${hubY + 30}">open</text></g>
      <circle class="sg-hubdot" cx="100" cy="${hubY}" r="9"/>
      ${parts}
    </svg>
  </figure>`;
}

/** The pocket version: eight lamps with their codes, for the dock and home. */
export function signalStrip(rows, o = {}) {
  const changed = changedSet(o.key || 'strip', rows);
  return `<span class="sgs" aria-hidden="true">${rows.map((r) => `
    <span class="sgs-l${changed.has(r.id) ? ' changed' : ''}" data-state="${esc(r.state)}"><i></i><b>${esc(DEST_CODE[r.id] || '')}</b></span>`).join('')}
  </span>`;
}
