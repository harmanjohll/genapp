// Journey engine v4. Pure functions over a run object.
//
// What changed from v3, and why, one paragraph each:
//
// CHAPTERS, NOT CALENDAR YEARS. School stays year by year, because that is
// where the decisions this app models actually live. After the results fork,
// turns are chapters named by milestone: the first semester, the internship,
// the exit decision, enlistment. v3 gave the years a student can actually
// taste (17 to 24) four turns and the years they cannot feel (27 to 48) five.
// The ladder now follows life density instead of arithmetic.
//
// AGES ARE COMPUTED. Each chapter carries how many years it takes, and a
// run's displayed age is the sum of the road actually taken. A run that
// serves National Service reaches university two years later, on screen, in
// numbers, because that is what happens. Late convergence chapters carry a
// fixed age instead, because by then the argument is that the exact year has
// stopped mattering.
//
// NATIONAL SERVICE EXISTS. One stage, right after the fork, asks whether NS
// is part of this road. Yes deals the enlistment and ORD chapters at the
// point each family actually serves. No is logged once and never mentioned
// again. Nothing about the player is asked or stored beyond that answer, and
// the sweep asserts that serving changes texture and timing, never the size
// of a life: door totals for NS and non NS runs must stay within the same
// two sided spread the combination invariant uses.
//
// DOORS ARE KEYS. v3 defined needsDoor and no content used it, so doors were
// stickers. Late chapters now carry choices a held door unlocks, and the
// sweep asserts every such stage still offers at least two ungated one point
// choices, so a doorless run always has a full turn. Nothing is ever locked;
// some things are earned.
//
// THE ROAD NOT TAKEN GETS A LINE. Every choice may carry a `missed` line,
// and the lived screen names the best thing the player did not do. The cost
// of a year was always the thing you did not spend it on; now the game says
// so out loud, once a year, in one sentence. Costs touch the story, never
// the option set.
//
// ENDINGS ARE AUTHORED. v3 shipped four ending frames nothing rendered.
// finish() now resolves a frame from what the run actually was: the want
// named at the start (or honestly not named), whether NS was part of it, and
// the track the years leaned on. The sweep asserts a frame resolves for
// every combination, so no run ends on a shrug.
//
// Unchanged from v3, on purpose: attention points, the hand of asks, damped
// tracks, named doors that only ever append, chance responses with a stretch
// path, raises that are real, no failure state, no dice against a child.

export const PATHS = ['academic', 'applied', 'hands', 'arts'];
const DISP_KEYS = ['curiosity', 'persistence', 'flexibility', 'optimism', 'risk'];
const TRACKS = ['skills', 'network', 'portfolio'];
const TRACK_CAP = 24;
export const POINTS_PER_TURN = 2;
export const SUBJECT_CHOICE_CAP = 2;
export const MOVE_CHOICE_CAP = 2;
export const HAND_LIMIT = 5;
export const ASKS_PER_YEAR = 2;
export const SHORT_CHAPTERS = 2;   // family chapters a one lesson run lives
export const SHORT_FLOOR = 5;      // turns a one lesson run gets at minimum

// ---------------------------------------------------------------------------
// The sequence: which stages this run will live, in order.

const FORK_AGE = 17;

/** School prefix: the calendar years from where the student starts. */
function schoolStages(j, startAge) {
  return (j.stages || []).filter((s) => !s.chapter && s.age >= startAge && s.age <= FORK_AGE)
    .sort((a, b) => a.age - b.age);
}

const byId = (j) => {
  if (!j.__stageIndex) {
    Object.defineProperty(j, '__stageIndex', {
      value: new Map((j.stages || []).map((s) => [s.id, s])),
      enumerable: false,
    });
  }
  return j.__stageIndex;
};

/**
 * The whole ladder for this run, resolved against what is known so far.
 * Before the fork the tail is the default family's shape, so progress bars
 * can show a length; after the fork it is the truth. NS stages appear only
 * when the player said NS is part of this road; the ask stage always appears.
 */
export function sequenceFor(j, run) {
  const school = schoolStages(j, run.startAge);
  const family = (j.paths || []).find((p) => p.id === (run.path || 'applied')) || (j.paths || [])[0];
  const index = byId(j);
  // A chapter can be gated on NS, or on a flag the fork set. Flag gates are
  // what make Millennia Institute, the foundation year and direct entry to
  // Higher Nitec year two real roads rather than five words on a button.
  const flags = run.flags || [];
  const tail = ((family && family.sequence) || [])
    .map((id) => index.get(id))
    .filter(Boolean)
    .filter((s) => !s.requiresNS || run.ns === true)
    .filter((s) => !s.requiresFlag || flags.includes(s.requiresFlag))
    .filter((s) => !s.excludesFlag || !flags.includes(s.excludesFlag));
  const all = [...school, ...tail];
  if (run.short) {
    // One lesson, but a shape: school, the envelope, the service question, then
    // TWO chapters of the road chosen, so the choice gets a consequence and not
    // just an opening. Floored at five turns, because a Sec 5 student starting
    // late was getting three.
    const out = [];
    let chapters = 0;
    for (const s of all) {
      out.push(s);
      if (s.chapter && s.format !== 'ask-ns' && (s.format || 'turn') !== 'fork') chapters += 1;
      if (chapters >= SHORT_CHAPTERS && out.length >= SHORT_FLOOR) break;
    }
    return out;
  }
  return all;
}

/**
 * The age a stage is lived at, for this run. School and the fork carry
 * calendar ages. A chapter starts where the road has reached and consumes
 * its `years` once lived, so a run that serves NS reaches university two
 * years later in actual numbers. Convergence chapters pin a `fixedAge`,
 * because past thirty the argument is that the exact year has stopped
 * deciding anything.
 */
/**
 * How long this life is, and where in it we are, for the counter.
 *
 * Two faults it fixes. The total used to grow by two the moment the player
 * answered the service question, because before the answer neither the serving
 * chapters nor the civilian ones passed the filter. And the question itself
 * consumed a number, so chapter four was never shown to anybody. Both are now
 * counted the way a reader would count them.
 */
