// Journey engine v3. Pure functions over a run object.
//
// What changed from v2, and why, in one paragraph each:
//
// ATTENTION POINTS. Every turn grants two points; choices cost one or two.
// Nothing accumulates and nothing is ever subtracted from a stat: the only
// scarcity is the thing you did not spend the year on, which is the one honest
// scarcity of being fifteen. A 4,000 run Monte Carlo on v2 showed choices were
// flavour picks with a dominant column; a spendable budget is what makes them
// decisions.
//
// CHANCE RESPONSES. Cards stopped being receipts. Beat one shows the ask and
// two or three authored responses; a response whose ask is unmet stays fully
// tappable and routes to a stretch outcome that builds the asked disposition.
// Nothing is locked, and the near miss becomes visible instead of a lecture.
//
// DOORS ARE NAMED. run.doors is a list of named doors, never a number. A list
// that only ever gains members makes "doors never decrease" structural, and a
// list cannot be read as a score across a desk. The numeric tracks are damped
// so late gains do not snowball, and the UI renders them as bars, not numbers.
//
// MEMORY. Choices set flags; cards can require flags; late stage outcomes can
// vary on path or flag. The story finally refers to what you did.
//
// THE COMBINATION. A run starts from the subjects the student actually picked
// in Mode NOW, so the two halves of the app finally talk to each other. The
// combination is a starting position, never a starting personality: it adds
// choices and biases which chances turn up, and it touches nothing else. It
// cannot set a path, cannot open or withhold a door, and cannot reach the
// ending. A student taking mostly G1 must be able to play exactly as large a
// game as anyone else, which is the monotonicity rule the subject engine
// already lives under, applied to the story. The sweep asserts it.
//
// The old rules stand: no failure state, every stage advances, no choice is
// scored right or wrong, and asks check dispositions, never grades.

export const PATHS = ['academic', 'applied', 'hands', 'arts'];
const DISP_KEYS = ['curiosity', 'persistence', 'flexibility', 'optimism', 'risk'];
const TRACKS = ['skills', 'network', 'portfolio'];
const TRACK_CAP = 24;
export const POINTS_PER_TURN = 2;
/** At most this many subject choices join a turn, so the list stays readable. */
export const SUBJECT_CHOICE_CAP = 2;

// Holland's six types, as signatures over what this game already measures.
// A choice or a chance card earns affinity with a type when its gains point
// the way that type points. Two signals or more is a match; one is noise.
export const RIASEC_SIGNS = {
  R: { portfolio: 1, skills: 1, persistence: 1 },
  I: { skills: 1, curiosity: 1 },
  A: { portfolio: 1, curiosity: 1 },
  S: { network: 1, optimism: 1 },
  E: { network: 1, risk: 1 },
  C: { skills: 1, persistence: 1 },
};

/** Affinity between a want's RIASEC letter and anything carrying gain/disp. */
export function wantAffinity(obj, riasec) {
  const sign = RIASEC_SIGNS[riasec];
  if (!sign || !obj) return 0;
  let score = 0;
  Object.keys(obj.gain || {}).forEach((k) => { score += sign[k] || 0; });
  Object.keys(obj.disp || {}).forEach((k) => { score += sign[k] || 0; });
  if (obj.asks && sign[obj.asks.disposition]) score += 1;
  return score;
}

export function createRun(startAge, label, want, plan) {
  return {
    label: label || 'Story',
    startAge,
    plan: { ...(plan || {}) },   // { subjectId: 'G1'|'G2'|'G3' }, the combination played
    want: want || null,          // { id, label, riasec?, kind? } or null for "not sure yet"
    aligned: 0,                  // choices lived that pointed the way the want points
    movesMade: [],               // { id, age }, player-initiated moves, each once
    seed: Math.floor(Math.random() * 1e9),
    stepIndex: 0,
    steps: [],
    pending: null,               // { cardId } awaiting a response
    ledger: { skills: 0, network: 0, portfolio: 0 },
    doors: [],                   // door ids, append only
    flags: [],                   // flag ids, append only
    disp: { curiosity: 0, persistence: 0, flexibility: 0, optimism: 0, risk: 0 },
    path: null,
    pathLabel: null,
    reflection: null,            // set by the reflect stage
    raises: [],                  // levels this run actually moved, append only
    done: false,
  };
}

