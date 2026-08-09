// The nearer horizon: a lower secondary plan, read as the Sec 3 combination
// that usually follows it.
//
// A thirteen year old looking at polytechnic admission criteria is being shown
// something four years away and nothing they can act on this year. What they
// can act on is their levels, and the thing worth showing them is what those
// levels currently point at, plus what one move would change.
//
// This is an inference and it is labelled as one everywhere it renders. It is
// never written to state, never tappable, and never phrased in the future
// tense. The student's own levels are the fact; this is what usually follows.
//
// TWO RULES THIS FILE EXISTS TO GET RIGHT
//
// 1. English, Mother Tongue and Maths are not projected at all. They carry
//    phase "both" and live in the plan under the same key at Sec 1 and Sec 4,
//    which is exactly why raising English at thirteen flips the polytechnic
//    rule directly rather than through a translation layer.
//
// 2. The Humanities collapse is HIGHEST LEVEL WINS, with the declared order
//    only as a tiebreak. Picking by declared order first would mean a student
//    holding History at G2 who then adds Geography at G1 watches the projected
//    Humanities row drop from G2 to G1, the count fall, and a door move away
//    from them for telling the truth about a subject they take. That is the
//    single cruellest thing this app could do and it is why projectionSweep
//    tests additions as well as raises.

import { reach } from './reach.js?v=2.6.0';

const LV = { G1: 1, G2: 2, G3: 3 };

// Lower secondary Science is one integrated subject. At Sec 3 it becomes one
// to three upper secondary ones, so it projects to exactly ONE row: projecting
// three would inflate the count and make the whole horizon arithmetic fiction.
const SCIENCE = { G1: 'science_g1', G2: 'sci_pc', G3: 'sci_pc' };

// Declared order, used only to break a tie between equal levels.
const HUMS = [
  ['ls_geography', 'hum_ss_geog'],
  ['ls_history', 'hum_ss_hist'],
  ['ls_literature', 'hum_ss_lit'],
];

/**
 * @param {Object} plan the student's plan, lower and both phase rows together
 * @param {Array}  subjects every subject row
 * @returns {{plan: Object, rows: Array<{from: string, to: string, level: string}>}}
 */
export function project(plan, subjects) {
  const byId = new Map((subjects || []).map((s) => [s.id, s]));
  const out = {};
  const rows = [];

  // Carry everything that is not lower secondary only. That is the whole of
  // rule 1 above: no translation, same key, same level.
  Object.keys(plan || {}).forEach((id) => {
    const s = byId.get(id);
    if (s && s.phase === 'lower') return;
    out[id] = plan[id];
  });

  const sci = plan && plan.ls_science;
  if (sci && SCIENCE[sci]) {
    out[SCIENCE[sci]] = sci;
    rows.push({ from: 'ls_science', to: SCIENCE[sci], level: sci });
  }

  let best = null;
  HUMS.forEach(([lowId, upId]) => {
    const lv = plan && plan[lowId];
    if (!lv) return;
    if (!best || LV[lv] > LV[best.level]) best = { from: lowId, to: upId, level: lv };
  });
  if (best) {
    out[best.to] = best.level;
    rows.push(best);
  }

  return { plan: out, rows };
}

/** Reach over the projection. Identical engine, projected plan. */
export function projectedReaches(plan, ctx) {
  const p = project(plan, ctx.subjects).plan;
  return ctx.destinations.map((d) => reach(p, d, { ...ctx, plan: p }));
}

/**
 * One level move, and what it would move.
 *
 * Only subjects the student already holds, only upward, and only where the
 * junctures say that subject can move in the year they are actually in. The
 * result is monotone by construction, so this list can only ever contain gains.
 */
export function horizonMoves(plan, ctx, yearId) {
  const order = { sec1: 1, sec2: 2, sec3: 3, sec4: 4, sec5: 5 };
  const now = projectedReaches(plan, ctx);
  const before = new Map(now.map((r) => [r.id, r]));
  const out = [];

  (ctx.subjects || []).forEach((s) => {
    const have = plan[s.id];
    if (!have || !s.raisableFrom) return;
    if ((order[yearId] || 9) < (order[s.raisableFrom] || 0)) return;
    const next = (s.levels || []).find((lv) => LV[lv] === LV[have] + 1);
    if (!next) return;

    const after = projectedReaches({ ...plan, [s.id]: next }, ctx);
    const opens = [];
    after.forEach((r) => {
      const was = before.get(r.id);
      if (!was) return;
      if (was.state !== 'open' && r.state === 'open') opens.push(r.railName);
    });
    const nearer = after.filter((r) => {
      const was = before.get(r.id);
      return was && r.distance < was.distance && !(was.state !== 'open' && r.state === 'open');
    }).map((r) => r.railName);

    if (opens.length || nearer.length) {
      out.push({ id: s.id, name: s.shortName || s.name, from: have, to: next, opens, nearer });
    }
  });

  return out.sort((a, b) => (b.opens.length * 10 + b.nearer.length) - (a.opens.length * 10 + a.nearer.length));
}

/**
 * The sweep. Asserts the composition of project and reach is monotone over
 * ADDITIONS as well as raises, because the failure mode this file was written
 * to prevent is an addition: a low level Geography arriving beside a higher
 * level History. Mirrors monotonicityFailures in reach.js deliberately.
 */
export function projectionSweep(ctx) {
  const failures = [];
  const lower = (ctx.subjects || []).filter((s) => s.phase === 'lower' && (s.levels || []).length);
  const levels = ['G1', 'G2', 'G3'];

  const seeds = [{}];
  levels.forEach((lv) => {
    const p = {};
    lower.forEach((s) => { if ((s.levels || []).includes(lv)) p[s.id] = lv; });
    seeds.push(p);
  });
  // The dangerous shapes: one humanities high, the others absent or low.
  seeds.push({ ls_history: 'G3' });
  seeds.push({ ls_history: 'G3', ls_geography: 'G1' });
  seeds.push({ ls_history: 'G2', ls_literature: 'G1', ls_science: 'G3' });
  seeds.push({ el: 'G2', maths: 'G2', ls_science: 'G2', ls_geography: 'G2' });

  seeds.forEach((start, si) => {
    const before = projectedReaches(start, ctx);
    lower.concat((ctx.subjects || []).filter((s) => s.phase === 'both')).forEach((s) => {
      (s.levels || []).forEach((lv) => {
        const have = start[s.id];
        if (have && LV[lv] <= LV[have]) return;   // additions and raises only
        const after = projectedReaches({ ...start, [s.id]: lv }, ctx);
        after.forEach((r, i) => {
          if (r.distance > before[i].distance) {
            failures.push({
              seed: si, dest: r.id,
              why: `projected distance rose ${before[i].distance} to ${r.distance} on ${s.id} at ${lv}`,
            });
          }
        });
      });
    });
  });

  const ok = failures.length === 0;
  console.log(
    `%cProjection sweep: ${ok ? 'PASS' : 'FAIL'} (${seeds.length} lower plans)`,
    ok ? 'color:#2F7D5B;font-weight:700' : 'color:#B23A2A;font-weight:700'
  );
  if (!ok) { console.table(failures.slice(0, 40)); console.error(`${failures.length} projection failures`); }
  return { ok, failures };
}
