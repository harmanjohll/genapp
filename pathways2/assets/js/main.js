// Entry point. Loads data, decides landing or app, renders the active mode.
//
// The navigation is the loop, not a set of tabs: Plan sets a combination,
// Play lives it forward, Act turns the ending into things to do this term.
// The landing asks one question before any of it, once.

import { loadAll } from './data-loader.js';
import {
  getState, subscribe, setMode, setYear, setLiveRun, setSound, reconcile,
  markVersionSeen, snapshotPlan, MODES, YEARS, currentYear,
} from './state.js';
import { initGlossary, openFullList } from './components/glossary.js';
import { mountRibbon, updateRibbon } from './components/timeline-ribbon.js';
import { onAction, esc } from './components/dom.js';
import { icon } from './components/icons.js';
import { openSheet, onSheetAction, close as closeSheet } from './components/sheet.js';
import { reach, runInvariantSweep } from './engine/reach.js';
import { projectionSweep } from './engine/project.js';
import { runCopyLint } from './engine/copy-lint.js';
import { runJourneySweep } from './engine/journey4.js';
import { possibilitySweep } from './engine/possible.js';
import { ecgSweep } from './engine/ecg-lint.js';
import { domLint } from './engine/dom-lint.js';
import { renderLanding } from './modes/landing.js';
import { renderNow } from './modes/mode-now.js';
import { renderJourney, resetJourney } from './modes/mode-journey.js';
import { renderAim } from './modes/mode-aim.js';
import { renderTeacher } from './modes/mode-teacher.js';
import { renderTable, resetTable, tableSweep } from './modes/mode-table.js';
import { renderParent } from './modes/mode-parent.js';

const app = document.getElementById('app');
const head = document.getElementById('site-head');

let data = null;
let ctx = null;
let onLanding = false;
const params = new URLSearchParams(location.search);

// Modes a person links to on purpose. Plan, Play and Act are written into the
// address bar by the app itself, so they never imply an intent to skip the door.
const ENTRY_MODES = ['teacher', 'parent', 'table'];

let extraMode = ENTRY_MODES.includes(params.get('mode')) ? params.get('mode') : null;
if (params.get('board') === '1') document.body.dataset.board = 'true';

init();

async function init() {
  try {
    data = await loadAll();
  } catch (e) {
    console.error(e);
    app.innerHTML = `
      <div class="wrap"><div class="section"><div class="notice">
        <strong>This did not load.</strong>
        <p style="margin:8px 0 0">Check the connection and refresh the page. Nothing you did caused this.</p>
      </div></div></div>`;
    return;
  }

  initGlossary(data.glossary);
  reconcile(data);

  ctx = {
    subjects: data.subjects.subjects,
    destinations: data.pathways.destinations,
    routesById: Object.fromEntries(data.progressions.routes.map((r) => [r.id, r])),
    pathwaysMeta: data.pathways._meta,
    yearId: getState().year,
  };

  mountRibbon(document.body, data.lifelong);
  mountAudience();

  // Photograph today's plan with its open count, so a later visit can say
  // what moved. One line, and it is the whole Year loop's raw material.
  const st0 = getState();
  if (Object.keys(st0.plan).length) {
    const open = ctx.destinations.filter((d) => reach(st0.plan, d, { ...ctx, plan: st0.plan }).state === 'open').length;
    snapshotPlan(open);
  }

  // The landing is the front door, and every fresh load arrives at it.
  //
  // It used to be shown once per device and never again, which meant a refresh
  // dropped you wherever you happened to have been. Worse, syncUrl writes the
  // current mode into the address bar as you move, so reloading after a few
  // clicks deep linked you into Plan and the front door became unreachable
  // without clearing storage.
  //
  // A deliberate deep link still goes straight in: a shared plan, or one of the
  // entry modes that exist precisely to be linked to. The three main modes do
  // not count, because that parameter is written by the app rather than chosen
  // by a person. A returning student is not re-quizzed: the landing renders in
  // its revealed state, with the answer already on it and the doors below.
  const deepLink = params.has('p') || ENTRY_MODES.includes(params.get('mode'));
  onLanding = !deepLink;

  renderHead();
  paint();

  subscribe((_st, evt) => {
    ctx.yearId = getState().year;
    if (evt && evt.kind === 'plan') return;
    updateRibbon();
    renderHead();
    paint();
  });

  showVersionNote();

  if (params.get('dev') === '1') {
    runInvariantSweep(ctx);
    projectionSweep(ctx);
    runJourneySweep(data);
    possibilitySweep(data);
    tableSweep(data);
    ecgSweep(data);
    domLint();
    runCopyLint(data);
  }
}

export function leaveLanding(mode) {
  onLanding = false;
  if (mode) setMode(mode); else { renderHead(); paint(); }
}

function showVersionNote() {
  const v = data.version;
  if (!v || !v.version) return;
  const seen = getState().seenVersion;
  if (seen === v.version) return;
  if (!seen) { markVersionSeen(v.version); return; }
  const rel = (v.releases || []).find((r) => r.version === v.version);
  markVersionSeen(v.version);
  if (!rel || !(rel.changes || []).length) return;
  openSheet(`
    <h2 id="sheet-title">${esc(rel.head || 'What is new')}</h2>
    <p class="small mute">Version ${esc(rel.version)}</p>
    <ul class="small" style="margin-top:var(--s-3);padding-left:1.1em">
      ${rel.changes.map((c) => `<li style="margin-bottom:var(--s-2)">${esc(c)}</li>`).join('')}
    </ul>
    <div class="btn-row" style="margin-top:var(--s-4)">
      <button class="btn accent" type="button" data-action="vok">Got it</button>
    </div>`);
  onSheetAction({ vok: () => closeSheet() });
}

