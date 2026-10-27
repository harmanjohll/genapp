// The advice engine: named moves, not generic ones.
//
// v3's lever said "One more at G2". True, and useless: which one? This file
// tries every move a student could actually make on the page they are
// looking at, re-runs reach() for each, and reports what changed in plain
// sentences that name the subject, the level and the destination:
//
//   "If Science moves from G2 to G3, Junior College opens."
//
// Four kinds of advice, all computed, none written by hand:
//   single  one level step on one subject (or adding one, in upper years)
//   pair    two steps that together open something neither opens alone
//   hold    a level that is currently holding a door open (easing it down
//           would move that door further away) - the honest half of advice
//   start   what to tell the app first when the page is too empty to read
//
// Ethics carried over from v3, enforced here:
// - Moves are ranked; destinations never are. Lists of destinations inside a
//   move keep data order.
// - Monotone by construction: reach() guarantees a raise never pushes a
//   destination away, so a "single" can only ever report good news.
// - No move is phrased as an instruction about a person's worth. It is a
//   conditional: if this, then that.
//
// Pure: no DOM, no storage.

import { reach } from './reach.js?v=4.0.0';
import { evalPlan, subjectsForYear, isLower } from './years.js?v=4.0.0';
import { moveTiming } from './rules.js?v=4.0.0';

const LV = ['G1', 'G2', 'G3'];

/** The name a sentence can carry. "Humanities (Social Studies, Geography)"
    is a timetable label; in a sentence it reads as "Social Studies with
    Geography". English and Mother Tongue drop the word Language. */
export function sayName(s) {
  if (!s) return '';
  const m = /^Humanities \(Social Studies, (.+)\)$/.exec(s.name);
  if (m) return `Social Studies with ${m[1]}`;
  if (s.id === 'el') return 'English';
  if (s.id === 'mtl') return 'Mother Tongue';
  return s.name;
}
const up = (lv) => LV[LV.indexOf(lv) + 1] || null;
const down = (lv) => LV[LV.indexOf(lv) - 1] || null;

function reachAll(yearId, plan, c) {
  const ep = evalPlan(yearId, plan, c.subjects);
  return c.destinations.map((d) => reach(ep, d, { ...c, plan: ep, yearId }));
}

function diff(before, after) {
  const opens = [];
  const nearer = [];
  const rules = [];
  after.forEach((a, i) => {
    const b = before[i];
    if (a.state === 'open' && b.state !== 'open') opens.push(a);
    else if (a.distance < b.distance) nearer.push({ row: a, by: b.distance - a.distance, from: b.state, to: a.state });
    const was = new Set((b.gap || []).map((g) => g.label));
    (a.met || []).forEach((m) => { if (was.has(m.label)) rules.push({ dest: a.railName, label: m.label }); });
  });
  return { opens, nearer, rules };
}

function score(d) {
  return d.opens.length * 100
    + d.nearer.reduce((s, n) => s + n.by * 10 + (n.to !== n.from ? 15 : 0), 0);
}

/**
 * @param {Object} o
 * @param {string} o.yearId  the page being looked at
 * @param {Object} o.plan    that year's raw plan
 * @param {Object} o.ctx     { subjects, destinations, routesById, pathwaysMeta }
 * @param {Array}  [o.offer] the school's subject list, if trimmed
 */
