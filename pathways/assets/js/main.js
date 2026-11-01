// Entry point: the router, the screen contract, the shell chrome. (v4)
//
// v4 changes the map of the app, not the contract: the three verbs (Plan,
// Play, Act) become five places a family actually goes - Home, the year
// pages (P6 to Sec 5, one page each), After Sec (the destinations), Play,
// and My plan (the conversation card). Old v3 addresses redirect.
//
// v2 had no router. history.replaceState wrote URLs it then refused to read,
// the Android back gesture exited the site from any depth, every reload
// landed on the landing, and satellites navigated by full page reload. Every
// one of those was a symptom of the same missing part, so v3 starts here.
//
// THE SCREEN CONTRACT. Every screen declares { id, title, needs, era,
// render }. The router does the rest, identically, for all of them: fetch
// what the screen needs (one manifest, MODE_DATA - v2 kept two lists and
// their disagreement produced an infinite, error-free spinner), set the era,
// swap the DOM, move focus, retitle the document, announce the arrival in a
// live region that exists from boot, and manage scroll. A screen never
// touches the address bar; the address bar always reproduces the screen.

import { loadAll, ensureData, topUp, MODE_DATA, BUILD, have } from './data-loader.js?v=4.3.0';
import {
  getState, subscribe, setMode, setYear, YEARS, currentYear, isGuest,
  reconcile, setSound, MODES, setEffective, setRole, setFamilies, toggleAction,
  setLabelMode, markStart, setAllSubjects,
} from './state.js?v=4.3.0';
import { effective } from './engine/years.js?v=4.3.0';
import { runStrip } from './ui/yearstrip.js?v=4.3.0';
import { t } from './ui/labels.js?v=4.3.0';
import { esc, onAction } from './ui/dom.js?v=4.3.0';
import { openSheet, close as closeSheet, isOpen as sheetIsOpen } from './ui/sheet.js?v=4.3.0';
import { initGlossary, bindGlossary, openFullList } from './ui/glossary.js?v=4.3.0';
import { icon } from './ui/icons.js?v=4.3.0';
import { cue, setMutePredicate } from './sound.js?v=4.3.0';

const app = document.getElementById('app');
const params = new URLSearchParams(location.search);

// ---- one-off document states ----------------------------------------------

const BOARD = params.get('board') === '1';
if (BOARD) {
  document.documentElement.dataset.board = 'true';
  document.documentElement.dataset.theme = 'dark'; // a lit projector needs dark ground
}

const THEME_KEY = 'pathways4.theme';
try {
  const t = localStorage.getItem(THEME_KEY);
  if (t && !BOARD) document.documentElement.dataset.theme = t;
} catch { /* private mode */ }

setMutePredicate(() => {
  if (!getState().soundOn) return true;
  if (BOARD) return true;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
  return false;
});

// The live region exists from boot. v2 created it lazily on first announce,
// so the first announcement of a session could be dropped.
const announcer = document.createElement('p');
announcer.id = 'announcer';
announcer.className = 'sr-only';
announcer.setAttribute('aria-live', 'polite');
document.body.appendChild(announcer);
let announceTimer = null;
export function announce(text) {
  clearTimeout(announceTimer);
  announceTimer = setTimeout(() => { announcer.textContent = text; }, 80);
}

// ---- screens ----------------------------------------------------------------

const SCREENS = {
  start:   { mod: './screens/start.js', exp: 'default' },
  home:    { mod: './screens/home.js', exp: 'default' },
  explore: { mod: './screens/explore.js', exp: 'default' },
  year:    { mod: './screens/year.js', exp: 'default' },
  after:   { mod: './screens/after.js', exp: 'after' },
  dest:    { mod: './screens/after.js', exp: 'dest' },
  myplan:  { mod: './screens/myplan.js', exp: 'default' },
  play:    { mod: './screens/play.js', exp: 'default' },
  act:     { mod: './screens/act.js', exp: 'default' },
  adults:  { mod: './screens/adults.js', exp: 'default' },
  money:   { mod: './screens/info.js', exp: 'money' },
  work:    { mod: './screens/info.js', exp: 'work' },
  schools: { mod: './screens/info.js', exp: 'schools' },
};

