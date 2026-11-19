// The start: had once, about a minute, one task per screen.
//
// 7.4 rewrite. The first run used to teach levels and places with an
// animation, then show "N of 8" and push a move up. That opened the app on
// how to get there, before asking anything about the student, and it scored
// them on the way in. The start now follows the same order as the tabs:
//
//   welcome  the three questions, as the three things you will do here
//   me       what do you enjoy? one or two taps (it can be skipped)
//   year     tap your year
//   levels   the core subjects, big switches, the eight places beside them
//
// Then the path, which shows the next step. There is no count of places and
// no move pushed here: every place is a path in its own right.
//
// Skip works everywhere and counts as having had the start. The engine is
// the same one every other screen uses; nothing here decides anything new.

import {
  getState, setYear, YEARS, markStart, markWelcome, setYearLevel, toggleEnjoy,
} from '../state.js?v=7.5';
import { reach } from '../engine/reach.js?v=7.5';
import { evalPlan, isLower } from '../engine/years.js?v=7.5';
import { signalHtml } from '../ui/signal.js?v=7.5';
import { stepArt } from '../ui/scenes.js?v=7.5';
import { subjTile, patchTile } from './year.js?v=7.5';
import { esc, onAction } from '../ui/dom.js?v=7.5';
import { icon } from '../ui/icons.js?v=7.5';

const ORDER = ['me', 'year', 'levels'];
const LABEL = Object.fromEntries(YEARS.map((y) => [y.id, y.label]));

// The quick rows. Lower secondary is exactly its six levelled subjects.
// Upper secondary folds the science and humanities options into one row
// each; the exact pair is chosen later on the year page. For the
// destination rules the fold is exact: they read levels and counts, not
// which science.
function quickRows(api, y) {
  const byId = Object.fromEntries(api.ctx().subjects.map((s) => [s.id, s]));
  if (isLower(y)) {
    return ['el', 'mtl', 'maths', 'ls_science', 'ls_geography', 'ls_history'].map((id) => byId[id]).filter(Boolean);
  }
  return [
    byId.el, byId.mtl, byId.maths,
    { id: 'q_science', name: 'Science', levels: ['G1', 'G2', 'G3'], compulsory: false, status: 'confirmed' },
    { id: 'q_hum', name: 'Humanities', levels: ['G2', 'G3'], compulsory: false, status: 'confirmed' },
  ].filter(Boolean);
}

/** Read a quick row's level from the real plan. */
function quickPlan(plan) {
  return {
    ...plan,
    q_science: plan.science_g1 || plan.sci_pc || plan.sci_pb || plan.sci_cb || null,
    q_hum: plan.hum_ss_geog || plan.hum_ss_hist || plan.hum_ss_lit || null,
  };
}

/** Write a quick row's level into the real plan. */
function setQuick(y, id, level) {
  const plan = getState().plans[y] || {};
  if (id === 'q_science') {
    ['science_g1', 'sci_pb', 'sci_cb'].forEach((x) => { if (plan[x]) setYearLevel(y, x, null); });
    if (!level) { if (plan.sci_pc) setYearLevel(y, 'sci_pc', null); return; }
    if (level === 'G1') { if (plan.sci_pc) setYearLevel(y, 'sci_pc', null); setYearLevel(y, 'science_g1', 'G1'); return; }
    setYearLevel(y, 'sci_pc', level, 'Science');
    return;
  }
  if (id === 'q_hum') {
    const held = ['hum_ss_geog', 'hum_ss_hist', 'hum_ss_lit'].find((x) => plan[x]) || 'hum_ss_geog';
    setYearLevel(y, held, level, 'Humanities');
    return;
  }
  setYearLevel(y, id, level);
}

function rowsFor(api, y) {
  const c = api.ctx();
  const ep = evalPlan(y, getState().plans[y] || {}, c.subjects);
  return c.destinations.map((d) => reach(ep, d, { ...c, plan: ep, yearId: y }));
}

