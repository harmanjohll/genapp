// The map. v3's one drawing, used everywhere: the home screen, the welcome
// reveal, Plan's live pips, the board. Eight destinations as stations, eight
// coloured threads that run together through "now" and peel off one by one,
// because that is the app's whole argument drawn as a picture: every road
// runs through where you are standing.
//
// Rules this file enforces by construction:
// - Topological, never metric. Row spacing is constant; the threads do not
//   encode distance, effort, or worth. v1 drew distance once and its own
//   postmortem called the picture a ceiling. Never again.
// - Data order, always. reach() returns `order` so that no list in this app
//   quietly re-sorts into a ranking under a student's fingers.
// - Line hues (full chroma) live only on these strokes. The words beside
//   them use the quiet ink and wash voices.
// - The SVG is decoration; the list is the surface. Screen readers get the
//   real names and status lines as buttons, not a drawing.

import { esc } from './dom.js?v=3.0.0';

const LINE_HUE = {
  'open':         'var(--line-open)',
  'within-reach': 'var(--line-within)',
  'longer-route': 'var(--line-longer)',
  'other-route':  'var(--line-other)',
};

const ROW = 58;        // px per station row; --rm-row in app.css must match
const PAD_TOP = 18;    // room for the platform bar
const ART_W = 96;      // drawing column width
const STATION_X = 74;  // roundel centre
const PEEL = 30;       // how far above its row a thread leaves the cable

/**
 * The fan. `reaches` is reach() output in data order.
 * opts.animate  - threads draw themselves (the welcome reveal, DRAW verb)
 * opts.tappable - rows are buttons that open the destination sheet
 * opts.compact  - tighter rows, status line dropped (the board uses this)
 */
export function railMap(reaches, opts = {}) {
  const rows = reaches.length;
  const h = PAD_TOP + rows * ROW;
  const cableW = (rows - 1) * 3.4;
  const cableX0 = (ART_W - 56) / 2 + 4;

  const threads = reaches.map((r, i) => {
    const sx = cableX0 + i * 3.4;
    const y = PAD_TOP + i * ROW + ROW / 2;
    const d = `M ${sx} ${PAD_TOP - 6} L ${sx} ${y - PEEL} Q ${sx} ${y} ${STATION_X - 10} ${y}`;
    const hue = opts.reveal ? 'var(--line-open)' : (LINE_HUE[r.state] || 'var(--line-faint)');
    const anim = opts.animate ? ` class="draw" style="animation-delay:${120 + i * 90}ms"` : '';
    return `<path d="${d}" pathLength="100" fill="none" stroke="${hue}" stroke-width="3" stroke-linecap="round"${anim}/>`
      + `<circle cx="${STATION_X}" cy="${y}" r="7" fill="var(--surface)" stroke="${hue}" stroke-width="3"${opts.animate ? ` class="rm-pop" style="animation-delay:${360 + i * 90}ms"` : ''}/>`;
  }).join('');

  // The platform bar: where all eight threads begin. The label beside it is
  // HTML (the .rm-you element) so it reads at text quality.
  const platform = `<rect x="${cableX0 - 7}" y="${PAD_TOP - 12}" width="${cableW + 14}" height="7" rx="3.5" fill="var(--ink)" opacity="0.85"/>`;

  const items = reaches.map((r, i) => {
    // In reveal mode the claim on screen is the computed invariant - every
    // destination keeps a road in - so every row says exactly that, in the
    // same voice. States belong to a plan; the reveal has none yet.
    const statusHtml = opts.reveal
      ? '<span class="rm-status" data-tone="open">a road in</span>'
      : `<span class="rm-status" data-tone="${esc(r.status.tone)}">${esc(r.status.text)}</span>`;
    const inner = `
      <span class="rm-name">${esc(r.railName || r.name)}</span>
      ${opts.compact ? '' : statusHtml}`;
    return opts.tappable
      ? `<li><button type="button" class="rm-row press" data-action="dest" data-id="${esc(r.id)}">${inner}<span class="rm-more" aria-hidden="true">›</span></button></li>`
      : `<li><span class="rm-row">${inner}</span></li>`;
  }).join('');

  return `
  <div class="railmap${opts.compact ? ' compact' : ''}" style="--rm-rows:${rows}">
    <span class="rm-you caps">You, now</span>
    <svg class="rm-art" viewBox="0 0 ${ART_W} ${h}" preserveAspectRatio="xMidYMin meet" aria-hidden="true">
      ${platform}${threads}
    </svg>
    <ol class="rm-list">${items}</ol>
  </div>`;
}

/**
 * Eight tiny stations for the sticky strip in Plan: the map, folded into a
 * pocket. Same hues, same order, no words (the strip's count and live
 * region carry the words).
 */
export function mapPips(reaches) {
  return `<span class="rm-pips" aria-hidden="true">${reaches.map((r) =>
    `<i data-state="${esc(r.state)}"></i>`).join('')}</span>`;
}

/** The one-line summary the strip and the reveal share. */
export function openCount(reaches) {
  return reaches.filter((r) => r.state === 'open').length;
}
