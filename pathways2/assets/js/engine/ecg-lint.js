// Does every scenario turn on an Education and Career Guidance decision?
//
// WHY THIS EXISTS. The deck grew a set of cards that were true about being
// fifteen and had nothing to do with education or career: a group chat falling
// out, a breakup, a BTO spreadsheet, a health screening. Each read well and none
// of them belonged in an ECG tool, because in every one of them the options
// differed in how the student FELT rather than in what they DID about school or
// work. A style rule in a document would not have caught that. This does.
//
// THE TEST, in two parts:
//
//   1. THE JUNCTURE. The situation itself must sit in the education or career
//      world: a level, a subject, an application, a course, a qualification, a
//      workplace, a fee. This is the load-bearing half, and it is what the eight
//      deleted cards failed. A stairwell conversation and a BTO queue number are
//      real and they are not junctures this tool exists to help with.
//
//   2. THE MOVE. At least one response must name an education or career action,
//      so the card visibly offers a way to act rather than only a way to feel.
//
// Deliberately NOT tested: that every response contains a career noun. An
// earlier version demanded that and flagged twenty nine good cards, because
// "call in every favour" is a career action written in English rather than in
// keywords. Tightening a lint until it fails good work is how style rules get
// deleted; this one is aimed at the defect that actually occurred.
//
// Setbacks additionally must carry onwardMoves, because the one thing an ECG
// tool must never do is describe a wall without naming a way around it.

const ANCHORS = {
// Prefixes, matched at a word start only. There is deliberately no trailing
  // word boundary: an earlier version had one, which meant "promot" never
  // matched promotion and "universit" never matched university, and the lint
  // then blamed the cards for a fault in its own regex.
  subject_level: /\b(G1|G2|G3|level|subject|combination|syllabus|paper|Sec [1-5]|stream|band|elective|humanities|maths|scien|literature|module|Express|Normal|exam|result|grade|marks|revis|school|CCA|tuition|O Level|N Level|General Paper|homework|studies|studying|semester|timetable|classroom|lesson)/i,
  admission: /\b(EAE|Early Admission|admission|appl|posting|appeal|portfolio|audition|intake|offer|aggregate|L1R4|ELR2B2|ELMAB3|requirement|criteria|interview|shortlist|refere|transcript|folder)/i,
  course: /\b(poly|ITE|Nitec|junior college|JC|Millennia|diploma|degree|universit|course|GPA|cluster|foundation|certificat|transfer|A Level|exempt|defer|enrol|graduat)/i,
  work: /\b(intern|attachment|apprentice|employ|job|career|industry|promot|retrench|restructur|SkillsFuture|conversion|train|qualification|licence|trade|workplace|client|customer|salary|raise|shift|manager|boss|foreman|freelance|commission|business|vocation|bursary|assistance|fee|title|wage|hire|hiring|colleague|work)/i,
  explore: /\b(shadow|open house|mentor|counsellor|teacher|lecturer|tutor|alumni|senior|coach|ask|find out|talk to|sit in)/i,
};

const anchorsIn = (text) => Object.entries(ANCHORS)
  .filter(([, re]) => re.test(String(text || '')))
  .map(([k]) => k);

/** One card, judged. Returns null when it ties, or a reason when it does not. */
export function judgeCard(card) {
  const responses = card.responses || [];
  if (!responses.length) return 'no responses';

  const situation = anchorsIn(`${card.title} ${card.body}`);
  const tagged = !!(card.subjects && card.subjects.length);
  if (!situation.length && !tagged) {
    return 'the situation is not an education or career juncture';
  }

  const anchored = responses
    .filter((r) => anchorsIn(`${r.label} ${r.outcome} ${r.stretch || ''}`).length).length;
  const opensDoor = responses.some((r) => r.opens);
  if (!anchored && !opensDoor) {
    return 'no response offers an education or career action';
  }
  return null;
}

// WHERE THE WORDS ARE TRUE.
//
// A polytechnic has lecturers, course managers, course mates and an ECG
// counsellor. It has no form teacher, no year head, no Project Work and no Sec 2
// juniors. An earlier version of this rule guessed at that with an age: any card
// dealable at seventeen or later was forbidden secondary vocabulary, and cards
// were exempted by a schoolOnly boolean. Age was the wrong axis. A student is
// seventeen in a JC, a poly, an ITE, an arts school, or a workshop, and the
// vocabulary that is true of them depends on WHICH, not on how old they are.
//
// So the axis is the institution, declared per card and per stage as `at`, and
// the rule is: for each family of words, the places where the words the text
// actually uses are true must cover everywhere the text can be shown.
//
// Families, not single phrases, because a label written for several institutions
// at once names the local term for each: "my form teacher or tutor" is correct
// at a secondary school AND at a JC, and a phrase-by-phrase rule would call it
// wrong at both. Words in the same family are alternatives, so their reach adds
// up. Words in different families do not: "my lecturer told my year head" is
// still wrong in a polytechnic, and the pastoral family is what catches it.
const SCHOOLING = ['sec', 'jc', 'mi', 'poly', 'ite', 'arts'];
const AFTER_SCHOOL = ['poly', 'ite', 'arts', 'uni'];

