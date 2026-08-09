// Node harness for the v2 sweeps: the same checks ?dev=1 runs in the
// browser, runnable against data/ in a terminal, because the content pass
// iterates dozens of times and a content edit should not need a browser to
// find out it broke an invariant.
//
//   node tools/verify.mjs            from pathways2/
//
// Exits nonzero on any failure. The copy lint's first-paint measurement is
// browser-only and is exercised by the Playwright pass instead.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const load = (name) => JSON.parse(readFileSync(join(root, 'data', `${name}.json`), 'utf8'));

const data = Object.fromEntries([
  'subjects', 'pathways', 'progressions', 'lifelong', 'copy', 'parent',
  'glossary', 'dispositions', 'futures', 'chances', 'journey', 'stories',
  'moves', 'version', 'activities', 'possibilities', 'work', 'money', 'evidence', 'schools',
].map((n) => [n, load(n)]));

const { runInvariantSweep } = await import(join(root, 'assets/js/engine/reach.js'));
const { projectionSweep } = await import(join(root, 'assets/js/engine/project.js'));
const { runJourneySweep } = await import(join(root, 'assets/js/engine/journey4.js'));
const { runCopyLint, __test_pronounFaults } = await import(join(root, 'assets/js/engine/copy-lint.js'));
const { possibilitySweep } = await import(join(root, 'assets/js/engine/possible.js'));
const { tableSweep } = await import(join(root, 'assets/js/modes/mode-table.js'));
const { ecgSweep } = await import(join(root, 'assets/js/engine/ecg-lint.js'));
const { workSweep, moneySweep } = await import(join(root, 'assets/js/engine/work-lint.js'));
const { evidenceSweep } = await import(join(root, 'assets/js/engine/evidence-lint.js'));
const { schoolsSweep } = await import(join(root, 'assets/js/engine/schools-lint.js'));

const ctx = {
  subjects: data.subjects.subjects,
  destinations: data.pathways.destinations,
  routesById: Object.fromEntries(data.progressions.routes.map((r) => [r.id, r])),
  pathwaysMeta: data.pathways._meta,
  yearId: 'sec3',
};

/**
 * The build stamp in index.html and the version in version.json must agree.
 *
 * They are two files because the browser treats them differently: the HTML is
 * revalidated on a reload and the JSON is not, which is why the stamp had to
 * move into the HTML. Two files means they can drift, and a drift means the
 * footer tells a teacher their page is part cached when it is not, or worse,
 * says nothing when it is. So it is checked.
 */
function versionSweep() {
  const failures = [];
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  const meta = (html.match(/<meta name="app-version" content="([^"]+)"/) || [])[1];
  const declared = data.version && data.version.version;
  if (!meta) failures.push({ why: 'index.html carries no app-version meta tag' });
  if (!declared) failures.push({ why: 'version.json declares no version' });
  if (meta && declared && meta !== declared) {
    failures.push({ why: `index.html says ${meta} and version.json says ${declared}` });
  }
  if (meta && !(data.version.releases || []).some((r) => r.version === meta)) {
    failures.push({ why: `no release notes for ${meta}, so the what changed sheet would be blank` });
  }
  // Every subresource in the document has to carry the buster, or a student on
  // a cached stylesheet sees new copy in an old layout.
  ['tokens2.css', 'base.css', 'components.css', 'main.js'].forEach((f) => {
    if (!new RegExp(`${f.replace('.', '\\.')}\\?v=${meta}`).test(html)) {
      failures.push({ why: `${f} is not cache busted to ${meta}` });
    }
  });
  const ok = failures.length === 0;
  console.log(
    `%cVersion: ${ok ? 'PASS' : 'FAIL'}${meta ? ` (build ${meta})` : ''}`,
    ok ? 'color:#2F7D5B;font-weight:700' : 'color:#B23A2A;font-weight:700'
  );
  if (!ok) console.table(failures);
  return { ok, failures };
}

