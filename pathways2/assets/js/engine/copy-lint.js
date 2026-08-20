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
  'journey.stages[].choices[].outcomeIf.*': 28,
  'journey.stages[].choices[].missed': 14,
  'journey.stages[].reflection.prompt': 16,
  'journey.stages[].reflection.options[]': 8,
  'journey.stages[].reflection.hint': 22,
  'journey.reflection.prompt': 16,
  'journey.reflection.options[]': 8,
  'journey.reflection.hint': 22,
  'journey.companions.names[]': 3,
  'journey.companions.roads.*': 4,
  'journey.companions.school.s_sec1[]': 20,
  'journey.companions.school.s_sec2[]': 20,
  'journey.companions.school.s_sec3[]': 20,
  'journey.companions.school.s_sec4[]': 20,
  'journey.companions.fork[]': 20,
  'journey.companions.after.*': 20,
  'journey.companions.later[]': 20,
  'journey.companions.ending.*': 22,
  'journey.midyear.sec[]': 8,
  'journey.midyear.jc[]': 8,
  'journey.midyear.mi[]': 8,
  'journey.midyear.poly[]': 8,
  'journey.midyear.ite[]': 8,
  'journey.midyear.arts[]': 8,
  'journey.midyear.ns[]': 8,
  'journey.midyear.uni[]': 8,
  'journey.midyear.work[]': 8,
  'journey.midyear.cet[]': 8,
  'journey.midyear.default[]': 8,
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
  'chances.cards[].waited': 14,
  'parent.sections[].body': 80,
  'parent.sections[].items[]': 26,
  'parent.windows[].label': 5,
  'parent.windows[].when': 8,
  'parent.windows[].what': 26,
  'parent.windows[].check': 12,
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

const SKIP_KEYS = new Set(['_meta', 'sources', 'url', 'id', 'sourceRef', 'status', 'type', 'icon', 'tone', 'shortName', 'date', 'version', 'kind', 'sets', 'ic', 'format', 'keeps']);

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
  /\bquietly\b/i, /\bthe block\b/i, /\bFYP\b/, /\bPW group\b/i,
];

// Pronouns that came out of the voice pass wrong.
//
// WHY STRUCTURAL AND NOT A WORD LIST. The check that ran during the voice pass
// listed the verbs after which "I" would be a mistake, and so it caught
// "shows I" and missed "needs I now", "warned I about", "trains I afterwards"
// and "stops bringing I problems", all of which shipped. A list of verbs can
// only ever catch the verbs on it, so this asks the opposite question: which
// words can legitimately sit in front of "I"? Only a conjunction, a comparative,
// a subordinator or an auxiliary in a question. Anything else in front of "I" is
// a verb or a preposition taking an object, and the object form is "me".
const BEFORE_I_OK = new Set([
  'and', 'or', 'but', 'nor', 'so', 'yet', 'then',
  'that', 'which', 'who', 'whom', 'whose', 'what', 'where', 'when', 'while', 'why', 'how',
  'if', 'unless', 'because', 'since', 'until', 'till', 'though', 'although', 'whereas',
  'before', 'after', 'once', 'as', 'than', 'whether', 'lest',
  'am', 'is', 'are', 'was', 'were', 'do', 'did', 'does', 'have', 'has', 'had',
  'here', 'there', 'now', 'today', 'yesterday', 'anyway', 'instead',
]);

/**
 * Words after which "I" cannot be a subject, so the object form is wanted.
 *
 * Prepositions, determiners and quantifiers only. Deliberately NOT a list of
 * verbs. A verb list was tried twice and failed twice: allowlisting the verbs
 * that may follow "I" flagged "the roads I did not take", which is correct, and
 * denylisting the verbs that may precede it missed "needs I now" and three more
 * that shipped. Both directions require enumerating English. This asks a smaller
 * question with a closed answer.
 *
 * KNOWN GAP, stated rather than papered over: a noun straight after "I", as in
 * "bringing I problems", is not caught, because nouns cannot be enumerated
 * either. That shape did ship once and was fixed by hand.
 */
const AFTER_I_NEVER = new Set([
  'for', 'with', 'about', 'toward', 'towards', 'into', 'onto', 'at', 'on', 'in',
  'to', 'from', 'of', 'by', 'through', 'across', 'against', 'upon', 'without',
  'beside', 'behind', 'near', 'between', 'among', 'under', 'over', 'during',
  'a', 'an', 'the', 'my', 'his', 'her', 'their', 'its', 'our',
  'this', 'that', 'these', 'those', 'both', 'all', 'each', 'every',
  'now', 'afterwards', 'again', 'too', 'here', 'there', 'back',
]);

