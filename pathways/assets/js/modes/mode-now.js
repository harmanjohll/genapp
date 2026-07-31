// Mode NOW. Build the combination you are considering and see what it opens.
//
// This screen was 4,574 words and 33 phone screens before a student had tapped
// anything. It is now under 200, and nothing was thrown away: the writing moved
// into sheets that open on demand.
//
// Three decisions worth knowing about, all of them reversals:
//
// 1. Destinations are a fixed alphabetical list with NO distance shown. An
//    earlier design slid a dot along a track to encode how far away each one
//    was. Position is a continuous ranking, which is worse than the four
//    labelled states it replaced, and on a low plan it drew the clearest
//    picture of a ceiling this app has ever produced. Gone.
// 2. The wall of repeated moves is collapsed into one lever line. A student on
//    a mostly G1 plan used to see "Move English up to G3" five times down the
//    page. Now they see it once, with what it would move.
// 3. The load guard stayed. Tapping the G3 column down the list opens
//    everything, and without a counterweight this screen is a maximiser that
//    rewards over committing a fourteen year old.

import { esc, onAction, statusChip } from '../components/dom.js';
import { decorate, bindGlossary } from '../components/glossary.js';
import { openSheet, onSheetAction, close as closeSheet } from '../components/sheet.js';
import { reach, sortReaches, lever, STATES } from '../engine/reach.js';
import { pulse, leverLine } from '../engine/pulse.js';
import {
  getState, setYear, setSubjectLevel, clearPlan, restorePlan, markLooked,
  markIntroSeen, shareUrl, YEARS, currentYear,
} from '../state.js';

let DATA = null;
let CTX = null;
let lastReaches = [];
let host = null;

export function renderNow(container, data, ctx) {
  DATA = data; CTX = ctx; host = container;
  const st = getState();
  const c = data.copy.chrome;
  const subjects = visibleSubjects(data, st);
  const reaches = computeReaches(st.plan);
  lastReaches = reaches;
  const lev = lever(reaches);

  host.innerHTML = `
    <div class="wrap">
      ${st.seenIntro ? '' : `<p class="firstrun"><span>${esc(c.firstRun)}</span>
        <button class="x" data-action="dismiss" type="button" aria-label="Dismiss">✕</button></p>`}

      <div class="pulsebar" id="pulsebar">
        <p class="count"><strong id="count">${reaches.filter((r) => r.state === 'open').length}</strong>
          <span>${esc(c.openNow)}</span></p>
        <p class="live" id="live" role="status" aria-live="polite" aria-atomic="true">${esc(leverLine(lev, data.copy))}</p>
      </div>

      <section class="section" aria-labelledby="doors-h">
        <h2 id="doors-h" class="h-sm">${esc(c.doorsHead)}</h2>
        <ul class="doors" id="doors">${reaches.map((r) => doorRow(r, lev)).join('')}</ul>
      </section>

      <section class="section" aria-labelledby="subj-h">
        <div class="subj-head">
          <h2 id="subj-h" class="h-sm">${esc(c.subjectsHead)}</h2>
          <p class="micro mute">${esc(c.subjectsHint)}</p>
        </div>
        ${data.subjects.groups.map((g) => groupBlock(g, subjects, st.plan)).join('')}
        <p class="micro mute">${esc(data.subjects.movement.headline)} ${esc(data.subjects.movement.body)}</p>
      </section>

      <div id="tail">${tail(st, reaches, data)}</div>
    </div>`;

  bindGlossary(host);
  bindActions();
}

// --------------------------------------------------------------------------

