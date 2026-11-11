// Goal: where you want to go, and what you will do about it.
//
// Finding a goal is four short steps, each one screen: what you enjoy, the
// work that fits, the place that leads there, and (if you know) the course
// family. What you enjoy is the compass on Me, so it is asked once.
//
// 6.0 stopped there: a goal was a place and its subject rules. 7.0 makes it
// a goal a student can act on and come back to: why, the steps (a subject
// move, and things to do outside class), a date, and the adult it was agreed
// with. After the date, or after three weeks, the path asks if it still
// stands.
//
// The goal is a lens on the same plan, never a verdict: every place keeps
// its route in.

import {
  getState, setGoal, patchGoal, checkGoal, goalDue, toggleEnjoy, toggleAction, toggleDone, YEARS,
} from '../state.js?v=7.0.0';
import { sectorsFor, placesFor, familiesFor, workBack, goalMoves } from '../engine/goal.js?v=7.0.0';
import { isLower } from '../engine/years.js?v=7.0.0';
import { ticketHtml } from '../ui/ticket.js?v=7.0.0';
import { DEST_CODE } from '../ui/signal.js?v=7.0.0';
import { STRIP } from '../ui/yearstrip.js?v=7.0.0';
import { esc, onAction } from '../ui/dom.js?v=7.0.0';
import { icon } from '../ui/icons.js?v=7.0.0';
import { stateWord, isShort } from '../ui/labels.js?v=7.0.0';
import { goalLine, goalFamily } from './path.js?v=7.0.0';

const LABEL = Object.fromEntries(YEARS.map((y) => [y.id, y.label]));
const CODE = Object.fromEntries(STRIP.map((y) => [y.id, y.code]));

const niceDay = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};
const inDays = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

function stepBar(n) {
  return `<ol class="gsteps" aria-label="Step ${n} of 4">${[1, 2, 3, 4].map((k) => `<li data-on="${k <= n}"></li>`).join('')}</ol>`;
}

/** The interests picked on Me, in the list's order and words. */
function enjoyed(api) {
  const codes = getState().compass.enjoy;
  return ((api.data.goals || {}).interests || []).filter((x) => codes.includes(x.code));
}

function interestHtml(api) {
  const goals = api.data.goals || {};
  const picked = new Set(getState().compass.enjoy);
  return `
    ${stepBar(1)}
    <h1>What do you enjoy?</h1>
    <p class="lede">Pick one or two. This only suggests work to look at.</p>
    <div class="gpick">${(goals.interests || []).map((x) => `<button type="button" class="gopt press" data-action="g-int" data-code="${x.code}" aria-pressed="${picked.has(x.code)}">${esc(x.label)}</button>`).join('')}</div>
    <p class="gfoot">
      <button type="button" class="btn big press" data-action="go" data-s="goal" data-step="sector" ${picked.size ? '' : 'disabled'}>See work that fits ${icon('arrow')}</button>
    </p>
    <p class="small">Already know where you want to study? <button type="button" class="linkbtn" data-action="go" data-s="goal" data-step="place">Pick a place</button></p>`;
}