/**
 * Verbs that cannot take a bare clause, so anything after them is an object.
 *
 * THE THIRD SIGNAL, and why it is a list after all. The two rules above need
 * both halves to agree, and fourteen faults got through because the word after
 * "I" was an ordinary noun: "telling I things", "graded I while", "hate I and",
 * "toughens I regardless", "catches I doing", "replace I becomes". Nouns cannot
 * be enumerated, so that half can never be completed. Verbs can be, partly, and
 * a partial list that catches a real shape beats a complete rule that does not
 * exist. The union of the three rules catches every fault this corpus has ever
 * had; the record of having read all five hundred and fifty three occurrences of
 * the word by hand is what says so.
 *
 * The verbs here are chosen for one property: none of them can be followed by a
 * clause with no object in between. "He tells me I am late" is grammatical and
 * "He tells I am late" is not, so every hit is a fault with no exception to
 * carve out. Verbs that DO take a bare clause, say, know, think, hear, feel,
 * believe, are deliberately absent, because "she knows I asked" is correct
 * English and a lint that fails good writing gets deleted.
 *
 * Half of these are also nouns, which is why the rule below refuses to fire on
 * a word sitting behind a determiner: "the leave I am owed", "a business name I
 * doodled" and "the grades I got" are all noun phrases, and all three were
 * flagged before that guard went in.
 */
const TRANSITIVE_ONLY = [
  'grade', 'hate', 'replace', 'toughen', 'catch', 'need', 'warn', 'train', 'bring',
  'show', 'stop', 'help', 'teach', 'give', 'send', 'watch', 'call', 'keep', 'leave',
  'put', 'thank', 'trust', 'pull', 'push', 'drive', 'treat', 'pay', 'owe', 'follow',
  'join', 'beat', 'choose', 'pick', 'ignore', 'include', 'invite', 'hire',
  'coach', 'carry', 'shortlist', 'reject', 'accept',
  'ask', 'tell', 'make', 'let', 'take', 'want', 'miss', 'find', 'meet',
];
// A word behind one of these is a noun, whatever else it could have been.
// Numerals are deliberately absent: "Semester one graded I while I was settling
// in" put a number in front of the verb, and listing "one" here excused the one
// fault the guard's own test then reported as missed.
const DETERMINER = new Set([
  'the', 'a', 'an', 'my', 'our', 'his', 'her', 'their', 'its', 'this', 'that',
  'these', 'those', 'every', 'each', 'no', 'any', 'some', 'own', 'whole',
  'same', 'other', 'another',
]);
const VERB_FORMS = new Set(TRANSITIVE_ONLY.flatMap((v) => {
  const forms = [v, `${v}s`, `${v}ing`, `${v}ed`];
  if (v.endsWith('e')) forms.push(`${v.slice(0, -1)}ing`, `${v}d`);
  if (v.endsWith('y')) forms.push(`${v.slice(0, -1)}ies`, `${v.slice(0, -1)}ied`);
  if (v.endsWith('ch') || v.endsWith('sh') || v.endsWith('s')) forms.push(`${v}es`);
  if (/[^aeiou][aeiou][ptgmn]$/.test(v)) forms.push(`${v}${v.slice(-1)}ing`, `${v}${v.slice(-1)}ed`);
  return forms;
}));
// "finds I am readier" is a clause; "finds I readier" is the fault. An auxiliary
// or a modal straight after the pronoun is the signal that a clause has started.
const CLAUSE_START = new Set([
  'am', 'was', 'is', 'are', 'were', 'have', 'has', 'had', 'do', 'did', 'does',
  'can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might', 'must',
  'never', 'always', 'still', 'already', 'just', 'only',
]);

/** A character that is not English has no business in student copy. */
const NON_ENGLISH = /[^\x00-\x7F\u2018\u2019\u201c\u201d\u2026]/;

/**
 * The pronoun faults the voice pass left behind.
 *
 * Three rules, none of them complete on its own. The first two need both halves
 * to agree: the word in front of "I" cannot govern a subject, and the word after
 * it can never follow one. The third asks whether the word in front is a verb
 * that only ever takes an object.
 */
