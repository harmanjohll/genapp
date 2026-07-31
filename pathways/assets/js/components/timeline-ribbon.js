// The Long View ribbon.
//
// Persistent across every mode. Its whole job is proportion: secondary school is
// the small band on the far left, and most of the strip is the life after it.
// The visual does the argument, so the caption that used to explain the joke has
// gone. One label, "You are here", and ten tappable markers.
//
// Markers are spaced at least four years apart in the data, because two markers
// a year apart sit about seven pixels apart at 375px, which is a tap target
// failure and was one before.

import { el, esc, onAction } from './dom.js';
import { openSheet } from './sheet.js';
import { currentYear } from '../state.js';

let root = null;
let data = null;

export function mountRibbon(container, lifelong) {
  data = lifelong;
  root = el('div', { class: 'ribbon', role: 'region', 'aria-label': 'The long view, ages 12 to 65' });
  container.appendChild(root);
  render();
  return root;
}

export function updateRibbon() { if (root) render(); }

function pct(age) {
  const { from, to } = data.ribbon;
  return ((age - from) / (to - from)) * 100;
}

function render() {
  const you = currentYear().age;
  const bands = data.bands.map((b) => {
    const left = pct(b.from);
    const width = pct(b.to + 1) - left;
    return `<div class="ribbon-band ${b.tone}" style="left:${left}%;width:${width}%">
              <span class="ribbon-band-label">${esc(b.label)}</span>
            </div>`;
  }).join('');

  const marks = data.markers.map((m) => `
    <button type="button" class="ribbon-mark" style="left:${pct(m.age)}%"
            data-action="mark" data-age="${m.age}"
            aria-label="Age ${m.age}. ${esc(m.title)}"></button>`).join('');

  root.innerHTML = `
    <div class="ribbon-inner">
      <div class="ribbon-track">
        ${bands}${marks}
        <div class="ribbon-you" style="left:${pct(you)}%" aria-hidden="true"></div>
      </div>
      <span class="ribbon-you-label" style="${youLabelPos(pct(you))}">${esc(data.ribbon.youLabel)}</span>
    </div>`;

  onAction(root, { mark: (btn) => openMarker(Number(btn.dataset.age), btn) });
}

/**
 * A student is always near the left end of a track that runs to 65, which is
 * the entire point of the ribbon, so the centred label ran off the screen edge.
 * Near either end it anchors instead of centring.
 */
function youLabelPos(p) {
  if (p < 12) return 'left:0;transform:none';
  if (p > 88) return 'right:0;left:auto;transform:none';
  return `left:${p}%`;
}

function openMarker(age, trigger) {
  const m = data.markers.find((x) => x.age === age);
  if (!m) return;
  openSheet(`
    <p class="caps">Age ${m.age}</p>
    <h2 id="sheet-title">${esc(m.title)}</h2>
    <p>${esc(m.body)}</p>
    ${m.url ? `<p class="micro"><a href="${esc(m.url)}" target="_blank" rel="noopener">Where this comes from</a></p>` : ''}
    ${m.status === 'provisional' ? '<p class="micro mute">Not read from a primary source. Check before relying on it.</p>' : ''}`, trigger);
}
