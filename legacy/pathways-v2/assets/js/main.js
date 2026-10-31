// Entry point. Loads data, decides landing or app, renders the active mode.
//
// The navigation is the loop, not a set of tabs: Plan sets a combination,
// Play lives it forward, Act turns the ending into things to do this term.
// The landing asks one question before any of it, once.

import { loadAll, ensureData, topUp, MODE_DATA, BUILD } from './data-loader.js?v=2.15.0';
import {
  getState, subscribe, setMode, setYear, setLiveRun, setSound, reconcile,
  markVersionSeen, snapshotPlan, MODES, YEARS, currentYear, isGuest,
} from './state.js?v=2.15.0';
import { initGlossary, openFullList } from './components/glossary.js?v=2.15.0';
import { mountRibbon, updateRibbon } from './components/timeline-ribbon.js?v=2.15.0';
import { onAction, esc } from './components/dom.js?v=2.15.0';
import { icon } from './components/icons.js?v=2.15.0';
import { openSheet, onSheetAction, close as closeSheet } from './components/sheet.js?v=2.15.0';
import { reach } from './engine/reach.js?v=2.15.0';
import { renderLanding } from './modes/landing.js?v=2.15.0';

/**
 * ONE MODE AT A TIME, WHICH IS HOW STUDENTS USE IT.
 *
 * Eleven mode modules were imported at the top of this file, so a student opening
 * Plan downloaded the table game, the class plan, the parent page, the counsellor
 * page, the work page, the money page, the evidence page, the schools page and the
 * whole journey engine before seeing a single subject. Measured on a throttled
 * school access point: 988 KB, 58 requests, first contentful paint at 7.3 seconds,
 * and 23 seconds before the page settled. Thirty five devices share one access
 * point in a computer lab, which is the situation this app's own loader has a
 * paragraph worrying about.
 *
 * Each mode is now fetched when it is opened and remembered after. The landing
 * stays eager because it is the first thing anybody sees.
 *
 * WHAT MAKES THIS SAFE. paint() has a synchronous fast path for a mode already in
 * hand, so the common case, tapping between modes a student has used, has no
 * awaiting and no flicker. A mode not yet in hand gets one short waiting line and
 * a repaint, and a fetch that fails says so and offers the modes that did load
 * rather than leaving a blank screen.
 */
const MODE_MODULE = {
  now: 'mode-now', journey: 'mode-journey', aim: 'mode-aim',
  table: 'mode-table', teacher: 'mode-teacher', parent: 'mode-parent',
  counsellor: 'mode-counsellor', work: 'mode-work', money: 'mode-money',
  evidence: 'mode-evidence', schools: 'mode-schools',
};
const held = new Map();
let loadingId = null;

async function bring(id) {
  const file = MODE_MODULE[id];
  if (!file) return null;
  // The module and the data it cannot render without, in parallel, because a
  // screen that arrives without its deck is not a screen that has arrived.
  const [mod] = await Promise.all([
    held.get(id) || import(`./modes/${file}.js?v=${encodeURIComponent(BUILD)}`),
    ensureData(MODE_DATA[id] || []),
  ]);
  held.set(id, mod);
  return mod;
}

/** Ready means the module is in hand AND so is every file it needs. */
function ready(id) {
  if (!held.has(id)) return false;
  return (MODE_DATA[id] || []).every((n) => data[n] && Object.keys(data[n]).length);
}

/** Whatever the journey module holds, if it is in hand. Reset is a no op otherwise. */
const resetJourney = () => { const m = held.get('journey'); if (m && m.resetJourney) m.resetJourney(); };
const resetTable = () => { const m = held.get('table'); if (m && m.resetTable) m.resetTable(); };

const app = document.getElementById('app');
const head = document.getElementById('site-head');

let data = null;
let ctx = null;
let onLanding = false;
const params = new URLSearchParams(location.search);

