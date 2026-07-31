// The Long View ribbon.
//
// Persistent across every mode. Its whole job is proportion: secondary school
// is a small band at the far left, and most of the strip is the life after it.
// The visual does the argument before anyone reads a word.

import { el, esc, onAction } from './dom.js';
import { currentYear } from '../state.js';

let root = null;
let data = null;
let dialog = null;

export function mountRibbon(container, lifelong) {
  data = lifelong;
  root = el('div', { class: 'ribbon', role: 'region', 'aria-label': 'The long view, from age 12 to 65' });
  container.appendChild(root);
  render();
  return root;
}

export function updateRibbon() {
  if (root) render();
}

function pct(age) {
  const { from, to } = data.ribbon;
  return ((age - from) / (to - from)) * 100;
}

function render() {
  const you = currentYear().age;
  const bands = data.bands.map((b) => {
    const left = pct(b.from);
    const width = pct(b.to + 1) - left;
    return `
      <div class="ribbon-band ${b.tone}" style="left:${left}%;width:${width}%"></div>
      <span class="ribbon-band-label" style="left:${left}%">${esc(b.label)}</span>`;
  }).join('');

  const marks = data.markers.map((m) => `
    <button type="button" class="ribbon-mark" style="left:${pct(m.age)}%"
            data-action="mark" data-age="${m.age}"
            aria-label="Age ${m.age}: ${esc(m.title)}"></button>`).join('');

  root.innerHTML = `
    <div class="ribbon-inner">
      <div class="ribbon-caption">
        <span>${esc(data.ribbon.caption)}</span>
        <span class="no-print">age ${data.ribbon.from} to ${data.ribbon.to}</span>
      </div>
      <div class="ribbon-track">
        ${bands}
        ${marks}
        <div class="ribbon-you" style="left:${pct(you)}%" aria-hidden="true"></div>
      </div>
    </div>`;

  onAction(root, {
    mark: (btn) => openMarker(Number(btn.dataset.age)),
  });
}

function openMarker(age) {
  const m = data.markers.find((x) => x.age === age);
  if (!m) return;
  if (!dialog) {
    dialog = el('dialog', { class: 'sheet' });
    document.body.appendChild(dialog);
  }
  const link = m.url
    ? `<p class="micro"><a href="${esc(m.url)}" target="_blank" rel="noopener">Where this comes from</a></p>`
    : '';
  const prov = m.status === 'provisional'
    ? `<p class="micro mute">This figure has not been read from a primary source. Check it before relying on it.</p>`
    : '';
  dialog.innerHTML = `
    <div class="sheet-body">
      <button class="btn ghost small close" data-action="close" type="button">Close</button>
      <p class="caps">Age ${m.age}</p>
      <h2>${esc(m.title)}</h2>
      <p>${esc(m.body)}</p>
      ${link}${prov}
    </div>`;
  onAction(dialog, { close: () => dialog.close() });
  dialog.showModal();
}
