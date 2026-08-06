// The landing: one question before anything else.
//
// The predict then reveal beat is the cheapest anti determinism device this
// app has. The thesis lands harder as a surprise the student produced than as
// a sentence they skim, so the first screen asks for a guess, answers it, and
// only then offers the three doors. Asked once; a device that has answered,
// or arrives by deep link, never sees it again.

import { esc, onAction } from '../components/dom.js';
import { icon } from '../components/icons.js';
import { getState, markLanding } from '../state.js';
import { reach } from '../engine/reach.js';

export function renderLanding(host, data, ctx, leave) {
  const L = data.copy.landing;
  const st = getState();
  const total = ctx.destinations.length;
  const guessed = st.landingGuess;

  // The claim is checked live, not asserted: reach() over an empty plan, the
  // hardest case, counting destinations with any road at all. It is always
  // total, and computing it here means the landing cannot outrun the engine.
  const reachable = ctx.destinations
    .filter((d) => {
      const r = reach({}, d, { ...ctx, plan: {} });
      return r.state === 'open' || r.routes.length > 0;
    }).length;

  const numbers = Array.from({ length: total + 1 }, (_, n) => `
    <button class="guess-n${guessed === n ? ' on' : ''}" type="button" data-action="guess" data-n="${n}"
            aria-pressed="${guessed === n}">${n}</button>`).join('');

  const revealed = guessed != null;

  host.innerHTML = `
    <div class="landing">
      <div class="wrap narrow">
        <p class="caps landing-kicker">${icon('brand')}${esc(L.kicker)}</p>
        <h1 class="serif landing-q">${esc(L.q)}</h1>
        ${revealed ? '' : `<p class="small mute">${esc(L.guessHint)}</p>`}
        <div class="guess-row" role="group" aria-label="Your guess">${numbers}</div>
        ${revealed ? `
          <div class="reveal fade-up">
            <p class="reveal-big serif">${esc(L.revealAll)}</p>
            <p class="small mute">${esc(fill(L.revealYou, { n: guessed }))} ${esc(L.revealNote)}</p>
            <div class="landing-doors">
              <button class="ldoor" type="button" data-action="go" data-mode="now">
                <span class="ldoor-name">${esc(L.enterPlan)}</span>
                <span class="ldoor-sub">${esc(L.enterPlanSub)}</span>
              </button>
              <button class="ldoor" type="button" data-action="go" data-mode="journey">
                <span class="ldoor-name">${esc(L.enterPlay)}</span>
                <span class="ldoor-sub">${esc(L.enterPlaySub)}</span>
              </button>
              <button class="ldoor" type="button" data-action="go" data-mode="aim">
                <span class="ldoor-name">${esc(L.enterAct)}</span>
                <span class="ldoor-sub">${esc(L.enterActSub)}</span>
              </button>
            </div>
          </div>` : `
          <p class="micro mute" style="margin-top:var(--s-6)">
            <button class="gloss" type="button" data-action="skip">${esc(L.skip)}</button>
          </p>`}
        <p class="micro faint" style="margin-top:var(--s-7)">${esc(L.audience)}</p>
      </div>
    </div>`;

  if (reachable !== total) {
    // The engine and the landing disagree: say nothing false, loudly.
    console.error(`landing claim check: ${reachable} of ${total} reachable`);
  }

  onAction(host, {
    guess: (btn) => {
      markLanding(Number(btn.dataset.n));
      renderLanding(host, data, ctx, leave);
      const big = host.querySelector('.reveal-big');
      if (big) { big.setAttribute('tabindex', '-1'); big.focus({ preventScroll: true }); }
    },
    go: (btn) => { markLanding(getState().landingGuess); leave(btn.dataset.mode); },
    skip: () => { markLanding(null); leave(null); },
  });
}

function fill(tpl, vars) {
  return String(tpl || '').replace(/\{(\w+)\}/g, (_, k) => (vars[k] == null ? '' : vars[k]));
}
