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

const ctx = {
  subjects: data.subjects.subjects,
  destinations: data.pathways.destinations,
  routesById: Object.fromEntries(data.progressions.routes.map((r) => [r.id, r])),
  pathwaysMeta: data.pathways._meta,
  yearId: 'sec3',
};

const results = [
  ['reach', runInvariantSweep(ctx)],
  ['projection', projectionSweep(ctx)],
  ['journey', runJourneySweep(data)],
  ['possibilities', possibilitySweep(data)],
  ['copy', runCopyLint(data)],
];

const bad = results.filter(([, r]) => !r.ok);
if (bad.length) {
  console.error(`\n${bad.length} sweep(s) failing: ${bad.map(([n]) => n).join(', ')}`);
  process.exit(1);
}
console.log('\nAll sweeps green.');
