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

import { reach } from './reach.js?v=4.2.0';
import { evalPlan } from './years.js?v=4.2.0';

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
    // Posting Group 3 with a Foundation subject: the school can offer a less
    // demanding start in that subject (MOE Full SBB). An option, never a default.
    const down = rules.downgrades || {};
    if ((down.groups || []).includes(group)) {
      const e = psle[id] || {};
      (down.rules || []).forEach((r) => {
        if (!(r.subjects || []).includes(id)) return;
        if (e.foundation && (r.foundation || []).includes(e.grade)) (r.levels || []).forEach((l) => opts.add(l));
      });
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

/**
 * Higher Mother Tongue in Sec 1, from the 2026 intake: AL 1 or 2 in Standard
 * Mother Tongue, or Distinction or Merit in PSLE Higher Mother Tongue. The
 * PSLE Score no longer counts. Schools can offer it to others too.
 */
export function hmtlEligible(psle) {
  const m = psle.mtl;
  const h = psle.hmtl;
  return !!((m && !m.foundation && Number.isFinite(m.al) && m.al <= 2) || (h && (h.grade === 'D' || h.grade === 'M')));
}

const SEC1_ID = { el: 'el', mtl: 'mtl', maths: 'maths', science: 'ls_science' };

/**
 * What the P6 choices do, read by the Sec 1 and 2 rules.
 *
 * Two kinds of choice, both the family's: which Posting Group (at 21 to 22
 * and at 25), and which level to start a subject at where the PSLE allows
 * more than one. Each is run through the same engine as the Sec 1 page, so
 * "on track" here means exactly what it means there.
 *
 * @returns {null | { group, base, onTrack, total, groups: Array, picks: Array }}
 */
export function p6Choices(psle, rules, ctx) {
  const { score } = psleScore(psle, rules);
  const post = postingFor(score, psle, rules);
  if (!post || !post.groups.length) return null;
  const group = post.groups.includes(psle.group && psle.group.v) ? psle.group.v : post.groups[0];
  const pick = psle.pick || {};
  const rowsFor = (plan) => {
    const ep = evalPlan('sec1', plan, ctx.subjects);
    return ctx.destinations.map((d) => reach(ep, d, { ...ctx, plan: ep, yearId: 'sec1' }));
  };
  const onTrack = (rows) => rows.filter((r) => r.state === 'open');
  const now = startLevels(group, psle, rules, pick);
  const nowRows = rowsFor(now.plan);

  const groups = post.groups.length > 1 ? post.groups.map((g) => {
    const s = startLevels(g, psle, rules, {});
    const rows = onTrack(rowsFor(s.plan));
    return { g, base: s.base, onTrack: rows.length, names: rows.map((r) => r.railName) };
  }) : [];

  const subjects = Object.fromEntries((ctx.subjects || []).map((x) => [x.id, x]));
  const picks = [];
  Object.entries(now.options).forEach(([id, opts]) => {
    const cur = now.plan[SEC1_ID[id]];
    opts.filter((l) => l !== cur).forEach((l) => {
      const plan = { ...now.plan, [SEC1_ID[id]]: l };
      const rows = rowsFor(plan);
      const opens = rows.filter((r, i) => r.state === 'open' && nowRows[i].state !== 'open').map((r) => r.railName);
      const nearer = rows.filter((r, i) => r.state !== 'open' && r.distance < nowRows[i].distance).map((r) => r.railName);
      const s = subjects[SEC1_ID[id]];
      const e = psle[id] || {};
      picks.push({
        sid: id,
        level: l,
        from: cur,
        up: RANK[l] > RANK[cur],
        result: e.foundation ? `Foundation ${e.grade}` : `AL ${e.al}`,
        opens,
        nearer,
        sec3: s && s.sec3 ? s.sec3[l] || null : null,
      });
    });
  });
  return { group, base: now.base, onTrack: onTrack(nowRows).length, total: nowRows.length, groups, picks };
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
