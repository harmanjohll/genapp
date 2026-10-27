// Home. v4: the year first, then one obvious next step.
//
// v3's first run asked a guess about the app's thesis, then performed a
// reveal. Good theatre, but the audit's question was usability, and the
// fastest way into a personal answer is "which year are you in?". So the
// first visit is that question (plus who is reading), and every visit after
// is a dashboard: your year, what it holds, the best next move, and the
// three other places.

import { getState, setYear, YEARS, markWelcome, isGuest, setRole } from '../state.js?v=4.0.0';
import { reach } from '../engine/reach.js?v=4.0.0';
import { evalPlan } from '../engine/years.js?v=4.0.0';
import { advise } from '../engine/advice.js?v=4.0.0';
import { openCount, mapPips } from '../ui/map.js?v=4.0.0';
import { yearStrip } from '../ui/yearstrip.js?v=4.0.0';
import { esc, onAction } from '../ui/dom.js?v=4.0.0';
import { icon } from '../ui/icons.js?v=4.0.0';

const ROLE = { student: 'Student', parent: 'Parent', teacher: 'Teacher' };

export default {
  id: 'home',
  title: 'Home',
  era: 'school',
  render(root, api) {
    const st = getState();
    if (!st.yearSet) return renderFirst(root, api);
    return renderHome(root, api);
  },
};

function renderFirst(root, api) {
  const st = getState();
  root.innerHTML = `
  <div class="wrap-narrow hero first">
    <p class="kicker caps">For Singapore students, parents and teachers</p>
    <h1 class="arrive">Plan secondary school, one year at a time.</h1>
    <p class="lede arrive d1">See what each subject level opens, get advice that names the exact move, and take the right questions to the right person.</p>

    <p class="caps arrive d2" style="margin-top:28px">Who is reading?</p>
    <div class="rolegrid arrive d2" role="radiogroup" aria-label="Who is reading">
      ${Object.entries(ROLE).map(([id, l]) => `<button type="button" role="radio" class="btn ${st.role === id ? '' : 'ghost'} press" data-action="hm-role" data-id="${id}" aria-checked="${st.role === id}">${esc(l)}</button>`).join('')}
    </div>

    <p class="caps arrive d3" style="margin-top:24px">${st.role === 'student' ? 'Which year are you in?' : st.role === 'parent' ? 'Which year is your child in?' : 'Which year is the student in?'}</p>
    <div class="yeargrid big arrive d3">
      ${YEARS.map((y) => `<button type="button" class="btn ghost big press" data-action="hm-year" data-id="${y.id}">${esc(y.label)}</button>`).join('')}
    </div>

    <div class="trustrow">
      ${['No account, no sign in', 'Nothing leaves this device', 'It never says a road is closed'].map((t) => `<span class="pill" data-tone="quiet">${esc(t)}</span>`).join('')}
    </div>
  </div>`;
  onAction(root, {
    'hm-role': (btn) => { setRole(btn.dataset.id); api.refresh(); },
    'hm-year': (btn) => { setYear(btn.dataset.id); markWelcome(null); api.nav('year', { y: btn.dataset.id }); },
  });
}

