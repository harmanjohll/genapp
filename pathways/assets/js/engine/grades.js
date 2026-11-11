// Grades, as targets. v3 refused to touch grades at all; v4 lets a student
// (or a parent, or a teacher in conversation) enter the grades they expect
// now and the grades they are aiming for, and turns both into the scores
// each destination actually reads. It is goal setting, and it says so: the
// numbers are the student's own, never the app's guess about them.
//
// What it computes, from data/grades.json:
//   L1R4     JC 16, MI 20. Five subjects, all G3. A missed grade floor can
//            still be a conditional admission (grades.json, dests[].conditional).
//   ELR2B2   Polytechnic 22. Four at G3, the fifth at its G2 value.
//   ELMAB3   PFP 12, two year Higher Nitec 19, Sec 5 21. All at G2 value.
// Mother Tongue and Higher Mother Tongue of one language count once in any
// score (MOE, PSE pages, read 2026-11-11).
// And, for any score short of a cut off, the smallest set of grade steps
// in the subjects being counted that would close the gap, by name.
//
// Pure: no DOM, no storage.

// MOE's L1R4 subject groups for 2028. Art, Music and Economics are "Others"
// (R4 only); Higher Art and Higher Music are Humanities. Computing is "Others".
const HUM = ['hum_ss_geog', 'hum_ss_hist', 'hum_ss_lit', 'geography', 'history', 'literature', 'higher_art', 'higher_music'];
const MS = ['maths', 'amaths', 'sci_pc', 'sci_pb', 'sci_cb', 'physics', 'chemistry', 'biology'];

// One language, one count: Higher Mother Tongue and Mother Tongue share a key,
// so no score can hold both.
const once = (sid) => (sid === 'hmtl' ? 'mtl' : sid);

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
      if (used.has(once(e.sid)) || !slots[i](e)) return;
      const v = value(e);
      if (v == null) return;
      used.add(once(e.sid)); pick.push(e);
      go(i + 1, sum + v);
      used.delete(once(e.sid)); pick.pop();
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
    const left = es.filter((e) => !cand.pick.some((p) => once(p.sid) === once(e.sid)));
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
      if (used.has(once(e.sid)) || !slots[i](e)) return;
      const v = value(e);
      if (v == null) return;
      used.add(once(e.sid)); pick.push(e);
      go(i + 1, sum + v);
      used.delete(once(e.sid)); pick.pop();
    });
  };
  go(0, 0);
  return out;
}