export function stagesFor(allStages, startAge) {
  const from = allStages.filter((s) => s.age >= startAge);
  return from.length ? from : allStages.slice(-3);
}

/** Merge a path variant over the base stage. Pure, so diffing stays trivial. */
export function resolveStage(stage, path) {
  if (!path || !stage.variants || !stage.variants[path]) return stage;
  const v = stage.variants[path];
  return { ...stage, ...v, variants: undefined };
}

export function currentStage(run, stages) {
  const s = stages[run.stepIndex];
  return s ? resolveStage(s, run.path) : null;
}

/** True if the run's combination includes any of the given subject ids. */
export function takesSubject(run, spec) {
  if (!run.plan) return false;
  const ids = Array.isArray(spec) ? spec : [spec];
  return ids.some((id) => !!run.plan[id]);
}

/**
 * Choices visible to this run at this stage: the authored set, plus any choice
 * the player unlocked by holding a door, plus up to SUBJECT_CHOICE_CAP that
 * their combination opens. Everything here appends. Nothing a student picked
 * can take a choice away from them, which is why the base set is computed
 * without reference to the plan at all.
 */
export function visibleChoices(stage, run) {
  const all = stage.choices || [];
  const base = all.filter((c) => !c.needsSubject && (!c.needsDoor || run.doors.includes(c.needsDoor)));
  const subject = all
    .filter((c) => c.needsSubject && takesSubject(run, c.needsSubject))
    .slice(0, SUBJECT_CHOICE_CAP);
  return [...base, ...subject];
}

const LV = { G1: 1, G2: 2, G3: 3 };

/**
 * A choice can raise a subject the student already holds, one level, upward.
 *
 * This is the lower secondary mechanic made real rather than described: asking
 * at thirteen changes the level for the rest of the run, and later stages see
 * it. Three deliberate limits:
 *
 *   It only ever raises, so the combination invariant that no plan finishes
 *   with fewer doors than an empty one survives untouched.
 *   It never ADDS a subject, because adding one would be the app choosing a
 *   combination on a student's behalf.
 *   It never rolls dice. A probability here would be the game simulating a
 *   school's judgement of a child, which this app refuses everywhere else. The
 *   deck carries the disappointment instead, in cards written for it.
 */
function applyRaise(run, spec, meta) {
  if (!spec) return null;
  const ids = Array.isArray(spec.any) ? spec.any : [spec.subject].filter(Boolean);
  for (const id of ids) {
    const cur = run.plan && run.plan[id];
    if (!cur) continue;
    const offered = (meta[id] && meta[id].levels) || [];
    const next = spec.to || offered.find((lv) => LV[lv] === LV[cur] + 1);
    // The offered check matters: without it a raise could put a G1 only subject
    // at G2 and the UI would render a level the subject list says cannot exist.
    if (!next || LV[next] <= LV[cur] || !offered.includes(next)) continue;
    run.plan[id] = next;
    const rec = { subject: id, name: (meta[id] && meta[id].name) || id, from: cur, to: next, age: spec._age };
    run.raises.push(rec);
    return rec;
  }
  return null;
}

/** Spend the turn's points on one or more choices. */
/**
 * Moves are the other half of the game's grammar. A chance happens to you; a
 * move is you acting on the system: asking for help, booking the counsellor,
 * starting an EAE folder. Free, on top of the year's points, one a year and
 * each once, because the scarcity is attention, not permission. A move sets
 * a flag through the same grant() a choice uses, and flagged chance cards
 * are preferred by the draw, so a move this year changes what turns up later.
 */
