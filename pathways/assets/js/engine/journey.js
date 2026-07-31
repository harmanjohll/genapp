// Journey turn engine. Pure functions over a run object, so comparing two runs
// side by side is a matter of reading two arrays.
//
// Rules of this engine, in order of importance:
//   1. There is no failure state. Every stage advances.
//   2. Doors never reach zero. Ever.
//   3. A chance the player could not use is described as something that
//      happened while they were not looking. Never a punishment, always
//      replayable.
//   4. Chances check dispositions, never grades. That is the argument.
//
// PATHS
//
// A choice can set a path, and every stage after that resolves against it. Ten
// stages used to run identically whether the player went to Junior College,
// polytechnic or ITE, which meant nothing you chose at seventeen changed
// anything you saw at eighteen. That was the reason the mode felt hollow.
//
// Four families rather than eight destinations, so each variant can be written
// properly rather than thinly. The branches merge again from the mid thirties,
// which is not a shortcut: it is the thesis of the app expressed as structure.

const LEDGER_KEYS = ['skills', 'network', 'portfolio', 'doors'];
const DISP_KEYS = ['curiosity', 'persistence', 'flexibility', 'optimism', 'risk'];

const DOORS_FLOOR = 1;

export const PATHS = ['academic', 'applied', 'hands', 'arts'];

export function createRun(startAge, label) {
  return {
    label: label || 'Run',
    startAge,
    seed: Math.floor(Math.random() * 1e9),
    stepIndex: 0,
    steps: [],
    pending: null,
    path: null,          // set by a choice carrying sets.path
    pathLabel: null,
    ledger: { skills: 0, network: 0, portfolio: 0, doors: 3 },
    disp: { curiosity: 0, persistence: 0, flexibility: 0, optimism: 0, risk: 0 },
    done: false,
  };
}

export function stagesFor(allStages, startAge) {
  const from = allStages.filter((s) => s.age >= startAge);
  return from.length ? from : allStages.slice(-3);
}

/**
 * Merge a stage's variant for the current path over its base.
 * With no path set, or no variant for it, the base stage is used unchanged.
 */
export function resolveStage(stage, path) {
  if (!stage) return null;
  const v = path && stage.variants && stage.variants[path];
  if (!v) return { ...stage, resolvedPath: null };
  return {
    ...stage,
    ...v,
    id: stage.id,
    age: stage.age,
    variants: undefined,
    resolvedPath: path,
  };
}

export function currentStage(run, stages) {
  return resolveStage(stages[run.stepIndex], run.path);
}

export function applyChoice(run, stage, choiceIndex, cards) {
  const choice = stage.choices[choiceIndex];
  if (!choice) return run;

  addLedger(run, choice.gain);
  addDisp(run, choice.disp);

  // A choice can put the player on a path. This is what makes every later
  // stage read differently.
  if (choice.sets && choice.sets.path) {
    run.path = choice.sets.path;
    run.pathLabel = choice.sets.label || choice.sets.path;
  }

  run.steps.push({
    stageId: stage.id,
    age: stage.age,
    title: stage.title,
    path: run.path,
    choice: choice.label,
    outcome: choice.outcome,
    chance: null,
  });

  const card = pickChance(run, stage, cards);
  if (card) {
    run.pending = { cardId: card.id, canUse: canUse(run, card) };
  } else {
    run.pending = null;
    run.stepIndex += 1;
  }
  return run;
}

export function resolveChance(run, card) {
  const can = canUse(run, card);
  const step = run.steps[run.steps.length - 1];
  if (step) {
    step.chance = {
      id: card.id,
      title: card.title,
      type: card.type,
      taken: can,
      text: can ? card.ifTaken : card.ifMissed,
      needed: card.requires ? card.requires.disposition : null,
    };
  }
  if (can) {
    addLedger(run, card.gain);
    addDisp(run, card.gain);
  } else if (card.type === 'setback') {
    run.ledger.doors = Math.max(DOORS_FLOOR, run.ledger.doors);
  }
  run.pending = null;
  run.stepIndex += 1;
  return run;
}

export function finish(run, endingFrames) {
  run.done = true;
  run.strongest = strongestLedger(run);
  run.topDisposition = strongestDisp(run);
  run.frame = endingFrames.find((f) => f.when === run.strongest) || endingFrames[0];
  return run;
}

// --------------------------------------------------------------------------

function addLedger(run, gain) {
  if (!gain) return;
  LEDGER_KEYS.forEach((k) => {
    if (typeof gain[k] === 'number') run.ledger[k] += gain[k];
  });
  run.ledger.doors = Math.max(DOORS_FLOOR, run.ledger.doors);
}

function addDisp(run, gain) {
  if (!gain) return;
  DISP_KEYS.forEach((k) => {
    if (typeof gain[k] === 'number') run.disp[k] += gain[k];
  });
}

function canUse(run, card) {
  if (!card.requires) return true;
  return (run.disp[card.requires.disposition] || 0) >= (card.requires.min || 1);
}

