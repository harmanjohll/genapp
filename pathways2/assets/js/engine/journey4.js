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
// How much a run can ever grow its yearly points by investing in itself.
export const CAPACITY_CAP = 2;
export const POINTS_PER_TURN = 2;
export const SUBJECT_CHOICE_CAP = 2;
export const MOVE_CHOICE_CAP = 2;
export const HAND_LIMIT = 5;
export const ASKS_PER_YEAR = 2;
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
    // School, the envelope, the service question, and then the whole of the
    // first qualification: every chapter of the road chosen, up to the year the
    // adult life starts. That lands around twenty, which is where a secondary
    // student's real horizon is. It used to stop after two chapters, which
    // handed out a road and then took it away before it had finished.
    const out = [];
    for (const s of all) {
      if (s.adultYears) break;
      out.push(s);
    }
    // A late starter can still fall short of a shape, so the floor stands.
    if (out.length < SHORT_FLOOR) return all.slice(0, Math.max(SHORT_FLOOR, out.length));
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
    // Where each flag came from: the first act that set it, with the age it was
    // set at. This is what lets a payoff line say which year it goes back to
    // instead of implying causation and hoping the player kept the receipts.
    from: {},
    // What home wants, named once at the start or not at all. One of same,
    // steady, theirs, unsaid, split, or null when the student skipped it. Read
    // only by outcome variants; nothing is gated on it and nothing scores it.
    home: null,
    // What the student hoped the results slip would say, written on results eve.
    hope: null,
    disp: { curiosity: 0, persistence: 0, flexibility: 0, optimism: 0, risk: 0 },
    // Capacity is the one thing in this game that compounds. Some choices are
    // not about this year at all: learning to run your own week costs two of
    // this year's points and hands back one point every year after it, for the
    // rest of the run. It only ever grows, so no choice can shrink a later
    // year, which keeps the monotonicity promise the whole app rests on.
    capacity: 0,
    capacityWhy: '',
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
  // What an earlier year bought. Reported with the phrase from the choice that
  // bought it, so the student can see which decision is still paying.
  if (run.capacity) {
    pts += run.capacity;
    reasons.push({ k: 'grown', d: run.capacity, why: run.capacityWhy });
  }
  return { points: Math.max(2, Math.min(4 + CAPACITY_CAP, pts)), reasons };
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

/**
 * Where the student is standing, as institution keys.
 *
 * WHY THIS REPLACED A BOOLEAN. The old gate was schoolOnly, meaning nothing more
 * than "the results fork has not been taken", and it was wrong in both
 * directions at once. It let "Ask my Year Head what moving up takes" follow a
 * student into a polytechnic, which has no Year Heads, and it took the form
 * teacher away from a Junior College student, who has one. One bit cannot
 * express six institutions.
 *
 * The institution comes from the stage, not from the run. Every chapter already
 * knows where it happens, so there is no state to keep in sync and no way for
 * two gates to disagree. A chapter shared by two institutions says both:
 * ch_jc1 is at jc and mi, because Millennia Institute students live it too.
 */
export const institutionsNow = (j, run) => {
  const stage = currentStage(j, run);
  return (stage && stage.at) || ['sec'];
};

const atHere = (thing, here) => {
  const at = thing.at || [];
  return at.some((k) => here.includes(k));
};

const asksFor = (moves, age, run, here) => (moves || []).filter((m) => m.kind === 'ask'
  && age >= m.ages[0] && age <= m.ages[1]
  && atHere(m, here));

/**
 * Deal the hand, and take back anything that has stopped being true.
 *
 * WHY THE PRUNE. The hand was dealt through the gates and then never checked
 * again, and nothing ever left it, so the five asks a student was given at
 * thirteen were still the five they held at nineteen. Two consequences, both
 * seen on a real device: "Ask my Year Head what moving up takes" was on screen
 * in a polytechnic at eighteen, where there is no Year Head and where the ask
 * had aged out two years earlier, and the asks written for later life never
 * appeared at all because the hand was already full of school ones.
 *
 * So the same predicate that decides what may be dealt now also decides what
 * may be kept. A hand is what is true this year, not a souvenir.
 */
