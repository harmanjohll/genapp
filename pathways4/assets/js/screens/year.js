// A year page: P6, Sec 1, Sec 2, Sec 3, Sec 4 or Sec 5.
//
// THE PROBLEM THIS SCREEN SOLVES. v3's Plan was 3.8 phone screens of one
// list: subjects, then the lever, then the map, then the next step. A tap
// and its answer were never on screen together. v4 splits the page into
// tabs that each fit a screen (Levels, Advice, Targets, This year) and
// keeps the answer in view while the student taps: a dock on phones, a
// side panel on wide screens. Long subject lists (Sec 3 onwards) are cut
// into group chips, so one group is on the glass at a time.
//
// THE HOT PATH. A level tap patches the row, the dock, the aside and the
// advice badge in place. It never repaints the list under the finger.

import {
  getState, setYearLevel, replaceYearPlan, setYear, YEARS, toggleAction,
} from '../state.js?v=4.0.0';
import { reach } from '../engine/reach.js?v=4.0.0';
import { pulse } from '../engine/pulse.js?v=4.0.0';
import { evalPlan, subjectsForYear, carryForward, isLower, prevYear } from '../engine/years.js?v=4.0.0';
import { advise } from '../engine/advice.js?v=4.0.0';
import { railMap, mapPips, openCount } from '../ui/map.js?v=4.0.0';
import { destSheetHtml } from '../ui/destsheet.js?v=4.0.0';
import { yearStrip } from '../ui/yearstrip.js?v=4.0.0';
import { sayMove, roleWords } from '../ui/talk.js?v=4.0.0';
import { psleHtml, bindPsle } from '../ui/pslepanel.js?v=4.0.0';
import { targetsHtml, bindTargets } from '../ui/targets.js?v=4.0.0';
import { psleSec1Plan } from '../engine/psle.js?v=4.0.0';
import { esc, onAction } from '../ui/dom.js?v=4.0.0';
import { icon } from '../ui/icons.js?v=4.0.0';

const LABEL = Object.fromEntries(YEARS.map((y) => [y.id, y.label]));
const LINE = { 'open': 'var(--line-open)', 'within-reach': 'var(--line-within)', 'longer-route': 'var(--line-longer)', 'other-route': 'var(--line-other)' };
let lastLine = '';
let lastYear = null;

function yearId(api) {
  const q = api.route().q;
  const st = getState();
  const y = q.y || (st.yearSet ? st.year : 'sec1');
  return LABEL[y] ? y : 'sec1';
}

function tabsFor(y) {
  if (y === 'p6') return [['psle', 'PSLE'], ['year', 'This year']];
  const t = [['levels', 'Levels'], ['advice', 'Advice']];
  if (!isLower(y)) t.push(['targets', 'Targets']);
  t.push(['year', 'This year']);
  return t;
}

function meta(api, y) {
  const years = (api.data.years && api.data.years.years) || {};
  return years[y] || {};
}

function reachFor(api, y, plan) {
  const c = api.ctx();
  const ep = evalPlan(y, plan, c.subjects);
  return c.destinations.map((d) => reach(ep, d, { ...c, plan: ep, yearId: y }));
}

