// The adults' hub: one screen, four tabs, each ordered by the task the adult
// walked in with.
//
// 7.0 rewrite. In 6.0 this page still described v3: a lesson built on Plan,
// the lever line and Act, none of which a teacher could find, and a three
// step counsellor guide beside a five step session that disagreed with it.
// It was also two taps down inside Explore.
//
// Now: picking Parent or Teacher in "I am" lands here, on that tab. Parents
// get what changed as one line of four dates, and their own stream in
// today's words; the reading folds away under it. Teachers get a lesson
// that names the five tabs as they are. Counsellors get the one session.
// The evidence tab keeps the citations, criticism first.
//
// The tab arrives in the URL (?s=adults&tab=teacher), so a bookmark or a
// printed handout always reproduces the exact page.

import { getState } from '../state.js?v=7.0.0';
import { esc, onAction } from '../ui/dom.js?v=7.0.0';
import { decorate } from '../ui/glossary.js?v=7.0.0';
import { icon } from '../ui/icons.js?v=7.0.0';
import { STEPS } from './session.js?v=7.0.0';

const TABS = [
  { id: 'parent', label: 'Parents' },
  { id: 'teacher', label: 'Teachers' },
  { id: 'counsellor', label: 'Counsellors' },
  { id: 'evidence', label: 'Evidence' },
];

function currentTab() {
  const t = new URLSearchParams(location.search).get('tab');
  if (TABS.some((x) => x.id === t)) return t;
  return getState().role === 'teacher' ? 'teacher' : 'parent';
}

let stream = 'express';

export default {
  id: 'adults',
  title: 'For parents and teachers',
  era: 'school',

  render(root, api) {
    const tab = currentTab();
    const body = tab === 'parent' ? parentTab(api)
      : tab === 'teacher' ? teacherTab(api)
      : tab === 'counsellor' ? counsellorTab(api)
      : evidenceTab(api);

    root.innerHTML = `
    <div class="wrap-narrow adultwrap">
      <header class="ph">
        <p class="ph-k">For the adults</p>
        <h1>${esc({ parent: 'For parents', teacher: 'For teachers', counsellor: 'For ECG counsellors', evidence: 'What this is built on' }[tab])}</h1>
      </header>

      <div class="tabstrip" role="tablist" aria-label="Who is reading">
        ${TABS.map((t) => `
          <button type="button" role="tab" id="ad-tab-${t.id}" class="press"
            aria-selected="${t.id === tab}" aria-controls="ad-panel"
            data-action="ad-tab" data-tab="${t.id}">${esc(t.label)}</button>`).join('')}
      </div>

      <div id="ad-panel" role="tabpanel" aria-labelledby="ad-tab-${esc(tab)}">
        ${body}
      </div>
    </div>`;

    bind(root, api);
  },
};