// v2 bookmarks and printed teacher notes point at ?mode=. They keep working.
const LEGACY = {
  now: { s: 'year' }, journey: { s: 'play' }, aim: { s: 'myplan' },
  parent: { s: 'adults', tab: 'parent' }, teacher: { s: 'adults', tab: 'teacher' },
  counsellor: { s: 'adults', tab: 'counsellor' }, evidence: { s: 'adults', tab: 'evidence' },
  work: { s: 'work' }, money: { s: 'money' }, schools: { s: 'schools' },
};

const held = new Map();
async function screenDef(id) {
  const entry = SCREENS[id];
  if (!held.has(id)) {
    held.set(id, import(`${entry.mod}?v=${encodeURIComponent(BUILD)}`)
      .then((m) => (entry.exp === 'default' ? m.default : m[entry.exp])));
  }
  return held.get(id);
}

// ---- routing ----------------------------------------------------------------

let data = null;
let route = { s: null, q: {} };
let painting = 0;

function parseRoute() {
  const q = new URLSearchParams(location.search);
  let s = q.get('s');
  const legacy = !s && LEGACY[q.get('mode')];
  if (legacy) { s = legacy.s; if (legacy.tab) q.set('tab', legacy.tab); }
  // v3 addresses: Plan becomes your year page.
  if (s === 'plan') s = 'year';
  if (!SCREENS[s]) s = null;
  const extras = {};
  ['tab', 'sector', 'kind', 'y', 'id', 'g'].forEach((k) => { if (q.get(k)) extras[k] = q.get(k); });
  return { s, q: extras };
}

function routeUrl(s, q = {}) {
  const url = new URL(location.origin + location.pathname);
  if (s !== 'home') url.searchParams.set('s', s);
  Object.entries(q).forEach(([k, v]) => { if (v != null) url.searchParams.set(k, v); });
  if (BOARD) url.searchParams.set('board', '1');
  if (isGuest()) url.searchParams.set('guest', '1');
  return url;
}

export function nav(s, q = {}, { replace = false } = {}) {
  if (!SCREENS[s]) return;
  if (sheetIsOpen()) closeSheet();
  const entry = { v3: { s, q }, scrollY: 0 };
  // Remember where the leaving screen was scrolled to, so back restores it.
  try { history.replaceState({ ...(history.state || {}), scrollY: window.scrollY }, '', location.href); } catch { /* fine */ }
  try {
    history[replace ? 'replaceState' : 'pushState'](entry, '', routeUrl(s, q));
  } catch { /* about: contexts */ }
  route = { s, q };
  if (MODES[s]) setMode(s);
  paint({ scrollTo: 0 });
}

// The back button is real. A pop with a sheet open closes the sheet; a pop
// with a route behind it repaints that route and restores its scroll.
let sheetPushed = false;
let closingFromPop = false;
window.addEventListener('popstate', (e) => {
  if (sheetIsOpen()) {
    closingFromPop = true;
    closeSheet();
    closingFromPop = false;
    // A sheet opened without its own history entry (the game's sheets):
    // back should only close it, so the popped route entry goes straight
    // back on before the URL visibly changes.
    if (!sheetPushed) {
      try { history.pushState({ v3: route, scrollY: window.scrollY }, '', routeUrl(route.s, route.q)); } catch { /* fine */ }
    }
    sheetPushed = false;
    return;
  }
  const st = (e.state && e.state.v3) || parseRoute();
  route = { s: st.s || defaultScreen(), q: st.q || parseRoute().q };
  if (MODES[route.s]) setMode(route.s);
  paint({ scrollTo: (e.state && e.state.scrollY) || 0, fromPop: true });
});

/** A sheet becomes a history entry, so back closes it instead of the site. */
export function openSheetRouted(html, trigger, footHtml) {
  openSheet(html, trigger, footHtml);
  try { history.pushState({ ...(history.state || {}), sheet: true }, '', location.href); sheetPushed = true; } catch { sheetPushed = false; }
}
document.addEventListener('close', (e) => {
  if (!e.target.classList || !e.target.classList.contains('sheet')) return;
  if (sheetPushed && !closingFromPop) { sheetPushed = false; try { history.back(); } catch { /* fine */ } }
  else sheetPushed = false;
}, true);

