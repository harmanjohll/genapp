// Policy gates, for tools/verify.mjs.
//
// Two sweeps. The lower lens sweep holds the Sec 1 and 2 rules to the same
// ethics as the SEC rules (no dead end, never further for adding or raising)
// and keeps SEC counts and aggregates out of what a Sec 1 or 2 student reads.
// The policy sweep pins verdicts that MOE's published rules decide, so a data
// edit that drifts from policy fails loudly instead of shipping.
//
// Pure: no DOM, no storage.

import { reach } from './reach.js?v=4.3.0';
import { evalPlan, subjectsForYear, moreSubjects } from './years.js?v=4.3.0';
import { project } from './project.js?v=4.3.0';
import { advise } from './advice.js?v=4.3.0';
import { report } from './grades.js?v=4.3.0';
import { startLevels, hmtlEligible } from './psle.js?v=4.3.0';

const LV = ['G1', 'G2', 'G3'];
// SEC language that has no place in Sec 1 and 2 advice. The horizon line is
// the one place the SEC count is named, on purpose, so it is not checked.
const SEC_WORDS = /\bfive subjects\b|\b5 subjects\b|\bL1R4\b|\bELR2B2\b|\bELMAB3\b|\bfour subjects\b/i;

function rowsFor(yearId, plan, ctx) {
  const ep = evalPlan(yearId, plan, ctx.subjects);
  return ctx.destinations.map((d) => reach(ep, d, { ...ctx, plan: ep, yearId }));
}

function lowerSeeds(ctx) {
  const rows = subjectsForYear('sec1', ctx.subjects).filter((s) => (s.levels || []).length);
  const seeds = [{}];
  LV.forEach((lv) => {
    const p = {};
    rows.forEach((s) => { if (s.levels.includes(lv) && s.id !== 'ls_literature' && s.id !== 'hmtl') p[s.id] = lv; });
    seeds.push(p);
  });
  seeds.push({ el: 'G3', maths: 'G3', mtl: 'G2', ls_science: 'G3', ls_geography: 'G3', ls_history: 'G2' });
  seeds.push({ el: 'G2', maths: 'G3', mtl: 'G1', ls_science: 'G2', ls_geography: 'G1', ls_history: 'G2', ls_literature: 'G3' });
  seeds.push({ el: 'G1', maths: 'G2', mtl: 'G1', ls_science: 'G1', ls_geography: 'G1', ls_history: 'G1' });
  seeds.push({ el: 'G3', mtl: 'G3', hmtl: 'G3', maths: 'G2' });
  return { rows, seeds };
}

export function lowerLensSweep(ctx) {
  const failures = [];
  let checks = 0;
  const known = new Set(ctx.subjects.map((s) => s.id));

  ctx.destinations.forEach((d) => {
    checks += 1;
    if (!Array.isArray(d.lower) || !d.lower.length) { failures.push({ where: d.id, why: 'no lower rule set' }); return; }
    if (!d.lowerHorizon) failures.push({ where: d.id, why: 'no lowerHorizon line' });
    d.lower.forEach((r) => {
      const ids = [r.test.subject, ...(r.test.subjects || [])].filter(Boolean);
      ids.forEach((id) => { if (!known.has(id)) failures.push({ where: d.id, why: `lower rule names unknown subject ${id}` }); });
      if (r.test.type === 'countAtLevel' || r.test.type === 'totalSubjects') failures.push({ where: d.id, why: `lower rule "${r.label}" counts SEC subjects` });
      if (SEC_WORDS.test(r.label) || SEC_WORDS.test(r.move || '')) failures.push({ where: d.id, why: `lower rule "${r.label}" speaks SEC counts` });
    });
  });

  const { rows, seeds } = lowerSeeds(ctx);
  ['sec1', 'sec2'].forEach((y) => {
    seeds.forEach((seed) => {
      const before = rowsFor(y, seed, ctx);
      before.forEach((r) => {
        checks += 1;
        if (r.lens !== 'lower') failures.push({ where: `${y} ${r.id}`, why: 'not read by the lower rules' });
        if (r.state !== 'open' && (!r.routes.length || !r.moves.length)) failures.push({ where: `${y} ${r.id}`, why: 'a dead end: no route or move' });
        r.moves.forEach((m) => { if (SEC_WORDS.test(m.label) || SEC_WORDS.test(m.short)) failures.push({ where: `${y} ${r.id}`, why: `move speaks SEC counts: ${m.label}` }); });
        if (SEC_WORDS.test(r.status.text)) failures.push({ where: `${y} ${r.id}`, why: `status speaks SEC counts: ${r.status.text}` });
      });
      // Never further for adding or raising.
      rows.forEach((s) => {
        const next = seed[s.id] ? LV[LV.indexOf(seed[s.id]) + 1] : s.levels[0];
        if (!next || !s.levels.includes(next)) return;
        const after = rowsFor(y, { ...seed, [s.id]: next }, ctx);
        after.forEach((a, i) => {
          checks += 1;
          if (a.distance > before[i].distance) failures.push({ where: `${y} ${a.id}`, why: `${s.id} to ${next} moved it further (${before[i].distance} to ${a.distance})` });
        });
      });
      // The advice a Sec 1 or 2 student reads.
      const adv = advise({ yearId: y, plan: seed, ctx });
      const said = [
        adv.start && adv.start.line,
        ...adv.singles.flatMap((m) => [m.line, m.result, m.short, ...(m.because || []), ...(m.still || []).map((x) => x.next)]),
        ...adv.pairs.map((p) => p.line),
        ...adv.holds.map((h) => h.line),
      ].filter(Boolean);
      said.forEach((line) => {
        checks += 1;
        if (SEC_WORDS.test(line)) failures.push({ where: `${y} advice`, why: `speaks SEC counts: ${line.slice(0, 80)}` });
        // Nothing opens before the SEC: a lower move puts a place on track.
        if (/\bopens?\b/.test(line)) failures.push({ where: `${y} advice`, why: `says a place opens in lower sec: ${line.slice(0, 80)}` });
      });
      adv.singles.forEach((m) => { if (m.sec3 && SEC_WORDS.test(m.sec3)) failures.push({ where: `${y} advice`, why: `Sec 3 note speaks SEC counts: ${m.sec3}` }); });
    });
  });
  return { ok: !failures.length, checks, failures };
}