export function dealHand(run, moves, age, stage) {
  if (!Array.isArray(run.hand)) run.hand = [];
  const here = (stage && stage.at) || ['sec'];
  const byId = new Map((moves || []).map((m) => [m.id, m]));
  const stillTrue = new Set(asksFor(moves, age, run, here).map((m) => m.id));
  run.hand = run.hand.filter((id) => byId.has(id) && stillTrue.has(id));

  const made = new Set((run.movesMade || []).map((m) => m.id));
  const held = new Set(run.hand);
  const pool = asksFor(moves, age, run, here).filter((m) => !made.has(m.id) && !held.has(m.id));
  if (!pool.length) return run.hand;
  const off = lcg(run.seed + age * 31) % pool.length;
  for (let i = 0; i < pool.length && run.hand.length < HAND_LIMIT; i += 1) {
    run.hand.push(pool[(off + i) % pool.length].id);
  }
  return run.hand;
}

/**
 * The asks in hand that are still true this year, as a view.
 *
 * dealHand prunes the stored hand, but only chapters that deal get pruned, and
 * the results fork does not deal. So the screen asks this instead of reading
 * run.hand, and then no screen can show a stale ask however it was reached.
 */
export function heldAsks(run, moves, age, stage) {
  const here = (stage && stage.at) || ['sec'];
  const eligible = new Map(asksFor(moves, age, run, here).map((m) => [m.id, m]));
  return (run.hand || []).map((id) => eligible.get(id)).filter(Boolean);
}

export function playAsk(run, move, age, moves, stage) {
  if ((run.asksThisYear || 0) >= ASKS_PER_YEAR) return false;
  if (!Array.isArray(run.hand) || !run.hand.includes(move.id)) return false;
  // Cannot play what is no longer true, even if it is still sitting in the hand.
  if (!heldAsks(run, moves, age, stage).some((m) => m.id === move.id)) return false;
  grant(run, move, { what: move.label, age });
  if (!run.movesMade) run.movesMade = [];
  run.movesMade.push({ id: move.id, age });
  run.hand = run.hand.filter((id) => id !== move.id);
  run.asksThisYear = (run.asksThisYear || 0) + 1;
  dealHand(run, moves, age, stage);
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
      && atHere(m, (stage && stage.at) || ['sec']));
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
  const via = [];
  const receipts = [];
  chosen.forEach((choice) => {
    receipts.push(grant(run, choice, { what: choice.label, age }));
    // Paid for this year, collected from next year onward. Capped at two so a
    // late run cannot turn into an eight point year.
    if (choice.capacity && run.capacity < CAPACITY_CAP) {
      run.capacity = Math.min(CAPACITY_CAP, (run.capacity || 0) + choice.capacity);
      run.capacityWhy = choice.grew || run.capacityWhy;
    }
    if (choice.isMove) {
      if (!run.movesMade) run.movesMade = [];
      run.movesMade.push({ id: choice.id, age });
    }
    const raised = choice.raise
      ? applyRaise(run, { ...choice.raise, _age: age }, meta || {})
      : null;
    const r = resolveOutcome(choice, run, raised);
    outcomes.push(r.text);
    via.push(r.via && run.from && run.from[r.via] ? { flag: r.via, ...run.from[r.via] } : null);
  });

  run.steps.push({
    stageId: stage.id,
    age,
    title: stage.chapter || stage.title,
    format: stage.format || 'turn',
    choices: chosen.map((c) => c.label),
    outcomes,
    via,
    outcome: outcomes.join(' '),
    missed: missedLine(stage, run, moves, indices, age, pool),
    opened: run.doors.filter((d) => !doorsBefore.includes(d)),
    chance: null,
  });

  run.asksThisYear = 0;
  const card = pickChance(run, stage, cards, age);
  if (card) {
    run.pending = { cardId: card.id };
    if (card.type === 'interrupt') interruptYear(run, card, chosen, receipts, age);
  } else { run.pending = null; run.stepIndex += 1; }
  return run;
}

