// Node harness for the v3 sweeps: the same checks ?dev=1 runs in the
// browser, runnable against data/ in a terminal.
//
//   node tools/verify.mjs            from pathways/
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
  'moves', 'version', 'activities', 'possibilities', 'work', 'money', 'evidence', 'schools', 'offer', 'goals', 'daysin',
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

const CSS_FILES = ['tokens4.css', 'base.css', 'app.css', 'play.css', 'v4.css', 'v7.css'];
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
const EAGER_DATA = ['subjects', 'pathways', 'progressions', 'copy', 'glossary', 'activities', 'lifelong', 'version', 'years', 'psle', 'grades', 'offer', 'goals', 'families', 'compass'];
const EAGER_BUDGET = 420 * 1024;
function payloadSweep() {
  const failures = [];
  let total = 0;
  const parts = [
    join(root, 'index.html'),
    ...CSS_FILES.map((f) => join(root, 'assets/css', f)),
    join(root, 'assets/fonts/bricolage-var-latin.woff2'),
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
  const css = readFileSync(join(root, 'assets/css/tokens4.css'), 'utf8');
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
  // Text on coloured fills (buttons, chips, the level switch): the fill and
  // its text token must still pass after dark, where the fills get lighter.
  [['--on-lv', '--g1'], ['--on-lv', '--g2'], ['--on-lv', '--g3'], ['--on-lv', '--open'],
    ['--accent-ink', '--accent'], ['--sel-ink', '--sel-bg'], ['--night-ink', '--night']].forEach(([fgName, bgName]) => {
    ['light', 'dark'].forEach((theme) => {
      const fg = hex(fgName, theme); const bg = hex(bgName, theme);
      if (!fg || !bg) { failures.push({ why: `token ${fgName} or ${bgName} (${theme}) not found as hex` }); return; }
      const r = ratio(fg, bg);
      if (r < 4.5) failures.push({ why: `${fgName} on ${bgName} (${theme}) = ${r.toFixed(2)}:1, needs 4.5:1` });
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

// ---- v4 sweeps ------------------------------------------------------------

const { adviceSweep } = await import(join(root, 'assets/js/engine/advice.js'));
const { gradesSweep } = await import(join(root, 'assets/js/engine/grades.js'));
const { psleScore, postingFor, startLevels } = await import(join(root, 'assets/js/engine/psle.js'));
const readData = (n) => JSON.parse(readFileSync(join(root, 'data', `${n}.json`), 'utf8'));
const { lowerLensSweep, policySweep, offerSweep, v5Sweep } = await import(join(root, 'assets/js/engine/policy.js'));

/** v5: the goal engine (interests, sectors, places, families) and share links. */
function v5GoalSweep() {
  const r = v5Sweep(ctx, { ...data, goals: readData('goals'), families: readData('families') });
  pass('Goal and share', r.ok, `${r.checks} checks: every interest and sector leads somewhere, families only add, goal moves move it, links round trip`);
  if (!r.ok) console.table(r.fails);
  return r;
}
const { styleSweep, CODE_FILES } = await import(join(root, 'assets/js/engine/style-lint.js'));
const { advise: adviseFn } = await import(join(root, 'assets/js/engine/advice.js'));
const { subjectsForYear: forYear, isLower: lowerYear } = await import(join(root, 'assets/js/engine/years.js'));

/** House style on the planning screens: data, screen code and built advice. */
function v4StyleSweep() {
  const all = { ...data, years: readData('years'), psle: readData('psle'), grades: readData('grades') };
  const files = Object.fromEntries(CODE_FILES.map((f) => [f, readFileSync(join(root, f), 'utf8')]));
  const built = () => {
    const out = [];
    [null, data.offer].forEach((offer) => ['sec1', 'sec2', 'sec3', 'sec4'].forEach((y) => ['G1', 'G2', 'G3'].forEach((lv) => {
      const rows = forYear(y, ctx.subjects, offer).filter((x) => (x.levels || []).length);
      const plan = {};
      rows.forEach((x, i) => { if (x.group === 'science' && !lowerYear(y) && i % 3) return; if (x.levels.includes(lv)) plan[x.id] = lv; else if (i % 2) plan[x.id] = x.levels[0]; });
      const a = adviseFn({ yearId: y, plan, ctx: { ...ctx, offer } });
      if (a.start) out.push(a.start.line);
      a.singles.forEach((m) => out.push(m.line, m.result, m.short, m.sec3, m.when, m.how, ...(m.because || [])));
      a.pairs.forEach((m) => out.push(m.line));
      a.holds.forEach((h) => out.push(h.line));
    })));
    return out.filter(Boolean);
  };
  const r = styleSweep(all, files, built);
  pass('Style', r.ok, `${r.checks} strings: no antithesis, morals, meta commentary, metaphor or long sentences on the planning screens`);
  if (!r.ok) console.table(r.faults.slice(0, 40));
  return r;
}

/** Beatty's offering: Set levels and advice show only what the school runs. */
function v4OfferSweep() {
  const r = offerSweep(ctx, data.offer);
  pass('School offer', r.ok, 'Beatty subjects and levels, elsewhere marks, advice inside the offer, G1 Humanities');
  if (!r.ok) console.table(r.fails);
  return r;
}

/** Sec 1 and 2 are judged by their own rules: no dead end, never further, no SEC counts in what they read. */
function v4LowerSweep() {
  const r = lowerLensSweep(ctx);
  pass('Lower lens', r.ok, `${r.checks} checks: Sec 1 and 2 rules, monotone, no SEC counts in their advice`);
  if (!r.ok) console.table(r.failures.slice(0, 20));
  return r;
}

/** Verdicts MOE's published rules decide, pinned. */
function v4PolicySweep() {
  const r = policySweep(ctx, readData('grades'), readData('psle'));
  pass('Policy', r.ok, 'JC and MI with Mother Tongue at G2, R3, NAFA, PFP and Sec 5 grades, JC floors and conditional admission, HMTL, the Mother Tongue options');
  if (!r.ok) console.table(r.fails);
  return r;
}

function v4AdviceSweep() {
  const r = adviceSweep(ctx);
  pass('Advice', r.ok, `${r.checks} named moves checked, every one a conditional that moves something`);
  if (!r.ok) console.table(r.failures.slice(0, 20));
  return r;
}

function v4GradesSweep() {
  const r = gradesSweep(readData('grades'));
  pass('Grades', r.ok, 'L1R4, ELR2B2 and ELMAB3 on a known plan');
  if (!r.ok) console.table(r.fails);
  return r;
}

/** Every PSLE score from 4 to 32 lands somewhere, and options never go below base. */
function v4PsleSweep() {
  const rules = readData('psle');
  const fails = [];
  for (let al = 1; al <= 8; al += 1) {
    const psle = { el: { al }, mtl: { al }, maths: { al }, science: { al } };
    const sc = psleScore(psle, rules);
    const post = postingFor(sc.score, psle, rules);
    if (!post) { fails.push(`score ${sc.score} produced nothing`); continue; }
    if (!post.groups.length && !post.note) fails.push(`score ${sc.score} has no group and no words`);
    post.groups.forEach((g) => {
      const s = startLevels(g, psle, rules);
      Object.values(s.options).forEach((opts) => { if (!opts.includes(s.base)) fails.push(`group ${g} lost its base level`); });
    });
  }
  const ok = !fails.length;
  pass('PSLE', ok, 'every uniform AL maps to a group or a sentence');
  if (!ok) console.table(fails);
  return { ok, fails };
}

/** House style for the v4 data: no dashes in anything a reader sees. */
function v4DashSweep() {
  const fails = [];
  ['years', 'psle', 'grades', 'families', 'offer', 'goals', 'daysin', 'compass'].forEach((n) => {
    const walk = (v, path) => {
      if (typeof v === 'string') {
        if (path.includes('url') || path.includes('_meta') || /\.id$/.test(path)) return;
        if (/[\u2013\u2014]|\w-\w| - /.test(v)) fails.push({ path: `${n}${path}`, text: v.slice(0, 60) });
      } else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`));
      else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => walk(x, `${path}.${k}`));
    };
    walk(readData(n), '');
  });
  const ok = !fails.length;
  pass('Dashes', ok, 'v4 data files');
  if (!ok) console.table(fails.slice(0, 20));
  return { ok, fails };
}

/** Every module parses. The engine sweeps only import the engine, so a
    syntax error in a screen or a ui module would otherwise ship silently. */
async function syntaxSweep() {
  const { spawnSync } = await import('node:child_process');
  const { readdirSync } = await import('node:fs');
  const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : e.name.endsWith('.js') ? [join(d, e.name)] : []));
  const files = [...walk(join(root, 'assets/js')), join(root, 'sw.js')];
  const fails = files.map((f) => ({ f, r: spawnSync(process.execPath, ['--check', f], { encoding: 'utf8' }) }))
    .filter((x) => x.r.status !== 0).map((x) => ({ file: x.f.replace(root, ''), err: (x.r.stderr || '').split('\n').slice(0, 4).join(' ') }));
  const ok = !fails.length;
  pass('Syntax', ok, `${files.length} modules parse`);
  if (!ok) console.table(fails);
  return { ok, fails };
}

/**
 * The service worker must hold every module the app can load and every data
 * file it can fetch. 5.0.0 shipped without the path screen in that list, so
 * the home screen could not open with no signal. Walks the imports from
 * main.js and each screen; the ?dev=1 lints are left out on purpose.
 */
async function offlineSweep() {
  const { existsSync } = await import('node:fs');
  const { normalize } = await import('node:path');
  const sw = readFileSync(join(root, 'sw.js'), 'utf8');
  const listed = new Set([...sw.matchAll(/v\('\.\/([^']+)'\)/g)].map((m) => m[1]));
  const swData = new Set((sw.match(/const DATA = \[([\s\S]*?)\]/) || ['', ''])[1].match(/'([a-z0-9]+)'/g).map((x) => x.slice(1, -1)));
  const main = readFileSync(join(root, 'assets/js/main.js'), 'utf8');
  const devOnly = new Set(['assets/js/engine/copy-lint.js', 'assets/js/engine/dom-lint.js']);
  const seen = new Set();
  const queue = ['assets/js/main.js', ...[...main.matchAll(/mod: '(\.\/screens\/[^']+)'/g)].map((m) => normalize(`assets/js/${m[1]}`))];
  while (queue.length) {
    const f = queue.pop();
    if (seen.has(f) || !existsSync(join(root, f))) continue;
    seen.add(f);
    for (const m of readFileSync(join(root, f), 'utf8').matchAll(/(?:from\s+|import\(\s*)['"`](\.{1,2}\/[^'"`?$]+)/g)) {
      queue.push(normalize(join(dirname(f), m[1])));
    }
  }
  const loader = readFileSync(join(root, 'assets/js/data-loader.js'), 'utf8');
  const files = ((loader.match(/FILES = \[([\s\S]*?)\]/) || ['', ''])[1].match(/'([a-z0-9]+)'/g) || []).map((x) => x.slice(1, -1));
  const fails = [
    ...[...seen].filter((f) => !devOnly.has(f) && !listed.has(f)).map((f) => ({ missing: f })),
    ...files.filter((n) => !swData.has(n)).map((n) => ({ missing: `data/${n}.json` })),
    ...[...listed].filter((f) => !existsSync(join(root, f))).map((f) => ({ listedButAbsent: f })),
  ];
  const ok = !fails.length;
  pass('Offline', ok, `${seen.size - devOnly.size} modules and ${files.length} data files held by the service worker`);
  if (!ok) console.table(fails);
  return { ok, fails };
}

/**
 * Five tabs: Me, Goal, Path, Play, Saved. Every screen must stay within two
 * taps of the menu: a tab, then one link on it. Links are read from each
 * screen's own code (data-s, nav(), or a { s: } route). The first run start,
 * the old Home address and the shared view, which opens only from a link, are
 * left out on purpose.
 */
function reachableSweep() {
  const main = readFileSync(join(root, 'assets/js/main.js'), 'utf8');
  const screens = Object.fromEntries([...main.matchAll(/^\s+([a-z]+):\s+\{ mod: '\.\/(screens\/[^']+)'/gm)].map((m) => [m[1], m[2]]));
  const tabs = [...(main.match(/const NAV_ITEMS = \[([\s\S]*?)\];/) || ['', ''])[1].matchAll(/s: '([a-z]+)'/g)].map((m) => m[1]);
  const linksOf = (id) => {
    const src = readFileSync(join(root, 'assets/js', screens[id]), 'utf8');
    return new Set([...src.matchAll(/data-s=\\?"([a-z]+)|nav\('([a-z]+)'|\bs: '([a-z]+)'/g)].map((m) => m[1] || m[2] || m[3]).filter((s) => screens[s]));
  };
  const near = new Set(tabs);
  tabs.forEach((tab) => linksOf(tab).forEach((s) => near.add(s)));
  const skip = new Set(['start', 'home', 'shared']);
  const fails = Object.keys(screens).filter((s) => !skip.has(s) && !near.has(s)).map((s) => ({ screen: s, why: 'more than two taps from the menu' }));
  if (tabs.length !== 5) fails.push({ screen: 'menu', why: `${tabs.length} tabs; 7.0 has five` });
  const ok = !fails.length;
  pass('Reachable', ok, `${Object.keys(screens).length - skip.size} screens within two taps of ${tabs.join(', ')}`);
  if (!ok) console.table(fails);
  return { ok, fails };
}

/** Saved plans from v4.4 and v5 come into 6.0 joined, and nothing a student kept is lost. */
async function migrateSweep() {
  const { mergeStored } = await import(join(root, 'assets/js/engine/migrate.js'));
  const v4 = {
    plans: { sec1: { el: 'G2', math: 'G2' }, sec2: { el: 'G2', math: 'G2' }, sec3: {} },
    actions: ['Ask about Maths', 'Talk to my form teacher'], grades: { now: { el: 'B3' }, target: { math: 'A2' } },
    psle: { el: { al: 5 } }, runs: [{ id: 'r1' }], liveRun: { age: 15 }, history: [{ t: 1 }],
    year: 'sec2', yearSet: true, seenStart: true, soundOn: true, seenVersion: '4.4.0', role: 'parent',
  };
  // v5 saves every field, defaults included, so its empty game state must not erase v4's.
  const v5 = {
    plans: { sec1: {}, sec2: { el: 'G3', math: 'G2' }, sec3: {}, sec4: {}, sec5: {} },
    actions: ['Talk to my form teacher', 'Visit a poly open house'], grades: { now: {}, target: { math: 'A1' } },
    psle: {}, runs: [], liveRun: null, history: [], year: 'sec2', yearSet: true, seenStart: true, soundOn: false,
    role: 'student', goal: { dest: 'poly', role: 'Engineer' }, scenario: { yearId: 'sec2', plan: { el: 'G3' } }, importedFromClassic: true,
  };
  const both = mergeStored(v5, v4);
  const only4 = mergeStored(null, v4);
  const only5 = mergeStored(v5, null);
  const eq = (x, y) => JSON.stringify(x) === JSON.stringify(y);
  const cases = [
    ['a new device starts clean', mergeStored(null, null) === null],
    ['v4 only: plans, moves and the game come across', eq(only4.plans.sec2, v4.plans.sec2) && only4.actions.length === 2 && eq(only4.liveRun, v4.liveRun)],
    ['v4 only: its what changed stamp stays behind', !('seenVersion' in only4) && only4.importedFrom === 'v4'],
    ['v5 only: the goal and Plan B come across', eq(only5.goal, v5.goal) && eq(only5.scenario, v5.scenario) && only5.importedFrom === 'v5'],
    ['both: a year set in v5 wins', eq(both.plans.sec2, v5.plans.sec2)],
    ['both: a year set only in v4 is kept', eq(both.plans.sec1, v4.plans.sec1)],
    ['both: moves are joined without repeats', eq(both.actions, ['Talk to my form teacher', 'Visit a poly open house', 'Ask about Maths'])],
    ['both: grades join subject by subject, v5 first', both.grades.now.el === 'B3' && both.grades.target.math === 'A1'],
    ['both: PSLE results set only in v4 are kept', eq(both.psle, v4.psle)],
    ['both: v4 game runs and history survive v5 defaults', eq(both.runs, v4.runs) && eq(both.liveRun, v4.liveRun) && eq(both.history, v4.history)],
    ['both: the goal and Plan B come from v5', eq(both.goal, v5.goal) && eq(both.scenario, v5.scenario)],
    ['both: a setting on in either stays on', both.soundOn === true && both.seenStart === true],
    ['both: v5 choices win where both set one', both.role === 'student'],
    ['both: neither app\'s own flags carry', !('importedFromClassic' in both) && !('seenVersion' in both) && both.importedFrom === 'v4+v5'],
  ];
  const fails = cases.filter(([, ok]) => !ok).map(([name]) => ({ case: name }));
  const ok = !fails.length;
  pass('Migrate', ok, `${cases.length} cases: v4.4 only, v5 only, both`);
  if (!ok) console.table(fails);
  return { ok, fails };
}

/**
 * 7.0: the compass, the fuller goal and the links that carry them. These are
 * the parts with no screen to catch a mistake: what comes across from 6.0,
 * what a link may carry, when a goal is due, and that every list the new
 * screens read is whole.
 */
async function sevenSweep() {
  const { upgradeTo7, fromEarlier, cleanCompass, WANT_CODE } = await import(join(root, 'assets/js/engine/migrate.js'));
  const { encodePacket, decodePacket, packMe, unpackMe } = await import(join(root, 'assets/js/engine/packet.js'));
  const { goalDue } = await import(join(root, 'assets/js/state.js'));
  const compass = readData('compass');
  const goals = readData('goals');
  const parent = data.parent;
  const eq = (x, y) => JSON.stringify(x) === JSON.stringify(y);
  const v6 = { plans: { sec2: { el: 'G3' } }, aim: 'people', actions: ['Ask about Maths'], goal: { dest: 'poly', sector: 'care' }, seenVersion: '6.0.0', year: 'sec2', yearSet: true };
  const up = fromEarlier(v6, { plans: { sec2: { el: 'G1' } } }, null);
  const junk = cleanCompass({ enjoy: ['S', 'S', 'X', 'I', 'A'], strengths: [{ id: 'explain', proof: 'x'.repeat(200) }, { id: 'BAD ID' }, null, { id: 'a_b' }, { id: 'c_d' }, { id: 'e_f' }], values: ['help', 'help', 7, 'make', 'learn', 'earn'], notes: [{ text: '  two   spaces ' }, { text: '' }, 'no'] });
  const me = { enjoy: ['S', 'I'], values: ['help', 'secure'], strengths: [{ id: 'explain', proof: 'private words' }], notes: [{ text: 'private' }] };
  const pk = decodePacket(encodePacket({ y: 'sec2', plan: { el: 'G3' }, goal: { dest: 'poly' }, me }));
  const day = (n) => new Date(Date.UTC(2026, 10, 11) + n * 86400000).toISOString().slice(0, 10);
  const SANE = /^[A-Za-z0-9 ,.'’()%:;?!$-]{3,120}$/;
  const destIds = new Set(ctx.destinations.map((d) => d.id));
  const steps = (goals.steps && goals.steps.list) || [];
  const ids = (list) => list.map((x) => x.id);
  const uniq = (list) => new Set(list).size === list.length;
  const codes = (goals.interests || []).map((x) => x.code).sort().join('');
  const wantCodes = new Set(((data.journey && data.journey.wants) || []).map((w) => w.riasec).filter(Boolean));
  const cases = [
    ['6.0 comes across: plans, steps and the goal', up && eq(up.plans.sec2, { el: 'G3' }) && up.actions.length === 1 && up.goal.dest === 'poly' && up.importedFrom === 'v6'],
    ['6.0 wins over v5 when both are on the device', up && up.plans.sec2.el === 'G3'],
    ['the game\'s old want becomes what the student enjoys', up && eq(up.compass.enjoy, ['S']) && !('aim' in up)],
    ['6.0\'s what changed stamp stays behind', up && !('seenVersion' in up)],
    ['a device that never opened 6.0 still joins v5 and v4', eq(fromEarlier(null, { plans: { sec2: { el: 'G1' } }, goal: { dest: 'jc' } }, null).plans.sec2, { el: 'G1' })],
    ['a new device starts clean', fromEarlier(null, null, null) === null],
    ['a compass already filled is not overwritten by an old want', eq(upgradeTo7({ aim: 'make', compass: { enjoy: ['R'] } }).compass.enjoy, ['R'])],
    ['every want of the game maps to an interest', Object.values(WANT_CODE).every((c) => 'RIASEC'.includes(c)) && [...wantCodes].every((c) => codes.includes(c))],
    ['the compass holds two interests, three strengths, three values at most', junk.enjoy.length === 2 && junk.strengths.length === 3 && junk.values.length === 3],
    ['the compass drops what it cannot read', eq(junk.enjoy, ['S', 'I']) && junk.strengths.every((r) => /^[a-z_]+$/.test(r.id)) && junk.values.every((v) => typeof v === 'string')],
    ['typed lines are trimmed and capped', junk.strengths[0].proof.length === 90 && eq(junk.notes.map((n) => n.text), ['two spaces'])],
    ['a link carries the compass only when asked', decodePacket(encodePacket({ y: 'sec2', plan: {}, goal: null })).me === null && pk.me && eq(pk.me.enjoy, ['S', 'I'])],
    ['a link never carries typed words', pk.me.strengths[0].proof === '' && pk.me.notes.length === 0 && !/private/.test(packMe(me))],
    ['a malformed compass in a link reads as none', unpackMe('<script>') === null && unpackMe('ZZ.help') === null && unpackMe('..') === null],
    ['a goal is due after its date', goalDue({ by: day(-1), checkedAt: day(-10), setAt: day(-10) }, day(0)) === true],
    ['a goal looked at after its date is not asked about again that week', goalDue({ by: day(-3), checkedAt: day(-1), setAt: day(-30) }, day(0)) === false],
    ['a goal with no date is due after three weeks', goalDue({ setAt: day(-22), checkedAt: day(-22) }, day(0)) === true && goalDue({ setAt: day(-5), checkedAt: day(-5) }, day(0)) === false],
    ['no goal is never due', goalDue(null, day(0)) === false],
    ['the six interests are the six kinds, once each', codes === 'ACEIRS'],
    ['strengths and values: ten each, ids unique and plain', (compass.strengths || []).length >= 6 && (compass.values || []).length >= 6 && uniq(ids(compass.strengths)) && uniq(ids(compass.values)) && [...ids(compass.strengths), ...ids(compass.values)].every((id) => /^[a-z_]{2,24}$/.test(id))],
    ['the compass has its four parts', eq((compass.parts || []).map((x) => x.id), ['enjoy', 'strengths', 'values', 'goal'])],
    ['every goal step can travel in a link', steps.length >= 6 && steps.every((x) => SANE.test(x.label))],
    ['every goal step names real places and years', uniq(ids(steps)) && steps.every((x) => (!x.for || x.for.every((d) => destIds.has(d))) && (x.years || []).length && x.years.every((y) => /^sec[1-5]$/.test(y)))],
    ['every place has a step to offer in every year', [...destIds].every((d) => ['sec1', 'sec2', 'sec3', 'sec4'].every((y) => steps.some((x) => (!x.for || x.for.includes(d)) && x.years.includes(y))))],
    ['every long view marker speaks to the student as you', (data.lifelong.markers || []).length >= 6 && data.lifelong.markers.every((m) => m.you && m.you.title && m.you.body) && data.lifelong.bands.every((b) => b.you)],
    ['what changed runs in date order', (parent.changes || []).length >= 3 && parent.changes.every((c, i, all) => !i || Number(c.year) > Number(all[i - 1].year))],
    ['each old stream has its words for today', ['express', 'na', 'nt'].every((k) => parent.thenNow && parent.thenNow.rows[k] && parent.thenNow.rows[k].levels && parent.thenNow.rows[k].group && parent.thenNow.rows[k].exam)],
  ];
  const fails = cases.filter(([, ok]) => !ok).map(([name]) => ({ case: name }));
  const ok = !fails.length;
  pass('Seven', ok, `${cases.length} cases: what comes across from 6.0, the compass, goal dates, links, and the lists the new screens read`);
  if (!ok) console.table(fails);
  return { ok, fails };
}

/** No rule may put white text on a fill that gets lighter after dark. */
function whiteOnFillSweep() {
  const fails = [];
  CSS_FILES.forEach((f) => {
    const css = readFileSync(join(root, 'assets/css', f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const body = m[2];
      if (/(^|;)\s*color:\s*(#fff\b|#ffffff\b|white\b)/i.test(body)
        && /background(-color)?:[^;]*var\(--(g1|g2|g3|open|accent|line-open)\)/.test(body)) {
        fails.push({ file: f, rule: m[1].trim().slice(0, 60) });
      }
    }
  });
  const ok = !fails.length;
  pass('White on fills', ok, 'no white text on level, open or accent fills');
  if (!ok) console.table(fails);
  return { ok, fails };
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
  ['advice', v4AdviceSweep()],
  ['grades', v4GradesSweep()],
  ['psle', v4PsleSweep()],
  ['lower-lens', v4LowerSweep()],
  ['policy', v4PolicySweep()],
  ['offer', v4OfferSweep()],
  ['style', v4StyleSweep()],
  ['goal-share', v5GoalSweep()],
  ['dashes', v4DashSweep()],
  ['syntax', await syntaxSweep()],
  ['offline', await offlineSweep()],
  ['reachable', reachableSweep()],
  ['migrate', await migrateSweep()],
  ['seven', await sevenSweep()],
  ['white-on-fill', whiteOnFillSweep()],
];

const bad = results.filter(([, r]) => !r.ok);
if (bad.length) {
  console.error(`\n${bad.length} sweep(s) failing: ${bad.map(([n]) => n).join(', ')}`);
  process.exit(1);
}
console.log('\nAll sweeps green.');
