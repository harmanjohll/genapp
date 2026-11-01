// Home: one next step.
//
// The first v4 home was a bento of four equal tiles plus four links, and a
// student could not tell which mattered first. Now Home answers one question,
// "what should I do next?", with one dominant card computed from what this
// device holds:
//
//   no year            tell us your year (back to the start)
//   P6                 enter PSLE ALs, then carry them into Sec 1
//   no levels          set this year's levels
//   a move exists      your next move, as a card
//   upper sec, no targets   set grade targets
//   otherwise          say it to someone this week
//
// Under it, the live signal for this year, then three quiet doors. A first
// visit never lands here: the router sends it to the start.

import { getState, setYear, YEARS } from '../state.js?v=4.4.0';
import { reach } from '../engine/reach.js?v=4.4.0';
import { evalPlan, isLower, prevYear } from '../engine/years.js?v=4.4.0';
import { advise } from '../engine/advice.js?v=4.4.0';
import { psleScore } from '../engine/psle.js?v=4.4.0';
import { signalHtml } from '../ui/signal.js?v=4.4.0';
import { stepArt } from '../ui/scenes.js?v=4.4.0';
import { sayMove } from '../ui/talk.js?v=4.4.0';
import { esc, onAction } from '../ui/dom.js?v=4.4.0';
import { icon } from '../ui/icons.js?v=4.4.0';
import { t } from '../ui/labels.js?v=4.4.0';

const LABEL = Object.fromEntries(YEARS.map((y) => [y.id, y.label]));

export default {
  id: 'home',
  title: 'Home',
  era: 'school',
  render(root, api) {
    const st = getState();
    document.body.dataset.dock = 'off';
    if (!st.seenStart) { setTimeout(() => api.nav('start', {}, { replace: true }), 0); return; }
    renderHome(root, api);
  },
};

function nextStep(api) {
  const st = getState();
  const c = api.ctx();
  if (!st.yearSet) {
    return { art: 'year', title: 'Tell us your year', body: 'Paths reads your levels one school year at a time.', cta: 'Start', s: 'start' };
  }
  const y = st.year;
  if (y === 'p6') {
    const sc = api.data.psle ? psleScore(st.psle || {}, api.data.psle) : { complete: false };
    return sc.complete
      ? { art: 'levels', title: 'Use your PSLE levels for Sec 1', body: `PSLE Score ${sc.score}. Your Sec 1 page shows what those levels keep on track.`, cta: 'Open Sec 1', s: 'year', y: 'sec1' }
      : { art: 'levels', title: 'Enter your PSLE ALs', body: 'See your Posting Group and the level each subject would start at in Sec 1.', cta: 'Enter ALs', s: 'year', y: 'p6' };
  }
  const plan = (st.plans && st.plans[y]) || {};
  if (!Object.keys(plan).length) {
    const from = prevYear(y);
    const carry = from && Object.keys((st.plans || {})[from] || {}).length;
    return {
      art: 'levels', title: `Set your ${LABEL[y]} levels`,
      body: carry ? `Copy your ${LABEL[from]} levels in one tap, then adjust.` : 'Slide each subject to its level. The chart shows what each level opens.',
      cta: 'Set levels', s: 'year', y, tab: 'levels',
    };
  }
  const a = advise({ yearId: y, plan, ctx: c });
  const top = a.singles[0] || a.pairs[0];
  if (top && !st.actions.includes(sayMove(top, st.role))) {
    return { art: 'move', k: t('nextMove'), title: top.result, body: `${top.cond.charAt(0).toUpperCase()}${top.cond.slice(1)}.`, cta: 'See this move', s: 'year', y, tab: 'advice' };
  }
  if (!isLower(y) && !Object.keys(st.grades.target || {}).length) {
    return { art: 'reveal', title: 'Set your grade targets', body: 'See the score each place reads, and the grades that close a gap.', cta: 'Set targets', s: 'year', y, tab: 'targets' };
  }
  const talk = ((((api.data.years || {}).years || {})[y] || {}).talk || {})[st.role] || [];
  const said = st.actions[0];
  return {
    art: 'move', title: 'Talk to someone this week',
    body: said || talk[0] || 'Take your plan to a parent, a form teacher or your ECG counsellor.',
    cta: t('openPlan'), s: 'myplan',
  };
}

function renderHome(root, api) {
  const st = getState();
  const c = api.ctx();
  const y = st.yearSet ? st.year : null;
  const ns = nextStep(api);
  const showSig = y && y !== 'p6' && Object.keys((st.plans || {})[y] || {}).length;
  const rows = showSig ? (() => {
    const ep = evalPlan(y, st.plans[y], c.subjects);
    return c.destinations.map((d) => reach(ep, d, { ...c, plan: ep, yearId: y }));
  })() : null;

  root.innerHTML = `
  <div class="wrap-narrow homewrap">
    ${y ? `<p class="hm-where">${st.role === 'student' ? 'You are in' : 'Now in'} <b>${esc(LABEL[y])}</b> <button type="button" class="linkbtn" data-action="hm-change">Change</button></p>` : ''}

    <section class="nextstep arrive" aria-labelledby="ns-h">
      <div class="ns-art">${stepArt(ns.art)}</div>
      <p class="ns-k">${esc(ns.k || 'Your next step')}</p>
      <h1 id="ns-h">${esc(ns.title)}</h1>
      <p class="ns-p">${esc(ns.body)}</p>
      <button type="button" class="btn big press" data-action="go" data-s="${esc(ns.s)}"${ns.y ? ` data-y="${esc(ns.y)}"` : ''}${ns.tab ? ` data-tab="${esc(ns.tab)}"` : ''}>${esc(ns.cta)} ${icon('arrow')}</button>
    </section>

    ${rows ? `
    <section class="hm-signal arrive d1">
      ${signalHtml(rows, { key: 'home', caption: `From your ${LABEL[y]} levels` })}
      <button type="button" class="linkbtn" data-action="go" data-s="after">What each place asks and costs ${icon('arrow')}</button>
    </section>` : ''}

    <nav class="hm-doors arrive d2" aria-label="More">
      <button type="button" class="hm-door press" data-action="go" data-s="year">${icon('steps')}<span><b>Subjects</b><small>Levels, moves and targets</small></span></button>
      <button type="button" class="hm-door press" data-action="go" data-s="play">${icon('play')}<span><b>Play a life forward</b><small>A ten minute game</small></span></button>
      <button type="button" class="hm-door press" data-action="go" data-s="myplan">${icon('flag')}<span><b>${esc(t('plan'))}</b><small>${esc(t('keptCount', st.actions.length))}, ready to share</small></span></button>
    </nav>
  </div>`;

  onAction(root, {
    'hm-change': () => {
      api.sheet(`<h2 id="sheet-title">Which year?</h2><div class="yeargrid">${YEARS.map((x) => `<button type="button" class="btn ${x.id === y ? '' : 'ghost'} press" data-action="hm-pick" data-id="${x.id}">${esc(x.label)}</button>`).join('')}</div>`);
    },
    dest: (btn) => api.nav('dest', { id: btn.dataset.id }),
  });
  onAction(document.body, {
    'hm-pick': (btn) => { setYear(btn.dataset.id); api.closeSheet(); api.refresh(); },
  });
}
