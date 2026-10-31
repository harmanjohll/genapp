// Entry point: the router, the screen contract, the shell chrome.
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

import { loadAll, ensureData, topUp, MODE_DATA, BUILD, have } from './data-loader.js?v=3.0.0';
import {
  getState, subscribe, setMode, setYear, YEARS, currentYear, isGuest,
  reconcile, setSound, MODES,
} from './state.js?v=3.0.0';
import { esc, onAction } from './ui/dom.js?v=3.0.0';
import { openSheet, close as closeSheet, isOpen as sheetIsOpen } from './ui/sheet.js?v=3.0.0';
import { initGlossary, bindGlossary, openFullList } from './ui/glossary.js?v=3.0.0';
import { icon } from './ui/icons.js?v=3.0.0';
import { cue, setMutePredicate } from './sound.js?v=3.0.0';

const app = document.getElementById('app');
const params = new URLSearchParams(location.search);

// ---- one-off document states ----------------------------------------------

const BOARD = params.get('board') === '1';
if (BOARD) {
  document.documentElement.dataset.board = 'true';
  document.documentElement.dataset.theme = 'dark'; // a lit projector needs dark ground
}

const THEME_KEY = 'pathways3.theme';
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
  home:    { mod: './screens/home.js', exp: 'default' },
  plan:    { mod: './screens/plan.js', exp: 'default' },
  play:    { mod: './screens/play.js', exp: 'default' },
  act:     { mod: './screens/act.js', exp: 'default' },
  adults:  { mod: './screens/adults.js', exp: 'default' },
  money:   { mod: './screens/info.js', exp: 'money' },
  work:    { mod: './screens/info.js', exp: 'work' },
  schools: { mod: './screens/info.js', exp: 'schools' },
};

// v2 bookmarks and printed teacher notes point at ?mode=. They keep working.
const LEGACY = {
  now: { s: 'plan' }, journey: { s: 'play' }, aim: { s: 'act' },
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
  if (!SCREENS[s]) s = null;
  const extras = {};
  ['tab', 'sector', 'kind'].forEach((k) => { if (q.get(k)) extras[k] = q.get(k); });
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

function defaultScreen() {
  const st = getState();
  return st.seenWelcome ? (MODES[st.mode] ? st.mode : 'plan') : 'home';
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
  return { plan: 'Plan', play: 'Play', act: 'Act', adults: 'For the adults', money: 'Money', work: 'Work', schools: 'My school' }[s] || s;
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
  document.title = `${def.title} · Paths`;
  app.innerHTML = '';
  def.render(app, api(def));
  bindGlossary(app);
  renderChrome();

  if (scrollTo != null) window.scrollTo(0, scrollTo);
  const h1 = app.querySelector('h1');
  if (h1 && !fromPop) {
    h1.setAttribute('tabindex', '-1');
    h1.focus({ preventScroll: true });
  }
  announce(`${def.title}.`);
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
  return {
    subjects: data.subjects.subjects || [],
    destinations: data.pathways.destinations || [],
    routesById: Object.fromEntries(((data.progressions || {}).routes || []).map((r) => [r.id, r])),
    pathwaysMeta: data.pathways._meta,
    yearId: st.year,
    plan: st.plan,
  };
}

function api(def) {
  return {
    data, ctx, copy, nav, refresh, announce, cue,
    sheet: openSheetRouted, closeSheet,
    board: BOARD,
  };
}

// ---- chrome --------------------------------------------------------------------

const head = document.getElementById('site-head');
const tabs = document.getElementById('tabbar');

function themeNow() {
  return document.documentElement.dataset.theme
    || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

function renderChrome() {
  const st = getState();
  const onHome = route.s === 'home';
  head.hidden = false;
  head.innerHTML = `<div class="wrap headrow">
    <button type="button" class="brand press" data-action="go" data-s="home" aria-label="Paths. Back to your map.">
      <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true"><path d="M6 24 C12 24 10 8 16 8 M16 8 C22 8 20 24 26 24" fill="none" stroke="var(--accent)" stroke-width="2.6" stroke-linecap="round"/><circle cx="6" cy="24" r="2.6" fill="var(--line-open)"/><circle cx="26" cy="24" r="2.6" fill="var(--line-longer)"/></svg>
      <span>Paths</span>
    </button>
    <span class="headspace"></span>
    <button type="button" class="chip press" data-action="year" aria-label="School year: ${esc(currentYear().label)}. Change it.">${esc(currentYear().label)}${st.yearSet ? '' : '?'}</button>
    <button type="button" class="chip press" data-action="words">${esc(copy('chrome.words', 'Words'))}</button>
    <button type="button" class="iconbtn press" data-action="sound" aria-pressed="${st.soundOn}" aria-label="${st.soundOn ? 'Sound is on. Turn it off.' : 'Sound is off. Turn it on.'}">${icon(st.soundOn ? 'sound_on' : 'sound_off')}</button>
    <button type="button" class="iconbtn press" data-action="theme" aria-label="Switch to ${themeNow() === 'dark' ? 'light' : 'dark'} colours">${icon('theme')}</button>
  </div>
  ${isGuest() ? `<p class="guestline">${esc(copy('chrome.guest', 'Guest: nothing is saved on this phone.'))}</p>` : ''}`;

  const badges = {
    plan: Object.keys(st.plan).length || '',
    play: st.liveRun ? '·' : (st.runs.length || ''),
    act: (st.actions || []).length || '',
  };
  tabs.hidden = BOARD;
  tabs.innerHTML = `<div class="tabrow" role="tablist" aria-label="Plan, Play, Act">
    ${['plan', 'play', 'act'].map((m) => `
      <button type="button" class="tab press" data-action="go" data-s="${m}" aria-current="${route.s === m ? 'page' : 'false'}">
        ${icon(m === 'plan' ? 'map' : m === 'play' ? 'play' : 'flag')}
        <span>${esc(MODES[m].label)}</span>
        ${badges[m] ? `<i class="tabbadge" aria-hidden="true">${esc(String(badges[m]))}</i>` : ''}
      </button>`).join('')}
  </div>`;
  tabs.classList.toggle('on-home', onHome);
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
  go: (btn) => nav(btn.dataset.s),
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
  if (evt.kind === 'plan' || evt.kind === 'actions' || evt.kind === 'runs' || evt.kind === 'year') renderChrome();
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
  initGlossary(data.glossary);

  const parsed = parseRoute();
  route = { s: parsed.s || defaultScreen(), q: parsed.q };
  if (MODES[route.s]) setMode(route.s);
  try { history.replaceState({ v3: route, scrollY: 0 }, '', routeUrl(route.s, route.q)); } catch { /* fine */ }
  await paint({ scrollTo: 0 });

  const build = document.getElementById('foot-build');
  if (build) {
    const f = data._freshness;
    build.textContent = `Paths version ${BUILD}${f && f.known ? ` · figures last checked ${f.days} day${f.days === 1 ? '' : 's'} ago` : ''}`;
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
