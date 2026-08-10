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

import { esc, onAction, statusChip } from '../components/dom.js?v=2.11.0';
import { icon } from '../components/icons.js?v=2.11.0';
import { decorate, bindGlossary } from '../components/glossary.js?v=2.11.0';
import { openSheet, onSheetAction, setSheetFoot, close as closeSheet } from '../components/sheet.js?v=2.11.0';
import { openSectorSheet, sectorsForSubject } from './mode-work.js?v=2.11.0';
import { costLineFor } from './mode-money.js?v=2.11.0';
import { notMyRoadLink } from './mode-schools.js?v=2.11.0';
import { reach, lever, STATES, classCode } from '../engine/reach.js?v=2.11.0';
import { project, horizonMoves } from '../engine/project.js?v=2.11.0';
import { pulse, leverLine } from '../engine/pulse.js?v=2.11.0';
import {
  getState, setYear, setSubjectLevel, clearPlan, restorePlan, markLooked,
  markIntroSeen, shareUrl, carryUrl, carrySummary, YEARS, currentYear, toggleActivity, setMode,
  snapshotPlan, sincePoint,
} from '../state.js?v=2.11.0';

const STATE_API = { setMode };

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
            <p class="caps rail-q">${icon('q_where')}${esc(data.copy.journey.q2)}</p>
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
            ${notMyRoadLink(DATA)}
            <div id="conflict">${conflictNotice(st.plan, data)}</div>
            ${data.subjects.groups.map((g) => groupBlock(g, subjects, st.plan, st.year)).join('')}
            ${junctureLine(data, st, phase, showUpper)}
            ${phase === 'lower' ? horizonPanel(data, st) : ''}
          </section>
          ${weekPanel(st, data)}
          <div id="tail">${tail(st, reaches, data)}</div>
        </div>
      </div>
    </div>`;

  bindGlossary(host);
  bindActions();
}

// --------------------------------------------------------------------------

function computeReaches(plan) {
  // Data order, always. v1 sorted by state and distance here and then failed
  // to undo it, so the list re-ranked itself on every tap. The order field
  // now rides through reach(), and the display never re-sorts.
  return DATA.pathways.destinations.map((d) => reach(plan, d, { ...CTX, plan }))
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
    return `<details class="grp-fold"><summary class="grp">${icon(`g_${group.id}`)}${esc(group.label)}</summary>
      ${group.note ? `<p class="grp-note">${esc(group.note)}</p>` : ''}${body}</details>`;
  }
  return `
    <h3 class="grp">${icon(`g_${group.id}`)}${esc(group.label)}</h3>
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
  // Count the plan through the list on screen, not the raw store. The plan
  // keeps levels for both phases, so after a year switch the raw count claims
  // subjects the visible list does not show, and the chip reads as remembering
  // a previous session. It was: the store is shared, the view is per year.
  const visible = new Set(visibleSubjects(data, st).map((s) => s.id));
  const counted = Object.entries(st.plan).filter(([id]) => visible.has(id));
  const n = counted.length;
  const g3 = counted.filter(([, l]) => l === 'G3').length;
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

  const since = sinceBlock(st, reaches, data);
  const said = saidBlock(st, data);

  const toPlay = n ? `
    <div class="panel tight funnel">
      <p class="caps">${esc(c.toPlayHint)}</p>
      <button class="btn accent" type="button" data-action="toplay">${esc(c.toPlay)} \u2192</button>
    </div>` : '';

  // Term 4 is when levels actually move at Sec 1 and Sec 2. A device local
  // nudge, computed from the clock, stored nowhere, sent nowhere.
  const m = new Date().getMonth() + 1;
  const nudge = (m >= 9 && m <= 11 && (st.year === 'sec1' || st.year === 'sec2') && n)
    ? `<p class="caution" style="margin-top:var(--s-3)">${esc(c.reviewNudge)}</p>` : '';

  return `
    ${since}
    ${said}
    ${toPlay}
    ${nudge}${icsBlock(st, data)}
    ${verdict ? `<div class="panel tight">
        <p class="caps">${esc(fill(L.chip, { n, g3 }))}</p>
        <p class="small" style="margin:0">${esc(verdict)}</p>
      </div>` : ''}

    ${askCard(st, reaches, data)}

    <p class="micro mute breadth">${esc(fill(c.breadth, { n: looked, total }))} ${esc(c.breadthNudge)}</p>

    <div class="btn-row" style="margin-top:var(--s-4)">
      <button class="btn ghost small" type="button" data-action="share">${esc(c.shareHead)}</button>
      ${n ? '<button class="btn ghost small" type="button" data-action="clear">Clear</button>' : ''}
    </div>

    <p class="micro mute foot-note">${esc(c.footer)} ${esc(fill(c.provisional, { n: data._provisionalCount }))}${esc(stale)}</p>`;
}

