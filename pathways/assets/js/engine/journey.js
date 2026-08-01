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
// The old rules stand: no failure state, every stage advances, no choice is
// scored right or wrong, and asks check dispositions, never grades.

export const PATHS = ['academic', 'applied', 'hands', 'arts'];
const DISP_KEYS = ['curiosity', 'persistence', 'flexibility', 'optimism', 'risk'];
const TRACKS = ['skills', 'network', 'portfolio'];
const TRACK_CAP = 24;
export const POINTS_PER_TURN = 2;

export function createRun(startAge, label, want) {
  return {
    label: label || 'Story',
    startAge,
    want: want || null,          // { id, label } or null for "not sure yet"
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

/**
 * Choices visible to this run at this stage: the authored set, plus any
 * appended choice the player unlocked by holding a door. Never fewer than
 * authored, never a removal.
 */
export function visibleChoices(stage, run) {
  return (stage.choices || []).filter((c) => !c.needsDoor || run.doors.includes(c.needsDoor));
}

/** Spend the turn's points on one or more choices. */
export function applyChoices(run, stage, indices, cards) {
  const pool = visibleChoices(stage, run);
  const chosen = indices.map((i) => pool[i]).filter(Boolean);
  if (!chosen.length) return run;

  const outcomes = [];
  chosen.forEach((choice) => {
    grant(run, choice);
    outcomes.push(resolveOutcome(choice, run));
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
function resolveOutcome(choice, run) {
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
  const pickFrom = rich.length && lcg(run.seed + run.stepIndex * 31) % 3 !== 0 ? rich : pool;
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
  };
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

  // 1. Every stage resolves for every path with a sane choice set.
  const paths = [null, ...PATHS];
  stageList.forEach((stage) => {
    paths.forEach((path) => {
      const r = resolveStage(stage, path);
      const fmt = r.format || 'turn';
      if (fmt === 'reflect') return;
      const base = (r.choices || []).filter((c) => !c.needsDoor);
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
  PATHS.forEach((path, pi) => {
    strategies.forEach((strat, si) => {
      const run = createRun(stageList[0].age, 'sim', null);
      run.seed = 12345 + pi * 7 + si * 13;
      const stages = stagesFor(stageList, run.startAge);
      let guard = 0;
      let doorsPrev = 0;
      while (!run.done && guard++ < 200) {
        const stage = currentStage(run, stages);
        if (!stage) { finish(run, data); break; }
        if ((stage.format || 'turn') === 'reflect') { applyReflection(run, stage, ''); continue; }
        if (run.pending) {
          const card = cards.find((c) => c.id === run.pending.cardId);
          respondToChance(run, card, si % Math.max(1, (card.responses || []).length));
        } else {
          const pool = visibleChoices(stage, run);
          if ((stage.format || 'turn') === 'fork') {
            const idx = stage.id === 's_results' ? Math.min(pi, pool.length - 1) : strat(pool.length);
            applyChoices(run, stage, [Math.max(0, Math.min(pool.length - 1, idx))], cards);
          } else {
            const first = Math.max(0, Math.min(pool.length - 1, strat(pool.length)));
            const picks = [first];
            if ((pool[first].cost || 1) === 1) {
              const second = pool.findIndex((c, i) => i !== first && (c.cost || 1) === 1);
              if (second >= 0) picks.push(second);
            }
            applyChoices(run, stage, picks, cards);
          }
        }
        if (run.doors.length < doorsPrev) failures.push({ path, strat: si, why: 'doors shrank' });
        doorsPrev = run.doors.length;
      }
      if (!run.done) failures.push({ path, strat: si, why: 'run did not complete' });
      if (run.done && run.doors.length < 3) failures.push({ path, strat: si, why: `only ${run.doors.length} doors by the end` });
      if (run.done) frames.add(`${run.topDisposition}`);
      TRACKS.forEach((k) => { if (run.ledger[k] > TRACK_CAP) failures.push({ path, strat: si, why: `${k} over cap` }); });
    });
  });
  if (frames.size < 2) failures.push({ why: 'every simulated strategy produced the same top disposition' });

  const ok = failures.length === 0;
  console.log(
    `%cJourney sweep: ${ok ? 'PASS' : 'FAIL'} (${stageList.length} stages x ${paths.length} paths, ${cards.length} cards, ${strategies.length * PATHS.length} sims)`,
    ok ? 'color:#2F7D5B;font-weight:700' : 'color:#B23A2A;font-weight:700'
  );
  if (!ok) { console.table(failures.slice(0, 50)); console.error(`${failures.length} journey sweep failures`); }
  return { ok, failures };
}