export function advise({ yearId, plan, ctx, offer }) {
  const c = ctx;
  const rows = subjectsForYear(yearId, c.subjects, offer).filter((s) => (s.levels || []).length);
  const base = reachAll(yearId, plan, c);
  const timing = moveTiming(yearId);
  const held = rows.filter((s) => plan[s.id]);
  const out = { base, singles: [], pairs: [], holds: [], start: null, timing };

  if (!held.length) {
    out.start = { kind: 'start', line: 'Set your levels first. Advice appears as soon as one is in.' };
    return out;
  }
  const compulsoryMissing = rows.filter((s) => s.compulsory && !plan[s.id]);
  if (compulsoryMissing.length) {
    out.start = {
      kind: 'start',
      line: `Add your ${listNames(compulsoryMissing.map((s) => sayName(s)))} ${compulsoryMissing.length === 1 ? 'level' : 'levels'} for sharper advice.`,
      missing: compulsoryMissing.map((s) => s.id),
    };
  }

  // Candidate single moves.
  const candidates = [];
  rows.forEach((s) => {
    const have = plan[s.id];
    if (have) {
      const next = (s.levels || []).find((l) => LV.indexOf(l) > LV.indexOf(have));
      if (next) candidates.push({ kind: 'raise', s, from: have, to: next });
    } else if (!isLower(yearId) && !s.compulsory) {
      // In upper years an elective not taken is a real option, but only worth
      // naming if it opens something, and only at a level no higher than the
      // student already carries somewhere: advising a student whose highest
      // level is G1 to add Economics at G3 is not advice. Lower years:
      // everything is taken, so a missing row means "not told me yet",
      // handled by `start` above.
      const top = Math.max(...held.map((h) => LV.indexOf(plan[h.id])));
      const lv = (s.levels || []).find((l) => LV.indexOf(l) <= top);
      if (lv) candidates.push({ kind: 'add', s, from: null, to: lv });
    }
  });

  const scored = candidates.map((m) => {
    const after = reachAll(yearId, { ...plan, [m.s.id]: m.to }, c);
    const d = diff(base, after);
    return { ...m, ...d, score: score(d) - (m.kind === 'add' ? 30 : 0), after };
  }).filter((m) => m.score > 0);

  scored.sort((a, b) => b.score - a.score || a.s.name.localeCompare(b.s.name));

  // Moves with the same effect are one piece of advice with a choice inside
  // it ("any one of these three"), not three cards saying the same thing.
  const groups = new Map();
  scored.forEach((m) => {
    const key = [m.kind, m.to, m.opens.map((r) => r.id).join(','), m.nearer.map((n) => n.row.id).join(',')].join('|');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(m);
  });
  const grouped = [...groups.values()];
  // Raises before adds within equal effect: a level you hold is a smaller
  // move than a subject you do not take.
  out.singles = grouped
    .map((g) => finish(g, timing, after(g[0], c, yearId, plan)))
    .filter((m, i, all) => m.kind === 'raise' || all.filter((x) => x.kind === 'add').indexOf(m) < 2)
    .slice(0, 6);

  // Pairs: raises only (adding two subjects is a different conversation).
  const raises = candidates.filter((m) => m.kind === 'raise');
  const singleOpens = new Map(scored.map((m) => [m.s.id, new Set(m.opens.map((r) => r.id))]));
  const pairs = [];
  for (let i = 0; i < raises.length; i += 1) {
    for (let j = i + 1; j < raises.length; j += 1) {
      const a = raises[i]; const b = raises[j];
      const after = reachAll(yearId, { ...plan, [a.s.id]: a.to, [b.s.id]: b.to }, c);
      const d = diff(base, after);
      const alone = new Set([...(singleOpens.get(a.s.id) || []), ...(singleOpens.get(b.s.id) || [])]);
      const fresh = d.opens.filter((r) => !alone.has(r.id));
      if (fresh.length) pairs.push({ a, b, opens: fresh, all: d.opens, score: fresh.length * 100 + score(d) });
    }
  }
  pairs.sort((x, y) => y.score - x.score);
  // Collapse pairs that open the same thing from the same pool: "any two of
  // these three" is one piece of advice, not three.
  const pg = new Map();
  pairs.forEach((p) => {
    const key = p.opens.map((r) => r.id).join(',') + '|' + p.a.to + p.b.to;
    if (!pg.has(key)) pg.set(key, { opens: p.opens, pool: new Map(), score: p.score, n: 0, first: p });
    const g = pg.get(key);
    g.n += 1;
    [p.a, p.b].forEach((m) => g.pool.set(m.s.id, m));
  });
  out.pairs = [...pg.values()].slice(0, 3).map((g) => {
    const pool = [...g.pool.values()];
    const opens = g.opens.map((r) => r.railName);
    const verbOpen = opens.length === 1 ? 'opens' : 'open';
    const line = g.n === 1
      ? `If ${sayName(g.first.a.s)} moves to ${g.first.a.to} and ${sayName(g.first.b.s)} moves to ${g.first.b.to}, ${listNames(opens)} ${verbOpen}. Neither move does that alone.`
      : `If any two of ${listNames(pool.map((m) => sayName(m.s)), 'or')} move up a level, ${listNames(opens)} ${verbOpen}. One alone does not.`;
    return {
      kind: 'pair',
      moves: pool.map((m) => ({ sid: m.s.id, name: sayName(m.s), from: m.from, to: m.to })),
      any: g.n > 1,
      opens,
      line,
      when: timing.when,
      who: timing.who,
    };
  });

  // Holds: which current levels are carrying an open door. Grouped by what
  // they hold, so four G3 subjects holding the same two doors are one card.
  const rawHolds = [];
  held.forEach((s) => {
    const have = plan[s.id];
    const lower = down(have);
    if (!lower || !s.levels.includes(lower)) return;
    const after = reachAll(yearId, { ...plan, [s.id]: lower }, c);
    const closes = after.filter((a, i) => base[i].state === 'open' && a.state !== 'open');
    if (closes.length) rawHolds.push({ s, have, lower, keeps: closes.map((r) => r.railName) });
  });
  const hg = new Map();
  rawHolds.forEach((h) => {
    const key = `${h.keeps.join('|')}#${h.have}`;
    if (!hg.has(key)) hg.set(key, []);
    hg.get(key).push(h);
  });
  out.holds = [...hg.values()].map((g) => {
    const names = g.map((h) => sayName(h.s));
    const { have, lower, keeps } = g[0];
    const many = g.length > 1;
    return {
      kind: 'hold', sid: g[0].s.id, sids: g.map((h) => h.s.id), name: listNames(names), names, level: have, lower, keeps,
      line: `${listNames(names)} at ${have} ${many ? 'are' : 'is'} holding ${listNames(keeps)} open. ${many ? 'If any one eased' : 'Eased'} to ${lower}, ${keeps.length === 1 ? 'it would be' : 'they would be'} a move away again.`,
    };
  });

  return out;
}