/**
 * What a student carries besides their subjects, and what it is worth.
 *
 * The subject list is only half of a week. A student training three evenings,
 * running a uniformed group and getting a younger brother fed has a real week
 * that no school system writes down anywhere, and an app that models only the
 * timetable is modelling the easy half.
 *
 * Four things, in the order a counsellor would take them: what the week is,
 * what it is building, where it can go, and how people carry it. The order
 * matters. The load line comes first because a student wants to be seen before
 * they want advice, and it is a description every time, never a verdict. There
 * is no line in this panel or in activities.json that says a week is too full
 * or asks whether someone is sure, because a fourteen year old carrying four
 * evenings is usually carrying them for a reason, and sometimes for a reason
 * nobody offered them a choice about.
 */
function weekPanel(st, data) {
  const A = data.activities || {};
  const all = A.activities || [];
  const C = A.copy || {};
  if (!all.length) return '';
  const mine = (st.activities || []).map((id) => all.find((a) => a.id === id)).filter(Boolean);
  const w = mine.reduce((n, a) => n + (a.week || 0), 0);
  const band = w <= 0 ? 'none' : w <= 2 ? 'light' : w <= 5 ? 'steady' : 'full';
  const sess = w === 1 ? C.sessions1 : fill(C.sessionsN, { n: w });
  const loadLine = { light: C.loadLight, steady: C.loadSteady, full: C.loadFull }[band];

  // Two of each, taken from what they actually carry. All of them is a wall of
  // advice; two is a conversation, and the sheet holds the rest per activity.
  const two = (key) => mine.map((a) => a[key]).filter(Boolean).slice(0, 2);
  // Two sentences, not one list. The tracks are things you end up holding and
  // the dispositions are ways you end up being, and running them together as
  // one comma list read as a jumble of unlike things.
  const uniq = (xs) => [...new Set(xs)].filter(Boolean);
  const listOf = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
  const held = uniq(mine.flatMap((a) => Object.keys(a.gain || {}).map((k) => TRACK_WORD[k])));
  const ways = uniq(mine.flatMap((a) => Object.keys(a.disp || {}).map((k) => DISP_WORD[k])));
  const builds = [
    held.length ? `${sentence(listOf(held))}.` : '',
    ways.length ? `${sentence(listOf(ways))}.` : '',
  ].filter(Boolean).join(' ');

  const block = (head, items) => (items.length ? `
    <div class="week-block">
      <p class="caps">${esc(head)}</p>
      ${items.map((t) => `<p class="small">${esc(t)}</p>`).join('')}
    </div>` : '');

  return `
    <div class="week" id="week">
      <p class="caps rail-q q-who">${icon('q_who')}${esc(data.copy.journey.q1)}</p>
      <div class="week-head">
        <h2 class="h-sm">${esc(C.head)}</h2>
        <button class="btn ghost small" type="button" data-action="acts">${esc(mine.length ? C.change : C.pick)}</button>
      </div>
      ${mine.length ? `
        <p class="chips actchips">${mine.map((a) => `<span class="chip act">${icon(a.ic)}${esc(a.label)}</span>`).join('')}</p>
        <p class="lede week-load">${esc(fill(loadLine, { n: sess }))}</p>
        ${builds ? `<div class="week-block"><p class="caps">${esc(C.buildHead)}</p>
          <p class="small">${esc(builds)}</p></div>` : ''}
        ${block(C.opensHead, two('opens'))}
        ${block(C.workHead, two('work'))}
        ${block(C.manageHead, two('manage'))}
        <p class="micro mute">${esc(C.note)} ${esc(C.yearNote)}</p>
      ` : `<p class="small mute">${esc(C.empty)}</p>`}
    </div>`;
}