// Modes a person links to on purpose. Plan, Play and Act are written into the
// address bar by the app itself, so they never imply an intent to skip the door.
const ENTRY_MODES = ['teacher', 'parent', 'table', 'counsellor', 'work', 'money', 'evidence', 'schools'];

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

  stampBuild();
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

  // The guest strip. A guest session must say it is one, at the top of every
  // screen, because its whole promise is about what it is NOT doing to the
  // phone it is running on.
  if (isGuest()) {
    const c = (data.copy && data.copy.chrome) || {};
    document.getElementById('app').insertAdjacentHTML('beforebegin',
      `<div class="guestband" role="status">${esc(c.guestBand || 'Playing as a guest. Nothing is saved on this phone.')}</div>`);
  }

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

  // Everything else, now that the first screen is on the glass. The Plan screen
  // uses three deferred files for one row of chips, a fee line and one sentence,
  // so a single repaint when they land is the difference between those appearing a
  // second late and never appearing at all.
  topUp(() => { if (!onLanding) paint(); });

  // The dev sweeps need every file, so they wait for the top up rather than racing
  // it and reporting an empty deck as a starving one.
  if (params.get('dev') === '1') topUp().then(runSweeps);
}

/**
 * THE SWEEPS WERE ON EVERY STUDENT'S CRITICAL PATH.
 *
 * Twelve checks, none of which a student runs, all of which shipped inside the
 * first payload because they were imported at the top of this file. Measured on a
 * throttled school access point the whole app was 988 KB across 58 requests with
 * first contentful paint at 7.3 seconds, and roughly sixty of those kilobytes were
 * lint engines nobody outside a browser console has ever asked for.
 *
 * They are dynamically imported now, so ?dev=1 pays for them and a fourteen year
 * old on a shared access point does not. Everything they check still runs on every
 * build through tools/verify.mjs, which reads the same modules from disk.
 */
