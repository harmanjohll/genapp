// Counsellor session: fifteen minutes, one student, five steps.
//
// Built for a desk or a projector: large type, one idea per screen, and a
// prompt for the adult on each step with a time guide. It reads the
// student's own plan, or a plan shared by link (?d=), which it never saves.
// The last step agrees one move and a date; on the student's own device
// that move is saved to their list.

import { getState, toggleAction, YEARS } from '../state.js?v=6.0.0';
import { effective, PLAN_YEARS } from '../engine/years.js?v=6.0.0';
import { advise } from '../engine/advice.js?v=6.0.0';
import { goalMoves } from '../engine/goal.js?v=6.0.0';
import { sayMove } from '../ui/talk.js?v=6.0.0';
import { esc, onAction } from '../ui/dom.js?v=6.0.0';
import { icon } from '../ui/icons.js?v=6.0.0';
import { stateWord } from '../ui/labels.js?v=6.0.0';
import { goalLine } from './path.js?v=6.0.0';
import { readPlan } from './share.js?v=6.0.0';
import { decodePacket } from '../engine/packet.js?v=6.0.0';

const LABEL = Object.fromEntries(YEARS.map((y) => [y.id, y.label]));

const STEPS = [
  { t: 'Where you are', min: 2, ask: 'Ask: which of these levels feels right, and which feels wrong?' },
  { t: 'Where you stand', min: 3, ask: 'Ask: which place here surprises you?' },
  { t: 'What you want', min: 3, ask: 'Ask: what work do you picture yourself doing? What draws you to it?' },
  { t: 'One move', min: 4, ask: 'Ask: what would make this move realistic this term?' },
  { t: 'Agree a next step', min: 3, ask: 'Agree one step and a date. Write it down together.' },
];

export default {
  id: 'session',
  title: 'Counsellor session',
  era: 'school',

  render(root, api) {
    const st = getState();
    const q = api.route().q;
    const pk = q.d ? decodePacket(q.d) : null;
    const own = !pk;
    const e = effective(st.plans, api.ctx().subjects);
    const y = pk ? pk.y : (q.y && PLAN_YEARS.includes(q.y) ? q.y : e.yearId);
    const plan = pk ? pk.plan : ((y && st.plans[y]) || {});
    const goal = pk ? pk.goal : st.goal;
    const n = Math.min(5, Math.max(1, Number(q.step) || 1));
    if (!y || !Object.keys(plan).length) {
      root.innerHTML = `<div class="wrap-narrow session"><h1>Set the levels first</h1><p class="lede">A session reads one year's levels.</p><p><button type="button" class="btn big press" data-action="go" data-s="path">Open the path</button></p></div>`;
      return;
    }
    const pl = readPlan(api, y, plan, goal);
    const c = api.ctx();
    const moves = [...(goal ? goalMoves(goal, y, plan, c) : []), ...advise({ yearId: y, plan, ctx: c }).singles].filter((m, i, all) => all.findIndex((x) => x.line === m.line) === i).slice(0, 3);
    const S = STEPS[n - 1];
    let body = '';
    if (n === 1) body = `<p class="ss-big">${esc(LABEL[y])}</p><p class="pc-levels big">${pl.levels.map((l) => `<span class="pl-chip" data-level="${l.lv}">${esc(l.name)} <b>${l.lv}</b></span>`).join('')}</p>`;
    if (n === 2) body = `<p class="ss-big">${pl.open} of 8 ${esc(pl.word)}</p><ul class="pafter big">${pl.rows.map((r) => `<li><div class="pa-row" data-goal="${!!(goal && r.id === goal.dest)}"><span class="pa-name">${esc(r.railName)}</span><span class="pill" data-tone="${esc(r.state)}">${esc(stateWord(r.state, r.lens))}</span></div></li>`).join('')}</ul>`;
    if (n === 3) body = goal ? `<p class="ss-big">${icon('target')} ${esc(goalLine(api, goal))}</p>` : `<p class="ss-big">No goal yet</p><p class="lede">That is fine at this stage. Start from what the student enjoys.</p>${own ? `<p><button type="button" class="btn big press" data-action="go" data-s="goal">Find a goal together</button></p>` : ''}`;
    if (n === 4) body = pl.top ? `<p class="ss-big">${esc(pl.top.result)}</p><p class="lede">${esc(pl.top.cond.charAt(0).toUpperCase() + pl.top.cond.slice(1))}.</p><p class="bubble">${esc(sayMove(pl.top, 'student'))}</p>` : '<p class="ss-big">No move needed</p>';
    if (n === 5) {
      body = `<p class="lede">Pick the one step to try first. Do it before the school's next review.</p>
        <div class="glist">${moves.map((m, i) => `<button type="button" class="gcard press" data-action="ss-agree" data-i="${i}"><span class="gcard-t">${esc(m.result)}</span><span class="gcard-p">${esc(m.cond.charAt(0).toUpperCase() + m.cond.slice(1))}.</span></button>`).join('')}</div>
        <p class="small" id="ss-note" role="status">${own ? 'The agreed step is saved to the student\'s moves.' : 'This plan came by link, so nothing is saved here. Write the step down together.'}</p>`;
    }
    root.innerHTML = `
    <div class="session">
      <div class="ss-top">
        <ol class="gsteps">${STEPS.map((x, i) => `<li data-on="${i < n}"></li>`).join('')}</ol>
        <span class="ss-min">${icon('calendar')} About ${S.min} min</span>
        <button type="button" class="linkbtn" data-action="ss-exit">End session</button>
      </div>
      <p class="ph-k">Step ${n} of 5</p>
      <h1>${esc(S.t)}</h1>
      <div class="ss-body arrive">${body}</div>
      <p class="ss-ask">${icon('talk')} ${esc(S.ask)}</p>
      <div class="ss-nav">
        <button type="button" class="btn ghost big press" data-action="ss-go" data-n="${n - 1}" ${n === 1 ? 'disabled' : ''}>${icon('back')} Back</button>
        ${n < 5 ? `<button type="button" class="btn big press" data-action="ss-go" data-n="${n + 1}">Next ${icon('arrow')}</button>` : `<button type="button" class="btn big press" data-action="ss-exit">Finish</button>`}
      </div>
    </div>`;

    const go = (k) => { if (k >= 1 && k <= 5) { api.setQuery({ step: String(k) }); api.refresh(); window.scrollTo({ top: 0 }); } };
    const onKey = (ev) => { if (ev.key === 'ArrowRight') go(n + 1); if (ev.key === 'ArrowLeft') go(n - 1); };
    document.addEventListener('keydown', onKey, { once: true });
    onAction(root, {
      'ss-go': (btn) => go(Number(btn.dataset.n)),
      'ss-exit': () => { api.nav(own ? 'path' : 'shared', own ? {} : { d: q.d, for: 'counsellor' }); },
      'ss-agree': (btn) => {
        const m = moves[Number(btn.dataset.i)];
        const note = root.querySelector('#ss-note');
        if (own) {
          const say = sayMove(m, getState().role);
          if (!getState().actions.includes(say)) toggleAction(say);
          note.textContent = 'Saved to the student\'s moves.';
        } else {
          note.textContent = `Agreed: ${m.result}, ${m.cond}.`;
        }
      },
    });
  },
};
