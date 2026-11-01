// The P6 page's PSLE panel: four subjects, an AL each, and what follows.
//
// One interaction type: tap an AL. The result builds underneath in reading
// order (score, then Posting Group, then Sec 1 starting levels), and the
// one obvious next step is the last thing on the panel: carry these levels
// into Sec 1.

import { getState, setPsle, replaceYearPlan } from '../state.js?v=4.4.0';
import { psleScore, postingFor, startLevels, hmtlEligible, p6Choices } from '../engine/psle.js?v=4.4.0';
import { esc, onAction } from './dom.js?v=4.4.0';
import { icon } from './icons.js?v=4.4.0';
import { listNames } from '../engine/advice.js?v=4.4.0';
import { isShort } from './labels.js?v=4.4.0';

const SUBJ_PLAN_ID = { el: 'el', mtl: 'mtl', maths: 'maths', science: 'ls_science' };

export function psleHtml(api) {
  const rules = api.data.psle || {};
  const st = getState();
  const psle = st.psle || {};
  const subs = rules.subjects || [];
  return `
    <p class="small">Enter the Achievement Levels you expect or got.</p>
    <div class="alrows">
      ${subs.map((s) => alRow(s, psle[s.id] || {})).join('')}
      ${hmtlRow(psle.hmtl || {})}
    </div>
    <div id="psle-out">${resultHtml(api)}</div>
    <details class="dest-fold" style="margin-top:20px">
      <summary>How ALs are worked out</summary>
      <table class="mini"><thead><tr><th>AL</th><th>Standard marks</th></tr></thead><tbody>
        ${(rules.standardBands || []).map((b) => `<tr><td>${b.al}</td><td>${esc(b.marks)}</td></tr>`).join('')}
      </tbody></table>
      <p class="small">Foundation subjects: ${(rules.foundationBands || []).map((b) => `${b.grade} (${esc(b.marks)}) counts as AL ${b.al}`).join('; ')}.</p>
      <p class="small">Based on MOE information, October 2026. Check moe.gov.sg for changes.</p>
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

// Higher Mother Tongue at PSLE: optional, not in the score, but a
// Distinction or Merit opens Higher Mother Tongue in Sec 1 (2026 intake on).
function hmtlRow(h) {
  const opts = [['D', 'Distinction'], ['M', 'Merit'], ['P', 'Pass']];
  return `
  <div class="alrow" data-sid="hmtl">
    <span class="alname">Higher Mother Tongue <small class="small">if taken, not in the score</small></span>
    <span class="alpick" role="group" aria-label="Higher Mother Tongue result">
      ${opts.map(([v, label]) => `<button type="button" class="alb alb-wide press" data-action="ps-hmtl" data-v="${v}" aria-pressed="${h.grade === v}">${label}</button>`).join('')}
    </span>
  </div>`;
}

// What the starting choices put on track, read by the Sec 1 and 2 rules.
function choicesHtml(api, psle, rules, names) {
  const ch = p6Choices(psle, rules, api.ctx());
  if (!ch) return '';
  const said = (list, one, many) => `${listNames(list)} ${list.length > 1 ? many : one}`;
  const effect = (pk) => {
    if (!pk.up) return 'A steadier start. Levels can move up at school reviews.';
    if (pk.opens.length) return `${said(pk.opens, 'is on track', 'are on track')}${pk.nearer.length ? `, and ${said(pk.nearer, 'comes closer', 'come closer')}` : ''}.`;
    if (pk.nearer.length) return `${said(pk.nearer, 'comes closer', 'come closer')}.`;
    return 'No place changes yet.';
  };
  const why = (pk) => {
    if (!pk.up) return `Taken at Foundation, so the school can offer it at ${pk.level}.`;
    if (pk.level === ch.base) return 'The level your Posting Group starts at.';
    return `Your PSLE ${names[pk.sid]} ${pk.result} allows it.`;
  };
  return `
    <h2 class="advh">What these choices put on track</h2>
    ${isShort() ? '' : '<p class="small">On track means these levels fit what each place asks in the SEC.</p>'}
    <p class="p6-now"><b>${ch.onTrack}</b> of ${ch.total} on track with the levels above.</p>
    ${ch.groups.length ? `
    <ul class="p6c">
      ${ch.groups.map((g) => `<li><b>Group ${g.g}</b>: most subjects start at ${esc(g.base)}. ${g.onTrack} of ${ch.total} on track${g.names.length ? `: ${esc(listNames(g.names))}` : ''}.</li>`).join('')}
    </ul>` : ''}
    ${ch.picks.length ? `
    <ul class="p6c">
      ${ch.picks.map((pk) => `<li><b>${esc(names[pk.sid])} at ${esc(pk.level)}</b>${pk.up ? ' from day one' : ' instead'}. ${esc(why(pk))} ${esc(effect(pk))}${pk.up && pk.sec3 ? ` <span class="small">In Sec 3: ${esc(pk.sec3)}</span>` : ''}</li>`).join('')}
    </ul>` : ''}`;
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
        <div class="sp-score"><span class="sp-k">PSLE Score</span><b>${sc.score}</b><span class="sp-scale">From 4 (best) to 30</span></div>
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
          <div class="subj" data-held="${start.base}"><span class="subj-name">Geography, History${start.base === 'G1' ? '<small>At G1, the Humanities Exposure Modules. Each can move to G2 from Sec 2</small>' : '<small>Can move up from Sec 2</small>'}</span>
            <span class="lvsw" data-level="${start.base}" style="--i:${LVI[start.base]}"><i class="lvsw-thumb" aria-hidden="true"></i>${['G1', 'G2', 'G3'].map((l) => `<span class="lvsw-b${l === start.base ? '' : ' off'}" aria-hidden="true">${l === start.base ? l : ''}</span>`).join('')}</span></div>
        </div>
        ${choicesHtml(api, psle, rules, names)}
        ${hmtlEligible(psle) ? `<p class="callout small">${icon('spark')} ${esc((rules.hmtl && rules.hmtl.text) || '')}</p>` : ''}
        ${isShort() ? '' : `<p class="small">${esc((rules.upgrades && rules.upgrades.note) || '')}</p>`}
        ${school ? `
          <div class="schoolrange">
            <p class="sr-h">${esc(school.name)} in the ${esc(String(school.year))} posting</p>
            <div class="sr-cells">${school.ranges.map((r) => `<span><small>Group ${r.group}</small><b>${esc(r.range.replace(' to ', '\u2009to\u2009'))}</b></span>`).join('')}</div>
            ${isShort() ? '' : `<p class="small">${esc(school.note)}</p>`}
          </div>` : ''}
        <div class="nextcard">
          <p><strong>Use these as your Sec 1 levels.</strong> Your Sec 1 page then shows your best moves.</p>
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
    'ps-hmtl': (btn) => {
      const cur = (getState().psle.hmtl || {}).grade;
      setPsle('hmtl', cur === btn.dataset.v ? null : { grade: btn.dataset.v });
      const row = root.querySelector('.alrow[data-sid="hmtl"]');
      if (row) row.outerHTML = hmtlRow(getState().psle.hmtl || {});
      repaintOut();
      root.querySelector(`.alrow[data-sid="hmtl"] [data-v="${btn.dataset.v}"]`)?.focus();
    },
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