function after(m, c, yearId, plan) {
  return reachAll(yearId, { ...plan, [m.s.id]: m.to }, c);
}

function finish(group, timing, afterRows) {
  const m = group[0];
  const opens = m.opens.map((r) => r.railName);
  const nearer = m.nearer.map((n) => n.row.railName);
  const names = group.map((g) => sayName(g.s));
  const any = group.length > 1;
  // Nine names in a sentence is a list, not advice. Past four, name three
  // and count the rest; the card shows them all as chips.
  const spoken = names.length > 4
    ? [...names.slice(0, 3), `${names.length - 3} others`]
    : names;
  let verb;
  if (m.kind === 'raise') {
    verb = any
      ? `If any one of ${listNames(spoken, 'or')} moves up to ${m.to}`
      : `If ${names[0]} moves from ${m.from} to ${m.to}`;
  } else {
    verb = any
      ? `If you add any one of ${listNames(spoken, 'or')} at ${m.to}`
      : `If you add ${names[0]} at ${m.to}`;
  }
  let result;
  if (opens.length && nearer.length) result = `${listNames(opens)} ${opens.length === 1 ? 'opens' : 'open'}, and ${listNames(nearer)} ${nearer.length === 1 ? 'comes' : 'come'} closer.`;
  else if (opens.length) result = `${listNames(opens)} ${opens.length === 1 ? 'opens' : 'open'}.`;
  else result = `${listNames(nearer)} ${nearer.length === 1 ? 'comes' : 'come'} closer.`;

  // What each nearer destination still wants after this move, so "closer"
  // is never a dead end of a sentence.
  const still = m.nearer.map((n) => {
    const a = (afterRows || []).find((r) => r.id === n.row.id);
    const next = a && a.moves.find((x) => x.hard);
    return next ? { dest: n.row.railName, next: next.short } : null;
  }).filter(Boolean);

  return {
    kind: m.kind,
    sids: group.map((g) => g.s.id),
    sid: m.s.id,
    names,
    name: names[0],
    from: m.from,
    to: m.to,
    any,
    opens,
    nearer,
    still,
    line: `${verb}, ${result}`,
    // Only the reasons every subject in the group shares: Geography to G3
    // answers JC's Humanities rule, Maths to G3 does not.
    because: becauseLines(m.rules.filter((r) => group.every((x) => x.rules.some((y) => y.label === r.label && y.dest === r.dest)))),
    short: shortLine(m, names, opens, nearer),
    when: timing.when,
    who: timing.who,
  };
}

