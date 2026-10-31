// Node harness for the v3 sweeps: the same checks ?dev=1 runs in the
// browser, runnable against data/ in a terminal.
//
//   node tools/verify.mjs            from pathways3/
//
// Exits nonzero on any failure. v3 adds three gates the v2 audit found
// missing: undefined var() references in the stylesheets (v2 shipped a
// transparent commit bar because --bg resolved to nothing), a byte budget on
// the eager payload (v2's README numbers drifted 10% with nothing watching),
// and computed contrast for the token pairs that sit on era-tinted paper.

import { readFileSync, statSync } from 'node:fs';
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

const CSS_FILES = ['tokens3.css', 'base.css', 'app.css', 'play.css'];
const PINNED = [...CSS_FILES, 'main.js'];

function pass(name, ok, extra) {
  console.log(
    `%c${name}: ${ok ? 'PASS' : 'FAIL'}${extra ? ` (${extra})` : ''}`,
    ok ? 'color:#2F7D5B;font-weight:700' : 'color:#B23A2A;font-weight:700'
  );
}

/** index.html's build stamp, version.json, and every subresource pin must agree. */
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
  PINNED.forEach((f) => {
    if (!new RegExp(`${f.replace('.', '\\.')}\\?v=${meta}`).test(html)) {
      failures.push({ why: `${f} is not cache busted to ${meta}` });
    }
  });
  const sw = readFileSync(join(root, 'sw.js'), 'utf8');
  const swVersion = (sw.match(/const VERSION = '([^']+)'/) || [])[1];
  if (meta && swVersion !== meta) {
    failures.push({ why: `sw.js caches version ${swVersion} but the build is ${meta}` });
  }
  const ok = failures.length === 0;
  pass('Version', ok, meta && `build ${meta}`);
  if (!ok) console.table(failures);
  return { ok, failures };
}

/**
 * Every var(--x) referenced in a stylesheet must be defined in one of them.
 * v2 shipped a commit bar with background: var(--bg) where --bg existed
 * nowhere, so the bar holding the game's primary button was transparent and
 * page text scrolled through it. A reference to nothing fails silently in
 * CSS; here it fails loudly.
 */
