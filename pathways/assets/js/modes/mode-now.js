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
import { project, horizonMoves } from '../engine/project.js';
import { pulse, leverLine } from '../engine/pulse.js';
import {
  getState, setYear, setSubjectLevel, clearPlan, restorePlan, markLooked,
  markIntroSeen, shareUrl, YEARS, currentYear,
} from '../state.js';

let DATA = null;
let CTX = null;
let lastReaches = [];
let host = null;
// A lower secondary student can ask to see the Sec 3 list. Module local and
// never persisted: it is a look, not a change of year.
let showUpper = false;

export function renderNow(container, data, ctx) {
  DATA = data; CTX = ctx; host = container;
  const st = getState();
  const c = data.copy.chrome;
  const phase = yearPhase(st.year);
  const subjects = visibleSubjects(data, st, showUpper);
  const reaches = computeReaches(st.plan);
  lastReaches = reaches;
  const lev = lever(reaches);

  // Two panes on anything tablet sized and up, which is every school
  // Chromebook. The whole loop of this mode is tap a level, watch the doors
  // change, and in one column those two things are hundreds of pixels apart, so
  // the consequence lands somewhere the student cannot see. Side by side, it is
  // direct manipulation. On a phone the pips in the sticky bar do the same job.
  host.innerHTML = `
    <div class="wrap">
      ${st.seenIntro ? '' : `<p class="firstrun"><span>${esc(c.firstRun)}</span>
        <button class="x" data-action="dismiss" type="button" aria-label="Dismiss">✕</button></p>`}

      <div class="now-grid">
        <div class="pane-doors">
          <div class="pulsebar" id="pulsebar">
            <p class="count"><strong id="count">${reaches.filter((r) => r.state === 'open').length}</strong>
              <span>${esc(c.openNow)}</span></p>
            <p class="live" id="live" role="status" aria-live="polite" aria-atomic="true">${esc(leverLine(lev, data.copy))}</p>
            ${pips(reaches)}
          </div>
          <section aria-labelledby="doors-h">
            <h2 id="doors-h" class="h-sm">${esc(c.doorsHead)}</h2>
            <ul class="doors" id="doors">${reaches.map((r) => doorRow(r, lev)).join('')}</ul>
          </section>
        </div>

        <div class="pane-subj">
          <section aria-labelledby="subj-h">
            <div class="subj-head">
              <h2 id="subj-h" class="h-sm">${esc(c.subjectsHead)}</h2>
              <p class="micro mute">${esc(c.subjectsHint)}</p>
            </div>
            <p class="small mute thisyear">${esc((data.copy.thisYear || {})[st.year] || '')}</p>
            ${phase === 'lower' && !showUpper
              ? `<p class="micro mute">${esc(c.onTimetable)}</p>`
              : `<p class="micro mute avail-line">${esc(c.availDisclaimer)}
                  <button class="gloss" type="button" data-action="avail">${esc(c.availMore)}</button></p>`}
            <div id="conflict">${conflictNotice(st.plan, data)}</div>
            ${data.subjects.groups.map((g) => groupBlock(g, subjects, st.plan, st.year)).join('')}
            ${junctureLine(data, st, phase, showUpper)}
            ${phase === 'lower' ? horizonPanel(data, st) : ''}
          </section>
          <div id="tail">${tail(st, reaches, data)}</div>
        </div>
      </div>
    </div>`;

  bindGlossary(host);
  bindActions();
}

// --------------------------------------------------------------------------

function computeReaches(plan) {
  return sortReaches(DATA.pathways.destinations.map((d) => reach(plan, d, { ...CTX, plan })))
    .sort((a, b) => (a.order || 0) - (b.order || 0));
}

/** Sec 1 and Sec 2 are lower secondary. Everything from Sec 3 is upper. */
export function yearPhase(yearId) {
  return (yearId === 'sec1' || yearId === 'sec2') ? 'lower' : 'upper';
}

/**
 * The list a student in this year actually sits in front of.
 *
 * Lower secondary is a different curriculum, not a smaller version of the same
 * one: Science is one integrated subject, Geography and History are taken by
 * everybody, and A Maths, Accounts and Electronics do not exist yet. Showing a
 * Sec 1 student the Sec 3 option booklet was not merely noisy, it was wrong.
 *
 * English, Mother Tongue and Maths carry phase "both" and appear in both lists
 * on the same key, which is the point: the English level raised at the end of
 * Sec 1 is the same fact the polytechnic rule reads three years later.
 *
 * `showUpper` lets a lower secondary student deliberately look at the Sec 3
 * list. Browsing a subject nobody has suggested to you is one of the few
 * defences against deciding at thirteen what you are not the sort of person to
 * do, so the swap is a sensible default and never a wall.
 */
