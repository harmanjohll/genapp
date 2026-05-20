// Global app state: persona, geo-scope, current mix, horizon year.
// Tiny pub/sub store. No framework, no dependencies.

const STORAGE_KEY = 'ecdm.state.v1';

export const PERSONAS = {
  student: {
    id: 'student',
    label: 'Student',
    short: 'Sec 1–4',
    desc: 'Get the stakes in one screen. One number that lands. No jargon.',
    hint: 'Light read · 30 seconds',
    heroSub: 'Where the electricity that charges your phone actually comes from — and why it matters more than your teachers may have told you.',
    studioSub: 'Move the sliders. See what happens to the bill and to the carbon line. The future is not yet decided.',
    actionLede: 'A shareable card. A printable explainer. Pass it on.',
  },
  citizen: {
    id: 'citizen',
    label: 'Citizen',
    short: 'Parent · resident',
    desc: 'Cause and effect, comparisons, your bill, your country. Something to do this week.',
    hint: 'Solid read · 5 minutes',
    heroSub: 'What this means for your bill, your country, and the next thirty years. Same data the cabinet is looking at.',
    studioSub: 'Type your typical monthly kWh. See your bill under each mix you might support.',
    actionLede: 'Three honest moves. We have priced each one in dollars and kWh saved.',
  },
  educator: {
    id: 'educator',
    label: 'Educator',
    short: 'Teacher · school leader',
    desc: 'A teaching frame. Sources visible. Mechanisms named. Downloadable scaffolds.',
    hint: 'Long read · with sources',
    heroSub: 'A teaching frame for the energy question — designed to hold up under questioning from a sharp Sec 4 student.',
    studioSub: 'Mechanisms are labelled (loss frame, anchoring, default architecture). Pull the sliders to demonstrate tradeoffs in class.',
    actionLede: 'A lesson scaffold, a Mermaid system diagram, a printable one-pager.',
  },
  cabinet: {
    id: 'cabinet',
    label: 'Cabinet · Policymaker',
    short: 'Minister · senior official · MP',
    desc: 'Fiscal levers. Carbon-tax revenue. Import dependence. NDC trajectory. The decade ahead.',
    hint: 'Deep read · levers visible',
    heroSub: 'Where the next decade locks in. Carbon-tax revenue, import dependence, NDC trajectory — all live, all sourced.',
    studioSub: 'The carbon-tax dial and import-cap dial show fiscal and exposure outputs. Each slider triggers a constraint flag if it breaks the published feasibility envelope.',
    actionLede: 'Three policy levers, each with a quantified-effect chip in MtCO₂ and S$M.',
  },
};

export const SCOPES = {
  sg:       { id: 'sg',       label: 'SG',         hero: 'Singapore burns gas for 93% of its electricity.' },
  regional: { id: 'regional', label: 'Regional',   hero: 'In an ASEAN where coal is still dominant, Singapore stands out for how gas-heavy and clean — and how exposed — its grid is.' },
  intl:     { id: 'intl',     label: 'International', hero: 'In Denmark, half of electricity comes from wind. In France, 62% from nuclear. In Singapore, 93% from imported gas.' },
};

const DEFAULT_MIX = { gas: 25, solar: 8, imports: 35, hydrogen: 18, nuclear_ccs: 14 };
const CURRENT_MIX = { gas: 93, solar: 3, imports: 1, hydrogen: 0, nuclear_ccs: 0 };

const initial = () => ({
  persona: null,                       // 'student' | 'citizen' | 'educator' | 'cabinet' | null
  scope: 'sg',                         // 'sg' | 'regional' | 'intl'
  year: 2050,                          // 2026 | 2030 | 2032 | 2040 | 2050
  mix: { ...DEFAULT_MIX },             // user's working mix
  householdKwh: 365,                   // 4-room HDB default
});

function load() {
  try {
    const params = new URLSearchParams(location.search);
    const fromUrl = params.get('as');
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    const base = stored || initial();
    if (fromUrl && PERSONAS[fromUrl]) base.persona = fromUrl;
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
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

function syncUrl() {
  if (!state.persona) return;
  const url = new URL(location.href);
  url.searchParams.set('as', state.persona);
  history.replaceState({}, '', url);
}

export function getState() { return state; }

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function setPersona(id) {
  if (!PERSONAS[id]) return;
  state.persona = id;
  persist(); syncUrl(); notify();
}

export function setScope(id) {
  if (!SCOPES[id]) return;
  state.scope = id;
  persist(); notify();
}

export function setYear(y) {
  state.year = y;
  notify(); // year does not persist — fresh on reload
}

export function setMix(next) {
  state.mix = { ...next };
  notify();
}

export function setHouseholdKwh(v) {
  state.householdKwh = Math.max(0, Math.round(v));
  persist(); notify();
}

export function resetMixToCurrent() {
  state.mix = { ...CURRENT_MIX };
  notify();
}

export function resetMixToDefault() {
  state.mix = { ...DEFAULT_MIX };
  notify();
}

export { DEFAULT_MIX, CURRENT_MIX };
