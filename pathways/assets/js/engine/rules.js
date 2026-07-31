// Rule evaluation.
//
// Two kinds of rule live in data/pathways.json and they are treated very differently.
//
//   structural  evaluated here, from what subjects a student is taking and at
//               what level. These are things a student controls now.
//
//   performance never evaluated, anywhere, by anything. Aggregates like L1R4
//               and ELR2B2 depend on grades this app does not have and will not
//               guess. They are displayed as information about what a
//               destination asks for at the end, and that is all.
//
// The app does not predict anyone's results. That is not a limitation we are
// apologising for, it is the design.

export const LEVELS = ['G1', 'G2', 'G3'];

export function levelValue(level) {
  const i = LEVELS.indexOf(level);
  return i < 0 ? 0 : i + 1;
}

export function meets(level, min) {
  return levelValue(level) >= levelValue(min);
}

/** Number of subjects in the plan at or above `min`. */
export function countAtLevel(plan, min) {
  return Object.values(plan).filter((lv) => meets(lv, min)).length;
}

export function subjectLevel(plan, subjectId) {
  return plan[subjectId] || null;
}

export function subjectsInGroup(subjects, groupId) {
  return subjects.filter((s) => s.group === groupId).map((s) => s.id);
}

/**
 * Evaluate one structural test against a plan.
 * Returns { satisfied, distance, shortfall } where distance is the number of
 * separate moves that would satisfy it. Distance is what drives the reach
 * ladder, and it is always finite: there is no unreachable test.
 */
export function evaluate(test, plan, ctx) {
  switch (test.type) {
    case 'always':
      return { satisfied: true, distance: 0 };

    case 'subjectAtLevel': {
      const have = subjectLevel(plan, test.subject);
      if (have && meets(have, test.min)) return { satisfied: true, distance: 0 };
      // Not taking it at all counts as one move. Taking it lower counts as the
      // number of level steps between here and there.
      const distance = have
        ? levelValue(test.min) - levelValue(have)
        : 1;
      return { satisfied: false, distance: Math.max(1, distance), shortfall: 1 };
    }

    case 'countAtLevel': {
      const have = countAtLevel(plan, test.level);
      if (have >= test.min) return { satisfied: true, distance: 0 };
      const shortfall = test.min - have;
      return { satisfied: false, distance: shortfall, shortfall };
    }

    case 'groupAtLevel': {
      const ids = subjectsInGroup(ctx.subjects, test.group);
      const have = ids.filter((id) => plan[id] && meets(plan[id], test.min)).length;
      if (have >= (test.count || 1)) return { satisfied: true, distance: 0 };
      const shortfall = (test.count || 1) - have;
      return { satisfied: false, distance: shortfall, shortfall };
    }

    case 'totalSubjects': {
      const have = Object.keys(plan).length;
      if (have >= test.min) return { satisfied: true, distance: 0 };
      const shortfall = test.min - have;
      return { satisfied: false, distance: shortfall, shortfall };
    }

    default:
      // An unknown test never blocks anything. Failing open is the safe
      // direction here: the cost of a false "closed" is a discouraged student.
      return { satisfied: true, distance: 0, unknown: true };
  }
}

/** Human readable move text for an unmet rule, phrased as an action. */
export function moveFor(rule, res, ctx) {
  const t = rule.test;
  if (t.type === 'subjectAtLevel') {
    const subj = ctx.subjects.find((s) => s.id === t.subject);
    const name = subj ? subj.name : t.subject;
    const have = subjectLevel(ctx.plan, t.subject);
    return have
      ? `Move ${name} up to ${t.min}.`
      : `Add ${name} at ${t.min} or above.`;
  }
  if (t.type === 'countAtLevel') {
    const n = res.shortfall;
    return n === 1
      ? `Bring one more subject up to ${t.level}.`
      : `Bring ${n} more subjects up to ${t.level}.`;
  }
  if (t.type === 'groupAtLevel') {
    return `Take a ${t.group} subject at ${t.min} or above.`;
  }
  if (t.type === 'totalSubjects') {
    return `Take ${res.shortfall} more subject${res.shortfall === 1 ? '' : 's'}.`;
  }
  return rule.label;
}

/** When and with whom a move actually happens, given the student's year. */
export function moveTiming(yearId) {
  switch (yearId) {
    case 'sec1':
      return { when: 'at the end of Sec 1, and again at the end of Sec 2', who: 'your subject teacher, then your form teacher' };
    case 'sec2':
      return { when: 'in the subject combination exercise this year', who: 'your subject teacher first, then your form teacher or ECG counsellor' };
    case 'sec3':
      return { when: 'at the end of Sec 3, and for some subjects during the year', who: 'your subject teacher and your year head' };
    case 'sec4':
      return { when: 'this year, or in a fifth year if you take one', who: 'your subject teacher and your ECG counsellor' };
    case 'sec5':
      return { when: 'this year', who: 'your subject teacher and your ECG counsellor' };
    default:
      return { when: 'at the next subject review', who: 'your subject teacher' };
  }
}
