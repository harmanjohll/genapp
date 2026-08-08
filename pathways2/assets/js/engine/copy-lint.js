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
  'possibilities.possibilities[].label': 8,
  'possibilities.possibilities[].when': 12,
  'possibilities.possibilities[].needs': 18,
  'possibilities.possibilities[].leads': 16,
  'possibilities.possibilities[].truth': 26,
  'possibilities.forkNeeds.*': 30,
};

const FIRST_PAINT = { now: 365, journey: 240, aim: 130 };

const SKIP_KEYS = new Set(['_meta', 'sources', 'url', 'id', 'sourceRef', 'status', 'type', 'icon', 'tone', 'shortName', 'date', 'version', 'kind', 'sets', 'ic', 'format']);

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

// Option labels are the one place in this app where a writerly phrase is a
// functional bug: a student has to decide from them, in about two seconds, with
// no context. "Guard your own oxygen", "Keep one made thing alive" and "Ship
// something real" all shipped, and all of them left a fourteen year old
// guessing what they had just agreed to. These are the exact idioms that were
// pulled out, kept as a list so they cannot come back.
const MURKY = [
  /\boxygen\b/i, /\bmade thing\b/i, /\bship (something|it)\b/i, /\bthe glue\b/i,
  /\byour flag\b/i, /\blike receipts\b/i, /\bthe crit\b/i, /\bstitched\b/i,
  /\bhold the line\b/i, /\ball in on\b/i, /\binterrogate\b/i, /\bthe pitch\b/i,
  /\blike a human\b/i, /\bin a pack\b/i, /\bbreathing\b/i, /\bcold\b/i,
  /\bquietly\b/i, /\bthe block\b/i, /\bexco\b/i, /\bFYP\b/, /\bPW group\b/i,
];

// A gendered job noun in a career tool tells half a class the job is not theirs.
const GENDERED = [
  /\bwaitress\b/i, /\bwaiter\b/i, /\bactress\b/i, /\bsalesman\b/i, /\bsaleswoman\b/i,
  /\bbusinessman\b/i, /\bchairman\b/i, /\bfreshman\b/i, /\bworkman\b/i,
  /\bpoliceman\b/i, /\bfireman\b/i, /\bstewardess\b/i, /\bheadmaster\b/i, /\bheadmistress\b/i,
];

/** Every label a student picks from: stage choices, variants, and moves. */
function optionLabels(data) {
  const out = [];
  ((data.journey && data.journey.stages) || []).forEach((s) => {
    (s.choices || []).forEach((c) => out.push({ where: s.id, label: c.label, stage: s.id }));
    Object.entries(s.variants || {}).forEach(([k, v]) => {
      (v.choices || []).forEach((c) => out.push({ where: `${s.id}/${k}`, label: c.label, stage: `${s.id}/${k}` }));
    });
  });
  ((data.moves && data.moves.moves) || []).forEach((m) => out.push({ where: `move ${m.id}`, label: m.label, stage: null }));
  return out.filter((x) => x.label);
}

export function runCopyLint(data) {
  const over = [];
  const dashes = [];
  const cadence = [];
  const murky = [];

  optionLabels(data).forEach(({ where, label }) => {
    MURKY.forEach((re) => {
      if (re.test(label)) murky.push({ path: where, why: 'an option a student has to decode', text: label });
    });
    GENDERED.forEach((re) => {
      if (re.test(label)) murky.push({ path: where, why: 'a gendered job word', text: label });
    });
  });

  // Two options in one year that open with the same three words are one option
  // wearing two hats, and they crowd out something a student could use.
  const byStage = {};
  optionLabels(data).filter((x) => x.stage).forEach((x) => {
    const k = x.label.toLowerCase().split(/\s+/).slice(0, 3).join(' ');
    (byStage[x.stage] = byStage[x.stage] || {});
    if (byStage[x.stage][k]) {
      murky.push({ path: x.stage, why: 'two options open with the same three words', text: `${byStage[x.stage][k]} / ${x.label}` });
    } else byStage[x.stage][k] = x.label;
  });

  // The same rule across the two systems. A chapter's own choices and the moves
  // dealt into that chapter's hand land in one list on screen, so Sec 3 offered
  // "Start collecting proof for Early Admissions" beside a move that said
  // "Build the folder for Early Admissions". The per chapter check could not see
  // it, because a move belongs to no chapter until an age puts it in one.
  const STOP = new Set(['a', 'an', 'the', 'your', 'you', 'for', 'to', 'in', 'on', 'of', 'and', 'or', 'at', 'up', 'about', 'with', 'what', 'one', 'it', 'that', 'something']);
  const gist = (s) => String(s).toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/)
    .filter((w) => w && !STOP.has(w)).sort().join(' ');
  ((data.journey && data.journey.stages) || []).filter((s) => s.age).forEach((s) => {
    const here = (s.choices || []).map((c) => ({ label: c.label, gist: gist(c.label) }));
    ((data.moves && data.moves.moves) || []).forEach((m) => {
      const [lo, hi] = m.ages || [];
      if (!(lo <= s.age && s.age <= hi)) return;
      const mg = gist(m.label).split(' ');
      here.forEach((c) => {
        const cg = c.gist.split(' ');
        const shared = mg.filter((w) => cg.includes(w));
        if (shared.length >= 2 && shared.length >= Math.min(mg.length, cg.length) - 1) {
          murky.push({
            path: `${s.id} + move ${m.id}`,
            why: 'a chapter choice and a move offer the same thing',
            text: `${c.label} / ${m.label}`,
          });
        }
      });
    });
  });

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

  const ok = !over.length && !dashes.length && !cadence.length && !murky.length && !paintOver;
  console.log(
    `%cCopy lint: ${ok ? 'PASS' : 'FAIL'}${paint ? ` (${paint} words at first paint)` : ''}`,
    ok ? 'color:#2F7D5B;font-weight:700' : 'color:#B23A2A;font-weight:700'
  );
  if (over.length) { console.warn(`${over.length} fields over their word cap`); console.table(over.slice(0, 30)); }
  if (dashes.length) { console.warn(`${dashes.length} student facing strings contain a dash`); console.table(dashes.slice(0, 30)); }
  if (cadence.length) { console.warn(`${cadence.length} cadence failures`); console.table(cadence.slice(0, 30)); }
  if (murky.length) { console.warn(`${murky.length} option labels a student would have to decode`); console.table(murky.slice(0, 30)); }
  if (paintOver) console.warn('First paint over budget', paintOver);

  return { ok, over, dashes, cadence, murky, paint, paintOver };
}

function currentMode() {
  const btn = document.querySelector('.modebar button[aria-current="true"]');
  return btn ? btn.dataset.mode : 'now';
}

/**
 * Words a student has to READ before they can act.
 *
 * Interactive labels are excluded: a level chip saying G2, a year selector, a
 * button saying Undo. Counting them made Plan look like prose when what it
 * actually is is a control surface listing thirty one subjects, and it pushed
 * the tightest budget in the app onto the screen with the least prose on it.
 * Everything a student has to read still counts, which is what the budget was
 * ever for.
 */
export function measureFirstPaint(root) {
  const scope = root || document.getElementById('app');
  if (!scope) return 0;
  let n = 0;
  const walk = (node) => {
    if (node.nodeType === 3) { n += words(node.nodeValue); return; }
    if (node.nodeType !== 1) return;
    const tag = node.tagName;
    if (tag === 'DIALOG' || tag === 'SCRIPT' || tag === 'STYLE') return;
    if (tag === 'BUTTON' || tag === 'SELECT' || tag === 'OPTION') return;
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
