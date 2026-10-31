// Year by year. v3 held one plan and a year chip; v4 holds a plan per year,
// because a Sec 1 student's levels and the Sec 3 combination they become are
// different objects, decided at different times, by different conversations.
//
// THE FIX THIS FILE EXISTS FOR. v3 fed lower secondary plans to reach()
// directly, and reach() filters lower secondary rows out (correctly: lower
// Science is one subject that becomes one to three). So a Sec 2 student who
// raised Science or Geography was told "Nothing shifted", while the horizon
// line underneath said the opposite. Here every lower secondary plan is read
// through project() before any destination sees it, so the live count and
// the advice agree, and both answer the subjects the student actually takes.
//
// Pure: no DOM, no storage.

import { project } from './project.js?v=4.0.0';

export const YEAR_IDS = ['p6', 'sec1', 'sec2', 'sec3', 'sec4', 'sec5'];
export const PLAN_YEARS = ['sec1', 'sec2', 'sec3', 'sec4', 'sec5'];
export const LOWER = new Set(['sec1', 'sec2']);

export function isLower(yearId) { return LOWER.has(yearId); }

export function prevYear(yearId) {
  const i = PLAN_YEARS.indexOf(yearId);
  return i > 0 ? PLAN_YEARS[i - 1] : null;
}

/** The subject rows a year page offers, in data order. */
export function subjectsForYear(yearId, subjects, offer) {
  const want = isLower(yearId) ? ['lower', 'both'] : ['upper', 'both'];
  return (subjects || []).filter((s) =>
    want.includes(s.phase || 'both')
    && (!offer || s.compulsory || offer.includes(s.id)));
}

/**
 * The plan as destinations should read it. Lower secondary plans go through
 * the projection (the Sec 3 combination that usually follows); upper plans
 * are already in destination terms.
 */
export function evalPlan(yearId, plan, subjects) {
  if (isLower(yearId)) return project(plan || {}, subjects).plan;
  return { ...(plan || {}) };
}

/**
 * The single plan the rest of the app (the game, the adults' hub, the carry
 * link) treats as "my combination": the latest year that has anything in it.
 */
export function effective(plans, subjects) {
  for (let i = PLAN_YEARS.length - 1; i >= 0; i -= 1) {
    const y = PLAN_YEARS[i];
    const p = (plans && plans[y]) || {};
    if (Object.keys(p).length) return { yearId: y, plan: evalPlan(y, p, subjects) };
  }
  return { yearId: null, plan: {} };
}

/**
 * What a year page would start from if the student carried last year
 * forward. Sec 1 to Sec 2 copies like for like; Sec 2 to Sec 3 is the
 * projection (one Science row, the strongest Humanities as the pair); Sec 3
 * onwards copies.
 */
export function carryForward(toYear, plans, subjects) {
  const from = prevYear(toYear);
  if (!from) return null;
  const src = (plans && plans[from]) || {};
  if (!Object.keys(src).length) return null;
  if (isLower(from) && !isLower(toYear)) return { from, plan: project(src, subjects).plan };
  const allowed = new Set(subjectsForYear(toYear, subjects).map((s) => s.id));
  const out = {};
  Object.entries(src).forEach(([id, lv]) => { if (allowed.has(id)) out[id] = lv; });
  return { from, plan: out };
}
