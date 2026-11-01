// Moves every date in a fixture forward by the time since it was written, so the entries keep the same
// age on any day the tests run. Checks such as "one more entry, on or after 1 Nov" then still hold.
const WRITTEN = Date.parse('2026-10-31T12:00:00+08:00');
module.exports = function rebase(db, now = Date.now()){
  const d = now - WRITTEN;
  const walk = o => {
    if (Array.isArray(o)) return o.forEach(walk);
    if (!o || typeof o !== 'object') return;
    for (const [k, v] of Object.entries(o)){
      if (typeof v === 'number' && v > 1e12 && /^(created|updated|at|_fetched)$/.test(k)) o[k] = v + d; else walk(v);
    }
  };
  walk(db); return db;
};
