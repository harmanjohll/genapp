// The Targets tab (Sec 3 to Sec 5): where I am, where I am aiming, and what
// each destination reads from it. (v4 visual pass)
//
// Grades are set with steppers (plus is a better grade), because a select
// hides the scale and a stepper shows it. Each score is drawn as a track:
// lower is better, so the strongest end is on the left, every cut off is a
// station on the line, the "now" grade is a hollow marker and the target is
// the train. A gap is then something you can see, and the sentence under the
// track names the grade steps, by subject, that would close it.

import { getState, setGrade } from '../state.js?v=4.0.0';
import { report, gradesFor, polyByType } from '../engine/grades.js?v=4.0.0';
import { esc, onAction } from './dom.js?v=4.0.0';
import { icon } from './icons.js?v=4.0.0';
import { listNames, sayName } from '../engine/advice.js?v=4.0.0';

const SHORT = { jc: 'JC', mi: 'MI', poly: 'Poly', pfp: 'PFP', hnitec: 'Higher Nitec 2 yr', sec5: 'Sec 5' };
const SCALE = { L1R4: [5, 35], ELR2B2: [5, 35], ELMAB3: [5, 30] };

function names(api) {
  return Object.fromEntries(api.ctx().subjects.map((s) => [s.id, sayName(s)]));
}
function destNames(api) {
  return Object.fromEntries(api.ctx().destinations.map((d) => [d.id, d.railName || d.name]));
}

function stepper(which, s, lv, cur) {
  return `<span class="step" data-which="${which}">
    <button type="button" class="step-b press" data-action="tg-step" data-which="${which}" data-sid="${esc(s.id)}" data-d="-1" aria-label="${esc(s.name)} ${which}: one grade lower">${icon('minus')}</button>
    <output class="step-v" aria-live="off">${cur ? esc(cur) : '·'}</output>
    <button type="button" class="step-b press" data-action="tg-step" data-which="${which}" data-sid="${esc(s.id)}" data-d="1" aria-label="${esc(s.name)} ${which}: one grade higher">${icon('plus')}</button>
  </span>`;
}

export function targetsHtml(api, y) {
  const st = getState();
  const plan = st.plans[y] || {};
  const g = api.data.grades || {};
  const subj = api.ctx().subjects.filter((s) => plan[s.id]);
  if (!subj.length) {
    return `<div class="emptystate"><span class="es-ic">${icon('target')}</span>
      <p class="es-h">Set your ${esc(y.replace('sec', 'Sec '))} subjects first.</p>
      <p class="small">Then set a grade target for each, and watch what it reaches.</p>
      <button type="button" class="btn press" data-action="yr-tab" data-tab="levels">Set subjects</button></div>`;
  }
  return `
    <p class="small tg-intro">The grade you would expect today, and the one you are aiming for. Goal setting: the numbers are yours, nothing here predicts them, nothing leaves this device.</p>
    <div class="gradetable" role="table" aria-label="Grades">
      <div class="gt-row gt-head" role="row"><span role="columnheader">Subject</span><span role="columnheader">Now</span><span role="columnheader">Target</span></div>
      ${subj.map((s) => {
        const lv = plan[s.id];
        const ok = (x) => (gradesFor(lv, g).includes(x) ? x : null);
        return `<div class="gt-row" role="row" data-sid="${esc(s.id)}">
          <span class="gt-name" role="cell">${esc(s.shortName || s.name)} <b class="lvtag" data-level="${lv}">${lv}</b></span>
          <span role="cell">${stepper('now', s, lv, ok((st.grades.now || {})[s.id]))}</span>
          <span role="cell">${stepper('target', s, lv, ok((st.grades.target || {})[s.id]))}</span>
        </div>`;
      }).join('')}
    </div>
    <div id="tg-out">${outHtml(api, y)}</div>`;
}

function trackSvg(a, refVal, nowVal, tgtVal) {
  const [min, max] = SCALE[a.id] || [5, 35];
  const W = 440; const pad = 22;
  const x = (v) => pad + ((Math.min(max, Math.max(min, v)) - min) / (max - min)) * (W - 2 * pad);
  const ticks = [];
  for (let v = min; v <= max; v += 5) ticks.push(v);
  const dests = a.dests.slice().sort((p, q) => p.cutoff - q.cutoff);
  const reach = dests.length ? x(dests[dests.length - 1].cutoff) : pad;
  return `<svg class="track" viewBox="0 0 ${W} 112" role="img" aria-label="${esc(a.name)} track: lower is better.${nowVal != null ? ` Now ${nowVal}.` : ''}${tgtVal != null ? ` Target ${tgtVal}.` : ''} ${dests.map((d) => `${SHORT[d.id] || d.name} asks ${d.cutoff}.`).join(' ')}">
    <line x1="${pad}" y1="62" x2="${W - pad}" y2="62" stroke="var(--rule)" stroke-width="8" stroke-linecap="round"/>
    <line x1="${pad}" y1="62" x2="${reach}" y2="62" stroke="var(--line-open)" stroke-width="8" stroke-linecap="round" opacity="0.5"/>
    ${ticks.map((v) => `<text x="${x(v)}" y="104" text-anchor="middle" class="tk-tick">${v}</text>`).join('')}
    <text x="${pad}" y="14" class="tk-end">Stronger</text>
    <text x="${W - pad}" y="14" text-anchor="end" class="tk-end">Wider</text>
    ${dests.map((d, i) => `
      <g class="tk-stn">
        <circle cx="${x(d.cutoff)}" cy="62" r="9" fill="var(--surface)" stroke="var(--ink)" stroke-width="3.5"/>
        <text x="${x(d.cutoff)}" y="${i % 2 ? 46 : 32}" text-anchor="middle" class="tk-lab">${esc(SHORT[d.id] || d.name)} ${d.cutoff}</text>
      </g>`).join('')}
    ${nowVal != null ? `<g class="tk-now"><circle cx="${x(nowVal)}" cy="62" r="12" fill="none" stroke="var(--ink-mute)" stroke-width="3" stroke-dasharray="4 3"/><text x="${x(nowVal)}" y="88" text-anchor="middle" class="tk-mk">now ${nowVal}</text></g>` : ''}
    ${tgtVal != null ? `<g class="tk-tgt"><rect x="${x(tgtVal) - 22}" y="50" width="44" height="24" rx="12" fill="var(--accent)" stroke="var(--night)" stroke-width="2"/><text x="${x(tgtVal)}" y="67" text-anchor="middle" class="tk-tv">${tgtVal}</text></g>` : ''}
  </svg>`;
}

