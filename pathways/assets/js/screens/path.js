// The path: the whole app on one line, P6 to after Sec.
//
// v4 spread one plan across five screens (Home, Subjects tabs, Pathways,
// Saved). Here each school year is a stop on one line and opens in place:
// its levels, the best move, what the goal asks by then, and the dates that
// matter. The 8 places sit at the end of the line. Everything else is one
// tap off the line, never a separate place to find.
//
// 6.0 adds v4's next step on top, for the steps the open year cannot show
// itself: say your year, enter PSLE results, set grade targets, talk to
// someone. A level to set or a move to make is already in the open year.
//
// 7.0: the line no longer stops at 17. After the 8 places comes the long
// view, ages 12 to 65 to scale. The compass sits beside the goal at the top,
// the next step asks about a goal that is due a second look, and the pages
// Explore used to hold (places, jobs, fees, school types, adults) are links
// at the foot of the line.

import { getState, setYearLevel, replaceYearPlan, YEARS, goalDue, compassFill, currentYear } from '../state.js?v=7.0.0';
import { compassSvg, pointsFilled } from '../ui/compass.js?v=7.0.0';
import { longViewHtml, firstMarker } from '../ui/longview.js?v=7.0.0';
import { reach } from '../engine/reach.js?v=7.0.0';
import { evalPlan, effective, isLower, subjectsForYear, carryForward } from '../engine/years.js?v=7.0.0';
import { sayMove } from '../ui/talk.js?v=7.0.0';
import { advise } from '../engine/advice.js?v=7.0.0';
import { psleScore } from '../engine/psle.js?v=7.0.0';
import { goalReach, goalMoves, familiesFor } from '../engine/goal.js?v=7.0.0';
import { signalHtml } from '../ui/signal.js?v=7.0.0';
import { ticketHtml } from '../ui/ticket.js?v=7.0.0';
import { subjTile } from './year.js?v=7.0.0';
import { esc, onAction } from '../ui/dom.js?v=7.0.0';
import { icon } from '../ui/icons.js?v=7.0.0';
import { stateWord, openWord, isShort, t } from '../ui/labels.js?v=7.0.0';

const LABEL = Object.fromEntries(YEARS.map((y) => [y.id, y.label]));
const ORDER = YEARS.map((y) => y.id);

function rowsFor(api, y, plan) {
  const c = api.ctx();
  const ep = evalPlan(y, plan, c.subjects);
  return c.destinations.map((d) => reach(ep, d, { ...c, plan: ep, yearId: y }));
}

/** The goal in one short line: the role if chosen, and the place. */
export function goalLine(api, goal) {
  if (!goal) return '';
  const d = api.ctx().destinations.find((x) => x.id === goal.dest);
  const via = d ? (d.railName || d.name) : goal.dest;
  return goal.role ? `${goal.role}, via ${via}` : via;
}

/** The course family's plain name, if the goal has one. */
export function goalFamily(api, goal) {
  if (!goal || !goal.family) return '';
  const fam = familiesFor(null, goal.dest, api.data.goals || {}, api.data.families).find((f) => f.id === goal.family);
  return fam ? fam.name : '';
}

/**
 * v4's next step, kept for what the line cannot show in the open year:
 *   no year            say your year (back to the start)
 *   P6                 enter PSLE ALs, then carry them into Sec 1
 *   upper sec, no targets   set grade targets
 *   every move kept    say it to someone this week
 * A year with no levels, or with a move not yet kept, returns null: the open
 * year already shows its level switches and its best move.
 */
