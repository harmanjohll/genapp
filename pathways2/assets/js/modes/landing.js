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

import { esc, onAction } from '../components/dom.js?v=2.15.0';
import { icon } from '../components/icons.js?v=2.15.0';
import { cue } from '../sound.js?v=2.15.0';
import { getState, markLanding } from '../state.js?v=2.15.0';
import { reach } from '../engine/reach.js?v=2.15.0';

export function renderLanding(host, data, ctx, leave) {
  const L = data.copy.landing;
  const st = getState();
  const total = ctx.destinations.length;
  const guessed = st.landingGuess;
  const revealed = guessed != null;

  // A story mid flight turns the Play door into a Continue door. Same slot,
  // because both lead to the same place: the journey resumes a live run on
  // its own, and a door that says "live one life forward" while actually
  // dropping the student into chapter six of an old one is a lie with a nice
  // font. A student who came back two weeks later now sees, on the first
  // screen, that their life kept their place.
  const live = st.liveRun && !st.liveRun.done ? st.liveRun : null;
  const liveAge = live
    ? ((live.steps && live.steps.length ? live.steps[live.steps.length - 1].age : live.startAge) || live.startAge)
    : null;

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

  // The three doors read the device, honestly and shallowly: how many
  // subjects the plan holds, how many commitments sit on the list, and the
  // save-slot facts of a story mid flight. A door that knows what is behind
  // it is a save slot; a door that does not is a label. Nothing private is
  // shown: counts and the run's own public headline, never the writing.
  const nPlan = Object.keys(st.plan || {}).length;
  const nActs = (st.actions || []).length;
  const liveChips = live
    ? [live.pathLabel, live.want && live.want.label ? fill(L.contPlaying, { want: live.want.label }) : null]
      .filter(Boolean).map((t) => `<span class="gchip">${esc(t)}</span>`).join('')
    : '';

  host.innerHTML = `
    <div class="landing">
      <div class="landing-bg" aria-hidden="true">${networkBackdrop()}</div>
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
              <span class="ldoor-meta">${esc(nPlan ? fill(L.metaPlan, { n: nPlan }) : L.metaPlanNone)}</span>
            </button>
            <span class="ldoor-arrow" aria-hidden="true">→</span>
            <button class="ldoor primary${live ? ' resume' : ''}" type="button" data-action="go" data-mode="journey">
              <span class="ldoor-ic">${icon('q_how')}</span>
              <span class="ldoor-name">${esc(live ? L.continueName : L.enterPlay)}</span>
              <span class="ldoor-sub">${esc(live ? fill(L.continueSub, { age: liveAge }) : L.enterPlaySub)}</span>
              ${live && liveChips
    ? `<span class="ldoor-meta slotchips">${liveChips}</span>`
    : `<span class="ldoor-meta">${esc(L.metaPlay)}</span>`}
            </button>
            <span class="ldoor-arrow" aria-hidden="true">→</span>
            <button class="ldoor" type="button" data-action="go" data-mode="aim">
              <span class="ldoor-ic">${icon('q_where')}</span>
              <span class="ldoor-name">${esc(L.enterAct)}</span>
              <span class="ldoor-sub">${esc(L.enterActSub)}</span>
              <span class="ldoor-meta">${esc(nActs ? fill(L.metaAct, { n: nActs }) : L.metaActNone)}</span>
            </button>
          </div>
          ${/* The one promise a parent decides on, said where they decide.
                It lived in a footer this page hides. */ ''}
          <p class="trustrow">
            <span class="trustchip">${esc(L.trustA)}</span>
            <span class="trustchip">${esc(L.trustB)}</span>
            <span class="trustchip">${esc(L.trustC)}</span>
          </p>
          <div class="lgroup">
            <a class="ldoor wide" href="./?mode=table">
              <span class="ldoor-ic">${icon('q_who')}</span>
              <span class="ldoor-name">${esc(L.enterTable)}</span>
              <span class="ldoor-sub">${esc(L.enterTableSub)}</span>
            </a>
          </div>` : ''}
        <p class="micro faint landing-aud">
          <span class="mute">${esc(L.alsoHead)}:</span>
          <a class="audlink" href="./?mode=work">${esc(L.alsoWork)}</a>
          <a class="audlink" href="./?mode=money">${esc(L.alsoMoney)}</a>
          <a class="audlink" href="./?mode=schools">${esc(L.alsoSchools)}</a>
          <a class="audlink" href="./?mode=parent">${esc(L.alsoParent)}</a>
          <a class="audlink" href="./?mode=teacher">${esc(L.alsoTeacher)}</a>
          <a class="audlink" href="./?mode=evidence">${esc(L.alsoEvidence)}</a>
        </p>
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

/**
 * The network, drawn faint and large behind the hero, and drawing itself in.
 *
 * This is the app's one product shot. The most beautiful thing the tool makes
 * is the transit map of a played life, so the front door shows that identity
 * doing what it does: several roads, stations along them, one bright line, an
 * interchange that quietly pulses like a you-are-here. All decorative, all
 * behind the content, honest about being a motif rather than a claim. The
 * lines draw in once on arrival (pathLength normalises each curve so one rule
 * animates them all); reduced motion gets the finished drawing immediately.
 */
function networkBackdrop() {
  const st = (x, y, r = 5) => `<circle class="bg-st" cx="${x}" cy="${y}" r="${r}"/>`;
  return `
    <svg viewBox="0 0 900 420" preserveAspectRatio="xMidYMax slice" focusable="false">
      <g fill="none" stroke-linecap="round">
        <path class="ln faintln" pathLength="1" stroke-width="2.5" d="M-20 90 C 300 90 500 60 920 110"/>
        <path class="ln" pathLength="1" stroke-width="3" d="M-20 180 C 240 180 420 300 560 300 C 700 300 800 220 920 210"/>
        <path class="ln dashln" stroke-width="3" stroke-dasharray="2 14" d="M-20 300 C 180 300 300 340 450 340 C 600 340 720 300 920 300"/>
        <path class="ln accln" pathLength="1" stroke-width="3.5" d="M-20 380 C 200 380 260 120 450 120 C 640 120 700 380 920 380"/>
      </g>
      <g class="bg-sts" fill="currentColor" stroke="none">
        ${st(226, 250)}${st(674, 250)}${st(450, 340)}${st(560, 300)}${st(747, 259)}${st(412, 81, 4)}
      </g>
      <circle class="bg-now-ring" cx="450" cy="120" r="14" fill="none"/>
      <circle class="bg-now" cx="450" cy="120" r="7"/>
    </svg>`;
}

function fill(tpl, vars) {
  return String(tpl || '').replace(/\{(\w+)\}/g, (_, k) => (vars[k] == null ? '' : vars[k]));
}
