// My plan: the conversation card.
//
// Planning and conversation, together: this is the page a student brings to
// a parent at dinner, or to a form teacher at the review, or that a parent
// prints for the meeting. It gathers, on one screen, everything the year
// pages hold: the levels year by year, where they point, the best next
// moves, the targets, the student's own list, and the questions to ask, in
// the voice of whoever is reading.

import { getState, toggleAction, carryUrl, carrySummary, YEARS } from '../state.js?v=4.0.0';
import { reach } from '../engine/reach.js?v=4.0.0';
import { effective, PLAN_YEARS } from '../engine/years.js?v=4.0.0';
import { advise, sayName } from '../engine/advice.js?v=4.0.0';
import { report } from '../engine/grades.js?v=4.0.0';
import { psleScore } from '../engine/psle.js?v=4.0.0';
import { openCount, mapPips } from '../ui/map.js?v=4.0.0';
import { sayMove, roleWords } from '../ui/talk.js?v=4.0.0';
import { esc, onAction } from '../ui/dom.js?v=4.0.0';
import { icon } from '../ui/icons.js?v=4.0.0';

const LABEL = Object.fromEntries(YEARS.map((y) => [y.id, y.label]));

export default {
  id: 'myplan',
  title: 'My plan',
  era: 'school',
  render(root, api) {
    const st = getState();
    const c = api.ctx();
    const rw = roleWords(st.role);
    const byId = Object.fromEntries(c.subjects.map((s) => [s.id, s]));
    const e = effective(st.plans, c.subjects);
    const rows = c.destinations.map((d) => reach(c.plan, d, c));
    const open = openCount(rows);
    const adv = e.yearId ? advise({ yearId: e.yearId, plan: st.plans[e.yearId], ctx: c, offer: st.offer }) : null;
    const top = adv ? adv.singles.slice(0, 3).concat(adv.pairs.slice(0, 1)) : [];
    const sc = api.data.psle ? psleScore(st.psle || {}, api.data.psle) : { complete: false };
    const g = api.data.grades;
    const anyGrades = Object.keys(st.grades.now).length || Object.keys(st.grades.target).length;
    const rep = g && anyGrades ? report({ plan: c.plan, grades: st.grades, g, names: Object.fromEntries(c.subjects.map((s) => [s.id, sayName(s)])), destNames: Object.fromEntries(c.destinations.map((d) => [d.id, d.railName])) }) : [];
    const yearMeta = ((api.data.years || {}).years || {})[st.year] || {};
    const talk = (yearMeta.talk && yearMeta.talk[st.role]) || [];
    const wants = ((api.data.futures || {}).futures || []);
    const want = st.aim ? wants.find((w) => w.id === st.aim) : null;

    root.innerHTML = `
    <div class="wrap-narrow yearwrap">
      <header class="yhead">
        <p class="kicker">${st.yearSet ? `${esc(LABEL[st.year])} · ` : ''}For the next conversation</p>
        <h1>${esc(rw.plan)}</h1>
        <p class="lede">Everything this device holds, on one page. Bring it to a parent, a form teacher or an ECG counsellor.</p>
        <p class="btnrow no-print">
          <button type="button" class="btn press" data-action="mp-print">${icon('print')} Print or save as PDF</button>
          <button type="button" class="btn ghost press" data-action="mp-carry">Carry to another device</button>
          <span class="small" id="mp-note"></span>
        </p>
      </header>

      <section class="destsec">
        <h2 class="advh">${icon('steps')} Year by year</h2>
        <ol class="journey">
          <li data-filled="${sc.complete}">
            <span class="j-year">P6</span>
            <span class="j-body">${sc.complete ? `PSLE Score ${sc.score} (planning)` : '<span class="small">Not set</span>'}</span>
            <button type="button" class="linkbtn no-print" data-action="go" data-s="year" data-y="p6">${sc.complete ? 'Change' : 'Set'}</button>
          </li>
          ${PLAN_YEARS.map((y) => {
            const p = st.plans[y] || {};
            const ids = Object.keys(p);
            return `<li data-filled="${ids.length > 0}" data-now="${st.yearSet && st.year === y}">
              <span class="j-year">${esc(LABEL[y])}${st.yearSet && st.year === y ? '<small>now</small>' : ''}</span>
              <span class="j-body">${ids.length ? ids.map((id) => `<span class="jchip"><span>${esc(byId[id] ? (byId[id].shortName || byId[id].name) : id)}</span><b class="lvtag" data-level="${p[id]}">${p[id]}</b></span>`).join('') : '<span class="small">Not set</span>'}</span>
              <button type="button" class="linkbtn no-print" data-action="go" data-s="year" data-y="${y}">${ids.length ? 'Change' : 'Set'}</button>
            </li>`;
          }).join('')}
        </ol>
      </section>

      <section class="destsec">
        <h2 class="advh">Where it points</h2>
        <div class="advsum"><span class="bignum">${open}</span><span><strong>of ${rows.length} open</strong> ${mapPips(rows)} <span class="small">${e.yearId ? `from the ${esc(LABEL[e.yearId])} levels.` : 'Set a year to make this yours.'} Every one keeps a road in.</span></span></div>
        <ul class="openlist">
          ${rows.map((r) => `<li data-state="${esc(r.state)}"><button type="button" class="linkbtn" data-action="go" data-s="dest" data-id="${esc(r.id)}">${esc(r.railName)}</button> <span class="small">${esc(r.status.text)}</span></li>`).join('')}
        </ul>
      </section>

      ${top.length ? `
      <section class="destsec">
        <h2 class="advh">${icon('spark')} Best next moves</h2>
        <ol class="movesum">${top.map((m) => `<li><p>${esc(m.line)}</p><p class="small sayline">${esc(sayMove(m, st.role))}</p></li>`).join('')}</ol>
      </section>` : ''}

      ${rep.length ? `
      <section class="destsec">
        <h2 class="advh">${icon('target')} Targets</h2>
        <ul class="targetsum">${rep.map((a) => {
          const ref = a.basis === 'target' ? a.target : a.now;
          return `<li><strong>${esc(a.name)} ${ref.value == null ? '·' : ref.value}</strong> <span class="small">(${a.basis}) ${a.dests.map((d) => `${esc(d.name)} asks ${d.cutoff}${ref.value != null ? (ref.value <= d.cutoff ? ' ✓' : `, ${d.gap} to go`) : ''}`).join(' · ')}</span></li>`;
        }).join('')}</ul>
      </section>` : ''}

      <section class="destsec">
        <h2 class="advh">${icon('flag')} ${st.role === 'student' ? 'Things I said I would do' : 'Things on the list'}</h2>
        ${want ? `<p class="small">Want: <strong>${esc(want.want || want.id)}</strong></p>` : ''}
        ${st.actions.length ? `<ul class="todolist">${st.actions.map((a, i) => `<li><span>${esc(a)}</span><button type="button" class="linkbtn small no-print" data-action="mp-drop" data-i="${i}">Remove</button></li>`).join('')}</ul>`
          : `<p class="small">Nothing yet. Every piece of advice has an "Add to my list" button: the words to say, to the right person.</p>`}
        <p class="small no-print"><button type="button" class="linkbtn" data-action="go" data-s="act">Pick three moves for this term</button></p>
      </section>

      ${talk.length ? `
      <section class="destsec">
        <h2 class="advh">${icon('talk')} Talk it through</h2>
        <ul class="talklist">${talk.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
        <p class="small no-print">The ${esc(st.role)} version. <button type="button" class="linkbtn" data-action="role">Change who is reading</button></p>
      </section>` : ''}

      <p class="small srcline">A thinking tool, not official advice. It never says a road is closed. Confirm anything that matters with the school's ECG counsellor and at moe.gov.sg.</p>
    </div>`;

    onAction(root, {
      'mp-print': () => window.print(),
      'mp-drop': (btn) => { const a = getState().actions[Number(btn.dataset.i)]; if (a) toggleAction(a); api.refresh(); },
      'mp-carry': async () => {
        const url = carryUrl();
        const note = root.querySelector('#mp-note');
        const cs = carrySummary();
        try {
          if (navigator.share) { await navigator.share({ title: 'Paths: my plan', url }); return; }
          await navigator.clipboard.writeText(url);
          if (note) note.textContent = `Link copied. It carries ${cs.subjects} subjects and your list. Nothing else.`;
        } catch { if (note) note.textContent = url; }
      },
    });
  },
};
