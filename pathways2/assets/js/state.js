// Global app state. Tiny pub/sub store, no framework, no dependencies.
// Everything is local. Nothing is sent anywhere. There is no account.
//
// v2 keeps its own key, so a device that used v1 keeps that state untouched
// and v2 starts clean. Nothing migrates: the two builds model runs
// differently, and a half understood run is worse than a fresh one.

const STORAGE_KEY = 'pathways2.state.v1';

export const MODES = {
  now:     { id: 'now',     label: 'Plan' },
  journey: { id: 'journey', label: 'Play' },
  aim:     { id: 'aim',     label: 'Act' },
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
  plan: {},
  activities: [],
  aim: null,
  actions: [],
  runs: [],
  liveRun: null,
  looked: [],
  guesses: {},
  offer: null,
  seenIntro: false,
  seenLanding: false,   // the one question the landing asks, asked once
  landingGuess: null,   // what they guessed, kept so the reveal can quote it
  soundOn: false,       // five small cues, opt in, remembered
  seenVersion: null,
  history: [],          // plan snapshots: { t, plan, open }, one a day at most
  // Which kind of secondary school this is, if the student said. Null means the
  // app carries on assuming the common one and saying so out loud, which is what
  // it did before anybody could answer. Stored because a student in a specialised
  // school should not have to re read the same disclaimer every visit.
  schoolKind: null,
});

