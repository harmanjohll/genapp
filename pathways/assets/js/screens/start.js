// The start: had once, about ninety seconds, one task per screen.
//
// WHY THIS EXISTS. The first v4 build opened on a question about roles and
// years, then dropped a student onto a year page with eight concepts on it.
// Nobody could say what to tap first. The start is a path instead of a
// toolbox:
//
//   intro   a wordless animation: switches feed roads, one switch moves,
//           more lamps light, none goes dark. Then "See what your levels
//           open."
//   year    tap your year on the line
//   levels  only the core subjects, big switches, the live signal above them
//           re-lighting on every tap
//   reveal  the signal draws itself: N of 8 open, none ever closed
//   move    your next move, as one card, with the words to say and Save
//   done    "Saved. Next time, start here." and the words choice
//
// Skip works everywhere and counts as having had the start. The engine is
// the same one every other screen uses; nothing here decides anything new.

import {
  getState, setYear, YEARS, markStart, markWelcome, setYearLevel, setLabelMode,
} from '../state.js?v=4.3.0';
import { reach } from '../engine/reach.js?v=4.3.0';
import { evalPlan, isLower } from '../engine/years.js?v=4.3.0';
import { advise } from '../engine/advice.js?v=4.3.0';
import { signalHtml } from '../ui/signal.js?v=4.3.0';
import { stepArt, introArt } from '../ui/scenes.js?v=4.3.0';
import { ticketHtml } from '../ui/ticket.js?v=4.3.0';
import { subjTile, patchTile } from './year.js?v=4.3.0';
import { esc, onAction } from '../ui/dom.js?v=4.3.0';
import { icon } from '../ui/icons.js?v=4.3.0';
import { t, openWord } from '../ui/labels.js?v=4.3.0';

const ORDER = ['year', 'levels', 'reveal', 'move'];
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
    const step = q.step || 'intro';
    const y = st.yearSet && st.year !== 'p6' ? st.year : null;
    const go = (s) => { api.setQuery({ step: s }); api.refresh(); window.scrollTo({ top: 0 }); };

    if (step === 'intro') renderIntro(root, api);
    else if (step === 'year') renderYear(root, api);
    else if (step === 'levels' && y) renderLevels(root, api, y);
    else if (step === 'reveal' && y) renderReveal(root, api, y);
    else if (step === 'move' && y) renderMove(root, api, y);
    else if (step === 'done') renderDone(root, api);
    else renderYear(root, api);

    onAction(root, {
      'st-skip': () => { markStart(true); markWelcome(null); api.nav('home'); },
      'st-back': () => {
        const cur = api.route().q.step || 'intro';
        const i = ORDER.indexOf(cur);
        go(i <= 0 ? 'intro' : ORDER[i - 1]);
      },
      'st-go': (btn) => go(btn.dataset.step),
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
        { const rr = rowsFor(api, yy); api.announce(`${rr.filter((r) => r.state === 'open').length} of 8 ${openWord(rr)}.`); }
      },
      'st-finish': () => { markStart(true); api.nav('home'); },
      'st-words': (btn) => {
        setLabelMode(btn.dataset.mode);
        root.querySelectorAll('[data-action="st-words"]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.mode === btn.dataset.mode)));
      },
      dest: (btn) => { markStart(true); api.nav('dest', { id: btn.dataset.id }); },
    });
  },
};

// The intro's example, run through the real engine so every lit lamp is
// true for it: Maths from G1 to G2 is the move.
const EXAMPLE = { el: 'G2', mtl: 'G2', maths: 'G1', sci_pc: 'G2', hum_ss_geog: 'G2' };

function introExample(api) {
  const c = api.ctx();
  // The example is a Sec 3 combination, so it is read by the SEC rules
  // whatever year the reader is in.
  const run = (plan) => c.destinations.map((d) => reach(plan, d, { ...c, plan, yearId: 'sec3' }));
  const before = run(EXAMPLE);
  const after = run({ ...EXAMPLE, maths: 'G2' });
  const opened = after.filter((r, i) => r.state === 'open' && before[i].state !== 'open').map((r) => r.railName);
  return {
    opened,
    subjects: [
      { name: 'English', from: 'G2' }, { name: 'Mother Tongue', from: 'G2' },
      { name: 'Maths', from: 'G1', to: 'G2' }, { name: 'Science', from: 'G2' }, { name: 'Humanities', from: 'G2' },
    ],
    dests: before.map((r, i) => ({ name: r.railName, before: r.state === 'open', after: after[i].state === 'open' })),
  };
}

