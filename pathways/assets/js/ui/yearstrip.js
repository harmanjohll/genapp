// The year line: school drawn as one transit line.
//
// P6, Sec 1 to Sec 5, then After, as stations on a single yellow track,
// grouped by phase. A station with something saved has a filled core; the
// station the student said they are in carries a YOU tag; the page being
// viewed is where the train stands. Moving between years, the train glides
// from the last station to the new one: the one animation in the app that
// is pure wayfinding, so it is the one that always plays (unless motion is
// reduced).

import { esc } from './dom.js?v=4.4.0';
import { icon } from './icons.js?v=4.4.0';

export const STRIP = [
  { id: 'p6', label: 'P6', name: 'Primary 6', code: 'P6', phase: 'Primary' },
  { id: 'sec1', label: 'Sec 1', name: 'Sec 1', code: 'S1', phase: 'Lower Sec' },
  { id: 'sec2', label: 'Sec 2', name: 'Sec 2', code: 'S2', phase: 'Lower Sec' },
  { id: 'sec3', label: 'Sec 3', name: 'Sec 3', code: 'S3', phase: 'Upper Sec' },
  { id: 'sec4', label: 'Sec 4', name: 'Sec 4', code: 'S4', phase: 'Upper Sec' },
  { id: 'sec5', label: 'Sec 5', name: 'Sec 5', code: 'S5', phase: 'Upper Sec' },
  { id: 'after', label: 'After', name: 'After Sec', code: 'AS', phase: 'After' },
];

export function hasData(id, st) {
  if (id === 'p6') return ['el', 'mtl', 'maths', 'science'].some((k) => st.psle && st.psle[k] && (st.psle[k].al || st.psle[k].grade));
  if (id === 'after') return Object.keys(st.plan || {}).length > 0;
  return Object.keys((st.plans && st.plans[id]) || {}).length > 0;
}

// Where the train last stood, so the next render can glide from there.
let lastPos = null;

/** @param {string|null} here the page being shown ('p6'..'sec5', 'after', or null) */
export function yearStrip(here, st) {
  const pos = STRIP.findIndex((y) => y.id === here);
  const from = lastPos == null || pos < 0 ? pos : lastPos;
  if (pos >= 0) lastPos = pos;
  const phases = [
    { name: 'Primary', span: [1, 1] },
    { name: 'Lower Sec', span: [2, 3] },
    { name: 'Upper Sec', span: [4, 6] },
    { name: 'After', span: [7, 7] },
  ];
  return `
  <nav class="yline" aria-label="School years">
    <div class="yline-in" style="--n:${STRIP.length}">
      <div class="yline-phases" aria-hidden="true">
        ${phases.map((p) => `<span>${esc(p.name)}</span>`).join('')}
      </div>
      <div class="yline-rail">
      <ol class="yline-track">
        ${STRIP.map((y) => {
          const filled = hasData(y.id, st);
          const now = st.yearSet && st.year === y.id;
          const label = `${y.name}${now ? ', the year you are in' : ''}${filled ? ', has your plan' : ''}`;
          return `<li>
            <button type="button" class="ystn press" data-action="${y.id === 'after' ? 'go' : 'yr-go'}" data-s="${y.id === 'after' ? 'after' : 'year'}" data-y="${y.id}"
              aria-current="${here === y.id ? 'page' : 'false'}" aria-label="${esc(label)}" data-filled="${filled}" data-now="${now}">
              ${now ? '<span class="ystn-you" aria-hidden="true">You</span>' : ''}
              <i class="ystn-dot" aria-hidden="true"></i>
              <span class="ystn-code" aria-hidden="true">${esc(y.code)}</span>
              <span class="ystn-name" aria-hidden="true">${esc(y.label)}</span>
            </button>
          </li>`;
        }).join('')}
      </ol>
      ${pos >= 0 ? `<span class="yline-train" data-from="${from}" data-to="${pos}" style="--pos:${from}" aria-hidden="true">${icon('train')}</span>` : ''}
      </div>
    </div>
  </nav>`;
}

/** Glide the train after the strip is in the DOM. */
export function runStrip(root) {
  const t = root.querySelector('.yline-train');
  if (!t) return;
  const to = t.dataset.to;
  if (t.dataset.from === to) return;
  requestAnimationFrame(() => requestAnimationFrame(() => { t.style.setProperty('--pos', to); }));
}
