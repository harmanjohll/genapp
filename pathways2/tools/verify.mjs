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
  'moves', 'version', 'activities', 'possibilities',
].map((n) => [n, load(n)]));

const { runInvariantSweep } = await import(join(root, 'assets/js/engine/reach.js'));
const { projectionSweep } = await import(join(root, 'assets/js/engine/project.js'));
const { runJourneySweep } = await import(join(root, 'assets/js/engine/journey4.js'));
const { runCopyLint } = await import(join(root, 'assets/js/engine/copy-lint.js'));
const { possibilitySweep } = await import(join(root, 'assets/js/engine/possible.js'));
const { tableSweep } = await import(join(root, 'assets/js/modes/mode-table.js'));
const { ecgSweep } = await import(join(root, 'assets/js/engine/ecg-lint.js'));

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

const results = [
  ['version', versionSweep()],
  ['reach', runInvariantSweep(ctx)],
  ['projection', projectionSweep(ctx)],
  ['journey', runJourneySweep(data)],
  ['possibilities', possibilitySweep(data)],
  ['table', tableSweep(data)],
  ['ecg', ecgSweep(data)],
  ['copy', runCopyLint(data)],
];

const bad = results.filter(([, r]) => !r.ok);
if (bad.length) {
  console.error(`\n${bad.length} sweep(s) failing: ${bad.map(([n]) => n).join(', ')}`);
  process.exit(1);
}
console.log('\nAll sweeps green.');