/* ---- for parents ----------------------------------------------------------
   Four dates and one translation carry most of what a parent needs: the
   system changed, and here is what your own stream is called now. The game
   as a guest comes next, and the reading sits under folds. */

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
      <div><span>${esc(cols.levels || 'Subjects now')}</span><b>${decorate(row.levels)}</b></div>
      <div><span>${esc(cols.group || 'Posting Group')}</span><b>${esc(row.group)}</b></div>
      <div><span>${esc(cols.exam || 'The exam')}</span><b>${decorate(row.exam)}</b></div>
    </div>
    <p class="small">${decorate(tn.note || '')}</p>
  </section>`;
}

function parentTab(api) {
  const p = api.data.parent || {};
  const g = p.guest || {};
  const st = getState();
  const y = st.yearSet ? st.year : 'sec2';
  const asks = ((((api.data.years || {}).years || {})[y] || {}).talk || {}).parent || [];
  return `
  <section class="changes" aria-labelledby="chg-h">
    <h2 id="chg-h">${esc(p.changesHead || 'What changed')}</h2>
    <ol class="chg">${(p.changes || []).map((c) => `<li>
      <b class="chg-y">${esc(c.year)}</b>
      <span class="chg-t">${decorate(c.head)}</span>
      <span class="chg-b">${decorate(c.body)}</span></li>`).join('')}</ol>
  </section>

  ${thenNowHtml(p)}

  ${asks.length ? `<section class="section" aria-labelledby="ask-h">
    <h2 id="ask-h">${esc(p.askHead || 'Three things to ask this week')}</h2>
    <div class="bubbles">${asks.slice(0, 3).map((q) => `<p class="bubble">${esc(q)}</p>`).join('')}</div>
    <p class="btnrow"><button type="button" class="btn press" data-action="go" data-s="path">${icon('steps')} Open the path</button>
      <button type="button" class="btn ghost press" data-action="go" data-s="me">${icon('compass')} Their compass</button></p>
  </section>` : ''}

  <section class="section" aria-label="${esc(g.head || 'Play your own school years')}">
    <div class="card" style="border-left:4px solid var(--accent)">
      <h2 style="margin-bottom:8px">${esc(g.head || 'Play your own school years')}</h2>
      <p>${decorate(g.body || '')}</p>
      <p class="btnrow" style="margin-bottom:0">
        <a class="btn press" href="./?guest=1&amp;s=play">${icon('play')} ${esc(g.cta || 'Play it from Sec 3')}</a>
      </p>
      <p class="small" style="margin:12px 0 0">${esc(g.note || '')}</p>
    </div>
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
   Task order. The 45 minute shape is what a teacher opening this page five
   minutes before class needs, and each row names a tab the class can see. */

const LESSON = [
  { min: 5, ic: 'compass', tab: 'Me', line: 'Two taps: what they enjoy. One strength, with what shows it.' },
  { min: 8, ic: 'steps', tab: 'Path', line: 'Their real levels for this year. Read the best move together.' },
  { min: 5, ic: 'target', tab: 'Goal', line: 'One goal and why. It can change next week.' },
  { min: 12, ic: 'play', tab: 'Play', line: 'The short story, once through. Same play code for the class.' },
  { min: 10, ic: 'talk', tab: 'Talk', line: 'In pairs, then the room. Use the four questions below.' },
  { min: 5, ic: 'flag', tab: 'Saved', line: 'One step, one date, one adult to tell.' },
];

function teacherTab(api) {
  const prompts = [
    { q: 'What did you assume was closed to you that turned out not to be?',
      why: 'Surfaces beliefs picked up from siblings and from adults schooled under a different system.' },
    { q: 'What did your starting levels decide, and what did they leave open?',
      why: 'The question the lesson turns on. Give it ten minutes.' },
    { q: 'Whose combination looks nothing like yours, and what does it open that yours does not?',
      why: 'There is no best combination. The evidence is the person sitting next to them.' },
    { q: 'What went wrong in your story, and what happened after it?',
      why: 'Treats a setback as an event with a next step.' },
  ];

  return `
  <section aria-labelledby="les-h">
    <h2 id="les-h">A 45 minute lesson</h2>
    <p class="small" style="max-width:60ch">One device each. Budget more time for talk than for screen.</p>
    <ol class="runsheet">
      ${LESSON.map((r) => `<li>
        <span class="rs-min">${r.min} min</span>
        <span class="rs-ic">${icon(r.ic)}</span>
        <span class="rs-t"><b>${esc(r.tab)}</b>${esc(r.line)}</span></li>`).join('')}
    </ol>
    <div class="card" style="margin-top:var(--s-4)">
      <h3 style="margin-bottom:4px">${esc(api.copy('teacher.playHead', 'Class play: same luck for everyone'))}</h3>
      <p class="small">${esc(api.copy('teacher.playIntro', 'Generate a play code and read it out. Every student who enters it gets the same chances in the same order, so the debrief compares answers instead of luck.'))}</p>
      <p class="btnrow" style="margin-bottom:0">
        <button type="button" class="btn small press" data-action="ad-code">${esc(api.copy('teacher.playBtn', 'New play code'))}</button>
        <span id="ad-code-out" class="figure" aria-live="polite" style="letter-spacing:0.1em"></span>
        <a class="btn ghost small" href="./?board=1">Projector view</a>
      </p>
    </div>
  </section>

  <section class="section" aria-labelledby="deb-h">
    <h2 id="deb-h">The debrief</h2>
    <ul class="debrief">
      ${prompts.map((x) => `
      <li>
        <p style="margin:0"><strong>${esc(x.q)}</strong></p>
        <p class="small" style="margin:2px 0 0">${esc(x.why)}</p>
      </li>`).join('')}
    </ul>
  </section>

  <section class="section" aria-labelledby="one-h">
    <h2 id="one-h">One student, 15 minutes</h2>
    <p class="small">The same five steps an ECG counsellor uses. Open it on the student's device.</p>
    <p class="btnrow"><button type="button" class="btn press" data-action="go" data-s="session">${icon('talk')} Start a session</button></p>
  </section>

  <details class="fold section">
    <summary>Set up for my school</summary>
    <p style="max-width:65ch">Nothing to install and nothing collected. Each student plans on their own device and the plan stays there. Saved has a link that carries a plan to another device, and a card to share with a parent.</p>
    <p class="small" style="max-width:65ch">For two to six students around one device,
      <a href="../legacy/pathways-v2/?mode=table">the tabletop game is in an earlier version</a>.</p>
    <p class="btnrow"><button type="button" class="btn ghost small press" data-action="ad-evidence">What this is built on</button></p>
  </details>`;
}