/**
 * A mid-year interruption. Life does not ask first: the moment the card
 * arrives, one of the year's plain plans is put on hold, before the student
 * answers anything. The card's responses are about how the year is carried,
 * not whether the thing pauses, because that is how an interruption works.
 *
 * THE RULES THAT KEEP IT HONEST. Only a plain plan is ever paused: a choice
 * that opened a door, set a flag, raised a subject, grew capacity or was a
 * commitment from the move deck is untouchable, so nothing that compounds can
 * be lost and doors stay append only. What the paused plan granted this year
 * is handed back by its own receipt, exactly, never more. Its outcome line
 * now says it waited, the flag thing_waited is set with the paused plan as
 * provenance, and a later card pays the wait off by name. So an interruption
 * changes the texture of a year and never the size of a life, which is the
 * same covenant National Service signs. If the year holds nothing pausable,
 * the card plays as an ordinary encounter and nothing here happens.
 */
function interruptYear(run, card, chosen, receipts, age) {
  const step = run.steps[run.steps.length - 1];
  if (!step || step.waited) return false;
  const droppable = chosen
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => (c.gain || c.disp)
      && !c.opens && !c.sets && !c.raise && !c.capacity && !c.isMove);
  if (!droppable.length) return false;
  const { c, i } = droppable[lcg(run.seed + age * 53) % droppable.length];
  const r = receipts[i] || { gain: {}, disp: {} };
  TRACKS.forEach((k) => { if (r.gain[k]) run.ledger[k] = Math.max(0, run.ledger[k] - r.gain[k]); });
  DISP_KEYS.forEach((k) => { if (r.disp[k]) run.disp[k] = Math.max(0, run.disp[k] - r.disp[k]); });
  const line = String(card.waited || '{what} waited.').replace('{what}', c.label);
  if (Array.isArray(step.outcomes)) {
    step.outcomes[i] = line;
    step.outcome = step.outcomes.join(' ');
  }
  step.waited = { what: c.label, text: line };
  grant(run, { sets: 'thing_waited' }, { what: c.label, age });
  return true;
}

export function applyReflection(run, j, stage, text) {
  const age = ageAt(j, run, run.stepIndex);
  const kept = String(text || '').slice(0, 140);
  // Where the words land. The default is run.reflection, the run's last word,
  // written at 38. A stage may name another keep instead: results eve keeps
  // `hope`, so what a sixteen year old hoped the slip would say survives to the
  // ending without overwriting what thirty eight wants to say.
  run[stage.keeps || 'reflection'] = kept;
  run.steps.push({
    stageId: stage.id, age, title: stage.chapter || stage.title, format: 'reflect',
    choices: [], outcome: kept ? `I wrote: ${kept}` : 'I sat with it a while.',
    chance: null,
  });
  run.pending = null;
  run.stepIndex += 1;
  return run;
}

/**
 * Answer the year's chance card.
 *
 * `helped` is the table game's collaboration hook: when another player at the
 * table vouches for you, a response that would have been a stretch resolves as
 * met. That is not a cheat, it is the mechanism the app already teaches, which
 * is that other people are how doors get opened.
 */
export function respondToChance(run, card, responseIndex, helped) {
  const r = (card.responses || [])[responseIndex];
  const step = run.steps[run.steps.length - 1];
  if (!r) { run.pending = null; run.stepIndex += 1; return run; }

  const met = !r.needsAsk || askMet(run, card) || !!helped;
  const text = met ? r.outcome : (r.stretch || r.outcome);
  const doorsBefore = run.doors.slice();

  if (met) {
    grant(run, r, { what: card.title, age: step ? step.age : null });
  } else {
    const d = card.asks && card.asks.disposition;
    if (d) run.disp[d] = (run.disp[d] || 0) + 1;
    if (r.sets) grant(run, { sets: r.sets }, { what: card.title, age: step ? step.age : null });
  }

  if (step) {
    step.chance = {
      id: card.id, title: card.title, type: card.type,
      response: r.label, met, text,
    };
    const fresh = run.doors.filter((d) => !doorsBefore.includes(d));
    if (fresh.length) step.opened = [...(step.opened || []), ...fresh];
    if (helped) step.helpedBy = helped;
  }
  run.pending = null;
  run.stepIndex += 1;
  return run;
}