function dots(step) {
  const i = ORDER.indexOf(step);
  return `<ol class="st-dots" aria-label="Step ${i + 1} of ${ORDER.length}">${ORDER.map((s, k) =>
    `<li data-on="${k <= i}" aria-current="${k === i ? 'step' : 'false'}"></li>`).join('')}</ol>`;
}

function bar(step, back = true) {
  return `<div class="st-bar">
    ${back ? `<button type="button" class="st-back press" data-action="st-back" aria-label="Back">${icon('back')}</button>` : '<span></span>'}
    ${dots(step)}
    <button type="button" class="st-skip press" data-action="st-skip">Skip setup</button>
  </div>`;
}

export default {
  id: 'start',
  title: 'Start',
  era: 'school',

  render(root, api) {
    const st = getState();
    document.body.dataset.dock = 'off';
    const q = api.route().q;
    const step = q.step || 'welcome';
    const y = st.yearSet && st.year !== 'p6' ? st.year : null;
    const go = (s) => { api.setQuery({ step: s }); api.refresh(); window.scrollTo({ top: 0 }); };

    if (step === 'me') renderMe(root, api);
    else if (step === 'year') renderYear(root, api);
    else if (step === 'levels' && y) renderLevels(root, api, y);
    else if (step === 'levels') renderYear(root, api);
    else renderWelcome(root);

    onAction(root, {
      'st-skip': () => { markStart(true); markWelcome(null); api.nav('home'); },
      'st-back': () => {
        const i = ORDER.indexOf(api.route().q.step || 'welcome');
        go(i <= 0 ? 'welcome' : ORDER[i - 1]);
      },
      'st-go': (btn) => go(btn.dataset.step),
      'st-enjoy': (btn) => {
        toggleEnjoy(btn.dataset.code);
        const picked = getState().compass.enjoy;
        root.querySelectorAll('[data-action="st-enjoy"]').forEach((b) => b.setAttribute('aria-pressed', String(picked.includes(b.dataset.code))));
        const nb = root.querySelector('#st-next');
        if (nb) nb.firstChild.textContent = picked.length ? 'Next ' : 'Skip for now ';
      },
      'st-year': (btn) => {
        const id = btn.dataset.id;
        setYear(id);
        markWelcome(null);
        if (id === 'p6') { markStart(true); api.nav('year', { y: 'p6' }); return; }
        go('levels');
      },
      'st-lvl': (btn) => {
        const yy = getState().year;
        const id = btn.dataset.sid;
        const level = btn.dataset.level;
        const qp = quickPlan(getState().plans[yy] || {});
        const next = qp[id] === level ? null : level;
        setQuick(yy, id, next);
        const row = quickRows(api, yy).find((r) => r.id === id);
        patchTile(root, id, next, row ? row.name : id);
        const sig = root.querySelector('#st-signal');
        if (sig) sig.innerHTML = signalHtml(rowsFor(api, yy), { key: 'start-mini', mini: true });
        const n = Object.keys(getState().plans[yy] || {}).length;
        const nb = root.querySelector('#st-next');
        if (nb) nb.dataset.ready = String(n >= 3);
        api.announce(next ? `${row ? row.name : id} at ${next}.` : `${row ? row.name : id} cleared.`);
      },
      'st-finish': () => { markStart(true); api.nav('path'); },
    });
  },
};

function renderWelcome(root) {
  const rows = [
    ['compass', 'Who am I?', 'Two taps about what you enjoy.'],
    ['target', 'Where do I want to go?', 'A goal, when you are ready.'],
    ['steps', 'How do I get there?', 'Your subject levels, year by year.'],
  ];
  root.innerHTML = `
  <section class="st st-welcome">
    <div class="wrap-narrow st-body">
      <span class="st-seal" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M7 23 C12 23 11 9 16 9 C21 9 20 23 25 23" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/><circle cx="7" cy="23" r="2.4" fill="#FFFFFF"/><circle cx="25" cy="23" r="2.4" fill="#FFFFFF"/></svg></span>
      <h1>Plan secondary school, your way</h1>
      <p class="st-sub">Three questions. About a minute to start.</p>
      <ol class="st-three">
        ${rows.map(([ic, q, line]) => `<li>${icon(ic)}<span><b>${esc(q)}</b>${esc(line)}</span></li>`).join('')}
      </ol>
      <div class="st-foot static">
        <button type="button" class="btn big press" data-action="st-go" data-step="me">Start ${icon('arrow')}</button>
      </div>
      <p class="st-promise">${icon('check')} No sign up. Your plan stays on this device.</p>
      <p class="small st-role">Anyone can use Paths, parents too. New to subject levels? <button type="button" class="linkbtn" data-action="go" data-s="adults">See what changed</button></p>
    </div>
  </section>`;
}

