// Planning and conversation, together.
//
// Every piece of advice in v4 carries the words to say to a real person,
// voiced for whoever is holding the phone. The facts never change with the
// role; only who speaks and who is asked. A parent is given a question to
// ask their child, never a verdict to deliver; a teacher is given an opener,
// never a recommendation to hand down.

const TEACHER = (m) => {
  const n = (m && m.name) || 'this subject';
  if (/English/.test(n)) return 'English teacher';
  if (/Mother Tongue/.test(n)) return 'Mother Tongue teacher';
  if (/Math/.test(n)) return 'Maths teacher';
  if (/Science|Physics|Chemistry|Biology/.test(n)) return 'Science teacher';
  if (/Social Studies|Geography|History|Literature|Humanities/.test(n)) return 'Humanities teacher';
  if (/ and /.test(n) || /,/.test(n)) return 'subject teachers';
  return `${n} teacher`;
};

/** One line to say about a single move. */
export function sayMove(m, role) {
  const subj = m.any ? 'one of these subjects' : m.name;
  const to = m.to;
  if (m.kind === 'pair') {
    const names = m.moves.map((x) => x.name).join(' and ');
    if (role === 'parent') return `Ask your child: "Of ${names}, which one feels closest to the next level? What would help?"`;
    if (role === 'teacher') return `Ask the student: "Which of ${names} would you try first?"`;
    return `Ask your form teacher: "If I worked on ${names}, which one is more realistic to move first?"`;
  }
  if (m.kind === 'hold') {
    const one = (m.names && m.names.length > 1) ? 'any of these' : m.name;
    if (role === 'parent') return `If ${one} feels heavy, ask your child: "Is it the level, or something we can fix together?"`;
    if (role === 'teacher') return `Before any move down in ${one}, ask the student: "What would make ${m.level} sustainable for you?"`;
    return `Before easing ${one} down, ask your ${TEACHER(m)}: "What else changes if I do?"`;
  }
  if (m.kind === 'add') {
    if (role === 'parent') return `Ask your child: "Have you ever tried ${subj}? Does it interest you?"`;
    if (role === 'teacher') return `Ask the student: "Would you want ${subj} in your combination, if your school runs it?"`;
    return `Ask your form teacher: "Does our school run ${subj} at ${to}, and how do I apply?"`;
  }
  if (role === 'parent') return `Ask your child: "How does ${subj} feel at ${m.from || 'this level'}? What would help if you wanted to try ${to}?"`;
  if (role === 'teacher') return `Ask the student: "If ${subj} moved to ${to}, what would you need from me this term?"`;
  return `Ask your ${m.any ? 'subject teachers' : TEACHER(m)}: "What would it take for me to move ${subj} to ${to}?"`;
}

/** Labels for the role-voiced bits of chrome. */
export function roleWords(role) {
  if (role === 'parent') return { you: 'your child', your: "your child's", my: "My child's", plan: "My child's plan", say: 'Say it at home' };
  if (role === 'teacher') return { you: 'the student', your: "the student's", my: "The student's", plan: "The student's plan", say: 'Say it in the conversation' };
  return { you: 'you', your: 'your', my: 'My', plan: 'My plan', say: 'Say it to someone' };
}
