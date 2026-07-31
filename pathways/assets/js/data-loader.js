// Loads every data file and reports on freshness.
// Follows the ecdm convention: every JSON file declares a _meta block with
// source, url, accessed, units and notes. The oldest accessed date across all
// files drives a stale data banner.
//
// Criteria in this domain change annually. A tool that quietly serves last
// year's thresholds to a fourteen year old is worse than no tool.

const FILES = [
  'subjects', 'pathways', 'progressions', 'lifelong',
  'glossary', 'dispositions', 'futures', 'chances', 'journey', 'stories',
];

const STALE_DAYS = 90;

export async function loadAll() {
  const entries = await Promise.all(
    FILES.map(async (name) => {
      const res = await fetch(`./data/${name}.json`, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`Could not load data/${name}.json (${res.status})`);
      return [name, await res.json()];
    })
  );
  const data = Object.fromEntries(entries);
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
  return {
    known: true,
    days,
    accessed: oldest.accessed,
    file: oldest.name,
    stale: days > STALE_DAYS,
    staleDays: STALE_DAYS,
  };
}

// Walks the loaded data and counts anything flagged provisional, so the app can
// state plainly, up front, how much of what it is showing has not been read
// from a primary source.
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
