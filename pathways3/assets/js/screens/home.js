// Home: your map.
//
// First visit is a 30-second conversation, had once: which year you are in
// (v2 silently assumed Sec 2, which was wrong for four cohorts out of five),
// then the guess, asked about YOU, then the reveal performed by the map
// itself: eight threads draw out of the platform you are standing on and
// every station lights. All eight, still yours. Skipping is answering: v2
// re-quizzed a student who tapped "Straight in" on every visit forever,
// because the reveal keyed on whether a guess was recorded.
//
// Every visit after that, this screen is a live object: the map painted in
// the current plan's reach states, one computed next step, and three doors
// carrying what the device already holds.

import { getState, setYear, YEARS, markWelcome, isGuest } from '../state.js?v=3.0.0';
import { reach } from '../engine/reach.js?v=3.0.0';
import { railMap, openCount } from '../ui/map.js?v=3.0.0';
import { destSheetHtml } from '../ui/destsheet.js?v=3.0.0';
import { esc, onAction } from '../ui/dom.js?v=3.0.0';
import { icon } from '../ui/icons.js?v=3.0.0';

let step = null; // null = decide from state; 'year' | 'guess' | 'reveal'
let guessed = null;

function reaches(api) {
  const c = api.ctx();
  return c.destinations.map((d) => reach(c.plan, d, c));
}

export default {
  id: 'home',
  title: 'Your map',
  era: 'school',

  render(root, api) {
    const st = getState();
    if (step === null) step = st.seenWelcome ? 'home' : 'year';
    if (step === 'home' && !st.seenWelcome) step = 'year';

    if (step === 'year') return renderYear(root, api);
    if (step === 'guess') return renderGuess(root, api);
    if (step === 'reveal') return renderReveal(root, api);
    return renderHome(root, api);
  },
};

/* ---- step 1: the year --------------------------------------------------- */

function renderYear(root, api) {
  root.innerHTML = `
  <div class="wrap-narrow hero">
    <p class="kicker caps">${esc(api.copy('landing.kicker', 'For Singapore secondary students'))}</p>
    <h1 class="arrive">${esc(api.copy('landing.yearHead', 'Which year are you in?'))}</h1>
    <p class="lede arrive d1">${esc(api.copy('landing.yearLede', 'One tap. It sets which subjects you see and where the game starts.'))}</p>
    <div class="yeargrid arrive d2">
      ${YEARS.map((y) => `<button type="button" class="btn ghost big press" data-action="hm-year" data-id="${y.id}">${esc(y.label)}</button>`).join('')}
    </div>
    <p class="arrive d3"><button type="button" class="btn ghost small" data-action="hm-skip">${esc(api.copy('landing.skip', 'Straight in'))}</button></p>
  </div>`;
  bind(root, api);
}

/* ---- step 2: the guess, about you ---------------------------------------- */

function renderGuess(root, api) {
  root.innerHTML = `
  <div class="wrap-narrow hero">
    <p class="kicker caps">${esc(api.copy('landing.kicker', 'For Singapore secondary students'))}</p>
    <h1 class="arrive">${esc(api.copy('landing.guessHead', 'Eight places you could go after secondary school. How many stay open for you, whatever subjects you pick?'))}</h1>
    <p class="lede arrive d1">${esc(api.copy('landing.guessLede', 'Take a guess. Tap a number.'))}</p>
    <div class="guessgrid arrive d2">
      ${Array.from({ length: 9 }, (_, n) =>
        `<button type="button" class="guess-n press" data-action="hm-guess" data-n="${n}" aria-pressed="false">${n}</button>`).join('')}
    </div>
    <div class="trustrow arrive d3">
      ${['landing.trust1|No account, no sign in', 'landing.trust2|Nothing you do here leaves this phone', 'landing.trust3|Nothing here will ever say a road is closed to you']
        .map((s) => { const [k, f] = s.split('|'); return `<span class="pill" data-tone="quiet">${esc(api.copy(k, f))}</span>`; }).join('')}
    </div>
    <p style="margin-top:16px"><button type="button" class="btn ghost small" data-action="hm-skip">${esc(api.copy('landing.skip', 'Straight in'))}</button></p>
  </div>`;
  bind(root, api);
}

/* ---- step 3: the reveal, drawn ------------------------------------------- */

function renderReveal(root, api) {
  const rows = reaches(api);
  const open = openCount(rows);
  const line = guessed == null
    ? api.copy('landing.revealSkip', 'All eight have a road in.')
    : (guessed === open
      ? api.copy('landing.revealRight', 'You said all eight. All eight.')
      : `${api.copy('landing.revealIs', 'It is all eight.')} ${api.copy('landing.revealGuess', 'You guessed')} ${guessed}.`);

  root.innerHTML = `
  <div class="wrap-narrow hero">
    <h1 class="arrive">${esc(line)}</h1>
    <p class="lede arrive d1">${esc(api.copy('landing.revealLede', 'Every one of these keeps a road in, whatever you pick. Subjects change how direct the road is, never whether one exists.'))}</p>
    <div class="section" style="border:0">
      ${railMap(rows, { animate: true, tappable: true, reveal: true })}
    </div>
    <div class="btnrow arrive d2">
      <button type="button" class="btn big press" data-action="hm-start">${esc(api.copy('landing.start', 'Make it yours'))}</button>
      <span class="small">${esc(api.copy('landing.startNote', 'Pick your real subjects and watch the map answer.'))}</span>
    </div>
  </div>`;
  api.cue('ending');
  bind(root, api);
}

/* ---- the standing home ----------------------------------------------------- */