function computeReaches(plan) {
  return sortReaches(DATA.pathways.destinations.map((d) => reach(plan, d, { ...CTX, plan })))
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

function visibleSubjects(data, st) {
  const all = data.subjects.subjects;
  return st.offer ? all.filter((s) => st.offer.includes(s.id)) : all;
}

/**
 * A row's status, given what the lever line above already says.
 *
 * On a low plan the same move is the next step for five destinations at once,
 * so the list used to read "English to G3" five times down the page. That is a
 * wall, and repetition makes it look like a wall about the student rather than
 * one move they could make. The lever line above states that move once. Any row
 * whose next step is already the lever falls back to its state, so the list
 * shows five different things instead of the same thing five times.
 */
function rowStatus(r, lev) {
  const dup = lev && r.moves.some((m) => m.hard && m.short === lev.short);
  if (r.state === 'open' || !dup) return r.status.text;
  return STATES[r.state].label;
}

function doorRow(r, lev) {
  return `
    <li class="door" data-id="${r.id}" data-state="${r.state}">
      <button class="door-hit" type="button" data-action="dest" data-id="${r.id}" aria-haspopup="dialog">
        <span class="door-name">${esc(r.railName)}</span>
        <span class="door-status">${esc(rowStatus(r, lev))}</span>
      </button>
    </li>`;
}

function groupBlock(group, subjects, plan) {
  const list = subjects.filter((s) => s.group === group.id);
  if (!list.length) return '';
  return `
    <h3 class="grp">${esc(group.label)}</h3>
    <ul class="srows">${list.map((s) => subjectRow(s, plan[s.id])).join('')}</ul>`;
}

function subjectRow(s, level) {
  const chips = ['G1', 'G2', 'G3'].map((lv) => {
    if (!s.levels.includes(lv)) return '<span class="lgap" aria-hidden="true"></span>';
    return `<button class="lchip" type="button" data-action="level" data-subject="${s.id}"
              data-level="${lv}" data-lv="${lv}" aria-pressed="${level === lv}"
              aria-label="${esc(s.name)} at ${lv}">${lv}</button>`;
  }).join('');
  return `
    <li class="srow" data-subject="${s.id}"${level ? ` data-level="${level}"` : ''}>
      <button class="srow-name" type="button" data-action="subject" data-id="${s.id}" aria-haspopup="dialog">
        ${esc(s.name)}
      </button>
      <div class="srow-levels" role="group" aria-label="${esc(s.name)} level">${chips}</div>
    </li>`;
}

function tail(st, reaches, data) {
  const c = data.copy.chrome;
  const n = Object.keys(st.plan).length;
  const g3 = Object.values(st.plan).filter((l) => l === 'G3').length;
  const L = data.copy.load;
  let verdict = '';
  if (n >= 3) {
    if (g3 >= 7) verdict = L.heavy;
    else if (g3 >= 5) verdict = L.solid;
    else if (n >= 6) verdict = L.spread;
    else verdict = L.early;
  }
  const looked = st.looked.length;
  const total = visibleSubjects(data, st).length;

  const f = data._freshness;
  const stale = f.stale ? ` ${fill(c.stale, { days: f.days })}` : '';

  return `
    ${verdict ? `<div class="panel tight">
        <p class="caps">${esc(fill(L.chip, { n, g3 }))}</p>
        <p class="small" style="margin:0">${esc(verdict)}</p>
      </div>` : ''}

    ${askCard(st, reaches, data)}

    <p class="micro mute breadth">${esc(fill(c.breadth, { n: looked, total }))}</p>

    <div class="btn-row" style="margin-top:var(--s-4)">
      <button class="btn ghost small" type="button" data-action="share">${esc(c.shareHead)}</button>
      ${n ? '<button class="btn ghost small" type="button" data-action="clear">Clear</button>' : ''}
    </div>

    <p class="micro mute foot-note">${esc(c.footer)} ${esc(fill(c.provisional, { n: data._provisionalCount }))}${esc(stale)}</p>`;
}

/**
 * The exit ticket. The evidence on career tools is consistent that a screen on
 * its own is the weakest form of this intervention and that its job is to start
 * a conversation. This is the only thing here designed to leave the device.
 */
function askCard(st, reaches, data) {
  const c = data.copy.chrome;
  const lev = lever(reaches);
  let q;
  if (lev) {
    const subj = lev.short.split(' to ')[0];
    q = fill(data.copy.ask.move, { who: 'subject teacher', subject: subj });
  } else {
    const open = reaches.find((r) => r.state === 'open');
    q = open ? fill(data.copy.ask.dest, { dest: open.railName }) : data.copy.ask.open;
  }
  return `
    <div class="ask">
      <p class="caps">${esc(c.askHead)}</p>
      <p class="ask-q" id="askq">${esc(q)}</p>
      <button class="btn small" type="button" data-action="copyask" data-q="${esc(q)}">${esc(c.askCopy)}</button>
    </div>`;
}

function fill(tpl, vars) {
  return String(tpl || '').replace(/\{(\w+)\}/g, (_, k) => (vars[k] == null ? '' : vars[k]));
}

// --------------------------------------------------------------------------
// Actions

function bindActions() {
  onAction(host, {
    level: (btn) => onLevel(btn),
    subject: (btn) => openSubject(btn.dataset.id, btn),
    dest: (btn) => openDest(btn.dataset.id, btn),
    year: (btn) => setYear(btn.dataset.year),
    dismiss: (btn) => { markIntroSeen(); btn.closest('.firstrun').remove(); },
    clear: () => onClear(),
    share: () => onShare(),
    copyask: (btn) => copyText(btn, btn.dataset.q),
  });
}

/**
 * The hot path. Mutates in place. No innerHTML, so the chip keeps focus, the
 * transitions actually run, and the glossary regex does not re-scan the page.
 */
function onLevel(btn) {
  const { subject, level } = btn.dataset;
  const st = getState();
  const s = DATA.subjects.subjects.find((x) => x.id === subject);
  const prevReaches = lastReaches;
  const next = st.plan[subject] === level ? null : level;

  setSubjectLevel(subject, next, s ? s.name : subject);

  const row = host.querySelector(`.srow[data-subject="${subject}"]`);
  if (row) {
    if (next) row.dataset.level = next; else delete row.dataset.level;
    row.querySelectorAll('.lchip').forEach((c) => {
      c.setAttribute('aria-pressed', String(c.dataset.level === next));
    });
  }

  const reaches = computeReaches(getState().plan);
  lastReaches = reaches;
  const lev = lever(reaches);

  const evt = {
    subjectName: s ? s.name : subject,
    level: next || level,
    action: next ? 'set' : 'clear',
    first: Object.keys(st.plan).length === 1 && !!next,
  };
  const p = pulse(prevReaches, reaches, evt, DATA.copy);

  // Rows: update text and state, and flag the ones that changed.
  reaches.forEach((r) => {
    const li = host.querySelector(`.door[data-id="${r.id}"]`);
    if (!li) return;
    const wasState = li.dataset.state;
    li.dataset.state = r.state;
    const statusEl = li.querySelector('.door-status');
    const next = rowStatus(r, lev);
    if (statusEl && statusEl.textContent !== next) statusEl.textContent = next;
    if (wasState !== r.state) {
      li.classList.remove('moved');
      void li.offsetWidth;
      li.classList.add('moved');
    }
  });

  const countEl = host.querySelector('#count');
  if (countEl) {
    countEl.textContent = String(p.openNow);
    countEl.classList.remove('pop'); void countEl.offsetWidth; countEl.classList.add('pop');
  }
  const liveEl = host.querySelector('#live');
  if (liveEl) liveEl.textContent = p.line || leverLine(lev, DATA.copy);

  const tailEl = host.querySelector('#tail');
  if (tailEl) tailEl.innerHTML = tail(getState(), reaches, DATA);
}

function onClear() {
  const backup = clearPlan();
  renderNow(host, DATA, CTX);
  const bar = document.createElement('div');
  bar.className = 'undobar';
  bar.innerHTML = `<span>${esc(DATA.copy.chrome.cleared)}</span>
    <button class="btn small" type="button">${esc(DATA.copy.chrome.undo)}</button>`;
  document.body.appendChild(bar);
  const kill = () => bar.remove();
  bar.querySelector('button').addEventListener('click', () => {
    restorePlan(backup); renderNow(host, DATA, CTX); kill();
  });
  setTimeout(kill, 6000);
}

async function onShare() {
  const url = shareUrl();
  const c = DATA.copy.chrome;
  openSheet(`
    <h2 id="sheet-title">${esc(c.shareHead)}</h2>
    <p class="small mute">${esc(c.shareHint)}</p>
    <input class="sharebox" type="text" readonly value="${esc(url)}" aria-label="Your link">
    <button class="btn" type="button" data-action="copylink" data-url="${esc(url)}">${esc(c.askCopy)}</button>`);
  onSheetAction({ copylink: (b) => copyText(b, b.dataset.url) });
}

function copyText(btn, text) {
  const done = () => {
    const old = btn.textContent;
    btn.textContent = DATA.copy.chrome.askCopied;
    setTimeout(() => { btn.textContent = old; }, 1600);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
  } else fallbackCopy(text, done);
}

function fallbackCopy(text, done) {
  const ta = document.createElement('textarea');
  ta.value = text; ta.setAttribute('readonly', '');
  ta.style.cssText = 'position:absolute;left:-9999px';
  document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); done(); } catch { /* ignore */ }
  ta.remove();
}