function renderIntro(root, api) {
  const ex = introExample(api);
  const caps = [
    'Here is an example student. These are their subject levels.',
    'Their levels lead to the 8 places you can go after secondary school.',
    'Green means open now. Rings are a move or more away.',
    `Move Maths up one level, from G1 to G2, and ${ex.opened.length === 1 ? 'one more opens' : `${ex.opened.length} more open`}.`,
    'None ever closes. Every place keeps a way in.',
  ];
  root.innerHTML = `
  <section class="st st-intro">
    <div class="st-introbar"><button type="button" class="st-skip press" data-action="st-go" data-step="year">Skip intro</button></div>
    <p class="st-caps" aria-live="polite">${caps.map((c, i) => `<span style="--i:${i}"${i === caps.length - 1 ? ' class="last"' : ''}>${esc(c)}</span>`).join('')}</p>
    <div class="st-stage">${introArt(ex)}</div>
    <p class="st-legend"><span data-k="open">Open now</span><span data-k="ring">Not open yet: 1 or more moves away</span></p>
    <div class="st-introcopy">
      <h1>See what your levels open.</h1>
      <button type="button" class="btn big press" data-action="st-go" data-step="year">Try it with my levels ${icon('arrow')}</button>
      <p class="st-promise">${icon('check')} No account. Nothing leaves this device.</p>
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
      <h1>${st.role === 'parent' ? 'Which year is your child in?' : st.role === 'teacher' ? 'Which year is the student in?' : 'Which year are you in?'}</h1>
      <p class="st-sub">Tap your stop on the line.</p>
      <ol class="bigline st-line" aria-label="School years">
        ${YEARS.map((y, i) => `<li style="--i:${i}">
          <button type="button" class="bigstn press" data-action="st-year" data-id="${y.id}" aria-current="${st.yearSet && st.year === y.id ? 'true' : 'false'}">
            <span class="bigstn-dot" aria-hidden="true"></span>
            <span class="bigstn-code">${esc(y.id === 'p6' ? 'P6' : y.label.replace('Sec ', 'S'))}</span>
            <span class="bigstn-name">${esc(y.id === 'p6' ? 'Primary 6' : y.label)}</span>
          </button>
        </li>`).join('')}
      </ol>
      <p class="small st-role">Not a student? <button type="button" class="linkbtn" data-action="role">Change who is reading</button></p>
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
      <h1>Slide in your ${esc(LABEL[y])} levels.</h1>
      <p class="st-sub">Your best guess is fine. Watch the lamps above as you go.</p>
      <p class="st-key">${['G1', 'G2', 'G3'].map((l) => `<span style="--lvc:var(--${l.toLowerCase()})"><b>${l}</b> ${esc(((li[l] && li[l].plain) || '').replace(/\.$/, ''))}</span>`).join('')}</p>
      <div class="subjgrid">${rows.map((s) => subjTile(s, plan, 'st-lvl')).join('')}</div>
      ${!isLower(y) ? '<p class="small">Pick your exact science and humanities subjects later, on your year page.</p>' : ''}
      <div class="st-foot">
        <button type="button" class="btn big press" id="st-next" data-ready="${n >= 3}" data-action="st-go" data-step="reveal">See what is open ${icon('arrow')}</button>
      </div>
    </div>
  </section>`;
}

function renderReveal(root, api, y) {
  const rows = rowsFor(api, y);
  const open = rows.filter((r) => r.state === 'open').length;
  root.innerHTML = `
  <section class="st">
    ${bar('reveal')}
    <div class="wrap-narrow st-body">
      <h1>${open} of ${rows.length} ${openWord(rows) === 'on track' ? 'are on track.' : 'are open now.'}</h1>
      <p class="st-sub">${openWord(rows) === 'on track' ? 'On track means your levels now fit what each place will ask in the SEC. The rest are a move or more away. None is ever closed.' : 'The rest are a move or more away. None is ever closed.'}</p>
      <div class="st-reveal">${signalHtml(rows, { key: 'start-reveal', intro: true })}</div>
      <div class="st-foot">
        <button type="button" class="btn big press" data-action="st-go" data-step="move">Show my next move ${icon('arrow')}</button>
      </div>
    </div>
  </section>`;
}

function renderMove(root, api, y) {
  const st = getState();
  const a = advise({ yearId: y, plan: st.plans[y] || {}, ctx: api.ctx() });
  const top = a.singles[0] || a.pairs[0];
  root.innerHTML = `
  <section class="st">
    ${bar('move')}
    <div class="wrap-narrow st-body">
      <div class="st-art">${stepArt('move')}</div>
      <h1>${top ? esc(t('nextMove')) : 'Every door is open.'}</h1>
      <p class="st-sub">${top ? 'One move, what it opens, and who to say it to.' : 'From here, the question is which two years you want. The game lets you try one.'}</p>
      ${top ? ticketHtml(top, { hero: true, simple: true }) : ''}
      <div class="st-foot static">
        <button type="button" class="btn big press" data-action="st-go" data-step="done">Done ${icon('arrow')}</button>
      </div>
    </div>
  </section>`;
}

function renderDone(root, api) {
  const st = getState();
  root.innerHTML = `
  <section class="st">
    <div class="wrap-narrow st-body st-done">
      <div class="st-art">${stepArt('done')}</div>
      <h1>Saved. Next time, start here.</h1>
      <p class="st-sub">Home always shows your next step. Everything else is one tap away.</p>
      <div class="st-words">
        <p class="st-words-h">How should the app talk?</p>
        <div class="rolebar on-paper" role="radiogroup" aria-label="Words">
          <button type="button" role="radio" class="rolebar-b press" data-action="st-words" data-mode="plain" aria-checked="${st.labelMode !== 'line'}">Plain words</button>
          <button type="button" role="radio" class="rolebar-b press" data-action="st-words" data-mode="line" aria-checked="${st.labelMode === 'line'}">Line mode</button>
        </div>
        <p class="small">Line mode talks like a transit system: departures, tickets, a pass. Change it any time in Settings.</p>
      </div>
      <div class="st-foot">
        <button type="button" class="btn big press" data-action="st-finish">Go to Home ${icon('arrow')}</button>
      </div>
    </div>
  </section>`;
}