const sentence = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const TRACK_WORD = { skills: 'things I can do', network: 'people who know me', portfolio: 'work I can show' };
const DISP_WORD = {
  curiosity: 'curiosity', persistence: 'persistence', flexibility: 'flexibility',
  optimism: 'optimism', risk: 'willingness to try things',
};

/** The picker. Grouped, plainly worded, and nothing in it is ranked. */
function openActs(data, trigger) {
  const A = data.activities || {};
  const all = A.activities || [];
  const C = A.copy || {};
  const paint = () => {
    const st = getState();
    const groups = [...new Set(all.map((a) => a.group))];
    const body = groups.map((g) => `
      <div class="pk-group">
        <p class="caps">${esc(g)}</p>
        ${all.filter((a) => a.group === g).map((a) => {
          const on = (st.activities || []).includes(a.id);
          return `
            <button class="actrow${on ? ' on' : ''}" type="button" data-action="acttog"
                    data-id="${esc(a.id)}" aria-pressed="${on}">
              <span class="actrow-name">${icon(a.ic)}${esc(a.label)}</span>
            </button>`;
        }).join('')}
      </div>`).join('');
    return `
      <h2 id="sheet-title">${esc(C.sheetHead)}</h2>
      <p class="small mute">${esc(C.hint)}</p>
      <div class="picker">${body}</div>
      <p class="micro mute" style="margin-top:var(--s-3)">${esc(C.sheetNote)}</p>`;
  };
  // Pinned, for the same reason as the subject picker: the list is longer than
  // any phone, so a button after it is a button nobody finds.
  const footFor = () => {
    const n = (getState().activities || []).length;
    return `<button class="btn accent" type="button" data-action="actdone">${esc(C.done)}${n ? ` (${n})` : ''}</button>`;
  };
  const sheet = openSheet(paint(), trigger, footFor());
  onSheetAction({
    acttog: (btn) => { toggleActivity(btn.dataset.id); sheet.innerHTML = paint(); setSheetFoot(footFor()); },
    actdone: () => { closeSheet(); renderNow(host, DATA, CTX); },
  });
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
      <p class="caps rail-q">${icon('q_how')}${esc(data.copy.journey.q3)}</p>
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

/**
 * Since you were last here: the student's own road, moving. Renders only when
 * a snapshot at least two weeks old differs from today, so it always has
 * something true to say and never nags.
 */
function sinceBlock(st, reaches, data) {
  const c = data.copy.chrome;
  const past = sincePoint(14);
  if (!past) return '';
  const byId = new Map(DATA.subjects.subjects.map((s) => [s.id, s]));
  const lines = [];
  Object.entries(st.plan).forEach(([id, lv]) => {
    const s = byId.get(id);
    const name = s ? (s.shortName || s.name) : id;
    const was = past.plan[id];
    if (!was) lines.push(fill(c.sinceAdded, { subject: name }));
    else if (was !== lv) lines.push(fill(c.sinceMoved, { subject: name, from: was, to: lv }));
  });
  const openNow = reaches.filter((r) => r.state === 'open').length;
  const openLine = past.open != null && past.open !== openNow
    ? fill(c.sinceOpen, { then: past.open, now: openNow }) : '';
  if (!lines.length && !openLine) return '';
  const when = new Date(past.t).toLocaleDateString('en-SG', { day: 'numeric', month: 'short' });
  return `
    <div class="since">
      <p class="caps">${esc(c.sinceHead)} <span class="mute">(${esc(when)})</span></p>
      ${lines.slice(0, 3).map((l) => `<p class="small">${esc(l)}</p>`).join('')}
      ${openLine ? `<p class="small"><strong>${esc(openLine)}</strong></p>` : ''}
      <p class="micro mute">${esc(c.sinceNote)}</p>
    </div>`;
}

/** What you committed to in Act, back in view where the week is planned. */
function saidBlock(st, data) {
  const c = data.copy.chrome;
  const said = (st.actions || []).filter(Boolean);
  if (!said.length) return '';
  return `
    <div class="panel tight said">
      <p class="caps">${esc(c.saidHead)}</p>
      ${said.slice(0, 2).map((a) => `<p class="small">${esc(a)}</p>`).join('')}
      <button class="btn ghost small" type="button" data-action="toact">${esc(c.saidGo)}</button>
    </div>`;
}

/**
 * The review week, into the calendar the student actually checks. A plain
 * .ics built here and downloaded; term four is when Sec 1 and Sec 2 levels
 * actually move, so only those years get the button.
 */
function icsBlock(st, data) {
  if (st.year !== 'sec1' && st.year !== 'sec2') return '';
  if (!Object.keys(st.plan).length) return '';
  const c = data.copy.chrome;
  return `
    <p class="micro mute" style="margin-top:var(--s-3)">
      <button class="gloss" type="button" data-action="ics">${esc(c.icsBtn)}</button>
      ${esc(c.icsHint)}</p>`;
}

function downloadIcs(data) {
  const c = data.copy.chrome;
  const now = new Date();
  // Mid October: the subject review conversations are live, and asking is
  // still early enough to matter. Next October if this year's has passed.
  const year = (now.getMonth() + 1 > 10 || (now.getMonth() + 1 === 10 && now.getDate() > 20))
    ? now.getFullYear() + 1 : now.getFullYear();
  const d = `${year}1015`;
  const dEnd = `${year}1016`;
  const stamp = now.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Paths//pathways2//EN',
    'BEGIN:VEVENT',
    `UID:paths-review-${year}@local`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${d}`,
    `DTEND;VALUE=DATE:${dEnd}`,
    `SUMMARY:${c.icsTitle}`,
    `DESCRIPTION:${c.icsBody} ${location.origin}${location.pathname}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  a.download = 'paths-review-week.ics';
  a.click();
  URL.revokeObjectURL(a.href);
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
    toplay: () => { const { setMode } = STATE_API; setMode('journey'); },
    toact: () => setMode('aim'),
    ics: () => downloadIcs(DATA),
    acts: (btn) => openActs(DATA, btn),
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
  snapshotPlan(reaches.filter((r) => r.state === 'open').length);

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

/**
 * TAKE THE WHOLE THING WITH ME.
 *
 * The link above this one carries the subject plan, which is what a student sends
 * a parent. This one carries the term: the plan, the want, the commitments ticked
 * in Act, the activities, and which kind of school. It exists because a lesson run
 * in a computer lab ends with thirty five students logging off machines that will
 * be somebody else's on Thursday, and the commitments are the entire point of the
 * last screen.
 *
 * The sentence beside it counts what the link is holding, out loud, because a
 * student asked to trust a URL with their term should be able to see what is in it.
 * And it says what is NOT in it, which is the reflection they wrote at thirty eight
 * and the activities that might be looking after somebody at home. Those stay on
 * the device. A link a student might paste into a group chat is not the place.
 */
function carryBlock() {
  const n = carrySummary();
  if (!n.subjects && !n.todo) return '';
  const url = carryUrl();
  const holds = [
    n.subjects ? `${n.subjects} subject${n.subjects === 1 ? '' : 's'}` : '',
    n.todo ? `${n.todo} thing${n.todo === 1 ? '' : 's'} I said I would do` : '',
    n.want ? 'the want I named' : '',
    n.activities ? 'my week' : '',
    n.school ? 'which school I am in' : '',
  ].filter(Boolean);
  return `
    <div class="carryblock">
      <p class="caps">${icon('q_how')}Take the whole term with me</p>
      <p class="small mute">This link holds ${esc(holds.join(', '))}. Mail it to myself, or keep it in my notes, and a different computer picks up where I left off. Nothing is stored anywhere: it is all in the link, which is why I can read it.</p>
      <input class="sharebox" type="text" readonly value="${esc(url)}" aria-label="A link holding my whole term">
      <button class="btn" type="button" data-action="copylink" data-url="${esc(url)}">Copy the long link</button>
      <p class="micro faint">What it does not hold: anything I wrote at thirty eight, and it opens on a device that already has commitments by adding to them rather than replacing them.</p>
    </div>`;
}

async function onShare() {
  const url = shareUrl();
  const c = DATA.copy.chrome;
  const st = getState();
  // The class code rides along with the share sheet because it answers the
  // same question, how does what I have travel, for a room rather than a
  // second device. It is computed here and never stored or sent.
  const want = (DATA.journey.wants || []).find((w) => w.id === st.aim);
  const code = classCode(st.plan, want && want.riasec, computeReaches(st.plan));
  openSheet(`
    <h2 id="sheet-title">${esc(c.shareHead)}</h2>
    <p class="small mute">${esc(c.shareHint)}</p>
    <input class="sharebox" type="text" readonly value="${esc(url)}" aria-label="A link to my subjects">
    <button class="btn" type="button" data-action="copylink" data-url="${esc(url)}">${esc(c.askCopy)}</button>
    ${carryBlock()}
    <div class="classcode">
      <p class="caps">${esc(c.codeHead)}</p>
      <p class="code-big">${esc(code)}</p>
      <p class="micro mute">${esc(c.codeHint)}</p>
    </div>`);
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

/**
 * Which parts of working Singapore this subject actually turns up in.
 *
 * The oldest unanswered question in a classroom is why am I learning this, and
 * the subject sheet answered every other question about a subject except that
 * one. It reads from the same sector file the work page uses, so a subject can
 * never point at a sector that has been renamed or removed.
 */
function workBlock(s) {
  const list = sectorsForSubject(DATA, s.id);
  if (!list.length) return '';
  return `
    <p class="caps" style="margin-top:var(--s-4)">Where this turns up in working life</p>
    <ul class="chipsel" style="margin-top:var(--s-2)">
      ${list.map((x) => `<li><button class="chip-btn" type="button" data-action="sector" data-id="${x.id}" aria-haspopup="dialog">${esc(x.label)}</button></li>`).join('')}
    </ul>
    <p class="micro faint">Every one of those takes people in at more than one level.</p>`;
}

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
    <p class="small mute">I will like it if ${esc(s.likeIf)}.</p>
    <ul class="chips">${s.showsUp.map((x) => `<li>${decorate(x)}</li>`).join('')}</ul>
    ${s.note ? `<p class="micro mute">${decorate(s.note)}</p>` : ''}
    ${s.caution ? `<p class="caution">${esc(s.caution)}</p>` : ''}
    ${workBlock(s)}
    <p class="micro mute">${esc(DATA.copy.chrome.levelsMove)}</p>
    ${s.status === 'provisional' ? statusChip('provisional') : ''}`, trigger);

  onSheetAction({
    sector: (b) => openSectorSheet(DATA, b.dataset.id, b),
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
      <ul>${r.moves.map((m) => `<li>${decorate(m.short)}. <span class="who">Ask my ${esc(m.who.split(',')[0])}, ${esc(m.when)}.</span></li>`).join('')}</ul>
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
    ${costLineFor(DATA, r.id)}
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
