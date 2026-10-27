// Home. (v4 visual pass)
//
// First visit: the line is the question. A full bleed night band, one
// sentence, who is reading, and the school years drawn as a big transit
// line you tap to say where you are. No form, no wizard: tapping a station
// is the answer and takes you there.
//
// Every visit after: a bento of four tiles that each do one job. Your
// station (where you are, what is open, the best move as a ticket), the
// departures board (all eight, live), the game (a skyline, because Play is
// a story), and your plan (what you kept, ready for the next conversation).

import { getState, setYear, YEARS, markWelcome, isGuest, setRole } from '../state.js?v=4.0.0';
import { reach } from '../engine/reach.js?v=4.0.0';
import { evalPlan } from '../engine/years.js?v=4.0.0';
import { advise } from '../engine/advice.js?v=4.0.0';
import { openCount } from '../ui/map.js?v=4.0.0';
import { yearStrip, STRIP } from '../ui/yearstrip.js?v=4.0.0';
import { boardHtml } from '../ui/board.js?v=4.0.0';
import { ticketHtml } from '../ui/ticket.js?v=4.0.0';
import { skyline } from '../ui/scenes.js?v=4.0.0';
import { esc, onAction } from '../ui/dom.js?v=4.0.0';
import { icon } from '../ui/icons.js?v=4.0.0';

const ROLE = { student: 'Student', parent: 'Parent', teacher: 'Teacher' };
const CODE = Object.fromEntries(STRIP.map((y) => [y.id, y.code]));

export default {
  id: 'home',
  title: 'Home',
  era: 'school',
  render(root, api) {
    const st = getState();
    document.body.dataset.dock = 'off';
    if (!st.yearSet) return renderFirst(root, api);
    return renderHome(root, api);
  },
};

function renderFirst(root, api) {
  const st = getState();
  const q = st.role === 'student' ? 'Where are you on the line?' : st.role === 'parent' ? "Where is your child on the line?" : 'Where is the student on the line?';
  root.innerHTML = `
  <section class="welcome">
    <div class="wrap welcome-in">
      <h1 class="welcome-h arrive">${esc(q)}</h1>
      <p class="welcome-sub arrive d1">Tap a year. See what every subject level opens, and the exact move that opens more.</p>

      <div class="rolebar arrive d1" role="radiogroup" aria-label="Who is reading">
        ${Object.entries(ROLE).map(([id, l]) => `<button type="button" role="radio" class="rolebar-b press" data-action="hm-role" data-id="${id}" aria-checked="${st.role === id}">${icon(id)}<span>${esc(l)}</span></button>`).join('')}
      </div>

      <ol class="bigline arrive d2" aria-label="School years">
        ${YEARS.map((y, i) => `<li style="--i:${i}">
          <button type="button" class="bigstn press" data-action="hm-year" data-id="${y.id}">
            <span class="bigstn-dot" aria-hidden="true"></span>
            <span class="bigstn-code">${esc(CODE[y.id])}</span>
            <span class="bigstn-name">${esc(y.id === 'p6' ? 'Primary 6' : y.label)}</span>
          </button>
        </li>`).join('')}
        <li class="bigline-end" aria-hidden="true"><span class="bigstn-dot"></span><span class="bigstn-code">AS</span><span class="bigstn-name">After Sec</span></li>
      </ol>

      <ul class="promises arrive d3">
        <li>${icon('check')} No account, no sign in</li>
        <li>${icon('check')} Nothing leaves this device</li>
        <li>${icon('check')} It never says a road is closed</li>
      </ul>
    </div>
  </section>`;
  onAction(root, {
    'hm-role': (btn) => { setRole(btn.dataset.id); api.refresh(); },
    'hm-year': (btn) => { setYear(btn.dataset.id); markWelcome(null); api.nav('year', { y: btn.dataset.id }); },
  });
}