export function nextStep(api, st) {
  if (!st.yearSet) {
    return { title: 'Tell us your year', body: 'Paths reads your levels one school year at a time.', cta: 'Start', s: 'start' };
  }
  const y = st.year;
  if (y === 'p6') {
    const sc = api.data.psle ? psleScore(st.psle || {}, api.data.psle) : { complete: false };
    return sc.complete
      ? { title: 'Use your PSLE levels for Sec 1', body: `PSLE Score ${sc.score}. Your Sec 1 page shows what those levels keep on track.`, cta: 'Open Sec 1', s: 'year', y: 'sec1' }
      : { title: 'Enter your PSLE ALs', body: 'See your Posting Group and the level each subject would start at in Sec 1.', cta: 'Enter ALs', s: 'year', y: 'p6' };
  }
  const plan = (st.plans && st.plans[y]) || {};
  if (!Object.keys(plan).length) return null;
  if (goalDue(st.goal)) {
    return { title: 'Is this still your goal?', body: goalLine(api, st.goal), cta: 'Look at it again', s: 'goal' };
  }
  if (st.role === 'student' && !st.compass.enjoy.length) {
    return { title: 'Say what you enjoy', body: 'Two taps on your compass. It shapes your goal and the game.', cta: 'Open Me', s: 'me' };
  }
  const a = advise({ yearId: y, plan, ctx: api.ctx() });
  const top = a.singles[0] || a.pairs[0];
  if (top && !st.actions.includes(sayMove(top, st.role))) return null;
  if (!isLower(y) && !Object.keys((st.grades && st.grades.target) || {}).length) {
    return { title: 'Set your grade targets', body: 'See the score each place reads, and the grades that close a gap.', cta: 'Set targets', s: 'year', y, tab: 'targets' };
  }
  const talk = ((((api.data.years || {}).years || {})[y] || {}).talk || {})[st.role] || [];
  return {
    title: 'Talk to someone this week',
    body: st.actions[0] || talk[0] || 'Take your plan to a parent, a form teacher or your ECG counsellor.',
    cta: t('openPlan'), s: 'myplan',
  };
}

function nextHtml(api, st) {
  const ns = nextStep(api, st);
  if (!ns) return '';
  return `
      <section class="nextstep ns-compact arrive" aria-labelledby="ns-h">
        <p class="ns-k">Your next step</p>
        <h2 id="ns-h">${esc(ns.title)}</h2>
        <p class="ns-p">${esc(ns.body)}</p>
        <button type="button" class="btn press" data-action="go" data-s="${esc(ns.s)}"${ns.y ? ` data-y="${esc(ns.y)}"` : ''}${ns.tab ? ` data-tab="${esc(ns.tab)}"` : ''}>${esc(ns.cta)} ${icon('arrow')}</button>
      </section>`;
}

function yearSummary(api, y, st) {
  if (y === 'p6') {
    const sc = api.data.psle ? psleScore(st.psle || {}, api.data.psle) : { complete: false };
    return sc.complete ? `PSLE Score ${sc.score}` : 'PSLE and your first levels';
  }
  const plan = st.plans[y] || {};
  const n = Object.keys(plan).length;
  if (!n) return 'Not set yet';
  const rows = rowsFor(api, y, plan);
  const open = rows.filter((r) => r.state === 'open').length;
  return `${n} subjects · ${open} of 8 ${openWord(rows)}`;
}

function datesHtml(api, y) {
  const m = ((api.data.years || {}).years || {})[y] || {};
  const list = (m.happens || []).slice(0, isShort() ? 2 : 4);
  if (!list.length) return '';
  return `<ul class="py-dates">${list.map((h) => `<li>${icon('calendar')}<span><b>${esc(h.when || '')}</b> ${esc(h.what)}</span></li>`).join('')}</ul>`;
}

function goalHtml(api, y, st) {
  const goal = st.goal;
  if (!goal || y === 'p6') return '';
  const plan = st.plans[y] || {};
  const r = goalReach(goal, y, plan, api.ctx(), api.data);
  if (!r) return '';
  const has = Object.keys(plan).length > 0;
  const asks = [...r.gap.filter((g) => !g.soft), ...r.met].slice(0, isShort() ? 3 : 6);
  return `
    <div class="py-goal">
      <p class="py-goal-h">${icon('target')} ${esc(goalLine(api, goal))}${has ? ` <span class="pill" data-tone="${esc(r.state)}">${esc(stateWord(r.state, r.lens))}</span>` : ''}</p>
      <ul class="asklist compact">${asks.map((x) => `<li data-met="${has && !!x.satisfied}">${has && x.satisfied ? icon('check') : '<i class="dotq" aria-hidden="true"></i>'}<span>${esc(x.label)}${x.status === 'provisional' ? ' <span class="src-chip provisional">to confirm</span>' : ''}</span></li>`).join('')}</ul>
      ${r.horizon && !isShort() ? `<p class="small">${esc(r.horizon)}</p>` : ''}
    </div>`;
}

