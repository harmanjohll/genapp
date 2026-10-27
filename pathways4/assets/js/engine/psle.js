// P6: from PSLE Achievement Levels to Sec 1 starting levels.
//
// Everything here is hypothetical by design. A P6 child (or their parent)
// enters the ALs they expect, hope for, or got, and sees what follows: the
// PSLE Score, the Posting Group, and the level each subject usually starts
// at in Sec 1, with the upgrade options MOE allows on top. The page says
// "usually" and "can", because posting is a family's choice and a school's
// offer, never a sum.
//
// Pure: no DOM, no storage. Rules come from data/psle.json.

export function alOf(entry, rules) {
  if (!entry) return null;
  if (entry.foundation) {
    const f = (rules.foundationBands || []).find((b) => b.grade === entry.grade);
    return f ? f.al : null;
  }
  return Number.isFinite(entry.al) ? entry.al : null;
}

export function psleScore(psle, rules) {
  const ids = (rules.subjects || []).map((s) => s.id);
  const als = ids.map((id) => alOf(psle[id], rules));
  const complete = als.every((a) => a != null);
  return { complete, score: complete ? als.reduce((a, b) => a + b, 0) : null, als: Object.fromEntries(ids.map((id, i) => [id, als[i]])) };
}

export function postingFor(score, psle, rules) {
  if (score == null) return null;
  const band = (rules.postingGroups || []).find((b) => score >= b.min && score <= b.max);
  if (!band) return { groups: [], note: rules.noGroup };
  if (band.needs) {
    const el = alOf(psle.el, rules); const ma = alOf(psle.maths, rules);
    if (!(el != null && el <= 7 && ma != null && ma <= 7)) return { groups: [], note: rules.noGroup, needs: band.needs };
  }
  return { groups: band.groups.slice(), note: band.note || null, needs: band.needs || null };
}

const LV = { 1: 'G1', 2: 'G2', 3: 'G3' };
const RANK = { G1: 1, G2: 2, G3: 3 };

/**
 * Starting levels for a chosen Posting Group, plus the upgrade options.
 * Returns { base, options: { el: ['G2','G3'] ... }, plan } where plan maps
 * the app's Sec 1 subject ids to the base level (options are offered, not
 * applied: the family chooses).
 */
export function startLevels(group, psle, rules, chosen = {}) {
  const base = LV[group];
  if (!base) return null;
  const up = rules.upgrades || {};
  const options = {};
  (up.subjects || []).forEach((id) => {
    const opts = new Set([base]);
    if ((up.groups || []).includes(group)) {
      const e = psle[id] || {};
      (up.rules || []).forEach((r) => {
        if (r.onlyGroup && r.onlyGroup !== group) return;
        const std = !e.foundation && Number.isFinite(e.al) && e.al <= r.standardMax;
        const fnd = e.foundation && r.foundation && e.grade === r.foundation;
        if ((std || fnd) && RANK[r.level] > RANK[base]) opts.add(r.level);
      });
      // A subject that may start at G3 may also start in between.
      if (opts.has('G3') && base === 'G1') opts.add('G2');
    }
    options[id] = [...opts].sort((a, b) => RANK[a] - RANK[b]);
  });
  const pick = (id) => (options[id].includes(chosen[id]) ? chosen[id] : base);
  const plan = {
    el: pick('el'), mtl: pick('mtl'), maths: pick('maths'), ls_science: pick('science'),
    ls_geography: base, ls_history: base,
  };
  return { base, options, plan };
}

export function hmtlEligible(psle) {
  const m = psle.mtl;
  return !!(m && !m.foundation && Number.isFinite(m.al) && m.al <= 2);
}

/** The Sec 1 plan the P6 page currently points at, or null. */
export function psleSec1Plan(psle, rules) {
  if (!rules || !psle) return null;
  const { score } = psleScore(psle, rules);
  const post = postingFor(score, psle, rules);
  if (!post || !post.groups.length) return null;
  const g = post.groups.includes(psle.group && psle.group.v) ? psle.group.v : post.groups[0];
  const s = startLevels(g, psle, rules, (psle.pick || {}));
  return s ? s.plan : null;
}
