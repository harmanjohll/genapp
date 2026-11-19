// The guide pages: what changed, the lesson guide, and what this is built on.
//
// 7.5 rewrite. This was a hub with four audience tabs (Parents, Teachers,
// Counsellors, Evidence) behind a door that named two of them. Everyone
// landed on Parents, the tab row mixed who with what, and a parent on their
// own phone was sent into an empty student app.
//
// Paths is now one app, for students, that anyone can use the same way. What
// is left here is reading, not a place to be:
//
//   What changed   four dates and the old streams in today's words, for
//                  anyone new to subject levels. A short block for parents
//                  says how to see a child's plan on their own phone.
//   Lesson guide   for a teacher running a class, and it prints.
//   Built on       the evidence, criticism first.
//
// There is no counsellor page. The ECG counsellor is the source of advice;
// Paths helps a student get ready for that conversation, and the 15 minute
// session on Saved is the student's to bring.
//
// The page arrives in the URL (?s=adults&tab=teacher), so a bookmark or a
// printed handout always reproduces it. Old links to the parent and
// counsellor tabs open What changed.

import { getState, YEARS } from '../state.js?v=7.5';
import { esc, onAction } from '../ui/dom.js?v=7.5';
import { decorate } from '../ui/glossary.js?v=7.5';
import { icon } from '../ui/icons.js?v=7.5';

const PAGES = [
  { id: 'changed', label: 'What changed', k: 'New to subject levels?', h1: 'What changed' },
  { id: 'teacher', label: 'Lesson guide for teachers', k: 'For teachers', h1: 'Lesson guide' },
  { id: 'evidence', label: 'What this is built on', k: 'For the curious', h1: 'What this is built on' },
];

function currentTab() {
  const t = new URLSearchParams(location.search).get('tab');
  return PAGES.some((x) => x.id === t) ? t : 'changed';
}

let stream = 'express';
let askYear = null;

export default {
  id: 'adults',
  title: 'What changed',
  era: 'school',

  render(root, api) {
    const tab = currentTab();
    const page = PAGES.find((x) => x.id === tab);
    const body = tab === 'teacher' ? teacherTab(api) : tab === 'evidence' ? evidenceTab(api) : changedPage(api);

    root.innerHTML = `
    <div class="wrap-narrow adultwrap">
      <header class="ph">
        <p class="ph-k">${esc(page.k)}</p>
        <h1>${esc(page.h1)}</h1>
      </header>
      ${body}
      <nav class="guidelinks no-print" aria-label="More reading">
        ${PAGES.filter((x) => x.id !== tab).map((x) => `<button type="button" class="chip press" data-action="go" data-s="adults" data-tab="${x.id}">${esc(x.label)}</button>`).join('')}
        <button type="button" class="chip press" data-action="go" data-s="path">${icon('steps')} Back to the Path</button>
      </nav>
    </div>`;

    bind(root, api);
  },
};

/* ---- what changed ----------------------------------------------------------
   Four dates and one translation carry most of it: the system changed, and
   here is what each old stream is called now. Then three things a parent can
   do from their own phone. The longer reading sits under folds. */

function thenNowHtml(p) {
  const tn = p.thenNow || {};
  const rows = tn.rows || {};
  const row = rows[stream] || Object.values(rows)[0];
  if (!row) return '';
  const cols = tn.cols || {};
  return `
  <section class="section thennow" aria-labelledby="tn-h">
    <h2 id="tn-h">${esc(tn.head || 'Your stream, in today\'s words')}</h2>
    <div class="chipset" role="group" aria-label="${esc(tn.ask || 'Which stream were you in?')}">
      ${Object.entries(rows).map(([id, r]) => `<button type="button" class="mechip press" data-action="ad-stream" data-id="${esc(id)}" aria-pressed="${id === stream}">${esc(r.label)}</button>`).join('')}
    </div>
    <div class="tn-card" aria-live="polite">
      <div><span>${esc(cols.levels || 'Subjects now')}</span><b>${esc(row.levels)}</b></div>
      <div><span>${esc(cols.group || 'Posting Group')}</span><b>${esc(row.group)}</b></div>
      <div><span>${esc(cols.exam || 'The exam')}</span><b>${esc(row.exam)}</b></div>
    </div>
    <p class="small">${decorate(tn.note || '')}</p>
  </section>`;
}

function askHtml(api) {
  const st = getState();
  const y = askYear || (st.yearSet ? st.year : null);
  const asks = y ? ((((api.data.years || {}).years || {})[y] || {}).talk || {}).parent || [] : [];
  const meAsks = (((api.data.compass || {}).prompts || {}).parent) || [];
  return `<div id="ad-asks">
    <div class="yearpick" role="group" aria-label="Which year is your child in?">
      ${YEARS.map((v) => `<button type="button" class="mechip press" data-action="ad-year" data-id="${v.id}" aria-pressed="${v.id === y}">${esc(v.label)}</button>`).join('')}
    </div>
    ${y ? `<div class="bubbles" style="margin-top:12px">${[...asks.slice(0, 2), ...meAsks.slice(0, 1)].map((q) => `<p class="bubble">${esc(q)}</p>`).join('')}</div>`
      : '<p class="small" style="margin:8px 0 0">Pick your child\'s year to see what to ask this week.</p>'}
  </div>`;
}