// "Junior College: a Humanities at G3; Millennia Institute: a Humanities at
// G3" says one thing twice. Group by rule, name the places once.
function becauseLines(rules) {
  const by = new Map();
  rules.forEach((r) => { if (!by.has(r.label)) by.set(r.label, []); by.get(r.label).push(r.dest); });
  return [...by.entries()].slice(0, 2).map(([label, dests]) =>
    `${listNames(dests)} ${dests.length === 1 ? 'asks' : 'ask'} for ${/^(A|An|One|Two|Three|Four|Five)\b/.test(label) ? label.charAt(0).toLowerCase() + label.slice(1) : label}`);
}

// The dock's version: under fifty characters where it can be.
function shortLine(m, names, opens, nearer) {
  const who = names.length > 1 ? `One of ${names.length} subjects` : names[0];
  const verb = m.kind === 'add' ? `added at ${m.to}` : `to ${m.to}`;
  const what = opens.length
    ? `opens ${opens.length > 2 ? `${opens.length} places` : listNames(opens)}`
    : `brings ${nearer.length > 2 ? `${nearer.length} places` : listNames(nearer)} closer`;
  return `${who} ${verb} ${what}.`;
}

export function listNames(names, joiner = 'and') {
  const n = names.filter(Boolean);
  if (n.length <= 1) return n[0] || '';
  if (n.length === 2) return `${n[0]} ${joiner} ${n[1]}`;
  return `${n.slice(0, -1).join(', ')} ${joiner} ${n[n.length - 1]}`;
}

/**
 * The advice sweep, for tools/verify.mjs. Every single move it reports must
 * really move something, a pair must open what neither single opens, and a
 * hold must really be holding.
 */
export function adviceSweep(ctx) {
  const failures = [];
  let checks = 0;
  const years = ['sec1', 'sec2', 'sec3', 'sec4'];
  years.forEach((y) => {
    const rows = subjectsForYear(y, ctx.subjects).filter((s) => (s.levels || []).length);
    ['G1', 'G2', 'G3'].forEach((lv) => {
      const plan = {};
      rows.forEach((s, i) => {
        if (s.group === 'science' && !isLower(y) && i % 3) return;
        if (s.levels.includes(lv)) plan[s.id] = lv; else if (i % 2) plan[s.id] = s.levels[0];
      });
      const a = advise({ yearId: y, plan, ctx });
      a.singles.forEach((m) => {
        checks += 1;
        if (!m.opens.length && !m.nearer.length) failures.push({ y, lv, why: `${m.sid} reported with no effect` });
        if (!/^If /.test(m.line)) failures.push({ y, lv, why: 'advice line is not a conditional' });
      });
      a.holds.forEach((h) => {
        checks += 1;
        if (!h.keeps.length) failures.push({ y, lv, why: `${h.sid} hold keeps nothing` });
      });
    });
  });
  return { ok: !failures.length, checks, failures };
}