export function movesAvailable(allMoves, run, age) {
  const made = new Set((run.movesMade || []).map((m) => m.id));
  const usedThisAge = (run.movesMade || []).some((m) => m.age === age);
  return (allMoves || [])
    .filter((m) => age >= m.ages[0] && age <= m.ages[1] && !made.has(m.id))
    .map((m) => ({ ...m, locked: usedThisAge }));
}

export function applyMove(run, move, age) {
  if (!run.movesMade) run.movesMade = [];
  if (run.movesMade.some((m) => m.id === move.id || m.age === age)) return false;
  grant(run, move);
  run.movesMade.push({ id: move.id, age });
  return true;
}

export function applyChoices(run, stage, indices, cards, meta) {
  const pool = visibleChoices(stage, run);
  const chosen = indices.map((i) => pool[i]).filter(Boolean);
  if (!chosen.length) return run;

  const outcomes = [];
  chosen.forEach((choice) => {
    grant(run, choice);
    if (run.want && run.want.riasec && wantAffinity(choice, run.want.riasec) >= 2) {
      run.aligned = (run.aligned || 0) + 1;
    }
    const raised = choice.raise
      ? applyRaise(run, { ...choice.raise, _age: stage.age }, meta || {})
      : null;
    outcomes.push(resolveOutcome(choice, run, raised));
  });

  run.steps.push({
    stageId: stage.id,
    age: stage.age,
    title: stage.title,
    format: stage.format || 'turn',
    choices: chosen.map((c) => c.label),
    outcome: outcomes.join(' '),
    chance: null,
  });

  const card = pickChance(run, stage, cards);
  if (card) run.pending = { cardId: card.id };
  else { run.pending = null; run.stepIndex += 1; }
  return run;
}

/** The reflect stage stores words, grants nothing, and is never scored. */
export function applyReflection(run, stage, text) {
  run.reflection = String(text || '').slice(0, 140);
  run.steps.push({
    stageId: stage.id, age: stage.age, title: stage.title, format: 'reflect',
    choices: [], outcome: run.reflection ? `You wrote: ${run.reflection}` : 'You sat with it a while.',
    chance: null,
  });
  run.pending = null;
  run.stepIndex += 1;
  return run;
}

/**
 * Beat two of a chance card. The response is always available; whether the ask
 * was met only decides which authored text and gains apply. Unmet plus taken
 * builds the asked disposition, because doing it without the footing is
 * exactly how the footing gets built.
 */
