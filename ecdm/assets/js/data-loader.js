// Load every JSON dataset under /data, attach the latest as-of date,
// trigger the stale-data banner if anything is >90 days old.

const FILES = [
  'sg-fuel-mix',
  'sg-tariff-history',
  'sg-gas-imports',
  'sg-emissions',
  'carbon-tax-timeline',
  'comparators',
  'pathway-models',
  'household-typology',
  'annotations',
];

const STALE_DAYS = 90;

export async function loadAll() {
  const entries = await Promise.all(
    FILES.map(async (name) => {
      const res = await fetch(`./data/${name}.json`, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`Failed to load ${name}.json (${res.status})`);
      const json = await res.json();
      return [name, json];
    })
  );
  const data = Object.fromEntries(entries);

  // Find latest accessed date.
  const dates = Object.values(data)
    .map((d) => d?._meta?.accessed)
    .filter(Boolean)
    .map((s) => new Date(s));
  const latest = dates.length ? new Date(Math.max(...dates.map((d) => +d))) : null;
  const oldest = dates.length ? new Date(Math.min(...dates.map((d) => +d))) : null;

  const today = new Date();
  const ageDays = oldest ? Math.floor((+today - +oldest) / 86400000) : 0;

  return { data, latest, oldest, ageDays, isStale: ageDays > STALE_DAYS };
}

export function formatDate(d) {
  if (!d) return '—';
  return d.toLocaleDateString('en-SG', { year: 'numeric', month: 'long', day: 'numeric' });
}