export function chapterCount(j, run) {
  const real = (s) => (s.format || 'turn') !== 'ask-ns';
  const seq = sequenceFor(j, run);
  const done = seq.slice(0, run.stepIndex).filter(real).length;
  // Resolve the length as if service were answered, either way, since both
  // ladders are the same length and the player should not watch it change.
  const settled = run.ns == null
    ? sequenceFor(j, { ...run, ns: true, flags: [...(run.flags || []), 'ns_yes'] })
    : seq;
  return { n: done + 1, total: settled.filter(real).length };
}

export function ageAt(j, run, stepIndex) {
  const seq = sequenceFor(j, run);
  let age = run.startAge;
  for (let i = 0; i < seq.length && i <= stepIndex; i += 1) {
    const s = seq[i];
    if (!s.chapter) { age = s.age; continue; }
    if (s.fixedAge) { age = s.fixedAge; continue; }
    if (i < stepIndex) age += (s.years == null ? 1 : s.years);
  }
  return age;
}

export function currentStage(j, run) {
  const seq = sequenceFor(j, run);
  const s = seq[run.stepIndex];
  return s ? resolveStage(s, run.path) : null;
}

/** Merge a family variant over the base stage. Pure, so diffing stays trivial. */
export function resolveStage(stage, path) {
  if (!path || !stage.variants || !stage.variants[path]) return stage;
  const v = stage.variants[path];
  return { ...stage, ...v, variants: undefined };
}

// ---------------------------------------------------------------------------
// Runs

export function createRun(startAge, label, want, plan) {
  return {
    label: label || 'Story',
    startAge,
    plan: { ...(plan || {}) },
    activities: [],
    want: want || null,
    ns: null,                    // null until the road asks; true or false after
    movesMade: [],
    hand: [],
    asksThisYear: 0,
    seed: Math.floor(Math.random() * 1e9),
    stepIndex: 0,
    steps: [],
    pending: null,
    ledger: { skills: 0, network: 0, portfolio: 0 },
    doors: [],
    flags: [],
    disp: { curiosity: 0, persistence: 0, flexibility: 0, optimism: 0, risk: 0 },
    path: null,
    pathLabel: null,
    reflection: null,
    raises: [],
    done: false,
  };
}

/** Answer the NS question. Once. The answer is a fact about the road, logged and moved past. */
export function answerNS(run, yes, stage) {
  run.ns = !!yes;
  const flag = yes ? 'ns_yes' : 'ns_no';
  if (!run.flags.includes(flag)) run.flags.push(flag);
  run.steps.push({
    stageId: stage ? stage.id : 'ns_ask',
    age: FORK_AGE,
    title: stage ? (stage.chapter || stage.title) : 'Before it starts',
    format: 'ask-ns',
    choices: [yes ? 'NS is part of my road' : 'Not part of mine'],
    outcome: '',
    chance: null,
  });
  run.stepIndex += 1;
  return run;
}

// ---------------------------------------------------------------------------
// Points: time and energy. Ported from v3, with chapter overrides.

const ACT = (data) => (data && data.activities && data.activities.activities) || [];

export function loadOf(ids, data) {
  if (!ids || !ids.length) return 0;
  const all = ACT(data);
  if (!all.length) return 0;
  return ids.reduce((n, id) => {
    const a = all.find((x) => x.id === id);
    return n + (a ? (a.week || 0) : 0);
  }, 0);
}

export function pointsFor(run, stage, data, age) {
  if (stage.pts) return { points: stage.pts, reasons: stage.ptsWhy ? [{ k: stage.ptsWhy }] : [] };
  const reasons = [];
  let pts = 2;
  if (age >= 17 && age <= 24) { pts += 1; reasons.push({ k: 'freer', d: 1 }); }
  // Deliberately nothing here reads the size of the combination. Taking seven
  // subjects used to cost a student one action a year and taking four used to
  // buy one, which punished the fuller plan this app spends Plan mode
  // encouraging. Time pressure is modelled by activities, which the
  // monotonicity sweep proves can only ever help.
  if (age <= 18) {
    const w = loadOf(run.activities, data);
    if (w >= 6) { pts -= 1; reasons.push({ k: 'week', d: -1, n: w }); }
    else if (w > 0 && w <= 2) { pts += 1; reasons.push({ k: 'room', d: 1, n: w }); }
    if ((run.flags || []).includes('took_stage')) { pts -= 1; reasons.push({ k: 'cca', d: -1 }); }
  }
  return { points: Math.max(2, Math.min(4, pts)), reasons };
}

export function activityYield(ids, data, age) {
  const empty = { gain: {}, disp: {}, n: 0 };
  if (age > 18) return empty;
  const w = loadOf(ids, data);
  const n = w >= 6 ? 2 : (w >= 3 ? 1 : 0);
  if (!n) return empty;
  const all = ACT(data);
  const mine = (ids || []).map((id) => all.find((x) => x.id === id)).filter(Boolean);
  const pool = (key) => {
    const counts = {};
    mine.forEach((a) => Object.entries(a[key] || {}).forEach(([k, v]) => { counts[k] = (counts[k] || 0) + v; }));
    return Object.entries(counts).sort((x, y) => y[1] - x[1]).map(([k]) => k);
  };
  const take = (keys) => {
    const out = {};
    keys.slice(0, n).forEach((k) => { out[k] = 1; });
    return out;
  };
  return { gain: take(pool('gain')), disp: take(pool('disp')), n };
}

export function grantYield(run, data, age) {
  const y = activityYield(run.activities, data, age);
  if (!y.n) return null;
  grant(run, { gain: y.gain, disp: y.disp });
  return y;
}

// ---------------------------------------------------------------------------
// RIASEC affinity, ported unchanged.

export const RIASEC_SIGNS = {
  R: { portfolio: 1, skills: 1, persistence: 1 },
  I: { skills: 1, curiosity: 1 },
  A: { portfolio: 1, curiosity: 1 },
  S: { network: 1, optimism: 1 },
  E: { network: 1, risk: 1 },
  C: { skills: 1, persistence: 1 },
};