/* ---- for counsellors --------------------------------------------------------
   The counsellor knows the system better than this app does. What they do not
   know is what their student has just been shown, so the facts table below
   renders from the same file the student screens read. The two cannot
   disagree, which is the point. */

function counsellorTab(api) {
  const c = api.ctx();
  const meta = c.pathwaysMeta || {};
  return `
  <section aria-labelledby="ss-h">
    <h2 id="ss-h">Fifteen minutes, one student</h2>
    <ol class="runsheet">
      ${STEPS.map((s) => `<li>
        <span class="rs-min">${s.min} min</span>
        <span class="rs-t"><b>${esc(s.t)}</b>${esc(s.ask)}</span></li>`).join('')}
    </ol>
    <p class="btnrow">
      <button type="button" class="btn big press" data-action="go" data-s="session">${icon('talk')} Start a session</button>
    </p>
    <p class="small">It reads the plan on this device. A plan a student shared by link opens the same session, and saves nothing.</p>
  </section>

  <details class="fold section">
    <summary>The facts the tool serves</summary>
    <p class="small" style="max-width:65ch">From the same file the student screens read. Subject level rules only: the tool never weighs a grade against a student unless they enter a target.</p>
    <ul class="movelist">
      ${(c.destinations || []).map((d) => `
      <li class="move">
        <div style="min-width:0">
          <p style="margin:0 0 2px"><strong>${esc(d.name)}</strong></p>
          <p class="small" style="margin:0">${decorate((d.structural || []).map((r) => r.label).join(' · '))}</p>
        </div>
      </li>`).join('')}
    </ul>
    <p class="provline" style="margin-top:var(--s-3)">
      <span>Source: ${esc(meta.source || 'MOE post secondary admissions pages')}${meta.accessed ? ` · checked ${esc(meta.accessed)}` : ''}</span>
    </p>
  </details>

  <section class="section" aria-label="What this tool refuses to do">
    <div class="notegood">
      <p style="margin:0 0 6px"><strong>What this tool refuses to do.</strong></p>
      <p style="margin:0">It does not predict grades, rank routes or give a student a type. The compass holds only what the student tapped or wrote.</p>
    </div>
  </section>`;
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
    'ad-tab': (btn) => {
      if (btn.getAttribute('aria-selected') === 'true') return;
      api.nav('adults', { tab: btn.dataset.tab });
    },
    'ad-evidence': () => api.nav('adults', { tab: 'evidence' }),
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