/**
 * The school's offering (data/offer.json, as the Principal gave it on
 * 1 November 2026): what Set levels shows first, and what advice may suggest.
 */
export function offerSweep(ctx, offer) {
  const fails = [];
  if (!offer || !offer.subjects) return { ok: false, fails: ['no offer file'] };
  const byId = new Map(ctx.subjects.map((s) => [s.id, s]));
  Object.entries(offer.subjects).forEach(([id, o]) => {
    const s = byId.get(id);
    if (!s) { fails.push(`offer names unknown subject ${id}`); return; }
    (o.levels || []).forEach((l) => { if (!(s.levels || []).includes(l)) fails.push(`${id} offered at ${l}, which the subject does not have`); });
    (o.elsewhere || []).forEach((l) => { if (!(o.levels || []).includes(l)) fails.push(`${id} marks ${l} elsewhere but does not offer it`); });
  });
  const up = Object.fromEntries(subjectsForYear('sec3', ctx.subjects, offer).map((s) => [s.id, s]));
  ['sci_pb', 'hum_ss_lit', 'history', 'economics', 'ebs', 'higher_art', 'higher_music', 'drama', 'electronics', 'ess'].forEach((id) => {
    if (up[id]) fails.push(`Sec 3 lists ${id}, which Beatty does not offer`);
  });
  const lv = (id) => (up[id] ? up[id].levels.join(' ') : 'missing');
  [['amaths', 'G3'], ['poa', 'G3'], ['geography', 'G3'], ['literature', 'G3'], ['sci_cb', 'G3'], ['dt', 'G2'], ['sci_pc', 'G2 G3'], ['art', 'G2 G3'], ['nfs', 'G2 G3'], ['computing', 'G1 G3'], ['music', 'G3']].forEach(([id, want]) => {
    if (lv(id) !== want) fails.push(`${id} at Beatty should be ${want}, got ${lv(id)}`);
  });
  if (!up.computing || up.computing.elsewhere.join() !== 'G3') fails.push('Computing G3 should be marked as taught elsewhere');
  if (!up.music || up.music.elsewhere.join() !== 'G3') fails.push('Music G3 should be marked as taught elsewhere');
  if (!moreSubjects('sec3', ctx.subjects, offer).some((s) => s.id === 'economics')) fails.push('More subjects should still hold every other school\'s subjects');
  // Advice on a Beatty plan suggests only what Beatty runs.
  const octx = { ...ctx, offer };
  [{ el: 'G2', mtl: 'G2', maths: 'G2', sci_pc: 'G2', hum_ss_geog: 'G2' },
    { el: 'G3', mtl: 'G2', maths: 'G3', chemistry: 'G3', physics: 'G3', hum_ss_hist: 'G3' },
    { el: 'G1', mtl: 'G1', maths: 'G1', science_g1: 'G1', computing: 'G1' }].forEach((plan) => {
    ['sec3', 'sec4'].forEach((y) => {
      const a = advise({ yearId: y, plan, ctx: octx });
      const moves = [...a.singles.flatMap((m) => m.sids.map((sid) => [sid, m.to])), ...a.pairs.flatMap((p) => p.moves.map((m) => [m.sid, m.to]))];
      moves.forEach(([sid, to]) => {
        if (!up[sid]) fails.push(`${y} advice suggests ${sid}, not offered at Beatty`);
        else if (!up[sid].levels.includes(to)) fails.push(`${y} advice suggests ${sid} at ${to}, not a level Beatty runs`);
      });
    });
  });
  // G1 Humanities in lower sec (the Exposure Modules) projects to no Sec 3 row.
  const pj = project({ el: 'G1', ls_geography: 'G1', ls_history: 'G1' }, ctx.subjects).plan;
  if (Object.keys(pj).some((id) => id.startsWith('hum_'))) fails.push('G1 Humanities projected to an examinable Sec 3 Humanities');
  return { ok: !fails.length, fails };
}

