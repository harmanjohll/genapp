// Entry point. Loads data, mounts the shell, renders the active mode.

import { loadAll } from './data-loader.js';
import { getState, subscribe, setMode, MODES } from './state.js';
import { initGlossary, openFullList } from './components/glossary.js';
import { mountRibbon, updateRibbon } from './components/timeline-ribbon.js';
import { onAction, esc } from './components/dom.js';
import { runInvariantSweep } from './engine/reach.js';
import { renderNow } from './modes/mode-now.js';
import { renderJourney, resetJourney } from './modes/mode-journey.js';
import { renderAim } from './modes/mode-aim.js';
import { renderTeacher } from './modes/mode-teacher.js';

const app = document.getElementById('app');
const head = document.getElementById('site-head');

let data = null;
let ctx = null;
let teacherMode = new URLSearchParams(location.search).get('mode') === 'teacher';

init();

async function init() {
  try {
    data = await loadAll();
  } catch (e) {
    console.error(e);
    app.innerHTML = `
      <div class="wrap"><div class="section"><div class="notice">
        <strong>The data files could not be loaded.</strong>
        <p style="margin:8px 0 0">This app reads its data over HTTP, so it needs a server rather than a file opened directly. From the repository root run <code>python3 -m http.server 8000</code> and open <code>http://localhost:8000/pathways/</code>.</p>
      </div></div></div>`;
    return;
  }

  initGlossary(data.glossary);

  const routesById = Object.fromEntries(data.progressions.routes.map((r) => [r.id, r]));
  ctx = {
    subjects: data.subjects.subjects,
    destinations: data.pathways.destinations,
    routesById,
    pathwaysMeta: data.pathways._meta,
    yearId: getState().year,
  };

  mountRibbon(document.body, data.lifelong);
  renderHead();
  paint();

  subscribe(() => {
    ctx.yearId = getState().year;
    updateRibbon();
    renderHead();
    paint();
  });

  if (new URLSearchParams(location.search).get('dev') === '1') {
    runInvariantSweep(ctx);
  }
}

function renderHead() {
  const st = getState();
  head.innerHTML = `
    <div class="wrap">
      <div class="brand">The Long Game<span>Pathways for Singapore secondary students</span></div>
      <nav class="modebar" aria-label="Modes">
        ${Object.values(MODES).map((m) => `
          <button type="button" data-action="mode" data-mode="${m.id}"
                  aria-current="${!teacherMode && st.mode === m.id}"
                  title="${esc(m.tagline)}">${esc(m.label)}</button>`).join('')}
        <button type="button" data-action="glossary" title="What all the letters mean">Aa</button>
        <button type="button" data-action="teacher" aria-current="${teacherMode}" title="Facilitation notes for teachers">Teacher</button>
      </nav>
    </div>`;

  onAction(head, {
    mode: (btn) => {
      teacherMode = false;
      document.body.dataset.teacher = 'false';
      if (btn.dataset.mode !== 'journey') resetJourney();
      setMode(btn.dataset.mode);
      paint();
      renderHead();
    },
    glossary: () => openFullList(),
    teacher: () => {
      teacherMode = !teacherMode;
      document.body.dataset.teacher = String(teacherMode);
      renderHead();
      paint();
    },
  });
}

function paint() {
  const st = getState();
  window.scrollTo({ top: window.scrollY > 400 ? 0 : window.scrollY });

  if (teacherMode) { renderTeacher(app, data, ctx, paint); return; }

  switch (st.mode) {
    case 'journey': renderJourney(app, data, ctx, paint); break;
    case 'aim':     renderAim(app, data, ctx, paint); break;
    default:        renderNow(app, data, ctx); break;
  }
}