export default {
  id: 'year',
  title: (q) => (q && q.y && LABEL[q.y]) || 'My year',
  era: 'school',

  render(root, api) {
    const st = getState();
    const y = yearId(api);
    if (lastYear !== y) { lastLine = ''; lastYear = y; }
    const tabs = tabsFor(y);
    const q = api.route().q;
    const tab = tabs.some(([id]) => id === q.tab) ? q.tab : tabs[0][0];
    const m = meta(api, y);
    const yr = YEARS.find((x) => x.id === y);
    const age = yr.realAge || yr.age;
    const here = st.yearSet && st.year === y;
    const idx = YEARS.findIndex((x) => x.id === y);
    const nowIdx = YEARS.findIndex((x) => x.id === st.year);
    const stance = !st.yearSet ? '' : (here ? 'The year you are in' : (idx > nowIdx ? 'Looking ahead' : 'Looking back'));

    const plan = (st.plans && st.plans[y]) || {};
    const showResult = y !== 'p6';
    const rows = showResult ? reachFor(api, y, plan) : [];
    const adv = showResult ? advise({ yearId: y, plan, ctx: api.ctx(), offer: st.offer }) : null;
    const advCount = adv ? adv.singles.length + adv.pairs.length : 0;

    root.innerHTML = `
    ${yearStrip(y, st)}
    <div class="wrap yearwrap">
      <header class="yhead">
        <p class="kicker">${esc(m.phase || '')}${m.phase ? ' · ' : ''}Age ${age}${stance ? ` · <span class="stance" data-here="${here}">${esc(stance)}</span>` : ''}</p>
        <h1>${esc(LABEL[y])}: ${esc(m.headline || '')}</h1>
        ${m.lede ? `<p class="lede">${esc(m.lede)}</p>` : ''}
        ${!st.yearSet ? `<p class="small"><button type="button" class="linkbtn" data-action="yr-mine">This is my year</button></p>` : ''}
      </header>

      <div class="segtabs" role="tablist" aria-label="${esc(LABEL[y])}">
        ${tabs.map(([id, label]) => `
          <button type="button" role="tab" class="segtab press" id="tab-${id}" data-action="yr-tab" data-tab="${id}"
            aria-selected="${tab === id}" aria-controls="panel">${esc(label)}${id === 'advice' && advCount ? `<i class="segbadge" id="advbadge">${advCount}</i>` : ''}</button>`).join('')}
      </div>

      <div class="ylayout${showResult ? ' has-aside' : ''}">
        <section class="ymain" id="panel" role="tabpanel" aria-labelledby="tab-${tab}">
          ${panel(tab, api, y, plan, rows, adv)}
        </section>
        ${showResult ? `<aside class="yaside" aria-label="What this opens" id="yaside">${asideHtml(api, y, rows, adv)}</aside>` : ''}
      </div>
    </div>
    ${showResult && tab === 'levels' ? `<div class="dock" id="dock" role="status">${dockHtml(rows, adv)}</div>` : ''}`;

    document.body.dataset.dock = showResult && tab === 'levels' ? 'on' : 'off';
    bind(root, api, y);
    if (tab === 'psle') bindPsle(root, api);
    if (tab === 'targets') bindTargets(root, api, y);
  },
};

/* ---- panels --------------------------------------------------------------- */

function panel(tab, api, y, plan, rows, adv) {
  if (tab === 'psle') return psleHtml(api);
  if (tab === 'levels') return levelsHtml(api, y, plan);
  if (tab === 'advice') return adviceHtml(api, y, rows, adv);
  if (tab === 'targets') return targetsHtml(api, y);
  return yearHtml(api, y);
}

function groupsFor(api, y) {
  const st = getState();
  const subjects = subjectsForYear(y, api.ctx().subjects, st.offer);
  const groups = (api.data.subjects.groups || []).map((g) => ({
    ...g,
    rows: subjects.filter((s) => s.group === g.id && (s.levels || []).length),
    flat: subjects.filter((s) => s.group === g.id && !(s.levels || []).length),
  })).filter((g) => g.rows.length || g.flat.length);
  return { subjects, groups };
}