function sectorHtml(api) {
  const work = api.data.work || {};
  const mine = enjoyed(api);
  const list = sectorsFor(mine.map((x) => x.code), work);
  return `
    ${stepBar(2)}
    <h1>Work that fits</h1>
    ${mine.length ? `<p class="gfrom">${icon('compass')}<span>${mine.map((x) => esc(x.label)).join(' · ')}</span>
      <button type="button" class="linkbtn" data-action="go" data-s="goal" data-step="interest">Change</button></p>` : ''}
    <p class="lede">Tap one to see the roles and how people get there.</p>
    <div class="glist">${list.map((s) => `<button type="button" class="gcard press" data-action="go" data-s="goal" data-step="place" data-sector="${esc(s.id)}">
      <span class="gcard-t">${esc(s.label)}</span><span class="gcard-p">${esc(s.isWhat || '')}</span></button>`).join('')}</div>
    <p class="small">Already know where you want to study? <button type="button" class="linkbtn" data-action="go" data-s="goal" data-step="place">Pick a place</button></p>`;
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
    <p class="lede">Pick the role you want. Each sits under the place that leads to it.</p>
    ${places.map((p) => `
      <section class="gplace">
        <h2 class="advh">${esc(p.dest.railName || p.dest.name)}</h2>
        <div class="glist">${p.roles.map((r) => `<button type="button" class="gcard press" data-action="go" data-s="goal" data-step="family" data-dest="${esc(p.dest.id)}" data-sector="${esc(sector.id)}" data-role="${esc(r.role)}">
          <span class="gcard-t">${esc(r.role)}</span><span class="gcard-p">${esc(r.route)}</span></button>`).join('')}</div>
      </section>`).join('')}
    <p class="small"><button type="button" class="linkbtn" data-action="go" data-s="goal" data-step="sector">Back to work that fits</button></p>`;
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

/**
 * The route to the goal, drawn: each school year still ahead, then the
 * place. A year with levels takes the colour of where the goal stands on
 * them; a year without is hollow. Each stop opens that year on the path.
 */
function routeHtml(api, st, back) {
  const nowIdx = YEARS.findIndex((y) => y.id === (st.yearSet ? st.year : 'sec2'));
  const stops = back.filter((b) => YEARS.findIndex((y) => y.id === b.yearId) >= Math.max(1, nowIdx));
  const d = api.ctx().destinations.find((x) => x.id === st.goal.dest);
  return `<ol class="groute" aria-label="Your route to this goal">
    ${stops.map((b, i) => `<li class="gr-stop" data-state="${esc(b.state || 'none')}" data-now="${i === 0 && st.yearSet}">
      <button type="button" class="gr-node press" data-action="go" data-s="path" data-y="${b.yearId}" aria-label="${esc(LABEL[b.yearId])}${b.state ? `: ${esc(stateWord(b.state, isLower(b.yearId) ? 'lower' : 'sec'))}` : ': no levels yet'}"><b>${esc(CODE[b.yearId])}</b></button>
      <span class="gr-cap">${i === 0 && st.yearSet ? 'You' : esc(LABEL[b.yearId])}</span></li>`).join('')}
    <li class="gr-stop gr-end">
      <button type="button" class="gr-node press" data-action="go" data-s="dest" data-id="${esc(st.goal.dest)}" aria-label="${esc(d ? d.railName || d.name : '')}"><b>${esc(DEST_CODE[st.goal.dest] || '')}</b></button>
      <span class="gr-cap">${icon('target')}Goal</span></li>
  </ol>`;
}

/** Steps to offer besides a subject move: ones that fit the place and the year, not yet saved. */
function stepIdeas(api, st) {
  const y = st.yearSet ? st.year : 'sec2';
  return ((((api.data.goals || {}).steps || {}).list) || [])
    .filter((s) => (!s.for || s.for.includes(st.goal.dest)) && (s.years || []).includes(y) && !st.actions.includes(s.label))
    .slice(0, isShort() ? 4 : 8);
}

function stepsHtml(api, st) {
  const ideas = stepIdeas(api, st);
  const n = st.actions.length;
  const done = st.actions.filter((a) => st.done[a]).length;
  return `
    <section class="gsec" id="g-steps">
      <h2 class="advh">Your steps${n ? ` <span class="gcount">${done} of ${n} done</span>` : ''}</h2>
      ${n ? `<ul class="steplist">${st.actions.map((a, i) => `<li data-done="${!!st.done[a]}">
        <button type="button" class="stepcheck press" role="checkbox" aria-checked="${!!st.done[a]}" data-action="g-done" data-i="${i}" data-key="done-${i}" aria-label="Done: ${esc(a)}">${st.done[a] ? icon('check') : ''}</button>
        <span>${esc(a)}</span>
        <button type="button" class="iconbtn press" data-action="g-drop" data-i="${i}" aria-label="Remove this step">${icon('x')}</button></li>`).join('')}</ul>`
    : '<p class="small">No steps yet. Add one below, or save a move.</p>'}
      ${ideas.length ? `<p class="py-k">Add a step</p>
      <div class="ideas">${ideas.map((s) => `<button type="button" class="idea press" data-action="g-add" data-id="${esc(s.id)}" data-key="idea-${esc(s.id)}">${icon('plus')}<span>${esc(s.label)}</span></button>`).join('')}</div>` : ''}
    </section>`;
}

function agreeHtml(api, st) {
  const who = (((api.data.goals || {}).steps || {}).who) || {};
  const g = st.goal;
  const quick = [[14, '2 weeks'], [30, '1 month'], [90, '3 months']];
  return `
    <section class="gsec gagree">
      <h2 class="advh">Agree it</h2>
      <p class="py-k" id="g-by-k">Look at it again by</p>
      <div class="chipset" role="group" aria-labelledby="g-by-k">
        ${quick.map(([n, label]) => `<button type="button" class="mechip press" data-action="g-by" data-n="${n}" data-key="by-${n}" aria-pressed="${g.by === inDays(n)}">${esc(label)}</button>`).join('')}
        <label class="goalby"><span class="sr-only">Pick a date</span><input type="date" id="g-date" value="${esc(g.by || '')}" min="${inDays(0)}"></label>
      </div>
      ${g.by ? `<p class="small gby-line">${icon('calendar')} By ${esc(niceDay(g.by))}.</p>` : ''}
      <p class="py-k" id="g-who-k">Agreed with</p>
      <div class="chipset" role="group" aria-labelledby="g-who-k">
        ${Object.entries(who).map(([id, label]) => `<button type="button" class="mechip press" data-action="g-who" data-id="${esc(id)}" data-key="who-${esc(id)}" aria-pressed="${g.who === id}">${g.who === id ? icon('check') : ''}<span>${esc(label)}</span></button>`).join('')}
      </div>
    </section>`;
}

function summaryHtml(api, st) {
  const c = api.ctx();
  const goal = st.goal;
  const back = workBack(goal, st.plans, c, api.data);
  const y = st.yearSet && st.year !== 'p6' ? st.year : 'sec2';
  const moves = goalMoves(goal, y, st.plans[y] || {}, c);
  const sector = ((api.data.work || {}).sectors || []).find((s) => s.id === goal.sector);
  const fits = sector ? enjoyed(api).filter((x) => (sector.riasec || []).includes(x.code)) : [];
  const due = goalDue(goal);
  const asks = `<ol class="gback">${back.map((b) => `<li data-has="${b.has}">
      <p class="gb-h"><b>${esc(LABEL[b.yearId])}</b>${b.state ? ` <span class="pill" data-tone="${esc(b.state)}">${esc(stateWord(b.state, isLower(b.yearId) ? 'lower' : 'sec'))}</span>` : ' <span class="small">No levels yet</span>'}</p>
      <ul class="asklist compact">${b.asks.slice(0, isShort() ? 3 : 8).map((x) => `<li data-met="${x.met && x.satisfied}">${x.met && x.satisfied ? icon('check') : '<i class="dotq" aria-hidden="true"></i>'}<span>${esc(x.label)}${x.status === 'provisional' ? ' <span class="src-chip provisional">to confirm</span>' : ''}</span></li>`).join('')}</ul>
    </li>`).join('')}</ol>`;
  return `
    ${due ? `<section class="gcheck arrive" aria-labelledby="gcheck-h">
      <p class="ns-k">Time to look again</p>
      <h2 id="gcheck-h">Is this still your goal?</h2>
      <p class="btnrow">
        <button type="button" class="btn press" data-action="g-still">${icon('check')} Yes, still my goal</button>
        <button type="button" class="btn ghost on-night press" data-action="go" data-s="goal" data-step="sector">Change it</button>
      </p></section>` : ''}
    <p class="ph-k">Where do I want to go?</p>
    <h1>${esc(goalLine(api, goal))}</h1>
    ${goalFamily(api, goal) ? `<p class="lede gfam">Courses: ${esc(goalFamily(api, goal))}</p>` : ''}
    ${fits.length ? `<p class="gfrom">${icon('compass')}<span>Fits what you enjoy: ${fits.map((x) => esc(x.label.charAt(0).toLowerCase() + x.label.slice(1))).join(' · ')}</span></p>` : ''}
    ${routeHtml(api, st, back)}
    <label class="goalwhy"><span class="py-k">Why this goal</span>
      <input type="text" id="g-why" maxlength="140" value="${esc(goal.why || '')}" placeholder="One line, in your words." autocomplete="off"></label>
    ${moves.length ? `<section class="gsec"><h2 class="advh">Best move for it in ${esc(LABEL[y])}</h2>${ticketHtml(moves[0], { hero: true })}</section>` : ''}
    ${stepsHtml(api, st)}
    ${agreeHtml(api, st)}
    <details class="fold gsec"${isShort() ? '' : ' open'}>
      <summary>What it asks, year by year</summary>
      ${asks}
    </details>
    <p class="glinks">
      <button type="button" class="chip press" data-action="go" data-s="path">${icon('steps')} On your path</button>
      ${goal.sector ? `<button type="button" class="chip press" data-action="go" data-s="work" data-sector="${esc(goal.sector)}">${icon('d_portfolio')} Jobs in this field</button>` : `<button type="button" class="chip press" data-action="go" data-s="work">${icon('d_portfolio')} Jobs and sectors</button>`}
      <button type="button" class="chip press" data-action="go" data-s="dest" data-id="${esc(goal.dest)}">${icon('map')} About this place</button>
      <button type="button" class="chip press" data-action="go" data-s="session">${icon('talk')} Talk it through</button>
    </p>
    <p class="btnrow gend">
      <button type="button" class="btn ghost press" data-action="go" data-s="goal" data-step="sector">Change goal</button>
      <button type="button" class="linkbtn" data-action="g-clear">Clear goal</button>
    </p>`;
}

export default {
  id: 'goal',
  title: 'Goal',
  era: 'school',

  render(root, api) {
    const draw = (focusKey) => {
      const st = getState();
      const q = api.route().q;
      // What you enjoy is asked once, on Me or here. With it answered, the
      // search starts at the work that fits.
      const start = st.compass.enjoy.length ? 'sector' : 'interest';
      const step = q.step || (st.goal ? 'summary' : start);
      const body = step === 'interest' ? interestHtml(api)
        : step === 'sector' ? sectorHtml(api)
          : step === 'place' ? placeHtml(api, q)
            : step === 'family' ? familyHtml(api, q)
              : st.goal ? summaryHtml(api, st)
                : (start === 'sector' ? sectorHtml(api) : interestHtml(api));
      root.innerHTML = `<div class="wrap-narrow goalwrap arrive">${body}</div>`;

      const why = root.querySelector('#g-why');
      if (why) why.addEventListener('change', () => patchGoal({ why: why.value }));
      const date = root.querySelector('#g-date');
      if (date) date.addEventListener('change', () => { patchGoal({ by: date.value }); draw(); });
      if (focusKey) {
        const el = root.querySelector(`[data-key="${focusKey}"]`) || root.querySelector('#g-steps .advh');
        if (el) { if (el.tagName !== 'BUTTON') el.setAttribute('tabindex', '-1'); el.focus({ preventScroll: true }); }
      }
    };

    draw();

    onAction(root, {
      'g-int': (btn) => { toggleEnjoy(btn.dataset.code); api.setQuery({ step: 'interest' }); api.refresh(); },
      'g-set': (btn) => {
        setGoal(JSON.parse(btn.dataset.goal));
        api.announce('Goal set.');
        api.nav('goal', { step: 'summary' });
      },
      'g-clear': () => { setGoal(null); api.nav('goal', {}); },
      'g-still': () => { checkGoal(); api.announce('Kept as your goal.'); draw(); },
      'g-add': (btn) => {
        const s = ((((api.data.goals || {}).steps || {}).list) || []).find((x) => x.id === btn.dataset.id);
        if (!s) return;
        if (s.id === 'targets') { api.nav('year', { y: getState().year, tab: 'targets' }); return; }
        toggleAction(s.label);
        api.announce('Step added.');
        draw(`done-${getState().actions.length - 1}`);
      },
      'g-done': (btn) => {
        const a = getState().actions[Number(btn.dataset.i)];
        if (a) toggleDone(a);
        if (a && getState().done[a]) api.cue('lived');
        draw(btn.dataset.key);
      },
      'g-drop': (btn) => { const a = getState().actions[Number(btn.dataset.i)]; if (a) toggleAction(a); draw('none'); },
      'g-by': (btn) => {
        const d = inDays(Number(btn.dataset.n));
        patchGoal({ by: getState().goal.by === d ? null : d });
        draw(btn.dataset.key);
      },
      'g-who': (btn) => {
        patchGoal({ by: getState().goal.by, who: getState().goal.who === btn.dataset.id ? null : btn.dataset.id });
        draw(btn.dataset.key);
      },
    });
  },
};
