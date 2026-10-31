// The P6 page's PSLE panel: four subjects, an AL each, and what follows.
//
// One interaction type: tap an AL. The result builds underneath in reading
// order (score, then Posting Group, then Sec 1 starting levels), and the
// one obvious next step is the last thing on the panel: carry these levels
// into Sec 1.

import { getState, setPsle, replaceYearPlan } from '../state.js?v=4.0.0';
import { psleScore, postingFor, startLevels, hmtlEligible } from '../engine/psle.js?v=4.0.0';
import { esc, onAction } from './dom.js?v=4.0.0';
import { icon } from './icons.js?v=4.0.0';

const SUBJ_PLAN_ID = { el: 'el', mtl: 'mtl', maths: 'maths', science: 'ls_science' };

export function psleHtml(api) {
  const rules = api.data.psle || {};
  const st = getState();
  const psle = st.psle || {};
  const subs = rules.subjects || [];
  return `
    <p class="small">Enter the Achievement Levels you expect, hope for, or got. This is for planning: nothing here is a prediction, and nothing leaves this device.</p>
    <div class="alrows">
      ${subs.map((s) => alRow(s, psle[s.id] || {})).join('')}
    </div>
    <div id="psle-out">${resultHtml(api)}</div>
    <details class="dest-fold" style="margin-top:20px">
      <summary>How ALs are worked out</summary>
      <table class="mini"><thead><tr><th>AL</th><th>Standard marks</th></tr></thead><tbody>
        ${(rules.standardBands || []).map((b) => `<tr><td>${b.al}</td><td>${esc(b.marks)}</td></tr>`).join('')}
      </tbody></table>
      <p class="small">Foundation subjects: ${(rules.foundationBands || []).map((b) => `${b.grade} (${esc(b.marks)}) counts as AL ${b.al}`).join('; ')}.</p>
      <p class="small">${esc((rules._meta && rules._meta.notes) || '')}</p>
    </details>`;
}

function alRow(s, e) {
  const f = !!e.foundation;
  return `
  <div class="alrow" data-sid="${esc(s.id)}">
    <span class="alname">${esc(s.name)}
      <button type="button" class="linkbtn small" data-action="ps-found" data-sid="${esc(s.id)}" aria-pressed="${f}">${f ? 'Foundation' : 'Standard'}<span class="sr-only">. Switch.</span></button>
    </span>
    <span class="alpick" role="group" aria-label="${esc(s.name)} ${f ? 'Foundation grade' : 'AL'}">
      ${(f ? ['A', 'B', 'C'] : [1, 2, 3, 4, 5, 6, 7, 8]).map((v) => {
        const on = f ? e.grade === v : e.al === v;
        return `<button type="button" class="alb press" data-action="ps-al" data-sid="${esc(s.id)}" data-v="${v}" aria-pressed="${on}">${v}</button>`;
      }).join('')}
    </span>
  </div>`;
}

