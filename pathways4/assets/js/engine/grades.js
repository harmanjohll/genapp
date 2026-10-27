// Grades, as targets. v3 refused to touch grades at all; v4 lets a student
// (or a parent, or a teacher in conversation) enter the grades they expect
// now and the grades they are aiming for, and turns both into the scores
// each destination actually reads. It is goal setting, and it says so: the
// numbers are the student's own, never the app's guess about them.
//
// What it computes, from data/grades.json:
//   L1R4     JC 16, MI 20. Five subjects, all G3.
//   ELR2B2   Polytechnic 22. Four at G3, the fifth at its G2 value.
//   ELMAB3   PFP 12, two year Higher Nitec 19, Sec 5 21. All at G2 value.
// And, for any score short of a cut off, the smallest set of grade steps
// in the subjects being counted that would close the gap, by name.
//
// Pure: no DOM, no storage.

const HUM = ['hum_ss_geog', 'hum_ss_hist', 'hum_ss_lit', 'geography', 'history', 'literature', 'art', 'higher_art', 'music', 'higher_music', 'economics'];
const MS = ['maths', 'amaths', 'sci_pc', 'sci_pb', 'sci_cb', 'physics', 'chemistry', 'biology'];

export function gradesFor(level, g) {
  return ((g.scales || {})[level] || {}).grades || [];
}

function pts(level, grade, g) {
  const sc = (g.scales || {})[level];
  return sc && sc.points[grade] != null ? sc.points[grade] : null;
}

/** A grade's value read at G2. G3 maps down; G1 has no upward mapping. */
function asG2(level, grade, g) {
  if (level === 'G2') return grade;
  if (level === 'G3') return (g.mapDown.G3toG2 || {})[grade] || null;
  return null;
}

/** The entries a score can be built from: held subjects with a valid grade. */
export function entries(plan, grades, g, names) {
  return Object.entries(plan || {}).map(([sid, level]) => {
    const grade = grades && grades[sid];
    if (!gradesFor(level, g).includes(grade)) return null;
    return { sid, level, grade, name: (names && names[sid]) || sid };
  }).filter(Boolean);
}

// Small sets, so exhaustive search is both exact and cheap.
function bestAssign(slots, pool, value) {
  let best = null;
  const used = new Set();
  const pick = [];
  const go = (i, sum) => {
    if (best && sum >= best.sum) return;
    if (i === slots.length) { best = { sum, pick: pick.slice() }; return; }
    pool.forEach((e) => {
      if (used.has(e.sid) || !slots[i](e)) return;
      const v = value(e);
      if (v == null) return;
      used.add(e.sid); pick.push(e);
      go(i + 1, sum + v);
      used.delete(e.sid); pick.pop();
    });
  };
  go(0, 0);
  return best;
}

function l1r4(es, g) {
  const g3 = es.filter((e) => e.level === 'G3');
  const v = (e) => pts('G3', e.grade, g);
  const best = bestAssign([
    (e) => e.sid === 'el' || e.sid === 'hmtl',
    (e) => HUM.includes(e.sid),
    (e) => MS.includes(e.sid),
    (e) => HUM.includes(e.sid) || MS.includes(e.sid),
    () => true,
  ], g3, v);
  if (!best) return { value: null, why: 'Needs English plus four more subjects at G3, including a Humanities and a Maths or Science, each with a grade.' };
  return { value: best.sum, counted: best.pick.map((e) => ({ ...e, pts: v(e), read: 'G3' })) };
}

function elr2b2(es, g, r1 = null, r2 = null) {
  const g3 = es.filter((e) => e.level === 'G3' && e.grade !== '9');
  const v3 = (e) => pts('G3', e.grade, g);
  const b2v = (e) => {
    const gg = asG2(e.level, e.grade, g);
    if (!gg || ['5', '6'].includes(gg)) return null;
    return pts('G2', gg, g);
  };
  const slots = [
    (e) => e.sid === 'el',
    (e) => (r1 ? r1.includes(e.sid) : e.sid !== 'el'),
    (e) => (r2 ? r2.includes(e.sid) : e.sid !== 'el'),
    (e) => e.sid !== 'el',
  ];
  // Four G3 slots, then the fifth from anything left at its G2 value.
  let best = null;
  const first = bestAssignAll(slots, g3, v3);
  first.forEach((cand) => {
    const left = es.filter((e) => !cand.pick.some((p) => p.sid === e.sid));
    const b2 = left.map((e) => ({ e, val: b2v(e) })).filter((x) => x.val != null).sort((a, b) => a.val - b.val)[0];
    if (!b2) return;
    const sum = cand.sum + b2.val;
    if (!best || sum < best.sum) best = { sum, pick: cand.pick, b2: b2.e, b2v: b2.val };
  });
  if (!best) return { value: null, why: 'Needs English and three more at G3, plus a fifth subject at G2 or above, each with a grade.' };
  return {
    value: best.sum,
    counted: [...best.pick.map((e) => ({ ...e, pts: v3(e), read: 'G3' })), { ...best.b2, pts: best.b2v, read: 'G2 value' }],
  };
}

// Every distinct assignment, so the fifth slot can be chosen against each.
function bestAssignAll(slots, pool, value) {
  const out = [];
  const used = new Set();
  const pick = [];
  const go = (i, sum) => {
    if (i === slots.length) { out.push({ sum, pick: pick.slice() }); return; }
    pool.forEach((e) => {
      if (used.has(e.sid) || !slots[i](e)) return;
      const v = value(e);
      if (v == null) return;
      used.add(e.sid); pick.push(e);
      go(i + 1, sum + v);
      used.delete(e.sid); pick.pop();
    });
  };
  go(0, 0);
  return out;
}

