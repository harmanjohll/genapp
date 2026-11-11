// Goal first planning: start from what a student wants, then work back.
//
//   interests (RIASEC)  ->  job sectors (work.json)  ->  a role and its route
//   ->  the place that leads there (pathways.json)  ->  a course family
//   (families.json)  ->  what that asks of each school year  ->  the moves.
//
// The goal never ranks places and never closes one: it picks one place to
// read the plan against, the same reach engine as everywhere else. Course
// family requirements are the 2026 lists and are shown as to confirm; they
// only become rules for JC, polytechnic and PFP, where the lists are firm
// enough to read. ITE and arts families stay as interest groups.
//
// Pure: no DOM, no storage.

import { reach } from './reach.js?v=7.0.0';
import { evalPlan, isLower, PLAN_YEARS } from './years.js?v=7.0.0';
import { advise, listNames } from './advice.js?v=7.0.0';

const RULE_DESTS = new Set(['jc', 'mi', 'poly', 'pfp']);

/** Sectors that share a code with the picks, most shared first, data order after. */
export function sectorsFor(codes, work) {
  const pick = new Set(codes || []);
  return ((work && work.sectors) || [])
    .map((s, i) => ({ s, i, n: (s.riasec || []).filter((c) => pick.has(c)).length }))
    .filter((x) => !pick.size || x.n > 0)
    .sort((a, b) => b.n - a.n || a.i - b.i)
    .map((x) => x.s);
}

/** The places a sector's roles lead through, with the roles for each. */
export function placesFor(sector, goals, destinations) {
  const out = new Map();
  ((sector && sector.entries) || []).forEach((e) => {
    ((goals.levelDests || {})[e.level] || []).forEach((id) => {
      const d = destinations.find((x) => x.id === id);
      if (!d) return;
      if (!out.has(id)) out.set(id, { dest: d, roles: [] });
      out.get(id).roles.push(e);
    });
  });
  // Data order of the places, never a ranking.
  return [...out.values()].sort((a, b) => (a.dest.order || 0) - (b.dest.order || 0));
}

/** Course families at a place that fit the sector, in plain names. */
export function familiesFor(sectorId, destId, goals, families) {
  const fit = new Set(((goals.sectorFamilies || {})[sectorId]) || []);
  return (((families || {}).destinations || {})[destId] || [])
    .filter((f) => !sectorId || fit.has(f.id))
    .map((f) => ({ id: f.id, name: (goals.familyNames || {})[f.id] || f.name, needs: f.needs || [], rules: RULE_DESTS.has(destId) }));
}

/** A family's subject needs as reach rules (JC, polytechnic, PFP only). */
export function familyRules(family, subjects) {
  if (!family || !family.rules) return [];
  const byId = new Map((subjects || []).map((s) => [s.id, s]));
  return family.needs.filter((n) => (n.subjects || []).length && n.minLevel).map((n) => {
    const names = n.subjects.map((id) => (byId.get(id) || {}).name).filter(Boolean);
    const label = names.length <= 3 ? `${listNames(names, 'or')} at ${n.minLevel}` : `One of ${names.length} relevant subjects at ${n.minLevel}`;
    return { label, short: names.length <= 2 ? `${names[0]} to ${n.minLevel}` : `A relevant subject at ${n.minLevel}`, move: `Take ${label}`, test: { type: 'anyAtLevel', subjects: n.subjects, min: n.minLevel }, status: 'provisional', family: true };
  });
}

/** The goal place as the engine should read it in a year: in Sec 3 onwards, with the family's needs added. */
export function goalDestination(goal, yearId, ctx, data) {
  const d = (ctx.destinations || []).find((x) => x.id === goal.dest);
  if (!d) return null;
  if (isLower(yearId) || !goal.family) return d;
  const fam = familiesFor(null, goal.dest, data.goals || {}, data.families).find((f) => f.id === goal.family);
  return { ...d, structural: [...(d.structural || []), ...familyRules(fam, ctx.subjects)] };
}

/** Where the goal stands on a year's plan. */
export function goalReach(goal, yearId, plan, ctx, data) {
  const d = goalDestination(goal, yearId, ctx, data);
  if (!d) return null;
  const ep = evalPlan(yearId, plan || {}, ctx.subjects);
  return reach(ep, d, { ...ctx, plan: ep, yearId });
}

/** The moves on a year's plan that bring the goal closer, best first. */
export function goalMoves(goal, yearId, plan, ctx) {
  if (!goal || !plan || !Object.keys(plan).length) return [];
  const d = (ctx.destinations || []).find((x) => x.id === goal.dest);
  if (!d) return [];
  const name = d.railName || d.name;
  const a = advise({ yearId, plan, ctx });
  return [...a.singles, ...a.pairs].filter((m) => (m.opens || []).includes(name) || (m.nearer || []).includes(name));
}

/**
 * What the goal asks, year by year, read against each year's plan where the
 * student has one. Lower years read the Sec 1 and 2 rules; Sec 3 onwards the
 * SEC rules and the course family's needs.
 */
export function workBack(goal, plans, ctx, data) {
  return PLAN_YEARS.filter((y) => y !== 'sec5').map((y) => {
    const plan = (plans || {})[y] || {};
    const has = Object.keys(plan).length > 0;
    const r = goalReach(goal, y, plan, ctx, data);
    return {
      yearId: y,
      has,
      state: has && r ? r.state : null,
      asks: r ? [...r.met.map((m) => ({ ...m, met: has })), ...r.gap.map((g) => ({ ...g, met: false }))].filter((x) => !x.soft) : [],
      horizon: r ? r.horizon : null,
    };
  });
}