export function eligibleCards(cards, age, path, used) {
  return cards.filter((c) => {
    if (age < c.minAge || age > c.maxAge) return false;
    if (c.paths && path && !c.paths.includes(path)) return false;
    if (c.paths && !path) return false;   // path specific cards wait for a path
    if (used && used.has(c.id)) return false;
    return true;
  });
}

/** Deterministic per run, so the same run replayed reads the same. */
function pickChance(run, stage, cards) {
  const used = new Set(run.steps.filter((s) => s.chance).map((s) => s.chance.id));
  const pool = eligibleCards(cards, stage.age, run.path, used);
  if (!pool.length) return null;
  return pool[lcg(run.seed + run.stepIndex * 7919) % pool.length];
}

function lcg(seed) {
  let x = (seed * 1103515245 + 12345) & 0x7fffffff;
  x = (x * 1103515245 + 12345) & 0x7fffffff;
  return Math.abs(x);
}

function strongestLedger(run) {
  return LEDGER_KEYS.reduce((best, k) => (run.ledger[k] > run.ledger[best] ? k : best), 'skills');
}

export function strongestDisp(run) {
  return DISP_KEYS.reduce((best, k) => (run.disp[k] > run.disp[best] ? k : best), 'curiosity');
}

/**
 * Compare two runs stage by stage. Stage ages are shared across every path, so
 * step indices still align and this needs no knowledge of branching. It does
 * carry each step's path, which is what lets the compare screen say "you went
 * to polytechnic here, and ITE there, and both of you are fine at fifty five".
 */
export function diffRuns(a, b) {
  const n = Math.max(a.steps.length, b.steps.length);
  const rows = [];
  for (let i = 0; i < n; i += 1) {
    const sa = a.steps[i];
    const sb = b.steps[i];
    rows.push({
      age: (sa && sa.age) || (sb && sb.age),
      title: (sa && sa.title) || (sb && sb.title),
      a: sa || null,
      b: sb || null,
      differs: !!(sa && sb && sa.choice !== sb.choice),
    });
  }
  return { rows, ledgerA: a.ledger, ledgerB: b.ledger, pathA: a.path, pathB: b.path };
}

// --------------------------------------------------------------------------
// Dev sweep, under ?dev=1, alongside the reach invariant and the copy budget.
// --------------------------------------------------------------------------

export function runJourneySweep(data) {
  const failures = [];
  const stages = data.journey.stages;
  const cards = data.chances.cards;
  const MIN_CHOICES = 4;
  const MIN_POOL = 8;

  [null, ...PATHS].forEach((path) => {
    stages.forEach((stage) => {
      const r = resolveStage(stage, path);
      if (!r) { failures.push({ path, stage: stage.id, why: 'did not resolve' }); return; }
      if (!r.situation) failures.push({ path, stage: stage.id, why: 'no situation' });
      if (!r.choices || r.choices.length < MIN_CHOICES) {
        failures.push({ path, stage: stage.id, why: `${(r.choices || []).length} choices, need ${MIN_CHOICES}` });
      }
      (r.choices || []).forEach((c, i) => {
        if (!c.label) failures.push({ path, stage: stage.id, why: `choice ${i} has no label` });
        if (!c.outcome) failures.push({ path, stage: stage.id, why: `choice ${i} has no outcome` });
      });
      const pool = eligibleCards(cards, r.age, path, null);
      if (pool.length < MIN_POOL) {
        failures.push({ path, stage: stage.id, why: `${pool.length} chance cards at age ${r.age}, need ${MIN_POOL}` });
      }
    });
  });

  // Every setback must carry onward moves. This is a HANDOFF contract and it
  // used to be maintained by eye.
  cards.filter((c) => c.type === 'setback').forEach((c) => {
    if (!c.onwardMoves || c.onwardMoves.length < 2) {
      failures.push({ path: '-', stage: c.id, why: 'setback with fewer than 2 onward moves' });
    }
  });

  // Every path must be reachable from some choice, or its variants are dead copy.
  const settable = new Set();
  stages.forEach((s) => {
    const all = [s, ...Object.values(s.variants || {})];
    all.forEach((v) => (v.choices || []).forEach((c) => {
      if (c.sets && c.sets.path) settable.add(c.sets.path);
    }));
  });
  PATHS.forEach((p) => {
    if (!settable.has(p)) failures.push({ path: p, stage: '-', why: 'no choice anywhere sets this path' });
  });

  const ok = failures.length === 0;
  console.log(
    `%cJourney sweep: ${ok ? 'PASS' : 'FAIL'} (${stages.length} stages x ${PATHS.length + 1} paths, ${cards.length} cards)`,
    ok ? 'color:#2F7D5B;font-weight:700' : 'color:#B23A2A;font-weight:700'
  );
  if (!ok) console.table(failures.slice(0, 40));
  return { ok, failures };
}