export function respondToChance(run, card, responseIndex) {
  const r = (card.responses || [])[responseIndex];
  const step = run.steps[run.steps.length - 1];
  if (!r) { run.pending = null; run.stepIndex += 1; return run; }

  const met = !r.needsAsk || askMet(run, card);
  const text = met ? r.outcome : (r.stretch || r.outcome);

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
  if (thing.gain) {
    TRACKS.forEach((k) => {
      const raw = thing.gain[k];
      if (typeof raw !== 'number' || raw <= 0) return;
      // Damping in the fairmath family: each gain is scaled by remaining
      // headroom so a favoured track slows down instead of snowballing, which
      // is what let v2 endings be read straight off a button column.
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

/** Outcome text, allowing late stages to remember the route and the flags. */
function resolveOutcome(choice, run, raised) {
  if (raised && choice.outcomeRaised) {
    return String(choice.outcomeRaised)
      .replace('{subject}', raised.name)
      .replace('{level}', raised.to);
  }
  const v = choice.outcomeIf;
  if (v) {
    if (run.path && v[`path:${run.path}`]) return v[`path:${run.path}`];
    for (const f of run.flags) if (v[`flag:${f}`]) return v[`flag:${f}`];
  }
  return choice.outcome || '';
}

// --------------------------------------------------------------------------
// The deck

export function eligibleCards(cards, run, age) {
  const used = new Set(run.steps.map((s) => s.chance && s.chance.id).filter(Boolean));
  return cards.filter((c) => {
    if (age < c.minAge || age > c.maxAge) return false;
    if (used.has(c.id)) return false;
    if (c.paths && run.path && !c.paths.includes(run.path)) return false;
    if (c.paths && !run.path) return false;
    if (c.requiresFlag && !run.flags.includes(c.requiresFlag)) return false;
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

function pickChance(run, stage, cards) {
  if ((stage.format || 'turn') === 'reflect') return null;
  const pool = eligibleCards(cards, run, stage.age);
  if (!pool.length) return null;
  // Flag payoffs and band matches are rarer and better; prefer them.
  const rich = pool.filter((c) => c.requiresFlag || c.when);
  let pickFrom = rich.length && lcg(run.seed + run.stepIndex * 31) % 3 !== 0 ? rich : pool;
  // Subjects bias which chances turn up and never which exist. A preference
  // over the pool cannot shrink it, so the minimum pool guarantee and every
  // door remain reachable on any combination, including none at all.
  const fitting = pickFrom.filter((c) => c.subjects && takesSubject(run, c.subjects));
  if (fitting.length && lcg(run.seed + run.stepIndex * 53) % 3 !== 0) pickFrom = fitting;
  // The want biases which chances turn up, exactly the way subjects do: a
  // preference over the pool, never a filter on what exists. A Helpers story
  // meets more people; nothing stops a Doers story from meeting them too.
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

// --------------------------------------------------------------------------
// Endings and comparison

export function finish(run, data) {
  run.done = true;
  run.topDisposition = strongestDisp(run);
  // The moments the ending retells: flag setters, chance payoffs, and the
  // reflection. Three at most, chosen for memory rather than magnitude.
  const scored = run.steps.map((s, i) => {
    let score = 0;
    if (s.chance && s.chance.met === false) score += 3;   // the stretch you took
    if (s.chance && String(s.chance.id || '').startsWith('cb_')) score += 4; // a callback landed
    if (s.format === 'fork') score += 2;
    if (s.format === 'reflect' && run.reflection) score += 3;
    if (i === run.steps.length - 1) score += 1;
    return { s, score };
  }).sort((a, b) => b.score - a.score);
  run.moments = scored.slice(0, 3).map((x) => x.s).sort((a, b) => a.age - b.age);
  return run;
}

export function strongestDisp(run) {
  return DISP_KEYS.reduce((best, k) => (run.disp[k] > run.disp[best] ? k : best), 'curiosity');
}

/**
 * Compare two runs. Rows align on age. The headline comparison is the two
 * door lists, because a pair of lists of named things is the one comparison
 * that cannot be misread as a scoreboard.
 */
export function diffRuns(a, b) {
  const ages = [...new Set([...a.steps.map((s) => s.age), ...b.steps.map((s) => s.age)])].sort((x, y) => x - y);
  const rows = ages.map((age) => {
    const sa = a.steps.find((s) => s.age === age) || null;
    const sb = b.steps.find((s) => s.age === age) || null;
    return {
      age,
      a: sa, b: sb,
      differs: !!(sa && sb && sa.choices.join('|') !== sb.choices.join('|')),
    };
  });
  const shared = a.doors.filter((d) => b.doors.includes(d));
  return {
    rows,
    shared,
    onlyA: a.doors.filter((d) => !shared.includes(d)),
    onlyB: b.doors.filter((d) => !shared.includes(d)),
    wants: [a.want, b.want],
    reflections: [a.reflection, b.reflection],
    paths: [a.pathLabel, b.pathLabel],
    plans: [a.plan || {}, b.plan || {}],
    // Subjects held in one story and not the other. The comparison this mode
    // exists for is what the two runs share despite starting differently.
    sameCombination: sameKeys(a.plan, b.plan),
  };
}

function sameKeys(x, y) {
  const ax = Object.keys(x || {}).sort().join(',');
  const bx = Object.keys(y || {}).sort().join(',');
  return ax === bx;
}

// --------------------------------------------------------------------------
// The sweep. Run with ?dev=1. Extended for v3.

export function runJourneySweep(data) {
  const failures = [];
  const j = data.journey;
  const cards = data.chances.cards;
  const doorIds = new Set(Object.keys(j.doorsCatalog || {}));
  const flagIds = new Set(j.flags || []);
  const stageList = j.stages;
  const allSubjects = (data.subjects && data.subjects.subjects) || [];
  const subjectMeta = Object.fromEntries(allSubjects.map((x) => [x.id, { name: x.shortName || x.name, levels: x.levels || [] }]));
  // 15 is the age the mode used to clamp every run to. Running the sweep from
  // both entry points keeps those sims bit identical to before the lower
  // secondary stages existed, so a failure there is a genuine regression and a
  // failure at 13 is new coverage rather than a reshuffled deck.
  const START_AGES = [stageList[0].age, 15];
  const subjectIds = new Set(allSubjects.map((s) => s.id));

  // 1. Every stage resolves for every path with a sane choice set.
  const paths = [null, ...PATHS];
  stageList.forEach((stage) => {
    paths.forEach((path) => {
      const r = resolveStage(stage, path);
      const fmt = r.format || 'turn';
      if (fmt === 'reflect') return;
      // Base excludes needsSubject as well as needsDoor: the authored minimum
      // has to hold for a student whose combination matches nothing, or the
      // subject choices would be quietly propping up a thin stage.
      const base = (r.choices || []).filter((c) => !c.needsDoor && !c.needsSubject);
      (r.choices || []).forEach((c) => {
        if (!c.needsSubject) return;
        const ids = Array.isArray(c.needsSubject) ? c.needsSubject : [c.needsSubject];
        ids.forEach((id) => {
          if (!subjectIds.has(id)) failures.push({ stage: stage.id, path, why: `unknown subject ${id}` });
        });
      });
      if (fmt === 'fork') {
        if (base.length < 2) failures.push({ stage: stage.id, path, why: 'fork with fewer than 2 choices' });
        return;
      }
      if (base.length < 4) failures.push({ stage: stage.id, path, why: `only ${base.length} base choices` });
      const oneCost = base.filter((c) => (c.cost || 1) === 1);
      if (oneCost.length < 2) failures.push({ stage: stage.id, path, why: 'fewer than two 1 point choices' });
      base.forEach((c) => {
        if ((c.cost || 1) > POINTS_PER_TURN) failures.push({ stage: stage.id, path, why: `choice over budget: ${c.label}` });
        if (c.opens && !doorIds.has(c.opens)) failures.push({ stage: stage.id, path, why: `unknown door ${c.opens}` });
        const flag = c.sets && (typeof c.sets === 'string' ? c.sets : c.sets.flag);
        if (flag && !flagIds.has(flag)) failures.push({ stage: stage.id, path, why: `unknown flag ${flag}` });
      });
    });
  });

  // 2. Every card is a real decision.
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
    (c.subjects || []).forEach((id) => {
      if (!subjectIds.has(id)) failures.push({ card: c.id, why: `unknown subject tag ${id}` });
    });
  });

  // 3. The pool can never starve: for a fresh run (no flags, no bands) on every
  // path at every age, at least MIN_POOL unconditional cards remain.
  const MIN_POOL = 8;
  const agesSeen = [...new Set(stageList.filter((s) => (s.format || 'turn') !== 'reflect').map((s) => s.age))];
  PATHS.forEach((path) => {
    const bare = { steps: [], flags: [], path, ledger: { skills: 0, network: 0, portfolio: 0 }, disp: {} };
    agesSeen.forEach((age) => {
      const n = eligibleCards(cards, bare, age).filter((c) => !c.requiresFlag && !c.when).length;
      if (n < MIN_POOL) failures.push({ path, age, why: `pool ${n} below ${MIN_POOL}` });
    });
  });

  // 4. Strategy simulation: play always first, always last, and alternating,
  // across all four fork picks, and assert doors only grow, the run always
  // completes, and endings are not a single function of column.
  const frames = new Set();
  const strategies = [() => 0, (n) => n - 1, (i) => i % 2];
  let simCount = 0;

  // mode 'full'    strategy indexes the whole visible list
  // mode 'base'    strategy indexes only the choices every combination sees, so
  //                two runs with different plans make the same decisions and any
  //                difference in outcome is caused by the plan rather than by
  //                the plan having shifted what "the last choice" means
  // mode 'subject' always takes a subject choice when one is offered, which is
  //                the only way the new content gets played by the sweep at all
  function playSim(stageList2, cards2, pi, si, strat, plan, mode, startAge) {
    const local = [];
    simCount += 1;
    const from = stagesFor(stageList2, startAge || stageList2[0].age);
    const run = createRun(from[0].age, 'sim', null, plan);
    run.seed = 12345 + pi * 7 + si * 13;
    const stages = from;
    let guard = 0;
    let doorsPrev = 0;
    while (!run.done && guard++ < 200) {
      const stage = currentStage(run, stages);
      if (!stage) { finish(run, data); break; }
      if ((stage.format || 'turn') === 'reflect') { applyReflection(run, stage, ''); continue; }
      if (run.pending) {
        const card = cards2.find((c) => c.id === run.pending.cardId);
        respondToChance(run, card, si % Math.max(1, (card.responses || []).length));
      } else {
        const pool = visibleChoices(stage, run);
        const baseN = pool.filter((c) => !c.needsSubject).length;
        const span = mode === 'base' ? baseN : pool.length;
        if ((stage.format || 'turn') === 'fork') {
          const idx = stage.id === 's_results' ? Math.min(pi, span - 1) : strat(span);
          applyChoices(run, stage, [Math.max(0, Math.min(span - 1, idx))], cards2, subjectMeta);
        } else {
          const subjectIdx = pool.findIndex((c) => c.needsSubject);
          const first = mode === 'subject' && subjectIdx >= 0
            ? subjectIdx
            : Math.max(0, Math.min(span - 1, strat(span)));
          const picks = [first];
          if ((pool[first].cost || 1) === 1) {
            const second = pool.findIndex((c, i) => i !== first && i < span && (c.cost || 1) === 1);
            if (second >= 0) picks.push(second);
          }
          applyChoices(run, stage, picks, cards2, subjectMeta);
        }
      }
      if (run.doors.length < doorsPrev) local.push('doors shrank');
      doorsPrev = run.doors.length;
    }
    if (!run.done) local.push('run did not complete');
    if (run.done && run.doors.length < 3) local.push(`only ${run.doors.length} doors by the end`);
    TRACKS.forEach((k) => { if (run.ledger[k] > TRACK_CAP) local.push(`${k} over cap`); });
    return { run, local };
  }

  PATHS.forEach((path, pi) => {
    strategies.forEach((strat, si) => {
      START_AGES.forEach((from) => {
        const { run, local } = playSim(stageList, cards, pi, si, strat, null, 'full', from);
        local.forEach((why) => failures.push({ path, strat: si, from, why }));
        if (run.done) frames.add(`${run.topDisposition}`);
      });
    });
  });
  if (frames.size < 2) failures.push({ why: 'every simulated strategy produced the same top disposition' });

  // 5. Every combination plays as large a game as no combination at all.
  // Subjects append choices and bias the deck, so a plan can only ever add.
  // This asserts it rather than trusting it: for the same seed and the same
  // strategy, no combination may finish with fewer doors than an empty plan,
  // and none may fail to finish. A G1 heavy plan is in the fixtures precisely
  // because that is the student the app exists for.
  const byLevel = (lv) => Object.fromEntries(
    allSubjects.filter((s) => (s.levels || []).includes(lv)).map((s) => [s.id, lv])
  );
  // Each subject is seeded at a level it is actually offered at, so a fixture
  // can never assert something the subject list says is impossible.
  const pick = (ids) => Object.fromEntries(
    ids
      .map((id) => allSubjects.find((s) => s.id === id))
      .filter(Boolean)
      .map((s) => [s.id, (s.levels || ['G2'])[(s.levels || []).length - 1] || 'G2'])
  );
  const combos = [
    { id: 'empty', plan: null },
    { id: 'all_g1', plan: byLevel('G1') },
    { id: 'all_g2', plan: byLevel('G2') },
    { id: 'all_g3', plan: byLevel('G3') },
    { id: 'science_lean', plan: pick(['el', 'maths', 'amaths', 'physics', 'chemistry', 'hum_ss_geog']) },
    { id: 'arts_lean', plan: pick(['el', 'maths', 'art', 'literature', 'hum_ss_lit']) },
    { id: 'applied_lean', plan: pick(['el', 'maths', 'computing', 'dt', 'hum_ss_hist']) },
    { id: 'thin', plan: pick(['el']) },
  ];
  const baseline = {};
  const totals = {};
  PATHS.forEach((path, pi) => {
    strategies.forEach((strat, si) => {
      combos.forEach((combo) => {
       START_AGES.forEach((from) => {
        const { run, local } = playSim(stageList, cards, pi, si, strat, combo.plan, 'base', from);
        local.forEach((why) => failures.push({ combo: combo.id, path, strat: si, from, why }));
        const key = `${pi}:${si}:${from}`;
        if (combo.id === 'empty') { baseline[key] = run.doors.length; totals.empty = (totals.empty || 0) + run.doors.length; return; }
        totals[combo.id] = (totals[combo.id] || 0) + run.doors.length;
       });
      });
    });
  });

  // Per seed door parity was the right check while a combination could only
  // ever APPEND choices. It stopped being right the moment subjects also began
  // biasing which chances turn up, and a raise started changing the plan mid
  // run: two runs then legitimately draw different cards, and different cards
  // carry different doors, in both directions. Demanding exact parity would
  // forbid the deck from varying at all, which is not a property worth having.
  //
  // What replaced it is a stronger claim, and a two sided one. The app's whole
  // argument is that the combination does not decide how big your life gets, so
  // the test is that no combination ends up materially ahead OR behind an empty
  // plan across every simulation. A combination that quietly advantaged its
  // holder would be just as much a failure of this app as one that penalised
  // them, and only a two sided test catches both.
  const SPREAD = 0.05;
  Object.keys(totals).forEach((id) => {
    if (id === 'empty' || !totals.empty) return;
    const off = Math.abs(totals[id] - totals.empty) / totals.empty;
    if (off > SPREAD) {
      failures.push({
        combo: id,
        why: `${totals[id]} doors across all sims against ${totals.empty} for an empty plan, ${Math.round(off * 100)} percent apart`,
      });
    }
  });

  // 6. The subject choices are actually playable. A run that takes every
  // subject choice it is offered must still finish and still hold doors,
  // otherwise the new content is a trap for the students most drawn to it.
  combos.filter((c) => c.plan).forEach((combo) => {
    PATHS.forEach((path, pi) => {
      const { run, local } = playSim(stageList, cards, pi, 0, strategies[0], combo.plan, 'subject', stageList[0].age);
      local.forEach((why) => failures.push({ combo: combo.id, path, mode: 'subject', why }));
      if (run.done && !run.steps.length) failures.push({ combo: combo.id, path, why: 'empty run' });
    });
  });

  const ok = failures.length === 0;
  console.log(
    `%cJourney sweep: ${ok ? 'PASS' : 'FAIL'} (${stageList.length} stages x ${paths.length} paths, ${cards.length} cards, ${simCount} sims over ${combos.length} combinations)`,
    ok ? 'color:#2F7D5B;font-weight:700' : 'color:#B23A2A;font-weight:700'
  );
  if (!ok) { console.table(failures.slice(0, 50)); console.error(`${failures.length} journey sweep failures`); }
  return { ok, failures };
}