export function askMet(run, card) {
  if (!card.asks) return true;
  return (run.disp[card.asks.disposition] || 0) >= (card.asks.min || 1);
}

/**
 * Apply one thing's effects to the run. Returns a receipt of exactly what
 * landed, because an interruption may later need to hand this year's gains
 * back, and the damped arithmetic means only the receipt knows the real sum.
 *
 * `prov` is provenance: the act that is doing the granting, recorded against
 * any flag set here, first setter only. A later payoff line reads it to say
 * "that goes back to fifteen" and name the actual act, so causation is shown
 * instead of implied. First setter only, because the payoff must credit the
 * act that did it, not the latest one to repeat it.
 */
function grant(run, thing, prov) {
  const receipt = { gain: {}, disp: {} };
  const focus = (thing.cost || 1) >= POINTS_PER_TURN ? 1 : 0;
  if (thing.gain) {
    TRACKS.forEach((k) => {
      const raw = thing.gain[k] ? thing.gain[k] + focus : 0;
      if (typeof raw !== 'number' || raw <= 0) return;
      const cur = run.ledger[k];
      const next = Math.min(TRACK_CAP, cur + Math.max(1, Math.round(raw * (TRACK_CAP - cur) / TRACK_CAP)));
      if (next > cur) receipt.gain[k] = next - cur;
      run.ledger[k] = next;
    });
  }
  if (thing.disp) {
    DISP_KEYS.forEach((k) => {
      if (typeof thing.disp[k] === 'number') {
        run.disp[k] += thing.disp[k];
        receipt.disp[k] = thing.disp[k];
      }
    });
  }
  const door = thing.opens;
  if (door && !run.doors.includes(door)) run.doors.push(door);
  const put = (flag) => {
    if (!run.flags.includes(flag)) {
      run.flags.push(flag);
      if (prov && prov.what) {
        if (!run.from) run.from = {};
        if (!run.from[flag]) run.from[flag] = { what: prov.what, age: prov.age };
      }
    }
  };
  const sets = thing.sets;
  if (sets) {
    if (typeof sets === 'string') put(sets);
    else {
      if (sets.path) { run.path = sets.path; run.pathLabel = sets.label || sets.path; }
      if (sets.flag) put(sets.flag);
    }
  }
  return receipt;
}

/**
 * The outcome text this choice resolves to for this run, and what carried it
 * there. `via` is the flag whose earlier setting selected the variant, or null
 * for every other route, so the screen can name the year the payoff goes back
 * to. `home:` variants read the stance the student named at the start; a run
 * that skipped the question simply never matches one, which is the whole
 * design: the question is optional and so is everything it colours.
 */
function resolveOutcome(choice, run, raised) {
  if (raised && choice.outcomeRaised) {
    return {
      text: String(choice.outcomeRaised)
        .replace('{subject}', raised.name)
        .replace('{level}', raised.to),
      via: null,
    };
  }
  const v = choice.outcomeIf;
  if (v) {
    if (run.ns === true && v['ns:yes']) return { text: v['ns:yes'], via: null };
    if (run.ns === false && v['ns:no']) return { text: v['ns:no'], via: null };
    if (run.path && v[`path:${run.path}`]) return { text: v[`path:${run.path}`], via: null };
    if (run.home && v[`home:${run.home}`]) return { text: v[`home:${run.home}`], via: null };
    for (const f of run.flags) if (v[`flag:${f}`]) return { text: v[`flag:${f}`], via: f };
  }
  return { text: choice.outcome || '', via: null };
}

// ---------------------------------------------------------------------------
// The deck.