function levelsHtml(api, y, plan) {
  const st = getState();
  const { subjects, groups } = groupsFor(api, y);
  const leveled = subjects.filter((s) => (s.levels || []).length);
  const chunked = leveled.length > 10;
  const q = api.route().q;
  const active = chunked ? (groups.find((g) => g.id === q.g && g.rows.length) || groups.find((g) => g.rows.length)) : null;
  const carry = Object.keys(plan).length ? null : carryForward(y, st.plans, api.ctx().subjects);
  const fromPsle = y === 'sec1' && !Object.keys(plan).length && psleSec1Plan(st.psle, api.data.psle);
  const j = ((api.data.subjects.junctures || {}).years || {})[y] || {};
  const li = api.data.subjects.levelInfo || {};
  const count = Object.keys(plan).length;
  const g3 = Object.values(plan).filter((l) => l === 'G3').length;

  return `
    ${carry ? `
      <div class="callout arrive">
        <p><strong>Start from your ${esc(LABEL[carry.from])} levels?</strong> ${esc(isLower(carry.from) && !isLower(y)
          ? 'Your Science becomes one science option and your strongest Humanities becomes the Humanities pair. Change anything after.'
          : 'Everything carries across as it was. Change anything after.')}</p>
        <button type="button" class="btn press" data-action="yr-carry">Carry ${esc(LABEL[carry.from])} forward</button>
      </div>` : ''}
    ${fromPsle ? `
      <div class="callout arrive">
        <p><strong>Use your PSLE starting levels?</strong> The P6 page worked them out from your PSLE results.</p>
        <button type="button" class="btn press" data-action="yr-psle">Use them</button>
      </div>` : ''}

    <p class="legend small">
      ${['G1', 'G2', 'G3'].map((l) => `<span class="legend-i"><b class="lvdot" data-level="${l}"></b>${l} ${esc((li[l] && li[l].plain) || '')}</span>`).join('')}
    </p>

    ${!isLower(y) ? `<p class="loadline-v4"><strong>${count} subject${count === 1 ? '' : 's'}</strong>${count ? `, ${g3} at G3` : ''}. <span class="small">${esc(loadNote(api, count, g3))}</span></p>` : ''}

    ${chunked ? `
      <div class="groupchips" role="tablist" aria-label="Subject groups">
        ${groups.filter((g) => g.rows.length).map((g) => {
          const n = g.rows.filter((s) => plan[s.id]).length;
          return `<button type="button" role="tab" class="gchip press" data-action="yr-group" data-g="${esc(g.id)}" aria-selected="${active && active.id === g.id}">
            ${esc(shortGroup(g))}${n ? `<i>${n}</i>` : ''}</button>`;
        }).join('')}
      </div>` : ''}

    <div class="subjlist">
      ${(chunked ? [active] : groups).filter(Boolean).map((g) => `
        <div class="subjgroup">
          ${chunked ? '' : `<h2 class="caps">${esc(g.label)}</h2>`}
          ${g.note ? `<p class="small groupnote">${esc(g.note)}</p>` : ''}
          <div class="subjrows">${g.rows.map((s) => subjRow(s, plan)).join('')}</div>
          ${g.flat.length ? `<p class="small" style="margin-top:8px">${esc(api.copy('chrome.alsoTimetable', 'Also on the timetable, no level to pick:'))} ${g.flat.map((s) => esc(s.name)).join(' · ')}.</p>` : ''}
        </div>`).join('')}
    </div>

    ${chunked ? nextGroupBtn(groups, active) : ''}

    <div class="notes">
      ${j.up ? `<p class="small">${icon('calendar')} ${esc(j.up)}</p>` : ''}
      ${j.note ? `<p class="small">${esc(j.note)}</p>` : ''}
      <p class="small">${esc(api.copy('chrome.availability', 'Schools offer different subsets of this list. Your school decides what runs; this decides nothing.'))}</p>
    </div>`;
}

function shortGroup(g) {
  return { core: 'Core', maths_extra: 'More Maths', science: 'Science', humanities: 'Humanities', elective: 'Electives', common: 'Common' }[g.id] || g.label;
}

function nextGroupBtn(groups, active) {
  const list = groups.filter((g) => g.rows.length);
  const i = list.findIndex((g) => g.id === active.id);
  const next = list[i + 1];
  return next
    ? `<p class="nextgroup"><button type="button" class="btn ghost press" data-action="yr-group" data-g="${esc(next.id)}">Next: ${esc(shortGroup(next))} ${icon('arrow')}</button></p>`
    : `<p class="nextgroup"><button type="button" class="btn press" data-action="yr-tab" data-tab="advice">See the advice ${icon('arrow')}</button></p>`;
}

function loadNote(api, n, g3) {
  const l = (api.data.copy && api.data.copy.load) || {};
  if (n === 0) return 'Pick the subjects you take, or plan to.';
  if (n < 5) return l.early || '';
  if (n >= 9) return l.heavy || '';
  if (g3 >= 5) return l.solid || '';
  return l.spread || '';
}

function subjRow(s, plan) {
  const held = plan[s.id] || null;
  return `
  <div class="subjrow" data-sid="${esc(s.id)}" data-held="${held || ''}">
    <span class="subjname">${esc(s.name)}
      ${s.compulsory ? '<span class="subjnote">everyone takes this</span>' : ''}
      ${s.status === 'provisional' && !s.compulsory ? '<span class="subjnote">selected schools</span>' : ''}
    </span>
    <span class="lvlrow" role="group" aria-label="${esc(s.name)} level">
      ${['G1', 'G2', 'G3'].map((l) => (s.levels || []).includes(l)
        ? `<button type="button" class="lvl press settle" data-action="yr-lvl" data-sid="${esc(s.id)}" data-level="${l}"
            aria-pressed="${held === l}" aria-label="${esc(s.name)} at ${l}${held === l ? ', picked. Tap to clear.' : ''}">${l}</button>`
        : '<span class="lvl-none" aria-hidden="true"></span>').join('')}
    </span>
  </div>`;
}

