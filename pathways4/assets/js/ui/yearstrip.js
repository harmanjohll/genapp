// The year strip: where you are in school, drawn as one line of stations.
//
// v3 hid the year in a header chip that silently swapped the subject list.
// v4 makes it the spine of the app: P6, Sec 1 to Sec 5, and After, grouped
// by phase, always one tap from each other. A filled station means this
// device holds something for that year; the "now" mark is the year the
// student said they are in. Looking ahead and looking back are both allowed,
// and both are labelled as what they are.

import { esc } from './dom.js?v=4.0.0';

export const STRIP = [
  { id: 'p6', label: 'P6', phase: 'Primary' },
  { id: 'sec1', label: 'Sec 1', phase: 'Lower Sec' },
  { id: 'sec2', label: 'Sec 2', phase: 'Lower Sec' },
  { id: 'sec3', label: 'Sec 3', phase: 'Upper Sec' },
  { id: 'sec4', label: 'Sec 4', phase: 'Upper Sec' },
  { id: 'sec5', label: 'Sec 5', phase: 'Upper Sec' },
  { id: 'after', label: 'After', phase: 'After Sec' },
];

export function hasData(id, st) {
  if (id === 'p6') return ['el', 'mtl', 'maths', 'science'].some((k) => st.psle && st.psle[k] && (st.psle[k].al || st.psle[k].grade));
  if (id === 'after') return Object.keys(st.plan || {}).length > 0;
  return Object.keys((st.plans && st.plans[id]) || {}).length > 0;
}

/** @param {string} here the page being shown ('p6'..'sec5' or 'after') */
export function yearStrip(here, st) {
  const phases = [];
  STRIP.forEach((y) => {
    const last = phases[phases.length - 1];
    if (!last || last.name !== y.phase) phases.push({ name: y.phase, items: [y] });
    else last.items.push(y);
  });
  return `
  <nav class="ystrip" aria-label="School years">
    <div class="ystrip-in">
      ${phases.map((ph) => `
        <div class="ystrip-phase">
          <span class="ystrip-pname" aria-hidden="true">${esc(ph.name)}</span>
          <div class="ystrip-row">
            ${ph.items.map((y) => {
              const filled = hasData(y.id, st);
              const now = st.yearSet && st.year === y.id;
              const label = `${y.label}${now ? ', the year you are in' : ''}${filled ? ', has your levels' : ''}`;
              return `<button type="button" class="ystop press" data-action="${y.id === 'after' ? 'go' : 'yr-go'}" data-s="${y.id === 'after' ? 'after' : 'year'}" data-y="${y.id}"
                aria-current="${here === y.id ? 'page' : 'false'}" aria-label="${esc(label)}" data-filled="${filled}" data-now="${now}">
                <i class="ystop-dot" aria-hidden="true"></i>
                <span class="ystop-label">${esc(y.label)}</span>
                ${now ? '<span class="ystop-now" aria-hidden="true">now</span>' : ''}
              </button>`;
            }).join('')}
          </div>
        </div>`).join('')}
    </div>
  </nav>`;
}
