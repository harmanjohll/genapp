// The Long View ribbon.
//
// Persistent across every mode. Its job is proportion: school is the small band
// on the far left, and most of the strip is the life after it. The visual does
// the argument, so there is no caption explaining the joke.
//
// It sits COLLAPSED by default, at 22px: bands and the "you are here" tick,
// nothing else. Measured across five viewports and four scroll positions, the
// old 88px fixed bar covered between 24 and 84 pixels of real content at every
// single position, and its label rendered 5px above its own top border, so a
// red label floated loose over the subject list.
//
// Tapping it, or reaching it with a keyboard, expands it to the full height
// with labels and all ten markers. Escape or blur collapses it again.

import { el, esc, onAction } from './dom.js?v=2.10.0';
import { openSheet } from './sheet.js?v=2.10.0';
import { currentYear } from '../state.js?v=2.10.0';

let root = null;
let data = null;
let open = false;

export function mountRibbon(container, lifelong) {
  data = lifelong;
  root = el('div', { class: 'ribbon', 'data-open': 'false' });
  container.appendChild(root);
  render();

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) setOpen(false);
  });
  // Collapse when focus leaves the ribbon entirely.
  root.addEventListener('focusout', () => {
    setTimeout(() => {
      if (open && !root.contains(document.activeElement)) setOpen(false);
    }, 0);
  });
  return root;
}

export function updateRibbon() { if (root) render(); }

function setOpen(next) {
  open = next;
  root.dataset.open = String(open);
  render();
  if (open) {
    const first = root.querySelector('.ribbon-mark');
    if (first) first.focus();
  }
}

function pct(age) {
  const { from, to } = data.ribbon;
  return ((age - from) / (to - from)) * 100;
}

function render() {
  const you = currentYear().age;
  const youPct = pct(you);

  const bands = data.bands.map((b) => {
    const left = pct(b.from);
    const width = pct(b.to + 1) - left;
    return `<div class="ribbon-band ${b.tone}" style="left:${left}%;width:${width}%">
              <span class="ribbon-band-label">${esc(b.label)}</span>
            </div>`;
  }).join('');

  const marks = open ? data.markers.map((m) => `
    <button type="button" class="ribbon-mark" style="left:${pct(m.age)}%"
            data-action="mark" data-age="${m.age}"
            aria-label="Age ${m.age}. ${esc(m.title)}"></button>`).join('') : '';

  // Collapsed, one control covers the strip and announces what it is.
  const toggle = open ? '' : `
    <button type="button" class="ribbon-toggle" data-action="expand" aria-expanded="false">
      <span class="sr-only">Your life from twelve to sixty five. Open the long view.</span>
    </button>`;

  const closer = open ? `
    <button type="button" class="ribbon-close" data-action="collapse" aria-expanded="true">
      <span class="sr-only">Close the long view</span>&times;
    </button>` : '';

  root.innerHTML = `
    <div class="ribbon-inner">
      <div class="ribbon-track">
        ${bands}${marks}
        <div class="ribbon-you" style="left:${youPct}%" aria-hidden="true"></div>
      </div>
      ${open ? `<span class="ribbon-you-label" style="${youLabelPos(youPct)}">${esc(data.ribbon.youLabel)}</span>` : ''}
      ${toggle}${closer}
    </div>`;

  onAction(root, {
    expand: () => setOpen(true),
    collapse: () => setOpen(false),
    mark: (btn) => openMarker(Number(btn.dataset.age), btn),
  });
}

/**
 * A student is always near the left end of a track that runs to 65, which is
 * the whole point of the ribbon, so a centred label ran off the screen edge.
 * Near either end it anchors instead of centring.
 */
function youLabelPos(p) {
  if (p < 14) return 'left:0;transform:none';
  if (p > 86) return 'right:0;left:auto;transform:none';
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