export function wantAffinity(obj, riasec) {
  const sign = RIASEC_SIGNS[riasec];
  if (!sign || !obj) return 0;
  let score = 0;
  Object.keys(obj.gain || {}).forEach((k) => { score += sign[k] || 0; });
  Object.keys(obj.disp || {}).forEach((k) => { score += sign[k] || 0; });
  if (obj.asks && sign[obj.asks.disposition]) score += 1;
  return score;
}

// ---------------------------------------------------------------------------
// The hand of asks and the visible choices. Ported, with door keys real.

/** Still in school means the results fork has not been taken yet. */
const inSchool = (run) => !run.path;

const asksFor = (moves, age, run) => (moves || []).filter((m) => m.kind === 'ask'
  && age >= m.ages[0] && age <= m.ages[1]
  && (!m.schoolOnly || inSchool(run)));

export function dealHand(run, moves, age) {
  if (!Array.isArray(run.hand)) run.hand = [];
  const made = new Set((run.movesMade || []).map((m) => m.id));
  const held = new Set(run.hand);
  const pool = asksFor(moves, age, run).filter((m) => !made.has(m.id) && !held.has(m.id));
  if (!pool.length) return run.hand;
  const off = lcg(run.seed + age * 31) % pool.length;
  for (let i = 0; i < pool.length && run.hand.length < HAND_LIMIT; i += 1) {
    run.hand.push(pool[(off + i) % pool.length].id);
  }
  return run.hand;
}

export function playAsk(run, move, age, moves) {
  if ((run.asksThisYear || 0) >= ASKS_PER_YEAR) return false;
  if (!Array.isArray(run.hand) || !run.hand.includes(move.id)) return false;
  grant(run, move);
  if (!run.movesMade) run.movesMade = [];
  run.movesMade.push({ id: move.id, age });
  run.hand = run.hand.filter((id) => id !== move.id);
  run.asksThisYear = (run.asksThisYear || 0) + 1;
  dealHand(run, moves, age);
  return true;
}

export function takesSubject(run, spec) {
  if (!run.plan) return false;
  const ids = Array.isArray(spec) ? spec : [spec];
  return ids.some((id) => !!run.plan[id]);
}

/**
 * Choices visible to this run at this stage: the authored base, anything a
 * held door unlocks, up to two the combination opens, and up to two
 * commitments from the move deck. A door gated choice is the only kind that
 * can be absent, and the sweep asserts a doorless run still gets a full turn
 * everywhere one exists.
 */
export function visibleChoices(stage, run, moves, age) {
  const all = stage.choices || [];
  const base = all.filter((c) => !c.needsSubject && (!c.needsDoor || run.doors.includes(c.needsDoor)));
  const subject = all
    .filter((c) => c.needsSubject && takesSubject(run, c.needsSubject))
    .slice(0, SUBJECT_CHOICE_CAP);
  let commits = [];
  if ((stage.format || 'turn') === 'turn' && Array.isArray(moves) && moves.length) {
    const made = new Set((run.movesMade || []).map((m) => m.id));
    const open = moves.filter((m) => m.kind === 'commit'
      && age >= m.ages[0] && age <= m.ages[1] && !made.has(m.id)
      && (!m.schoolOnly || inSchool(run)));
    if (open.length) {
      const off = lcg(run.seed + age * 97) % open.length;
      commits = Array.from({ length: Math.min(MOVE_CHOICE_CAP, open.length) },
        (_, i) => open[(off + i) % open.length])
        .map((m) => ({
          id: m.id, label: m.label, cost: m.cost || 1, gain: m.gain, disp: m.disp, sets: m.sets,
          outcome: m.outcome, body: m.body, check: m.check, ic: m.ic, missed: m.missed,
          isMove: true, isCommit: true,
        }));
    }
  }
  return [...base, ...subject, ...commits];
}

// ---------------------------------------------------------------------------
// Raises, ported unchanged: only ever up, never invented, never diced.

const LV = { G1: 1, G2: 2, G3: 3 };