function renderHead() {
  const st = getState();
  const y = currentYear();
  head.hidden = onLanding;
  if (onLanding) return;
  head.innerHTML = `
    <div class="wrap">
      <button class="brand" type="button" data-action="home" aria-label="Paths, back to the start">
        ${icon('brand')}<span>${esc(data.copy.chrome.brand)}</span>
      </button>
      <label class="yearsel">
        <span class="sr-only">Which year are you in</span>
        <select data-action-change="year">
          ${YEARS.map((v) => `<option value="${v.id}"${v.id === y.id ? ' selected' : ''}>${esc(v.label)}</option>`).join('')}
        </select>
      </label>
      <nav class="modebar" aria-label="Plan, Play, Act">
        ${Object.values(MODES).map((m, i) => `
          ${i ? '<span class="mode-arrow" aria-hidden="true">→</span>' : ''}
          <button type="button" data-action="mode" data-mode="${m.id}"
                  aria-current="${!extraMode && st.mode === m.id}">${esc(m.label)}</button>`).join('')}
      </nav>
      <div class="head-tools">
        <button type="button" class="glossbtn" data-action="glossary"
                aria-label="${esc(data.copy.chrome.glossaryAria)}">${icon('glossary')}<span>${esc(data.copy.chrome.glossaryBtn)}</span></button>
        <button type="button" class="toolbtn" data-action="sound" aria-pressed="${st.soundOn}"
                aria-label="${esc(st.soundOn ? data.copy.chrome.soundOn : data.copy.chrome.soundOff)}"
                title="${esc(st.soundOn ? data.copy.chrome.soundOn : data.copy.chrome.soundOff)}">${icon(st.soundOn ? 'sound_on' : 'sound_off')}</button>
        <button type="button" class="toolbtn" data-action="theme" aria-label="Switch light or dark" title="Light or dark">${icon('theme')}</button>
      </div>
    </div>`;

  onAction(head, {
    home: () => { onLanding = true; renderHead(); paint(); },
    mode: (btn) => {
      extraMode = null;
      resetTable();
      if (btn.dataset.mode !== 'journey') resetJourney();
      setMode(btn.dataset.mode);
    },
    glossary: () => openFullList(),
    sound: () => { setSound(!getState().soundOn); renderHead(); },
    theme: () => {
      const root = document.documentElement;
      const dark = root.dataset.theme === 'dark'
        || (root.dataset.theme !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      root.dataset.theme = dark ? 'light' : 'dark';
      try { localStorage.setItem('pathways2.theme', root.dataset.theme); } catch { /* fine */ }
    },
  });

  const sel = head.querySelector('select');
  if (sel) sel.addEventListener('change', (e) => setYear(e.target.value));
}

function paint() {
  const st = getState();
  document.getElementById('site-foot').style.display = onLanding ? 'none' : '';
  try {
    if (onLanding) { renderLanding(app, data, ctx, leaveLanding); return; }
    if (extraMode === 'table') { renderTable(app, data, ctx, paint); return; }
    if (extraMode === 'teacher') { renderTeacher(app, data, ctx, paint); return; }
    if (extraMode === 'parent') { renderParent(app, data, ctx); return; }
    if (st.mode !== 'journey') document.body.dataset.era = 'school';
    switch (st.mode) {
      case 'journey': renderJourney(app, data, ctx, paint); break;
      case 'aim':     renderAim(app, data, ctx, paint); break;
      default:        renderNow(app, data, ctx); break;
    }
  } catch (e) {
    console.error('paint failed', e);
    app.innerHTML = `
      <div class="wrap"><div class="section" style="margin-top:var(--s-6)"><div class="notice">
        <strong>This screen hit a snag.</strong>
        <p style="margin:8px 0 0">Your subjects are safe. Start this screen fresh.</p>
        <div class="btn-row" style="margin-top:var(--s-3)">
          <button class="btn accent" type="button" data-action="recover">Start fresh</button>
        </div>
      </div></div></div>`;
    onAction(app, { recover: () => { setLiveRun(null); resetJourney(); paint(); } });
  }
}

// The audience strip: three quiet words above the header, because a parent
// handed their child's phone decides in the first screenful whether this page
// is for them.
function mountAudience() {
  const f = data.copy.footerDoors;
  if (!f) return;
  const who = extraMode || 'student';
  const roles = [
    { id: 'student', href: './', label: f.roleStudent },
    { id: 'parent', href: './?mode=parent', label: f.roleParent },
    { id: 'teacher', href: './?mode=teacher', label: f.roleTeacher },
  ];
  const div = document.createElement('div');
  div.className = 'audstrip';
  div.innerHTML = `<div class="wrap">
    <label class="iam">
      <span>${esc(f.iAm)}</span>
      <select aria-label="${esc(f.head)}">
        ${roles.map((r) => `<option value="${r.href}"${r.id === who ? ' selected' : ''}>${esc(r.label)}</option>`).join('')}
      </select>
    </label></div>`;
  const sel = div.querySelector('select');
  sel.addEventListener('change', () => { location.href = sel.value; });
  document.body.insertBefore(div, head);
}

// Manual theme choice survives reloads.
try {
  const t = localStorage.getItem('pathways2.theme');
  if (t === 'dark' || t === 'light') document.documentElement.dataset.theme = t;
} catch { /* fine */ }
