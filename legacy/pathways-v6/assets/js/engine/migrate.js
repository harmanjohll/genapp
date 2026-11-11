// Bringing saved plans into 6.0, once.
//
// Until 6.0 there were two Paths apps on one device: v4.4 saved under
// `pathways4.state.v1` and v5 under `paths5.state.v1`. v5 copied some of
// v4's state once, on its first visit, so a student may have newer work in
// either. 6.0 saves under its own key and, on its first visit, joins the two:
//
//   - a year's levels: v5's if it set any, else v4's
//   - PSLE results and each grade: v5's if set, else v4's
//   - saved moves: v5's first, then any v4 move not already there
//   - the goal and Plan B exist only in v5
//   - the year: v5's once it was set there, else v4's
//   - anything else (the game, history, settings): v5's unless it is empty
//     there, because v5 saved every field, defaults included
//   - flags that a step was seen, or a setting turned on: on if on in either
//
// The old keys are only read, never written, so the frozen v4.4 in legacy/
// keeps its own plans exactly as they were.
//
// Pure: no storage, no DOM. state.js passes the two parsed objects in.

const YEAR_IDS = ['sec1', 'sec2', 'sec3', 'sec4', 'sec5'];
// Derived on every load, or about one app's own visit, so never carried.
const SKIP = new Set(['plan', 'mode', 'seenVersion', '_fromLink', 'importedFromClassic', 'importedFrom']);
const EITHER = new Set(['seenStart', 'seenIntro', 'seenWelcome', 'soundOn', 'allSubjects', 'families']);

const obj = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? x : null);
const filled = (x) => !!obj(x) && Object.keys(x).length > 0;
const empty = (x) => x == null || (Array.isArray(x) && !x.length) || (obj(x) && !Object.keys(x).length);

function carry(src) {
  const out = {};
  Object.keys(src).forEach((k) => { if (!SKIP.has(k)) out[k] = src[k]; });
  return out;
}

/**
 * @param {Object|null} v5   parsed `paths5.state.v1`, or null
 * @param {Object|null} v4   parsed `pathways4.state.v1`, or null
 * @returns {Object|null}    the state 6.0 starts from, or null for a new device
 */
export function mergeStored(v5, v4) {
  const a = obj(v5);
  const b = obj(v4);
  if (!a && !b) return null;
  if (!a) return { ...carry(b), importedFrom: 'v4' };
  if (!b) return { ...carry(a), importedFrom: 'v5' };

  const out = { importedFrom: 'v4+v5' };
  new Set([...Object.keys(b), ...Object.keys(a)]).forEach((k) => {
    if (SKIP.has(k)) return;
    if (EITHER.has(k)) out[k] = !!a[k] || !!b[k];
    else out[k] = empty(a[k]) && b[k] !== undefined ? b[k] : a[k];
  });
  if (!a.yearSet && b.yearSet) { out.year = b.year; out.yearSet = true; }

  const pa = obj(a.plans) || {};
  const pb = obj(b.plans) || {};
  out.plans = {};
  YEAR_IDS.forEach((y) => { out.plans[y] = filled(pa[y]) ? { ...pa[y] } : (filled(pb[y]) ? { ...pb[y] } : {}); });
  out.psle = filled(a.psle) ? a.psle : (obj(b.psle) || {});
  const ga = obj(a.grades) || {};
  const gb = obj(b.grades) || {};
  out.grades = {};
  ['now', 'target'].forEach((k) => { out.grades[k] = { ...(obj(gb[k]) || {}), ...(obj(ga[k]) || {}) }; });
  const moves = Array.isArray(a.actions) ? [...a.actions] : [];
  (Array.isArray(b.actions) ? b.actions : []).forEach((m) => { if (!moves.includes(m)) moves.push(m); });
  out.actions = moves;
  out.goal = a.goal || null;
  out.scenario = a.scenario || null;
  return out;
}