function applyRaise(run, spec, meta) {
  if (!spec) return null;
  const ids = Array.isArray(spec.any) ? spec.any : [spec.subject].filter(Boolean);
  for (const id of ids) {
    const cur = run.plan && run.plan[id];
    if (!cur) continue;
    const offered = (meta[id] && meta[id].levels) || [];
    const next = spec.to || offered.find((lv) => LV[lv] === LV[cur] + 1);
    if (!next || LV[next] <= LV[cur] || !offered.includes(next)) continue;
    run.plan[id] = next;
    const rec = { subject: id, name: (meta[id] && meta[id].name) || id, from: cur, to: next, age: spec._age };
    run.raises.push(rec);
    return rec;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Living a year.

/**
 * The best thing the player did not do, as one authored line. The turn's own
 * unchosen base choices are the candidates; the costliest carries the line.
 * This is the one place the game renders opportunity cost, and it renders it
 * as story, never as a number.
 */
export function missedLine(stage, run, moves, indices, age, pool) {
  // The pool MUST be the one the student was actually shown. Recomputing it
  // here reads the run after its grants have landed, so a door opened this very
  // turn shifts every index and the game names a road it never offered.
  const shown = pool || visibleChoices(stage, run, moves, age);
  const picked = new Set(indices);
  const unchosen = shown.filter((c, i) => !picked.has(i) && c.missed);
  if (!unchosen.length) return null;
  unchosen.sort((a, b) => (b.cost || 1) - (a.cost || 1));
  // The costliest road not taken, unless this run has already been told about
  // it. Three chapters in a row each ending "the exchange cohort flew without
  // you" turns opportunity cost into wallpaper.
  const already = new Set((run.steps || []).map((st) => st.missed).filter(Boolean));
  const fresh = unchosen.find((c) => !already.has(c.missed));
  return (fresh || unchosen[0]).missed;
}

export function applyChoices(run, j, stage, indices, cards, meta, moves) {
  const age = ageAt(j, run, run.stepIndex);
  const pool = visibleChoices(stage, run, moves, age);
  const chosen = indices.map((i) => pool[i]).filter(Boolean);
  if (!chosen.length) return run;

  // Which doors this chapter opened, recorded on the step itself, so the story
  // map can mark a door at the moment it opened instead of only listing it.
  const doorsBefore = run.doors.slice();
  const outcomes = [];
  chosen.forEach((choice) => {
    grant(run, choice);
    if (choice.isMove) {
      if (!run.movesMade) run.movesMade = [];
      run.movesMade.push({ id: choice.id, age });
    }
    const raised = choice.raise
      ? applyRaise(run, { ...choice.raise, _age: age }, meta || {})
      : null;
    outcomes.push(resolveOutcome(choice, run, raised));
  });

  run.steps.push({
    stageId: stage.id,
    age,
    title: stage.chapter || stage.title,
    format: stage.format || 'turn',
    choices: chosen.map((c) => c.label),
    outcome: outcomes.join(' '),
    missed: missedLine(stage, run, moves, indices, age, pool),
    opened: run.doors.filter((d) => !doorsBefore.includes(d)),
    chance: null,
  });

  run.asksThisYear = 0;
  const card = pickChance(run, stage, cards, age);
  if (card) run.pending = { cardId: card.id };
  else { run.pending = null; run.stepIndex += 1; }
  return run;
}

export function applyReflection(run, j, stage, text) {
  const age = ageAt(j, run, run.stepIndex);
  run.reflection = String(text || '').slice(0, 140);
  run.steps.push({
    stageId: stage.id, age, title: stage.chapter || stage.title, format: 'reflect',
    choices: [], outcome: run.reflection ? `You wrote: ${run.reflection}` : 'You sat with it a while.',
    chance: null,
  });
  run.pending = null;
  run.stepIndex += 1;
  return run;
}

export function respondToChance(run, card, responseIndex) {
  const r = (card.responses || [])[responseIndex];
  const step = run.steps[run.steps.length - 1];
  if (!r) { run.pending = null; run.stepIndex += 1; return run; }

  const met = !r.needsAsk || askMet(run, card);
  const text = met ? r.outcome : (r.stretch || r.outcome);
  const doorsBefore = run.doors.slice();

  if (met) {
    grant(run, r);
  } else {
    const d = card.asks && card.asks.disposition;
    if (d) run.disp[d] = (run.disp[d] || 0) + 1;
    if (r.sets && !run.flags.includes(r.sets)) run.flags.push(r.sets);
  }

  if (step) {
    step.chance = {
      id: card.id, title: card.title, type: card.type,
      response: r.label, met, text,
    };
    const fresh = run.doors.filter((d) => !doorsBefore.includes(d));
    if (fresh.length) step.opened = [...(step.opened || []), ...fresh];
  }
  run.pending = null;
  run.stepIndex += 1;
  return run;
}

export function askMet(run, card) {
  if (!card.asks) return true;
  return (run.disp[card.asks.disposition] || 0) >= (card.asks.min || 1);
}

function grant(run, thing) {
  const focus = (thing.cost || 1) >= POINTS_PER_TURN ? 1 : 0;
  if (thing.gain) {
    TRACKS.forEach((k) => {
      const raw = thing.gain[k] ? thing.gain[k] + focus : 0;
      if (typeof raw !== 'number' || raw <= 0) return;
      const cur = run.ledger[k];
      run.ledger[k] = Math.min(TRACK_CAP, cur + Math.max(1, Math.round(raw * (TRACK_CAP - cur) / TRACK_CAP)));
    });
  }
  if (thing.disp) {
    DISP_KEYS.forEach((k) => {
      if (typeof thing.disp[k] === 'number') run.disp[k] += thing.disp[k];
    });
  }
  const door = thing.opens;
  if (door && !run.doors.includes(door)) run.doors.push(door);
  const sets = thing.sets;
  if (sets) {
    if (typeof sets === 'string') { if (!run.flags.includes(sets)) run.flags.push(sets); }
    else {
      if (sets.path) { run.path = sets.path; run.pathLabel = sets.label || sets.path; }
      if (sets.flag && !run.flags.includes(sets.flag)) run.flags.push(sets.flag);
    }
  }
}

function resolveOutcome(choice, run, raised) {
  if (raised && choice.outcomeRaised) {
    return String(choice.outcomeRaised)
      .replace('{subject}', raised.name)
      .replace('{level}', raised.to);
  }
  const v = choice.outcomeIf;
  if (v) {
    if (run.ns === true && v['ns:yes']) return v['ns:yes'];
    if (run.ns === false && v['ns:no']) return v['ns:no'];
    if (run.path && v[`path:${run.path}`]) return v[`path:${run.path}`];
    for (const f of run.flags) if (v[`flag:${f}`]) return v[`flag:${f}`];
  }
  return choice.outcome || '';
}

// ---------------------------------------------------------------------------
// The deck.

export function eligibleCards(cards, run, age) {
  const used = new Set(run.steps.map((s) => s.chance && s.chance.id).filter(Boolean));
  return cards.filter((c) => {
    if (age < c.minAge || age > c.maxAge) return false;
    if (used.has(c.id)) return false;
    if (c.paths && run.path && !c.paths.includes(run.path)) return false;
    if (c.paths && !run.path) return false;
    if (c.requiresNS && run.ns !== true) return false;
    if (c.excludesNS && run.ns === true) return false;
    if (c.requiresFlag && !run.flags.includes(c.requiresFlag)) return false;
    if (c.excludesFlag && run.flags.includes(c.excludesFlag)) return false;
    if (c.when && !bandsMet(run, c.when)) return false;
    return true;
  });
}

function bandsMet(run, when) {
  return Object.entries(when).every(([k, expr]) => {
    const m = String(expr).match(/^(>=|<=)\s*(\d+)$/);
    if (!m) return true;
    const v = run.ledger[k] != null ? run.ledger[k] : (run.disp[k] || 0);
    return m[1] === '>=' ? v >= Number(m[2]) : v <= Number(m[2]);
  });
}

function pickChance(run, stage, cards, age) {
  const fmt = stage.format || 'turn';
  if (fmt === 'reflect' || fmt === 'ask-ns') return null;
  if (stage.noChance) return null;
  // A quiet chapter every fifth turn. A year where nothing lands is part of a
  // life, and it makes the years that do land count.
  //
  // Deliberately positional and not seeded. Tying it to the seed meant two
  // students were dealt different NUMBERS of cards, and since cards open doors,
  // luck decided how big a life got. The rhythm is the same for everyone; which
  // cards arrive inside it is what varies.
  if (run.stepIndex % 5 === 3) return null;
  const pool = eligibleCards(cards, run, age);
  if (!pool.length) return null;
  const rich = pool.filter((c) => c.requiresFlag || c.when);
  let pickFrom = rich.length && lcg(run.seed + run.stepIndex * 31) % 3 !== 0 ? rich : pool;
  const fitting = pickFrom.filter((c) => c.subjects && takesSubject(run, c.subjects));
  if (fitting.length && lcg(run.seed + run.stepIndex * 53) % 3 !== 0) pickFrom = fitting;
  if (run.want && run.want.riasec) {
    const liked = pickFrom.filter((c) => wantAffinity(c, run.want.riasec) >= 2);
    if (liked.length && lcg(run.seed + run.stepIndex * 101) % 3 !== 0) pickFrom = liked;
  }
  return pickFrom[lcg(run.seed + run.stepIndex * 7919) % pickFrom.length];
}

function lcg(seed) {
  let x = (seed * 1103515245 + 12345) & 0x7fffffff;
  x = (x * 1103515245 + 12345) & 0x7fffffff;
  return Math.abs(x);
}

// ---------------------------------------------------------------------------
// Endings and comparison.

export function strongestDisp(run) {
  return DISP_KEYS.reduce((best, k) => (run.disp[k] > run.disp[best] ? k : best), 'curiosity');
}

export function strongestTrack(run) {
  return TRACKS.reduce((best, k) => (run.ledger[k] > run.ledger[best] ? k : best), 'skills');
}

/**
 * The authored ending. Most specific frame wins: want and ns and track beat
 * want alone beats the honest default. 'any' matches anything; want 'unsure'
 * matches a run that never named one. The sweep asserts every combination
 * resolves, so no run can end on a shrug.
 */
export function resolveEnding(frames, run) {
  const wantId = run.want ? run.want.id : 'unsure';
  const track = strongestTrack(run);
  const ns = run.ns === true ? 'yes' : 'no';
  let best = null;
  let bestScore = -1;
  (frames || []).forEach((f) => {
    const w = f.want === 'any' || f.want === wantId;
    const t = !f.track || f.track === 'any' || f.track === track;
    const n = !f.ns || f.ns === 'any' || f.ns === ns;
    if (!w || !t || !n) return;
    const score = (f.want !== 'any' ? 4 : 0) + (f.track && f.track !== 'any' ? 2 : 0) + (f.ns && f.ns !== 'any' ? 1 : 0);
    if (score > bestScore) { bestScore = score; best = f; }
  });
  return best;
}

export function finish(run, data) {
  run.done = true;
  run.topDisposition = strongestDisp(run);
  run.topTrack = strongestTrack(run);
  run.ending = resolveEnding(data.journey.endingFrames, run) || null;
  const scored = run.steps.map((s, i) => {
    let score = 0;
    if (s.chance && s.chance.met === false) score += 3;
    if (s.chance && String(s.chance.id || '').startsWith('cb_')) score += 4;
    if (s.format === 'fork') score += 2;
    if (s.format === 'reflect' && run.reflection) score += 3;
    if (i === run.steps.length - 1) score += 1;
    return { s, score };
  }).sort((a, b) => b.score - a.score);
  run.moments = scored.slice(0, 3).map((x) => x.s).sort((a, b) => a.age - b.age);
  run.endAge = run.steps.length ? run.steps[run.steps.length - 1].age : run.startAge;
  return run;
}

/**
 * Compare two runs. Rows align on the chapters both lived, in each run's own
 * order; a chapter only one story reached is listed under that story rather
 * than as a wall of empty cells. A short run's chosen stop is a fact the
 * screen states, never a flatline it implies.
 */
export function diffRuns(a, b) {
  const key = (s) => `${s.title}@${s.age}`;
  const akeys = a.steps.map(key);
  const bkeys = b.steps.map(key);
  const shared = akeys.filter((k) => bkeys.includes(k));
  const rows = shared.map((k) => {
    const sa = a.steps[akeys.indexOf(k)];
    const sb = b.steps[bkeys.indexOf(k)];
    return {
      age: sa.age,
      title: sa.title,
      a: sa, b: sb,
      differs: !!(sa && sb && sa.choices.join('|') !== sb.choices.join('|')),
    };
  });
  const onlyIn = (steps, keys, otherKeys) => steps
    .filter((_, i) => !otherKeys.includes(keys[i]))
    .map((s) => ({ age: s.age, title: s.title, choices: s.choices }));
  const sharedDoors = a.doors.filter((d) => b.doors.includes(d));
  return {
    rows,
    tailA: onlyIn(a.steps, akeys, bkeys),
    tailB: onlyIn(b.steps, bkeys, akeys),
    stoppedEarly: [a, b].map((r) => (r.short ? (r.endAge || 18) : null)),
    shared: sharedDoors,
    onlyA: a.doors.filter((d) => !sharedDoors.includes(d)),
    onlyB: b.doors.filter((d) => !sharedDoors.includes(d)),
    wants: [a.want, b.want],
    reflections: [a.reflection, b.reflection],
    paths: [a.pathLabel, b.pathLabel],
    ns: [a.ns, b.ns],
    plans: [a.plan || {}, b.plan || {}],
    sameCombination: sameKeys(a.plan, b.plan),
  };
}

function sameKeys(x, y) {
  const ax = Object.keys(x || {}).sort().join(',');
  const bx = Object.keys(y || {}).sort().join(',');
  return ax === bx;
}

// ---------------------------------------------------------------------------
// The sweep. Run with ?dev=1. Everything v3 asserted, plus the v4 contracts:
// NS parity, door keys with a doorless turn everywhere, no write-only flags,
// no door granted nowhere or asked for nowhere, and an ending for every run.

export function runJourneySweep(data) {
  const failures = [];
  const j = data.journey;
  const cards = data.chances.cards;
  const doorIds = new Set(Object.keys(j.doorsCatalog || {}));
  const flagIds = new Set(j.flags || []);
  const allSubjects = (data.subjects && data.subjects.subjects) || [];
  const subjectMeta = Object.fromEntries(allSubjects.map((x) => [x.id, { name: x.shortName || x.name, levels: x.levels || [] }]));
  const subjectIds = new Set(allSubjects.map((s) => s.id));
  const simMoves = (data.moves && data.moves.moves) || [];

  // 1. Structure: every sequenced stage exists; every stage in every family
  // and NS state resolves with a sane choice set; door gates leave a turn.
  const seenStages = new Set();
  PATHS.forEach((path) => {
    (j.paths.find((p) => p.id === path) || { sequence: [] }).sequence.forEach((id) => {
      seenStages.add(id);
      if (!(j.stages || []).some((s) => s.id === id)) {
        failures.push({ path, why: `sequence names unknown stage ${id}` });
      }
    });
  });
  (j.stages || []).filter((s) => s.chapter).forEach((s) => {
    if (!seenStages.has(s.id)) failures.push({ stage: s.id, why: 'chapter stage in no sequence' });
  });

  const paths = [null, ...PATHS];
  (j.stages || []).forEach((stage) => {
    paths.forEach((path) => {
      const r = resolveStage(stage, path);
      const fmt = r.format || 'turn';
      if (fmt === 'reflect' || fmt === 'ask-ns') return;
      const base = (r.choices || []).filter((c) => !c.needsDoor && !c.needsSubject);
      const gated = (r.choices || []).filter((c) => c.needsDoor);
      (r.choices || []).forEach((c) => {
        if (c.needsSubject) {
          const ids = Array.isArray(c.needsSubject) ? c.needsSubject : [c.needsSubject];
          ids.forEach((id) => {
            if (!subjectIds.has(id)) failures.push({ stage: stage.id, path, why: `unknown subject ${id}` });
          });
        }
        if (c.needsDoor && !doorIds.has(c.needsDoor)) failures.push({ stage: stage.id, path, why: `unknown door gate ${c.needsDoor}` });
        if (c.opens && !doorIds.has(c.opens)) failures.push({ stage: stage.id, path, why: `unknown door ${c.opens}` });
        const flag = c.sets && (typeof c.sets === 'string' ? c.sets : c.sets.flag);
        if (flag && !flagIds.has(flag)) failures.push({ stage: stage.id, path, why: `unknown flag ${flag}` });
        if ((c.cost || 1) > POINTS_PER_TURN) failures.push({ stage: stage.id, path, why: `choice over budget: ${c.label}` });
      });
      if (fmt === 'fork') {
        if (base.length < 2) failures.push({ stage: stage.id, path, why: 'fork with fewer than 2 choices' });
        return;
      }
      if (base.length < 4) failures.push({ stage: stage.id, path, why: `only ${base.length} base choices` });
      const oneCost = base.filter((c) => (c.cost || 1) === 1);
      if (oneCost.length < 2) failures.push({ stage: stage.id, path, why: 'fewer than two 1 point choices' });
      // A door may open a choice. It must never be the only way to have a turn.
      if (gated.length && oneCost.length < 2) {
        failures.push({ stage: stage.id, path, why: 'door gate without a doorless turn' });
      }
    });
  });

  // 2. Every card is a real decision, and its gates exist.
  cards.forEach((c) => {
    if (!c.responses || c.responses.length < 2) { failures.push({ card: c.id, why: 'fewer than 2 responses' }); return; }
    const needy = c.responses.filter((r) => r.needsAsk);
    if (needy.length && !c.asks) failures.push({ card: c.id, why: 'needsAsk without asks' });
    needy.forEach((r) => { if (!r.stretch) failures.push({ card: c.id, why: 'needsAsk response without stretch text' }); });
    c.responses.forEach((r, i) => {
      if (!r.label || !r.outcome) failures.push({ card: c.id, why: `response ${i} missing label or outcome` });
      if (r.opens && !doorIds.has(r.opens)) failures.push({ card: c.id, why: `unknown door ${r.opens}` });
      if (r.sets && !flagIds.has(r.sets)) failures.push({ card: c.id, why: `unknown flag ${r.sets}` });
    });
    if (c.type === 'setback' && (!c.onwardMoves || !c.onwardMoves.length)) {
      failures.push({ card: c.id, why: 'setback without onwardMoves' });
    }
    if (c.requiresFlag && !flagIds.has(c.requiresFlag)) failures.push({ card: c.id, why: `unknown requiresFlag ${c.requiresFlag}` });
    if (c.excludesFlag && !flagIds.has(c.excludesFlag)) failures.push({ card: c.id, why: `unknown excludesFlag ${c.excludesFlag}` });
    (c.subjects || []).forEach((id) => {
      if (!subjectIds.has(id)) failures.push({ card: c.id, why: `unknown subject tag ${id}` });
    });
  });

  // 3. No write-only flags: a move or choice that promises "this changes what
  // can turn up later" must be able to keep the promise. v3 shipped 12 flags
  // nothing ever read.
  const readFlags = new Set(['ns_yes', 'ns_no']);
  cards.forEach((c) => {
    if (c.requiresFlag) readFlags.add(c.requiresFlag);
    if (c.excludesFlag) readFlags.add(c.excludesFlag);
  });
  const scanOutcomeIf = (thing) => {
    Object.keys(thing.outcomeIf || {}).forEach((k) => {
      const m = k.match(/^flag:(.+)$/);
      if (m) readFlags.add(m[1]);
    });
  };
  (j.stages || []).forEach((s) => {
    if (s.requiresFlag) readFlags.add(s.requiresFlag);
    if (s.excludesFlag) readFlags.add(s.excludesFlag);
    [s, ...Object.values(s.variants || {})].forEach((v) => (v.choices || []).forEach(scanOutcomeIf));
  });
  (j.flags || []).forEach((f) => {
    if (!readFlags.has(f)) failures.push({ flag: f, why: 'flag is set but never read anywhere' });
  });

  // 4. Doors: every door is granted somewhere, asked for somewhere or named
  // by an ending, and no single door hoards the grants.
  const grantsByDoor = {};
  const askedDoors = new Set();
  const noteDoor = (id) => { grantsByDoor[id] = (grantsByDoor[id] || 0) + 1; };
  (j.stages || []).forEach((s) => {
    [s, ...Object.values(s.variants || {})].forEach((v) => (v.choices || []).forEach((c) => {
      if (c.opens) noteDoor(c.opens);
      if (c.needsDoor) askedDoors.add(c.needsDoor);
    }));
  });
  cards.forEach((c) => (c.responses || []).forEach((r) => { if (r.opens) noteDoor(r.opens); }));
  (data.moves.moves || []).forEach((m) => { if (m.opens) noteDoor(m.opens); });
  const totalGrants = Object.values(grantsByDoor).reduce((a, b) => a + b, 0);
  doorIds.forEach((id) => {
    if (!grantsByDoor[id]) failures.push({ door: id, why: 'door defined but granted nowhere' });
    if (totalGrants && (grantsByDoor[id] || 0) / totalGrants > 0.25) {
      failures.push({ door: id, why: `door takes ${Math.round((grantsByDoor[id] / totalGrants) * 100)}% of all grants` });
    }
  });
  if (!askedDoors.size) failures.push({ why: 'no choice anywhere asks for a door: doors are stickers again' });

  // 5. The pool can never starve, on any family, with or without NS.
  const MIN_POOL = 8;
  const FLAG_SETS = [[], ['at_mi'], ['at_pfp'], ['hn_direct']];
  PATHS.forEach((path) => {
    [true, false].forEach((ns) => {
      FLAG_SETS.forEach((extra) => {
      const bare = createRun(13, 'sweep', null, null);
      bare.path = path;
      bare.ns = ns;
      bare.flags = [ns ? 'ns_yes' : 'ns_no', ...extra];
      const seq = sequenceFor(j, bare);
      seq.forEach((s, i) => {
        const fmt = s.format || 'turn';
        if (fmt === 'reflect' || fmt === 'ask-ns' || s.noChance) return;
        const age = ageAt(j, bare, i);
        const n = eligibleCards(cards, { ...bare, steps: [] }, age)
          .filter((c) => !c.requiresFlag && !c.when).length;
        if (n < MIN_POOL) failures.push({ path, ns, stage: s.id, age, why: `pool ${n} below ${MIN_POOL}` });
      });
      });
    });
  });

  // 6. Simulations. Strategies x families x NS x start ages x combinations.
  const strategies = [() => 0, (n) => n - 1, (i) => i % 2];
  let simCount = 0;
  const frames = new Set();

  function playSim(pi, si, strat, plan, mode, startAge, ns, short) {
    simCount += 1;
    const run = createRun(startAge, 'sim', null, plan);
    run.short = !!short;
    run.seed = 12345 + pi * 7 + si * 13 + (ns ? 3 : 0);
    const local = [];
    let guard = 0;
    let doorsPrev = 0;
    while (!run.done && guard++ < 200) {
      const stage = currentStage(j, run);
      if (!stage) { finish(run, data); break; }
      const fmt = stage.format || 'turn';
      const age = ageAt(j, run, run.stepIndex);
      if (fmt === 'ask-ns') { answerNS(run, ns, stage); continue; }
      if (fmt === 'reflect') { applyReflection(run, j, stage, ''); continue; }
      if (run.pending) {
        const card = cards.find((c) => c.id === run.pending.cardId);
        respondToChance(run, card, si % Math.max(1, (card.responses || []).length));
        continue;
      }
      const pool = visibleChoices(stage, run, simMoves, age);
      const baseN = pool.filter((c) => !c.needsSubject && !c.isMove).length;
      const span = mode === 'base' ? baseN : pool.length;
      if (fmt === 'fork') {
        let idx;
        if (stage.id === 's_results') {
          // Match the family by name, never by position, and rotate through the
          // branches that lead to it so the flag gated roads get played too.
          const want = PATHS[pi];
          const hits = pool.map((c, k) => ((c.sets && c.sets.path) === want ? k : -1)).filter((k) => k >= 0);
          idx = hits.length ? hits[si % hits.length] : 0;
        } else {
          idx = strat(span);
        }
        applyChoices(run, j, stage, [Math.max(0, Math.min(span - 1, idx))], cards, subjectMeta, simMoves);
      } else {
        const subjectIdx = pool.findIndex((c) => c.needsSubject);
        const first = mode === 'subject' && subjectIdx >= 0
          ? subjectIdx
          : Math.max(0, Math.min(span - 1, strat(span)));
        const picks = [first];
        if ((pool[first].cost || 1) === 1) {
          const second = pool.findIndex((c, i2) => i2 !== first && i2 < span && (c.cost || 1) === 1);
          if (second >= 0) picks.push(second);
        }
        applyChoices(run, j, stage, picks, cards, subjectMeta, simMoves);
      }
      if (run.doors.length < doorsPrev) local.push('doors shrank');
      doorsPrev = run.doors.length;
    }
    if (!run.done) local.push('run did not complete');
    if (run.done && !run.short && run.doors.length < 3) local.push(`only ${run.doors.length} doors by the end`);
    if (run.done && run.short && run.doors.length < 2) local.push(`short run held only ${run.doors.length} doors`);
    if (run.done && run.short && run.steps.length < SHORT_FLOOR) local.push(`short run only ${run.steps.length} turns`);
    if (run.done && !run.ending) local.push('no ending frame resolved');
    TRACKS.forEach((k) => { if (run.ledger[k] > TRACK_CAP) local.push(`${k} over cap`); });
    return { run, local };
  }

  const byLevel = (lv) => Object.fromEntries(
    allSubjects.filter((s) => (s.levels || []).includes(lv)).map((s) => [s.id, lv])
  );
  const pick = (ids) => Object.fromEntries(
    ids.map((id) => allSubjects.find((s) => s.id === id)).filter(Boolean)
      .map((s) => [s.id, (s.levels || ['G2'])[(s.levels || []).length - 1] || 'G2'])
  );
  const combos = [
    { id: 'empty', plan: null },
    { id: 'all_g1', plan: byLevel('G1') },
    { id: 'all_g3', plan: byLevel('G3') },
    { id: 'science_lean', plan: pick(['el', 'maths', 'amaths', 'physics', 'chemistry', 'hum_ss_geog']) },
    { id: 'arts_lean', plan: pick(['el', 'maths', 'art', 'literature', 'hum_ss_lit']) },
    { id: 'thin', plan: pick(['el']) },
  ];
  const START_AGES = [13, 15];

  const totals = {};          // by combo id, over everything else
  const nsTotals = { yes: 0, no: 0 };
  PATHS.forEach((path, pi) => {
    strategies.forEach((strat, si) => {
      START_AGES.forEach((from) => {
        [true, false].forEach((ns) => {
          combos.forEach((combo) => {
            const { run, local } = playSim(pi, si, strat, combo.plan, 'base', from, ns);
            local.forEach((why) => failures.push({ combo: combo.id, path, strat: si, from, ns, why }));
            totals[combo.id] = (totals[combo.id] || 0) + run.doors.length;
            nsTotals[ns ? 'yes' : 'no'] += run.doors.length;
            if (run.done) frames.add(run.topDisposition);
          });
        });
      });
    });
  });
  if (frames.size < 2) failures.push({ why: 'every simulated strategy produced the same top disposition' });

  // Two-sided parity, twice over. A combination must not play a materially
  // smaller or larger game than none; serving NS must not either. Texture
  // and timing may differ; the size of a life may not.
  const SPREAD = 0.05;
  Object.keys(totals).forEach((id) => {
    if (id === 'empty' || !totals.empty) return;
    const off = Math.abs(totals[id] - totals.empty) / totals.empty;
    if (off > SPREAD) {
      failures.push({ combo: id, why: `${totals[id]} doors against ${totals.empty} for an empty plan, ${Math.round(off * 100)} percent apart` });
    }
  });
  if (nsTotals.yes && nsTotals.no) {
    const off = Math.abs(nsTotals.yes - nsTotals.no) / nsTotals.no;
    if (off > SPREAD) {
      failures.push({ why: `NS runs hold ${nsTotals.yes} doors against ${nsTotals.no} without, ${Math.round(off * 100)} percent apart` });
    }
  }

  // 7. Subject choices stay playable end to end.
  combos.filter((c) => c.plan).forEach((combo) => {
    PATHS.forEach((path, pi) => {
      const { run, local } = playSim(pi, 0, strategies[0], combo.plan, 'subject', 13, false);
      local.forEach((why) => failures.push({ combo: combo.id, path, mode: 'subject', why }));
      if (run.done && !run.steps.length) failures.push({ combo: combo.id, path, why: 'empty run' });
    });
  });

  // 8. Endings resolve for every want x ns x track, so no run shrugs.
  const wants = [...(j.wants || []).map((w) => w.id), 'unsure'];
  wants.forEach((w) => {
    ['yes', 'no'].forEach((ns) => {
      TRACKS.forEach((track) => {
        const fake = {
          want: w === 'unsure' ? null : { id: w },
          ns: ns === 'yes',
          ledger: { skills: 0, network: 0, portfolio: 0, [track]: 5 },
        };
        if (!resolveEnding(j.endingFrames, fake)) {
          failures.push({ want: w, ns, track, why: 'no ending frame resolves' });
        }
      });
    });
  });

  // 9. Doing more never leaves a student worse off. Ported from v3 whole.
  const acts = (data.activities && data.activities.activities) || [];
  let actChecks = 0;
  if (acts.length && acts.length <= 16) {
    const schoolStageList = (j.stages || []).filter((s) => !s.chapter && s.age <= 18);
    const capacity = (ids) => {
      const r = { plan: {}, activities: ids, flags: [] };
      return schoolStageList.reduce((sum, s) => {
        const { points } = pointsFor(r, s, data, s.age);
        const y = activityYield(ids, data, s.age);
        return sum + points + Object.keys(y.gain).length + Object.keys(y.disp).length;
      }, 0);
    };
    const ids = acts.map((a) => a.id);
    for (let mask = 0; mask < (1 << ids.length); mask += 1) {
      const set = ids.filter((_, i) => mask & (1 << i));
      const base = capacity(set);
      for (let i = 0; i < ids.length; i += 1) {
        if (mask & (1 << i)) continue;
        actChecks += 1;
        const more = capacity([...set, ids[i]]);
        if (more < base) {
          failures.push({ combo: set.join('+') || 'nothing', why: `adding ${ids[i]} drops capacity from ${base} to ${more}` });
          mask = 1 << ids.length;
          break;
        }
      }
    }
  }

  const ok = failures.length === 0;
  console.log(
    `%cActivity monotonicity: ${failures.some((f) => String(f.why || '').includes('drops capacity')) ? 'FAIL' : 'PASS'} (${actChecks} additions over ${acts.length} activities)`,
    ok ? 'color:#2F7D5B;font-weight:700' : 'color:#B23A2A;font-weight:700'
  );
  console.log(
    `%cJourney sweep: ${ok ? 'PASS' : 'FAIL'} (${(j.stages || []).length} stages, ${cards.length} cards, ${simCount} sims, NS both ways)`,
    ok ? 'color:#2F7D5B;font-weight:700' : 'color:#B23A2A;font-weight:700'
  );
  if (!ok) { console.table(failures.slice(0, 50)); console.error(`${failures.length} journey sweep failures`); }
  return { ok, failures };
}