function yearBody(api, y, st) {
  const c = api.ctx();
  if (y === 'p6') {
    return `<div class="py-body"><p class="small">Enter your PSLE results to see your Posting Group, your Sec 1 starting levels and the choices they give you.</p>
      <p><button type="button" class="btn press" data-action="go" data-s="year" data-y="p6">Open P6 ${icon('arrow')}</button></p>${datesHtml(api, y)}</div>`;
  }
  const plan = st.plans[y] || {};
  const n = Object.keys(plan).length;
  const carry = n ? null : carryForward(y, st.plans, c.subjects);
  const tiles = subjectsForYear(y, c.subjects, c.offer).filter((s) => (s.levels || []).length);
  const rows = n ? rowsFor(api, y, plan) : null;
  const gm = st.goal ? goalMoves(st.goal, y, plan, c) : [];
  const adv = n ? advise({ yearId: y, plan, ctx: c }) : null;
  const top = gm[0] || (adv && (adv.singles[0] || adv.pairs[0]));
  return `
    <div class="py-body">
      ${carry ? `<p><button type="button" class="btn press" data-action="py-carry" data-y="${y}">Copy your ${esc(LABEL[carry.from])} levels ${icon('arrow')}</button></p>` : ''}
      ${rows ? signalHtml(rows, { key: `path-${y}`, mini: true }) : ''}
      ${goalHtml(api, y, st)}
      ${top ? `<p class="py-k">${st.goal && gm.length ? 'Best move for your goal' : 'Your best move'}</p>${ticketHtml(top, { simple: true })}` : ''}
      <details class="fold py-levels"${n ? '' : ' open'}>
        <summary>${n ? `Your ${esc(LABEL[y])} levels` : `Set your ${esc(LABEL[y])} levels`}</summary>
        <div class="subjgrid">${tiles.map((s) => subjTile(s, plan, 'py-lvl')).join('')}</div>
      </details>
      ${datesHtml(api, y)}
      <p class="py-links">
        <button type="button" class="linkbtn" data-action="go" data-s="year" data-y="${y}">Full ${esc(LABEL[y])} page</button>
        ${n ? `<button type="button" class="linkbtn" data-action="go" data-s="compare" data-y="${y}">Try a what if</button>` : ''}
      </p>
    </div>`;
}

function afterHtml(api, st) {
  const c = api.ctx();
  const rows = c.destinations.map((d) => reach(c.plan, d, c));
  const goal = st.goal && st.goal.dest;
  return `
    <ul class="pafter">${rows.map((r) => `<li>
      <button type="button" class="pa-row press" data-action="go" data-s="dest" data-id="${esc(r.id)}" data-goal="${r.id === goal}">
        <span class="pa-name">${r.id === goal ? icon('target') : ''}${esc(r.railName)}</span>
        <span class="pill" data-tone="${esc(r.state)}">${esc(stateWord(r.state, r.lens))}</span>
      </button></li>`).join('')}</ul>`;
}

