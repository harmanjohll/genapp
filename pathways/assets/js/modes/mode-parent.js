// The parent page, ?mode=parent, linked from the footer.
//
// The parent is very often the person actually driving the subject combination
// decision, working from a system that no longer exists. One calm page,
// printable, phone first, because parents arrive on their child's phone.

import { esc, onAction } from '../components/dom.js';
import { getState, currentYear } from '../state.js';
import { reach, sortReaches, lever } from '../engine/reach.js';

const fill = (t, v) => String(t || '').replace(/\{(\w+)\}/g, (_, k) => (v[k] == null ? '' : v[k]));

/**
 * What this device already holds, shown to the parent standing next to it.
 *
 * A parent arrives on their child's phone, which means this page could show
 * everything the child has done. It deliberately does not. Subjects and what
 * they open are the factual layer, and the layer a parent is usually driving
 * anyway. What the child wrote at thirty eight, what they said they wanted,
 * and the stories they played are their own thinking, and a tool that hands
 * those to an adult unasked has broken the promise that made the child honest
 * in the first place. The page says which line it is drawing, out loud.
 */
function liveBlock(data, ctx) {
  const c = data.copy.parentLive || {};
  const st = getState();
  const n = Object.keys(st.plan || {}).length;
  if (!n || !ctx) return `<p class="small mute">${esc(c.none || '')}</p>`;
  const reaches = sortReaches((data.pathways.destinations || [])
    .map((d) => reach(st.plan, d, { ...ctx, plan: st.plan })));
  const open = reaches.filter((r) => r.state === 'open').length;
  const lev = lever(reaches);
  return `
    <p>${esc(fill(c.takes, { n, year: currentYear().label }))}
       ${esc(fill(c.opens, { n: open, total: reaches.length }))}</p>
    ${lev ? `<p class="small">${esc(fill(c.lever, { n: lev.opens ? lev.opens.length : lev.n || 0, move: lev.short }))}</p>` : ''}
    <p class="micro mute">${esc(c.privacy || '')}</p>`;
}

export function renderParent(host, data, ctx) {
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
        <section class="section aim-linked">
          <h2 class="h-sm">${esc((data.copy.parentLive || {}).head || '')}</h2>
          ${liveBlock(data, ctx)}
        </section>

        ${p.sections.map((s) => `
          <section class="section">
            <h2 class="h-sm">${esc(s.head)}</h2>
            ${s.body ? `<p>${esc(s.body)}</p>` : ''}
            ${s.items ? `<ol style="padding-left:1.2em">${s.items.map((i) => `<li style="margin-bottom:var(--s-2)">${esc(i)}</li>`).join('')}</ol>` : ''}
            ${s.links ? `<p class="small">${s.links.map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join(' · ')}</p>` : ''}
          </section>`).join('')}
        <div class="panel" style="margin-top:var(--s-5)">
          <h2 class="h-sm">${esc((data.copy.parentLive || {}).askHead || '')}</h2>
          <p class="small" style="margin-bottom:0">${esc((data.copy.parentLive || {}).askBody || '')}</p>
        </div>

        <div class="btn-row" style="margin-top:var(--s-5)">
          <button class="btn ghost" type="button" data-action="print">Print this</button>
          <a class="btn ghost" href="./">Back to the tool</a>
        </div>
      </div>
    </div>`;
  onAction(host, { print: () => window.print() });
}
