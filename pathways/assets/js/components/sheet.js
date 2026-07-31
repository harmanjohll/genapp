// One bottom sheet, many contents.
//
// Replaces the two separate <dialog> elements that glossary.js and
// timeline-ribbon.js each created. Detail lives in here so the screen behind it
// can stay short: this is the mechanism that lets first paint drop by an order
// of magnitude without deleting anything a student might need.
//
// Focus is trapped while open and returned to whatever opened it.

import { el, onAction } from './dom.js';

let dlg = null;
let body = null;
let lastTrigger = null;

function ensure() {
  if (dlg) return;
  dlg = el('dialog', { class: 'sheet', 'aria-labelledby': 'sheet-title' });
  dlg.innerHTML = `
    <div class="sheet-grab" aria-hidden="true"></div>
    <div class="sheet-body" id="sheet-body" tabindex="-1"></div>
    <div class="sheet-foot"><button class="btn ghost small" data-action="sheet-close" type="button">Close</button></div>`;
  document.body.appendChild(dlg);
  body = dlg.querySelector('.sheet-body');

  onAction(dlg, { 'sheet-close': () => close() });

  // Tap the backdrop to dismiss. The dialog element itself fills the sheet, so
  // a click whose target is the dialog is a click outside the panel.
  dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); });
  dlg.addEventListener('close', () => {
    if (lastTrigger && document.contains(lastTrigger)) lastTrigger.focus();
    lastTrigger = null;
  });
}

export function openSheet(html, trigger) {
  ensure();
  lastTrigger = trigger || document.activeElement;
  body.innerHTML = html;
  if (!dlg.open) dlg.showModal();
  body.scrollTop = 0;
  body.focus();
  return body;
}

export function sheetBody() { ensure(); return body; }

export function close() {
  if (dlg && dlg.open) dlg.close();
}

export function isOpen() { return !!(dlg && dlg.open); }

/** Bind extra actions on the sheet content. Merged, so callers do not clash. */
export function onSheetAction(handlers) {
  ensure();
  onAction(dlg, handlers);
}
