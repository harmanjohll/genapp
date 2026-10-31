// Stamp a version across everything a browser might cache.
//
// WHY THIS EXISTS. A whole rewrite of the game's language shipped and did not
// appear on a device that had opened the app before, because every asset was
// requested at exactly the URL the browser already had. There is no build step
// here on purpose, so the cache busting has to be written into the files.
//
// The version lives in index.html, in a meta tag, because the document is the
// one thing a reload revalidates. Everything below it hangs off that: the
// stylesheets, the entry module, every relative import inside the module graph,
// and every data file at fetch time.
//
//   node pathways2/tools/release.mjs 2.4.1   set a new version everywhere
//   node pathways2/tools/release.mjs         re-stamp the current one
//
// Then write the release notes into data/version.json. The version sweep fails
// if the two disagree, or if a release has no notes, so neither can be skipped.

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const HTML = join(root, 'index.html');
const SUBRESOURCES = ['assets/css/tokens2.css', 'assets/css/base.css', 'assets/css/components.css', 'assets/js/main.js'];

/** Every .js under assets/js, at any depth. */
function jsFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return jsFiles(full);
    return name.endsWith('.js') ? [full] : [];
  });
}

const html = readFileSync(HTML, 'utf8');
const current = (html.match(/<meta name="app-version" content="([^"]+)"/) || [])[1];
const version = process.argv[2] || current;
if (!version) {
  console.error('No version given and none in index.html.');
  process.exit(1);
}
if (!/^\d+\.\d+\.\d+$/.test(version)) {
  console.error(`Version must look like 2.4.1, got ${version}`);
  process.exit(1);
}

// 1. The document.
let out = html;
if (current) out = out.replace(/(<meta name="app-version" content=")[^"]+(")/, `$1${version}$2`);
else out = out.replace('<meta name="color-scheme"', `<meta name="app-version" content="${version}">\n<meta name="color-scheme"`);
SUBRESOURCES.forEach((rel) => {
  const file = rel.split('/').pop();
  out = out.replace(new RegExp(`(${file.replace('.', '\\.')})(\\?v=[^"']*)?(["'])`, 'g'), `$1?v=${version}$3`);
});
writeFileSync(HTML, out);

// 2. Every relative import inside the module graph. Node resolves a query on a
//    file URL, so the same specifier works for the test harness and the browser.
let touched = 0;
let edits = 0;
jsFiles(join(root, 'assets/js')).forEach((file) => {
  const src = readFileSync(file, 'utf8');
  const next = src.replace(
    /(\bfrom\s+|\bimport\s*\(\s*)(['"])(\.[^'"]*?\.js)(\?v=[^'"]*)?\2/g,
    (_m, lead, q, path) => { edits += 1; return `${lead}${q}${path}?v=${version}${q}`; }
  );
  if (next !== src) { writeFileSync(file, next); touched += 1; }
});

// 3. version.json mirrors it, so the footer can say when a page is part cached.
const vpath = join(root, 'data/version.json');
const v = JSON.parse(readFileSync(vpath, 'utf8'));
const wasVersion = v.version;
v.version = version;
writeFileSync(vpath, `${JSON.stringify(v, null, 2)}\n`);

const hasNotes = (v.releases || []).some((r) => r.version === version);
console.log(`version ${current || 'none'} -> ${version}`);
console.log(`  index.html: meta tag and ${SUBRESOURCES.length} subresources`);
console.log(`  module graph: ${edits} imports across ${touched} files`);
console.log(`  version.json: ${wasVersion} -> ${version}`);
if (!hasNotes) {
  console.log(`\nNo release notes for ${version} in data/version.json yet.`);
  console.log('Add a block to `releases`, newest first, in the words a student would use.');
  console.log('The version sweep will fail until you do.');
}