// --------------------------------------------------------------------------
// Sheets

function openSubject(id, trigger) {
  const s = DATA.subjects.subjects.find((x) => x.id === id);
  if (!s) return;
  markLooked(id);
  const st = getState();
  const chips = ['G1', 'G2', 'G3'].map((lv) => (s.levels.includes(lv)
    ? `<button class="lchip" type="button" data-action="sheetlevel" data-subject="${s.id}"
        data-level="${lv}" data-lv="${lv}" aria-pressed="${st.plan[s.id] === lv}"
        aria-label="${esc(s.name)} at ${lv}">${lv}</button>` : '')).join('');

  openSheet(`
    <div class="sheet-head">
      <h2 id="sheet-title">${esc(s.name)}</h2>
      <div class="srow-levels">${chips}</div>
    </div>
    <p>${decorate(s.doing)}</p>
    <p class="small mute">You will like it if ${esc(s.likeIf)}.</p>
    <ul class="chips">${s.showsUp.map((x) => `<li>${decorate(x)}</li>`).join('')}</ul>
    ${s.note ? `<p class="micro mute">${decorate(s.note)}</p>` : ''}
    ${s.caution ? `<p class="caution">${esc(s.caution)}</p>` : ''}
    <p class="micro mute">${esc(DATA.copy.chrome.levelsMove)}</p>
    ${s.status === 'provisional' ? statusChip('provisional') : ''}`, trigger);

  onSheetAction({
    sheetlevel: (b) => {
      const cur = getState().plan[b.dataset.subject];
      const next = cur === b.dataset.level ? null : b.dataset.level;
      setSubjectLevel(b.dataset.subject, next, s.name);
      closeSheet();
      renderNow(host, DATA, CTX);
    },
  });
}