function cssVarSweep() {
  const failures = [];
  let defined = new Set();
  let referenced = new Map();
  CSS_FILES.forEach((f) => {
    // Comments off first: play.css narrates the very bug this sweep exists
    // to catch, and the narration must not trip the alarm.
    const css = readFileSync(join(root, 'assets/css', f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const m of css.matchAll(/--[a-z0-9-]+(?=\s*:)/gi)) defined.add(m[0]);
    for (const m of css.matchAll(/var\(\s*(--[a-z0-9-]+)\s*([,)])/gi)) {
      // A reference carrying its own fallback is self-sufficient (JS sets
      // --draw-len per element, with 1000 as the declared floor).
      if (m[2] === ',') continue;
      if (!referenced.has(m[1])) referenced.set(m[1], f);
    }
  });
  referenced.forEach((file, name) => {
    if (!defined.has(name)) failures.push({ why: `var(${name}) referenced in ${file} but defined nowhere` });
  });
  const ok = failures.length === 0;
  pass('CSS vars', ok, `${referenced.size} refs, ${defined.size} defs`);
  if (!ok) console.table(failures);
  return { ok, failures };
}

/**
 * The eager payload is what a student on school wifi pays before anything
 * paints. v2 documented its numbers in the README and then drifted 10% with
 * nothing watching. This is the byte budget as a gate: raw bytes, because
 * gzip ratios are stable enough here that raw drift is what matters.
 */
const EAGER_DATA = ['subjects', 'pathways', 'progressions', 'copy', 'glossary', 'activities', 'lifelong', 'version'];
const EAGER_BUDGET = 420 * 1024;
function payloadSweep() {
  const failures = [];
  let total = 0;
  const parts = [
    join(root, 'index.html'),
    ...CSS_FILES.map((f) => join(root, 'assets/css', f)),
    join(root, 'assets/fonts/literata-var-latin.woff2'),
    ...EAGER_DATA.map((n) => join(root, 'data', `${n}.json`)),
  ];
  parts.forEach((p) => { try { total += statSync(p).size; } catch { failures.push({ why: `missing: ${p}` }); } });
  if (total > EAGER_BUDGET) {
    failures.push({ why: `eager payload ${(total / 1024).toFixed(0)}KB over budget ${(EAGER_BUDGET / 1024).toFixed(0)}KB` });
  }
  const ok = failures.length === 0;
  pass('Payload', ok, `${(total / 1024).toFixed(0)}KB raw of ${(EAGER_BUDGET / 1024).toFixed(0)}KB`);
  if (!ok) console.table(failures);
  return { ok, failures };
}

/**
 * Contrast, computed, on the papers students actually read on: the base
 * papers and the most-tinted era paper in both themes. The pairs are the
 * ones the v2 audit measured slipping under AA on 'later' paper.
 */
function contrastSweep() {
  const css = readFileSync(join(root, 'assets/css/tokens3.css'), 'utf8');
  const failures = [];
  const hex = (name, scope) => {
    const section = scope === 'dark'
      ? css.slice(css.indexOf('data-theme="dark"'))
      : css.slice(0, css.indexOf('@media (prefers-color-scheme: dark)'));
    const m = section.match(new RegExp(`${name}:\\s*(#[0-9A-Fa-f]{6})`));
    return m && m[1];
  };
  const lum = (h) => {
    const c = [1, 3, 5].map((i) => {
      let v = parseInt(h.slice(i, i + 2), 16) / 255;
      return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const ratio = (a, b) => {
    const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (l1 + 0.05) / (l2 + 0.05);
  };
  // era mix: later paper = mix(paper 84%, partner 16%)
  const mix = (a, b, pa) => '#' + [1, 3, 5].map((i) => {
    const v = Math.round(parseInt(a.slice(i, i + 2), 16) * pa + parseInt(b.slice(i, i + 2), 16) * (1 - pa));
    return v.toString(16).padStart(2, '0');
  }).join('');
  ['light', 'dark'].forEach((theme) => {
    const paper = hex('--paper', theme);
    const partner = theme === 'light' ? '#5E6B7A' : '#3D4757';
    const later = paper && mix(paper, partner, 0.84);
    [['--ink', 4.5], ['--ink-soft', 4.5], ['--ink-mute', 4.5], ['--accent-dk', 4.5], ['--open-ink', 3], ['--within', 3], ['--longer', 3]].forEach(([name, min]) => {
      const fg = hex(name, theme);
      if (!fg || !paper) { failures.push({ why: `token ${name}/${theme} not found as hex` }); return; }
      [['paper', paper], ['later-era paper', later]].forEach(([label, bg]) => {
        const r = ratio(fg, bg);
        if (r < min) failures.push({ why: `${name} on ${label} (${theme}) = ${r.toFixed(2)}:1, needs ${min}:1` });
      });
    });
  });
  const ok = failures.length === 0;
  pass('Contrast', ok);
  if (!ok) console.table(failures);
  return { ok, failures };
}

/** The guard's own guard: the pronoun lint must still bite. */
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
  pass('Lint bites', ok, `${SHIPPED.length} shipped faults, ${CORRECT.length} correct sentences`);
  if (!ok) console.table(failures);
  return { ok, failures };
}

const results = [
  ['version', versionSweep()],
  ['css-vars', cssVarSweep()],
  ['payload', payloadSweep()],
  ['contrast', contrastSweep()],
  ['reach', runInvariantSweep(ctx)],
  ['projection', projectionSweep(ctx)],
  ['journey', runJourneySweep(data)],
  ['possibilities', possibilitySweep(data)],
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
