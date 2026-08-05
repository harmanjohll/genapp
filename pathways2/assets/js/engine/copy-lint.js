// Copy lint. v1's budget checks, plus the rules that keep v2 from sounding
// like one articulate adult writing fourteen hundred fortune cookies.
//
// The v1 audit measured the problem precisely: 189 of 199 card outcomes were
// exactly two sentences, 122 began with "You", and the same aphorism shapes
// recycled dozens of times. Style rules that live in a doc decay; these are
// checked, so the metronome cannot creep back in.

const CAPS = {
  'subjects.subjects[].doing': 12,
  'subjects.subjects[].likeIf': 9,
  'subjects.subjects[].showsUp[]': 4,
  'subjects.subjects[].caution': 16,
  'subjects.junctures.years.*.up': 16,
  'subjects.junctures.years.*.note': 14,
  'subjects.junctures.down.line': 12,
  'subjects.junctures.down.body': 46,
  'subjects.subjects[].keepsOpen': 12,
  'pathways.destinations[].feels': 16,
  'pathways.destinations[].leadsTo': 12,
  'pathways.destinations[].structural[].label': 6,
  'pathways.destinations[].performance[].note': 26,
  'pathways.destinations[].alsoIn[]': 24,
  'progressions.routes[].detail': 16,
  'progressions.routes[].honest': 12,
  'futures.futures[].want': 9,
  'futures.futures[].looksLike': 12,
  'futures.futures[].routes[].note': 14,
  'futures.futures[].thisTerm[]': 12,
  'journey.stages[].chapter': 5,
  'journey.stages[].situation': 30,
  'journey.stages[].choices[].label': 9,
  'journey.stages[].choices[].outcome': 26,
  'journey.stages[].choices[].missed': 14,
  'journey.stages[].variants.*.chapter': 5,
  'journey.stages[].variants.*.situation': 30,
  'journey.stages[].variants.*.choices[].label': 9,
  'journey.stages[].variants.*.choices[].outcome': 26,
  'journey.stages[].variants.*.choices[].missed': 14,
  'journey.endingFrames[].head': 12,
  'journey.endingFrames[].body': 44,
  'journey.wants[].label': 10,
  'chances.cards[].body': 30,
  'chances.cards[].responses[].label': 8,
  'chances.cards[].responses[].outcome': 28,
  'chances.cards[].responses[].stretch': 28,
  'chances.cards[].onwardMoves[]': 16,
  'parent.sections[].body': 80,
  'parent.sections[].items[]': 26,
  'glossary.terms[].plain': 40,
  'lifelong.markers[].body': 32,
  'dispositions.dispositions[].body': 18,
  'stories.typicalPaths[].body': 34,
  'moves.moves[].label': 10,
  'moves.moves[].outcome': 26,
  'moves.moves[].missed': 14,
  'activities.activities[].label': 8,
  'activities.activities[].opens': 32,
  'activities.activities[].work': 20,
  'activities.activities[].manage': 20,
};

const FIRST_PAINT = { now: 365, journey: 240, aim: 130 };

const SKIP_KEYS = new Set(['_meta', 'sources', 'url', 'id', 'sourceRef', 'status', 'type', 'icon', 'tone', 'shortName', 'date', 'version', 'kind', 'sets', 'ic']);

const words = (s) => String(s).trim().split(/\s+/).filter(Boolean).length;

// The house cadence, as regexes. One of these per string is a voice; two is
// the metronome the audit measured. Quoted speech is exempt: people talk in
// whatever shapes they talk in.
const APHORISM = [
  /,\s+not\s+[a-z]/,
  /,\s+which is\b/,
  /\.\s+That is\b/,
  /\bis its own\b/,
  /\bturns out to be\b/,
  /\bwhich is the whole\b/,
];

