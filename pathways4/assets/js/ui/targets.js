// The Targets tab (Sec 3 to Sec 5): where I am, where I am aiming, and what
// each destination reads from it.
//
// Two columns of grades per subject, "now" and "target", then one card per
// score. Each card answers in the order a student asks: what is my number,
// what does each place ask, and if I am short, which grades, by name, would
// close it. A parent or teacher sees the same numbers with their own voice
// on the questions.

import { getState, setGrade } from '../state.js?v=4.0.0';
import { report, gradesFor, polyByType } from '../engine/grades.js?v=4.0.0';
import { esc } from './dom.js?v=4.0.0';
import { icon } from './icons.js?v=4.0.0';
import { listNames, sayName } from '../engine/advice.js?v=4.0.0';

function names(api) {
  return Object.fromEntries(api.ctx().subjects.map((s) => [s.id, sayName(s)]));
}
function destNames(api) {
  return Object.fromEntries(api.ctx().destinations.map((d) => [d.id, d.railName || d.name]));
}

export function targetsHtml(api, y) {
  const st = getState();
  const plan = st.plans[y] || {};
  const g = api.data.grades || {};
  const subj = api.ctx().subjects.filter((s) => plan[s.id]);
  if (!subj.length) {
    return `<div class="empty"><p class="lede">Set your ${esc(y.replace('sec', 'Sec '))} subjects first, then set a target for each.</p>
      <button type="button" class="btn press" data-action="yr-tab" data-tab="levels">Set subjects</button></div>`;
  }
  return `
    <p class="small">Enter the grade you would expect today, and the one you are aiming for. This is goal setting: the numbers are yours, nothing here predicts them, and nothing leaves this device.</p>
    <div class="gradetable" role="table" aria-label="Grades">
      <div class="gt-row gt-head" role="row"><span role="columnheader">Subject</span><span role="columnheader">Now</span><span role="columnheader">Target</span></div>
      ${subj.map((s) => {
        const lv = plan[s.id];
        const opts = gradesFor(lv, g);
        const sel = (which) => {
          const cur = (st.grades[which] || {})[s.id];
          return `<select class="gsel" data-which="${which}" data-sid="${esc(s.id)}" aria-label="${esc(s.name)} ${which === 'now' ? 'grade now' : 'target grade'}">
            <option value="">·</option>
            ${opts.map((o) => `<option value="${esc(o)}"${cur === o ? ' selected' : ''}>${esc(o)}</option>`).join('')}
          </select>`;
        };
        return `<div class="gt-row" role="row"><span class="gt-name" role="cell">${esc(s.shortName || s.name)} <b class="lvtag" data-level="${lv}">${lv}</b></span><span role="cell">${sel('now')}</span><span role="cell">${sel('target')}</span></div>`;
      }).join('')}
    </div>
    <div id="tg-out">${outHtml(api, y)}</div>`;
}

function outHtml(api, y) {
  const st = getState();
  const plan = st.plans[y] || {};
  const g = api.data.grades || {};
  const rep = report({ plan, grades: st.grades, g, names: names(api), destNames: destNames(api) });
  const anyGrade = Object.keys(st.grades.now).length || Object.keys(st.grades.target).length;
  if (!anyGrade) return '<p class="callout small">Pick a grade for each subject and the scores appear here.</p>';

  const cards = rep.map((a) => {
    const nv = a.now.value; const tv = a.target.value;
    const head = `
      <div class="scorehead">
        <span class="scorename">${esc(a.name)}</span>
        <span class="scorevals">
          <span><small>now</small><b>${nv == null ? '·' : nv}</b></span>
          <span><small>target</small><b>${tv == null ? '·' : tv}</b></span>
        </span>
      </div>
      <p class="small">${esc(a.plain)}</p>`;
    const ref = a.basis === 'target' ? a.target : a.now;
    if (ref.value == null) return `<article class="scorecard">${head}<p class="small">${esc(ref.why || '')}</p></article>`;
    const rows = a.dests.map((d) => {
      const meets = ref.value <= d.cutoff;
      const stepLine = d.steps && d.steps.length
        ? `${d.gap} point${d.gap === 1 ? '' : 's'} to go. ${listNames(d.steps.map((s) => `${s.name} ${s.from} to ${s.to}`))} would do it.`
        : (d.gap > 0 ? `${d.gap} points to go. That is more than the counted subjects can move; a stronger subject counted, or another road in, is the better plan.` : '');
      return `<li class="dmeet" data-meets="${meets}">
        <span class="dmeet-name">${esc(d.name)} <span class="small">asks ${d.cutoff} or better</span></span>
        <span class="dmeet-say">${meets ? `${icon('check')} ${a.basis === 'target' ? 'Your target reaches it' : 'Reached now'}${d.gap < 0 ? `, with ${-d.gap} to spare` : ''}.` : esc(stepLine)}</span>
      </li>`;
    }).join('');
    const counted = (ref.counted || []).map((e) => `${esc(e.name)} ${esc(e.grade)}${e.read === 'G2 value' && e.level === 'G3' ? ' (as G2)' : ''}`).join(' · ');
    return `<article class="scorecard">${head}
      <ul class="dmeets">${rows}</ul>
      <p class="small">Counted (${a.basis}): ${counted}. ${esc(a.bonus || '')}</p>
    </article>`;
  }).join('');

  const fam = st.families ? polyByType(plan, a2(st), g, names(api), (api.data.families || {}).destinations) : [];
  return `
    <h2 class="advh">${icon('target')} What these grades reach</h2>
    ${cards}
    ${fam.length ? `
      <h2 class="advh">Polytechnic by course type</h2>
      <p class="small">Each type counts different relevant subjects. Provisional: 2028 lists are published mid 2027.</p>
      <ul class="famscores">${fam.map((f) => `<li><span>${esc(f.name)}</span><b>${f.value == null ? '·' : f.value}</b></li>`).join('')}</ul>` : ''}
    <p class="small srcline">Scores use the MOE mapping tables, read 27 October 2026. Bonus points are not included. Course requirements and real cut offs move every year; check with your ECG counsellor.</p>`;
}

function a2(st) {
  // Course type scores read the target if any target is set, else now.
  return Object.keys(st.grades.target).length ? st.grades.target : st.grades.now;
}

export function bindTargets(root, api, y) {
  if (root.__tgBound) return;
  root.__tgBound = true;
  root.addEventListener('change', (e) => {
    const sel = e.target.closest('.gsel');
    if (!sel) return;
    setGrade(sel.dataset.which, sel.dataset.sid, sel.value || null);
    const out = root.querySelector('#tg-out');
    const yy = (api.route().q.y) || y;
    if (out) out.innerHTML = outHtml(api, yy);
    api.announce('Scores updated.');
  });
}

export { outHtml as targetsOut };
