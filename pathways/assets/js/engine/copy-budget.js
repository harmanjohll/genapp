// Copy budget check. Runs under ?dev=1 alongside the reach invariant.
//
// Two rules in this app were maintained by hand across nine thousand words: the
// no dashes rule and "keep it short for a fourteen year old". Hand maintained
// rules decay. These are now checked.
//
// Word caps are per field. The first paint cap is measured off the live DOM,
// counting only what a student can actually see without tapping anything.

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
  'pathways.destinations[].leadsTo': 8,
  'pathways.destinations[].structural[].label': 6,
  'pathways.destinations[].performance[].note': 22,
  'pathways.destinations[].alsoIn[]': 12,
  'progressions.routes[].detail': 16,
  'progressions.routes[].honest': 12,
  'futures.futures[].want': 9,
  'futures.futures[].looksLike': 12,
  'futures.futures[].routes[].note': 14,
  'futures.futures[].thisTerm[]': 12,
  'journey.stages[].situation': 22,
  'journey.stages[].choices[].label': 9,
  'journey.stages[].choices[].outcome': 22,
  'journey.stages[].choices[].hint': 5,
  // Path variants are the bulk of the student facing copy in this mode, so they
  // are linted on exactly the same caps as the base stage they override.
  'journey.stages[].variants.*.situation': 24,
  'journey.stages[].variants.*.choices[].label': 9,
  'journey.stages[].variants.*.choices[].outcome': 22,
  'journey.stages[].variants.*.choices[].hint': 5,
  'chances.cards[].onwardMoves[]': 16,
  'chances.cards[].responses[].label': 8,
  'chances.cards[].responses[].outcome': 24,
  'chances.cards[].responses[].stretch': 24,
  'journey.wants[].label': 10,
  'parent.sections[].body': 80,
  'parent.sections[].items[]': 26,
  'chances.cards[].body': 28,
  'chances.cards[].ifTaken': 22,
  'chances.cards[].ifMissed': 24,
  'glossary.terms[].plain': 34,
  'lifelong.markers[].body': 28,
  'dispositions.dispositions[].body': 18,
  'stories.typicalPaths[].body': 34,
};

// First paint caps.
//
// These count EVERYTHING a student can see, including every subject name and
// every G1/G2/G3 chip glyph. That is deliberate: a budget that excluded labels
// could be met by moving prose into labels, which would be gaming the metric
// rather than reducing the reading load.
//
// NOW therefore carries an irreducible floor of roughly 155 words of pure
// structure: 26 subject names, 51 level chips, 8 destination names and their
// status lines, and 5 group headings. The cap is that floor plus about 90 words
// of actual prose. It is not a number that can be lowered by better writing,
// only by showing fewer subjects.
// NOW measures 245 on an empty plan and about 265 once a student has picked a
// combination, because status lines lengthen as destinations come into reach.
// The cap covers the filled case.
// NOW's floor rose when the subject list became true: five more rows, the
// long official Humanities and Science pair names, two group notes, the year
// line and the availability disclaimer. All of that is content, not chrome.
const FIRST_PAINT = { now: 365, journey: 220, aim: 120 };

// Fields that are maintainer facing, not student facing.
const SKIP_KEYS = new Set(['_meta', 'sources', 'url', 'id', 'sourceRef', 'status', 'type', 'icon', 'tone', 'shortName']);

const words = (s) => String(s).trim().split(/\s+/).filter(Boolean).length;

export function runCopyBudget(data) {
  const over = [];
  const dashes = [];

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
  });

  const paint = measureFirstPaint();
  const mode = document.body.dataset.teacher === 'true' ? null : currentMode();
  const paintCap = FIRST_PAINT[mode];
  const paintOver = paintCap && paint > paintCap ? { mode, words: paint, cap: paintCap } : null;

  const ok = !over.length && !dashes.length && !paintOver;
  console.log(
    `%cCopy budget: ${ok ? 'PASS' : 'FAIL'} (${paint} words at first paint${paintCap ? `, cap ${paintCap}` : ''})`,
    ok ? 'color:#2F7D5B;font-weight:700' : 'color:#B23A2A;font-weight:700'
  );
  if (over.length) { console.warn(`${over.length} fields over their word cap`); console.table(over.slice(0, 30)); }
  if (dashes.length) { console.warn(`${dashes.length} student facing strings contain a dash`); console.table(dashes.slice(0, 30)); }
  if (paintOver) console.warn('First paint over budget', paintOver);

  return { ok, over, dashes, paint, paintOver };
}

function currentMode() {
  const btn = document.querySelector('.modebar button[aria-current="true"]');
  return btn ? btn.dataset.mode : 'now';
}

/**
 * Words a student can see right now, without tapping. Excludes closed details,
 * dialogs, hidden nodes and screen reader only text. Deliberately DOES count
 * every visible label and chip, so the budget cannot be met by relabelling.
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
      // '*' walks every key of an object, so variant blocks keyed by path can be
      // linted without naming each family here.
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
