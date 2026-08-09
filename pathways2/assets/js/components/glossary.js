// Glossary. Every acronym in this system is a barrier, and the students who ask
// what they mean are not the ones who most need to.
//
// Entries are kept a little longer than the rest of the copy budget on purpose:
// they carry the explanation load for the weakest readers, so cutting them
// hardest would cut exactly the students they exist for.

import { esc, onAction } from './dom.js?v=2.7.0';
import { openSheet } from './sheet.js?v=2.7.0';

let terms = [];
let byTerm = new Map();
let sorted = [];

let matcher = null;

export function initGlossary(glossaryData) {
  terms = (glossaryData && glossaryData.terms) || [];
  byTerm = new Map(terms.map((t) => [t.term.toLowerCase(), t]));
  // Longest first, so "Higher Nitec" wins over "Nitec".
  sorted = terms.slice().sort((a, b) => b.term.length - a.term.length);
  const alts = sorted.map((t) => t.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  // Deliberately no lookbehind. Safari shipped it in 16.4, and this runs during
  // init outside any try, so an older iPhone would have got a blank page instead
  // of a page without tappable acronyms. The boundary character is captured and
  // put back instead, which every browser has always supported.
  matcher = alts ? new RegExp(`(^|[^\\w-])(${alts})(?![\\w-])`, 'g') : null;
}

/**
 * Wrap known acronyms in plain text so they can be tapped. Escapes first.
 *
 * ONE pass, over one alternation, longest term first. It used to run a separate
 * pass per term over its own output, which meant the "Nitec" pass matched the
 * word inside the data-term="Higher Nitec" attribute the previous pass had just
 * written. The markup shattered, and a student reading the possibilities panel
 * on an ITE chapter saw `">Higher Nitec still open to you later` in the middle of
 * a sentence. Any short term contained in a longer one had the same fault.
 */
export function decorate(text) {
  const out = esc(text);
  if (!matcher) return out;
  return out.replace(matcher, (_m, before, term) => (
    `${before}<button type="button" class="gloss" data-action="gloss" data-term="${esc(term)}">${term}</button>`
  ));
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