/**
 * The guard's own guard.
 *
 * A lint that has quietly stopped biting is indistinguishable from a corpus that
 * is clean: both print PASS. This feeds the pronoun rule the twenty faults that
 * actually shipped, in the words they shipped in, and the correct sentences that
 * earlier versions of the rule broke on. If a future tightening silences a fault
 * or starts failing good English, this says which one and where.
 */
function lintBitesSweep() {
  const SHIPPED = [
    'Semester one graded I while I was settling in.',
    'Dim sum service pays for the paint. My feet hate I and my ledger balances.',
    'The software that was supposed to replace I becomes the thing I wield.',
    'Future clients find I because of tonight.',
    'I run orientation for two hundred freshies. People know I now.',
    "The form expires quietly. Next year's version finds I readier.",
    'one of them starts telling I things nobody writes down.',
    'I miss I and I am rubbish at this, I type.',
    'The interview toughens I regardless of the letter.',
    'He catches I doing it properly at 5pm on a Friday.',
    "The client's thank I email becomes page one of my portfolio.",
    'My module lecturer needs I now.',
    'A growing field takes I on and trains I afterwards.',
    'Career conversion programmes place I with an employer first.',
    'The team works out the gap sooner, and stops bringing I problems.',
    'An email nobody warned I about: the bursary is approved.',
    'She explains it and Ms D takes I both.',
    'My sergeant recommends I for command school.',
    'The module everyone else loves bores I to tears.',
    'Nobody makes I take either.',
  ];
  const CORRECT = [
    'the roads I did not take',
    'She remembers I asked about moving up.',
    'Explaining it to Wei Ming reveals I understand it better than I thought.',
    'with a line only someone who knows I could write.',
    'Take the leave I am owed.',
    'Moves I made',
    'On my phone: a course brochure, a job ad, a business name I doodled.',
    'Teachers plant forests they rarely see. I show her one tree.',
    'Auntie included, I explain G2 and G3 twice.',
    'Nobody knew I wanted to move up.',
    'At the start I said I was going to be a vet.',
    'They discuss it like I am not there.',
    'The fastest learning I have done.',
    'Whatever the slip says, I finish knowing I emptied the tank.',
    'Uncles half satisfied, I fully stretched.',
    'Forewarned, I bank the hard weeks early.',
    'Eighteen months after I asked what promotion takes, I hand my supervisor the list.',
    'Semester one graded me while I was settling in.',
  ];
  const failures = [];
  SHIPPED.forEach((t) => {
    if (!__test_pronounFaults(t, 'test').length) failures.push({ why: 'no longer caught', text: t });
  });
  CORRECT.forEach((t) => {
    const f = __test_pronounFaults(t, 'test');
    if (f.length) failures.push({ why: `good English flagged: ${f[0].why}`, text: t });
  });
  const ok = failures.length === 0;
  console.log(
    `%cLint bites: ${ok ? 'PASS' : 'FAIL'} (${SHIPPED.length} shipped faults, ${CORRECT.length} correct sentences)`,
    ok ? 'color:#2F7D5B;font-weight:700' : 'color:#B23A2A;font-weight:700'
  );
  if (!ok) console.table(failures);
  return { ok, failures };
}

const results = [
  ['version', versionSweep()],
  ['reach', runInvariantSweep(ctx)],
  ['projection', projectionSweep(ctx)],
  ['journey', runJourneySweep(data)],
  ['possibilities', possibilitySweep(data)],
  ['table', tableSweep(data)],
  ['ecg', ecgSweep(data)],
  ['work', workSweep(data)],
  ['money', moneySweep(data)],
  ['evidence', evidenceSweep(data)],
  ['schools', schoolsSweep(data)],
  ['copy', runCopyLint(data)],
  ['lint-bites', lintBitesSweep()],
];

const bad = results.filter(([, r]) => !r.ok);
if (bad.length) {
  console.error(`\n${bad.length} sweep(s) failing: ${bad.map(([n]) => n).join(', ')}`);
  process.exit(1);
}
console.log('\nAll sweeps green.');
