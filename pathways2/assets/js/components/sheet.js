// One bottom sheet, many contents.
//
// Replaces the two separate <dialog> elements that glossary.js and
// timeline-ribbon.js each created. Detail lives in here so the screen behind it
// can stay short: this is the mechanism that lets first paint drop by an order
// of magnitude without deleting anything a student might need.
//
// Focus is trapped while open and returned to whatever opened it.

import { el, onAction } from './dom.js?v=2.8.0';

let dlg = null;
let body = null;
let foot = null;
let lastTrigger = null;

const CLOSE_BTN = '<button class="btn ghost small" data-action="sheet-close" type="button">Close</button>';

function ensure() {
  if (dlg) return;
  dlg = el('dialog', { class: 'sheet', 'aria-labelledby': 'sheet-title' });
  dlg.innerHTML = `
    <div class="sheet-grab" aria-hidden="true"></div>
    <div class="sheet-body" id="sheet-body" tabindex="-1"></div>
    <div class="sheet-foot">${CLOSE_BTN}</div>`;
  document.body.appendChild(dlg);
  body = dlg.querySelector('.sheet-body');
  foot = dlg.querySelector('.sheet-foot');

  onAction(dlg, { 'sheet-close': () => close() });

  // Tap the backdrop to dismiss. The dialog element itself fills the sheet, so
  // a click whose target is the dialog is a click outside the panel.
  dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); });
  dlg.addEventListener('close', () => {
    if (lastTrigger && document.contains(lastTrigger)) lastTrigger.focus();
    lastTrigger = null;
  });
}

/**
 * Open the sheet.
 *
 * `footHtml` is the part that must never scroll away. The body is a scroll
 * region capped at the sheet height, so a sheet whose whole point is a button
 * put that button below the fold on a 658px phone and the student saw only
 * explanatory text with nothing to press. Anything a person has to do goes in
 * the foot, which is pinned; anything they only have to read goes in the body.
 */
export function openSheet(html, trigger, footHtml) {
  ensure();
  lastTrigger = trigger || document.activeElement;
  body.innerHTML = html;
  foot.innerHTML = footHtml ? `${footHtml}${CLOSE_BTN}` : CLOSE_BTN;
  foot.classList.toggle('has-actions', !!footHtml);
  if (!dlg.open) dlg.showModal();
  body.scrollTop = 0;
  body.focus();
  return body;
}

export function sheetBody() { ensure(); return body; }

/**
 * Replace the pinned actions without touching the body.
 *
 * A sheet that repaints its own body as you tap (the subject picker counts what
 * you have chosen) needs its foot to keep up, and reopening the whole sheet to
 * do that would throw the reader back to the top of a two thousand pixel list.
 */
export function setSheetFoot(footHtml) {
  ensure();
  foot.innerHTML = footHtml ? `${footHtml}${CLOSE_BTN}` : CLOSE_BTN;
  foot.classList.toggle('has-actions', !!footHtml);
}

export function close() {
  if (dlg && dlg.open) dlg.close();
}

export function isOpen() { return !!(dlg && dlg.open); }

/** Bind extra actions on the sheet content. Merged, so callers do not clash. */
export function onSheetAction(handlers) {
  ensure();
  onAction(dlg, handlers);
}
