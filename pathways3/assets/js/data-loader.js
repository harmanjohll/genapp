// Loads every data file and reports on freshness.
//
// Every JSON file declares a _meta block with source, url, accessed, units and
// notes. The oldest accessed date drives a stale data banner, because admission
// criteria change annually and a tool quietly serving last year's thresholds is
// worse than no tool.
//
// Resilience matters more here than it looks. Thirty five devices hitting one
// school access point at 8:32am is exactly when a fetch times out, and the old
// version failed the whole app on any single failure and then showed a
// fourteen year old a message about running python3. Each file now retries, and
// a file that still will not load degrades to an empty object rather than
// taking the lesson down.

const FILES = [
  'subjects', 'pathways', 'progressions', 'lifelong', 'copy', 'parent',
  'glossary', 'dispositions', 'futures', 'chances', 'journey', 'stories', 'moves', 'version',
  'activities', 'possibilities', 'work', 'money', 'evidence', 'schools',
];

/**
 * WHAT THE FIRST SCREEN ACTUALLY NEEDS, AND WHAT CAN ARRIVE AFTER IT.
 *
 * Twenty files, 399 KB, all fetched before a student saw a subject. The largest is
 * the chance deck at 129 KB, which only the game and the table use, and the second
 * largest after that is the sector file, which the Plan screen uses for one row of
 * chips in a sheet nobody has opened yet.
 *
 * Measured on a throttled school access point before any of this: 988 KB across 58
 * requests, first contentful paint at 7.3 seconds, 23 seconds before the page
 * settled. Thirty five devices share one access point in a computer lab, which is
 * the situation the paragraph at the top of this file has always worried about and
 * never acted on.
 *
 * EAGER is what the landing and the Plan screen cannot be correct without. DEFERRED
 * is fetched when a mode that needs it opens, and also topped up in the background
 * once the first screen is on the glass, so the parts of Plan that use a deferred
 * file appear a moment later rather than never. Everything that reads a deferred
 * file already guards for its absence, because every read in this app goes through
 * `(data.x && data.x.y) || []`.
 */
const EAGER = [
  'subjects', 'pathways', 'progressions', 'copy', 'glossary',
  'activities', 'lifelong', 'version',
];
const DEFERRED = FILES.filter((f) => !EAGER.includes(f));

/** Which deferred files a screen cannot render without. One manifest: the
    router checks this list and only this list, because v2 kept two divergent
    lists (MODE_NEEDS and MODE_DATA) and the mismatch produced an infinite,
    error-free loading screen. */
export const MODE_DATA = {
  home: [], plan: [],
  play: ['journey', 'chances', 'moves', 'possibilities', 'dispositions'],
  act: ['futures', 'journey', 'moves'],
  adults: ['parent', 'journey', 'chances', 'futures', 'dispositions', 'stories', 'evidence'],
  work: ['work', 'futures'], money: ['money'], schools: ['schools'],
};

const REQUIRED = ['subjects', 'pathways', 'progressions', 'copy', 'glossary'];
const STALE_DAYS = 90;

/**
 * The build, read from the one file a refresh always refetches.
 *
 * WHY THIS IS NOT IN A JSON FILE. It was: version.json carried it, and its own
 * note said a class can be sitting on three different builds without anyone
 * knowing. But a browser caches version.json exactly like every other data
 * file, so the mechanism meant to detect staleness was itself served stale, and
 * a whole rewrite of the game's language shipped without appearing on a device
 * that had loaded the app before. index.html is the document, so a reload
 * revalidates it, and the version it carries busts everything below it.
 */
export const BUILD = (() => {
  const el = typeof document !== 'undefined' && document.querySelector('meta[name="app-version"]');
  return (el && el.content) || 'dev';
})();

