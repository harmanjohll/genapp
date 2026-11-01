// A year page: P6, Sec 1, Sec 2, Sec 3, Sec 4 or Sec 5. (v4 visual pass)
//
// Read it like a platform. The station sign says where you are; the levels
// are switches you slide; the departures board answers every slide in view
// (a dock on phones, a panel on wide screens) and flips the rows that
// changed; advice arrives as tickets you can keep. Tabs keep each part to
// one screen: Levels, Advice, Targets (Sec 3 on), This year.
//
// THE HOT PATH. A level tap patches the tile, the board, the dock and the
// advice badge in place. It never repaints the list under the finger.

import {
  getState, setYearLevel, replaceYearPlan, setYear, YEARS,
} from '../state.js?v=4.2.0';
import { reach } from '../engine/reach.js?v=4.2.0';
import { pulse } from '../engine/pulse.js?v=4.2.0';
import { evalPlan, subjectsForYear, carryForward, isLower } from '../engine/years.js?v=4.2.0';
import { advise } from '../engine/advice.js?v=4.2.0';
import { psleSec1Plan } from '../engine/psle.js?v=4.2.0';
import { openCount } from '../ui/map.js?v=4.2.0';
import { destSheetHtml } from '../ui/destsheet.js?v=4.2.0';
import { yearStrip, STRIP } from '../ui/yearstrip.js?v=4.2.0';
import { boardHtml, lampsHtml } from '../ui/board.js?v=4.2.0';
import { ticketHtml, holdHtml } from '../ui/ticket.js?v=4.2.0';
import { psleHtml, bindPsle } from '../ui/pslepanel.js?v=4.2.0';
import { targetsHtml, bindTargets } from '../ui/targets.js?v=4.2.0';
import { esc, onAction } from '../ui/dom.js?v=4.2.0';
import { icon } from '../ui/icons.js?v=4.2.0';
import { signalHtml } from '../ui/signal.js?v=4.2.0';
import { t, lineMode, openWord } from '../ui/labels.js?v=4.2.0';

// The answer, in the reader's chosen form: the live signal by default, the
// departures board in Line mode. Same data, same order, same states.
function answerHtml(rows, key, y) {
  return lineMode()
    ? boardHtml(rows, { key, title: t(isLower(y) ? 'answerFromLower' : 'answerFrom', LABEL[y]) })
    : signalHtml(rows, { key, caption: t(isLower(y) ? 'answerFromLower' : 'answerFrom', LABEL[y]) });
}

const LABEL = Object.fromEntries(YEARS.map((y) => [y.id, y.label]));
const CODE = Object.fromEntries(STRIP.map((y) => [y.id, y.code]));
let lastLine = '';
let lastYear = null;

function yearId(api) {
  const q = api.route().q;
  const st = getState();
  const y = q.y || (st.yearSet ? st.year : 'sec1');
  return LABEL[y] ? y : 'sec1';
}

function tabsFor(y) {
  if (y === 'p6') return [['psle', 'PSLE results|PSLE'], ['year', 'Year guide|Guide']];
  const tabs = [['levels', 'Set levels|Levels'], ['advice', `${t('movesTab')}|${t('movesShort')}`]];
  if (!isLower(y)) tabs.push(['targets', 'Grade targets|Targets']);
  tabs.push(['year', 'Year guide|Guide']);
  return tabs;
}

function meta(api, y) {
  return ((api.data.years && api.data.years.years) || {})[y] || {};
}

function reachFor(api, y, plan) {
  const c = api.ctx();
  const ep = evalPlan(y, plan, c.subjects);
  return c.destinations.map((d) => reach(ep, d, { ...c, plan: ep, yearId: y }));
}

