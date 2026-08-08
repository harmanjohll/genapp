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

import { evaluate, moveFor, moveShortFor, moveTiming } from './rules.js?v=2.4.0';

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

/**
 * The plan as the destination rules should see it: upper secondary only.
 *
 * Lower secondary subjects live in the same plan object, because English and
 * Maths genuinely are the same subject at Sec 1 and Sec 4 and raising one at
 * thirteen is exactly the fact the polytechnic rule reads at sixteen. But the
 * lower secondary only rows must never reach a `countAtLevel`. Lower secondary
 * Science is ONE subject that becomes one to three upper secondary ones, and
 * Geography and History are taken by everybody rather than chosen, so counting
 * them would tell a Sec 1 student they already satisfy "four subjects at G3"
 * when they have not yet chosen a single upper secondary subject.
 *
 * Filtering here rather than at each call site means the invariant sweep, the
 * monotonicity sweep and all three modes get the same answer. Monotonicity is
 * unaffected: a filtered out subject contributes nothing either way, so adding
 * one leaves every distance exactly where it was.
 */
export function upperPlan(plan, subjects) {
  const lower = new Set((subjects || []).filter((s) => s.phase === 'lower').map((s) => s.id));
  if (!lower.size) return plan;
  const out = {};
  Object.keys(plan || {}).forEach((id) => { if (!lower.has(id)) out[id] = plan[id]; });
  return out;
}

export function reach(rawPlan, destination, ctx) {
  const plan = upperPlan(rawPlan, ctx.subjects);
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
      short: moveShortFor(rule, res, { ...ctx, plan }),
      when: timing.when,
      who: timing.who,
      soft: !!rule.soft,
      hard: !rule.soft,
    }));

  const routes = resolveRoutes(destination, state, ctx);

  return {
    id: destination.id,
    name: destination.name,
    railName: destination.railName || destination.name,
    // The data's own display order rides along. v1 dropped it here, and the
    // caller's "restore data order" sort silently compared undefined to
    // undefined, so the list re-sorted by state and distance on every tap:
    // a ranking, which is the one thing this app must never draw.
    order: destination.order || 0,
    state,
    status: statusLine(destination, state, moves),
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
    dataStatus: destination.status,
    asOf: (ctx.pathwaysMeta && ctx.pathwaysMeta.accessed) || null,
  };
}

/**
 * The one line a list row shows. Four or five words.
 *
 * "Open now" is a strong claim and it is not always true. Three destinations
 * need it qualified, and the qualification is the honest part:
 *   arts  is open on a portfolio, not on a plan
 *   sec5  is decided by SEC results, not by a subject plan
 *   jc    can be structurally open with Mathematics at G3 still unmet, because
 *         that rule is soft and OPEN_QUESTIONS flags it as an unverified guess
 * A row with no room for the qualifier prints a verdict the data does not support.
 */
function statusLine(destination, state, moves) {
  if (state === 'open') {
    const softGap = moves.find((m) => m.soft);
    if (softGap) return { text: `Open, ${softGap.short} usually needed`, tone: 'open' };
    return { text: destination.openLabel || 'Open now', tone: 'open' };
  }
  const hard = moves.filter((m) => m.hard);
  const top = hard[0] || moves[0];
  return { text: top ? `Next, ${top.short}` : 'A road in', tone: state };
}

/**
 * The lever: the single move that opens or advances the most destinations.
 *
 * A student with a low plan otherwise sees the same move repeated down every
 * row, which reads as a wall. Collapsed into one line it reads as an action.
 * This is the highest value line on the screen and it is why the destination
 * list does not need to show distance at all.
 */
export function lever(reaches) {
  const tally = new Map();
  reaches.forEach((r) => {
    if (r.state === 'open') return;
    const seen = new Set();
    r.moves.filter((m) => m.hard).forEach((m) => {
      if (seen.has(m.short)) return;
      seen.add(m.short);
      if (!tally.has(m.short)) tally.set(m.short, { ...m, opens: [] });
      tally.get(m.short).opens.push(r.railName);
    });
  });
  const ranked = [...tally.values()].sort((a, b) => b.opens.length - a.opens.length);
  return ranked[0] || null;
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
      if (!r.status || !r.status.text) {
        failures.push({ planIndex, dest: dest.id, why: 'row has no status line' });
      }
      if (!dest.railName || dest.railName.length > 22) {
        failures.push({ planIndex, dest: dest.id, why: 'railName missing or over 22 characters' });
      }
    });
  });

  failures.push(...monotonicityFailures(ctx));
  failures.push(...classCodeFailures(ctx));

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

/**
 * THE MONOTONICITY INVARIANT
 *
 * Adding a subject, or raising one a level, must never increase the distance to
 * any destination.
 *
 * This is the property that makes "no door moves away from you" true rather
 * than merely promised. Without it a student on a mostly G1 plan can enter an
 * honest picture of themselves and watch destinations recede, which is the
 * cruellest thing this app could possibly do and it would do it silently, in
 * arithmetic, underneath copy that says the opposite.
 *
 * Checked over every subject at every level it is offered at, from a spread of
 * starting plans.
 */
