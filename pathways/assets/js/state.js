// Global app state. Tiny pub/sub store, no framework, no dependencies.
// Everything is local. Nothing is sent anywhere. There is no account.
//
// notify() carries a typed event so subscribers can update surgically instead
// of repainting the document. A full repaint on every chip tap destroys focus,
// makes transitions impossible, and re-runs the glossary regex over the page.

const STORAGE_KEY = 'pathways.state.v1';

export const MODES = {
  now:     { id: 'now',     label: 'Now' },
  journey: { id: 'journey', label: 'Journey' },
  aim:     { id: 'aim',     label: 'Aim' },
};

export const YEARS = [
  { id: 'sec1', label: 'Sec 1', age: 13 },
  { id: 'sec2', label: 'Sec 2', age: 14 },
  { id: 'sec3', label: 'Sec 3', age: 15 },
  { id: 'sec4', label: 'Sec 4', age: 16 },
  { id: 'sec5', label: 'Sec 5', age: 17 },
];

const LEVEL_CODE = { G1: '1', G2: '2', G3: '3' };
const CODE_LEVEL = { 1: 'G1', 2: 'G2', 3: 'G3' };

const initial = () => ({
  mode: 'now',
  year: 'sec2',
  plan: {},          // { subjectId: 'G1' | 'G2' | 'G3' }
  aim: null,
  actions: [],
  runs: [],
  liveRun: null,     // a Journey run in progress, so a refresh does not destroy it
  looked: [],        // subject ids whose detail has been opened, drives the breadth counter
  guesses: {},
  offer: null,       // subject ids this school runs, null means all
  seenIntro: false,
  seenVersion: null,   // the release this device has already been shown
});

function load() {
  let base;
  try {
    base = Object.assign(initial(), JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || {});
  } catch {
    base = initial();
  }
  // The URL params are checked below, but the persisted values never were, and
  // they are no more trustworthy: they were written by whatever revision of
  // this app ran last, which may predate today's mode and year ids entirely.
  if (!MODES[base.mode]) base.mode = 'now';
  if (!YEARS.some((v) => v.id === base.year)) base.year = 'sec2';
  ['plan', 'guesses'].forEach((k) => { if (!base[k] || typeof base[k] !== 'object' || Array.isArray(base[k])) base[k] = {}; });
  ['actions', 'runs', 'looked'].forEach((k) => { if (!Array.isArray(base[k])) base[k] = []; });
  try {
    const params = new URLSearchParams(location.search);
    const m = params.get('mode');
    if (m && MODES[m]) base.mode = m;
    const p = params.get('p');
    if (p) { base.plan = decodePlan(p); base._fromLink = true; }
    const y = params.get('y');
    if (y && YEARS.some((v) => v.id === y)) base.year = y;
  } catch { /* a malformed link must never break the app */ }
  return base;
}

const state = load();
const listeners = new Set();

// A plan arriving by link is written straight to storage. Without this it lives
// only in memory and is lost the moment the student navigates without the
// parameter, which defeats the point of carrying it to another device.
if (state._fromLink) { delete state._fromLink; persist(); }

function notify(evt) {
  listeners.forEach((fn) => {
    try { fn(state, evt || { kind: 'full' }); } catch (e) { console.error('listener error', e); }
  });
}

function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* private mode */ }
}

function syncUrl() {
  try {
    const url = new URL(location.href);
    url.searchParams.set('mode', state.mode);
    history.replaceState({}, '', url);
  } catch { /* ignore */ }
}

export function getState() { return state; }

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function setMode(id) {
  if (!MODES[id]) return;
  // A tap on the mode you are already in still repaints. The early return that
  // used to sit here made that tap do literally nothing, which is invisible
  // when the screen is healthy and indistinguishable from a dead app when a
  // paint has failed: the one gesture a person reaches for to unstick a screen
  // is the tab itself.
  if (state.mode !== id) {
    state.mode = id;
    persist(); syncUrl();
  }
  notify({ kind: 'mode' });
}

export function setYear(id) {
  if (!YEARS.some((y) => y.id === id)) return;
  state.year = id;
  persist(); notify({ kind: 'year' });
}

/** The hot path. Emits a typed event so mode-now can update in place. */
export function setSubjectLevel(subjectId, level, subjectName) {
  const had = Object.keys(state.plan).length;
  const prev = state.plan[subjectId] || null;
  if (level === null) delete state.plan[subjectId];
  else state.plan[subjectId] = level;
  persist();
  notify({
    kind: 'plan',
    subjectId,
    subjectName: subjectName || subjectId,
    level,
    prev,
    action: level === null ? 'clear' : (prev ? 'raise' : 'set'),
    first: had === 0,
  });
}

export function clearPlan() {
  const backup = { ...state.plan };
  state.plan = {};
  persist(); notify({ kind: 'plan', action: 'clearAll' });
  return backup;
}

export function restorePlan(backup) {
  state.plan = { ...backup };
  persist(); notify({ kind: 'plan', action: 'restore' });
}

export function markLooked(subjectId) {
  if (state.looked.includes(subjectId)) return;
  state.looked.push(subjectId);
  persist(); notify({ kind: 'looked' });
}

export function setAim(futureId) {
  state.aim = futureId;
  persist(); notify({ kind: 'aim' });
}

export function toggleAction(text) {
  const i = state.actions.indexOf(text);
  if (i >= 0) state.actions.splice(i, 1); else state.actions.push(text);
  persist(); notify({ kind: 'actions' });
}

export function lockGuess(id, value) {
  state.guesses[id] = value;
  persist(); notify({ kind: 'guess' });
}

export function setLiveRun(run) {
  state.liveRun = run;
  persist();
}