function elmab3(es, g) {
  const v = (e) => { const gg = asG2(e.level, e.grade, g); return gg ? pts('G2', gg, g) : null; };
  const best = bestAssign([
    (e) => e.sid === 'el',
    (e) => e.sid === 'maths' || e.sid === 'amaths',
    (e) => e.sid !== 'el', (e) => e.sid !== 'el', (e) => e.sid !== 'el',
  ], es.filter((e) => e.level !== 'G1'), v);
  if (!best) return { value: null, why: 'Needs English, Mathematics and three more subjects at G2 or G3, each with a grade.' };
  return { value: best.sum, counted: best.pick.map((e) => ({ ...e, pts: v(e), read: 'G2 value' })) };
}

const CALC = { L1R4: l1r4, ELR2B2: elr2b2, ELMAB3: elmab3 };

/** One grade better, as read by this aggregate (G2 value or G3). */
function stepUp(e, g) {
  const list = gradesFor(e.level, g);
  const i = list.indexOf(e.grade);
  for (let j = i - 1; j >= 0; j -= 1) {
    const cand = list[j];
    if (e.read === 'G3') return cand;
    const now = asG2(e.level, e.grade, g); const then = asG2(e.level, cand, g);
    if (now !== then) return cand;
  }
  return null;
}

/** The grade steps that would close `gap` points, worst counted grade first. */
export function stepsToClose(counted, gap, g) {
  const work = counted.map((e) => ({ ...e }));
  const steps = [];
  let left = gap;
  let guard = 40;
  while (left > 0 && guard > 0) {
    guard -= 1;
    work.sort((a, b) => b.pts - a.pts);
    const e = work.find((x) => stepUp(x, g));
    if (!e) break;
    const to = stepUp(e, g);
    const prev = steps.find((s) => s.sid === e.sid);
    if (prev) prev.to = to; else steps.push({ sid: e.sid, name: e.name, from: e.grade, to });
    e.grade = to;
    e.pts -= 1;
    left -= 1;
  }
  return left > 0 ? null : steps;
}

/**
 * @returns Array<{ id, name, plain, now, target, dests: [{ id, name, cutoff, nowMeets, targetMeets, gap, steps }] }>
 */
export function report({ plan, grades, g, names, destNames }) {
  return (g.aggregates || []).map((a) => {
    const calc = CALC[a.id];
    const now = calc(entries(plan, grades.now, g, names), g);
    const target = calc(entries(plan, grades.target, g, names), g);
    const ref = target.value != null ? target : now;
    const dests = a.dests.map((d) => {
      const gap = ref.value != null ? ref.value - d.cutoff : null;
      return {
        id: d.id,
        name: (destNames && destNames[d.id]) || d.id,
        cutoff: d.cutoff,
        nowMeets: now.value != null ? now.value <= d.cutoff : null,
        targetMeets: target.value != null ? target.value <= d.cutoff : null,
        gap,
        steps: gap != null && gap > 0 ? stepsToClose(ref.counted, gap, g) : null,
      };
    });
    return { id: a.id, name: a.name, plain: a.plain, bonus: a.bonus, now, target, dests, basis: target.value != null ? 'target' : 'now' };
  });
}

/** Polytechnic by course type, for the course families view. */
export function polyByType(plan, grades, g, names, families) {
  const fam = (families && families.poly) || [];
  const es = entries(plan, grades, g, names);
  return fam.map((f) => {
    const [n1, n2] = f.needs;
    const r = elr2b2(es, g, n1 && n1.subjects, n2 && n2.subjects);
    return { id: f.id, name: f.name, value: r.value, why: r.why };
  });
}

/** Sweep for tools/verify.mjs: known plans produce known scores. */
export function gradesSweep(g) {
  const fails = [];
  const plan = { el: 'G3', maths: 'G3', mtl: 'G2', sci_pc: 'G3', hum_ss_geog: 'G3', poa: 'G3' };
  const grades = { now: { el: 'B3', maths: 'A2', mtl: '2', sci_pc: 'B4', hum_ss_geog: 'C5', poa: 'B3' }, target: {} };
  const r = Object.fromEntries(report({ plan, grades, g }).map((x) => [x.id, x]));
  // L1R4: EL B3(3) + Hum C5(5) + Maths A2(2) + Sci B4(4) + POA B3(3) = 17
  if (r.L1R4.now.value !== 17) fails.push(`L1R4 expected 17, got ${r.L1R4.now.value}`);
  // ELR2B2: EL 3 + best three G3 others (2,3,4) + B2 = MTL 2 at G2 -> 3+2+3+4+2 = 14
  if (r.ELR2B2.now.value !== 14) fails.push(`ELR2B2 expected 14, got ${r.ELR2B2.now.value}`);
  // ELMAB3 at G2: EL B3->1, Maths A2->1, best three of {MTL 2, Sci B4->2, Hum C5->2, POA B3->1} = 1+2+2 -> 7
  if (r.ELMAB3.now.value !== 7) fails.push(`ELMAB3 expected 7, got ${r.ELMAB3.now.value}`);
  const jc = r.L1R4.dests.find((d) => d.id === 'jc');
  if (!jc.steps || jc.steps.length === 0) fails.push('no steps offered to close a one point JC gap');
  return { ok: !fails.length, fails };
}
