// Entry point. Loads data, mounts the shell, renders the active mode.

import { loadAll } from './data-loader.js';
import { getState, subscribe, setMode, setYear, MODES, YEARS, currentYear } from './state.js';
import { initGlossary, openFullList } from './components/glossary.js';
import { mountRibbon, updateRibbon } from './components/timeline-ribbon.js';
import { onAction, esc } from './components/dom.js';
import { runInvariantSweep } from './engine/reach.js';
import { projectionSweep } from './engine/project.js';
import { runCopyBudget } from './engine/copy-budget.js';
import { runJourneySweep } from './engine/journey.js';
import { renderNow } from './modes/mode-now.js';
import { renderJourney, resetJourney } from './modes/mode-journey.js';
import { renderAim } from './modes/mode-aim.js';
import { renderTeacher } from './modes/mode-teacher.js';
import { renderParent } from './modes/mode-parent.js';

const app = document.getElementById('app');
const head = document.getElementById('site-head');

let data = null;
let ctx = null;
const params = new URLSearchParams(location.search);

// The teacher layer is reachable by URL only. It was in the student header, and
// thirty five students find a button labelled Teacher in about ninety seconds.
let extraMode = ['teacher', 'parent'].includes(params.get('mode')) ? params.get('mode') : null;
if (params.get('board') === '1') document.body.dataset.board = 'true';

init();

async function init() {
  try {
    data = await loadAll();
  } catch (e) {
    console.error(e);
    app.innerHTML = `
      <div class="wrap"><div class="section"><div class="notice">
        <strong>This did not load.</strong>
        <p style="margin:8px 0 0">Check the connection and refresh the page. Nothing you did caused this.</p>
      </div></div></div>`;
    return;
  }

  initGlossary(data.glossary);

  ctx = {
    subjects: data.subjects.subjects,
    destinations: data.pathways.destinations,
    routesById: Object.fromEntries(data.progressions.routes.map((r) => [r.id, r])),
    pathwaysMeta: data.pathways._meta,
    yearId: getState().year,
  };

  mountRibbon(document.body, data.lifelong);
  mountFooterDoors();
  renderHead();
  paint();

  subscribe((_st, evt) => {
    ctx.yearId = getState().year;
    // The plan path updates itself in place, so a repaint here would undo it.
    if (evt && evt.kind === 'plan') return;
    updateRibbon();
    renderHead();
    paint();
  });

  if (params.get('dev') === '1') {
    runInvariantSweep(ctx);
    projectionSweep(ctx);
    runJourneySweep(data);
    runCopyBudget(data);
  }
}

function renderHead() {
  const st = getState();
  const y = currentYear();
  head.innerHTML = `
    <div class="wrap">
      <div class="brand">${esc(data.copy.chrome.brand)}</div>
      <label class="yearsel">
        <span class="sr-only">Which year are you in</span>
        <select data-action-change="year">
          ${YEARS.map((v) => `<option value="${v.id}"${v.id === y.id ? ' selected' : ''}>${esc(v.label)}</option>`).join('')}
        </select>
      </label>
      <nav class="modebar" aria-label="Modes">
        ${Object.values(MODES).map((m) => `
          <button type="button" data-action="mode" data-mode="${m.id}"
                  aria-current="${!extraMode && st.mode === m.id}">${esc(m.label)}</button>`).join('')}
        <button type="button" data-action="glossary"
                aria-label="What the letters mean">${esc(data.copy.chrome.glossaryBtn)}</button>
      </nav>
    </div>`;

  onAction(head, {
    mode: (btn) => {
      extraMode = null;
      if (btn.dataset.mode !== 'journey') resetJourney();
      setMode(btn.dataset.mode);
    },
    glossary: () => openFullList(),
  });

  const sel = head.querySelector('select');
  if (sel) sel.addEventListener('change', (e) => setYear(e.target.value));
}

// measureHead() used to live here, writing the header's height to --head-h so
// every other pinned element could offset from it. The header is no longer
// pinned, so nothing offsets from it, and the measurement, its
// requestAnimationFrame and its resize listener all went with it.

function paint() {
  const st = getState();
  if (extraMode === 'teacher') { renderTeacher(app, data, ctx, paint); return; }
  if (extraMode === 'parent') { renderParent(app, data); return; }
  switch (st.mode) {
    case 'journey': renderJourney(app, data, ctx, paint); break;
    case 'aim':     renderAim(app, data, ctx, paint); break;
    default:        renderNow(app, data, ctx); break;
  }
}


// The three doors, quietly, in the footer. Parents arrive on their child's
// phone, so the parent page cannot be URL only the way the teacher page is.
function mountFooterDoors() {
  const foot = document.querySelector('.site-foot .wrap');
  if (!foot || !data.copy.footerDoors) return;
  const f = data.copy.footerDoors;
  const div = document.createElement('div');
  div.className = 'footdoors';
  div.innerHTML = `<p class="caps">${esc(f.head)}</p>
    <p class="small"><a href="./">${esc(f.students)}</a>
    <a href="./?mode=parent">${esc(f.parents)}</a>
    <a href="./?mode=teacher">${esc(f.teachers)}</a></p>`;
  foot.appendChild(div);
}