function resultHtml(api) {
  const rules = api.data.psle || {};
  const st = getState();
  const psle = st.psle || {};
  const sc = psleScore(psle, rules);
  if (!sc.complete) {
    const n = Object.values(sc.als).filter((a) => a != null).length;
    return `<p class="callout small">${n ? `${n} of 4 in. ` : ''}Add all four to see the PSLE Score and the Sec 1 levels that usually follow.</p>`;
  }
  const post = postingFor(sc.score, psle, rules);
  const chosen = post.groups.includes(psle.group && psle.group.v) ? psle.group.v : post.groups[0];
  const start = chosen ? startLevels(chosen, psle, rules, psle.pick || {}) : null;
  const school = rules.school;
  const names = Object.fromEntries((rules.subjects || []).map((s) => [s.id, s.name]));

  const LVI = { G1: 0, G2: 1, G3: 2 };
  return `
    <div class="psle-result arrive">
      <div class="scorepass">
        <div class="sp-score"><span class="sp-k">PSLE Score</span><b>${sc.score}</b><span class="sp-scale">4 strongest, 30 widest</span></div>
        <div class="sp-group">${post.groups.length
          ? `<span class="sp-k">Posting Group</span><b>${post.groups.join(' or ')}</b><span class="sp-scale">${post.groups.length > 1 ? 'You choose one' : `Most subjects start at ${esc(start.base)}`}</span>`
          : '<span class="sp-k">Posting Group</span><b>·</b><span class="sp-scale">See below</span>'}</div>
      </div>
      ${post.groups.length ? `
        ${post.note ? `<p class="small">${esc(post.note)}</p>` : ''}
        ${post.groups.length > 1 ? `
          <div class="segtabs compact" role="radiogroup" aria-label="Posting Group">
            ${post.groups.map((g) => `<button type="button" role="radio" class="segtab press" data-action="ps-group" data-v="${g}" aria-checked="${chosen === g}" aria-selected="${chosen === g}">Group ${g}</button>`).join('')}
          </div>` : ''}
        <h2 class="advh">Sec 1 starting levels</h2>
        <p class="small">Where the PSLE allows a more demanding start, the switch is live: slide to the level you would take.</p>
        <div class="subjgrid">
          ${(rules.subjects || []).map((s) => {
            const opts = start.options[s.id] || [start.base];
            const cur = start.plan[SUBJ_PLAN_ID[s.id]];
            return `<div class="subj" data-held="${cur}"><span class="subj-name">${esc(names[s.id])}${opts.length > 1 ? '<small>You can choose</small>' : '<small>Set by the Posting Group</small>'}</span>
              <span class="lvsw" data-level="${cur}" style="--i:${LVI[cur]}"><i class="lvsw-thumb" aria-hidden="true"></i>${['G1', 'G2', 'G3'].map((l) => opts.includes(l)
                ? `<button type="button" class="lvsw-b" data-action="ps-pick" data-sid="${esc(s.id)}" data-level="${l}" aria-pressed="${cur === l}" aria-label="${esc(names[s.id])} at ${l}" ${opts.length < 2 ? 'disabled' : ''}>${l}</button>`
                : '<span class="lvsw-b off" aria-hidden="true"></span>').join('')}</span></div>`;
          }).join('')}
          <div class="subj" data-held="${start.base}"><span class="subj-name">Geography, History<small>Can move up from Sec 2</small></span>
            <span class="lvsw" data-level="${start.base}" style="--i:${LVI[start.base]}"><i class="lvsw-thumb" aria-hidden="true"></i>${['G1', 'G2', 'G3'].map((l) => `<span class="lvsw-b${l === start.base ? '' : ' off'}" aria-hidden="true">${l === start.base ? l : ''}</span>`).join('')}</span></div>
        </div>
        ${hmtlEligible(psle) ? `<p class="callout small">${icon('spark')} ${esc((rules.hmtl && rules.hmtl.text) || '')}</p>` : ''}
        <p class="small">${esc((rules.upgrades && rules.upgrades.note) || '')}</p>
        ${school ? `
          <div class="schoolrange">
            <p class="sr-h">${esc(school.name)} in the ${esc(String(school.year))} posting</p>
            <div class="sr-cells">${school.ranges.map((r) => `<span><small>Group ${r.group}</small><b>${esc(r.range.replace(' to ', '\u2009to\u2009'))}</b></span>`).join('')}</div>
            <p class="small">${esc(school.note)}</p>
          </div>` : ''}
        <div class="nextcard">
          <p><strong>Carry these into Sec 1.</strong> They become your Sec 1 page, where the advice starts.</p>
          <button type="button" class="btn press" data-action="ps-use">Use as my Sec 1 levels ${icon('arrow')}</button>
        </div>` : `
        <p class="callout">${esc(post.note)}</p>`}
    </div>`;
}

export function bindPsle(root, api) {
  const repaintOut = () => {
    const out = root.querySelector('#psle-out');
    if (out) out.innerHTML = resultHtml(api);
  };
  const repaintRow = (sid) => {
    const s = (api.data.psle.subjects || []).find((x) => x.id === sid);
    const row = root.querySelector(`.alrow[data-sid="${CSS.escape(sid)}"]`);
    if (s && row) row.outerHTML = alRow(s, getState().psle[sid] || {});
  };
  onAction(root, {
    'ps-al': (btn) => {
      const { sid, v } = btn.dataset;
      const e = getState().psle[sid] || {};
      if (e.foundation) setPsle(sid, { grade: e.grade === v ? null : v });
      else setPsle(sid, { al: e.al === Number(v) ? null : Number(v) });
      repaintRow(sid); repaintOut();
      const sc = psleScore(getState().psle, api.data.psle);
      api.announce(sc.complete ? `PSLE Score ${sc.score}.` : 'Saved.');
      root.querySelector(`.alrow[data-sid="${CSS.escape(sid)}"] [data-v="${v}"]`)?.focus();
    },
    'ps-found': (btn) => {
      const sid = btn.dataset.sid;
      const e = getState().psle[sid] || {};
      setPsle(sid, { foundation: !e.foundation, al: null, grade: null });
      repaintRow(sid); repaintOut();
    },
    'ps-group': (btn) => { setPsle('group', { v: Number(btn.dataset.v) }); repaintOut(); },
    'ps-pick': (btn) => {
      const pick = { ...(getState().psle.pick || {}), [btn.dataset.sid]: btn.dataset.level };
      setPsle('pick', pick);
      repaintOut();
    },
    'ps-use': () => {
      const rules = api.data.psle;
      const psle = getState().psle;
      const sc = psleScore(psle, rules);
      const post = postingFor(sc.score, psle, rules);
      const g = post.groups.includes(psle.group && psle.group.v) ? psle.group.v : post.groups[0];
      const s = startLevels(g, psle, rules, psle.pick || {});
      if (!s) return;
      replaceYearPlan('sec1', s.plan);
      api.nav('year', { y: 'sec1', tab: 'advice' });
    },
  });
}
