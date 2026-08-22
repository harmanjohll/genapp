// The adults' hub: one screen, four tabs.
//
// v2 grew four loose adult pages that cross-linked into a web, a 436-line
// teacher wall with no task order, and a counsellor page promising features
// that did not exist. v3 collapses them here. Each tab is ordered by the task
// the adult actually walked in with: the parent gets the guest game first
// (v2 buried its best feature), the teacher gets a lesson to run now, the
// counsellor gets the one student in front of them, and the evidence tab
// keeps the citations honest, criticism first.
//
// The tab arrives in the URL (?s=adults&tab=teacher), so a bookmark or a
// printed handout always reproduces the exact page.

import { esc, onAction } from '../ui/dom.js?v=3.0.0';
import { decorate } from '../ui/glossary.js?v=3.0.0';

const TABS = [
  { id: 'parent', label: 'For parents' },
  { id: 'teacher', label: 'Run a lesson' },
  { id: 'counsellor', label: 'One student' },
  { id: 'evidence', label: 'What this is built on' },
];

function currentTab() {
  const t = new URLSearchParams(location.search).get('tab');
  return TABS.some((x) => x.id === t) ? t : 'parent';
}

export default {
  id: 'adults',
  title: 'For the adults',
  era: 'school',

  render(root, api) {
    const tab = currentTab();
    const body = tab === 'parent' ? parentTab(api)
      : tab === 'teacher' ? teacherTab(api)
      : tab === 'counsellor' ? counsellorTab(api)
      : evidenceTab(api);

    root.innerHTML = `
    <div class="wrap-narrow">
      <header class="hero" style="padding-bottom:12px">
        <h1>For the adults</h1>
        <p class="lede">The student's tool, from your side of the table. Pick who you are.</p>
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
   The guest game leads. It is the one thing on this screen a parent cannot
   get from a brochure: their own 1990s stream, lived again under today's
   levels, without touching a byte the child saved. */

function parentTab(api) {
  const p = api.data.parent || {};
  const g = p.guest || {};
  return `
  <section aria-label="${esc(g.head || 'Play your own school years')}">
    <div class="card" style="border-left:4px solid var(--accent)">
      <h2 style="margin-bottom:8px">${esc(g.head || 'Play your own school years')}</h2>
      <p>${decorate(g.body || 'The game your child plays, but as you at fourteen: your old stream, Express, Normal Academic or Normal Technical, translated into today’s levels.')}</p>
      <p class="btnrow" style="margin-bottom:0">
        <a class="btn press" href="./?guest=1&amp;s=play">${esc(g.cta || 'Play it from Sec 3')}</a>
      </p>
      <p class="small" style="margin:12px 0 0">${esc(g.note || 'Opens as a guest. Nothing your child saved on this phone is read or touched.')}</p>
    </div>
  </section>

  <section class="section" aria-label="The shape of the system">
    <p style="font-size:var(--t-h3);color:var(--ink-soft);max-width:52ch">${decorate(p.lede || '')}</p>
    ${(p.sections || []).map((s) => `
      <div style="margin-top:var(--s-6)">
        <h3>${esc(s.head)}</h3>
        ${s.body ? `<p>${decorate(s.body)}</p>` : ''}
        ${s.items ? `<ul class="movelist">${s.items.map((it) => `
          <li class="move"><span>${decorate(it)}</span></li>`).join('')}</ul>` : ''}
        ${s.links ? `<p class="btnrow" style="margin-top:var(--s-3)">${s.links.map((l) => `
          <a class="btn ghost small" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join('')}</p>` : ''}
      </div>`).join('')}
  </section>

  <section class="section" aria-label="${esc(p.windowsHead || 'The windows')}">
    <h3>${esc(p.windowsHead || 'The windows, roughly when they open')}</h3>
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
  </section>`;
}

/* ---- run a lesson ----------------------------------------------------------
   Task order, not topic order. The 45 minute shape is what a teacher opening
   this page five minutes before class actually needs, so it goes first. */

function teacherTab(api) {
  const prompts = [
    { q: 'What did you assume was closed to you that turned out not to be?',
      why: 'Surfaces beliefs picked up from siblings and from adults schooled under a different system.' },
    { q: 'You played twice from the same start. What did your starting point actually decide?',
      why: 'The load bearing question of the whole lesson. Worth ten minutes, not two.' },
    { q: 'Whose combination looks nothing like yours, and what does it open that yours does not?',
      why: 'There is no best combination, and the evidence is the person sitting next to them.' },
    { q: 'What went wrong in your story, and what happened after it?',
      why: 'Normalises setback as an event with a next step rather than an ending.' },
  ];

  return `
  <section aria-label="Run a lesson now">
    <h2>Run a lesson now</h2>
    <p class="small" style="max-width:60ch">The tool teaches nothing on its own. The learning is in what students say afterwards, so budget more time for talk than for screen.</p>
    <ol class="steps">
      <li>
        <div style="min-width:0">
          <p style="margin:0 0 8px"><strong>The 45 minute shape.</strong> One device per student, one run of the loop, and the talk around it.</p>
          <ul style="list-style:none;margin:0;padding:0;display:grid;gap:6px">
            ${[
              ['5 min', 'Ask what decides their future. Write the answers up. Correct none of them.'],
              ['8 min', 'Plan. The combination they are actually considering, levels tapped in.'],
              ['4 min', 'Read the lever line together. The one move that opens most. Who shares one?'],
              ['10 min', 'Play, once through, the short run.'],
              ['8 min', 'Play again from the same start, choosing differently. Compare the two maps.'],
              ['5 min', 'Act. Three actions, and one question carried out of the room to a named adult.'],
              ['5 min', 'Back to the opening answers. What would they change?'],
            ].map(([m, t]) => `
            <li style="display:flex;gap:10px;align-items:baseline">
              <span class="pill" data-tone="quiet" style="flex:none">${esc(m)}</span>
              <span class="small" style="color:var(--ink-soft)">${decorate(t)}</span>
            </li>`).join('')}
          </ul>
          <p class="small" style="margin:10px 0 0">Running early: Act is a second activity, not a replay.</p>
        </div>
      </li>
      <li>
        <div style="min-width:0">
          <p style="margin:0 0 6px"><strong>Put the board view on the projector.</strong></p>
          <p class="small" style="margin:0 0 10px">It forces dark colours and huge type, sized for the back row, and hides the student chrome.</p>
          <a class="btn ghost small" href="./?board=1">Open the board view</a>
        </div>
      </li>
      <li>
        <div style="min-width:0">
          <p style="margin:0 0 8px"><strong>The debrief.</strong> Four questions that carry the lesson.</p>
          <ul style="list-style:none;margin:0;padding:0;display:grid;gap:10px">
            ${prompts.map((x) => `
            <li>
              <p style="margin:0"><strong>${esc(x.q)}</strong></p>
              <p class="small" style="margin:2px 0 0">${esc(x.why)}</p>
            </li>`).join('')}
          </ul>
        </div>
      </li>
    </ol>
  </section>

  <section class="section" aria-label="Set up for my school">
    <h2>Set up for my school</h2>
    <p style="max-width:65ch">Nothing to install and nothing collected. Students each plan on their own device, the plan stays on that device, and the carry link at the bottom of Plan takes a combination home to a parent. The link holds the subjects and nothing else.</p>
    <div class="card">
      <h3 style="margin-bottom:4px">${esc(api.copy('teacher.playHead', 'Class play: same luck for everyone'))}</h3>
      <p class="small">${esc(api.copy('teacher.playIntro', 'Generate a play code and read it out. Every student who enters it gets the same chances in the same order, so the debrief compares answers instead of luck.'))}
        Students type it in where Play asks “${esc(api.copy('journey.classSeedLabel', 'Playing with my class?'))}”.</p>
      <p class="btnrow" style="margin-bottom:0">
        <button type="button" class="btn small press" data-action="ad-code">${esc(api.copy('teacher.playBtn', 'New play code'))}</button>
        <span id="ad-code-out" class="figure" aria-live="polite" style="letter-spacing:0.1em"></span>
      </p>
      <p class="small" style="margin:10px 0 0">${esc(api.copy('teacher.playNote', 'The code seeds the game’s randomness and carries nothing else.'))}</p>
    </div>
  </section>

  <section class="section" aria-label="Understand the tool">
    <h2>Understand the tool</h2>
    <p style="max-width:65ch">Ten named frames, three critics quoted at full strength, and five things the tool refuses to do. The citations are complete enough to disagree with.</p>
    <p class="btnrow">
      <button type="button" class="btn ghost press" data-action="ad-evidence">What this is built on</button>
    </p>
    <p class="small" style="max-width:65ch;margin-top:var(--s-4)">For group play, two to six students arguing over one device,
      <a href="../pathways2/?mode=table">the tabletop variant lives in v2</a>.
      It was not rebuilt for this version; the game there is complete and still works, so v3 simply points at it.</p>
  </section>`;
}

/* ---- one student -----------------------------------------------------------
   The counsellor knows the system better than this app does. What they do not
   know is what their student has just been shown, so the facts table below
   renders from the same file the student screens read. The two cannot
   disagree, which is the point. */

function counsellorTab(api) {
  const c = api.ctx();
  const meta = c.pathwaysMeta || {};
  return `
  <section aria-label="Fifteen minutes, one student">
    <h2>Fifteen minutes, one student</h2>
    <p class="small" style="max-width:60ch">The tool has already said something to your student before they sat down. This is the shortest honest way through it together.</p>
    <ol class="steps">
      <li>
        <div style="min-width:0">
          <p style="margin:0 0 4px"><strong>Start from what they hold.</strong> <span class="pill" data-tone="quiet">4 min</span></p>
          <p class="small" style="margin:0">Open Plan on their phone: the combination they actually have, not the one they wish they had. Ask what they expected to be closed. Nothing in the tool is, and hearing them name the padlock they expected is the session's real material.</p>
        </div>
      </li>
      <li>
        <div style="min-width:0">
          <p style="margin:0 0 4px"><strong>Use Plan's map together.</strong> <span class="pill" data-tone="quiet">7 min</span></p>
          <p class="small" style="margin:0">The map under the subjects answers every tap. Read the lever line with them, the one subject move that opens most, then open the station they care about: what it wants, what it costs, the ways in, and the exact rule with its source behind one fold.</p>
        </div>
      </li>
      <li>
        <div style="min-width:0">
          <p style="margin:0 0 4px"><strong>One commitment, written in Act.</strong> <span class="pill" data-tone="quiet">4 min</span></p>
          <p class="small" style="margin:0">Not three, one. Written in Act as words to say to a named adult, and copied to their phone from the ask card. Raise it again next session; a commitment nobody returns to is decoration.</p>
        </div>
      </li>
    </ol>
  </section>

  <section class="section" aria-label="The facts the tool serves">
    <h2>The facts the tool serves</h2>
    <p class="small" style="max-width:65ch">Rendered from the same data file the student screens read, so this list and their screen can never disagree. Structural rules only: the tool never weighs a performance bar against a student, because it does not know their grades and never guesses.</p>
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
  </section>

  <section class="section" aria-label="What this tool refuses to do">
    <div class="notegood">
      <p style="margin:0 0 6px"><strong>What this tool refuses to do.</strong></p>
      <p style="margin:0">It does not predict grades, it does not rank routes, and it makes no forecast about any student. It shows published rules and keeps everything on the device. The question it cannot answer is the reason the student is in your room.</p>
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
    <h2>What this is built on</h2>
    <p class="small" style="max-width:65ch">Ten frames, each with what it claims, where it shows up in the tool, and where it stops. The professionals this page is for will read the limits first, so they are on every card.</p>
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
    'ad-code': () => {
      const out = root.querySelector('#ad-code-out');
      if (!out) return;
      const abc = '0123456789ABCDEFGHJKMNPQRSTUVWXYZ';
      out.textContent = Array.from({ length: 5 }, () => abc[Math.floor(Math.random() * abc.length)]).join('');
    },
  });
}
