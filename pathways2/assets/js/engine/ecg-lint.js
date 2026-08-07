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

// Roles that exist in a secondary school and nowhere after it. A polytechnic
// has mentors, lecturers, course managers and an ECG counsellor; it has no form
// teacher, no year head and no Sec 2 juniors.
const SCHOOL_ROLES = /\b(form teacher|year head|form class|school fund|Sec [1-5]s?\b|speech day)/i;
const FORK_AGE = 17;

export function ecgSweep(data) {
  const failures = [];
  const cards = (data.chances && data.chances.cards) || [];
  cards.forEach((c) => {
    const why = judgeCard(c);
    if (why) failures.push({ card: c.id, title: c.title, why });
    // A card that can be dealt after the results fork must not speak in
    // secondary school vocabulary, unless it is gated to school.
    if (!c.schoolOnly && c.maxAge >= FORK_AGE) {
      const txt = [c.title, c.body, ...(c.responses || []).map((r) => `${r.label} ${r.outcome} ${r.stretch || ''}`),
        ...(c.onwardMoves || [])].join(' ');
      const m = txt.match(SCHOOL_ROLES);
      if (m) {
        failures.push({ card: c.id, title: c.title, why: `says "${m[0]}" but can be dealt after the fork` });
      }
    }
    if (c.type === 'setback' && !(c.onwardMoves || []).length) {
      failures.push({ card: c.id, title: c.title, why: 'a setback with no way around it' });
    }
  });

  // Stage choices are decisions too, and the same rule applies to them: a turn
  // whose options do not differ in education or career terms is not a turn.
  ((data.journey && data.journey.stages) || []).forEach((s) => {
    const variants = [s, ...Object.values(s.variants || {})];
    variants.forEach((v) => {
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
