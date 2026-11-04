// Goal: start from what you want, then work back to this year's moves.
//
// Four short steps, each one screen: what you enjoy, the work that fits,
// the place that leads there, and (if you know) the course family. A student
// who already knows the place can skip straight to it. The goal is a lens on
// the same plan, never a verdict: every place keeps its route in.

import { getState, setGoal, YEARS } from '../state.js?v=5.0.0';
import { sectorsFor, placesFor, familiesFor, workBack, goalMoves } from '../engine/goal.js?v=5.0.0';
import { ticketHtml } from '../ui/ticket.js?v=5.0.0';
import { esc, onAction } from '../ui/dom.js?v=5.0.0';
import { icon } from '../ui/icons.js?v=5.0.0';
import { stateWord, isShort } from '../ui/labels.js?v=5.0.0';
import { goalLine, goalFamily } from './path.js?v=5.0.0';

const LABEL = Object.fromEntries(YEARS.map((y) => [y.id, y.label]));

function stepBar(n) {
  return `<ol class="gsteps" aria-label="Step ${n} of 4">${[1, 2, 3, 4].map((k) => `<li data-on="${k <= n}"></li>`).join('')}</ol>`;
}

function interestHtml(api, q) {
  const goals = api.data.goals || {};
  const picked = new Set((q.i || '').split(''));
  return `
    ${stepBar(1)}
    <h1>What do you enjoy?</h1>
    <p class="lede">Pick one or two. This only suggests work to look at.</p>
    <div class="gpick">${(goals.interests || []).map((x) => `<button type="button" class="gopt press" data-action="g-int" data-code="${x.code}" aria-pressed="${picked.has(x.code)}">${esc(x.label)}</button>`).join('')}</div>
    <p class="gfoot">
      <button type="button" class="btn big press" data-action="go" data-s="goal" data-step="sector" data-i="${esc(q.i || '')}" ${picked.size ? '' : 'disabled'}>See work that fits ${icon('arrow')}</button>
    </p>
    <p class="small">Already know where you want to study? <button type="button" class="linkbtn" data-action="go" data-s="goal" data-step="place">Pick a place</button></p>`;
}

function sectorHtml(api, q) {
  const work = api.data.work || {};
  const list = sectorsFor((q.i || '').split('').filter(Boolean), work);
  return `
    ${stepBar(2)}
    <h1>Work that fits</h1>
    <p class="lede">Tap one to see the roles and how people get there.</p>
    <div class="glist">${list.map((s) => `<button type="button" class="gcard press" data-action="go" data-s="goal" data-step="place" data-sector="${esc(s.id)}" data-i="${esc(q.i || '')}">
      <span class="gcard-t">${esc(s.label)}</span><span class="gcard-p">${esc(s.isWhat || '')}</span></button>`).join('')}</div>
    <p class="small"><button type="button" class="linkbtn" data-action="go" data-s="goal" data-step="interest" data-i="${esc(q.i || '')}">Change what you enjoy</button></p>`;
}

function placeHtml(api, q) {
  const c = api.ctx();
  const work = api.data.work || {};
  const sector = (work.sectors || []).find((s) => s.id === q.sector);
  if (!sector) {
    // No sector: the student knows the place already.
    return `
      ${stepBar(3)}
      <h1>Pick a place</h1>
      <p class="lede">The place you want to study after secondary school.</p>
      <div class="glist">${c.destinations.map((d) => `<button type="button" class="gcard press" data-action="go" data-s="goal" data-step="family" data-dest="${esc(d.id)}">
        <span class="gcard-t">${esc(d.railName || d.name)}</span><span class="gcard-p">${esc(d.feels || '')}</span></button>`).join('')}</div>`;
  }
  const places = placesFor(sector, api.data.goals || {}, c.destinations);
  return `
    ${stepBar(3)}
    <h1>${esc(sector.label)}</h1>
    <p class="lede">Roles in this work, and the places that lead to them. Pick the role you want.</p>
    ${places.map((p) => `
      <section class="gplace">
        <h2 class="advh">${esc(p.dest.railName || p.dest.name)}</h2>
        <div class="glist">${p.roles.map((r) => `<button type="button" class="gcard press" data-action="go" data-s="goal" data-step="family" data-dest="${esc(p.dest.id)}" data-sector="${esc(sector.id)}" data-role="${esc(r.role)}">
          <span class="gcard-t">${esc(r.role)}</span><span class="gcard-p">${esc(r.route)}</span></button>`).join('')}</div>
      </section>`).join('')}
    <p class="small"><button type="button" class="linkbtn" data-action="go" data-s="goal" data-step="sector" data-i="${esc(q.i || '')}">Back to work that fits</button></p>`;
}