function pronounFaults(value, where) {
  const out = [];
  const text = String(value);
  const re = /(?:([A-Za-z']+)\s+)?([A-Za-z']+) I\s+([A-Za-z']+)/g;
  let m = re.exec(text);
  while (m) {
    const before = (m[1] || '').toLowerCase();
    const prev = m[2].toLowerCase();
    const next = m[3].toLowerCase();
    if (!BEFORE_I_OK.has(prev) && AFTER_I_NEVER.has(next)) {
      out.push({ path: where, why: `"${m[2]} I ${m[3]}" reads as an object, so it wants "me"`, text: text.slice(0, 90) });
    } else if (VERB_FORMS.has(prev) && !CLAUSE_START.has(next) && !DETERMINER.has(before)) {
      out.push({ path: where, why: `"${m[2]}" takes an object, so "${m[2]} I" wants "me"`, text: text.slice(0, 90) });
    }
    m = re.exec(text);
  }
  // A fixed phrase the pass could eat: "thank you" is a noun here, not a pronoun.
  if (/\bthank (I|me)\b/i.test(text)) {
    out.push({ path: where, why: '"thank you" as a noun has lost its you', text: text.slice(0, 90) });
  }
  if (/(^|[.!?]\s)Me\b/.test(text)) {
    out.push({ path: where, why: 'a sentence opening with "Me"', text: text.slice(0, 90) });
  }
  const odd = text.match(NON_ENGLISH);
  if (odd) {
    out.push({ path: where, why: `a character that is not English: ${JSON.stringify(odd[0])}`, text: text.slice(0, 90) });
  }
  return out;
}

// Exported for the guard's own test. A lint that has stopped biting looks
// exactly like a corpus that is clean, and the only way to tell the two apart is
// to feed it the faults it was built for and watch it name them.
export const __test_pronounFaults = pronounFaults;

// A gendered job noun in a career tool tells half a class the job is not theirs.
const GENDERED = [
  /\bwaitress\b/i, /\bwaiter\b/i, /\bactress\b/i, /\bsalesman\b/i, /\bsaleswoman\b/i,
  /\bbusinessman\b/i, /\bchairman\b/i, /\bfreshman\b/i, /\bworkman\b/i,
  /\bpoliceman\b/i, /\bfireman\b/i, /\bstewardess\b/i, /\bheadmaster\b/i, /\bheadmistress\b/i,
];


/**
 * TWO VOICES, AND WHICH ONE OWNS THE SENTENCE.
 *
 * The game was converted to the student's first person in 2.4.0, and the parts
 * that were not converted then read wrong now because they sit on the same screen
 * as the parts that were: a list of things to do this term where eight items said
 * "your school" printed directly beneath a list of moves that all said "I". Forty
 * more strings across four files were still in the old voice, and nothing was
 * stopping the forty first.
 *
 * The rule is not about which FILE a string lives in, it is about WHOSE SENTENCE
 * IT IS:
 *
 *   The student's own voice, first person, for anything the student thinks, picks,
 *   commits to, or is told about themselves. Options, outcomes, roads offered,
 *   dispositions read back, markers on their own timeline.
 *
 *   Addressing the reader, second person, on the surfaces written FOR somebody
 *   about somebody else. That is the whole of the teacher, parent, counsellor and
 *   evidence material, the facilitator lines in the table game where "your turn"
 *   is the game speaking to one player, the glossary, whose eighteen definitions
 *   are read by parents and teachers from the same sheet and where "my school has
 *   an ECG counsellor" is not a definition, and the app's own chrome, where the
 *   disclaimer on every page has to say "check with your ECG counsellor" because
 *   it is the app talking and not the student.
 *
 * So the allowlist below is the second list, by path prefix, and everything else
 * is held to the student's voice. Adding a path to it is a decision somebody has
 * to write down, which is the point.
 */
const ADDRESSES_READER = [
  'parent.', 'copy.parentLive.', 'copy.teacher.', 'copy.table.', 'copy.chrome.',
  'copy.footerDoors.', 'copy.landing.', 'glossary.', 'evidence.', 'work.', 'money.',
  'schools.', 'stories.', 'lifelong.ribbon.', 'possibilities.',
  // Release notes are the app reporting on itself, and the older ones quote copy
  // that has since been rewritten. Holding them to the student's voice would mean
  // editing the history of the app to match its present.
  'version.',
];
const SECOND_PERSON = /\b(you|your|yours|yourself)\b/i;

function voiceFaults(value, where) {
  if (ADDRESSES_READER.some((p) => where.startsWith(p))) return [];
  const m = String(value).match(SECOND_PERSON);
  if (!m) return [];
  return [{
    path: where,
    why: `"${m[0]}" in the student's own voice, which the rest of this screen speaks in the first person`,
    text: String(value).slice(0, 80),
  }];
}

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

  // The phrase a capacity choice contributes to "One more every year now,
  // because I ...". It is rendered, so it has to be in the same voice. It sat in
  // the voice pass's skip list once and produced "because I learned to run your
  // own week" on screen.
  ((data.journey && data.journey.stages) || []).forEach((s) => {
    (s.choices || []).forEach((c) => {
      if (c.grew && /\b(you|your|yours)\b/i.test(c.grew)) {
        murky.push({ path: `${s.id} grew`, why: 'a growth phrase in the second person', text: c.grew });
      }
    });
  });

  optionLabels(data).forEach(({ where, label }) => {
    if (/\b(you|your|yours|yourself)\b/i.test(label)) {
      murky.push({ path: where, why: 'an option in the second person, not the student\'s voice', text: label });
    }
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
    pronounFaults(value, where).forEach((f) => murky.push(f));
    voiceFaults(value, where).forEach((f) => murky.push(f));
    // The ban is on the dash as punctuation, which is the thing this house style
    // does not use. A hyphen inside a word is part of a name: Co-Curricular
    // Activity is how MOE spells it, and respelling it would be a different kind
    // of wrong.
    if (/\s[-–—]|[-–—]\s|[–—]/.test(value)) {
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
    const opener = {};
    outcomes.forEach((o) => {
      const first = o.text.trim().split(/\s+/)[0].replace(/[^A-Za-z]/g, '');
      if (first) opener[first] = (opener[first] || 0) + 1;
    });
    Object.entries(opener).forEach(([word, n]) => {
      const ratio = n / outcomes.length;
      if (ratio > 0.3) {
        cadence.push({ path: 'chances', why: `${Math.round(ratio * 100)}% of outcomes open with "${word}" (cap 30%)` });
      }
    });
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