async function runSweeps() {
  const load = (f) => import(`./engine/${f}.js?v=${encodeURIComponent(BUILD)}`);
  const [reachM, project, journey4, possible, ecg, work, evidence, schools, dom, copy, table] = await Promise.all([
    load('reach'), load('project'), load('journey4'), load('possible'), load('ecg-lint'),
    load('work-lint'), load('evidence-lint'), load('schools-lint'), load('dom-lint'), load('copy-lint'),
    import(`./modes/mode-table.js?v=${encodeURIComponent(BUILD)}`),
  ]);
  reachM.runInvariantSweep(ctx);
  project.projectionSweep(ctx);
  journey4.runJourneySweep(data);
  possible.possibilitySweep(data);
  table.tableSweep(data);
  ecg.ecgSweep(data);
  work.workSweep(data);
  work.moneySweep(data);
  evidence.evidenceSweep(data);
  schools.schoolsSweep(data);
  dom.domLint();
  copy.runCopyLint(data);
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

// What each mode cannot work without. The global REQUIRED list in the loader
// covers the files every screen needs; these are the per mode ones, kept here
// because a missing deck should cost you Play and not the whole site.
// What a mode cannot open without. `moves` belongs here: a chapter with no
// moves in it renders a year with nothing to choose, which strands a student
// on a screen that looks fine. Optional files (possibilities, stories) are
// deliberately absent, because losing them costs a fold, not the lesson.
const MODE_NEEDS = {
  now: [],
  journey: ['journey', 'chances', 'moves'],
  aim: ['futures'],
  table: ['journey', 'chances', 'moves'],
  teacher: [],
  parent: ['parent'],
  counsellor: [],
};

function missingFor(mode) {
  const gone = new Set(data._missing || []);
  return (MODE_NEEDS[mode] || []).filter((k) => gone.has(k) || !data[k]);
}

function paint() {
  const st = getState();
  document.getElementById('site-foot').style.display = onLanding ? 'none' : '';
  try {
    if (onLanding) { document.body.dataset.aud = 'student'; renderLanding(app, data, ctx, leaveLanding); return; }
    const id = extraMode || st.mode;
    const gone = missingFor(id);
    if (gone.length) { partLoaded(gone); return; }

    // The fast path: a mode already in hand renders with no awaiting, so tapping
    // between modes a student has used feels the same as it always did.
    if (!ready(id)) { waitFor(id); return; }
    const mod = held.get(id);

    if (st.mode !== 'journey' || extraMode) document.body.dataset.era = extraMode ? 'school' : document.body.dataset.era;
    if (st.mode !== 'journey') document.body.dataset.era = 'school';
    // The pages written for adults read at adult sizes. The student game keeps
    // its own scale; a parent reading fee tables on a phone at night gets a
    // notch more type, via the tokens so every size on the page moves together.
    document.body.dataset.aud = ['parent', 'counsellor', 'teacher', 'evidence'].includes(id) ? 'adult' : 'student';
    switch (id) {
      case 'table':      mod.renderTable(app, data, ctx, paint); break;
      case 'teacher':    mod.renderTeacher(app, data, ctx, paint); break;
      case 'parent':     mod.renderParent(app, data, ctx); break;
      case 'counsellor': mod.renderCounsellor(app, data); break;
      case 'work':       mod.renderWork(app, data); break;
      case 'money':      mod.renderMoney(app, data, ctx); break;
      case 'evidence':   mod.renderEvidence(app, data); break;
      case 'schools':    mod.renderSchools(app, data, paint); break;
      case 'journey':    mod.renderJourney(app, data, ctx, paint); break;
      case 'aim':        mod.renderAim(app, data, ctx, paint); break;
      default:           mod.renderNow(app, data, ctx); break;
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

/** One part of the site did not arrive. Say so, and offer the way out. */
function partLoaded(missing) {
  const c = (data.copy && data.copy.chrome) || {};
  app.innerHTML = `
    <div class="wrap"><div class="section" style="margin-top:var(--s-6)"><div class="notice">
      <strong>${esc(c.partHead || 'This part did not load.')}</strong>
      <p style="margin:8px 0 0">${esc(c.partBody || 'The rest of the site is fine. Try again, or use another part of it.')}</p>
      <div class="btn-row" style="margin-top:var(--s-3)">
        <button class="btn accent" type="button" data-action="retry">${esc(c.partRetry || 'Try again')}</button>
        <button class="btn ghost" type="button" data-action="topl">${esc(c.partPlan || 'Go to Plan')}</button>
      </div>
    </div></div></div>`;
  onAction(app, {
    retry: () => location.reload(),
    topl: () => { extraMode = null; setMode('now'); },
  });
  console.warn('[data] mode unavailable, missing:', missing.join(', '));
}

/**
 * The build, on screen, on every page.
 *
 * A teacher who has just been told something changed needs to be able to check
 * that their phone is running it, and the only honest way to answer that is to
 * print the build where they can read it. Also states whether the data matched
 * the build, so a stale cache shows up as a mismatch rather than as silence.
 */
function stampBuild() {
  const el = document.getElementById('foot-build');
  if (!el) return;
  const dv = (data.version && data.version.version) || 'unknown';
  const fresh = data._freshness || {};
  const same = dv === BUILD;
  el.innerHTML = `Paths version <strong>${esc(BUILD)}</strong>`
    + (same ? '' : ` <span class="build-warn">data says ${esc(dv)}, so this page is part cached. Reload to catch up.</span>`)
    + (fresh.known ? ` &middot; figures last checked ${fresh.days} days ago` : '');
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
    { id: 'counsellor', href: './?mode=counsellor', label: f.roleCounsellor },
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

/**
 * One line while a mode arrives, and a real answer if it does not.
 *
 * Deliberately not a spinner. On a school access point this is a second or two,
 * and a sentence that names what is coming is more use than a shape that turns.
 * A fetch that fails is the case that matters: the app already survives a missing
 * data file, and it now survives a missing screen the same way, by saying so and
 * offering the screens that did arrive.
 */
function waitFor(id) {
  if (loadingId === id) return;
  loadingId = id;
  const name = (MODES[id] && MODES[id].label) || 'this screen';
  app.innerHTML = `
    <div class="wrap"><div class="section" style="margin-top:var(--s-7)">
      <p class="caps">${esc(name)}</p>
      <p class="lede">Getting this screen ready.</p>
      <p class="small mute">It arrives once and then it is on this device for good.</p>
    </div></div>`;
  bring(id).then(() => { loadingId = null; paint(); }).catch((e) => {
    console.error('mode failed to load', id, e);
    loadingId = null;
    const others = [...held.keys()].filter((k) => MODES[k]);
    app.innerHTML = `
      <div class="wrap"><div class="section" style="margin-top:var(--s-6)"><div class="notice">
        <strong>That screen did not arrive.</strong>
        <p style="margin:8px 0 0">The connection dropped partway. Nothing on this device is lost.</p>
        <div class="btn-row" style="margin-top:var(--s-3)">
          <button class="btn accent" type="button" data-action="retry">Try again</button>
          ${others.map((k) => `<button class="btn ghost" type="button" data-action="goto" data-id="${k}">${esc(MODES[k].label)}</button>`).join('')}
        </div>
      </div></div></div>`;
    onAction(app, { retry: () => paint(), goto: (b) => setMode(b.dataset.id) });
  });
}
