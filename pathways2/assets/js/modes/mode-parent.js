// The parent page, ?mode=parent, linked from the footer.
//
// The parent is very often the person actually driving the subject combination
// decision, working from a system that no longer exists. One calm page,
// printable, phone first, because parents arrive on their child's phone.

import { esc, onAction } from '../components/dom.js?v=2.15.0';
import { getState, currentYear, encodePlan } from '../state.js?v=2.15.0';
import { reach, sortReaches, lever } from '../engine/reach.js?v=2.15.0';
import { parentMoneyBlock } from './mode-money.js?v=2.15.0';

const fill = (t, v) => String(t || '').replace(/\{(\w+)\}/g, (_, k) => (v[k] == null ? '' : v[k]));

// Which stream the parent said they were in, for the walkthrough below. Held
// in the module, never stored: it is one tap of nostalgia, not data.
let pickedStream = null;

/**
 * The parent's own school years, translated into today's levels.
 *
 * Express, Normal Academic and Normal Technical stopped existing in 2024, but
 * they are the map every parent carries, so the translation runs FROM them: a
 * representative five-subject slate of the era, at the level band each stream
 * maps to. English, Mother Tongue, Maths, a science, a humanities.
 */
function guestPlan(data, level) {
  const all = (data.subjects && data.subjects.subjects) || [];
  const order = level === 'G3' ? ['G3', 'G2', 'G1'] : level === 'G2' ? ['G2', 'G1', 'G3'] : ['G1', 'G2', 'G3'];
  const ids = level === 'G1'
    ? ['el', 'mtl', 'maths', 'science_g1']
    : ['el', 'mtl', 'maths', 'sci_pc', 'hum_ss_geog'];
  const out = {};
  ids.forEach((id) => {
    const s = all.find((x) => x.id === id);
    const lv = s && order.find((l) => (s.levels || []).includes(l));
    if (lv) out[id] = lv;
  });
  return out;
}

/**
 * A gameplay door for the parent, at last. The child has the whole game; the
 * parent had a page of prose about it. Ten minutes as their own fourteen year
 * old self, through today's system, teaches what no explainer can: that the
 * fork is not a verdict, that doors reopen, and what their child is actually
 * being asked to decide. Opens as a guest so nothing the child saved is read
 * or touched, which is the same privacy line the rest of this page draws.
 */
function guestBlock(data, ctx) {
  const g = (data.parent || {}).guest;
  if (!g || !g.streams) return '';
  const chosen = g.streams.find((s) => s.id === pickedStream) || null;
  let opens = '';
  let cta = '';
  if (chosen && ctx) {
    const plan = guestPlan(data, chosen.level);
    const n = (data.pathways.destinations || [])
      .filter((d) => reach(plan, d, { ...ctx, plan }).state === 'open').length;
    opens = `<p class="small">${esc(fill(g.opens, { n, total: (data.pathways.destinations || []).length }))}</p>`;
    cta = `<a class="btn accent" href="./?p=${encodeURIComponent(encodePlan(plan))}&y=sec3&mode=journey&guest=1">${esc(g.cta)}</a>`;
  }
  return `
    <section class="section panel guestpanel">
      <h2 class="h-sm">${esc(g.head)}</h2>
      <p class="small">${esc(g.body)}</p>
      <p class="small" style="margin-bottom:var(--s-2)"><strong>${esc(g.q)}</strong></p>
      <div class="chip-row homeopts">
        ${g.streams.map((s) => `
          <button class="btn ghost small homeopt${pickedStream === s.id ? ' on' : ''}" type="button"
                  data-action="stream" data-id="${s.id}" aria-pressed="${pickedStream === s.id}">${esc(s.label)}</button>`).join('')}
      </div>
      ${opens}
      ${cta ? `<div class="btn-row" style="margin-top:var(--s-3)">${cta}</div>` : ''}
      <p class="micro mute" style="margin-top:var(--s-2)">${esc(g.note)}</p>
    </section>`;
}

/**
 * When the decisions actually open, as rows a parent can put in a calendar.
 * The months are deliberately rough and say so: the order is the knowledge,
 * and no row is official.
 */
function windowsBlock(data) {
  const p = data.parent || {};
  const rows = p.windows || [];
  if (!rows.length) return '';
  return `
    <section class="section">
      <h2 class="h-sm">${esc(p.windowsHead || '')}</h2>
      <ol class="windowlist">
        ${rows.map((w) => `
          <li>
            <p class="window-when caps">${esc(w.when)} <span class="cprov">Not yet verified</span></p>
            <p><strong>${esc(w.label)}.</strong> ${esc(w.what)}</p>
            <p class="micro mute">Check: ${esc(w.check)}</p>
          </li>`).join('')}
      </ol>
      <p class="micro mute">${esc(p.windowsNote || '')}</p>
    </section>`;
}

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
 *
 * The activities list is on the private side of that line and the reason is
 * worth stating rather than leaving to be inferred. A student can tick that
 * they are looking after somebody at home, or helping in a family business.
 * Those are exactly the entries a child might not want read over their
 * shoulder by the adult they are looking after or working for, and a page that
 * surfaced them would teach students not to tick them, which would cost the
 * app the truest thing it knows about their week. Not shown, and said so.
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
        ${guestBlock(data, ctx)}
        ${parentMoneyBlock(data)}

        ${p.sections.map((s) => `
          <section class="section">
            <h2 class="h-sm">${esc(s.head)}</h2>
            ${s.body ? `<p>${esc(s.body)}</p>` : ''}
            ${s.items ? `<ol style="padding-left:1.2em">${s.items.map((i) => `<li style="margin-bottom:var(--s-2)">${esc(i)}</li>`).join('')}</ol>` : ''}
            ${s.links ? `<p class="small">${s.links.map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join(' · ')}</p>` : ''}
          </section>`).join('')}
        ${windowsBlock(data)}
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
  onAction(host, {
    print: () => window.print(),
    stream: (btn) => { pickedStream = btn.dataset.id; renderParent(host, data, ctx); },
  });
}
