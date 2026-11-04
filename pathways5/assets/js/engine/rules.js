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
      // Distance is level steps from where you actually are, with "not taking
      // it" counted as step zero.
      //
      // This must be monotone. An earlier version charged 1 move for a subject
      // you were not taking and 2 for the same subject held at G1, which meant
      // a student entering an honest G1 plan watched destinations get FURTHER
      // AWAY as they told the truth about themselves. On a screen where
      // distance is visible, that is the app telling its most vulnerable users
      // that owning their situation cost them something. It never can.
      //
      // assertMonotone() in reach.js now enforces this for every rule type.
      return {
        satisfied: false,
        distance: levelValue(test.min) - levelValue(have),
        shortfall: 1,
      };
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

    // v4: one of a named list at a level, for rules like JC's "a Humanities
    // subject at G3" or "Mathematics or Additional Mathematics at G3".
    // Monotone for the same reason groupAtLevel is: adding or raising a
    // subject can only raise `have`.
    case 'anyAtLevel': {
      const ids = test.subjects || [];
      const have = ids.filter((id) => plan[id] && meets(plan[id], test.min)).length;
      const need = test.count || 1;
      if (have >= need) return { satisfied: true, distance: 0 };
      // Distance counts level steps on the nearest candidate, so a G2 holder
      // is one step away and someone not taking any is two or three.
      const best = Math.max(0, ...ids.map((id) => levelValue(plan[id])));
      return { satisfied: false, distance: Math.max(1, levelValue(test.min) - best) * (need - have), shortfall: need - have };
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
  if (t.type === 'anyAtLevel') {
    const n = res.shortfall || 1;
    const orAbove = t.min === 'G3' ? '' : ' or above';
    // A pool rule ("three of Maths, Science, Mother Tongue or a Humanities")
    // says how many more, from which pool.
    if (rule.pool && (t.count || 1) > 1) {
      const w = ['', 'one', 'two', 'three', 'four', 'five'][n] || String(n);
      return `Bring ${w} more of ${rule.pool} up to ${t.min}${orAbove}.`;
    }
    // One short: name the subjects the student holds that could be it.
    if (n === 1 && (t.count || 1) > 1) {
      const names = (t.subjects || [])
        .filter((id) => ctx.plan && ctx.plan[id] && !meets(ctx.plan[id], t.min))
        .map((id) => { const s = ctx.subjects.find((x) => x.id === id); return s ? (s.shortName || s.name) : id; });
      if (names.length) return `Move ${orList(names)} up to ${t.min}${orAbove}.`;
    }
    return `${rule.move || rule.label}.`;
  }
  return rule.label;
}

function orList(names) {
  if (names.length <= 1) return names[0] || '';
  return `${names.slice(0, -1).join(', ')} or ${names[names.length - 1]}`;
}

/**
 * The same move, short enough for a list row. Max four words.
 * Rows need this because "Add English Language at G3 or above." truncated to
 * four words reads "Add English Language at", which is not a sentence.
 */
export function moveShortFor(rule, res, ctx) {
  const t = rule.test;
  if (t.type === 'subjectAtLevel') {
    const subj = ctx.subjects.find((s) => s.id === t.subject);
    const name = subj ? (subj.shortName || subj.name) : t.subject;
    return `${name} to ${t.min}`;
  }
  if (t.type === 'countAtLevel') {
    const n = res.shortfall;
    return n === 1 ? `One more at ${t.level}` : `${n} more at ${t.level}`;
  }
  if (t.type === 'groupAtLevel') return `A ${t.group} at ${t.min}`;
  if (t.type === 'totalSubjects') return `${res.shortfall} more subjects`;
  if (t.type === 'anyAtLevel') {
    if (rule.pool && (t.count || 1) > 1) return `${res.shortfall} more at ${t.min}`;
    return rule.short || rule.label;
  }
  return rule.label;
}

/** When and with whom a move actually happens, given the student's year. */
export function moveTiming(yearId) {
  switch (yearId) {
    // MOE sets no national dates for lower secondary level changes: schools
    // review at "appropriate junctures", on results and a holistic look at
    // how the student copes. The student can ask; the school decides.
    case 'sec1':
      return { when: 'at your school\'s review, often at the end of Sec 1', who: 'your subject teacher, then your form teacher', how: 'You can ask. The school decides, based on your results and workload.' };
    case 'sec2':
      return { when: 'at your school\'s review, before your Sec 3 subjects are set', who: 'your subject teacher, then your form teacher or ECG counsellor', how: 'You can ask. The school decides, based on your results and workload.' };
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