function aphorismCount(s) {
  const unquoted = String(s).replace(/["“][^"”]*["”]/g, '');
  return APHORISM.reduce((n, re) => n + (re.test(unquoted) ? 1 : 0), 0);
}

export function runCopyLint(data) {
  const over = [];
  const dashes = [];
  const cadence = [];

  Object.entries(CAPS).forEach(([path, cap]) => {
    valuesAt(data, path).forEach(({ value, where }) => {
      const n = words(value);
      if (n > cap) over.push({ path: where, words: n, cap, text: String(value).slice(0, 60) });
    });
  });

  walkStudentText(data, (value, where) => {
    if (/[-–—]/.test(value)) {
      dashes.push({ path: where, text: String(value).slice(0, 70) });
    }
    if (aphorismCount(value) > 1) {
      cadence.push({ path: where, why: 'two aphorisms in one string', text: String(value).slice(0, 70) });
    }
  });

  // The deck-wide cadence rules. Outcomes are where the metronome lived.
  const outcomes = [];
  ((data.chances && data.chances.cards) || []).forEach((c) => {
    (c.responses || []).forEach((r) => {
      if (r.outcome) outcomes.push({ id: c.id, text: r.outcome });
      if (r.stretch) outcomes.push({ id: c.id, text: r.stretch });
    });
  });
  if (outcomes.length) {
    const youOpeners = outcomes.filter((o) => /^You\b/.test(o.text.trim()));
    const ratio = youOpeners.length / outcomes.length;
    if (ratio > 0.3) {
      cadence.push({ path: 'chances', why: `${Math.round(ratio * 100)}% of outcomes open with "You" (cap 30%)` });
    }
    const seen = new Map();
    outcomes.forEach((o) => {
      const clause = o.text.trim().toLowerCase().split(/\s+/).slice(0, 5).join(' ');
      if (seen.has(clause)) {
        cadence.push({ path: o.id, why: `first clause repeats ${seen.get(clause)}`, text: clause });
      } else {
        seen.set(clause, o.id);
      }
    });
  }

  // First paint is browser-only; the node harness skips it.
  let paint = 0;
  let paintOver = null;
  if (typeof document !== 'undefined') {
    paint = measureFirstPaint();
    const mode = currentMode();
    const paintCap = FIRST_PAINT[mode];
    paintOver = paintCap && paint > paintCap ? { mode, words: paint, cap: paintCap } : null;
  }

  const ok = !over.length && !dashes.length && !cadence.length && !paintOver;
  console.log(
    `%cCopy lint: ${ok ? 'PASS' : 'FAIL'}${paint ? ` (${paint} words at first paint)` : ''}`,
    ok ? 'color:#2F7D5B;font-weight:700' : 'color:#B23A2A;font-weight:700'
  );
  if (over.length) { console.warn(`${over.length} fields over their word cap`); console.table(over.slice(0, 30)); }
  if (dashes.length) { console.warn(`${dashes.length} student facing strings contain a dash`); console.table(dashes.slice(0, 30)); }
  if (cadence.length) { console.warn(`${cadence.length} cadence failures`); console.table(cadence.slice(0, 30)); }
  if (paintOver) console.warn('First paint over budget', paintOver);

  return { ok, over, dashes, cadence, paint, paintOver };
}

function currentMode() {
  const btn = document.querySelector('.modebar button[aria-current="true"]');
  return btn ? btn.dataset.mode : 'now';
}

export function measureFirstPaint(root) {
  const scope = root || document.getElementById('app');
  if (!scope) return 0;
  let n = 0;
  const walk = (node) => {
    if (node.nodeType === 3) { n += words(node.nodeValue); return; }
    if (node.nodeType !== 1) return;
    const tag = node.tagName;
    if (tag === 'DIALOG' || tag === 'SCRIPT' || tag === 'STYLE') return;
    if (node.hasAttribute('hidden') || node.classList.contains('sr-only')) return;
    if (tag === 'DETAILS' && !node.open) {
      const sum = node.querySelector('summary');
      if (sum) n += words(sum.textContent);
      return;
    }
    const cs = getComputedStyle(node);
    if (cs.display === 'none' || cs.visibility === 'hidden') return;
    node.childNodes.forEach(walk);
  };
  scope.childNodes.forEach(walk);
  return n;
}

// --- path walking ---------------------------------------------------------

function valuesAt(data, path) {
  const parts = path.split('.');
  let cursor = [{ value: data, where: '' }];
  parts.forEach((part) => {
    const isArr = part.endsWith('[]');
    const key = isArr ? part.slice(0, -2) : part;
    const next = [];
    cursor.forEach(({ value, where }) => {
      if (value == null) return;
      if (key === '*') {
        if (typeof value === 'object' && !Array.isArray(value)) {
          Object.entries(value).forEach(([k, v]) => next.push({ value: v, where: `${where}.${k}` }));
        }
        return;
      }
      const v = key ? value[key] : value;
      if (v == null) return;
      if (isArr && Array.isArray(v)) {
        v.forEach((item, i) => next.push({ value: item, where: `${where}.${key}[${i}]` }));
      } else {
        next.push({ value: v, where: `${where}.${key}` });
      }
    });
    cursor = next;
  });
  return cursor.filter((c) => typeof c.value === 'string');
}

function walkStudentText(data, fn) {
  const seen = new Set();
  const walk = (node, path, key) => {
    if (typeof node === 'string') {
      if (SKIP_KEYS.has(key)) return;
      if (/^https?:/.test(node)) return;
      const sig = `${path}|${node}`;
      if (seen.has(sig)) return;
      seen.add(sig);
      fn(node, path);
      return;
    }
    if (Array.isArray(node)) { node.forEach((v, i) => walk(v, `${path}[${i}]`, key)); return; }
    if (node && typeof node === 'object') {
      Object.entries(node).forEach(([k, v]) => {
        if (SKIP_KEYS.has(k)) return;
        walk(v, `${path}.${k}`, k);
      });
    }
  };
  Object.entries(data).forEach(([file, content]) => {
    if (file.startsWith('_')) return;
    walk(content, file, null);
  });
}
