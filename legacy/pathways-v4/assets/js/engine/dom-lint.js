// Structural checks on what actually rendered.
//
// WHY THIS EXISTS. The fork's requirement lines were built by wrapping glossary
// terms in <button>, inside the fork's own <button>. Nested buttons are invalid,
// so the parser expelled everything from the first glossary term onward: nine
// loose text fragments and nine orphaned buttons floating in the grid, one of
// them displaying a raw quote-and-bracket fragment as literal text, on the most
// important screen in the game.
//
// It shipped because the check written for it counted `.fork-need` ELEMENTS and
// found eight of them. The elements were there. Their text was not. A check that
// asks "does the node exist" cannot see this class of fault, so this one asks
// "did the words survive, and is the markup legal".
//
// Runs in the browser only, at ?dev=1, and from the Playwright pass on every
// screen it visits.

const INTERACTIVE = 'button, a[href], input, select, textarea';

export function domLint(root) {
  const scope = root || document.getElementById('app');
  const failures = [];
  if (!scope) return { ok: true, failures };

  // 1. No interactive element inside another one. The browser silently
  //    restructures the DOM when this happens, and the visible result is text
  //    landing somewhere nobody wrote it.
  scope.querySelectorAll(INTERACTIVE).forEach((el) => {
    const inner = el.querySelectorAll(INTERACTIVE);
    if (inner.length) {
      failures.push({
        why: 'an interactive element nested inside another',
        what: `${el.tagName.toLowerCase()}.${el.className} contains ${inner.length}`,
      });
    }
  });

  // 2. Nothing that exists to carry words may be empty. An empty label is the
  //    fingerprint of content that got expelled or of a missing copy key.
  ['.fork-need', '.poss-label', '.c-label', '.tcard-name', '.dest-name', '.idwords']
    .forEach((sel) => {
      scope.querySelectorAll(sel).forEach((el) => {
        if (!el.textContent.trim()) failures.push({ why: 'an element that carries words is empty', what: sel });
      });
    });

  // 3. No escaped markup showing as text. If a fragment like "> or &lt;span
  //    reaches a student's eye, something was double handled.
  const text = scope.textContent || '';
  [/"&gt;/, /"\s*>/, /&lt;\/?[a-z]/i, /\$\{/, /undefined/].forEach((re) => {
    const m = text.match(re);
    if (m) failures.push({ why: 'markup or a template leaked into visible text', what: m[0] });
  });

  // 4. Loose text directly inside a layout grid, which is how expelled content
  //    announces itself.
  ['.fork-choices', '.j-choices', '.eight-grid', '.treveal'].forEach((sel) => {
    scope.querySelectorAll(sel).forEach((grid) => {
      Array.from(grid.childNodes).forEach((n) => {
        if (n.nodeType === 3 && n.nodeValue.trim()) {
          failures.push({ why: 'loose text inside a layout grid', what: `${sel}: ${n.nodeValue.trim().slice(0, 40)}` });
        }
      });
    });
  });

  // 5. A sheet's primary action may not live in the part of it that scrolls.
  //
  //    WHY. Tapping a want in Play opened a sheet whose two start buttons sat
  //    at the bottom of the body, which is a capped scroll region. On a 658px
  //    Android phone neither was on screen, so the student saw three lines of
  //    explanation and nothing to press, and the way back was the same question
  //    again. The subject picker had it worse: its confirm button was under two
  //    thousand pixels of subject rows. Both are fixed by putting the action in
  //    the pinned foot, and `.btn.accent` is this app's own mark for the thing
  //    to do, so finding one in the body is the fault itself, no layout needed.
  const sheet = document.querySelector('dialog.sheet[open]');
  if (sheet) {
    const body = sheet.querySelector('.sheet-body');
    (body ? body.querySelectorAll('.btn.accent') : []).forEach((el) => {
      failures.push({
        why: 'a sheet keeps its primary action in the part that scrolls',
        what: (el.textContent || '').trim().slice(0, 40),
      });
    });
    if (!sheet.querySelector('.sheet-foot button')) {
      failures.push({ why: 'an open sheet has no pinned control at all', what: 'sheet-foot' });
    }
  }

  const ok = failures.length === 0;
  console.log(
    `%cDOM: ${ok ? 'PASS' : 'FAIL'} (markup legal, nothing empty, nothing leaked)`,
    ok ? 'color:#2F7D5B;font-weight:700' : 'color:#B23A2A;font-weight:700'
  );
  if (!ok) console.table(failures.slice(0, 20));
  return { ok, failures };
}
