// The parent page, ?mode=parent, linked from the footer.
//
// The parent is very often the person actually driving the subject combination
// decision, working from a system that no longer exists. One calm page,
// printable, phone first, because parents arrive on their child's phone.

import { esc, onAction } from '../components/dom.js';

export function renderParent(host, data) {
  const p = data.parent;
  if (!p || !p.sections) {
    host.innerHTML = '<div class="wrap"><div class="section"><p>This page did not load. Refresh, or ask the school.</p></div></div>';
    return;
  }
  host.innerHTML = `
    <div class="wrap narrow">
      <div class="section fade-up" style="margin-top:var(--s-6)">
        <p class="caps">${esc(p.title)}</p>
        <h1 class="serif" style="font-size:var(--t-h1)">${esc(p.lede)}</h1>
        ${p.sections.map((s) => `
          <section class="section">
            <h2 class="h-sm">${esc(s.head)}</h2>
            ${s.body ? `<p>${esc(s.body)}</p>` : ''}
            ${s.items ? `<ol style="padding-left:1.2em">${s.items.map((i) => `<li style="margin-bottom:var(--s-2)">${esc(i)}</li>`).join('')}</ol>` : ''}
            ${s.links ? `<p class="small">${s.links.map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join(' · ')}</p>` : ''}
          </section>`).join('')}
        <div class="btn-row" style="margin-top:var(--s-5)">
          <button class="btn ghost" type="button" data-action="print">Print this</button>
          <a class="btn ghost" href="./">Back to the tool</a>
        </div>
      </div>
    </div>`;
  onAction(host, { print: () => window.print() });
}