// Roles are only checked when the text CLAIMS THE PERSON. "which lecturers to
// chase" at a polytechnic open house is a Sec 3 student asking a fair question
// about somewhere else; "my lecturer" in the same sentence would not be. The
// qualifier is what turns a word into a claim about where the speaker stands,
// so every role pattern below is built through this.
const mine = (role) => new RegExp(`\\b(my|our|the|her|his|their)\\s+(${role})s?\\b`, 'i');

const VOCAB = {
  // The adult responsible for you as a person.
  pastoral: [
    [mine('form teacher'), ['sec']],
    [mine('co.form teacher'), ['sec']],
    [mine('form tutor'), ['jc', 'mi']],
    [mine('civics tutor'), ['jc', 'mi']],
    [mine('year head'), ['sec', 'jc', 'mi']],
    [mine('level head'), ['sec', 'jc', 'mi']],
    [mine('discipline master'), ['sec']],
    [mine('course manager'), ['poly', 'ite']],
    [mine('course chair'), ['poly']],
    [mine('dean'), ['poly', 'arts', 'uni']],
  ],
  // The adult who teaches you a subject.
  teaching: [
    [mine('subject teacher'), ['sec', 'jc', 'mi']],
    [mine('lecturer'), AFTER_SCHOOL],
    [mine('professor'), ['uni']],
  ],
  // The group you belong to by default.
  group: [
    [mine('form class'), ['sec']],
    [mine('civics group'), ['jc', 'mi']],
    [mine('course ?mate'), AFTER_SCHOOL],
    [mine('tutorial group'), ['jc', 'mi', 'poly', 'uni']],
  ],
  // Named programmes, which exist in some institutions and not others. No
  // qualifier needed: a programme is named or it is not, and naming one you are
  // not in is the fault. "remedial" is narrowed to the lesson, because at a
  // desk at thirty it is also a perfectly good adjective.
  programme: [
    [/\bVIA\b/, ['sec', 'jc', 'mi']],
    [/\bProject Work\b/i, ['jc', 'mi']],
    [/\bPW\b/, ['jc', 'mi']],
    [/\bGeneral Paper\b/i, ['jc', 'mi']],
    [/\bremedial (class|lesson|session|group|slot)/i, ['sec', 'jc', 'mi']],
    [/\bstreaming\b/i, ['sec']],
    [/\bCCAs?\b/, [...SCHOOLING, 'uni']],
  ],
  // Things that happen in a school year and not in a semester.
  event: [
    [/\bspeech day\b/i, ['sec', 'jc', 'mi']],
    [/\bmorning assembly\b/i, ['sec', 'jc', 'mi']],
    [/\bprefects?\b/i, ['sec', 'jc', 'mi']],
    [/\bschool fund\b/i, ['sec', 'jc', 'mi']],
    [/\bEdusave\b/i, ['sec', 'jc', 'mi']],
  ],
  // Year names, but only where the year names a PERSON. "the Sec 2 I am
  // training" and "Teaching the two habits to Sec 2s" put a junior in the room,
  // which is a claim about where the room is. "in Sec 4", "after Sec 4" and
  // "from Sec 3" are ordinary memory, true to say at any age from anywhere.
  yearname: [
    [/\b(the|a|my|our|two|three|some|those) Sec [1-5]\b/i, ['sec']],
    [/\bSec [1-5]s\b/, ['sec']],
    [/\b(the|a|my|our) JC ?[12]\b/i, ['jc']],
  ],
};

// Naming your own past is not a claim about where you are standing. "Back in Sec
// 3" and "the form teacher who told me" are true in a lecture theatre at
// nineteen; "the Sec 2 I am training" is not. The signal is the sentence looking
// backwards, so the exemption reads the words immediately before the match.
const LOOKING_BACK = /\b(back (in|at|then)|used to|when I was|years? ago|remember(ed|s)?|former|once|my (old|last|previous)|the one from)\b[^.!?]{0,40}$/i;

const vocabFaults = (text, at) => {
  const where = Array.isArray(at) && at.length ? at : null;
  if (!where) return [];
  const faults = [];
  Object.entries(VOCAB).forEach(([family, entries]) => {
    const hits = [];
    entries.forEach(([re, places]) => {
      const m = re.exec(text);
      if (!m) return;
      if (LOOKING_BACK.test(text.slice(0, m.index))) return;
      hits.push({ word: m[0], places });
    });
    if (!hits.length) return;
    const reach = new Set(hits.flatMap((h) => h.places));
    const missing = where.filter((k) => !reach.has(k));
    if (missing.length) {
      faults.push(`says "${hits.map((h) => h.word).join('" and "')}" but is shown at ${missing.join(', ')}`);
    }
  });
  return faults;
};

