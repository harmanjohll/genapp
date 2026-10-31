// Glossary. Every acronym in this system is a barrier, and the students who ask
// what they mean are not the ones who most need to.
//
// Entries are kept a little longer than the rest of the copy budget on purpose:
// they carry the explanation load for the weakest readers, so cutting them
// hardest would cut exactly the students they exist for.

import { esc, onAction } from './dom.js';
import { openSheet } from './sheet.js';

let terms = [];
let byTerm = new Map();
let sorted = [];

export function initGlossary(glossaryData) {
  terms = (glossaryData && glossaryData.terms) || [];
  byTerm = new Map(terms.map((t) => [t.term.toLowerCase(), t]));
  // Longest first, so "Higher Nitec" wins over "Nitec".
  sorted = terms.slice().sort((a, b) => b.term.length - a.term.length);
}

/** Wrap known acronyms in plain text so they can be tapped. Escapes first. */
export function decorate(text) {
  let out = esc(text);
  sorted.forEach((t) => {
    const safe = t.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(?<![\\w>-])(${safe})(?![\\w<-])`, 'g');
    out = out.replace(re, `<button type="button" class="gloss" data-action="gloss" data-term="${esc(t.term)}">$1</button>`);
  });
  return out;
}

export function bindGlossary(container) {
  onAction(container, { gloss: (btn) => open(btn.dataset.term, btn) });
}

export function open(term, trigger) {
  const t = byTerm.get(String(term).toLowerCase());
  if (!t) return;
  openSheet(`
    <h2 id="sheet-title">${esc(t.term)}</h2>
    <p class="full">${esc(t.full)}</p>
    <p>${esc(t.plain)}</p>`, trigger);
}

export function openFullList(trigger) {
  const items = terms.map((t) => `
    <dt>${esc(t.term)} <span class="mute small">${esc(t.full)}</span></dt>
    <dd>${esc(t.plain)}</dd>`).join('');
  openSheet(`
    <h2 id="sheet-title">What the letters mean</h2>
    <dl class="glossary-list">${items}</dl>`, trigger);
}