/* ---- advice ----------------------------------------------------------------- */

function adviceHtml(api, y, rows, adv) {
  const st = getState();
  const rw = roleWords(st.role);
  const open = openCount(rows);
  const top = adv.singles[0];
  const rest = adv.singles.slice(1);
  const lowerNote = isLower(y)
    ? `<p class="small">Read through the Sec 3 combination these levels usually lead to. That is an inference, not a promise: your school sets the real one.</p>`
    : '';

  if (adv.start && !Object.keys((st.plans || {})[y] || {}).length) {
    return `
      <div class="empty">
        <p class="lede">${esc(adv.start.line)}</p>
        <button type="button" class="btn press" data-action="yr-tab" data-tab="levels">Set levels</button>
      </div>`;
  }

  return `
    <div class="advsum">
      <span class="bignum">${open}</span>
      <span><strong>of ${rows.length} open from these ${esc(LABEL[y])} levels.</strong> <span class="small">Every one of the eight keeps a road in, whatever happens.</span></span>
    </div>
    ${lowerNote}
    ${adv.start && adv.start.missing ? `<p class="callout small">${esc(adv.start.line)} <button type="button" class="linkbtn" data-action="yr-tab" data-tab="levels">Add them</button></p>` : ''}

    ${top ? `
      <h2 class="advh">${icon('spark')} The move that opens most</h2>
      ${moveCard(top, st.role, rw, true)}` : (open === rows.length ? `
      <div class="callout good"><p><strong>All eight are open from here.</strong> The question now is not which door, but which two years you actually want. Play a life forward to test one.</p>
      <button type="button" class="btn press" data-action="go" data-s="play">Play it forward</button></div>` : '')}

    ${rest.length ? `
      <h2 class="advh">Other single moves</h2>
      <div class="advlist">${rest.map((m) => moveCard(m, st.role, rw, false)).join('')}</div>` : ''}

    ${adv.pairs.length ? `
      <h2 class="advh">Two moves together</h2>
      <p class="small">Some doors need two things at once. These open something no single move does.</p>
      <div class="advlist">${adv.pairs.map((m) => moveCard(m, st.role, rw, false)).join('')}</div>` : ''}

    ${adv.holds.length ? `
      <h2 class="advh">${icon('hold')} What is holding your doors open</h2>
      <p class="small">Worth knowing before anyone suggests easing a subject down. Easing down is sometimes right; it should be a decision, not a surprise.</p>
      <div class="advlist">${adv.holds.map((m) => holdCard(m, st.role)).join('')}</div>` : ''}

    <h2 class="advh">Where these levels reach</h2>
    <p class="small">Tap a station for what it asks, what it costs, and the other roads in.</p>
    <div id="yr-rail">${railMap(rows, { tappable: true })}</div>`;
}

function moveCard(m, role, rw, hero) {
  const say = sayMove(m, role);
  const listed = getState().actions.includes(say);
  const chips = m.kind === 'pair' ? m.moves.map((x) => `${x.name} → ${x.to}`) : (m.any ? m.names.map((n) => `${n} → ${m.to}`) : []);
  return `
  <article class="advcard${hero ? ' hero' : ''}">
    <p class="advline">${esc(m.line)}</p>
    ${chips.length ? `<p class="advchips">${chips.map((c) => `<span class="pill" data-tone="quiet">${esc(c)}</span>`).join('')}</p>` : ''}
    ${m.because && m.because.length ? `<p class="small advwhy">Because ${m.because.map((b) => esc(b)).join('; ')}.</p>` : ''}
    ${m.still && m.still.length ? `<p class="small advwhy">After that: ${m.still.slice(0, 3).map((s) => `${esc(s.dest)} next asks ${esc(s.next.toLowerCase())}`).join('; ')}.</p>` : ''}
    ${m.when ? `<p class="small advwhen">${icon('calendar')} When: ${esc(m.when)}. With: ${esc(m.who)}.</p>` : ''}
    <div class="saybox">
      <p class="caps">${icon('talk')} ${esc(rw.say)}</p>
      <p class="sayline">${esc(say)}</p>
      <p class="btnrow">
        <button type="button" class="btn ghost small press" data-action="yr-copy" data-text="${esc(say)}">${icon('copy')} Copy</button>
        <button type="button" class="btn ghost small press" data-action="yr-list" data-text="${esc(say)}" aria-pressed="${listed}">${listed ? `${icon('check')} On my list` : `${icon('plus')} Add to my list`}</button>
      </p>
    </div>
  </article>`;
}