export function eligibleCards(cards, run, age, stage) {
  const used = new Set(run.steps.map((s) => s.chance && s.chance.id).filter(Boolean));
  return cards.filter((c) => {
    if (age < c.minAge || age > c.maxAge) return false;
    if (used.has(c.id)) return false;
    if (c.paths && run.path && !c.paths.includes(run.path)) return false;
    if (c.paths && !run.path) return false;
    // A card written in one institution's vocabulary is only dealt there. A
    // form teacher and a Year Head belong to secondary school; a lecturer and a
    // module belong to the places after it.
    if (!atHere(c, (stage && stage.at) || ['sec'])) return false;
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
  //
  // Counted over the turns a card could actually land in. The service question
  // and the reflect nights deal nothing, so letting them consume a beat meant
  // inserting one of them shifted every quiet year after it, and the NS parity
  // the sweep holds moved with the furniture. The current turn's step is
  // already pushed when this runs, hence the minus one.
  const dealt = run.steps.filter((s) => s.format !== 'ask-ns' && s.format !== 'reflect').length;
  if ((dealt - 1) % 5 === 3) return null;
  const pool = eligibleCards(cards, run, age, stage);
  if (!pool.length) return null;
  return pool[weightedIndex(pool.map((c) => cardWeight(c, run)), run.seed + run.stepIndex * 7919)];
}

/**
 * How much this card wants to be the one dealt here.
 *
 * WHY WEIGHTS AND NOT FILTERS. The preferences were right and the mechanism was
 * not. Each preference used to REPLACE the pool: two times in three, deal only
 * from the cards that pay off something the student did, then two times in three
 * again, only from the cards about a subject they take. That is graceful when
 * five cards qualify and a rut when one does. Measured over eleven hundred runs,
 * one card took sixty three percent of everything dealt at enlistment, another
 * sixty one percent at the crossroads, and nine chapters had a single card
 * above thirty percent. A student who replays sees the same year twice, which is
 * exactly the complaint that arrived from a phone: this looks familiar.
 *
 * Weighting keeps the preference and loses the rut. A card that pays off an
 * earlier act is worth three ordinary cards, a card about a subject the student
 * takes is worth three, both together six, and against ten ordinary cards the
 * favourite lands about a quarter of the time instead of two thirds.
 */
function cardWeight(card, run) {
  let w = 1;
  if (card.requiresFlag || card.when) w += 2;
  if (card.subjects && takesSubject(run, card.subjects)) w += 2;
  if (run.want && run.want.riasec && wantAffinity(card, run.want.riasec) >= 2) w += 1;
  return w;
}

/** A deterministic weighted draw, so a shared seed still replays exactly. */
function weightedIndex(weights, seed) {
  const total = weights.reduce((a, b) => a + b, 0);
  let target = lcg(seed) % total;
  for (let i = 0; i < weights.length; i += 1) {
    target -= weights[i];
    if (target < 0) return i;
  }
  return weights.length - 1;
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
  const index = byId(data.journey);
  const scored = run.steps.map((s, i) => {
    let score = 0;
    if (s.chance && s.chance.met === false) score += 3;
    if (s.chance && String(s.chance.id || '').startsWith('cb_')) score += 4;
    if (s.format === 'fork') score += 2;
    if (s.format === 'reflect') {
      const st = index.get(s.stageId);
      if (run[(st && st.keeps) || 'reflection']) score += 3;
    }
    if (s.waited) score += 2;
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
// The companion: one classmate, named by the seed, met again down the years.
//
// WHY ONE GHOST AND NOT A CAST. Longitudinal studies of school friendships and
// every memoir of adolescence agree on the texture: a life is measured against
// a small number of recurring people, not a parade. One classmate who turns up
// in Sec 1, again at the fork, once after it on a different road, and once at
// the end is what makes the years feel continuous instead of episodic. The
// lines are strictly texture: the companion never grants, never gates, never
// ranks, and the sweep holds every line to that. Their road is seeded and
// biased away from the player's own, because a friend on the same road shows
// nothing the player's story does not already show. Parallax is the point:
// Gottfredson's circumscription runs on comparison with peers, and the honest
// counter to it is a peer whose different road is going fine.

export function companionName(j, run) {
  const names = ((j.companions || {}).names) || [];
  if (!names.length) return null;
  return names[lcg(((run && run.seed) || 0) * 31 + 7) % names.length];
}

/** The road the companion takes, fixed once the player's own is. */
export function companionRoad(j, run) {
  const others = PATHS.filter((p) => p !== run.path);
  const r = lcg(((run && run.seed) || 0) * 17 + 3);
  if (run.path && r % 4 === 0) return run.path;
  return others[r % others.length];
}

/**
 * The companion's one line for this stage, or null when they do not appear.
 * Deterministic from the run and its lived steps, so a repaint of the same
 * turn always shows the same line and never a second sighting.
 */
export function companionLine(j, run, stage, age) {
  const c = j.companions;
  if (!c || !stage) return null;
  const name = companionName(j, run);
  if (!name) return null;
  const fill = (s) => String(s).replace('{name}', name);
  if (!stage.chapter && c.school && c.school[stage.id]) {
    const pool = c.school[stage.id];
    if (!pool.length) return null;
    return fill(pool[lcg((run.seed || 0) + (stage.age || age || 0) * 13) % pool.length]);
  }
  if ((stage.format || 'turn') === 'fork' && !stage.chapter && Array.isArray(c.fork) && c.fork.length) {
    return fill(c.fork[lcg((run.seed || 0) * 7 + 11) % c.fork.length]);
  }
  if (stage.chapter && (stage.format || 'turn') !== 'ask-ns') {
    const index = byId(j);
    const lived = (run.steps || []).filter((s) => {
      const st = index.get(s.stageId);
      return st && st.chapter && s.format !== 'ask-ns';
    }).length;
    // First chapter after the fork: the friend writes from their own road.
    // Third: crossed paths again, older. Nothing in between, nothing after;
    // scarcity is what makes a sighting land.
    if (lived === 0 && c.after) {
      const road = companionRoad(j, run);
      const line = c.after[road];
      return line ? fill(line) : null;
    }
    if (lived === 2 && Array.isArray(c.later) && c.later.length) {
      return fill(c.later[lcg((run.seed || 0) * 13 + 5) % c.later.length]);
    }
  }
  return null;
}

/** The companion at the end, one line: same road as mine, or a different one, and fine. */
export function companionEnd(j, run) {
  const c = j.companions;
  if (!c || !c.ending) return null;
  const name = companionName(j, run);
  if (!name) return null;
  const road = companionRoad(j, run);
  const line = road === run.path ? c.ending.same : c.ending.different;
  if (!line) return null;
  const word = (c.roads || {})[road] || road;
  return String(line).replace('{name}', name).replace('{road}', word);
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

  // Which conditions resolveOutcome actually tests, as a whitelist.
  const OUTCOME_IF_KEY = /^(ns:yes|ns:no|path:(academic|applied|hands|arts)|flag:[a-z0-9_]+|home:(same|steady|theirs|unsaid|split))$/;

  const paths = [null, ...PATHS];
  (j.stages || []).forEach((stage) => {
    // A reflect stage that keeps its words anywhere other than the two named
    // shelves would write to a field nothing reads. And a stage that keeps
    // `hope` is results eve, whose prompt cannot be the one written for 38, so
    // it must carry its own.
    if (stage.keeps) {
      if ((stage.format || 'turn') !== 'reflect') failures.push({ stage: stage.id, why: 'keeps on a stage that is not a reflect' });
      if (stage.keeps !== 'hope') failures.push({ stage: stage.id, why: `keeps writes to unknown shelf ${stage.keeps}` });
      if (!stage.reflection || !stage.reflection.prompt || (stage.reflection.options || []).length < 3) {
        failures.push({ stage: stage.id, why: 'keeps stage without its own reflection prompt and options' });
      }
    }
    paths.forEach((path) => {
      const r = resolveStage(stage, path);
      const fmt = r.format || 'turn';
      if (fmt === 'reflect' || fmt === 'ask-ns') return;
      const base = (r.choices || []).filter((c) => !c.needsDoor && !c.needsSubject);
      const gated = (r.choices || []).filter((c) => c.needsDoor);
      (r.choices || []).forEach((c) => {
        // A choice that grows capacity has to say what it grew, or the points
        // line reads "One more every year now, because you ." It also has to
        // cost two: a compounding return for one point would make every other
        // choice in the year pointless.
        if (c.capacity) {
          if (!c.grew) failures.push({ stage: stage.id, why: `capacity with no phrase: ${c.label}` });
          if ((c.cost || 1) < 2) failures.push({ stage: stage.id, why: `capacity going cheap: ${c.label}` });
        }
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
        // Every outcomeIf key must be a condition the resolver actually tests,
        // or the variant is a line nobody can ever read. A typo like
        // "flags:went_deep" or "home:stady" would ship silently otherwise.
        Object.keys(c.outcomeIf || {}).forEach((k) => {
          if (!OUTCOME_IF_KEY.test(k)) failures.push({ stage: stage.id, path, why: `outcomeIf key matches nothing: ${k}` });
          const fm = k.match(/^flag:(.+)$/);
          if (fm && !flagIds.has(fm[1])) failures.push({ stage: stage.id, path, why: `outcomeIf reads unknown flag ${fm[1]}` });
        });
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
    // An interruption must be able to name the thing that waited, must not
    // gate its responses on an ask (life does not check the footing first),
    // and must exclude itself after one firing, because the callback that pays
    // the wait off names the FIRST thing that waited and only that one.
    if (c.type === 'interrupt') {
      if (!c.waited || !String(c.waited).includes('{what}')) failures.push({ card: c.id, why: 'interrupt without a {what} in its waited line' });
      if (c.asks) failures.push({ card: c.id, why: 'interrupt gates its responses on an ask' });
      if (c.excludesFlag !== 'thing_waited') failures.push({ card: c.id, why: 'interrupt must carry excludesFlag thing_waited' });
    } else if (c.waited) {
      failures.push({ card: c.id, why: 'waited line on a card that is not an interrupt' });
    }
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

  // 4b. The companion holds their covenant: enough names to feel personal, a
  // line for every school year and every road, and not one line that ranks,
  // addresses the reader, or forgets whose name it is carrying.
  const comp = j.companions || {};
  if ((comp.names || []).length < 6) failures.push({ why: `companions: ${(comp.names || []).length} names, fewer than 6` });
  const compLines = [];
  ['s_sec1', 's_sec2', 's_sec3', 's_sec4'].forEach((sid) => {
    const pool = (comp.school || {})[sid] || [];
    if (pool.length < 2) failures.push({ why: `companions: fewer than 2 lines for ${sid}` });
    compLines.push(...pool);
  });
  if (!Array.isArray(comp.fork) || comp.fork.length < 2) failures.push({ why: 'companions: fewer than 2 fork lines' });
  compLines.push(...(comp.fork || []));
  PATHS.forEach((p) => {
    if (!(comp.after || {})[p]) failures.push({ why: `companions: no after line for ${p}` });
    else compLines.push(comp.after[p]);
    if (!(comp.roads || {})[p]) failures.push({ why: `companions: no road word for ${p}` });
  });
  if (!Array.isArray(comp.later) || comp.later.length < 2) failures.push({ why: 'companions: fewer than 2 later lines' });
  compLines.push(...(comp.later || []));
  ['same', 'different'].forEach((k) => {
    if (!(comp.ending || {})[k]) failures.push({ why: `companions: no ending ${k} line` });
    else compLines.push(comp.ending[k]);
  });
  compLines.forEach((s) => {
    const t = String(s);
    if (!t.includes('{name}')) failures.push({ why: `companion line without {name}: ${t.slice(0, 40)}` });
    if (t.split(/\s+/).filter(Boolean).length > 20) failures.push({ why: `companion line over 20 words: ${t.slice(0, 40)}` });
    if (/\b(ahead of|behind|better than|smarter|top of|beat me)\b/i.test(t)) failures.push({ why: `companion line ranks people: ${t.slice(0, 40)}` });
    if (/\b(he|she|his|hers)\b/i.test(t)) failures.push({ why: `companion line assumes a gender: ${t.slice(0, 40)}` });
  });

  // 5. The pool can never starve, on any family, with or without NS.
  const MIN_POOL = 8;
  const TOP_SHARE = 0.4;
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
        // The probe run must look the way a real run looks AT THIS STAGE. The
        // sweep sets the family up front so it can walk the sequence, but a
        // student has no path during the school years, and school gated cards
        // are eligible then. Modelling it otherwise made the sweep report a
        // starving deck for years that are in fact the best stocked.
        const probe = { ...bare, steps: [], path: s.chapter ? path : null };
        // Pass the stage. The deck is now gated by WHERE the student is, so a
        // pool counted without the stage counts secondary school cards against
        // a chapter set in a polytechnic and reports a famine that is the
        // sweep's own fault.
        const n = eligibleCards(cards, probe, age, s)
          .filter((c) => !c.requiresFlag && !c.when).length;
        if (n < MIN_POOL) {
          failures.push({
            path, ns, stage: s.id, age, why: `pool ${n} below ${MIN_POOL} at ${(s.at || []).join('/')}`,
          });
        }
        // And no card may own the chapter. A pool of twelve is no use if the
        // weighting hands one of them two draws in three, which is what the
        // filter-based picker did: sixty three percent of everything dealt at
        // enlistment was one card, and a student who replayed got the same year
        // back. Flags are all set here on purpose, because that is the state
        // where a card that pays off an earlier act is at its most favoured.
        const loaded = { ...probe, flags: (j.flags || []).slice() };
        const pool = eligibleCards(cards, loaded, age, s);
        if (pool.length >= MIN_POOL) {
          const w = pool.map((c) => cardWeight(c, loaded));
          const share = Math.max(...w) / w.reduce((a, b) => a + b, 0);
          if (share > TOP_SHARE) {
            const worst = pool[w.indexOf(Math.max(...w))];
            failures.push({
              path, ns, stage: s.id, age, why: `${worst.id} takes ${Math.round(share * 100)}% of the chapter`,
            });
          }
        }
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
      // Nothing a student can see may be out of its age window or offered at an
      // institution it does not exist in. This is the guard for a Year Head who
      // followed a student into a polytechnic, two years after ageing out,
      // because the hand was dealt once and then never checked again.
      const here = stage.at || [];
      if (!here.length) local.push(`stage ${stage.id} declares no institution`);
      if (fmt === 'turn') dealHand(run, simMoves, age, stage);
      heldAsks(run, simMoves, age, stage).forEach((m) => {
        if (age < m.ages[0] || age > m.ages[1]) {
          local.push(`ask ${m.id} in hand at ${age}, its window is ${m.ages[0]} to ${m.ages[1]}`);
        }
        if (!(m.at || []).some((k) => here.includes(k))) {
          local.push(`ask ${m.id} in hand at ${here.join('/')}, it belongs at ${(m.at || []).join('/') || 'nowhere'}`);
        }
      });
      visibleChoices(stage, run, simMoves, age).filter((c) => c.isMove).forEach((c) => {
        const m = simMoves.find((x) => x.id === c.id);
        if (!m) return;
        if (age < m.ages[0] || age > m.ages[1]) local.push(`move ${m.id} offered at ${age}, window ${m.ages[0]} to ${m.ages[1]}`);
        if (!(m.at || []).some((k) => here.includes(k))) {
          local.push(`move ${m.id} offered at ${here.join('/')}, it belongs at ${(m.at || []).join('/') || 'nowhere'}`);
        }
      });
      // A card dealt where its vocabulary does not exist is the same fault.
      if (run.pending) {
        const dealt = cards.find((x) => x.id === run.pending.cardId);
        if (dealt && !(dealt.at || []).some((k) => here.includes(k))) {
          local.push(`card ${dealt.id} dealt at ${here.join('/')}, it belongs at ${(dealt.at || []).join('/') || 'nowhere'}`);
        }
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
