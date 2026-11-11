// The compass: who the student says they are, drawn.
//
// Four points, each one a thing only the student can say: what they enjoy
// (north), what they are good at (east), what matters to them (south) and
// where they are aiming (west). A point fills as the student fills it. The
// needle rests on the next point to fill and wavers until all four are in;
// then it settles on the aim.
//
// Nothing here is computed about the student. The drawing only counts what
// they tapped, so it can never say what kind of person they are.

import { esc } from './dom.js?v=7.0.0';

export const POINTS = [
  { id: 'enjoy', short: 'Enjoy', max: 2, turn: 0 },
  { id: 'strengths', short: 'Good at', max: 3, turn: 90 },
  { id: 'values', short: 'Matters', max: 3, turn: 180 },
  { id: 'goal', short: 'Aim', max: 1, turn: 270 },
];

/** The first point with nothing in it, or null when all four are filled. */
export function nextPoint(fill) {
  const p = POINTS.find((x) => !(fill[x.id] > 0));
  return p ? p.id : null;
}

/** How many of the four points have something in them. */
export function pointsFilled(fill) {
  return POINTS.filter((x) => fill[x.id] > 0).length;
}

const KITE = 'M160 46 L183 137 L160 160 L137 137 Z';

function petal(p, n, open) {
  const part = Math.min(1, n / p.max);
  // A point with one of three picked is still plainly lit, so the scale
  // starts at just over a third and grows from there.
  const scale = part > 0 ? 0.38 + 0.62 * part : 0;
  return `<g class="cp-point" data-point="${p.id}" data-open="${open === p.id}" transform="rotate(${p.turn} 160 160)">
    <path class="cp-track" d="${KITE}"/>
    ${scale ? `<path class="cp-fill" d="${KITE}" transform="translate(160 160) scale(${scale.toFixed(3)}) translate(-160 -160)"/>` : ''}
  </g>`;
}

/**
 * The compass as an SVG.
 * @param {Object} fill   { enjoy, strengths, values, goal } counts
 * @param {Object} opts   mini: no ticks, no needle, for chips and cards;
 *                        open: the point whose part is open on the page
 */
export function compassSvg(fill, { mini = false, open = null, label = '' } = {}) {
  const next = nextPoint(fill);
  const done = !next;
  const rest = POINTS.find((p) => p.id === (next || 'goal')).turn;
  const ticks = mini ? '' : Array.from({ length: 24 }, (_, i) => {
    const long = i % 6 === 0;
    return `<line class="cp-tick${long ? ' long' : ''}" x1="160" y1="${long ? 14 : 18}" x2="160" y2="${long ? 30 : 26}" transform="rotate(${i * 15} 160 160)"/>`;
  }).join('');
  const needle = mini ? '' : `
    <g class="cp-needle" data-done="${done}" style="--cp-rest:${rest}deg">
      <path class="cp-needle-n" d="M160 62 L167 160 L153 160 Z"/>
      <path class="cp-needle-s" d="M160 228 L167 160 L153 160 Z"/>
    </g>
    <circle class="cp-hub" cx="160" cy="160" r="11"/>`;
  return `<svg class="compass${mini ? ' mini' : ''}" viewBox="0 0 320 320" role="img" aria-label="${esc(label || 'Your compass')}">
    <circle class="cp-disc" cx="160" cy="160" r="156"/>
    <circle class="cp-ring" cx="160" cy="160" r="${mini ? 140 : 132}"/>
    ${ticks}
    ${POINTS.map((p) => petal(p, fill[p.id] || 0, open)).join('')}
    ${needle}
  </svg>`;
}

/** The dots under a point's name: one per pick it can hold. */
export function pips(p, n) {
  return `<span class="cp-pips" aria-hidden="true">${Array.from({ length: p.max }, (_, i) => `<i data-on="${i < n}"></i>`).join('')}</span>`;
}

/**
 * The words behind a compass, from the lists: { enjoy, strengths, values },
 * each an array of labels. Works for the student's own compass and for one
 * that arrived in a link.
 */
export function compassWords(data, c) {
  const cd = (data && data.compass) || {};
  const from = (list, ids, key = 'id') => (ids || []).map((id) => ((list || []).find((x) => x[key] === id) || {}).label).filter(Boolean);
  if (!c) return { enjoy: [], strengths: [], values: [] };
  return {
    enjoy: (((data && data.goals) || {}).interests || []).filter((x) => (c.enjoy || []).includes(x.code)).map((x) => x.label),
    strengths: from(cd.strengths, (c.strengths || []).map((r) => r.id)),
    values: from(cd.values, c.values),
  };
}

/** A compass as three short lines, for a card: enjoys, good at, cares about. */
export function compassLines(data, c) {
  const w = compassWords(data, c);
  return [['Enjoys', w.enjoy], ['Good at', w.strengths], ['Cares about', w.values]].filter(([, list]) => list.length);
}