function openDest(id, trigger) {
  const r = lastReaches.find((x) => x.id === id);
  if (!r) return;
  const c = DATA.copy.chrome;
  const met = r.met.map((m) => `<li class="yes"><span class="icon" aria-hidden="true">✓</span>${decorate(m.label)}</li>`).join('');
  const gap = r.gap.map((g) => `<li class="not"><span class="icon" aria-hidden="true">○</span>${decorate(g.label)}${g.soft ? ' <span class="mute">(usually expected)</span>' : ''}</li>`).join('');

  const moves = r.moves.length ? `
    <div class="moves">
      <h4>${esc(c.moveHead)}</h4>
      <ul>${r.moves.map((m) => `<li>${decorate(m.short)}. <span class="who">Ask your ${esc(m.who.split(',')[0])}, ${esc(m.when)}.</span></li>`).join('')}</ul>
    </div>` : '';

  const routes = r.routes.length ? `
    <h4 class="caps">${esc(c.roadHead)}</h4>
    ${r.routes.slice(0, 2).map((rt) => `
      <div class="route">
        <div class="steps">${rt.steps.map((s2, i) => `${i ? '<span class="arrow" aria-hidden="true">→</span>' : ''}<span class="step">${esc(s2)}</span>`).join('')}</div>
        <div class="small">${decorate(rt.detail)}</div>
        ${rt.honest ? `<div class="honest">${decorate(rt.honest)}</div>` : ''}
      </div>`).join('')}` : '';

  openSheet(`
    <div class="sheet-head">
      <h2 id="sheet-title">${esc(r.name)}</h2>
      <span class="reach-state" data-state="${r.state}">${esc(STATES[r.state].label)}</span>
    </div>
    <p class="micro mute">${esc(r.duration)}. ${esc(r.leadsTo)}</p>
    <p>${decorate(r.feels)}</p>
    <h4 class="caps">${esc(c.metHead)}</h4>
    <ul class="checklist">${met}${gap}</ul>
    ${moves}
    ${routes}
    ${r.alsoIn.length ? `<p class="small mute">${decorate(r.alsoIn[0])}</p>` : ''}
    <details class="perf">
      <summary>${esc(c.perfHead)}</summary>
      ${r.performance.map((p) => `<p class="small"><strong>${decorate(p.label)}</strong> ${statusChip(p.status)}<br>
        <span class="mute">${decorate(p.note)}</span></p>`).join('')}
      <p class="micro faint">${esc(c.perfNote)}</p>
    </details>
    <div class="chip-row">${statusChip(r.dataStatus, r.asOf)}</div>`, trigger);
}

export function yearChips() {
  const y = currentYear();
  return YEARS.map((v) => `<option value="${v.id}"${v.id === y.id ? ' selected' : ''}>${esc(v.label)}</option>`).join('');
}
