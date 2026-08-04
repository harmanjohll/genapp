// Entry point. Loads data, mounts the shell, renders the active mode.

import { loadAll } from './data-loader.js';
import { getState, subscribe, setMode, setYear, setLiveRun, reconcile, MODES, YEARS, currentYear } from './state.js';
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

  // Stored state was written by whatever revision ran last. Reconcile it with
  // today's data before anything paints from it: a plan keyed by renamed
  // subjects miscounts, and a saved run from an older engine kills the paint.
  reconcile(data);

  ctx = {
    subjects: data.subjects.subjects,
    destinations: data.pathways.destinations,
    routesById: Object.fromEntries(data.progressions.routes.map((r) => [r.id, r])),
    pathwaysMeta: data.pathways._meta,
    yearId: getState().year,
  };

  mountRibbon(document.body, data.lifelong);
  mountDoors();
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
      <button type="button" class="glossbtn" data-action="glossary"
              aria-label="What the letters mean">${esc(data.copy.chrome.glossaryBtn)}</button>
      <nav class="modebar" aria-label="Modes">
        ${Object.values(MODES).map((m) => `
          <button type="button" data-action="mode" data-mode="${m.id}"
                  aria-current="${!extraMode && st.mode === m.id}">${esc(m.label)}</button>`).join('')}
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
  try {
    if (extraMode === 'teacher') { renderTeacher(app, data, ctx, paint); return; }
    if (extraMode === 'parent') { renderParent(app, data); return; }
    switch (st.mode) {
      case 'journey': renderJourney(app, data, ctx, paint); break;
      case 'aim':     renderAim(app, data, ctx, paint); break;
      default:        renderNow(app, data, ctx); break;
    }
  } catch (e) {
    // A paint that throws must never leave the last screen up with dead
    // buttons. That is what a swallowed exception looks like from a phone:
    // the app simply stops answering, and the person taps harder. Show what
    // happened, offer the one repair that always works, and touch nothing
    // the student typed in: the plan survives, only the stuck screen resets.
    console.error('paint failed', e);
    app.innerHTML = `
      <div class="wrap"><div class="section" style="margin-top:var(--s-6)"><div class="notice">
        <strong>This screen hit a snag.</strong>
        <p style="margin:8px 0 0">Your subjects are safe. Start this screen fresh.</p>
        <div class="btn-row" style="margin-top:var(--s-3)">
          <button class="btn accent" type="button" data-action="recover">Start fresh</button>
        </div>
      </div></div></div>`;
    onAction(app, { recover: () => { setLiveRun(null); resetJourney(); paint(); } });
  }
}


// The three doors, at the top. They were in the footer, but a parent handed
// their child's phone decides in the first screenful whether this page is for
// them, and footer discovery asked them to scroll the whole subject list
// first. The strip is quiet on purpose: the header is not pinned, so it
// scrolls away after one look, and it hides during a Journey run with the
// rest of the chrome. The old worry about students finding a Teacher button
// was about a button styled like a mode; three muted words are not that.
function mountDoors() {
  const f = data.copy.footerDoors;
  if (!f) return;
  const who = extraMode || 'student';
  const roles = [
    { id: 'student', href: './', label: f.roleStudent },
    { id: 'parent', href: './?mode=parent', label: f.roleParent },
    { id: 'teacher', href: './?mode=teacher', label: f.roleTeacher },
  ];
  const div = document.createElement('div');
  div.className = 'audstrip';
  div.innerHTML = `<div class="wrap">
    <label class="iam">
      <span>${esc(f.iAm)}</span>
      <select aria-label="${esc(f.head)}">
        ${roles.map((r) => `<option value="${r.href}"${r.id === who ? ' selected' : ''}>${esc(r.label)}</option>`).join('')}
      </select>
    </label></div>`;
  const sel = div.querySelector('select');
  sel.addEventListener('change', () => { location.href = sel.value; });
  document.body.insertBefore(div, head);
}
