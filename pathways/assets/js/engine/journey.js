// Journey turn engine. Pure functions over a run object, so that comparing two
// runs side by side is a matter of reading two arrays.
//
// Rules of this engine, in order of importance:
//   1. There is no failure state. Every stage advances.
//   2. Doors never reach zero. Ever.
//   3. A chance the player could not use is described as something that
//      happened while they were not looking. It is never a punishment, and it
//      is always replayable.
//   4. Chances check dispositions, never grades. That is the argument.

const LEDGER_KEYS = ['skills', 'network', 'portfolio', 'doors'];
const DISP_KEYS = ['curiosity', 'persistence', 'flexibility', 'optimism', 'risk'];

const DOORS_FLOOR = 1;

export function createRun(startAge, label) {
  return {
    label: label || 'Run',
    startAge,
    seed: Math.floor(Math.random() * 1e9),
    stepIndex: 0,
    steps: [],
    pending: null,          // a chance card awaiting resolution
    ledger: { skills: 0, network: 0, portfolio: 0, doors: 3 },
    disp: { curiosity: 0, persistence: 0, flexibility: 0, optimism: 0, risk: 0 },
    done: false,
  };
}

/** Stages from the player's current age onwards. */
export function stagesFor(allStages, startAge) {
  const from = allStages.filter((s) => s.age >= startAge);
  return from.length ? from : allStages.slice(-3);
}

export function currentStage(run, stages) {
  return stages[run.stepIndex] || null;
}

export function applyChoice(run, stage, choiceIndex, cards) {
  const choice = stage.choices[choiceIndex];
  if (!choice) return run;

  addLedger(run, choice.gain);
  addDisp(run, choice.disp);

  const step = {
    stageId: stage.id,
    age: stage.age,
    title: stage.title,
    choice: choice.label,
    outcome: choice.outcome,
    chance: null,
  };
  run.steps.push(step);

  const card = pickChance(run, stage, cards);
  if (card) {
    const can = canUse(run, card);
    run.pending = { cardId: card.id, canUse: can };
  } else {
    run.pending = null;
    run.stepIndex += 1;
  }
  return run;
}

/** Resolve the pending chance card, then advance. */
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
    };
  }
  if (can) {
    addLedger(run, card.gain);
    addDisp(run, card.gain);
  } else if (card.type === 'setback') {
    // A missed setback still moves you on. It costs time, never options.
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
  const have = run.disp[card.requires.disposition] || 0;
  return have >= (card.requires.min || 1);
}

/** Deterministic per run, so the same run replayed reads the same. */
function pickChance(run, stage, cards) {
  const eligible = cards.filter(
    (c) => stage.age >= c.minAge && stage.age <= c.maxAge && !usedCard(run, c.id)
  );
  if (!eligible.length) return null;
  const r = lcg(run.seed + run.stepIndex * 7919);
  return eligible[r % eligible.length];
}

function usedCard(run, id) {
  return run.steps.some((s) => s.chance && s.chance.id === id);
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
 * Compare two runs stage by stage. This feeds the single most important screen
 * in the app: the proof, from the player's own two hands, that the same start
 * produced two different stories.
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
  return {
    rows,
    ledgerA: a.ledger,
    ledgerB: b.ledger,
    sameStart: a.startAge === b.startAge,
    bothArrived: true,
  };
}