function load() {
  let base;
  try {
    base = Object.assign(initial(), JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || {});
  } catch {
    base = initial();
  }
  if (!MODES[base.mode]) base.mode = 'now';
  if (!YEARS.some((v) => v.id === base.year)) base.year = 'sec2';
  ['plan', 'guesses'].forEach((k) => { if (!base[k] || typeof base[k] !== 'object' || Array.isArray(base[k])) base[k] = {}; });
  ['actions', 'runs', 'looked', 'activities', 'history'].forEach((k) => { if (!Array.isArray(base[k])) base[k] = []; });
  try {
    const params = new URLSearchParams(location.search);
    const m = params.get('mode');
    if (m && MODES[m]) { base.mode = m; base.seenLanding = true; }
    const p = params.get('p');
    if (p) { base.plan = decodePlan(p); base._fromLink = true; base.seenLanding = true; }
    const y = params.get('y');
    if (y && YEARS.some((v) => v.id === y)) base.year = y;
    // A carry link, read back. Everything here is additive and everything is
    // validated, because a link is the one input a stranger can hand a student and
    // a malformed one must never break the app or overwrite more than it names.
    const want = params.get('want');
    if (want && /^[a-z_]{2,20}$/.test(want)) { base.aim = want; base._fromLink = true; }
    const sk = params.get('sk');
    if (sk && /^[a-z_]{2,20}$/.test(sk)) { base.schoolKind = sk; base._fromLink = true; }
    const act = params.get('act');
    if (act) {
      const ids = act.split('~').filter((x) => /^[a-z_0-9]{2,24}$/.test(x)).slice(0, 20);
      if (ids.length) { base.activities = ids; base._fromLink = true; }
    }
    const todo = params.get('todo');
    if (todo) {
      // A link is the one input a stranger fully controls, and this one writes into
      // a child's list of things they said they would do. Everything is escaped on
      // render, so nothing can execute, but escaped abuse is still abuse sitting in
      // somebody's list. So a commitment arriving by link has to look like a
      // sentence this app could have produced: ordinary words and ordinary
      // punctuation, no angle brackets, no braces, no urls.
      const SANE = /^[A-Za-z0-9 ,.'’()%:;?!$-]{3,120}$/;
      const list = todo.split('|').map((x) => {
        try { return decodeURIComponent(x).trim(); } catch { return ''; }
      }).filter((x) => SANE.test(x) && !/https?:/i.test(x)).slice(0, 12);
      // Merged rather than replaced, so opening a link on a device that already
      // holds commitments adds to them instead of deleting somebody's term.
      if (list.length) {
        base.actions = [...new Set([...(base.actions || []), ...list])];
        base._fromLink = true;
      }
    }
  } catch { /* a malformed link must never break the app */ }
  return base;
}

const state = load();
const listeners = new Set();

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

/**
 * Which kind of secondary school this is.
 *
 * One string on the device, and the only reason it exists is that the app makes
 * an assumption on the Plan screen and a student for whom the assumption is wrong
 * should be able to say so once rather than reading past it every visit. Null is a
 * real answer and the default: it means keep assuming the common road and keep
 * saying that out loud.
 */
export function setSchoolKind(id) {
  state.schoolKind = id || null;
  persist(); notify({ kind: 'schoolKind' });
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

export function toggleActivity(id) {
  const i = state.activities.indexOf(id);
  if (i >= 0) state.activities.splice(i, 1); else state.activities.push(id);
  persist(); notify({ kind: 'activities' });
}

export function setOffer(ids) {
  state.offer = ids && ids.length ? ids : null;
  persist(); notify({ kind: 'offer' });
}

export function markVersionSeen(v) {
  state.seenVersion = v;
  persist();
}

export function markIntroSeen() {
  state.seenIntro = true;
  persist();
}

/**
 * The plan, photographed for the student's own future self.
 *
 * One snapshot a day at most, only when the plan is non empty and actually
 * different from the last photograph, capped at twelve. It exists so Plan can
 * say "since March: English G2 to G3, two more doors open", which is the
 * cheapest proof this app can offer that a road moves. Device local, like
 * everything else.
 */
export function snapshotPlan(openCount) {
  const today = new Date().toISOString().slice(0, 10);
  const plan = { ...state.plan };
  if (!Object.keys(plan).length) return;
  const hist = state.history;
  const last = hist[hist.length - 1];
  const same = last && JSON.stringify(last.plan) === JSON.stringify(plan) && last.open === openCount;
  if (same) return;
  if (last && last.t === today) { last.plan = plan; last.open = openCount; persist(); return; }
  hist.push({ t: today, plan, open: openCount });
  if (hist.length > 12) hist.shift();
  persist();
}

/** The most recent snapshot at least `days` old and different from today's plan. */
export function sincePoint(days) {
  const cutoff = Date.now() - days * 86400000;
  const candidates = state.history.filter((h) => new Date(h.t).getTime() <= cutoff);
  const last = candidates[candidates.length - 1];
  if (!last) return null;
  if (JSON.stringify(last.plan) === JSON.stringify(state.plan)) return null;
  return last;
}

/** The landing's one question: asked once, guess kept for the reveal. */
export function markLanding(guess) {
  state.seenLanding = true;
  if (guess != null) state.landingGuess = guess;
  persist();
}

export function setSound(on) {
  state.soundOn = !!on;
  persist(); notify({ kind: 'sound' });
}

export function currentYear() {
  return YEARS.find((y) => y.id === state.year) || YEARS[1];
}

// --- reconciling stored state with today's data ---------------------------

function validRun(r, cardIds) {
  if (!r || typeof r !== 'object') return false;
  if (!Number.isFinite(r.startAge) || !Number.isFinite(r.stepIndex)) return false;
  if (typeof r.done !== 'boolean') return false;
  if (r.short !== undefined && typeof r.short !== 'boolean') return false;
  if (r.ns !== undefined && r.ns !== null && typeof r.ns !== 'boolean') return false;
  if (!Array.isArray(r.steps) || !Array.isArray(r.doors) || !Array.isArray(r.flags) || !Array.isArray(r.raises)) return false;
  if (!r.ledger || typeof r.ledger !== 'object' || !['skills', 'network', 'portfolio'].every((k) => Number.isFinite(r.ledger[k]))) return false;
  if (!r.disp || typeof r.disp !== 'object' || !['curiosity', 'persistence', 'flexibility', 'optimism', 'risk'].every((k) => Number.isFinite(r.disp[k]))) return false;
  if (r.plan == null || typeof r.plan !== 'object' || Array.isArray(r.plan)) return false;
  if (r.want != null && (typeof r.want !== 'object' || typeof r.want.label !== 'string')) return false;
  if (r.pending != null && typeof r.pending !== 'object') return false;
  // The pending card is checked against the deck only when the deck is here.
  // reconcile runs at boot and the chance deck is a deferred file, so for one
  // release this line ran against an empty set and quietly deleted the story
  // of any student who closed the tab while a chance card was on screen. The
  // journey screen already self heals a pending id the deck no longer has, so
  // when the deck is absent the right answer is to keep the run.
  if (r.pending != null && cardIds.size && !cardIds.has(r.pending.cardId)) return false;
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

  const actIds = new Set(((data.activities && data.activities.activities) || []).map((a) => a.id));
  if (actIds.size) state.activities = state.activities.filter((id) => actIds.has(id));

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

/**
 * THE SCHOOL COMPUTER LAB, WHICH THIS APP HAD NO ANSWER FOR.
 *
 * Everything is on the device and nothing is sent anywhere, which is the right
 * trade and it has one consequence nobody had dealt with: a class run in a
 * computer lab loses everything at the bell. Thirty five students set a
 * combination, tick three commitments, name a want, play a road, and then log off
 * a machine that will be somebody else's on Thursday. The share link carried the
 * subject plan and nothing else, so the commitments, which are the entire point of
 * the last screen, did not survive the lesson.
 *
 * So there is a link that carries the whole of it. Still no account and still no
 * server: the state travels IN THE URL, which means a student can mail it to
 * themselves, put it in their notes, or scan it off the board, and a school that
 * would never let an app store data about children does not have to.
 *
 * WHAT IS DELIBERATELY LEFT OUT. The written reflection at thirty eight, and the
 * activities list. Both are on the private side of the line the parent page
 * already draws: a student writes honestly at thirty eight because nothing is
 * watching, and the activities include looking after somebody at home or working
 * in a family business. A link a student might paste into a group chat is not the
 * place for either.
 *
 * The encoding is deliberately plain rather than compact. A link somebody can read
 * is a link somebody can trust, and a student who can see that it says el3~maths3
 * and nothing about their reflection can check the promise for themselves.
 */
export function carryUrl() {
  const url = new URL(location.href);
  url.search = '';
  url.searchParams.set('p', encodePlan());
  url.searchParams.set('y', state.year);
  if (state.aim) url.searchParams.set('want', state.aim);
  if (state.schoolKind) url.searchParams.set('sk', state.schoolKind);
  if ((state.activities || []).length) url.searchParams.set('act', state.activities.join('~'));
  const acts = (state.actions || []).filter(Boolean);
  if (acts.length) url.searchParams.set('todo', acts.map((a) => encodeURIComponent(a)).join('|'));
  url.searchParams.set('mode', 'now');
  return url.toString();
}

/** How much a carry link is currently holding, for the sentence beside it. */
export function carrySummary() {
  return {
    subjects: Object.keys(state.plan || {}).length,
    todo: (state.actions || []).filter(Boolean).length,
    want: !!state.aim,
    school: !!state.schoolKind,
    activities: (state.activities || []).length,
  };
}