function monotonicityFailures(ctx) {
  const out = [];
  const starts = [{}, ...seedPlans(ctx.subjects)];

  starts.forEach((start, si) => {
    const before = ctx.destinations.map((d) => reach(start, d, { ...ctx, plan: start }));

    ctx.subjects.forEach((s) => {
      s.levels.forEach((lv) => {
        const have = start[s.id];
        // Only additions and raises. Removing or lowering may legitimately
        // increase distance, because the student undid something.
        if (have && LEVEL_ORDER(lv) <= LEVEL_ORDER(have)) return;

        const after = { ...start, [s.id]: lv };
        ctx.destinations.forEach((d, di) => {
          const a = reach(after, d, { ...ctx, plan: after });
          if (a.distance > before[di].distance) {
            out.push({
              planIndex: `seed${si}`,
              dest: d.id,
              why: `distance rose ${before[di].distance} to ${a.distance} on adding ${s.id} at ${lv}`,
            });
          }
        });
      });
    });
  });
  return out;
}

function LEVEL_ORDER(lv) { return { G1: 1, G2: 2, G3: 3 }[lv] || 0; }

function seedPlans(allSubjects) {
  const subjects = allSubjects.filter((s) => (s.levels || []).length);
  const seeds = [];
  ['G1', 'G2', 'G3'].forEach((lv) => {
    const p = {};
    subjects.filter((s) => s.levels.includes(lv)).slice(0, 5).forEach((s) => { p[s.id] = lv; });
    if (Object.keys(p).length) seeds.push(p);
  });
  // A realistic mixed plan, which is the normal case under Full SBB.
  const mixed = {};
  subjects.slice(0, 8).forEach((s, i) => { mixed[s.id] = s.levels[i % s.levels.length]; });
  seeds.push(mixed);
  return seeds;
}

/** A spread of plan states from empty to full, including deliberately awkward ones. */
function generatePlans(allSubjects) {
  // Rows with no levels (the lower secondary common curriculum, which everyone
  // takes and which is not banded) cannot appear in a generated plan at all.
  const subjects = allSubjects.filter((s) => (s.levels || []).length);
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

// --- the class code ---------------------------------------------------------
//
// A room cannot see its own spread, and this app has no server to give it one.
// The thesis of the whole resource, that there is no best combination and that
// between them a class already holds every destination, is the one claim a
// student cannot verify alone. So each screen shows five characters, students
// read them out, and the teacher's own browser does the arithmetic. Nothing
// leaves any device except what a student chooses to say in the room.
//
// Five characters, base 36: kind letter, subject count, G3 count, and an eight
// bit mask of which destinations are open, one bit per destination in the
// order the data gives them. Short enough to read across a classroom, and it
// carries no name, no grade and no way back to a person.

const B36 = (n) => Math.max(0, Math.min(35, Math.round(n))).toString(36).toUpperCase();

export function classCode(plan, wantKindLetter, reaches) {
  const n = Object.keys(plan || {}).length;
  const g3 = Object.values(plan || {}).filter((l) => l === 'G3').length;
  // Bit i is destination i IN DATA ORDER, for every student, or the union
  // means nothing. v1 took the caller's list as given, the caller passed a
  // state-sorted list, and every mask degenerated into a prefix of 1s: the
  // teacher's "this room holds N of the 8" was silently the single strongest
  // student's count. Ordering here, inside the encoder, makes the contract
  // structural instead of a comment in another file.
  const inDataOrder = (reaches || []).slice()
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  let mask = 0;
  inDataOrder.forEach((r, i) => { if (i < 8 && r.state === 'open') mask |= (1 << i); });
  return `${(wantKindLetter || '-').toUpperCase()}${B36(n)}${B36(g3)}${mask.toString(36).toUpperCase().padStart(2, '0')}`;
}

/**
 * The round trip the classroom depends on. Two synthetic students, codes
 * encoded exactly as the share sheet encodes them, union decoded exactly as
 * the teacher page decodes it, compared against ground truth. v1 failed this
 * in the field: a strong student's mask claimed the whole room. Even a
 * DELIBERATELY state-sorted input must survive, because the encoder now owns
 * the ordering.
 */
function classCodeFailures(ctx) {
  const out = [];
  const plans = [
    Object.fromEntries(ctx.subjects.filter((s) => (s.levels || []).includes('G3')).slice(0, 6).map((s) => [s.id, 'G3'])),
    Object.fromEntries(ctx.subjects.filter((s) => (s.levels || []).includes('G1')).slice(0, 6).map((s) => [s.id, 'G1'])),
  ];
  const truth = new Set();
  let union = 0;
  plans.forEach((plan) => {
    const rs = ctx.destinations.map((d) => reach(plan, d, { ...ctx, plan }));
    rs.forEach((r) => { if (r.state === 'open') truth.add(r.id); });
    // Worst-case caller: hand the encoder a state-sorted list on purpose.
    const decoded = readClassCode(classCode(plan, 'R', sortReaches(rs)));
    if (!decoded) { out.push({ why: 'class code failed to parse its own output' }); return; }
    union |= decoded.mask;
  });
  let held = 0;
  for (let i = 0; i < ctx.destinations.length && i < 8; i += 1) if (union & (1 << i)) held += 1;
  if (held !== truth.size) {
    out.push({ why: `class code union says ${held} destinations held, ground truth is ${truth.size}` });
  }
  return out;
}

export function readClassCode(code) {
  const s = String(code || '').trim().toUpperCase();
  if (!/^[RIASEC-][0-9A-Z][0-9A-Z][0-9A-Z]{2}$/.test(s)) return null;
  const val = (c) => parseInt(c, 36);
  const mask = parseInt(s.slice(3, 5), 36);
  if (Number.isNaN(mask)) return null;
  return { kind: s[0], subjects: val(s[1]), g3: val(s[2]), mask };
}
