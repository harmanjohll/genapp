// The reach engine. Every mode calls this and nothing else decides what a
// student is told about a destination.
//
// THE INVARIANT
//
//   There is no 'locked' state. It does not exist in the data model, it cannot
//   be returned by this function, and when a destination is not currently open
//   there is always at least one named onward route attached to it.
//
// This is not a copy guideline that a careless edit could quietly break. It is
// checked: runInvariantSweep() below generates plan states across the whole
// range, from an empty plan to a full one, and fails loudly if any destination
// ever returns a dead end. Run it with ?dev=1.
//
// The reason is simple. This app is used by fourteen year olds who are already
// frightened. A padlock is a claim about a person's future that no aggregate
// entitles anyone to make.

import { evaluate, moveFor, moveTiming, meets, subjectLevel } from './rules.js';

export const STATES = {
  'open':         { label: 'Open now',        order: 0 },
  'within-reach': { label: 'Within reach',    order: 1 },
  'longer-route': { label: 'A longer road',   order: 2 },
  'other-route':  { label: 'Another road in', order: 3 },
};

// Routes that exist for essentially anyone, at any point, regardless of what
// happened at sixteen. Used as the backstop that makes an empty route list
// impossible.
const UNIVERSAL_ROUTES = ['work_study', 'later_degree'];

export function reach(plan, destination, ctx) {
  const ruleResults = (destination.structural || []).map((rule) => {
    const res = evaluate(rule.test, plan, ctx);
    return { rule, res };
  });

  const hard = ruleResults.filter(({ rule }) => !rule.soft);
  const unmetHard = hard.filter(({ res }) => !res.satisfied);
  const distance = unmetHard.reduce((sum, { res }) => sum + (res.distance || 0), 0);

  let state;
  if (unmetHard.length === 0) state = 'open';
  else if (distance <= 2) state = 'within-reach';
  else if (distance <= 5) state = 'longer-route';
  else state = 'other-route';

  const met = ruleResults
    .filter(({ res }) => res.satisfied)
    .map(({ rule }) => ({ label: rule.label, satisfied: true, soft: !!rule.soft, status: rule.status }));

  const gap = ruleResults
    .filter(({ res }) => !res.satisfied)
    .map(({ rule, res }) => ({
      label: rule.label,
      satisfied: false,
      soft: !!rule.soft,
      distance: res.distance,
      status: rule.status,
    }));

  const timing = moveTiming(ctx.yearId);
  const moves = ruleResults
    .filter(({ res }) => !res.satisfied)
    .map(({ rule, res }) => ({
      label: moveFor(rule, res, { ...ctx, plan }),
      when: timing.when,
      who: timing.who,
      soft: !!rule.soft,
    }));

  const routes = resolveRoutes(destination, state, ctx);

  return {
    id: destination.id,
    name: destination.name,
    state,
    distance,
    met,
    gap,
    moves,
    routes,
    performance: destination.performance || [],
    alsoIn: destination.alsoIn || [],
    feels: destination.feels,
    duration: destination.duration,
    leadsTo: destination.leadsTo,
    status: destination.status,
    asOf: (ctx.pathwaysMeta && ctx.pathwaysMeta.accessed) || null,
  };
}

function resolveRoutes(destination, state, ctx) {
  const byId = ctx.routesById || {};
  let ids = destination.routesIfNotHere || [];

  // The backstop. If a destination is not currently open and nobody wrote it a
  // specific onward route, it still gets the universal ones, because they are
  // genuinely true for anyone.
  if (state !== 'open' && ids.length === 0) ids = UNIVERSAL_ROUTES;

  const routes = ids.map((id) => byId[id]).filter(Boolean);

  // Belt and braces. If the data was edited badly and none of the named routes
  // resolved, fall back rather than render nothing.
  if (state !== 'open' && routes.length === 0) {
    return UNIVERSAL_ROUTES.map((id) => byId[id]).filter(Boolean);
  }
  return routes;
}