// WHEN A CARD CLAIMS TO BE A CONSEQUENCE.
//
// The complaint was precise: a card had a lab technician watch the student set
// up a titration twice, and then mention a competition. Two correct titrations
// are not a skill anybody gets picked for, and the card felt unearned because it
// WAS unearned. It claimed to be the second half of a story whose first half the
// student had never played.
//
// So: a card whose text says an adult noticed, remembered, kept or came back
// must be gated on a FLAG, which is one specific thing the student did on one
// specific turn. Nothing softer will do, and the rule was written the softer way
// first: it also accepted a disposition threshold, and because the titration
// card asked for curiosity it passed with the antecedent stripped back out. A
// rule that excuses the defect it was written for is decoration. A disposition
// is a reading of a personality and a subject is a choice of timetable; neither
// is an act anybody in the story could have witnessed.
//
// Moments are exempt by construction and not by exception: a paragraph read out
// in a lesson, a topic clicking at midnight, a piece going up in the foyer,
// none of those claim that anybody remembered anything, so none of them match.
const CLAIMS_MEMORY = [
  /\bremember(s|ed)\b/i, /\bnotice(s|d)\b/i, /\bhad not forgotten\b/i,
  /\bkept my (number|name|card|details)\b/i, /\basks? back\b/i,
  /\bbecause I asked\b/i, /\bthe (\w+ ){0,2}I (asked|shadowed|helped|met|coached)\b/i,
  /\bas promised\b/i, /\bfrom (before|last year|that day)\b/i,
  /\bstill has my\b/i, /\bthe one who (asked|helped|stayed)\b/i,
];

export function ecgSweep(data) {
  const failures = [];
  const cards = (data.chances && data.chances.cards) || [];
  cards.forEach((c) => {
    const why = judgeCard(c);
    if (why) failures.push({ card: c.id, title: c.title, why });
    const claim = CLAIMS_MEMORY.map((re) => (`${c.title} ${c.body}`).match(re)).find(Boolean);
    if (claim && !c.requiresFlag && !c.when) {
      failures.push({
        card: c.id, title: c.title, why: `says "${claim[0].trim()}" with nothing behind it`,
      });
    }
    // Every sentence on the card, checked against everywhere the card is dealt.
    const txt = [c.title, c.body, ...(c.responses || []).map((r) => `${r.label} ${r.outcome} ${r.stretch || ''}`),
      ...(c.onwardMoves || [])].join(' ');
    vocabFaults(txt, c.at).forEach((f) => failures.push({ card: c.id, title: c.title, why: f }));
    if (!(c.at || []).length) failures.push({ card: c.id, title: c.title, why: 'no institution declared' });
    if (c.type === 'setback' && !(c.onwardMoves || []).length) {
      failures.push({ card: c.id, title: c.title, why: 'a setback with no way around it' });
    }
  });

  // The same rule, on the asks down the side of the board. This is where the
  // fault was first seen: a Year Head offered to a nineteen year old in a
  // polytechnic, where no such person exists.
  ((data.moves && data.moves.moves) || []).forEach((m) => {
    const txt = [m.label, m.why || '', m.detail || '', m.outcome || ''].join(' ');
    vocabFaults(txt, m.at).forEach((f) => failures.push({ move: m.id, title: m.label, why: f }));
    if (!(m.at || []).length) failures.push({ move: m.id, title: m.label, why: 'no institution declared' });
  });

  // Stage choices are decisions too, and the same rule applies to them: a turn
  // whose options do not differ in education or career terms is not a turn.
  ((data.journey && data.journey.stages) || []).forEach((s) => {
    const variants = [s, ...Object.values(s.variants || {})];
    variants.forEach((v) => {
      const txt = [v.chapter || '', v.situation || '', ...(v.choices || [])
        .map((c) => `${c.label || ''} ${c.outcome || ''}`)].join(' ');
      vocabFaults(txt, s.at).forEach((f) => failures.push({ stage: s.id, why: f }));
      const choices = (v.choices || []).filter((c) => c.label);
      if (!choices.length) return;
      if (!anchorsIn(`${v.chapter || v.title || ''} ${v.situation || ''}`).length) {
        failures.push({ stage: s.id, why: 'the chapter is not an education or career juncture' });
      }
      const anchored = choices
        .filter((c) => anchorsIn(`${c.label} ${c.outcome || ''}`).length).length;
      if (!anchored && !choices.some((c) => c.opens || c.raise)) {
        failures.push({ stage: s.id, why: 'no choice offers an education or career action' });
      }
    });
  });

  const ok = failures.length === 0;
  console.log(
    `%cECG tie: ${ok ? 'PASS' : 'FAIL'} (${cards.length} cards, every decision checked)`,
    ok ? 'color:#2F7D5B;font-weight:700' : 'color:#B23A2A;font-weight:700'
  );
  if (!ok) { console.table(failures.slice(0, 40)); console.error(`${failures.length} scenarios do not tie to ECG`); }
  return { ok, failures };
}
