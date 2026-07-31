// Global app state. Tiny pub/sub store, no framework, no dependencies.
// Shape follows ecdm/assets/js/state.js deliberately: getState, subscribe, persist, syncUrl.
//
// Everything is local. Nothing is sent anywhere. There is no account and no server.

const STORAGE_KEY = 'pathways.state.v1';

export const MODES = {
  now: {
    id: 'now',
    label: 'Now',
    tagline: 'What you are taking, and what it opens.',
    blurb: 'Build the combination you are considering and see what it opens up. Nothing here is a verdict, and nothing you pick locks anything.',
  },
  journey: {
    id: 'journey',
    label: 'Journey',
    tagline: 'Play it forward to your thirties.',
    blurb: 'Play your life forward, a few years at a time. Chances turn up. Things go wrong. Then play it again differently and see what changes.',
  },
  aim: {
    id: 'aim',
    label: 'Aim',
    tagline: 'Start from what you want.',
    blurb: 'Start from the kind of life you want and work backwards. There is always more than one road, and they are not ranked.',
  },
};

export const YEARS = [
  { id: 'sec1', label: 'Sec 1', age: 13, asks: 'What are you thinking about?' },
  { id: 'sec2', label: 'Sec 2', age: 14, asks: 'What are you considering for Sec 3?' },
  { id: 'sec3', label: 'Sec 3', age: 15, asks: 'What are you actually taking?' },
  { id: 'sec4', label: 'Sec 4', age: 16, asks: 'What are you taking into the SEC?' },
  { id: 'sec5', label: 'Sec 5', age: 17, asks: 'What are you taking this year?' },
];

const initial = () => ({
  mode: 'now',
  year: 'sec2',
  plan: {},          // { subjectId: 'G1' | 'G2' | 'G3' }
  aim: null,         // future id
  actions: [],       // saved "this term" actions
  runs: [],          // completed journey runs, most recent last, capped at 4
  seenIntro: false,
});

function load() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    const base = Object.assign(initial(), stored || {});
    const params = new URLSearchParams(location.search);
    const m = params.get('mode');
    if (m && MODES[m]) base.mode = m;
    return base;
  } catch {
    return initial();
  }
}

const state = load();
const listeners = new Set();

function notify() {
  listeners.forEach((fn) => {
    try { fn(state); } catch (e) { console.error('listener error', e); }
  });
}

function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* private mode, carry on */ }
}

function syncUrl() {
  const url = new URL(location.href);
  url.searchParams.set('mode', state.mode);
  history.replaceState({}, '', url);
}

export function getState() { return state; }

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function setMode(id) {
  if (!MODES[id] || state.mode === id) return;
  state.mode = id;
  persist(); syncUrl(); notify();
}

export function setYear(id) {
  if (!YEARS.some((y) => y.id === id)) return;
  state.year = id;
  persist(); notify();
}

export function setSubjectLevel(subjectId, level) {
  if (level === null) delete state.plan[subjectId];
  else state.plan[subjectId] = level;
  persist(); notify();
}

export function clearPlan() {
  state.plan = {};
  persist(); notify();
}

export function setAim(futureId) {
  state.aim = futureId;
  persist(); notify();
}

export function toggleAction(text) {
  const i = state.actions.indexOf(text);
  if (i >= 0) state.actions.splice(i, 1);
  else state.actions.push(text);
  persist(); notify();
}

export function saveRun(run) {
  state.runs.push(run);
  if (state.runs.length > 4) state.runs.shift();
  persist(); notify();
}

export function clearRuns() {
  state.runs = [];
  persist(); notify();
}

export function markIntroSeen() {
  state.seenIntro = true;
  persist();
}

export function currentYear() {
  return YEARS.find((y) => y.id === state.year) || YEARS[1];
}
