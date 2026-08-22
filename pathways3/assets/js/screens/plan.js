// Plan: subjects first, one consequence strip, the map as the answer.
//
// The v2 audit measured this screen at roughly fourteen phone-screens of
// scroll, with the consequences rendered above the controls and half of Act
// stacked underneath. v3's Plan keeps exactly four things: the subjects, the
// live strip that answers every tap, the map, and one next step. Everything
// else lives where it belongs (commitments in Act, the week with the
// counsellor, money inside the destination sheets).
//
// The hot path preserves focus: a level tap patches the tapped row, the
// strip and the map in place. It never repaints the grid a student's finger
// is standing on.

import {
  getState, setSubjectLevel, setYear, YEARS, currentYear, snapshotPlan,
  carryUrl, carrySummary,
} from '../state.js?v=3.0.0';
import { reach, lever } from '../engine/reach.js?v=3.0.0';
import { pulse } from '../engine/pulse.js?v=3.0.0';
import { horizonMoves } from '../engine/project.js?v=3.0.0';
import { railMap, mapPips, openCount } from '../ui/map.js?v=3.0.0';
import { destSheetHtml } from '../ui/destsheet.js?v=3.0.0';
import { esc, onAction } from '../ui/dom.js?v=3.0.0';
import { decorate } from '../ui/glossary.js?v=3.0.0';

let lastLine = '';

function reachesNow(api) {
  const c = api.ctx();
  return c.destinations.map((d) => reach(c.plan, d, c));
}

function lowerYear() {
  const y = getState().year;
  return y === 'sec1' || y === 'sec2';
}

function visibleSubjects(api) {
  const wantPhase = lowerYear() ? ['lower', 'both'] : ['upper', 'both'];
  const offer = getState().offer;
  return api.ctx().subjects.filter((s) =>
    wantPhase.includes(s.phase || 'both') && (!offer || s.compulsory || offer.includes(s.id)));
}

export default {
  id: 'plan',
  title: 'Plan',
  era: 'school',

  render(root, api) {
    const st = getState();
    const rows = reachesNow(api);
    const open = openCount(rows);
    const subjects = visibleSubjects(api);
    const groups = api.data.subjects.groups || [];
    const picked = Object.keys(st.plan).length;
    const lv = lever(rows);
    const raises = horizonMoves(st.plan, api.ctx(), st.year);

    const byGroup = new Map(groups.map((g) => [g.id, []]));
    subjects.forEach((s) => { (byGroup.get(s.group) || byGroup.set(s.group, []).get(s.group)).push(s); });

    root.innerHTML = `
    <div class="wrap-narrow">
      <header class="hero" style="padding-bottom:16px">
        <h1>${esc(api.copy('chrome.planHead', 'Plan.'))}</h1>
        <p class="lede">${picked
          ? esc(api.copy('chrome.planLede', 'Tap a level, watch the map answer. Nothing you pick closes a door for good.'))
          : esc(api.copy('chrome.planFirst', 'Tap one subject to start. Watch the number.'))}</p>
      </header>

      ${st.yearSet ? '' : `
      <div class="card" style="margin-bottom:16px">
        <p class="caps">${esc(api.copy('chrome.yearHead', 'Which year are you in?'))}</p>
        <p class="small">${esc(api.copy('chrome.yearWhy', 'It decides which subjects you see below.'))}</p>
        <div class="yeargrid" style="margin-top:8px">
          ${YEARS.map((y) => `<button type="button" class="btn ghost press" data-action="pl-year" data-id="${y.id}">${esc(y.label)}</button>`).join('')}
        </div>
      </div>`}

      <div class="pulsestrip" id="pl-strip" role="status" aria-live="off">
        ${stripHtml(rows, lastLine || (open === rows.length
          ? api.copy('pulse.allOpen', 'All eight are reachable from here.')
          : api.copy('chrome.stripStart', 'Every one keeps a road in. Tap a level; this line answers.')))}
      </div>

      <section aria-label="Subjects">
        ${groups.map((g) => {
          const list = byGroup.get(g.id) || [];
          if (!list.length) return '';
          const leveled = list.filter((s) => (s.levels || []).length);
          const flat = list.filter((s) => !(s.levels || []).length);
          if (!leveled.length && flat.length) {
            return `<p class="small" style="margin-top:16px">${esc(api.copy('chrome.alsoTimetable', 'Also on your timetable, no level to pick:'))} ${flat.map((s) => esc(s.name)).join(' · ')}.</p>`;
          }
          return `
          <div class="subjgroup">
            <h3 class="caps">${esc(g.label)}</h3>
            <div class="subjrows">
              ${leveled.map((s) => subjRow(s, st.plan)).join('')}
            </div>
            ${flat.length ? `<p class="small" style="margin-top:8px">${esc(api.copy('chrome.alsoTimetable', 'Also on your timetable, no level to pick:'))} ${flat.map((s) => esc(s.name)).join(' · ')}.</p>` : ''}
          </div>`;
        }).join('')}
        <p class="small" style="margin-top:12px">${esc(api.copy('chrome.availability', 'Schools offer different subsets of this list. Your school decides what runs; this decides nothing.'))}</p>
      </section>

      ${lv ? `
      <div class="leverline section" style="border:0;padding-top:24px">
        <p class="caps">${esc(api.copy('chrome.leverHead', 'The one move that opens most'))}</p>
        <p style="margin:4px 0 0"><strong>${esc(lv.label)}</strong> ${esc(api.copy('chrome.leverOpens', 'That reaches:'))} ${esc(lv.opens.join(' · '))}.</p>
        ${lv.when ? `<p class="small" style="margin:4px 0 0">${esc(lv.when)}${lv.who ? ` · ${esc(lv.who)}` : ''}</p>` : ''}
      </div>` : ''}

      ${raises && raises.length ? `
      <p class="small" style="margin-top:12px">${esc(api.copy('chrome.raiseHead', 'Levels you already hold that can move this year:'))}
        ${raises.slice(0, 2).map((r) => `${esc(r.name)} ${esc(r.from)} to ${esc(r.to)}${r.opens.length ? ` (opens ${esc(r.opens.join(' · '))})` : ''}`).join(' · ')}</p>` : ''}

      <section class="section" aria-label="Where this reaches" id="pl-map">
        <h2>${esc(api.copy('chrome.mapHead', 'Where this reaches'))}</h2>
        <p class="small">${esc(api.copy('chrome.mapLede', 'Tap any station for what it wants, what it costs, and the ways in.'))}</p>
        <div id="pl-rail">${railMap(rows, { tappable: true })}</div>
      </section>

      <section class="section" aria-label="Next">
        <div class="nextcard">
          <p><strong>${picked
            ? esc(api.copy('chrome.toPlay', 'My combination becomes a life, in the game.'))
            : esc(api.copy('chrome.toPlayEmpty', 'You can play a life even before the plan is set.'))}</strong></p>
          <button type="button" class="btn press" data-action="go" data-s="play">${esc(api.copy('chrome.toPlayBtn', 'Play these subjects forward'))}</button>
        </div>
        <div class="btnrow" style="margin-top:16px">
          <button type="button" class="btn ghost small press" data-action="pl-carry">${esc(api.copy('chrome.carry', 'Carry this to another device'))}</button>
          <span class="small" id="pl-carry-note">${carryNote()}</span>
        </div>
      </section>
    </div>`;

    snapshotPlan(open);
    bind(root, api);
  },
};

