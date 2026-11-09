// House style for the planning screens (pathways/STYLE.md), as a gate.
//
// The advice was right; the voice read like a machine: "X, not Y" turns,
// closing morals, rhetorical questions, the app explaining itself, and
// doors and lamps in plain words. This sweep fails any of those on the main
// path, in three places: the data the planning screens read, the sentences
// written into the screen code, and the sentences the advice engine builds.
// The game keeps its own story voice and is checked in a later round.
//
// Pure: no DOM, no storage. Node passes in the data and the file texts.

const BANNED = /\b(honest|honestly|genuinely|quietly|worth knowing|the whole|simply|actually)\b/i;
// "X, not Y" and "not X but Y". Plain facts ("not examined") are allowed.
const ANTITHESIS = /(, not (a|an|the|my|your|whether|what|only|just|because|to|for|in|at|how|who|which)\b)|(\bnot\b[^.?!]{1,40}\bbut\b)/i;
const FACT_OK = /\bnot (examined|offered|required|needed|published|counted|guaranteed|set|saved|in the score)\b/i;
const META = /(nothing (leaves|here|is closed|is ever closed)|never (closed|says|a prediction)|is ever closed|decides nothing|not a (prediction|promise)|road is closed|thinking tool)/i;
const METAPHOR = /\b(doors?|lamps?|roads?)\b/i;
const FIRST_PERSON = /(\bI\b|\b(my|mine|me)\b)/;
const MAX_WORDS = 22;          // per sentence, in written copy
const MAX_WORDS_BUILT = 32;    // per sentence the engine builds, which carries lists of names

const sentences = (t) => String(t).replace(/\{[^}]*\}/g, 'x').split(/(?<=[.?!])\s+/).map((s) => s.trim()).filter(Boolean);
const words = (s) => s.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;

/** Every fault in one string, as short reasons. */
export function styleFaults(text, { voice = true, question = true, max = MAX_WORDS, metaphor = true } = {}) {
  const t = String(text || '');
  const out = [];
  if (!/[a-z]/.test(t)) return out;
  if (BANNED.test(t)) out.push(`banned word "${t.match(BANNED)[0]}"`);
  if (ANTITHESIS.test(t) && !FACT_OK.test(t)) out.push('"X, not Y" turn');
  if (META.test(t)) out.push('comments on the app');
  if (metaphor && METAPHOR.test(t)) out.push(`metaphor "${t.match(METAPHOR)[0]}" in plain words`);
  if (voice && FIRST_PERSON.test(t)) out.push('first person on a planning screen');
  if (question && /\?\s*$/.test(t) && !/\bAsk\b|^"|: "/.test(t)) out.push('rhetorical question');
  sentences(t).forEach((s) => { if (words(s) > max) out.push(`sentence of ${words(s)} words`); });
  return out;
}

// The data the planning screens read. Paths use the copy-lint convention:
// `[]` walks an array, `*` walks every key.
const DATA_PATHS = [
  'copy.pulse.*', 'copy.load.*', 'copy.ask.*',
  'years.years.*.headline', 'years.years.*.lede', 'years.years.*.happens[].what', 'years.years.*.decisions[].text',
  'years.years.*.talk.parent[]', 'years.years.*.talk.teacher[]', 'years.years.*.source',
  'subjects.levelInfo.*.plain', 'subjects.groups[].note', 'subjects.groups[].lowerNote', 'subjects.junctures.years.*.up',
  'subjects.junctures.years.*.note', 'subjects.subjects[].note', 'subjects.subjects[].levelNote', 'subjects.subjects[].sec3.*',
  'pathways.destinations[].feels', 'pathways.destinations[].leadsTo', 'pathways.destinations[].lowerHorizon',
  'pathways.destinations[].performance[].label', 'pathways.destinations[].performance[].note', 'pathways.destinations[].alsoIn[]',
  'pathways.destinations[].openLabel', 'pathways.destinations[].lowerOpenLabel',
  'progressions.routes[].honest', 'progressions.routes[].label',
  'psle.noGroup', 'psle.upgrades.note', 'psle.upgrades.rules[].text', 'psle.downgrades.note', 'psle.downgrades.rules[].text', 'psle.hmtl.text', 'psle.school.note',
  'grades.aggregates[].plain', 'grades.aggregates[].bonus', 'grades.aggregates[].dests[].note',
  'offer.subjects.*.note', 'offer.groupNotes.*.*',
];
// Questions a student asks themselves: prompts, allowed as questions.
const PROMPT_PATHS = ['years.years.*.talk.student[]'];