async function fetchOne(name, tries = 3) {
  let lastErr;
  for (let i = 0; i < tries; i += 1) {
    try {
      const res = await fetch(`./data/${name}.json?v=${encodeURIComponent(BUILD)}`);
      if (!res.ok) throw new Error(`${res.status}`);
      return await res.json();
    } catch (e) {
      lastErr = e;
      if (i < tries - 1) await new Promise((r) => setTimeout(r, 300 * (i + 1)));
    }
  }
  throw lastErr;
}

let store = null;
const inflight = new Map();

async function fetchInto(names) {
  const want = names.filter((n) => FILES.includes(n) && !store[`_have_${n}`]);
  if (!want.length) return;
  await Promise.all(want.map(async (name) => {
    if (!inflight.has(name)) {
      inflight.set(name, fetchOne(name)
        .then((v) => { store[name] = v; store[`_have_${name}`] = true; })
        .catch(() => { store[name] = store[name] || {}; store._missing.push(name); })
        .finally(() => inflight.delete(name)));
    }
    await inflight.get(name);
  }));
  restat();
}

function restat() {
  store._freshness = freshness(store);
  store._provisionalCount = countProvisional(store);
}

export async function loadAll() {
  store = Object.fromEntries(FILES.map((n) => [n, {}]));
  store._missing = [];
  await fetchInto(EAGER);
  const fatal = store._missing.filter((n) => REQUIRED.includes(n));
  if (fatal.length) {
    const err = new Error(`missing: ${fatal.join(', ')}`);
    err.missing = fatal;
    throw err;
  }
  return store;
}

/**
 * Make sure these files are in hand. Mutates the same object every mode holds, so
 * nothing has to be rewired when a file arrives late.
 */
export async function ensureData(names) {
  if (!store) return;
  await fetchInto(names || []);
}

/**
 * Everything else, once the first screen is on the glass.
 *
 * Called after first paint with a repaint callback, so the parts of the Plan screen
 * that use a deferred file appear when it lands rather than waiting for a mode
 * change. Failures are silent on purpose: a top up that does not arrive leaves the
 * app exactly as usable as it was a second earlier, and `_missing` already carries
 * the fact for anything that asks.
 */
export async function topUp(then) {
  if (!store) return;
  // In a lab, thirty five devices' background top-ups compete with the
  // thirty sixth student's first paint. Wait for idle, and skip entirely
  // when the connection asked for less data.
  try {
    if (navigator.connection && navigator.connection.saveData) return;
  } catch { /* fine */ }
  await new Promise((r) => {
    if (typeof requestIdleCallback === 'function') requestIdleCallback(r, { timeout: 4000 });
    else setTimeout(r, 1500);
  });
  try { await fetchInto(DEFERRED); } catch { /* the app is already usable */ }
  if (typeof then === 'function') then();
}

/** Whether a file is actually in hand, for a screen deciding what to show. */
export function have(name) { return !!(store && store[`_have_${name}`]); }

function freshness(data) {
  let oldest = null;
  for (const name of FILES) {
    const accessed = data[name] && data[name]._meta && data[name]._meta.accessed;
    if (!accessed) continue;
    const d = new Date(accessed);
    if (Number.isNaN(d.getTime())) continue;
    if (!oldest || d < oldest.date) oldest = { date: d, name, accessed };
  }
  if (!oldest) return { known: false, stale: false };
  const days = Math.floor((Date.now() - oldest.date.getTime()) / 86400000);
  return { known: true, days, accessed: oldest.accessed, file: oldest.name, stale: days > STALE_DAYS, staleDays: STALE_DAYS };
}

// Counts anything flagged provisional, so the app can state plainly how much of
// what it shows has not been read from a primary source.
function countProvisional(data) {
  let n = 0;
  const walk = (node) => {
    if (Array.isArray(node)) { node.forEach(walk); return; }
    if (!node || typeof node !== 'object') return;
    if (node.status === 'provisional') n += 1;
    Object.values(node).forEach(walk);
  };
  FILES.forEach((f) => walk(data[f]));
  return n;
}