export function policySweep(ctx, g, psleRules) {
  const fails = [];
  const state = (y, plan, id) => rowsFor(y, plan, ctx).find((r) => r.id === id).state;

  // Lower sec: Mother Tongue need not be G3 for JC or MI (MOE, L1R4 from 2028).
  const s2 = { el: 'G3', maths: 'G3', mtl: 'G2', ls_science: 'G3', ls_geography: 'G3', ls_history: 'G2' };
  if (state('sec2', s2, 'jc') !== 'open') fails.push('Sec 2 at G3 but Mother Tongue G2: Junior College should be on track');
  if (state('sec2', s2, 'mi') !== 'open') fails.push('Sec 2 at G3 but Mother Tongue G2: Millennia Institute should be on track');
  const s1 = { el: 'G3', maths: 'G3', mtl: 'G2', ls_science: 'G3', ls_geography: 'G3', ls_history: 'G3' };
  const a1 = advise({ yearId: 'sec1', plan: s1, ctx });
  if (a1.singles.some((m) => m.sids.includes('mtl') && m.opens.some((n) => /Junior College|Millennia/.test(n)))) fails.push('Sec 1 advice tells a student Mother Tongue at G3 puts JC on track');
  // Two Humanities can stand in for Science in lower sec (R3 is Humanities, Maths or Science).
  const s2h = { el: 'G3', maths: 'G3', mtl: 'G1', ls_science: 'G2', ls_geography: 'G3', ls_history: 'G3' };
  if (state('sec2', s2h, 'jc') !== 'open') fails.push('Sec 2 with two Humanities at G3 and Science G2: Junior College should be on track');

  // SEC: R3 must be a Humanities, Maths or Science at G3.
  const r3 = { el: 'G3', maths: 'G3', hum_ss_geog: 'G3', mtl: 'G3', poa: 'G3', sci_pc: 'G2' };
  if (state('sec3', r3, 'jc') === 'open') fails.push('SEC plan without a third Humanities, Maths or Science at G3 shows Junior College open');
  if (state('sec3', r3, 'mi') === 'open') fails.push('SEC plan without a third Humanities, Maths or Science at G3 shows Millennia Institute open');
  // SEC: NAFA and LASALLE count four other subjects, at most one at G2.
  const arts = { el: 'G3', mtl: 'G2', maths: 'G2', sci_pc: 'G2', hum_ss_geog: 'G2' };
  if (state('sec3', arts, 'arts') === 'open') fails.push('English G3 with four at G2 shows NAFA or LASALLE open');

  // Grade targets.
  const rep = (plan, now) => Object.fromEntries(report({ plan, grades: { now, target: {} }, g }).flatMap((a) => a.dests.map((d) => [d.id, d])));
  const g2 = rep({ el: 'G2', maths: 'G2', mtl: 'G2', sci_pc: 'G2', hum_ss_geog: 'G2', poa: 'G2' }, { el: '1', maths: '1', mtl: '1', sci_pc: '1', hum_ss_geog: '5', poa: '6' });
  if (g2.pfp.meets) fails.push('PFP counted a G2 grade 5 or 6');
  if (!g2.hnitec.meets) fails.push('Higher Nitec (2 yrs) refused grades it counts');
  const s5 = rep({ el: 'G3', maths: 'G3', sci_pc: 'G3', mtl: 'G2', hum_ss_geog: 'G2' }, { el: 'E8', maths: 'E8', sci_pc: 'E8', mtl: '6', hum_ss_geog: '6' });
  if (!s5.sec5.meets) fails.push('Sec 5: three G3 passes should qualify without the score');
  const fl = rep({ el: 'G3', maths: 'G3', sci_pc: 'G3', hum_ss_geog: 'G3', poa: 'G3' }, { el: 'D7', maths: 'A1', sci_pc: 'A1', hum_ss_geog: 'A1', poa: 'A1' });
  if (fl.jc.meets) fails.push('JC met on L1R4 with English below C6');

  // P6.
  if (!hmtlEligible({ mtl: { al: 4 }, hmtl: { grade: 'M' } })) fails.push('HMTL: a Merit in PSLE Higher Mother Tongue should qualify');
  if (hmtlEligible({ mtl: { al: 3 }, hmtl: { grade: 'P' } })) fails.push('HMTL: AL 3 with a Pass should not qualify');
  const pg3 = startLevels(3, { el: { foundation: true, grade: 'B' }, mtl: { al: 4 }, maths: { al: 4 }, science: { al: 5 } }, psleRules);
  if (!pg3.options.el.includes('G2') || !pg3.options.el.includes('G3')) fails.push('PG3 with Foundation English: G2 should be an option beside G3');
  if (pg3.plan.el !== 'G3') fails.push('PG3 with Foundation English: the default should stay at the group level');
  const pg2 = startLevels(2, { el: { al: 7 }, mtl: { foundation: true, grade: 'B' }, maths: { al: 6 }, science: { al: 6 } }, psleRules);
  if (pg2.options.mtl.includes('G1')) fails.push('The Foundation Mother Tongue option applies to Posting Group 3 only');

  return { ok: !fails.length, checks: 16, fails };
}
