// Compare: what if one or two levels were different?
//
// Plan A is the student's own plan for the year. Plan B starts as a copy and
// is changed here, freely, without touching Plan A. The page leads with what
// B changes, place by place, then the table, then B's levels. "Use Plan B"
// is the only thing that writes to the real plan.

import { getState, setScenario, replaceYearPlan, YEARS } from '../state.js?v=6.0.0';
import { reach } from '../engine/reach.js?v=6.0.0';
import { evalPlan, subjectsForYear, PLAN_YEARS } from '../engine/years.js?v=6.0.0';
import { listNames } from '../engine/advice.js?v=6.0.0';
import { subjTile } from './year.js?v=6.0.0';
import { esc, onAction } from '../ui/dom.js?v=6.0.0';
import { icon } from '../ui/icons.js?v=6.0.0';
import { stateWord, openWord } from '../ui/labels.js?v=6.0.0';

const LABEL = Object.fromEntries(YEARS.map((y) => [y.id, y.label]));
const RANK = { open: 0, 'within-reach': 1, 'longer-route': 2, 'other-route': 3 };

function rows(api, y, plan) {
  const c = api.ctx();
  const ep = evalPlan(y, plan, c.subjects);
  return c.destinations.map((d) => reach(ep, d, { ...c, plan: ep, yearId: y }));
}

function headline(a, b) {
  const better = b.filter((r, i) => r.distance < a[i].distance);
  const worse = b.filter((r, i) => r.distance > a[i].distance);
  if (!better.length && !worse.length) return { h: 'No change yet', p: 'Change a level in Plan B below.' };
  const opened = better.filter((r, i) => r.state === 'open' && a[b.indexOf(r)].state !== 'open').map((r) => r.railName);
  const closer = better.filter((r) => !opened.includes(r.railName)).map((r) => r.railName);
  const word = b[0] && b[0].lens === 'lower' ? 'on track' : 'open';
  const parts = [];
  if (opened.length) parts.push(`${listNames(opened)} ${opened.length > 1 ? 'are' : 'is'} ${word}`);
  if (closer.length) parts.push(`${listNames(closer)} ${closer.length > 1 ? 'come' : 'comes'} closer`);
  if (worse.length) parts.push(`${listNames(worse.map((r) => r.railName))} ${worse.length > 1 ? 'need' : 'needs'} more moves`);
  return { h: `With Plan B, ${parts[0]}`, p: parts.slice(1).join('. ') + (parts.length > 1 ? '.' : '') };
}

export default {
  id: 'compare',
  title: 'Compare',
  era: 'school',

  render(root, api) {
    const st = getState();
    const c = api.ctx();
    const q = api.route().q;
    const withPlans = PLAN_YEARS.filter((y) => Object.keys(st.plans[y] || {}).length);
    const y = (q.y && PLAN_YEARS.includes(q.y)) ? q.y : (st.yearSet && st.year !== 'p6' && Object.keys(st.plans[st.year] || {}).length ? st.year : (withPlans[0] || 'sec2'));
    const A = st.plans[y] || {};
    if (!Object.keys(A).length) {
      root.innerHTML = `<div class="wrap-narrow cmpwrap"><p class="ph-k">What if</p><h1>Compare two plans</h1>
        <p class="lede">Set your ${esc(LABEL[y])} levels first. Then try a different level here and see what changes.</p>
        <p><button type="button" class="btn press" data-action="go" data-s="path" data-y="${y}">Set your levels ${icon('arrow')}</button></p></div>`;
      return;
    }
    const B = st.scenario && st.scenario.yearId === y ? st.scenario.plan : { ...A };
    const ra = rows(api, y, A); const rb = rows(api, y, B);
    const hl = headline(ra, rb);
    const goal = st.goal && st.goal.dest;
    const order = c.destinations.map((d, i) => i).sort((i, j) => (c.destinations[i].id === goal ? -1 : c.destinations[j].id === goal ? 1 : 0));
    const tiles = subjectsForYear(y, c.subjects, c.offer).filter((s) => (s.levels || []).length);
    const changed = tiles.filter((s) => (A[s.id] || null) !== (B[s.id] || null));
    root.innerHTML = `
    <div class="wrap-narrow cmpwrap">
      <p class="ph-k">What if</p>
      <h1>Compare two ${esc(LABEL[y])} plans</h1>
      ${withPlans.length > 1 ? `<div class="segtabs compact" role="tablist" aria-label="Year">${withPlans.map((x) => `<button type="button" role="tab" class="segtab press" data-action="go" data-s="compare" data-y="${x}" aria-selected="${x === y}">${esc(LABEL[x])}</button>`).join('')}</div>` : ''}
      <section class="cmp-head arrive" data-change="${hl.h !== 'No change yet'}">
        <p class="cmp-h">${esc(hl.h)}.</p>
        ${hl.p ? `<p class="small">${esc(hl.p)}</p>` : ''}
        ${changed.length ? `<p class="small">Plan B changes ${esc(listNames(changed.map((s) => `${s.shortName || s.name} to ${B[s.id] || 'none'}`)))}.</p>` : ''}
      </section>
      <table class="cmp-table">
        <thead><tr><th scope="col">Place</th><th scope="col">Plan A <small>${rb.length ? `${ra.filter((r) => r.state === 'open').length} ${openWord(ra)}` : ''}</small></th><th scope="col">Plan B <small>${rb.filter((r) => r.state === 'open').length} ${openWord(rb)}</small></th></tr></thead>
        <tbody>${order.map((i) => {
          const a = ra[i]; const b = rb[i];
          const diff = RANK[b.state] < RANK[a.state] ? 'better' : RANK[b.state] > RANK[a.state] ? 'worse' : (b.distance < a.distance ? 'closer' : '');
          return `<tr data-diff="${diff}"><th scope="row">${a.id === goal ? icon('target') : ''}${esc(a.railName)}</th>
            <td><span class="pill" data-tone="${esc(a.state)}">${esc(stateWord(a.state, a.lens))}</span></td>
            <td><span class="pill" data-tone="${esc(b.state)}">${esc(stateWord(b.state, b.lens))}</span></td></tr>`;
        }).join('')}</tbody>
      </table>
      <h2 class="advh">Plan B levels</h2>
      <p class="small">Change any level. Plan A stays as it is.</p>
      <div class="subjgrid cmp-tiles">${tiles.map((s) => subjTile(s, B, 'cmp-lvl').replace('class="subj"', `class="subj"${(A[s.id] || null) !== (B[s.id] || null) ? ' data-diff="true"' : ''}`)).join('')}</div>
      <p class="btnrow">
        <button type="button" class="btn press" data-action="cmp-use" ${changed.length ? '' : 'disabled'}>Use Plan B as my plan</button>
        <button type="button" class="btn ghost press" data-action="cmp-reset" ${changed.length ? '' : 'disabled'}>Reset Plan B</button>
      </p>
    </div>`;

    onAction(root, {
      'cmp-lvl': (btn) => {
        const { sid, level } = btn.dataset;
        const cur = getState().scenario && getState().scenario.yearId === y ? { ...getState().scenario.plan } : { ...A };
        if (cur[sid] === level) delete cur[sid]; else cur[sid] = level;
        setScenario({ yearId: y, plan: cur });
        api.setQuery({ y });
        api.refresh();
      },
      'cmp-use': () => {
        replaceYearPlan(y, B); setScenario(null);
        api.announce(`Plan B is now your ${LABEL[y]} plan.`);
        api.nav('path', { y });
      },
      'cmp-reset': () => { setScenario(null); api.refresh(); },
    });
  },
};