function outHtml(api, y) {
  const st = getState();
  const plan = st.plans[y] || {};
  const g = api.data.grades || {};
  const rep = report({ plan, grades: st.grades, g, names: names(api), destNames: destNames(api) });
  const anyGrade = Object.keys(st.grades.now).length || Object.keys(st.grades.target).length;
  if (!anyGrade) return `<p class="callout small">${icon('target')} Step a grade for each subject and the score tracks appear here.</p>`;

  const cards = rep.map((a) => {
    const nv = a.now.value; const tv = a.target.value;
    const ref = a.basis === 'target' ? a.target : a.now;
    const lines = ref.value == null ? `<p class="small">${esc(ref.why || '')}</p>` : `<ul class="meets">${a.dests.map((d) => {
      const meets = ref.value <= d.cutoff;
      const say = meets
        ? `${a.basis === 'target' ? 'Target reaches it' : 'Reached now'}${d.gap < 0 ? `, ${-d.gap} to spare` : ''}`
        : (d.steps && d.steps.length
          ? `${d.gap} to go: ${listNames(d.steps.map((s) => `${s.name} ${s.from} to ${s.to}`))}`
          : `${d.gap} to go, more than these subjects can move. A stronger subject counted, or another road in.`);
      return `<li data-meets="${meets}"><b>${esc(SHORT[d.id] || d.name)}</b><span>${meets ? icon('check') : ''}${esc(say)}</span></li>`;
    }).join('')}</ul>`;
    const counted = (ref.counted || []).map((e) => `${esc(e.name)} ${esc(e.grade)}${e.read === 'G2 value' && e.level === 'G3' ? ' (as G2)' : ''}`).join(', ');
    return `<article class="scorecard">
      <div class="scorehead">
        <span class="scorename">${esc(a.name)}</span>
        <span class="scorevals"><span><small>now</small><b>${nv == null ? '·' : nv}</b></span><span class="tv"><small>target</small><b>${tv == null ? '·' : tv}</b></span></span>
      </div>
      <p class="small">${esc(a.plain)}</p>
      ${ref.value != null ? trackSvg(a, ref.value, nv, tv) : ''}
      ${lines}
      ${counted ? `<p class="small counted">Counted (${a.basis}): ${counted}. ${esc(a.bonus || '')}</p>` : ''}
    </article>`;
  }).join('');

  const tg = Object.keys(st.grades.target).length ? st.grades.target : st.grades.now;
  const fam = st.families ? polyByType(plan, tg, g, names(api), (api.data.families || {}).destinations) : [];
  return `
    <h2 class="advh">What these grades reach</h2>
    <div class="scorelist">${cards}</div>
    ${fam.length ? `
      <h2 class="advh">Polytechnic by course type</h2>
      <p class="small">Each type counts different relevant subjects. Provisional until the 2028 lists in mid 2027.</p>
      <div class="famscores">${fam.map((f) => `<div><span>${esc(f.name)}</span><b>${f.value == null ? '·' : f.value}</b></div>`).join('')}</div>` : ''}
    <p class="srcline">Scores use the MOE mapping tables, read 27 October 2026. Bonus points are not included. Course requirements and cut offs move every year; check with your ECG counsellor.</p>`;
}

export function bindTargets(root, api, y) {
  onAction(root, {
    'tg-step': (btn) => {
      const yy = api.route().q.y || y;
      const plan = getState().plans[yy] || {};
      const { which, sid } = btn.dataset;
      const list = gradesFor(plan[sid], api.data.grades || {});
      if (!list.length) return;
      const cur = (getState().grades[which] || {})[sid];
      let i = list.indexOf(cur);
      // Plus is a better grade, which is further left in the list.
      if (i < 0) i = Math.floor(list.length / 2);
      else i = Math.min(list.length - 1, Math.max(0, i - Number(btn.dataset.d)));
      setGrade(which, sid, list[i]);
      const out = btn.closest('.step')?.querySelector('.step-v');
      if (out) { out.textContent = list[i]; out.classList.remove('tick'); void out.offsetWidth; out.classList.add('tick'); }
      const o = root.querySelector('#tg-out');
      if (o) o.innerHTML = outHtml(api, yy);
      api.announce(`${which === 'now' ? 'Now' : 'Target'} ${list[i]}.`);
    },
  });
}

export { outHtml as targetsOut };