// opts.exclude: G2 value grades this destination will not count (PFP drops
// 5 and 6, which also catches a G3 9; Sec 5 drops 6; Higher Nitec drops none).
function elmab3(es, g, opts = {}) {
  const ex = opts.exclude || [];
  const v = (e) => { const gg = asG2(e.level, e.grade, g); return gg && !ex.includes(gg) ? pts('G2', gg, g) : null; };
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
 * Grade floors (JC and MI): a score can be inside the cut off and still miss
 * a floor, such as English below C6. Returns the unmet floors.
 * A floor on a subject not taken (ifTaken) is not a floor. A floor can name
 * another subject that also meets it (alt): Higher Mother Tongue at E8 meets
 * the Mother Tongue floor.
 * `missed` is true when the student holds the subject at a level the floor
 * reads and the grade falls short. That is the case MOE's conditional
 * admission covers; a subject not taken at that level is a different gap.
 */
function unmetFloors(floors, es, g) {
  const ok = (e, t) => t[e.level] != null && pts(e.level, e.grade, g) != null && pts(e.level, e.grade, g) <= t[e.level];
  return (floors || []).map((f) => {
    const sets = [f, ...(f.alt || [])];
    const held = sets.flatMap((t) => es.filter((e) => (t.subjects || []).includes(e.sid)).map((e) => ({ e, t })));
    if (!held.length) return f.ifTaken ? null : { label: f.label, missed: false };
    if (held.some(({ e, t }) => ok(e, t))) return null;
    return { label: f.label, missed: held.some(({ e, t }) => t[e.level] != null) };
  }).filter(Boolean);
}

/**
 * G3 passes, for Sec 5's first route. MOE does not define a "G3 pass" on its
 * pages (read 2026-11-11). E8 or better is used here, the grade the SEC
 * certificate is awarded at; the words shown say it is to confirm.
 */
function g3Passes(es, g) {
  return es.filter((e) => e.level === 'G3' && pts('G3', e.grade, g) != null && pts('G3', e.grade, g) <= 8).length;
}

/**
 * Conditional admission (JC and MI, from the 2028 PSE): with a floor grade
 * missed, a student is still admitted when the score is `clear` or better,
 * or anywhere inside the cut off with every R subject at one of `rGrades`.
 * The R subjects are the four counted after L1.
 */
function conditional(d, r) {
  const c = d.conditional;
  if (!c || r.value == null || r.value > d.cutoff) return false;
  if (r.value <= c.clear) return true;
  const rs = (r.counted || []).slice(1);
  return rs.length === 4 && rs.every((e) => (c.rGrades || []).includes(e.grade));
}

/**
 * Subject minimums on top of a score (PFP, read at G2 grades): English,
 * Mathematics, one relevant subject, and two others. Which subjects are
 * relevant is set per cluster and the 2028 lists arrive in mid 2027, so this
 * checks what is certain: English, a Mathematics, and one more subject at the
 * relevant grade. The two others are inside `others` already, because the
 * destination excludes the grades below it.
 */
function meetsMins(m, es, g) {
  const v = (e) => { const gg = asG2(e.level, e.grade, g); return gg ? pts('G2', gg, g) : null; };
  const at = (e, max) => v(e) != null && v(e) <= max;
  const maths = es.filter((e) => (e.sid === 'maths' || e.sid === 'amaths') && at(e, m.ma));
  if (!es.some((e) => e.sid === 'el' && at(e, m.el)) || !maths.length) return false;
  return maths.some((mm) => es.some((e) => e.sid !== 'el' && once(e.sid) !== once(mm.sid) && e.sid !== mm.sid && at(e, m.relevant)));
}

/**
 * One destination's verdict on one set of grades: its own value (a
 * destination can exclude grades the aggregate allows), the floors, and any
 * route that does not need the score at all.
 */
function judge(a, d, es, g) {
  const calc = CALC[a.id];
  const r = d.exclude ? calc(es, g, { exclude: d.exclude }) : calc(es, g);
  if (d.g3Passes && g3Passes(es, g) >= d.g3Passes) {
    return { r, meets: true, gap: null, via: `${g3Passes(es, g)} G3 passes at E8 or better, so the score is not read. Confirm with your school what counts as a pass` };
  }
  if (r.value == null) return { r, meets: null, gap: null, via: null };
  const floors = r.value <= d.cutoff ? unmetFloors(a.floors, es, g) : [];
  const labels = floors.map((f) => f.label).join('; ');
  if (floors.length && floors.every((f) => f.missed) && conditional(d, r)) {
    return { r, meets: true, conditional: true, gap: r.value - d.cutoff, via: `Conditional admission: you must reach ${labels} by the end of Year 1` };
  }
  if (d.mins && r.value <= d.cutoff && !meetsMins(d.mins, es, g)) {
    return { r, meets: false, gap: r.value - d.cutoff, via: `Also needs ${d.mins.label}` };
  }
  return { r, meets: r.value <= d.cutoff && !floors.length, gap: r.value - d.cutoff, via: floors.length ? `Also needs ${labels}` : null };
}

/**
 * @returns Array<{ id, name, plain, now, target, dests: [{ id, name, cutoff, value, meets, nowMeets, targetMeets, gap, steps, via, conditional }] }>
 */
export function report({ plan, grades, g, names, destNames }) {
  return (g.aggregates || []).map((a) => {
    const calc = CALC[a.id];
    const esNow = entries(plan, grades.now, g, names);
    const esTarget = entries(plan, grades.target, g, names);
    const now = calc(esNow, g);
    const target = calc(esTarget, g);
    const basis = target.value != null ? 'target' : 'now';
    const dests = a.dests.map((d) => {
      const jn = judge(a, d, esNow, g);
      const jt = judge(a, d, esTarget, g);
      const j = basis === 'target' ? jt : jn;
      return {
        id: d.id,
        name: (destNames && destNames[d.id]) || d.id,
        cutoff: d.cutoff,
        value: j.r.value,
        why: j.r.value == null ? j.r.why : null,
        meets: j.meets,
        nowMeets: jn.meets,
        targetMeets: jt.meets,
        gap: j.gap,
        via: j.via,
        conditional: !!j.conditional,
        note: d.note || null,
        steps: j.gap != null && j.gap > 0 ? stepsToClose(j.r.counted, j.gap, g) : null,
      };
    });
    return { id: a.id, name: a.name, plain: a.plain, bonus: a.bonus, now, target, dests, basis };
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