// A first visit lands on the guided start; every visit after, on Home.
function defaultScreen() {
  return getState().seenStart ? 'home' : 'start';
}

// ---- paint -------------------------------------------------------------------

function loadingScreen(id) {
  return `<div class="wrap-narrow section"><p class="loadline" role="status">${esc(copy('chrome.loading', 'Getting this screen ready.'))}</p></div>`;
}

function failedScreen(id, missing) {
  const works = Object.keys(SCREENS).filter((k) => !(MODE_DATA[k] || []).some((n) => missing.includes(n)));
  return `<div class="wrap-narrow section">
    <h1>${esc(copy('chrome.partHead', 'That screen did not arrive'))}</h1>
    <p>${esc(copy('chrome.partBody', 'The connection dropped part of the tool. Everything already here still works.'))}</p>
    <p class="btnrow">
      <button class="btn" type="button" data-action="retry">${esc(copy('chrome.retry', 'Try again'))}</button>
      ${works.filter((w) => w !== id && w !== 'home').slice(0, 3).map((w) =>
        `<button class="btn ghost" type="button" data-action="go" data-s="${w}">${esc(screenLabel(w))}</button>`).join('')}
    </p>
  </div>`;
}

function screenLabel(s) {
  return { year: 'Subjects', after: 'After Sec', myplan: 'Saved', play: 'Play', act: 'Act', adults: 'For parents and teachers', money: 'Fees and financial help', work: 'Jobs and sectors', schools: 'My school type' }[s] || s;
}

async function paint({ scrollTo = null, fromPop = false } = {}) {
  const token = ++painting;
  const id = route.s;
  const def = await screenDef(id).catch(() => null);
  if (token !== painting) return;
  if (!def) { app.innerHTML = failedScreen(id, []); return; }

  const needs = MODE_DATA[id] || [];
  const missing = needs.filter((n) => !have(n));
  if (missing.length) {
    app.innerHTML = loadingScreen(id);
    await ensureData(needs);
    if (token !== painting) return;
    const still = needs.filter((n) => !have(n));
    if (still.length) { app.innerHTML = failedScreen(id, still); renderChrome(); return; }
  }

  document.body.dataset.era = def.era || 'school';
  document.body.dataset.screen = id;
  const title = typeof def.title === 'function' ? def.title(route.q) : def.title;
  document.title = `${title} · Paths`;
  app.innerHTML = '';
  def.render(app, api(def));
  runStrip(app);
  bindGlossary(app);
  renderChrome();

  if (scrollTo != null) window.scrollTo(0, scrollTo);
  const h1 = app.querySelector('h1');
  if (h1 && !fromPop) {
    h1.setAttribute('tabindex', '-1');
    h1.focus({ preventScroll: true });
  }
  announce(`${title}.`);
}

export function refresh() { paint({ scrollTo: null, fromPop: true }); }

// ---- what screens get ---------------------------------------------------------

function copy(path, fallback) {
  const parts = path.split('.');
  let node = data && data.copy;
  for (const p of parts) node = node && node[p];
  return (typeof node === 'string' && node) || fallback || '';
}

function ctx() {
  const st = getState();
  const subjects = data.subjects.subjects || [];
  // The screens that read "my combination" (Pathways, After, Saved) judge it
  // in the year it comes from, so a Sec 2 plan is read by the Sec 1 and 2
  // rules there too, not only on its own year page.
  const e = effective(st.plans, subjects);
  return {
    subjects,
    destinations: data.pathways.destinations || [],
    routesById: Object.fromEntries(((data.progressions || {}).routes || []).map((r) => [r.id, r])),
    pathwaysMeta: data.pathways._meta,
    yearId: e.yearId || st.year,
    plan: e.yearId ? e.lens : st.plan,
    // The school's offering, unless the reader asked for every school's subjects.
    offer: st.allSubjects ? null : (data.offer || null),
  };
}