export default {
  id: 'year',
  title: (q) => (q && q.y ? `${LABEL[q.y]} subjects` : 'Subjects'),
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
    const stance = !st.yearSet ? '' : (here ? 'You are here' : (idx > nowIdx ? 'Looking ahead' : 'Looking back'));

    const plan = (st.plans && st.plans[y]) || {};
    const showResult = y !== 'p6';
    const rows = showResult ? reachFor(api, y, plan) : [];
    const adv = showResult ? advise({ yearId: y, plan, ctx: api.ctx(), offer: st.offer }) : null;
    const advCount = adv ? adv.singles.length + adv.pairs.length : 0;

    root.innerHTML = `
    ${yearStrip(y, st)}
    <div class="wrap yearwrap">
      <header class="sign arrive">
        <div class="sign-code" aria-hidden="true">${esc(CODE[y])}</div>
        <div class="sign-body">
          <p class="sign-meta">${esc(m.phase || '')} <span>Age ${age}</span>${stance ? ` <b data-here="${here}">${esc(stance)}</b>` : ''}</p>
          <h1><span class="sr-only">${esc(LABEL[y])}: </span>${esc(m.headline || LABEL[y])}</h1>
          ${m.lede && (tab === 'year' || !Object.keys(plan).length) ? `<p class="sign-lede">${esc(m.lede)}</p>` : ''}
          ${!st.yearSet ? `<button type="button" class="btn ghost small press" data-action="yr-mine">This is my year</button>` : ''}
        </div>
      </header>

      <div class="segtabs" role="tablist" aria-label="${esc(LABEL[y])}">
        ${tabs.map(([id, label]) => `
          <button type="button" role="tab" class="segtab press" id="tab-${id}" data-action="yr-tab" data-tab="${id}"
            aria-selected="${tab === id}" aria-controls="panel" aria-label="${esc(label.split('|')[0])}"><span class="tl-long">${esc(label.split('|')[0])}</span><span class="tl-short" aria-hidden="true">${esc(label.split('|')[1] || label.split('|')[0])}</span>${id === 'advice' && advCount ? `<i class="segbadge">${advCount}</i>` : ''}</button>`).join('')}
      </div>

      <div class="ylayout${showResult ? ' has-aside' : ''}">
        <section class="ymain" id="panel" role="tabpanel" aria-labelledby="tab-${tab}">
          ${panel(tab, api, y, plan, rows, adv)}
        </section>
        ${showResult ? `<aside class="yaside" aria-label="What these levels open" id="yaside">${asideHtml(api, y, rows, adv)}</aside>` : ''}
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

function shortGroup(g) {
  return { core: 'Core', maths_extra: 'More Maths', science: 'Science', humanities: 'Humanities', elective: 'Electives', common: 'Common' }[g.id] || g.label;
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
  const flat = groups.flatMap((g) => g.flat);

  return `
    ${carry ? `
      <div class="carry arrive">
        <span class="carry-ic">${icon('train')}</span>
        <div>
          <p class="carry-h">Start from your ${esc(LABEL[carry.from])} levels?</p>
          <p class="small">${esc(isLower(carry.from) && !isLower(y)
            ? 'Science becomes one science option, and your strongest Humanities becomes the pair. Change anything after.'
            : 'Everything comes across as it was. Change anything after.')}</p>
        </div>
        <button type="button" class="btn press" data-action="yr-carry">Copy ${esc(LABEL[carry.from])} levels into ${esc(LABEL[y])}</button>
      </div>` : ''}
    ${fromPsle ? `
      <div class="carry arrive">
        <span class="carry-ic">${icon('spark')}</span>
        <div><p class="carry-h">Use your PSLE starting levels?</p><p class="small">Worked out on the P6 page.</p></div>
        <button type="button" class="btn press" data-action="yr-psle">Use them</button>
      </div>` : ''}

    <p class="lv-instr">${icon('spark')} Slide each subject to its level. ${lineMode() ? 'The board' : 'The lamps'} below show what opens.</p>
    <div class="lvkey">
      ${['G1', 'G2', 'G3'].map((l) => `<span class="lvkey-i" style="--lvc:var(--${l.toLowerCase()})"><b>${l}</b>${esc((li[l] && li[l].plain) || '')}</span>`).join('')}
    </div>

    ${!isLower(y) ? `<p class="loadmeter"><span class="lm-n">${count}</span> subjects <span class="lm-g3">${g3} at G3</span><span class="lm-note">${esc(loadNote(api, count, g3))}</span></p>` : ''}

    ${chunked ? `
      <div class="groupchips" role="tablist" aria-label="Subject groups">
        ${groups.filter((g) => g.rows.length).map((g) => {
          const n = g.rows.filter((s) => plan[s.id]).length;
          return `<button type="button" role="tab" class="gchip press" data-action="yr-group" data-g="${esc(g.id)}" aria-selected="${active && active.id === g.id}">
            ${esc(shortGroup(g))}${n ? `<i>${n}</i>` : ''}</button>`;
        }).join('')}
      </div>` : ''}

    ${(chunked ? [active] : groups.filter((g) => g.rows.length)).filter(Boolean).map((g) => `
      <section class="subjgroup">
        ${chunked ? '' : `<h2 class="grouph">${esc(g.label)}</h2>`}
        ${g.note ? `<p class="small groupnote">${esc(g.note)}</p>` : ''}
        <div class="subjgrid">${g.rows.map((s) => subjTile(s, plan)).join('')}</div>
      </section>`).join('')}

    ${flat.length && !chunked ? `<p class="small flatline">${esc(api.copy('chrome.alsoTimetable', 'Also on the timetable, no level to pick:'))} ${flat.map((s) => esc(s.name)).join(', ')}.</p>` : ''}

    ${chunked ? nextGroupBtn(groups, active) : `<p class="nextgroup"><button type="button" class="btn press" data-action="yr-tab" data-tab="advice">See the advice ${icon('arrow')}</button></p>`}

    <div class="notes">
      ${j.up ? `<p>${icon('calendar')} ${esc(j.up)}</p>` : ''}
      ${j.note ? `<p>${esc(j.note)}</p>` : ''}
      <p>${esc(api.copy('chrome.availability', 'Schools offer different subsets of this list. Your school decides what runs; this decides nothing.'))}</p>
    </div>`;
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
  if (n === 0) return 'Slide in the subjects you take, or plan to.';
  if (n < 5) return l.early || '';
  if (n >= 9) return l.heavy || '';
  if (g3 >= 5) return l.solid || '';
  return l.spread || '';
}

const LVI = { G1: 0, G2: 1, G3: 2 };

/** A subject tile with a three way level switch. The thumb slides. */
export function subjTile(s, plan, action = 'yr-lvl') {
  const held = plan[s.id] || '';
  return `
  <div class="subj" data-sid="${esc(s.id)}" data-held="${held}">
    <span class="subj-name">${esc(s.name)}
      ${s.compulsory ? '<small>Everyone takes this</small>' : ''}
      ${s.status === 'provisional' && !s.compulsory ? '<small>Selected schools</small>' : ''}
    </span>
    <span class="lvsw" role="group" aria-label="${esc(s.name)} level" data-level="${held}" style="--i:${held ? LVI[held] : 0}">
      <i class="lvsw-thumb" aria-hidden="true"></i>
      ${['G1', 'G2', 'G3'].map((l) => (s.levels || []).includes(l)
        ? `<button type="button" class="lvsw-b" data-action="${action}" data-sid="${esc(s.id)}" data-level="${l}"
            aria-pressed="${held === l}" aria-label="${esc(s.name)} at ${l}${held === l ? ', picked. Tap to clear.' : ''}">${l}</button>`
        : '<span class="lvsw-b off" aria-hidden="true"></span>').join('')}
    </span>
  </div>`;
}

/** Patch a tile in place after a tap. */
export function patchTile(root, sid, level, name) {
  const tile = root.querySelector(`.subj[data-sid="${CSS.escape(sid)}"]`);
  if (!tile) return;
  tile.dataset.held = level || '';
  const sw = tile.querySelector('.lvsw');
  if (sw) {
    sw.dataset.level = level || '';
    if (level) sw.style.setProperty('--i', LVI[level]);
  }
  tile.querySelectorAll('.lvsw-b[data-level]').forEach((b) => {
    const on = level === b.dataset.level;
    b.setAttribute('aria-pressed', String(on));
    b.setAttribute('aria-label', `${name} at ${b.dataset.level}${on ? ', picked. Tap to clear.' : ''}`);
  });
}

/* ---- advice ----------------------------------------------------------------- */

function adviceHtml(api, y, rows, adv) {
  const st = getState();
  const open = openCount(rows);
  const top = adv.singles[0];
  const rest = adv.singles.slice(1);

  if (adv.start && !Object.keys((st.plans || {})[y] || {}).length) {
    return `
      <div class="emptystate">
        <span class="es-ic">${icon('train')}</span>
        <p class="es-h">No levels on this page yet.</p>
        <p class="small">${esc(adv.start.line)}</p>
        <button type="button" class="btn press" data-action="yr-tab" data-tab="levels">Set levels</button>
      </div>`;
  }

  return `
    <div class="mobile-board">${answerHtml(rows, `adv-${y}`, y)}</div>
    ${isLower(y) ? '<p class="small inferline">Admission in 2028 reads your SEC results, not your Sec 1 and 2 levels. These levels matter because they shape the subjects and levels you take in Sec 3. On track means your levels now fit what each place will ask.</p>' : ''}
    ${adv.start && adv.start.missing ? `<p class="callout small">${esc(adv.start.line)} <button type="button" class="linkbtn" data-action="yr-tab" data-tab="levels">Add them</button></p>` : ''}

    ${top ? `
      <h2 class="advh">${esc(t('nextMove'))}</h2>
      ${ticketHtml(top, { hero: true })}` : (open === rows.length ? `
      <div class="allopen">
        <p class="allopen-n">8/8</p>
        <div><p class="allopen-h">${isLower(y) ? 'Every place is on track from here.' : 'Every destination is open from here.'}</p>
        <p class="small">The question now is not which door but which two years you want. Play one forward to test it.</p>
        <button type="button" class="btn press" data-action="go" data-s="play">Play it forward</button></div>
      </div>` : '')}

    ${rest.length ? `
      <h2 class="advh">${esc(t('moreMoves'))}</h2>
      <div class="ticketlist">${rest.map((m) => ticketHtml(m)).join('')}</div>` : ''}

    ${adv.pairs.length ? `
      <h2 class="advh">${esc(t('pairMoves'))}</h2>
      <p class="small advsub">${isLower(y) ? 'These put a place on track that no single move does.' : 'These open something no single move does.'}</p>
      <div class="ticketlist">${adv.pairs.map((m) => ticketHtml(m)).join('')}</div>` : ''}

    ${adv.holds.length ? `
      <h2 class="advh">Levels to keep</h2>
      <p class="small advsub">These levels are what keep places ${isLower(y) ? 'on track' : 'open'}. Worth knowing before anyone suggests easing a subject down: sometimes that is right, but it should be a decision, not a surprise.</p>
      <div class="holdlist">${adv.holds.map((h) => holdHtml(h)).join('')}</div>` : ''}`;
}

/* ---- this year ------------------------------------------------------------- */

function yearHtml(api, y) {
  const st = getState();
  const m = meta(api, y);
  const talk = (m.talk && m.talk[st.role]) || [];
  return `
    ${(m.happens || []).length ? `
      <h2 class="advh">What happens this year</h2>
      <ol class="timeline">
        ${m.happens.map((h) => `<li><span class="tl-when">${esc(h.when || '')}</span><span class="tl-what">${esc(h.what)}${h.status === 'provisional' ? ' <span class="src-chip provisional">varies by school</span>' : ''}</span></li>`).join('')}
      </ol>` : ''}
    ${(m.decisions || []).length ? `
      <h2 class="advh">Decisions in ${esc(LABEL[y])}</h2>
      <div class="decgrid">${m.decisions.map((d, i) => `<div class="dec"><span class="dec-n">${i + 1}</span><p>${esc(d.text || d)}</p></div>`).join('')}</div>` : ''}
    ${talk.length ? `
      <h2 class="advh">${st.role === 'parent' ? 'Ask at home' : st.role === 'teacher' ? 'Ask in the conversation' : 'Worth asking'}</h2>
      <div class="bubbles">${talk.map((t) => `<p class="bubble">${esc(t)}</p>`).join('')}</div>
      <p class="small">The ${esc(st.role)} version. <button type="button" class="linkbtn" data-action="role">Change who is reading</button></p>` : ''}
    ${m.source ? `<p class="srcline">${esc(m.source)}</p>` : ''}`;
}

/* ---- the answer, kept in view ----------------------------------------------- */

function dockHtml(rows, adv) {
  const open = openCount(rows);
  const top = adv && adv.singles[0];
  const k = lastLine || t('answer');
  const lower = openWord(rows) === 'on track';
  const line = top ? top.short : (open === rows.length ? (lower ? 'Every place is on track.' : 'Every destination is open.') : 'Slide a level and this answers.');
  return `
    <button type="button" class="dock-in press" data-action="yr-tab" data-tab="advice" aria-label="${open} of ${rows.length} ${openWord(rows)}. ${esc(lastLine)} ${esc(line)} Open the advice.">
      <span class="dock-num"><b>${open}</b>/${rows.length}</span>
      <span class="dock-words"><span class="dock-k">${esc(k)}</span><span class="dock-line">${top ? `${icon('ticket')} ` : ''}${esc(line)}</span></span>
      ${lampsHtml(rows)}
    </button>`;
}

function asideHtml(api, y, rows, adv) {
  const top = adv.singles[0];
  return `
    ${answerHtml(rows, `aside-${y}`, y)}
    ${lastLine ? `<p class="aside-last">${esc(lastLine)}</p>` : ''}
    ${top ? `<div class="aside-ticket">${ticketHtml(top, { compact: true })}
      <button type="button" class="btn ghost small press" data-action="yr-tab" data-tab="advice">All advice ${icon('arrow')}</button></div>` : ''}`;
}

/* ---- bindings ----------------------------------------------------------------- */

function bind(root, api, y) {
  onAction(root, {
    'yr-tab': (btn) => { api.setQuery({ tab: btn.dataset.tab }); api.refresh(); window.scrollTo({ top: 0 }); },
    'yr-group': (btn) => {
      api.setQuery({ g: btn.dataset.g });
      api.refresh();
      root.querySelector('.groupchips')?.scrollIntoView({ block: 'nearest' });
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
      patchTile(root, sid, wasHeld ? null : level, subj ? subj.name : sid);

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
      if (dock) { dock.innerHTML = dockHtml(nextRows, adv); dock.classList.remove('bump'); void dock.offsetWidth; dock.classList.add('bump'); }
      const aside = root.querySelector('#yaside');
      if (aside) aside.innerHTML = asideHtml(api, y, nextRows, adv);
      const n = adv.singles.length + adv.pairs.length;
      const tab = root.querySelector('#tab-advice');
      if (tab) {
        let badge = tab.querySelector('.segbadge');
        if (n && !badge) { badge = document.createElement('i'); badge.className = 'segbadge'; tab.appendChild(badge); }
        if (badge) { if (n) badge.textContent = String(n); else badge.remove(); }
      }
      const load = root.querySelector('.loadmeter');
      if (load) {
        const cnt = Object.keys(now).length;
        const g3 = Object.values(now).filter((l) => l === 'G3').length;
        load.innerHTML = `<span class="lm-n">${cnt}</span> subjects <span class="lm-g3">${g3} at G3</span><span class="lm-note">${esc(loadNote(api, cnt, g3))}</span>`;
      }
      root.querySelectorAll('.gchip').forEach((g) => {
        const grp = (api.data.subjects.groups || []).find((x) => x.id === g.dataset.g);
        if (!grp) return;
        const cnt = subjectsForYear(y, api.ctx().subjects).filter((s) => s.group === grp.id && now[s.id]).length;
        g.innerHTML = `${esc(shortGroup(grp))}${cnt ? `<i>${cnt}</i>` : ''}`;
      });
      api.announce(`${p.openNow} of ${nextRows.length} ${openWord(nextRows)}. ${lastLine}`);
      if (p.justOpened.length) api.cue('door');
    },

    dest: (btn) => {
      const plan = getState().plans[y] || {};
      const row = reachFor(api, y, plan).find((r) => r.id === btn.dataset.id);
      if (row) api.sheet(destSheetHtml(row, api.data) + `<p><button type="button" class="btn press" data-action="go" data-s="dest" data-id="${esc(row.id)}">Open the full page ${icon('arrow')}</button></p>`, btn);
    },
  });
}