function subjRow(s, plan) {
  const held = plan[s.id] || null;
  return `
  <div class="subjrow" data-sid="${esc(s.id)}">
    <span class="subjname">${esc(s.name)}
      ${s.compulsory ? `<span class="subjnote">everyone takes this</span>` : ''}
      ${s.status === 'provisional' && !s.compulsory ? `<span class="subjnote">selected schools</span>` : ''}
    </span>
    <span class="lvlrow" role="group" aria-label="${esc(s.name)} level">
      ${(s.levels || []).map((l) => `
        <button type="button" class="lvl press settle" data-action="pl-lvl" data-sid="${esc(s.id)}"
          data-level="${l}" aria-pressed="${held === l}"
          aria-label="${esc(s.name)} at ${l}${held === l ? ', picked. Tap to clear.' : ''}">${l}</button>`).join('')}
    </span>
  </div>`;
}

function stripHtml(rows, line) {
  const open = openCount(rows);
  return `
    <span class="pulse-open">${open}</span>
    <span class="pulse-words"><strong>of ${rows.length} open now</strong>
      <span class="pulse-change">${esc(line)}</span></span>
    ${mapPips(rows)}`;
}

function carryNote() {
  const c = carrySummary();
  const bits = [];
  if (c.subjects) bits.push(`${c.subjects} subject${c.subjects === 1 ? '' : 's'}`);
  if (c.todo) bits.push(`${c.todo} commitment${c.todo === 1 ? '' : 's'}`);
  if (c.want) bits.push('your want');
  return bits.length ? `The link carries ${bits.join(', ')}. Nothing else.` : 'The link carries your plan and nothing else.';
}

function bind(root, api) {
  onAction(root, {
    'pl-year': (btn) => { setYear(btn.dataset.id); api.refresh(); },

    'pl-lvl': (btn) => {
      const sid = btn.dataset.sid;
      const level = btn.dataset.level;
      const st = getState();
      const prevRows = reachesNow(api);
      const wasHeld = st.plan[sid] === level;
      const subj = api.ctx().subjects.find((s) => s.id === sid);
      setSubjectLevel(sid, wasHeld ? null : level, subj && subj.name);

      // Patch the row in place: focus stays under the finger.
      const row = root.querySelector(`.subjrow[data-sid="${CSS.escape(sid)}"]`);
      if (row) {
        row.querySelectorAll('.lvl').forEach((b) => {
          b.setAttribute('aria-pressed', String(!wasHeld && b.dataset.level === level));
        });
      }

      const nextRows = reachesNow(api);
      const p = pulse(prevRows, nextRows, { action: wasHeld ? 'clear' : 'set' }, api.data.copy);
      lastLine = p.line || '';
      const strip = root.querySelector('#pl-strip');
      if (strip) {
        strip.innerHTML = stripHtml(nextRows, lastLine);
        strip.setAttribute('aria-live', 'off');
      }
      api.announce(`${p.openNow} of ${nextRows.length} open. ${lastLine}`);
      const rail = root.querySelector('#pl-rail');
      if (rail) rail.innerHTML = railMap(nextRows, { tappable: true });
      if (p.justOpened.length) api.cue('door');
      snapshotPlan(p.openNow);
    },

    dest: (btn) => {
      const row = reachesNow(api).find((r) => r.id === btn.dataset.id);
      if (row) api.sheet(destSheetHtml(row, api.data), btn);
    },

    'pl-carry': async (btn) => {
      const url = carryUrl();
      const note = root.querySelector('#pl-carry-note');
      try {
        if (navigator.share) { await navigator.share({ title: 'Paths', url }); return; }
        await navigator.clipboard.writeText(url);
        if (note) note.textContent = api.copy('chrome.carryDone', 'Copied. Paste it anywhere that reaches your other device.');
      } catch {
        if (note) note.textContent = url;
      }
    },
  });
}