export function saveRun(run) {
  state.runs.push(run);
  if (state.runs.length > 4) state.runs.shift();
  state.liveRun = null;
  persist(); notify({ kind: 'runs' });
}

export function clearRuns() {
  state.runs = []; state.liveRun = null;
  persist(); notify({ kind: 'runs' });
}

export function setOffer(ids) {
  state.offer = ids && ids.length ? ids : null;
  persist(); notify({ kind: 'offer' });
}

/**
 * The build a device last saw.
 *
 * This ships from a branch to a browser that caches aggressively, so a class
 * can be sitting on three different builds with nobody aware of it. The
 * version is baked into the data, compared against what this device saw last,
 * and the difference is shown once. A student who has never opened the app is
 * not shown a changelog: the first run is marked silently, because a list of
 * what changed is meaningless to someone who has seen none of it.
 */
export function markVersionSeen(v) {
  state.seenVersion = v;
  persist();
}

export function markIntroSeen() {
  state.seenIntro = true;
  persist();
}

export function currentYear() {
  return YEARS.find((y) => y.id === state.year) || YEARS[1];
}

// --- reconciling stored state with today's data ---------------------------
// The storage key has never changed, but the data underneath it has: subject
// ids were renamed against SEAB, the journey engine was rebuilt twice, chance
// cards were rewritten. localStorage survives every deploy, so a student who
// used an old revision carries a plan keyed by subjects that no longer exist
// and a saved run shaped for an engine that no longer runs it. Resurrecting
// that run threw during paint, the error was swallowed, and the mode showed
// nothing, forever, on every device that had ever used the old version.
// Nothing is migrated, because none of it can be: a run is a story told by a
// particular engine against particular content. What no longer validates is
// dropped, and the plan keeps every subject that still exists.

function validRun(r, cardIds) {
  if (!r || typeof r !== 'object') return false;
  if (!Number.isFinite(r.startAge) || !Number.isFinite(r.stepIndex)) return false;
  if (typeof r.done !== 'boolean') return false;
  if (!Array.isArray(r.steps) || !Array.isArray(r.doors) || !Array.isArray(r.flags) || !Array.isArray(r.raises)) return false;
  if (!r.ledger || typeof r.ledger !== 'object' || !['skills', 'network', 'portfolio'].every((k) => Number.isFinite(r.ledger[k]))) return false;
  if (!r.disp || typeof r.disp !== 'object' || !['curiosity', 'persistence', 'flexibility', 'optimism', 'risk'].every((k) => Number.isFinite(r.disp[k]))) return false;
  if (r.plan == null || typeof r.plan !== 'object' || Array.isArray(r.plan)) return false;
  if (r.want != null && (typeof r.want !== 'object' || typeof r.want.label !== 'string')) return false;
  if (r.pending != null && !(typeof r.pending === 'object' && cardIds.has(r.pending.cardId))) return false;
  return true;
}

export function reconcile(data) {
  const levelsById = Object.fromEntries(((data.subjects && data.subjects.subjects) || []).map((s) => [s.id, s.levels || []]));
  const cardIds = new Set(((data.chances && data.chances.cards) || []).map((c) => c.id));
  const before = { plan: Object.keys(state.plan).length, runs: state.runs.length, live: !!state.liveRun };

  const prunePlan = (plan) => {
    Object.keys(plan).forEach((id) => {
      if (!levelsById[id] || !levelsById[id].includes(plan[id])) delete plan[id];
    });
  };
  prunePlan(state.plan);
  state.looked = state.looked.filter((id) => levelsById[id]);
  Object.keys(state.guesses).forEach((id) => { if (!levelsById[id]) delete state.guesses[id]; });
  if (state.offer) {
    state.offer = state.offer.filter((id) => levelsById[id]);
    if (!state.offer.length) state.offer = null;
  }

  const moveIds = new Set(((data.moves && data.moves.moves) || []).map((m) => m.id));
  const pruneMoves = (r) => {
    if (Array.isArray(r.movesMade)) r.movesMade = r.movesMade.filter((m) => m && moveIds.has(m.id));
    else r.movesMade = [];
  };
  state.runs = state.runs.filter((r) => validRun(r, cardIds));
  state.runs.forEach((r) => { prunePlan(r.plan); pruneMoves(r); });
  if (state.liveRun && !validRun(state.liveRun, cardIds)) state.liveRun = null;
  if (state.liveRun) { prunePlan(state.liveRun.plan); pruneMoves(state.liveRun); }

  const dropped = {
    plan: before.plan - Object.keys(state.plan).length,
    runs: before.runs - state.runs.length,
    live: before.live && !state.liveRun,
  };
  if (dropped.plan || dropped.runs || dropped.live) {
    persist();
    console.info('[state] dropped what no longer matches today\'s data:', dropped);
  }
  return dropped;
}

// --- carrying a plan between devices -------------------------------------
// School Chromebooks are shared and profiles get wiped, so localStorage alone
// means week two starts from nothing. A link carries the plan and nothing else.

export function encodePlan(plan) {
  return Object.entries(plan || state.plan)
    .map(([id, lv]) => `${id}${LEVEL_CODE[lv] || ''}`)
    .join('~');
}

export function decodePlan(str) {
  const out = {};
  String(str).split('~').forEach((tok) => {
    const m = tok.match(/^([a-z_0-9]+?)([123])$/);
    if (m) out[m[1]] = CODE_LEVEL[m[2]];
  });
  return out;
}

export function shareUrl() {
  const url = new URL(location.href);
  url.searchParams.set('p', encodePlan());
  url.searchParams.set('y', state.year);
  url.searchParams.set('mode', state.mode);
  return url.toString();
}
