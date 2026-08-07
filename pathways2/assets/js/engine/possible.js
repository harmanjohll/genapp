// What is possible from here.
//
// The audit's sharpest finding was that Play narrated what happened and never
// once said what could happen, or what it would take. A student could finish a
// whole life without meeting a single real Singapore mechanism by name. That is
// a story engine, not a guidance tool, and this file is the difference.
//
// THE RULE THAT KEEPS IT HONEST. A requirement is stated as a fact about the
// route, never as a distance the student falls short by. "Nursing asks for
// ELR2B2 of twenty four" is a timetable. "You are four points off nursing" is a
// verdict, and this app does not issue those. Where the student's own plan
// already satisfies a requirement, that is said in the open ink and nothing is
// said in the other direction.

/** Deterministic pick, so a class playing one seed sees one set. */
function lcg(seed) {
  let x = (seed * 1103515245 + 12345) & 0x7fffffff;
  x = (x * 1103515245 + 12345) & 0x7fffffff;
  return Math.abs(x);
}

const ALL = (data) => (data.possibilities && data.possibilities.possibilities) || [];

/**
 * The possibilities live at this age, on this road, that the run has not
 * already been shown. Family-tagged entries win over untagged ones, because a
 * poly student should hear about the GPA road before hearing about exchange.
 */
export function possibilitiesFor(data, run, age, limit = 3) {
  const seen = new Set(run.shownPossible || []);
  const pool = ALL(data).filter((p) => {
    if (age < p.ages[0] || age > p.ages[1]) return false;
    if (p.paths && run.path && !p.paths.includes(run.path)) return false;
    if (p.paths && !run.path) return false;
    return !seen.has(p.id);
  });
  if (!pool.length) return [];
  const tagged = pool.filter((p) => p.paths);
  const rest = pool.filter((p) => !p.paths);
  const ordered = [...tagged, ...rest];
  const off = lcg((run.seed || 1) + age * 61) % ordered.length;
  const out = [];
  for (let i = 0; i < ordered.length && out.length < limit; i += 1) {
    out.push(ordered[(off + i) % ordered.length]);
  }
  return out;
}

/** Remember what was offered, so a run does not repeat itself for ten years. */
export function markShown(run, list) {
  if (!Array.isArray(run.shownPossible)) run.shownPossible = [];
  list.forEach((p) => { if (!run.shownPossible.includes(p.id)) run.shownPossible.push(p.id); });
}

/** What a road asks of you, for the fork. Keyed by the door the branch opens. */
export function forkNeed(data, doorId) {
  const map = (data.possibilities && data.possibilities.forkNeeds) || {};
  return map[doorId] || '';
}

/**
 * Routes that were live during the years this run played and never came up.
 * The ending uses this: not a scolding, a list of doors that are still there.
 */
export function possibilitiesMissed(data, run, limit = 4) {
  const ages = (run.steps || []).map((s) => s.age);
  if (!ages.length) return [];
  const lo = Math.min(...ages);
  const hi = Math.max(...ages);
  // Deliberately NOT filtered by what the run was shown. Having read a route in
  // a fold is not the same as having taken it, and excluding shown routes meant
  // a long run reached its ending with nothing left to name, which is the one
  // place the list has a job to do.
  const live = ALL(data).filter((p) => {
    if (p.ages[1] < lo || p.ages[0] > hi) return false;
    if (p.paths && run.path && !p.paths.includes(run.path)) return false;
    return true;
  });
  const off = lcg((run.seed || 1) * 7) % Math.max(1, live.length);
  return Array.from({ length: Math.min(limit, live.length) }, (_, i) => live[(off + i) % live.length]);
}

/**
 * Does the student's own combination already satisfy this route's subject
 * shape? Only ever used to say yes. Saying no is not this app's business.
 */
export function alreadyMeets(p, plan) {
  if (!p.meetsIf || !plan) return false;
  return Object.entries(p.meetsIf).every(([id, lv]) => {
    const order = { G1: 1, G2: 2, G3: 3 };
    return plan[id] && order[plan[id]] >= order[lv];
  });
}

