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
  const money = costFor(row.id, data);
  const routes = (row.routes || []).slice(0, 3);

  return `
    <h2 id="sheet-title">${esc(row.name)}</h2>

    <p class="dest-l0">
      <span class="pill" data-tone="${esc(row.state)}">${esc(STATE_WORD[row.state] || row.state)}</span>
      <span class="small">${esc(row.duration || '')}${row.leadsTo ? ` · leads to ${esc(row.leadsTo)}` : ''}</span>
    </p>

    ${row.feels ? `<p>${esc(row.feels)}</p>` : ''}

    ${row.state === 'open' ? `
      <p class="notegood">${esc(row.status.text)}.</p>
    ` : `
      <p class="caps">What moves this</p>
      <ul class="dest-plain">
        ${(row.moves || []).slice(0, 3).map((m) => `<li>${esc(m.label)}</li>`).join('')}
      </ul>
      ${row.moves && row.moves.length ? `<p class="small">${esc(row.moves[0].when || '')}${row.moves[0].who ? ` · ${esc(row.moves[0].who)}` : ''}</p>` : ''}
    `}

    ${routes.length ? `
      <p class="caps">Ways in</p>
      <ul class="dest-plain">
        ${routes.map((r) => `<li><strong>${esc(r.label)}</strong>${r.years ? ` · ${esc(String(r.years))} years` : ''}${r.honest ? ` — ${esc(r.honest)}` : ''}</li>`).join('')}
      </ul>
    ` : ''}

    ${money ? `
      <p class="caps">What it costs</p>
      <p>${esc(money.fee)}${money.misc ? `. ${esc(money.misc)}` : ''}</p>
      <p class="small">${esc(money.note || '')} <a href="./?s=money">All the costs, and the help</a>.</p>
    ` : ''}

    <details class="dest-fold">
      <summary>The exact rules, with sources</summary>
      ${(row.met || []).concat(row.gap || []).map((r) => `
        <div class="rulerow">
          <span>${decorate(esc(r.label))}${r.soft ? ' <span class="small">(usually)</span>' : ''}</span>
          <span class="pill" data-tone="${r.satisfied ? 'open' : 'quiet'}">${r.satisfied ? 'met by this plan' : 'not yet in this plan'}</span>
        </div>`).join('')}
      ${(row.performance || []).map((p) => `
        <div class="rulerow">
          <span>${decorate(esc(p.label))}</span>
          <span class="small">${esc(p.note || '')}</span>
        </div>`).join('')}
      <p class="small" style="margin-top:12px">
        ${row.dataStatus === 'provisional' ? 'Some of these figures are provisional: read from summaries, not yet re-checked against the primary page. ' : ''}
        ${row.asOf ? `Checked ${esc(row.asOf)}. ` : ''}Confirm anything that matters with your ECG counsellor and at moe.gov.sg.
      </p>
    </details>
  `;
}

function costFor(destId, data) {
  const costs = (data.money && data.money.costs) || [];
  return costs.find((c) => (c.covers || []).includes(destId)) || null;
}