function renderHome(root, api) {
  const st = getState();
  const y = st.year;
  const yr = YEARS.find((x) => x.id === y);
  const meta = ((api.data.years || {}).years || {})[y] || {};
  const c = api.ctx();
  const yp = (st.plans && st.plans[y]) || {};
  const n = Object.keys(yp).length;
  let line = '';
  let rows = [];
  if (y !== 'p6') {
    const ep = evalPlan(y, yp, c.subjects);
    rows = c.destinations.map((d) => reach(ep, d, { ...c, plan: ep, yearId: y }));
    const a = n ? advise({ yearId: y, plan: yp, ctx: c, offer: st.offer }) : null;
    line = a && a.singles[0] ? a.singles[0].line : '';
  }
  const effRows = c.destinations.map((d) => reach(c.plan, d, c));

  root.innerHTML = `
  ${yearStrip(null, st)}
  <div class="wrap homewrap">
    <section class="yourcard arrive" aria-labelledby="yc-h">
      <p class="kicker">${esc(meta.phase || '')} · ${st.role === 'student' ? 'You are in' : 'Now in'} ${esc(yr.label)}</p>
      <h1 id="yc-h">${esc(meta.headline || yr.label)}</h1>
      ${y === 'p6' ? `<p class="lede">${esc(meta.lede || '')}</p>` : (n ? `
        <div class="advsum"><span class="bignum">${openCount(rows)}</span><span><strong>of ${rows.length} open from your ${esc(yr.label)} levels</strong> ${mapPips(rows)}</span></div>
        ${line ? `<p class="yc-next">${icon('spark')} ${esc(line)}</p>` : '<p class="yc-next">All eight are open from here. Play one forward.</p>'}` : `<p class="lede">${esc(meta.lede || '')}</p>`)}
      <p class="btnrow">
        <button type="button" class="btn big press" data-action="go" data-s="year" data-y="${esc(y)}" ${n && line ? 'data-tab="advice"' : ''}>${y === 'p6' ? 'Enter PSLE ALs' : (n ? (line ? 'See the advice' : `Open ${esc(yr.label)}`) : `Set ${esc(yr.label)} levels`)} ${icon('arrow')}</button>
        <button type="button" class="linkbtn" data-action="hm-change">Not ${esc(yr.label)}?</button>
      </p>
    </section>

    <div class="homecards">
      <button type="button" class="homecard press" data-action="go" data-s="after">
        ${icon('map')}<span class="hc-name">After Sec</span>
        <span class="small">${openCount(effRows)} of 8 open ${mapPips(effRows)}</span>
        <span class="small">What each place asks, costs and leads to.</span>
      </button>
      <button type="button" class="homecard press" data-action="go" data-s="play">
        ${icon('play')}<span class="hc-name">Play a life forward</span>
        <span class="small">${st.liveRun ? 'A story is mid chapter.' : (st.runs.length ? `${st.runs.length} lived on this device.` : 'From your subjects, to age 35.')}</span>
        <span class="small">A ten minute game. No choice ends the story.</span>
      </button>
      <button type="button" class="homecard press" data-action="go" data-s="myplan">
        ${icon('flag')}<span class="hc-name">${st.role === 'student' ? 'My plan' : 'The plan'}</span>
        <span class="small">${st.actions.length ? `${st.actions.length} thing${st.actions.length === 1 ? '' : 's'} on the list.` : 'Nothing on the list yet.'}</span>
        <span class="small">One page for the next conversation. Prints.</span>
      </button>
    </div>

    <p class="caps" style="margin-top:28px">Also here</p>
    <div class="morerow">
      <button type="button" class="chip press" data-action="go" data-s="work">The work itself</button>
      <button type="button" class="chip press" data-action="go" data-s="money">Costs and help</button>
      <button type="button" class="chip press" data-action="go" data-s="schools">My kind of school</button>
      <button type="button" class="chip press" data-action="go" data-s="adults">For parents and teachers</button>
    </div>
    ${isGuest() ? '' : '<p class="small" style="margin-top:20px">Nothing you do here leaves this device. No account, no server, nothing collected.</p>'}
  </div>`;
  onAction(root, {
    'hm-change': () => {
      api.sheet(`<h2 id="sheet-title">Which year?</h2><div class="yeargrid">${YEARS.map((x) => `<button type="button" class="btn ${x.id === y ? '' : 'ghost'} press" data-action="hm-pick" data-id="${x.id}">${esc(x.label)}</button>`).join('')}</div>`);
    },
  });
  onAction(document.body, {
    'hm-pick': (btn) => { setYear(btn.dataset.id); api.closeSheet(); api.refresh(); },
  });
}