/** Sort destinations for display: open first, then by how close they are. */
export function sortReaches(list) {
  return list.slice().sort((a, b) => {
    const d = STATES[a.state].order - STATES[b.state].order;
    return d !== 0 ? d : a.distance - b.distance;
  });
}

/**
 * Everything a student could do next, gathered across all destinations and
 * deduplicated. This is the "what would move this" list, and it is the reason
 * the app exists: a decision is only useful if it comes with an action.
 */
export function allMoves(reaches) {
  const seen = new Map();
  reaches.forEach((r) => {
    if (r.state === 'open') return;
    r.moves.forEach((m) => {
      if (!seen.has(m.label)) seen.set(m.label, { ...m, opens: [] });
      seen.get(m.label).opens.push(r.name);
    });
  });
  return [...seen.values()].sort((a, b) => b.opens.length - a.opens.length);
}

// ---------------------------------------------------------------------------
// The invariant sweep. Enabled with ?dev=1.
// ---------------------------------------------------------------------------

export function runInvariantSweep(ctx) {
  const failures = [];
  const plans = generatePlans(ctx.subjects);
  let checks = 0;

  plans.forEach((plan, planIndex) => {
    ctx.destinations.forEach((dest) => {
      const r = reach(plan, dest, { ...ctx, plan });
      checks += 1;

      if (!STATES[r.state]) {
        failures.push({ planIndex, dest: dest.id, why: `unknown state "${r.state}"` });
      }
      if (r.state === 'locked') {
        failures.push({ planIndex, dest: dest.id, why: 'a locked state was produced' });
      }
      if (r.state !== 'open' && r.routes.length === 0) {
        failures.push({ planIndex, dest: dest.id, why: 'not open and no onward route' });
      }
      if (r.state !== 'open' && r.moves.length === 0) {
        failures.push({ planIndex, dest: dest.id, why: 'not open and nothing a student could do' });
      }
    });
  });

  const ok = failures.length === 0;
  const style = ok ? 'color:#2F7D5B;font-weight:700' : 'color:#B23A2A;font-weight:700';
  console.log(
    `%cReach invariant: ${ok ? 'PASS' : 'FAIL'} (${checks} checks over ${plans.length} plan states)`,
    style
  );
  if (!ok) {
    console.table(failures.slice(0, 40));
    console.error(`${failures.length} invariant failures. A student would have been shown a dead end.`);
  }
  return { ok, checks, plans: plans.length, failures };
}

/** A spread of plan states from empty to full, including deliberately awkward ones. */
function generatePlans(subjects) {
  const ids = subjects.map((s) => s.id);
  const plans = [{}];

  // Every single subject alone, at each level it is offered.
  subjects.forEach((s) => {
    s.levels.forEach((lv) => plans.push({ [s.id]: lv }));
  });

  // Uniform plans of increasing size at each level.
  ['G1', 'G2', 'G3'].forEach((lv) => {
    [1, 3, 5, 7, 9].forEach((n) => {
      const plan = {};
      subjects
        .filter((s) => s.levels.includes(lv))
        .slice(0, n)
        .forEach((s) => { plan[s.id] = lv; });
      if (Object.keys(plan).length) plans.push(plan);
    });
  });

  // Mixed plans, which are the whole point of Full SBB and the most likely to
  // break naive rule logic.
  for (let seed = 0; seed < 24; seed += 1) {
    const plan = {};
    subjects.forEach((s, i) => {
      if ((i + seed) % 3 === 0) return;
      const choices = s.levels;
      plan[s.id] = choices[(i + seed) % choices.length];
    });
    plans.push(plan);
  }

  // Everything, at the top level each subject offers.
  const everything = {};
  subjects.forEach((s) => { everything[s.id] = s.levels[s.levels.length - 1]; });
  plans.push(everything);

  // And the pathological one: a single subject at the lowest level.
  if (ids.length) plans.push({ [ids[0]]: 'G1' });

  return plans;
}
