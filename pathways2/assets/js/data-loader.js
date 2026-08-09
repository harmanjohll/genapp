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
  'activities', 'possibilities',
];

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

export async function loadAll() {
  const settled = await Promise.all(
    FILES.map(async (name) => {
      try { return [name, await fetchOne(name), null]; }
      catch (e) { return [name, null, e]; }
    })
  );

  const missing = settled.filter(([, v]) => v === null).map(([n]) => n);
  const fatal = missing.filter((n) => REQUIRED.includes(n));
  if (fatal.length) {
    const err = new Error(`missing: ${fatal.join(', ')}`);
    err.missing = fatal;
    throw err;
  }

  const data = Object.fromEntries(settled.map(([n, v]) => [n, v || {}]));
  data._missing = missing;
  data._freshness = freshness(data);
  data._provisionalCount = countProvisional(data);
  return data;
}

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