function api(def) {
  return {
    data, ctx, copy, nav, refresh, announce, cue,
    sheet: openSheetRouted, closeSheet,
    board: BOARD,
    route: () => route,
    // Change the query of the current screen without a new history entry
    // (a tab inside a page is a place to come back to, not a step to undo).
    setQuery: (q) => {
      route = { s: route.s, q: { ...route.q, ...q } };
      Object.keys(route.q).forEach((k) => { if (route.q[k] == null) delete route.q[k]; });
      try { history.replaceState({ v3: route, scrollY: window.scrollY }, '', routeUrl(route.s, route.q)); } catch { /* fine */ }
    },
  };
}

/** The effective plan follows the year plans, always. */
function syncEffective() {
  if (!data) return;
  const e = effective(getState().plans, data.subjects.subjects || []);
  setEffective(e.plan);
}

// ---- chrome --------------------------------------------------------------------

const head = document.getElementById('site-head');
const tabs = document.getElementById('tabbar');

function themeNow() {
  return document.documentElement.dataset.theme
    || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

// Four doors. v4's first pass had five of equal weight, and a first-time
// student could not tell which one came first.
const NAV_ITEMS = [
  { s: 'home', label: 'Home', icon: 'home' },
  { s: 'year', label: 'Subjects', icon: 'steps' },
  { s: 'explore', label: 'Pathways', icon: 'map' },
  { s: 'myplan', label: 'Saved', icon: 'flag' },
];
const ROLE_LABEL = { student: 'Student', parent: 'Parent', teacher: 'Teacher' };

function navCurrent(s) {
  if (['after', 'dest', 'play', 'work', 'money', 'schools', 'adults'].includes(s)) return 'explore';
  if (s === 'act') return 'myplan';
  return s;
}

function renderChrome() {
  const st = getState();
  const cur = navCurrent(route.s);
  head.hidden = false;
  head.innerHTML = `<div class="wrap headrow">
    <button type="button" class="brand press" data-action="go" data-s="home" aria-label="Paths. Home.">
      <svg class="brand-mark" viewBox="0 0 32 32" width="30" height="30" aria-hidden="true"><rect width="32" height="32" rx="9" fill="var(--accent)"/><path d="M7 23 C12 23 11 9 16 9 C21 9 20 23 25 23" fill="none" stroke="var(--night)" stroke-width="3" stroke-linecap="round"/><circle cx="7" cy="23" r="2.4" fill="var(--night)"/><circle cx="25" cy="23" r="2.4" fill="var(--night)"/></svg>
      <span>Paths</span>
    </button>
    <nav class="topnav" aria-label="Main">
      ${NAV_ITEMS.map((n) => `<button type="button" class="topnav-item press" data-action="go" data-s="${n.s}" aria-current="${cur === n.s ? 'page' : 'false'}">${esc(n.s === 'myplan' ? t('plan') : n.label)}</button>`).join('')}
    </nav>
    <span class="headspace"></span>
    <button type="button" class="rolechip press" data-action="role" aria-label="I am a ${esc(ROLE_LABEL[st.role].toLowerCase())}. Change who is reading.">${icon(st.role)}<span><small>I am:</small> ${esc(ROLE_LABEL[st.role])}</span>${icon('caret', 'chev')}</button>
    <button type="button" class="iconbtn press" data-action="settings" aria-label="Settings">${icon('settings')}</button>
  </div>
  ${isGuest() ? `<p class="guestline">${esc(copy('chrome.guest', 'Guest: nothing is saved on this phone.'))}</p>` : ''}`;

  tabs.hidden = BOARD;
  tabs.innerHTML = `<div class="tabrow" aria-label="Main">
    ${NAV_ITEMS.map((n) => `
      <button type="button" class="tab press" data-action="go" data-s="${n.s}" aria-current="${cur === n.s ? 'page' : 'false'}">
        ${icon(n.icon)}
        <span>${esc(n.s === 'myplan' ? t('plan') : n.label)}</span>
      </button>`).join('')}
  </div>`;
}

function roleSheet(trigger) {
  const st = getState();
  openSheetRouted(`
    <h2 id="sheet-title">Who is reading?</h2>
    <p class="small">The facts never change. The questions and the voice do: a parent gets questions to ask their child, a teacher gets questions to ask a student.</p>
    <div class="rolegrid">
      ${Object.entries(ROLE_LABEL).map(([id, label]) => `<button type="button" class="btn ${st.role === id ? '' : 'ghost'} press" data-action="pick-role" data-id="${id}" aria-pressed="${st.role === id}">${esc(label)}</button>`).join('')}
    </div>`, trigger);
}

// Switches are buttons, not checkboxes: onAction prevents default on click,
// which would silently undo a native checkbox toggle.
function switchRow(action, label, note, on) {
  return `<button type="button" class="setrow press" role="switch" aria-checked="${!!on}" data-action="${action}">
    <span><strong>${esc(label)}</strong><span class="small">${esc(note)}</span></span>
    <span class="switch" aria-hidden="true"><i></i></span>
  </button>`;
}
const flip = (btn) => { const on = btn.getAttribute('aria-checked') !== 'true'; btn.setAttribute('aria-checked', String(on)); return on; };

function settingsSheet(trigger) {
  const st = getState();
  openSheetRouted(`
    <h2 id="sheet-title">Settings</h2>
    <div class="setlist">
      ${switchRow('set-line', 'Transit words (Line mode)', 'Use transit words: departures, tickets, a pass. The look stays the same.', st.labelMode === 'line')}
      ${data.offer ? switchRow('set-allsubj', 'Every school\'s subjects', `Off: ${data.offer.school}'s subjects and levels. On: the full national list, for a transfer or another school.`, !!st.allSubjects) : ''}
      ${switchRow('set-families', 'Course families', 'Show course groups and their subject asks on each destination page.', st.families)}
      ${switchRow('set-theme', 'Dark colours', 'Night in the same city.', themeNow() === 'dark')}
      ${switchRow('set-sound', 'Sound', 'Five small cues in the game.', st.soundOn)}
    </div>
    <p class="caps" style="margin-top:20px">Also here</p>
    <div class="morerow">
      <button type="button" class="chip press" data-action="go" data-s="work">Jobs and sectors</button>
      <button type="button" class="chip press" data-action="go" data-s="money">Fees and financial help</button>
      <button type="button" class="chip press" data-action="go" data-s="schools">My school type</button>
      <button type="button" class="chip press" data-action="go" data-s="adults">For parents and teachers</button>
      <button type="button" class="chip press" data-action="words">Glossary</button>
      <button type="button" class="chip press" data-action="replay-start">Show the start again</button>
    </div>
    <p class="small" style="margin-top:16px">Everything stays on this device. No account, no server, nothing collected.</p>`, trigger);
}

function yearSheet(trigger) {
  openSheetRouted(`
    <h2 id="sheet-title">${esc(copy('chrome.yearHead', 'Which year are you in?'))}</h2>
    <p class="small">${esc(copy('chrome.yearNote', 'This sets which subjects you see and where the game starts. Change it any time.'))}</p>
    <div class="yeargrid">
      ${YEARS.map((y) => `<button type="button" class="btn ${getState().year === y.id ? '' : 'ghost'}" data-action="pick-year" data-id="${y.id}">${esc(y.label)}</button>`).join('')}
    </div>`, trigger);
}

onAction(document.body, {
  go: (btn) => {
    const q = {};
    if (btn.dataset.y) q.y = btn.dataset.y;
    if (btn.dataset.id) q.id = btn.dataset.id;
    if (btn.dataset.tab) q.tab = btn.dataset.tab;
    nav(btn.dataset.s, q);
  },
  role: (btn) => roleSheet(btn),
  // Tickets live on several screens; their two actions live here.
  'tk-copy': async (btn) => {
    try { await navigator.clipboard.writeText(btn.dataset.text); btn.innerHTML = `${icon('check')} Copied`; } catch { btn.textContent = 'Select the line above to copy'; }
  },
  'tk-keep': (btn) => {
    toggleAction(btn.dataset.text);
    const on = getState().actions.includes(btn.dataset.text);
    btn.setAttribute('aria-pressed', String(on));
    btn.innerHTML = on ? `${icon('check')} ${t('kept')}` : `${icon('ticket')} ${t('keep')}`;
    const tk = btn.closest('.ticket');
    if (tk) tk.classList.toggle('kept', on);
    announce(on ? `${t('kept')} on ${t('plan')}.` : `Taken off ${t('plan')}.`);
  },
  'yr-go': (btn) => { if (route.s === 'year' && route.q.y === btn.dataset.y) return; nav('year', { y: btn.dataset.y }); },
  settings: (btn) => settingsSheet(btn),
  'pick-role': (btn) => { setRole(btn.dataset.id); closeSheet(); refresh(); },
  'set-families': (btn) => { setFamilies(flip(btn)); refresh(); },
  'set-line': (btn) => { setLabelMode(flip(btn) ? 'line' : 'plain'); renderChrome(); refresh(); },
  'set-allsubj': (btn) => { setAllSubjects(flip(btn)); refresh(); },
  'replay-start': () => { markStart(false); nav('start', {}); },
  'set-theme': (btn) => {
    const on = flip(btn);
    document.documentElement.dataset.theme = on ? 'dark' : 'light';
    try { localStorage.setItem(THEME_KEY, on ? 'dark' : 'light'); } catch { /* fine */ }
  },
  'set-sound': (btn) => { const on = flip(btn); setSound(on); if (on) cue('lived'); },
  retry: () => paint({ scrollTo: null }),
  year: (btn) => yearSheet(btn),
  words: (btn) => openFullList(btn),
  sound: (btn) => {
    const on = !getState().soundOn;
    setSound(on);
    btn.setAttribute('aria-pressed', String(on));
    btn.setAttribute('aria-label', on ? 'Sound is on. Turn it off.' : 'Sound is off. Turn it on.');
    btn.innerHTML = icon(on ? 'sound_on' : 'sound_off');
    if (on) cue('lived');
  },
  theme: () => {
    const next = themeNow() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem(THEME_KEY, next); } catch { /* fine */ }
  },
  'pick-year': (btn) => { setYear(btn.dataset.id); closeSheet(); refresh(); },
});

subscribe((st, evt) => {
  if (evt.kind === 'plans') syncEffective();
  if (evt.kind === 'role' || evt.kind === 'year') renderChrome();
});

// ---- boot ----------------------------------------------------------------------

async function boot() {
  try {
    data = await loadAll();
  } catch (e) {
    app.innerHTML = `<div class="wrap-narrow section"><h1>Paths could not load</h1>
      <p>The connection dropped the files this tool is made of. Reload to try again; nothing you saved is lost.</p>
      <p><button class="btn" type="button" onclick="location.reload()">Reload</button></p></div>`;
    return;
  }
  reconcile(data);
  syncEffective();
  initGlossary(data.glossary);

  const parsed = parseRoute();
  route = { s: parsed.s || defaultScreen(), q: parsed.q };
  if (MODES[route.s]) setMode(route.s);
  try { history.replaceState({ v3: route, scrollY: 0 }, '', routeUrl(route.s, route.q)); } catch { /* fine */ }
  await paint({ scrollTo: 0 });

  const build = document.getElementById('foot-build');
  if (build) {
    const f = data._freshness;
    build.textContent = `Paths ${BUILD}${f && f.known ? ` · figures checked ${f.days} day${f.days === 1 ? '' : 's'} ago` : ''}`;
  }

  topUp(() => refresh());

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register(`./sw.js?v=${encodeURIComponent(BUILD)}`).catch(() => { /* optional */ });
  }

  if (params.get('dev') === '1') {
    const [{ runInvariantSweep }, { projectionSweep }, { runJourneySweep }, { runCopyLint }, { possibilitySweep }, { domLint }] = await Promise.all([
      import(`./engine/reach.js?v=${BUILD}`), import(`./engine/project.js?v=${BUILD}`),
      import(`./engine/journey4.js?v=${BUILD}`), import(`./engine/copy-lint.js?v=${BUILD}`),
      import(`./engine/possible.js?v=${BUILD}`), import(`./engine/dom-lint.js?v=${BUILD}`),
    ]);
    await ensureData(['journey', 'chances', 'moves', 'possibilities', 'dispositions', 'futures']);
    runInvariantSweep(ctx());
    projectionSweep(ctx());
    runJourneySweep(data);
    possibilitySweep(data);
    runCopyLint(data);
    console.log('[dom-lint]', domLint(app));
  }
}

boot();
