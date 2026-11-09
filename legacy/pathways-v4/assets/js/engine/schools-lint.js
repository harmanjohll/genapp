// The kinds of school, checked.
//
// WHY THIS NEEDS ITS OWN RULES. The page exists because the app assumes one kind
// of student, and the page's whole value is that it admits it. There are two ways
// that value gets destroyed and both are easy to do by accident.
//
// The first is completeness. Drop one kind of school and the app is back to
// assuming a student away, except now there is a page that looks thorough. So the
// roads that exist in Singapore are named here and checked by name: a specialised
// school, a special education school, an Integrated Programme, a specialised
// independent school, a private candidate. Somebody trimming the list has to
// argue with this file.
//
// The second is the honesty badge. Every kind says how much of the app fits it,
// and if every one of them said "fully" the field would be decoration. At least
// one has to say the app does not model that road, because that is TRUE, and the
// sweep fails a version where nothing says it.

const words = (s) => String(s || '').trim().split(/\s+/).filter(Boolean).length;

const APPLIES = ['fully', 'partly', 'no'];
const KIND_CAPS = { label: 9, examples: 22, sits: 22, leadsTo: 22, note: 40 };
const SUPPORT_CAPS = { label: 9, what: 26, who: 20, howToGet: 22, note: 26 };

// The roads that exist. Named by the words that must appear somewhere, so a list
// cannot quietly lose one.
const MUST_NAME = [
  [/specialised school|NorthLight|Spectra|Crest|Assumption/i, 'the specialised schools and the ITE Skills Certificate'],
  [/special education|SPED/i, 'special education schools'],
  [/Integrated Programme/i, 'the Integrated Programme'],
  [/specialised independent|NUS High|School of the Arts|Sports School|Science and Technology/i, 'the specialised independent schools'],
  [/private candidate|home education/i, 'students not in a mainstream school'],
];

// Language that turns a fact about the app into a verdict on a student.
const NOT_A_VERDICT = [
  /\bnot suitable\b|\bunsuitable\b/i,
  /\blower ability\b|\bweaker students?\b|\bless able\b/i,
  /\bsadly\b|\bunfortunately\b|\blimited to\b|\bonly option\b|\bhas to settle\b/i,
];

export function schoolsSweep(data) {
  const failures = [];
  const s = data.schools || {};
  const kinds = s.kinds || [];
  const support = s.support || [];
  const sources = s.sources || {};

  if (kinds.length < 5) {
    failures.push({ why: `${kinds.length} kinds of school: the point of the page is that there is more than one road` });
  }

  const ids = new Set();
  kinds.forEach((k) => {
    if (ids.has(k.id)) failures.push({ kind: k.id, why: 'duplicate id' });
    ids.add(k.id);
    Object.entries(KIND_CAPS).forEach(([f, cap]) => {
      if (!k[f]) failures.push({ kind: k.id, why: `no ${f}` });
      else if (words(k[f]) > cap) failures.push({ kind: k.id, why: `${f} runs ${words(k[f])} words over ${cap}` });
    });
    if (!APPLIES.includes(k.appliesHere)) {
      failures.push({ kind: k.id, why: `appliesHere is ${k.appliesHere}, which is not one of ${APPLIES.join(', ')}` });
    }
    if (k.status !== 'provisional') failures.push({ kind: k.id, why: 'claimed as confirmed from a build that cannot reach the page' });
    if (!sources[k.sourceRef]) failures.push({ kind: k.id, why: `sourceRef ${k.sourceRef} is not in the sources list` });
    // Every road has to lead somewhere. This is the app's oldest promise and it
    // matters most on the page about the students most often told otherwise.
    if (!k.leadsTo || /nowhere|no further|end of the road/i.test(k.leadsTo)) {
      failures.push({ kind: k.id, why: 'a road that leads nowhere, which this app does not render' });
    }
  });

  support.forEach((x) => {
    Object.entries(SUPPORT_CAPS).forEach(([f, cap]) => {
      if (!x[f]) failures.push({ support: x.id, why: `no ${f}` });
      else if (words(x[f]) > cap) failures.push({ support: x.id, why: `${f} runs ${words(x[f])} words over ${cap}` });
    });
    if (!sources[x.sourceRef]) failures.push({ support: x.id, why: `sourceRef ${x.sourceRef} is not in the sources list` });
  });
  if (support.length < 3) {
    failures.push({ why: `${support.length} kinds of support named: a student who needs school to work differently gets almost nothing` });
  }

  // COMPLETENESS. Every road that exists has to be on the page.
  const all = [...kinds, ...support]
    .map((k) => `${k.label} ${k.examples || ''} ${k.what || ''} ${k.sits || ''} ${k.note || ''}`).join(' ');
  MUST_NAME.forEach(([re, what]) => {
    if (!re.test(all)) failures.push({ why: `${what} are not named anywhere, so those students are assumed away again` });
  });

  // THE HONESTY BADGE. If everything fits, the field is decoration.
  if (!kinds.some((k) => k.appliesHere === 'no')) {
    failures.push({ why: 'no road where the app admits its planner does not apply, which makes the badge decoration' });
  }
  if (!kinds.some((k) => k.appliesHere === 'fully')) {
    failures.push({ why: 'no road the planner fits, which cannot be right either' });
  }

  // A fact about the app must never be written as a verdict on a student.
  [...kinds, ...support].forEach((k) => {
    const text = Object.values(k).filter((v) => typeof v === 'string').join(' ');
    NOT_A_VERDICT.forEach((re) => {
      const m = text.match(re);
      if (m) failures.push({ kind: k.id, why: `a verdict on a student rather than a fact about the app: "${m[0]}"` });
    });
    const dash = text.match(/\s[-–—]|[-–—]\s|[–—]/);
    if (dash) failures.push({ kind: k.id, why: `a dash used as punctuation: "${dash[0]}"` });
  });

  ['source', 'url', 'accessed'].forEach((k) => {
    if (!(s._meta || {})[k]) failures.push({ why: `schools _meta has no ${k}` });
  });

  const ok = failures.length === 0;
  console.log(
    `%cSchools sweep: ${ok ? 'PASS' : 'FAIL'} (${kinds.length} roads, ${support.length} kinds of support, every road leads somewhere)`,
    ok ? 'color:#2F7D5B;font-weight:700' : 'color:#B23A2A;font-weight:700'
  );
  if (!ok) console.table(failures);
  return { ok, failures };
}