function visibleSubjects(data, st, showUpper) {
  const all = data.subjects.subjects;
  const want = (showUpper || yearPhase(st.year) === 'upper') ? 'upper' : 'lower';
  const phased = all.filter((s) => (s.phase || 'upper') === want || s.phase === 'both');
  return st.offer ? phased.filter((s) => st.offer.includes(s.id)) : phased;
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

/**
 * Eight pips in the sticky bar, one per destination, coloured by state.
 *
 * Phone only. On a phone the subject list runs well past the fold, so a student
 * taps a level chip and the thing that changed is off screen above them. The
 * pips ride along in the sticky bar so the consequence is always visible.
 *
 * They carry state, which is four labelled buckets, not distance. Order matches
 * the list exactly, and never changes.
 */
function pips(reaches) {
  return `
    <ul class="pips" aria-label="All eight at a glance">
      ${reaches.map((r) => `
        <li><button class="pip" type="button" data-state="${r.state}"
              data-action="dest" data-id="${r.id}" aria-haspopup="dialog"
              aria-label="${esc(r.railName)}, ${esc(STATES[r.state].label)}"></button></li>`).join('')}
    </ul>`;
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

function groupBlock(group, subjects, plan, yearId) {
  const list = subjects.filter((s) => s.group === group.id);
  if (!list.length) return '';
  // The common curriculum is four rows nobody chooses. Inside a closed details
  // it costs four words at first paint instead of forty, and it still says out
  // loud that a third of the week is spent there.
  const body = `<ul class="srows">${list.map((s) => subjectRow(s, plan[s.id], yearId)).join('')}</ul>`;
  if (group.id === 'common') {
    return `<details class="grp-fold"><summary class="grp">${esc(group.label)}</summary>
      ${group.note ? `<p class="grp-note">${esc(group.note)}</p>` : ''}${body}</details>`;
  }
  return `
    <h3 class="grp">${esc(group.label)}</h3>
    ${group.note ? `<p class="grp-note">${esc(group.note)}</p>` : ''}
    ${body}`;
}

/**
 * Said once, under the list, not repeated down every row.
 *
 * At Sec 1 and Sec 2 this is the most useful sentence on the screen, because
 * it names the window in which a student can change their own level. From Sec 3
 * it says something different and quieter: the levels are largely settled and
 * what you do with them is not. That correction matters. The line that used to
 * sit here told Sec 3 students a level move was still a conversation away, and
 * the research says the upward window has closed by then.
 */
function junctureLine(data, st, phase, upperShown) {
  const j = data.subjects.junctures;
  if (!j) return '';
  const y = (j.years || {})[st.year] || {};
  const parts = [y.up, y.note].filter(Boolean).map(esc).join(' ');
  const school = phase === 'lower' ? `<br><span class="mute">${esc(j.schoolNote)}</span>` : '';
  const peek = phase === 'lower' ? `
    <button class="gloss" type="button" data-action="peek">${esc(upperShown
      ? data.copy.chrome.backToMine : data.copy.chrome.seeUpper)}</button>` : '';
  return `<p class="micro mute juncture">${parts}${school} ${peek}</p>
    ${phase === 'lower' ? `<p class="micro mute">${esc((j.down || {}).line || '')}
      <button class="gloss" type="button" data-action="downsheet">${esc(data.copy.chrome.availMore)}</button></p>` : ''}`;
}

/**
 * What a Sec 3 combination built on these levels usually looks like, and what
 * one move would change.
 *
 * Placed BELOW the student's own subject list on purpose. Their levels are the
 * fact and this is the inference, and leading with the inference would repeat
 * the mistake Journey already corrected by asking for the combination before
 * the want. The projected rows carry no level chips because they are not the
 * student's to set: a tappable projected row would let a Sec 1 student build an
 * upper secondary plan the engine then treats as real.
 */
function horizonPanel(data, st) {
  const j = data.subjects.junctures || {};
  const pr = project(st.plan, DATA.subjects.subjects);
  const byId = new Map(DATA.subjects.subjects.map((x) => [x.id, x]));
  const c = data.copy.chrome;
  if (!pr.rows.length) return '';

  const chips = pr.rows.map((r) => {
    const to = byId.get(r.to);
    return `<span class="subjchip">${esc(to ? (to.shortName || to.name) : r.to)}<b class="lv lv-${r.level.toLowerCase()}">${esc(r.level)}</b></span>`;
  }).join('');

  const moves = horizonMoves(st.plan, { ...CTX, plan: st.plan }, st.year).slice(0, 2);
  const moveLines = moves.map((m) => {
    const what = m.opens.length
      ? `${c.horizonOpens} ${m.opens.slice(0, 2).map(esc).join(', ')}`
      : `${c.horizonNearer} ${m.nearer.slice(0, 2).map(esc).join(', ')}`;
    return `<li><strong>${esc(m.name)} ${esc(m.from)} to ${esc(m.to)}.</strong> ${what}</li>`;
  }).join('');

  return `
    <section class="horizon" aria-labelledby="hz-h">
      <p class="caps" id="hz-h">${esc(c.horizonHead)} ${statusChip('provisional')}</p>
      <p class="chips subjchips">${chips}</p>
      <p class="micro mute">${esc(c.horizonNote)}</p>
      ${moveLines ? `<ul class="small hz-moves">${moveLines}</ul>` : ''}
    </section>`;
}

const LEVEL_UP = { G1: 'G2', G2: 'G3' };

/**
 * Two words, and only where a level can actually move.
 *
 * The when and the who are stated once above the list, not repeated down every
 * row, for the same reason the lever line exists: the same sentence five times
 * reads as a wall about the student rather than one thing they could do. The
 * prose about what the next level is like lives in the subject sheet.
 */
function nextLevelTag(s, level, yearId) {
  if (!level || !s.raisableFrom) return '';
  if (!LEVEL_UP[level] || !(s.levels || []).includes(LEVEL_UP[level])) return '';
  const order = { sec1: 1, sec2: 2, sec3: 3, sec4: 4, sec5: 5 };
  // Humanities levels do not move until Sec 2. Saying otherwise at Sec 1 would
  // send a thirteen year old to ask for something that is not on offer yet.
  if ((order[yearId] || 9) < (order[s.raisableFrom] || 0)) return '';
  if ((order[yearId] || 9) > 2) return '';
  return `<span class="nextlv">Next ${LEVEL_UP[level]}</span>`;
}

function subjectRow(s, level, yearId) {
  const chips = ['G1', 'G2', 'G3'].map((lv) => {
    if (!s.levels.includes(lv)) return '<span class="lgap" aria-hidden="true"></span>';
    return `<button class="lchip" type="button" data-action="level" data-subject="${s.id}"
              data-level="${lv}" data-lv="${lv}" aria-pressed="${level === lv}"
              aria-label="${esc(s.name)} at ${lv}">${lv}</button>`;
  }).join('');
  return `
    <li class="srow" data-subject="${s.id}"${level ? ` data-level="${level}"` : ''}>
      <button class="srow-name" type="button" data-action="subject" data-id="${s.id}" aria-haspopup="dialog">
        ${esc(s.name)}${s.availability === 'selected' ? ' <span class="seltag">selected schools</span>' : ''}
      </button>
      <div class="srow-levels" role="group" aria-label="${esc(s.name)} level">${
        s.commonCurriculum ? '<span class="everyone">everyone</span>' : chips
      }${nextLevelTag(s, level, yearId)}</div>
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

/**
 * The anti duplication rule, as a caution rather than a lock: a pure humanities
 * subject must differ from the elective half of the Humanities pair. Both rows
 * stay fully selectable; the app just says what schools will say.
 */
function conflictNotice(plan, data) {
  const byId = new Map(data.subjects.subjects.map((x) => [x.id, x]));
  for (const s of data.subjects.subjects) {
    if (s.conflictsWith && plan[s.id] && plan[s.conflictsWith]) {
      const other = byId.get(s.conflictsWith);
      const half = s.name.replace('Literature in English', 'Literature');
      return `<p class="caution" style="margin-bottom:var(--s-3)">${esc(fill(data.copy.chrome.conflictNote, { a: half, b: (other.shortName || other.name) }))}</p>`;
    }
  }
  return '';
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
    avail: (btn) => {
      const av = DATA.subjects.availabilityNote;
      openSheet(`
        <h2 id="sheet-title">Whose list is real?</h2>
        <p>${esc(av.sheet)}</p>
        <p class="small"><a href="${esc(av.schoolfinder)}" target="_blank" rel="noopener">MOE SchoolFinder</a></p>`, btn);
    },
    peek: () => { showUpper = !showUpper; renderNow(host, DATA, CTX); },
    downsheet: (btn) => {
      const d = (DATA.subjects.junctures || {}).down || {};
      openSheet(`
        <h2 id="sheet-title">${esc(d.line || '')}</h2>
        <p>${esc(d.body || '')}</p>
        <p class="small mute">${esc((DATA.subjects.junctures || {}).schoolNote || '')}</p>`, btn);
    },
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
    // The next level tag has to be refreshed here as well as at render. This
    // path deliberately skips a full repaint to keep focus and transitions, so
    // anything derived from the level has to be updated by hand or it silently
    // shows the state before the tap. The conflict notice below learned this
    // the same way.
    const levels = row.querySelector('.srow-levels');
    const old = row.querySelector('.nextlv');
    if (old) old.remove();
    if (levels && s) levels.insertAdjacentHTML('beforeend', nextLevelTag(s, next, getState().year));
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
    const pip = host.querySelector(`.pip[data-id="${r.id}"]`);
    if (pip && pip.dataset.state !== r.state) {
      pip.dataset.state = r.state;
      pip.setAttribute('aria-label', `${r.railName}, ${STATES[r.state].label}`);
      pip.classList.remove('lit'); void pip.offsetWidth; pip.classList.add('lit');
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
  const confEl = host.querySelector('#conflict');
  if (confEl) confEl.innerHTML = conflictNotice(getState().plan, DATA);
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