function renderHome(root, api) {
  const st = getState();
  const y = st.year;
  const yr = YEARS.find((x) => x.id === y);
  const meta = ((api.data.years || {}).years || {})[y] || {};
  const c = api.ctx();
  const yp = (st.plans && st.plans[y]) || {};
  const n = Object.keys(yp).length;
  let top = null;
  let rows = [];
  if (y !== 'p6') {
    const ep = evalPlan(y, yp, c.subjects);
    rows = c.destinations.map((d) => reach(ep, d, { ...c, plan: ep, yearId: y }));
    const a = n ? advise({ yearId: y, plan: yp, ctx: c, offer: st.offer }) : null;
    top = a && a.singles[0];
  }
  const effRows = c.destinations.map((d) => reach(c.plan, d, c));
  const cta = y === 'p6' ? 'Enter PSLE ALs' : (n ? (top ? 'All advice' : `Open ${yr.label}`) : `Set ${yr.label} levels`);

  root.innerHTML = `
  ${yearStrip(null, st)}
  <div class="wrap homewrap">
    <div class="bento">
      <section class="tile tile-station arrive" aria-labelledby="ts-h">
        <div class="ts-head">
          <span class="ts-code" aria-hidden="true">${esc(CODE[y])}</span>
          <div>
            <p class="ts-meta">${esc(meta.phase || '')} · ${st.role === 'student' ? 'You are in' : 'Now in'} ${esc(yr.label)}</p>
            <h1 id="ts-h">${esc(meta.headline || yr.label)}</h1>
          </div>
        </div>
        ${y !== 'p6' && n ? `<p class="ts-open"><b>${openCount(rows)}</b><span>of ${rows.length} destinations open from your ${esc(yr.label)} levels</span></p>` : `<p class="ts-lede">${esc(meta.lede || '')}</p>`}
        ${n ? `<div class="ts-combo" aria-label="Your ${esc(yr.label)} levels">${Object.entries(yp).map(([id, lv]) => {
          const sj = c.subjects.find((x) => x.id === id);
          return `<span class="pl-chip" data-level="${lv}">${esc(sj ? (sj.shortName || sj.name) : id)} <b>${lv}</b></span>`;
        }).join('')}</div>` : ''}
        ${top ? `<p class="ts-k">Your best move</p><div class="ts-ticket">${ticketHtml(top, { compact: true })}</div>` : ''}
        <p class="btnrow">
          <button type="button" class="btn big press" data-action="go" data-s="year" data-y="${esc(y)}" ${n && top ? 'data-tab="advice"' : ''}>${esc(cta)} ${icon('arrow')}</button>
          <button type="button" class="btn ghost on-night press" data-action="hm-change">Not ${esc(yr.label)}?</button>
        </p>
      </section>

      <section class="tile tile-board arrive d1">
        ${boardHtml(effRows, { key: 'home', compact: true, title: 'After Sec' })}
        <button type="button" class="tile-link press" data-action="go" data-s="after">What each place asks and costs ${icon('arrow')}</button>
      </section>

      <button type="button" class="tile tile-play press arrive d2" data-action="go" data-s="play">
        <span class="tp-art" aria-hidden="true">${skyline('school')}</span>
        <span class="tp-body">
          <span class="tile-h">Play a life forward</span>
          <span class="tile-p">${st.liveRun ? 'Your story is mid chapter. Pick it back up.' : (st.runs.length ? `${st.runs.length} lived on this device. Try another road.` : 'From your subjects to age 35. Ten minutes, no choice ends the story.')}</span>
          <span class="tile-go">${icon('play')} ${st.liveRun ? 'Continue' : 'Play'}</span>
        </span>
      </button>

      <button type="button" class="tile tile-plan press arrive d3" data-action="go" data-s="myplan">
        <span class="tile-h">${st.role === 'student' ? 'My plan' : 'The plan'}</span>
        <span class="tpl-n"><b>${st.actions.length}</b> ${st.actions.length === 1 ? 'ticket' : 'tickets'} kept</span>
        <span class="tile-p">Everything on one page for the next conversation. It prints.</span>
        <span class="tile-go">${icon('ticket')} Open</span>
      </button>
    </div>

    <nav class="morelinks" aria-label="Also here">
      <button type="button" class="ml press" data-action="go" data-s="work">${icon('d_portfolio')}<span>The work itself</span></button>
      <button type="button" class="ml press" data-action="go" data-s="money">${icon('target')}<span>Costs and help</span></button>
      <button type="button" class="ml press" data-action="go" data-s="schools">${icon('home')}<span>My kind of school</span></button>
      <button type="button" class="ml press" data-action="go" data-s="adults">${icon('d_people')}<span>For parents and teachers</span></button>
    </nav>
    ${isGuest() ? '' : '<p class="small homenote">Nothing you do here leaves this device. No account, no server, nothing collected.</p>'}
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