function holdCard(h, role) {
  return `
  <article class="advcard hold">
    <p class="advline">${esc(h.line)}</p>
    <p class="sayline small">${esc(sayMove(h, role))}</p>
  </article>`;
}

/* ---- this year ------------------------------------------------------------- */

function yearHtml(api, y) {
  const st = getState();
  const m = meta(api, y);
  const talk = (m.talk && m.talk[st.role]) || [];
  return `
    ${(m.happens || []).length ? `
      <h2 class="advh">${icon('calendar')} What happens this year</h2>
      <ol class="timeline">
        ${m.happens.map((h) => `<li><span class="tl-when">${esc(h.when || '')}</span><span class="tl-what">${esc(h.what)}${h.status === 'provisional' ? ' <span class="src-chip provisional">varies by school</span>' : ''}</span></li>`).join('')}
      </ol>` : ''}
    ${(m.decisions || []).length ? `
      <h2 class="advh">Decisions in ${esc(LABEL[y])}</h2>
      <ul class="declist">${m.decisions.map((d) => `<li>${esc(d.text || d)}</li>`).join('')}</ul>` : ''}
    ${talk.length ? `
      <h2 class="advh">${icon('talk')} ${st.role === 'parent' ? 'Questions to ask at home' : st.role === 'teacher' ? 'Questions for the conversation' : 'Questions worth asking'}</h2>
      <ul class="talklist">${talk.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
      <p class="small">Showing the ${esc(st.role)} version. <button type="button" class="linkbtn" data-action="role">Change who is reading</button></p>` : ''}
    ${m.source ? `<p class="small srcline">${esc(m.source)}</p>` : ''}`;
}

/* ---- the answer, kept in view ----------------------------------------------- */

function dockHtml(rows, adv) {
  const open = openCount(rows);
  const top = adv && adv.singles[0];
  const k = lastLine || 'open now';
  const line = top ? `Next: ${top.short}` : (open === rows.length ? 'All eight are open from here.' : 'Set a level and this answers.');
  return `
    <button type="button" class="dock-in press" data-action="yr-tab" data-tab="advice" aria-label="${open} of ${rows.length} open. ${esc(lastLine)} ${esc(line)} Open the advice.">
      <span class="dock-num">${open}<small>/${rows.length}</small></span>
      <span class="dock-words"><span class="dock-k">${esc(k)}</span><span class="dock-line">${esc(line)}</span></span>
      ${mapPips(rows)}
    </button>`;
}

function asideHtml(api, y, rows, adv) {
  const open = openCount(rows);
  const top = adv.singles.slice(0, 2);
  return `
    <div class="asidecard">
      <p class="caps">From these ${esc(LABEL[y])} levels</p>
      <p class="aside-num"><span class="bignum">${open}</span> of ${rows.length} open ${mapPips(rows)}</p>
      ${lastLine ? `<p class="small aside-last">${esc(lastLine)}</p>` : ''}
      <ul class="minilist">${rows.map((r) => `<li><button type="button" class="press" data-action="dest" data-id="${esc(r.id)}">
        <svg class="stn" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="6" fill="var(--surface)" stroke="${LINE[r.state]}" stroke-width="3"/></svg>
        <span class="ml-name">${esc(r.railName)}</span><span class="ml-status" data-tone="${esc(r.status.tone)}">${esc(r.status.text)}</span></button></li>`).join('')}</ul>
      ${top.length ? `
        <p class="caps" style="margin-top:16px">Best next moves</p>
        ${top.map((m) => `<p class="aside-move">${esc(m.line)}</p>`).join('')}
        <button type="button" class="btn ghost small press" data-action="yr-tab" data-tab="advice">All advice</button>` : ''}
    </div>`;
}

/* ---- bindings ----------------------------------------------------------------- */

function bind(root, api, y) {
  onAction(root, {
    'yr-tab': (btn) => { api.setQuery({ tab: btn.dataset.tab }); api.refresh(); window.scrollTo(0, 0); },
    'yr-group': (btn) => {
      api.setQuery({ g: btn.dataset.g });
      api.refresh();
      const list = root.querySelector('.groupchips');
      if (list) list.scrollIntoView({ block: 'nearest' });
    },
    'yr-mine': () => { setYear(y); api.refresh(); },
    'yr-carry': () => {
      const c = carryForward(y, getState().plans, api.ctx().subjects);
      if (c) { replaceYearPlan(y, c.plan); api.announce(`${LABEL[c.from]} levels carried into ${LABEL[y]}.`); api.refresh(); }
    },
    'yr-psle': () => {
      const p = psleSec1Plan(getState().psle, api.data.psle);
      if (p) { replaceYearPlan('sec1', p); api.announce('PSLE starting levels set for Sec 1.'); api.refresh(); }
    },

    'yr-lvl': (btn) => {
      const sid = btn.dataset.sid;
      const level = btn.dataset.level;
      const plan = getState().plans[y];
      const prevRows = reachFor(api, y, plan);
      const wasHeld = plan[sid] === level;
      const subj = api.ctx().subjects.find((s) => s.id === sid);
      setYearLevel(y, sid, wasHeld ? null : level, subj && subj.name);

      const row = root.querySelector(`.subjrow[data-sid="${CSS.escape(sid)}"]`);
      if (row) {
        row.dataset.held = wasHeld ? '' : level;
        row.querySelectorAll('.lvl').forEach((b) => {
          const on = !wasHeld && b.dataset.level === level;
          b.setAttribute('aria-pressed', String(on));
          b.setAttribute('aria-label', `${subj.name} at ${b.dataset.level}${on ? ', picked. Tap to clear.' : ''}`);
        });
      }

      const now = getState().plans[y];
      const nextRows = reachFor(api, y, now);
      const p = pulse(prevRows, nextRows, {
        action: wasHeld ? 'clear' : 'set',
        subjectName: subj ? (subj.shortName || subj.name) : sid,
        level,
      }, api.data.copy);
      lastLine = p.line || '';
      const adv = advise({ yearId: y, plan: now, ctx: api.ctx(), offer: getState().offer });
      const dock = root.querySelector('#dock');
      if (dock) dock.innerHTML = dockHtml(nextRows, adv);
      const aside = root.querySelector('#yaside');
      if (aside) aside.innerHTML = asideHtml(api, y, nextRows, adv);
      const n = adv.singles.length + adv.pairs.length;
      const tab = root.querySelector('#tab-advice');
      if (tab) {
        let badge = tab.querySelector('.segbadge');
        if (n && !badge) { badge = document.createElement('i'); badge.className = 'segbadge'; tab.appendChild(badge); }
        if (badge) { if (n) badge.textContent = String(n); else badge.remove(); }
      }
      const load = root.querySelector('.loadline-v4');
      if (load) {
        const cnt = Object.keys(now).length;
        const g3 = Object.values(now).filter((l) => l === 'G3').length;
        load.innerHTML = `<strong>${cnt} subject${cnt === 1 ? '' : 's'}</strong>${cnt ? `, ${g3} at G3` : ''}. <span class="small">${esc(loadNote(api, cnt, g3))}</span>`;
      }
      root.querySelectorAll('.gchip').forEach((g) => {
        const grp = (api.data.subjects.groups || []).find((x) => x.id === g.dataset.g);
        if (!grp) return;
        const cnt = subjectsForYear(y, api.ctx().subjects).filter((s) => s.group === grp.id && now[s.id]).length;
        g.innerHTML = `${esc(shortGroup(grp))}${cnt ? `<i>${cnt}</i>` : ''}`;
      });
      api.announce(`${p.openNow} of ${nextRows.length} open. ${lastLine}`);
      if (p.justOpened.length) api.cue('door');
    },

    dest: (btn) => {
      const plan = getState().plans[y] || {};
      const row = reachFor(api, y, plan).find((r) => r.id === btn.dataset.id);
      if (row) api.sheet(destSheetHtml(row, api.data) + `<p><button type="button" class="btn ghost small" data-action="go" data-s="dest" data-id="${esc(row.id)}">Open the full page</button></p>`, btn);
    },

    'yr-copy': async (btn) => {
      try { await navigator.clipboard.writeText(btn.dataset.text); btn.innerHTML = `${icon('check')} Copied`; } catch { btn.textContent = 'Select and copy the line above'; }
    },
    'yr-list': (btn) => {
      toggleAction(btn.dataset.text);
      const on = getState().actions.includes(btn.dataset.text);
      btn.setAttribute('aria-pressed', String(on));
      btn.innerHTML = on ? `${icon('check')} On my list` : `${icon('plus')} Add to my list`;
      api.announce(on ? 'Added to My plan.' : 'Taken off My plan.');
    },
  });
}

export { prevYear };