/** Sweep: the possibilities file is complete, reachable and in range. */
export function possibilitySweep(data) {
  const failures = [];
  const list = ALL(data);
  const doors = Object.keys((data.journey && data.journey.doorsCatalog) || {});
  const forkDoors = ((data.journey.stages || []).find((s) => s.id === 's_results') || { choices: [] })
    .choices.map((c) => c.opens).filter(Boolean);
  const needs = (data.possibilities && data.possibilities.forkNeeds) || {};

  if (!list.length) failures.push({ why: 'no possibilities defined' });
  const ids = new Set();
  list.forEach((p) => {
    if (ids.has(p.id)) failures.push({ id: p.id, why: 'duplicate id' });
    ids.add(p.id);
    ['label', 'when', 'needs', 'leads', 'truth'].forEach((k) => {
      if (!p[k]) failures.push({ id: p.id, why: `missing ${k}` });
    });
    if (!Array.isArray(p.ages) || p.ages.length !== 2 || p.ages[0] > p.ages[1]) {
      failures.push({ id: p.id, why: 'bad age range' });
    }
    (p.paths || []).forEach((path) => {
      if (!['academic', 'applied', 'hands', 'arts'].includes(path)) {
        failures.push({ id: p.id, why: `unknown path ${path}` });
      }
    });
  });

  // Every branch of the fork explains what it asks for.
  forkDoors.forEach((d) => {
    if (!needs[d]) failures.push({ door: d, why: 'fork branch with no stated requirement' });
  });
  Object.keys(needs).forEach((d) => {
    if (!doors.includes(d)) failures.push({ door: d, why: 'requirement for a door that does not exist' });
  });

  // Every age a run can be lived at must have something to offer, on every
  // family, or the panel appears and disappears for no reason a student sees.
  const AGES = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 24, 27, 31, 38, 41, 48];
  ['academic', 'applied', 'hands', 'arts'].forEach((path) => {
    AGES.forEach((age) => {
      const n = possibilitiesFor(data, { path, seed: 1, shownPossible: [] }, age, 3).length;
      if (!n) failures.push({ path, age, why: 'no possibility at this age' });
    });
  });

  // --- the interest frame -------------------------------------------------
  // The six kinds a student sees are Holland's RIASEC with the jargon removed.
  // If a letter goes missing, or a want has no future to hand off to, the frame
  // quietly stops being a frame.
  const LETTERS = ['R', 'I', 'A', 'S', 'E', 'C'];
  const wants = (data.journey && data.journey.wants) || [];
  const futures = (data.futures && data.futures.futures) || [];
  const wantLetters = new Set(wants.map((w) => w.riasec).filter(Boolean));
  LETTERS.forEach((L) => {
    if (!wantLetters.has(L)) failures.push({ riasec: L, why: 'no want carries this interest type' });
  });
  wants.forEach((w) => {
    if (w.id === 'unsure') return;
    if (!w.riasec) failures.push({ want: w.id, why: 'want with no interest type' });
    if (!w.kind) failures.push({ want: w.id, why: 'want with no plain language kind' });
    if (!futures.some((f) => f.id === w.id)) {
      failures.push({ want: w.id, why: 'a want Act cannot hand off to' });
    }
  });
  futures.forEach((f) => {
    if (f.id === 'unsure') return;
    if (!f.riasec) failures.push({ future: f.id, why: 'future with no interest type' });
    else if (!LETTERS.includes(f.riasec)) failures.push({ future: f.id, why: `not a Holland letter: ${f.riasec}` });
    if (!f.kind) failures.push({ future: f.id, why: 'future with no plain language kind' });
  });

  const ok = failures.length === 0;
  console.log(
    `%cPossibilities: ${ok ? 'PASS' : 'FAIL'} (${list.length} routes, ${Object.keys(needs).length} fork requirements, RIASEC ${[...wantLetters].sort().join('')})`,
    ok ? 'color:#2F7D5B;font-weight:700' : 'color:#B23A2A;font-weight:700'
  );
  if (!ok) { console.table(failures.slice(0, 30)); console.error(`${failures.length} possibility failures`); }
  return { ok, failures };
}