function valuesAt(root, path) {
  const parts = path.split('.');
  let nodes = [{ v: root, p: '' }];
  parts.forEach((part) => {
    const arr = part.endsWith('[]');
    const key = arr ? part.slice(0, -2) : part;
    const next = [];
    nodes.forEach(({ v, p }) => {
      if (v == null) return;
      const kids = key === '*' ? Object.keys(v).map((k) => ({ v: v[k], p: `${p}.${k}` })) : [{ v: v[key], p: `${p}.${key}` }];
      kids.forEach((k) => {
        if (arr) (Array.isArray(k.v) ? k.v : []).forEach((x, i) => next.push({ v: x, p: `${k.p}[${i}]` }));
        else next.push(k);
      });
    });
    nodes = next;
  });
  return nodes.filter((n) => typeof n.v === 'string');
}

// Sentences written into screen code: string literals with HTML and
// ${...} stripped, kept only when they read as words, not markup or code.
function codeSentences(src) {
  const out = [];
  const body = src.replace(/^\s*\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  const re = /'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g;
  let m;
  while ((m = re.exec(body))) {
    const raw = m[1] ?? m[2] ?? m[3] ?? '';
    raw.replace(/\$\{[^}]*\}/g, ' x ').replace(/<[^>]*>/g, '\n').split('\n').forEach((seg) => {
      const s = seg.replace(/\\'/g, "'").trim();
      if (!/[A-Za-z]{3,} [a-z]{2,} [a-z]{2,}/.test(s)) return;      // reads as a phrase
      if (/[{}();=]|=>|\b(const|return|function|data-|class=)\b/.test(s)) return;
      if (/^[a-z-]+( [a-z-]+)*$/.test(s) && /-/.test(s)) return;   // class lists
      out.push(s);
    });
  }
  return out;
}

const CODE_FILES = [
  'assets/js/screens/start.js', 'assets/js/screens/home.js', 'assets/js/screens/year.js', 'assets/js/screens/explore.js',
  'assets/js/screens/after.js', 'assets/js/screens/myplan.js', 'assets/js/ui/ticket.js', 'assets/js/ui/talk.js',
  'assets/js/ui/pslepanel.js', 'assets/js/ui/targets.js', 'assets/js/ui/destsheet.js', 'assets/js/ui/signal.js',
  'assets/js/engine/advice.js', 'assets/js/engine/rules.js', 'assets/js/engine/reach.js', 'assets/js/main.js', 'index.html',
];

/**
 * @param {Object} data     every data file by name
 * @param {Object} files    { path: text } for CODE_FILES
 * @param {Function} adviseAll  () => array of strings the engine builds
 */
export function styleSweep(data, files, adviseAll) {
  const faults = [];
  let checks = 0;
  DATA_PATHS.forEach((path) => {
    valuesAt(data, path).forEach(({ v, p }) => {
      checks += 1;
      styleFaults(v).forEach((why) => faults.push({ where: p.slice(1), why, text: v.slice(0, 70) }));
    });
  });
  PROMPT_PATHS.forEach((path) => {
    valuesAt(data, path).forEach(({ v, p }) => {
      checks += 1;
      styleFaults(v, { question: false }).forEach((why) => faults.push({ where: p.slice(1), why, text: v.slice(0, 70) }));
    });
  });
  Object.entries(files).forEach(([path, src]) => {
    // Line mode keeps its transit words, so labels.js is not read here, and
    // the role labels and saved words in talk.js stay as written to a student.
    codeSentences(src).forEach((s) => {
      checks += 1;
      styleFaults(s, { voice: false, question: false, max: MAX_WORDS }).forEach((why) => faults.push({ where: path, why, text: s.slice(0, 70) }));
    });
  });
  (adviseAll ? adviseAll() : []).forEach((s) => {
    checks += 1;
    styleFaults(s, { voice: false, question: false, max: MAX_WORDS_BUILT }).forEach((why) => faults.push({ where: 'advice output', why, text: s.slice(0, 70) }));
  });
  return { ok: !faults.length, checks, faults };
}

export { CODE_FILES };
