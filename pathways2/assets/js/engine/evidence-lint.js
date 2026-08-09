// The evidence page, checked.
//
// WHY A LINT ON A PAGE OF PROSE. Because the one failure mode of an evidence page
// is that it slowly becomes a brochure. Somebody trims for length, the criticisms
// go first because they are the least comfortable sentences on the page, and what
// is left is a reference list that makes the tool look better than it is. Every
// rule here exists to make that edit fail loudly.
//
// The rules are therefore about SHAPE, not about wording:
//
//   Every frame has a citation, a claim, a use, a WEAKNESS and a REFUSAL. Drop
//   either of the last two from any frame and the sweep names it.
//   The critical works are present and each is answered.
//   The refusal about having no outcome evidence is present, by meaning rather
//   than by id, because that is the sentence a brochure would lose first.

const words = (s) => String(s || '').trim().split(/\s+/).filter(Boolean).length;

const FRAME_FIELDS = { name: 8, claims: 40, inApp: 40, limit: 40, refuses: 46 };

// Language that turns a limit into a boast. A weakness written as a strength is
// the polite version of deleting it.
const NOT_A_LIMIT = [
  /\bno (real )?(weakness|limitation|downside)\b/i,
  /\bwidely accepted\b|\bwell established beyond\b|\bbeyond dispute\b|\bproven\b/i,
  /\bthe gold standard\b|\bdefinitive\b/i,
];

export function evidenceSweep(data) {
  const failures = [];
  const e = data.evidence || {};
  const frames = e.frames || [];
  const critical = e.critical || [];
  const refusals = e.refusals || [];

  if (frames.length < 6) {
    failures.push({ why: `${frames.length} frames: the app names more than that in its own interface` });
  }

  const ids = new Set();
  frames.forEach((f) => {
    if (ids.has(f.id)) failures.push({ frame: f.id, why: 'duplicate id' });
    ids.add(f.id);
    Object.entries(FRAME_FIELDS).forEach(([k, cap]) => {
      if (!f[k]) failures.push({ frame: f.id, why: `no ${k}, and a frame without a ${k} is a frame nobody can argue with` });
      else if (words(f[k]) > cap) failures.push({ frame: f.id, why: `${k} runs ${words(f[k])} words over ${cap}` });
    });
    if (!f.cite) failures.push({ frame: f.id, why: 'no citation' });
    // A citation with no year is a name drop.
    else if (!/\b(19|20)\d\d\b/.test(f.cite) && !/Ministry of Education/i.test(f.cite)) {
      failures.push({ frame: f.id, why: 'a citation with no year in it' });
    }
    NOT_A_LIMIT.forEach((re) => {
      const m = String(f.limit || '').match(re);
      if (m) failures.push({ frame: f.id, why: `a weakness written as a strength: "${m[0]}"` });
    });
    const dash = [f.claims, f.inApp, f.limit, f.refuses].join(' ').match(/\s[-–—]|[-–—]\s|[–—]/);
    if (dash) failures.push({ frame: f.id, why: `a dash used as punctuation: "${dash[0]}"` });
  });

  // The frames named in the interface must all be here. A frame the app claims to
  // use and cannot cite is the worst row on the page.
  const named = ['Holland', 'Krumboltz', 'Savickas', 'Super', 'Gottfredson', 'Bandura', 'Sampson'];
  const allCites = frames.map((f) => f.cite).join(' ');
  named.forEach((who) => {
    if (!allCites.includes(who)) failures.push({ why: `${who} is used in the build and cited nowhere` });
  });

  if (critical.length < 2) {
    failures.push({ why: `${critical.length} critical works: fewer than two and this is a brochure` });
  }
  critical.forEach((c) => {
    ['cite', 'says', 'answer'].forEach((k) => {
      if (!c[k]) failures.push({ critical: c.id, why: `no ${k}` });
    });
    if (words(c.says || '') > 40) failures.push({ critical: c.id, why: `the argument runs ${words(c.says)} words over 40` });
    if (words(c.answer || '') > 66) failures.push({ critical: c.id, why: `the answer runs ${words(c.answer)} words over 66` });
    // An answer shorter than the argument reads as a brush off.
    if (words(c.answer || '') < words(c.says || '') * 0.6) {
      failures.push({ critical: c.id, why: 'the answer is much shorter than the argument, which reads as a brush off' });
    }
  });

  if (refusals.length < 4) failures.push({ why: `${refusals.length} refusals: the limits are the point of the page` });
  refusals.forEach((r) => {
    if (words(r.head) > 9) failures.push({ why: `a refusal heading over nine words: ${r.head}` });
    if (words(r.body) > 56) failures.push({ why: `a refusal over fifty six words: ${r.head}` });
  });

  // THE SENTENCE A BROCHURE LOSES FIRST. Matched on meaning rather than on an id,
  // so renaming the entry does not slip it past.
  const text = refusals.map((r) => `${r.head} ${r.body}`).join(' ');
  if (!/no (outcome )?(trial|evidence|comparison|follow up)/i.test(text)) {
    failures.push({ why: 'the page no longer says it has no outcome evidence about itself, which is the sentence that made the rest worth reading' });
  }
  if (!/not (predict|estimate)/i.test(text)) {
    failures.push({ why: 'the page no longer says it does not predict grades' });
  }
  if (!/(does not rank|never ranked|no notion of a better)/i.test(text)) {
    failures.push({ why: 'the page no longer says it does not rank routes' });
  }

  ['source', 'accessed'].forEach((k) => {
    if (!(e._meta || {})[k]) failures.push({ why: `evidence _meta has no ${k}` });
  });

  const ok = failures.length === 0;
  console.log(
    `%cEvidence sweep: ${ok ? 'PASS' : 'FAIL'} (${frames.length} frames each with a weakness, ${critical.length} counterarguments answered, ${refusals.length} refusals)`,
    ok ? 'color:#2F7D5B;font-weight:700' : 'color:#B23A2A;font-weight:700'
  );
  if (!ok) console.table(failures);
  return { ok, failures };
}