export default {
  id: 'path',
  title: 'Your path',
  era: 'school',

  render(root, api) {
    const st = getState();
    const q = api.route().q;
    const now = st.yearSet ? st.year : 'sec2';
    const open = q.y && ORDER.includes(q.y) ? q.y : now;
    const e = effective(st.plans, api.ctx().subjects);
    const age = st.yearSet ? (currentYear().realAge || currentYear().age) : 14;
    const markers = (api.data.lifelong && api.data.lifelong.markers) || [];
    let lvSel = firstMarker(markers, age);
    root.innerHTML = `
    <div class="wrap-narrow pathwrap">
      <header class="ph arrive">
        <p class="ph-k">How do I get there?</p>
        <h1>${st.role === 'student' ? 'From P6 to after Sec' : 'The path, P6 to after Sec'}</h1>
        <div class="ph-row">
          <button type="button" class="mechipbtn press" data-action="go" data-s="me" aria-label="Me: your compass, ${pointsFilled(compassFill())} of 4 points filled">${compassSvg(compassFill(), { mini: true })}</button>
          ${st.goal
            ? `<button type="button" class="goalchip press" data-action="go" data-s="goal">${icon('target')}<span><small>Aiming for</small> ${esc(goalLine(api, st.goal))}</span>${icon('caret', 'chev')}</button>`
            : `<button type="button" class="btn press" data-action="go" data-s="goal">${icon('target')} Set a goal</button>`}
        </div>
      </header>
      ${st.role !== 'student' ? `<button type="button" class="adultdoor press arrive" data-action="go" data-s="adults" data-tab="${st.role === 'teacher' ? 'teacher' : 'parent'}">
        ${icon(st.role)}<span><b>${st.role === 'teacher' ? 'For teachers' : 'For parents'}</b><small>${st.role === 'teacher' ? 'A lesson, and a 15 minute session.' : 'What changed since your school days.'}</small></span>${icon('arrow')}</button>` : ''}
      ${nextHtml(api, st)}
      <ol class="pline">
        ${ORDER.map((y) => {
          const i = ORDER.indexOf(y); const ni = ORDER.indexOf(now);
          const when = !st.yearSet ? 'ahead' : (i < ni ? 'past' : i === ni ? 'now' : 'ahead');
          const isOpen = y === open;
          return `<li class="py" data-when="${when}" data-open="${isOpen}">
            <button type="button" class="py-h press" data-action="py-open" data-y="${y}" aria-expanded="${isOpen}">
              <span class="py-dot" aria-hidden="true"></span>
              <span class="py-name">${esc(LABEL[y])}${when === 'now' ? ' <b class="py-now">You are here</b>' : ''}</span>
              <span class="py-sum">${esc(yearSummary(api, y, st))}</span>
              ${icon('caret', 'py-chev')}
            </button>
            ${isOpen ? yearBody(api, y, st) : ''}
          </li>`;
        }).join('')}
        <li class="py py-end" data-when="after" data-open="true">
          <div class="py-h static"><span class="py-dot" aria-hidden="true"></span><span class="py-name">After Sec</span><span class="py-sum">${e.yearId ? `From your ${esc(LABEL[e.yearId])} levels` : 'Set your levels to see where you stand'}</span></div>
          <div class="py-body">${afterHtml(api, st)}
            <p class="py-links"><button type="button" class="linkbtn" data-action="go" data-s="after">What each place asks and costs</button></p>
          </div>
        </li>
        <li class="py py-end py-later" data-when="later" data-open="true">
          <div class="py-h static"><span class="py-dot" aria-hidden="true"></span><span class="py-name">After that</span><span class="py-sum">Ages 12 to 65, to scale</span></div>
          <div class="py-body" id="py-long">${longViewHtml(api.data.lifelong, age, lvSel)}</div>
        </li>
      </ol>
      <nav class="lookrow" aria-label="More to look at">
        <button type="button" class="chip press" data-action="go" data-s="work">${icon('d_portfolio')} Jobs and sectors</button>
        <button type="button" class="chip press" data-action="go" data-s="money">${icon('ticket')} Fees and help</button>
        <button type="button" class="chip press" data-action="go" data-s="schools">${icon('home')} School types</button>
        <button type="button" class="chip press" data-action="go" data-s="adults">${icon('d_people')} Parents and teachers</button>
      </nav>
    </div>`;

    onAction(root, {
      // The long view redraws itself in place, and keeps the finger on Next.
      'lv-pick': (btn) => {
        lvSel = Math.max(0, Math.min(markers.length - 1, Number(btn.dataset.i)));
        const host = root.querySelector('#py-long');
        if (!host) return;
        host.innerHTML = longViewHtml(api.data.lifelong, age, lvSel);
        const back = host.querySelector(`[data-key="${btn.dataset.key}"]:not([disabled])`) || host.querySelector('[data-key="lv-next"]:not([disabled])') || host.querySelector('[data-key="lv-prev"]');
        if (back) back.focus({ preventScroll: true });
      },
      'py-open': (btn) => {
        const y = btn.dataset.y;
        api.setQuery({ y: y === open ? '_' : y });
        api.refresh();
      },
      'py-lvl': (btn) => {
        const y = btn.closest('.py').querySelector('[data-action=py-open]').dataset.y;
        const { sid, level } = btn.dataset;
        const plan = getState().plans[y] || {};
        const subj = api.ctx().subjects.find((s) => s.id === sid);
        setYearLevel(y, sid, plan[sid] === level ? null : level, subj && subj.name);
        api.setQuery({ y });
        api.refresh();
      },
      'py-carry': (btn) => {
        const y = btn.dataset.y;
        const cf = carryForward(y, getState().plans, api.ctx().subjects);
        if (cf) { replaceYearPlan(y, cf.plan); api.announce(`${LABEL[cf.from]} levels copied into ${LABEL[y]}.`); }
        api.setQuery({ y });
        api.refresh();
      },
    });
  },
};