function changedPage(api) {
  const p = api.data.parent || {};
  return `
  <section class="changes" aria-labelledby="chg-h">
    <h2 id="chg-h" class="sr-only">${esc(p.changesHead || 'What changed')}</h2>
    <ol class="chg">${(p.changes || []).map((c) => `<li>
      <b class="chg-y">${esc(c.year)}</b>
      <span class="chg-t">${esc(c.head)}</span>
      <span class="chg-b">${decorate(c.body)}</span></li>`).join('')}</ol>
  </section>

  ${thenNowHtml(p)}

  <section class="section athome" aria-labelledby="home-h">
    <h2 id="home-h">For parents</h2>
    <ol>
      <li><b>See your child's plan on your phone.</b>Ask them to tap Share on Saved. The link opens as a card you can read. Nothing is changed.</li>
      <li><b>Or try Paths yourself.</b>It works the same way for you. As a guest, nothing is saved.
        <span class="btnrow" style="margin:8px 0 0"><a class="btn small press" href="./?guest=1&amp;s=start">${icon('play')} Try it as a guest</a></span></li>
      <li><b>Ask, then listen.</b>${askHtml(api)}</li>
    </ol>
    <p class="small" style="margin:0">Your school's ECG counsellor is the source for advice. Paths helps your child get ready for that talk.</p>
  </section>

  <details class="fold section">
    <summary>${esc(p.windowsHead || 'The windows, roughly when they open')}</summary>
    <ul class="movelist">
      ${(p.windows || []).map((w) => `
      <li class="move">
        <div style="min-width:0">
          <p style="margin:0 0 2px"><strong>${decorate(w.label)}</strong></p>
          <p class="caps" style="margin:0 0 6px">${esc(w.when)}</p>
          <p style="margin:0 0 4px">${decorate(w.what)}</p>
          <p class="small" style="margin:0">Check it against: ${esc(w.check)}.</p>
        </div>
      </li>`).join('')}
    </ul>
    <p class="small" style="margin-top:var(--s-3)">${esc(p.windowsNote || '')}</p>
  </details>

  <details class="fold section">
    <summary>${esc(p.moreHead || 'More for parents')}</summary>
    ${(p.sections || []).map((s) => `
      <div style="margin-top:var(--s-5)">
        <h3>${esc(s.head)}</h3>
        ${s.body ? `<p>${decorate(s.body)}</p>` : ''}
        ${s.items ? `<ul class="movelist">${s.items.map((it) => `
          <li class="move"><span>${decorate(it)}</span></li>`).join('')}</ul>` : ''}
        ${s.links ? `<p class="btnrow" style="margin-top:var(--s-3)">${s.links.map((l) => `
          <a class="btn ghost small" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join('')}</p>` : ''}
      </div>`).join('')}
  </details>`;
}

/* ---- for teachers -----------------------------------------------------------
   Task order. What a teacher opening this page five minutes before class needs
   comes first: the room's framing, then six blocks, each with what students do,
   what to say and what to watch for. The words are in data/lesson.json. */

function teacherTab(api) {
  const L = api.data.lesson || {};
  const blocks = L.blocks || [];
  const total = blocks.reduce((n, b) => n + (b.min || 0), 0);
  const frame = L.frame || {};
  return `
  <section aria-labelledby="les-h">
    <h2 id="les-h">A ${total} minute lesson</h2>
    <p class="btnrow no-print">
      <button type="button" class="btn small press" data-action="ad-print">${icon('print')} Print this guide</button>
      <a class="btn ghost small" href="./?board=1">Projector view</a>
    </p>
    <p class="small no-print">Projector view shows the chart large, for the classroom screen.</p>
    ${(frame.lines || []).length ? `<div class="teachframe">
      <h3>${esc(frame.head || '')}</h3>
      <ul>${frame.lines.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
    </div>` : ''}
    ${(L.before || []).length ? `<details class="fold" open>
      <summary>Before the lesson</summary>
      <ul class="tick">${L.before.map((x) => `<li>${icon('check')}<span>${esc(x)}</span></li>`).join('')}</ul>
      <div class="card codecard">
        <p style="margin:0"><strong>${esc(api.copy('teacher.playHead', 'Class play: same luck for everyone'))}</strong></p>
        <p class="btnrow" style="margin:8px 0 0">
          <button type="button" class="btn small press no-print" data-action="ad-code">${esc(api.copy('teacher.playBtn', 'New play code'))}</button>
          <span id="ad-code-out" class="figure" aria-live="polite" style="letter-spacing:0.1em"></span>
        </p>
        <p class="small" style="margin:8px 0 0">Students type this code when the game starts. Everyone then meets the same chances, so only their choices differ.</p>
      </div>
    </details>` : ''}
    <ol class="blocks">
      ${blocks.map((b) => `<li class="block">
        <div class="block-h"><span class="rs-ic">${icon(b.icon)}</span><b>${esc(b.tab)}</b><span class="rs-min">${b.min} min</span></div>
        <dl>
          <div><dt>Do</dt><dd>${esc(b.do)}</dd></div>
          <div><dt>Say</dt><dd class="say">${esc(b.say)}</dd></div>
          <div><dt>Watch for</dt><dd>${esc(b.watch)}</dd></div>
        </dl>
      </li>`).join('')}
    </ol>
  </section>

  <section class="section" aria-labelledby="deb-h">
    <h2 id="deb-h">The debrief</h2>
    <ul class="debrief">
      ${(L.debrief || []).map((x) => `
      <li>
        <p style="margin:0"><strong>${esc(x.q)}</strong></p>
        <p class="small" style="margin:2px 0 0">${esc(x.why)}</p>
      </li>`).join('')}
    </ul>
  </section>

  <section class="section" aria-labelledby="aft-h">
    <h2 id="aft-h">After the lesson</h2>
    <ul class="tick">${(L.after || []).map((x) => `<li>${icon('check')}<span>${esc(x)}</span></li>`).join('')}</ul>
    <p class="btnrow no-print"><button type="button" class="btn press" data-action="go" data-s="session">${icon('talk')} Start a 15 minute session</button></p>
  </section>

  <details class="fold section no-print">
    <summary>More</summary>
    <p style="max-width:65ch">Nothing to install and nothing collected. Saved has a link that carries a plan to another device, and a card to share with a parent.</p>
    <p class="small" style="max-width:65ch">For two to six students around one device,
      <a href="../legacy/pathways-v2/?mode=table">the tabletop game is in an earlier version</a>.</p>
  </details>`;
}

/* ---- what this is built on -------------------------------------------------
   Every frame carries its own criticism. A page that cited only supporting
   theory would be a brochure with footnotes. */

function evidenceTab(api) {
  const ev = api.data.evidence || {};
  return `
  <section aria-label="The frames">
    <p class="small" style="max-width:65ch">${(ev.frames || []).length} frames, each with what it claims, where it shows up in the tool, and where it stops.</p>
    <p class="provline"><span>Citations assembled by this build and not yet checked by a human against the originals. Volume numbers appear only where the build is confident.</span></p>
    <div class="infogrid" style="margin-top:var(--s-4)">
      ${(ev.frames || []).map((f) => `
      <div class="card infocard">
        <h3>${esc(f.name)}</h3>
        <p class="small">${esc(f.cite)}</p>
        <p>${decorate(f.claims)}</p>
        <p><strong>In this tool:</strong> ${decorate(f.inApp)}</p>
        <p class="small" style="margin-bottom:0"><strong>Where it stops:</strong> ${decorate(f.limit)}</p>
      </div>`).join('')}
    </div>
  </section>

  <section class="section" aria-label="What critics say">
    <h2>What critics say</h2>
    <p class="small" style="max-width:65ch">Quoted at full strength, with what this tool does about each.</p>
    <div class="infogrid">
      ${(ev.critical || []).map((k) => `
      <div class="card infocard">
        <p class="small">${esc(k.cite)}</p>
        <p><strong>${esc(k.says)}</strong></p>
        <p class="small" style="margin-bottom:0">${decorate(k.answer)}</p>
      </div>`).join('')}
    </div>
  </section>

  <section class="section" aria-label="What it refuses to do">
    <h2>What it refuses to do</h2>
    <div class="infogrid">
      ${(ev.refusals || []).map((r) => `
      <div class="card infocard">
        <h3>${esc(r.head)}</h3>
        <p class="small" style="margin-bottom:0">${decorate(r.body)}</p>
      </div>`).join('')}
    </div>
  </section>`;
}

/* ---- actions --------------------------------------------------------------- */

function bind(root, api) {
  onAction(root, {
    'ad-year': (btn) => {
      askYear = btn.dataset.id;
      const host = root.querySelector('#ad-asks');
      if (host) host.outerHTML = askHtml(api);
      const again = root.querySelector(`[data-action="ad-year"][data-id="${askYear}"]`);
      if (again) again.focus({ preventScroll: true });
    },
    'ad-print': () => window.print(),
    'ad-stream': (btn) => {
      stream = btn.dataset.id;
      const host = root.querySelector('.thennow');
      if (!host) return;
      host.outerHTML = thenNowHtml(api.data.parent || {});
      const again = root.querySelector(`[data-action="ad-stream"][data-id="${stream}"]`);
      if (again) again.focus({ preventScroll: true });
    },
    'ad-code': () => {
      const out = root.querySelector('#ad-code-out');
      if (!out) return;
      const abc = '0123456789ABCDEFGHJKMNPQRSTUVWXYZ';
      out.textContent = Array.from({ length: 5 }, () => abc[Math.floor(Math.random() * abc.length)]).join('');
    },
  });
}