function renderMe(root, api) {
  const picked = getState().compass.enjoy;
  root.innerHTML = `
  <section class="st">
    ${bar('me')}
    <div class="wrap-narrow st-body">
      <p class="ph-k">Who am I?</p>
      <h1>What do you enjoy?</h1>
      <p class="st-sub">Pick one or two. You can change them any time.</p>
      <div class="gpick">${((api.data.goals || {}).interests || []).map((x) => `<button type="button" class="gopt press" data-action="st-enjoy" data-code="${x.code}" aria-pressed="${picked.includes(x.code)}">${esc(x.label)}</button>`).join('')}</div>
      <div class="st-foot static">
        <button type="button" class="btn big press" id="st-next" data-action="st-go" data-step="year">${picked.length ? 'Next ' : 'Skip for now '}${icon('arrow')}</button>
      </div>
    </div>
  </section>`;
}

function renderYear(root, api) {
  const st = getState();
  root.innerHTML = `
  <section class="st">
    ${bar('year')}
    <div class="wrap-narrow st-body">
      <div class="st-art">${stepArt('year')}</div>
      <p class="ph-k">How do I get there?</p>
      <h1>Which year are you in?</h1>
      <p class="st-sub">Tap your year.</p>
      <ol class="bigline st-line" aria-label="School years">
        ${YEARS.map((y, i) => `<li style="--i:${i}">
          <button type="button" class="bigstn press" data-action="st-year" data-id="${y.id}" aria-current="${st.yearSet && st.year === y.id ? 'true' : 'false'}">
            <span class="bigstn-dot" aria-hidden="true"></span>
            <span class="bigstn-code">${esc(y.id === 'p6' ? 'P6' : y.label.replace('Sec ', 'S'))}</span>
            <span class="bigstn-name">${esc(y.id === 'p6' ? 'Primary 6' : y.label)}</span>
          </button>
        </li>`).join('')}
      </ol>
    </div>
  </section>`;
}

function renderLevels(root, api, y) {
  const plan = quickPlan(getState().plans[y] || {});
  const rows = quickRows(api, y);
  const li = api.data.subjects.levelInfo || {};
  const n = Object.keys(getState().plans[y] || {}).length;
  root.innerHTML = `
  <section class="st">
    ${bar('levels')}
    <div class="st-sticky" id="st-signal">${signalHtml(rowsFor(api, y), { key: 'start-mini', mini: true })}</div>
    <div class="wrap-narrow st-body">
      <h1>Set your ${esc(LABEL[y])} levels</h1>
      <p class="st-sub">A best guess is fine. The chart shows where each level leads.</p>
      <p class="st-key">${['G1', 'G2', 'G3'].map((l) => `<span style="--lvc:var(--${l.toLowerCase()})"><b>${l}</b> ${esc(((li[l] && li[l].plain) || '').replace(/\.$/, ''))}</span>`).join('')}</p>
      <div class="subjgrid">${rows.map((s) => subjTile(s, plan, 'st-lvl')).join('')}</div>
      ${!isLower(y) ? '<p class="small">Choose your exact sciences and humanities later, on the year page.</p>' : ''}
      <div class="st-foot">
        <button type="button" class="btn big press" id="st-next" data-ready="${n >= 3}" data-action="st-finish">See my path ${icon('arrow')}</button>
      </div>
    </div>
  </section>`;
}
