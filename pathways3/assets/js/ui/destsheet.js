// The destination sheet: one place, three altitudes.
//
// The v2 audit's sharpest reading-load finding was that the rulebook hit
// students at full strength on first contact: L1R4, ELMAB3(G2), MERs, all on
// one screen. v3 draws a strict ladder instead:
//   L0  the state, as one plain phrase and a colour
//   L1  what this road wants, one plain sentence per rule, no acronyms
//   L2  the exact rule, behind one fold, with its source and status
// Acronyms never appear above L2, and at L2 every term is a glossary tap.
//
// Money is context at the point of need, not a page to find: the sheet
// carries the cost line for this destination when the money file is in hand,
// and degrades to nothing when it is not.

import { esc } from './dom.js?v=3.0.0';
import { decorate } from './glossary.js?v=3.0.0';

const STATE_WORD = {
  'open': 'Open to me',
  'within-reach': 'A move away',
  'longer-route': 'A longer road',
  'other-route': 'Another road in',
};

export function destSheetHtml(row, data) {
  const open = row.state === 'open';
  // The fallback routes are the roads to still reach this when a plan does not
  // put it directly in hand. On a destination that is already open they are
  // not "ways in", they are consolation roads, and labelling them that way
  // read as a mismatch. So they only show when the direct road is not open.
  const routes = open ? [] : (row.routes || []).slice(0, 3);
  const rules = (row.met || []).concat(row.gap || []);

  return `
    <h2 id="sheet-title">${esc(row.name)}</h2>

    <p class="dest-l0">
      <span class="pill" data-tone="${esc(row.state)}">${esc(STATE_WORD[row.state] || row.state)}</span>
      <span class="small">${esc(row.duration || '')}${row.leadsTo ? ` · leads to ${esc(row.leadsTo)}` : ''}</span>
    </p>

    ${row.feels ? `<p>${esc(row.feels)}</p>` : ''}

    ${open ? `
      <p class="notegood">${esc(row.status.text)}.</p>
    ` : `
      <p class="caps">What moves this</p>
      <ul class="dest-plain">
        ${(row.moves || []).slice(0, 3).map((m) => `<li>${esc(m.label)}</li>`).join('')}
      </ul>
      ${row.moves && row.moves.length ? `<p class="small">${esc(row.moves[0].when || '')}${row.moves[0].who ? ` · ${esc(row.moves[0].who)}` : ''}</p>` : ''}
    `}

    ${routes.length ? `
      <p class="caps">Other roads to it</p>
      <ul class="dest-plain">
        ${routes.map((r) => `<li><strong>${esc(r.label)}</strong>${r.years ? ` · ${esc(String(r.years))} years` : ''}${r.honest ? `. ${esc(r.honest)}` : ''}</li>`).join('')}
      </ul>
    ` : ''}

    <details class="dest-fold">
      <summary>The exact rules, with sources</summary>
      ${rules.map((r) => `
        <div class="rulerow">
          <div class="rulerow-head">
            <span class="rulerow-label">${decorate(esc(r.label))}${r.soft ? ' <span class="small">(usually)</span>' : ''}</span>
            <span class="pill" data-tone="${r.satisfied ? 'open' : 'quiet'}">${r.satisfied ? 'met' : 'not yet'}</span>
          </div>
        </div>`).join('')}
      ${(row.performance || []).map((p) => `
        <div class="rulerow">
          <div class="rulerow-head"><span class="rulerow-label">${decorate(esc(p.label))}</span></div>
          ${p.note ? `<p class="rulerow-note">${decorate(esc(p.note))}</p>` : ''}
        </div>`).join('')}
      <p class="small" style="margin-top:12px">
        ${row.dataStatus === 'provisional' ? 'Some of these figures are provisional: read from summaries, not yet re-checked against the primary page. ' : ''}
        ${row.asOf ? `Checked ${esc(row.asOf)}. ` : ''}Confirm anything that matters with your ECG counsellor and at moe.gov.sg.
      </p>
    </details>
  `;
}