function familyHtml(api, q) {
  const c = api.ctx();
  const d = c.destinations.find((x) => x.id === q.dest);
  if (!d) return placeHtml(api, {});
  const fams = familiesFor(q.sector || null, d.id, api.data.goals || {}, api.data.families);
  const base = { dest: d.id, sector: q.sector || null, role: q.role || null };
  return `
    ${stepBar(4)}
    <h1>${esc(d.railName || d.name)}</h1>
    <p class="lede">${fams.length ? 'Which group of courses? This adds the subjects those courses ask for.' : 'You can set this as your goal now.'}</p>
    ${fams.length ? `<div class="glist">${fams.map((f) => `<button type="button" class="gcard press" data-action="g-set" data-goal="${esc(JSON.stringify({ ...base, family: f.id }))}">
      <span class="gcard-t">${esc(f.name)}</span><span class="gcard-p">${f.rules ? 'Subject needs are checked against your plan. To confirm: 2028 lists arrive in mid 2027.' : '2028 entry needs are not published yet.'}</span></button>`).join('')}</div>` : ''}
    <p class="gfoot"><button type="button" class="btn ${fams.length ? 'ghost' : ''} big press" data-action="g-set" data-goal="${esc(JSON.stringify(base))}">${fams.length ? 'Not sure yet, use the place' : 'Set as my goal'} ${icon('arrow')}</button></p>`;
}

function summaryHtml(api, st) {
  const c = api.ctx();
  const goal = st.goal;
  const back = workBack(goal, st.plans, c, api.data);
  const y = st.yearSet && st.year !== 'p6' ? st.year : 'sec2';
  const moves = goalMoves(goal, y, st.plans[y] || {}, c);
  return `
    <p class="ph-k">Your goal</p>
    <h1>${esc(goalLine(api, goal))}</h1>
    ${goalFamily(api, goal) ? `<p class="lede">Courses: ${esc(goalFamily(api, goal))}</p>` : ''}
    ${moves.length ? `<h2 class="advh">Best move for it in ${esc(LABEL[y])}</h2>${ticketHtml(moves[0], { hero: true })}` : ''}
    <h2 class="advh">What it asks, year by year</h2>
    <ol class="gback">${back.map((b) => `<li data-has="${b.has}">
      <p class="gb-h"><b>${esc(LABEL[b.yearId])}</b>${b.state ? ` <span class="pill" data-tone="${esc(b.state)}">${esc(stateWord(b.state, b.yearId === 'sec1' || b.yearId === 'sec2' ? 'lower' : 'sec'))}</span>` : ' <span class="small">No levels yet</span>'}</p>
      <ul class="asklist compact">${b.asks.slice(0, isShort() ? 3 : 8).map((x) => `<li data-met="${x.met && x.satisfied}">${x.met && x.satisfied ? icon('check') : '<i class="dotq" aria-hidden="true"></i>'}<span>${esc(x.label)}${x.status === 'provisional' ? ' <span class="src-chip provisional">to confirm</span>' : ''}</span></li>`).join('')}</ul>
    </li>`).join('')}</ol>
    <p class="btnrow">
      <button type="button" class="btn press" data-action="go" data-s="path">See it on your path ${icon('arrow')}</button>
      <button type="button" class="btn ghost press" data-action="go" data-s="goal" data-step="interest">Change goal</button>
      <button type="button" class="linkbtn" data-action="g-clear">Clear goal</button>
    </p>`;
}

export default {
  id: 'goal',
  title: 'Goal',
  era: 'school',

  render(root, api) {
    const st = getState();
    const q = api.route().q;
    const step = q.step || (st.goal ? 'summary' : 'interest');
    const body = step === 'sector' ? sectorHtml(api, q)
      : step === 'place' ? placeHtml(api, q)
        : step === 'family' ? familyHtml(api, q)
          : step === 'summary' && st.goal ? summaryHtml(api, st)
            : interestHtml(api, q);
    root.innerHTML = `<div class="wrap-narrow goalwrap arrive">${body}</div>`;

    onAction(root, {
      'g-int': (btn) => {
        const cur = new Set((api.route().q.i || '').split('').filter(Boolean));
        const code = btn.dataset.code;
        if (cur.has(code)) cur.delete(code); else { if (cur.size >= 2) cur.delete([...cur][0]); cur.add(code); }
        api.setQuery({ step: 'interest', i: [...cur].join('') || null });
        api.refresh();
      },
      'g-set': (btn) => {
        setGoal(JSON.parse(btn.dataset.goal));
        api.announce('Goal set.');
        api.nav('goal', { step: 'summary' });
      },
      'g-clear': () => { setGoal(null); api.nav('goal', { step: 'interest' }); },
    });
  },
};