function renderHome(root, api) {
  const st = getState();
  const rows = reaches(api);
  const open = openCount(rows);
  const subjects = Object.keys(st.plan).length;

  const next = nextStep(st, subjects, api);
  const runLine = st.liveRun
    ? api.copy('landing.doorPlayLive', 'A life is mid-story on this phone')
    : (st.runs.length ? `${st.runs.length} ${st.runs.length === 1 ? 'life lived' : 'lives lived'} on this phone` : api.copy('landing.doorPlayNone', 'Live one life forward to 48'));

  root.innerHTML = `
  <div class="wrap">
    <header class="hero">
      <h1>${esc(api.copy('landing.homeHead', 'Your map.'))}</h1>
      <p class="lede">${subjects
        ? `${subjects} subject${subjects === 1 ? '' : 's'} set. ${open} of ${rows.length} open right now, and every one keeps a road in.`
        : esc(api.copy('landing.homeLede', 'Eight places after secondary school. All of them keep a road in. Subjects change how direct the road is.'))}</p>
    </header>

    <div class="nextcard arrive">
      <p><strong>${esc(next.line)}</strong></p>
      <button type="button" class="btn press" data-action="${esc(next.action)}"${next.s ? ` data-s="${esc(next.s)}"` : ''}>${esc(next.btn)}</button>
    </div>

    <div class="homegrid section" style="border:0">
      <section aria-label="The eight destinations">
        ${railMap(rows, { tappable: true })}
      </section>
      <div>
        <nav class="doorrow" aria-label="Plan, Play, Act">
          <button type="button" class="door press" data-action="go" data-s="plan">
            ${icon('map')}
            <span><span class="door-name">${esc(api.copy('landing.doorPlan', 'Plan'))}</span>
            <span class="door-live">${subjects ? `${subjects} subjects set · ${open} open now` : esc(api.copy('landing.doorPlanNone', 'Set your combination, watch the doors'))}</span></span>
            <span class="door-arrow" aria-hidden="true">›</span>
          </button>
          <button type="button" class="door press" data-action="go" data-s="play">
            ${icon('play')}
            <span><span class="door-name">${esc(api.copy('landing.doorPlay', 'Play'))}</span>
            <span class="door-live">${esc(runLine)}</span></span>
            <span class="door-arrow" aria-hidden="true">›</span>
          </button>
          <button type="button" class="door press" data-action="go" data-s="act">
            ${icon('flag')}
            <span><span class="door-name">${esc(api.copy('landing.doorAct', 'Act'))}</span>
            <span class="door-live">${(st.actions || []).length ? `${st.actions.length} thing${st.actions.length === 1 ? '' : 's'} you said you would do` : esc(api.copy('landing.doorActNone', 'Leave with three things to do this term'))}</span></span>
            <span class="door-arrow" aria-hidden="true">›</span>
          </button>
        </nav>

        <p class="caps" style="margin-top:24px">${esc(api.copy('landing.alsoHead', 'Also here'))}</p>
        <div class="morerow">
          <button type="button" class="chip press" data-action="go" data-s="work">${esc(api.copy('landing.alsoWork', 'The work itself'))}</button>
          <button type="button" class="chip press" data-action="go" data-s="money">${esc(api.copy('landing.alsoMoney', 'Costs and help'))}</button>
          <button type="button" class="chip press" data-action="go" data-s="schools">${esc(api.copy('landing.alsoSchools', 'My kind of school'))}</button>
          <button type="button" class="chip press" data-action="go" data-s="adults">${esc(api.copy('landing.alsoAdults', 'For parents and teachers'))}</button>
        </div>

        ${isGuest() ? '' : `<p class="small" style="margin-top:24px">${esc(api.copy('landing.trust2', 'Nothing you do here leaves this phone'))}. ${esc(api.copy('landing.trustNote', 'No account, no server, nothing collected.'))}</p>`}
      </div>
    </div>
  </div>`;
  bind(root, api);
}

function nextStep(st, subjects, api) {
  if (!st.yearSet) return { line: api.copy('landing.nextYear', 'Start where you are: which year?'), btn: api.copy('landing.nextYearBtn', 'Tell me'), action: 'hm-ask-year' };
  if (!subjects) return { line: api.copy('landing.nextPlan', 'Set your first subject and watch the map answer.'), btn: 'Plan', action: 'go', s: 'plan' };
  if (st.liveRun) return { line: api.copy('landing.nextResume', 'Your life is mid-chapter. Pick it back up.'), btn: 'Continue', action: 'go', s: 'play' };
  if (!st.runs.length) return { line: api.copy('landing.nextPlay', 'Play these subjects forward. Ten minutes, one life.'), btn: 'Play', action: 'go', s: 'play' };
  if (!(st.actions || []).length) return { line: api.copy('landing.nextAct', 'You lived a life. Leave with three real moves.'), btn: 'Act', action: 'go', s: 'act' };
  return { line: api.copy('landing.nextAgain', 'Three roads you have not walked yet.'), btn: 'Play again', action: 'go', s: 'play' };
}

/* ---- shared bindings ---------------------------------------------------------- */

function bind(root, api) {
  onAction(root, {
    'hm-year': (btn) => { setYear(btn.dataset.id); step = 'guess'; api.refresh(); },
    'hm-skip': () => { markWelcome(null); step = 'home'; api.refresh(); },
    'hm-guess': (btn) => {
      guessed = Number(btn.dataset.n);
      btn.setAttribute('aria-pressed', 'true');
      markWelcome(guessed);
      step = 'reveal';
      api.refresh();
    },
    'hm-start': () => { step = 'home'; api.nav('plan'); },
    'hm-ask-year': (btn) => { document.querySelector('[data-action="year"]')?.click(); },
    dest: (btn) => {
      const rows = reaches(api);
      const row = rows.find((r) => r.id === btn.dataset.id);
      if (row) api.sheet(destSheetHtml(row, api.data), btn);
    },
  });
}
