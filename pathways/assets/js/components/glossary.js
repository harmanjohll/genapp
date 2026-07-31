// Glossary. Every acronym in this system is a small barrier to entry, and the
// students who ask what they mean are usually not the ones who most need to.
//
// Any text can be run through decorate() and known terms become tappable.

import { el, esc, onAction } from './dom.js';

let terms = [];
let dialog = null;
let byTerm = new Map();

export function initGlossary(glossaryData) {
  terms = glossaryData.terms;
  byTerm = new Map(terms.map((t) => [t.term.toLowerCase(), t]));
}

/** Wrap known acronyms in plain text so they can be tapped. Escapes first. */
export function decorate(text) {
  let out = esc(text);
  // Longest first, so "Higher Nitec" wins over "Nitec".
  const sorted = terms.slice().sort((a, b) => b.term.length - a.term.length);
  sorted.forEach((t) => {
    const safe = t.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(?<![\\w>-])(${safe})(?![\\w<-])`, 'g');
    out = out.replace(re, `<button type="button" class="gloss" data-action="gloss" data-term="${esc(t.term)}">$1</button>`);
  });
  return out;
}

/** Attach glossary handling to a container that may contain decorated text. */
export function bindGlossary(container) {
  onAction(container, {
    gloss: (btn) => open(btn.dataset.term),
  });
}

export function open(term) {
  const t = byTerm.get(String(term).toLowerCase());
  if (!t) return;
  ensureDialog();
  dialog.innerHTML = `
    <div class="sheet-body">
      <button class="btn ghost small close" data-action="close" type="button">Close</button>
      <h2>${esc(t.term)}</h2>
      <p class="full">${esc(t.full)}</p>
      <p>${esc(t.plain)}</p>
    </div>`;
  onAction(dialog, { close: () => dialog.close() });
  dialog.showModal();
}

export function openFullList() {
  ensureDialog();
  const items = terms.map((t) => `
    <dt>${esc(t.term)} <span class="mute small">${esc(t.full)}</span></dt>
    <dd>${esc(t.plain)}</dd>`).join('');
  dialog.innerHTML = `
    <div class="sheet-body">
      <button class="btn ghost small close" data-action="close" type="button">Close</button>
      <h2>What the letters mean</h2>
      <p class="mute small">The system runs on acronyms. Nobody is born knowing them.</p>
      <dl class="glossary-list">${items}</dl>
    </div>`;
  onAction(dialog, { close: () => dialog.close() });
  dialog.showModal();
}

function ensureDialog() {
  if (dialog) return;
  dialog = el('dialog', { class: 'sheet' });
  document.body.appendChild(dialog);
}
