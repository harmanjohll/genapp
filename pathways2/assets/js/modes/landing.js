// The landing: one question, answered by the eight themselves.
//
// v2.0 asked the question in prose and answered it in prose. Now the eight
// destinations stand on the page as named cards, the student commits a guess,
// and the cards answer one at a time: each turns to show "a road in", in a
// stagger, until all eight stand open and the headline says what the student
// just watched happen. The thesis is not read here; it is witnessed.
//
// All eight get the identical treatment at the identical size, in data order.
// No card is bigger, brighter or first for any reason except the alphabet.

import { esc, onAction } from '../components/dom.js';
import { icon } from '../components/icons.js';
import { cue } from '../sound.js';
import { getState, markLanding } from '../state.js';
import { reach } from '../engine/reach.js';

export function renderLanding(host, data, ctx, leave) {
  const L = data.copy.landing;
  const st = getState();
  const total = ctx.destinations.length;
  const guessed = st.landingGuess;
  const revealed = guessed != null;

  // The claim is computed, not asserted: reach() over the empty plan, the
  // hardest case. If the engine ever disagreed with the copy, the console
  // would say so before a student did.
  const dests = ctx.destinations.slice().sort((a, b) => (a.order || 0) - (b.order || 0));
  const reachable = dests.filter((d) => {
    const r = reach({}, d, { ...ctx, plan: {} });
    return r.state === 'open' || r.routes.length > 0;
  }).length;
  if (reachable !== total) console.error(`landing claim check: ${reachable} of ${total} reachable`);

  const cards = dests.map((d, i) => `
    <li class="dest-card${revealed ? ' revealed' : ''}" style="--i:${i}">
      <span class="dest-name">${esc(d.railName)}</span>
      <span class="road-tag">${icon('q_how')}${esc(L.roadTag)}</span>
    </li>`).join('');

  const numbers = Array.from({ length: total + 1 }, (_, n) => `
    <button class="guess-n${guessed === n ? ' on' : ''}" type="button" data-action="guess" data-n="${n}"
            aria-pressed="${guessed === n}"${revealed ? ' disabled' : ''}>${n}</button>`).join('');

  host.innerHTML = `
    <div class="landing">
      <div class="landing-bg" aria-hidden="true">${roadsBackdrop()}</div>
      <div class="wrap">
        <p class="caps landing-kicker">${icon('brand')}${esc(L.kicker)}</p>
        <h1 class="serif landing-q">${esc(L.q)}</h1>
        <ul class="eight-grid" aria-label="The eight destinations">${cards}</ul>
        <div class="guess-block">
          ${revealed ? `
            <p class="reveal-big serif fade-up" tabindex="-1">${esc(L.revealAll)}</p>
            <p class="small mute fade-up">${esc(fill(L.revealYou, { n: guessed }))} ${esc(L.revealNote)}</p>` : `
            <p class="small mute">${esc(L.guessHint)}</p>
            <div class="guess-row" role="group" aria-label="Your guess">${numbers}</div>
            <p class="micro mute" style="margin-top:var(--s-4)">
              <button class="gloss" type="button" data-action="skip">${esc(L.skip)}</button>
            </p>`}
        </div>
        ${revealed ? `
          <div class="landing-doors fade-up">
            <button class="ldoor" type="button" data-action="go" data-mode="now">
              <span class="ldoor-ic">${icon('g_core')}</span>
              <span class="ldoor-name">${esc(L.enterPlan)}</span>
              <span class="ldoor-sub">${esc(L.enterPlanSub)}</span>
            </button>
            <span class="ldoor-arrow" aria-hidden="true">→</span>
            <button class="ldoor" type="button" data-action="go" data-mode="journey">
              <span class="ldoor-ic">${icon('q_how')}</span>
              <span class="ldoor-name">${esc(L.enterPlay)}</span>
              <span class="ldoor-sub">${esc(L.enterPlaySub)}</span>
            </button>
            <span class="ldoor-arrow" aria-hidden="true">→</span>
            <button class="ldoor" type="button" data-action="go" data-mode="aim">
              <span class="ldoor-ic">${icon('q_where')}</span>
              <span class="ldoor-name">${esc(L.enterAct)}</span>
              <span class="ldoor-sub">${esc(L.enterActSub)}</span>
            </button>
          </div>` : ''}
        <p class="micro faint landing-aud">${esc(L.audience)}</p>
      </div>
    </div>`;

  onAction(host, {
    guess: (btn) => {
      markLanding(Number(btn.dataset.n));
      cue('door');
      renderLanding(host, data, ctx, leave);
      const big = host.querySelector('.reveal-big');
      if (big) big.focus({ preventScroll: true });
    },
    go: (btn) => { markLanding(getState().landingGuess); leave(btn.dataset.mode); },
    skip: () => { markLanding(null); leave(null); },
  });
}

/** The brand's two roads, drawn large and faint behind the hero. */
function roadsBackdrop() {
  return `
    <svg viewBox="0 0 900 420" preserveAspectRatio="xMidYMax slice" focusable="false">
      <g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
        <path d="M-20 380 C 200 380 260 120 450 120 C 640 120 700 380 920 380"/>
        <path d="M-20 300 C 180 300 300 340 450 340 C 600 340 720 300 920 300" stroke-dasharray="2 14"/>
      </g>
      <circle cx="450" cy="120" r="7" fill="currentColor"/>
    </svg>`;
}

function fill(tpl, vars) {
  return String(tpl || '').replace(/\{(\w+)\}/g, (_, k) => (vars[k] == null ? '' : vars[k]));
}
