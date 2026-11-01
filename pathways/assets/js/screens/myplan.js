// My plan: the conversation card.
//
// Planning and conversation, together: this is the page a student brings to
// a parent at dinner, or to a form teacher at the review, or that a parent
// prints for the meeting. It gathers, on one screen, everything the year
// pages hold: the levels year by year, where they point, the best next
// moves, the targets, the student's own list, and the questions to ask, in
// the voice of whoever is reading.

import { getState, toggleAction, carryUrl, carrySummary, YEARS } from '../state.js?v=4.3.0';
import { reach } from '../engine/reach.js?v=4.3.0';
import { effective, PLAN_YEARS } from '../engine/years.js?v=4.3.0';
import { advise, sayName } from '../engine/advice.js?v=4.3.0';
import { report } from '../engine/grades.js?v=4.3.0';
import { psleScore } from '../engine/psle.js?v=4.3.0';
import { openCount, mapPips } from '../ui/map.js?v=4.3.0';
import { sayMove, roleWords } from '../ui/talk.js?v=4.3.0';
import { ticketHtml } from '../ui/ticket.js?v=4.3.0';
import { boardHtml } from '../ui/board.js?v=4.3.0';
import { signalHtml } from '../ui/signal.js?v=4.3.0';
import { t, lineMode, openWord } from '../ui/labels.js?v=4.3.0';
import { STRIP } from '../ui/yearstrip.js?v=4.3.0';
import { esc, onAction } from '../ui/dom.js?v=4.3.0';
import { icon } from '../ui/icons.js?v=4.3.0';

const LABEL = Object.fromEntries(YEARS.map((y) => [y.id, y.label]));

export default {
  id: 'myplan',
  title: 'Saved',
  era: 'school',
  render(root, api) {
    const st = getState();
    const c = api.ctx();
    const rw = roleWords(st.role);
    const byId = Object.fromEntries(c.subjects.map((s) => [s.id, s]));
    const e = effective(st.plans, c.subjects);
    const rows = c.destinations.map((d) => reach(c.plan, d, c));
    const open = openCount(rows);
    const adv = e.yearId ? advise({ yearId: e.yearId, plan: st.plans[e.yearId], ctx: c }) : null;
    const top = adv ? adv.singles.slice(0, 3).concat(adv.pairs.slice(0, 1)) : [];
    const sc = api.data.psle ? psleScore(st.psle || {}, api.data.psle) : { complete: false };
    const g = api.data.grades;
    const anyGrades = Object.keys(st.grades.now).length || Object.keys(st.grades.target).length;
    const rep = g && anyGrades ? report({ plan: c.plan, grades: st.grades, g, names: Object.fromEntries(c.subjects.map((s) => [s.id, sayName(s)])), destNames: Object.fromEntries(c.destinations.map((d) => [d.id, d.railName])) }) : [];
    const yearMeta = ((api.data.years || {}).years || {})[st.year] || {};
    const talk = (yearMeta.talk && yearMeta.talk[st.role]) || [];
    const wants = ((api.data.futures || {}).futures || []);
    const want = st.aim ? wants.find((w) => w.id === st.aim) : null;

    const CODE = Object.fromEntries(STRIP.map((y) => [y.id, y.code]));
    root.innerHTML = `
    <div class="wrap yearwrap planwrap">
      <section class="pass arrive" aria-labelledby="pass-h">
        <div class="pass-top">
          <div>
            <p class="pass-k">${st.yearSet ? `Now in ${esc(LABEL[st.year])}` : 'Year not set'} · for the next conversation</p>
            <h1 id="pass-h">${esc(st.role === 'student' ? t('planTitle') : rw.plan)}</h1>
          </div>
          <p class="pass-open"><b>${open}</b><span>of ${rows.length} ${openWord(rows)}</span></p>
        </div>
        <ol class="pass-line">
          <li data-filled="${sc.complete}" data-now="${st.yearSet && st.year === 'p6'}">
            <button type="button" class="pl-stn press no-print-btn" data-action="go" data-s="year" data-y="p6"><i></i><b>P6</b></button>
            <span class="pl-body">${sc.complete ? `<span class="pl-chip">PSLE ${sc.score}</span>` : '<span class="pl-none">not set</span>'}</span>
          </li>
          ${PLAN_YEARS.map((y) => {
            const p = st.plans[y] || {};
            const ids = Object.keys(p);
            return `<li data-filled="${ids.length > 0}" data-now="${st.yearSet && st.year === y}">
              <button type="button" class="pl-stn press" data-action="go" data-s="year" data-y="${y}"><i></i><b>${esc(CODE[y])}</b></button>
              <span class="pl-body">${ids.length ? ids.map((id) => `<span class="pl-chip" data-level="${p[id]}">${esc(byId[id] ? (byId[id].shortName || byId[id].name) : id)} <b>${p[id]}</b></span>`).join('') : '<span class="pl-none">not set</span>'}</span>
            </li>`;
          }).join('')}
        </ol>
        <p class="btnrow no-print">
          <button type="button" class="btn press" data-action="mp-print">${icon('print')} Print or save PDF</button>
          <button type="button" class="btn ghost on-night press" data-action="mp-carry">Send to another device</button>
          <span class="small pass-note" id="mp-note"></span>
        </p>
      </section>

      <div class="plangrid">
        <section class="destsec">
          ${lineMode()
            ? boardHtml(rows, { key: 'plan', title: e.yearId ? t(openWord(rows) === 'on track' ? 'answerFromLower' : 'answerFrom', LABEL[e.yearId]) : t('answer') })
            : signalHtml(rows, { key: 'plan', caption: e.yearId ? t(openWord(rows) === 'on track' ? 'answerFromLower' : 'answerFrom', LABEL[e.yearId]) : t('answer') })}
        </section>

        <section class="destsec">
          <h2 class="advh">${esc(t('keptList'))}</h2>
          ${want ? `<p class="small">Want: <strong>${esc(want.want || want.id)}</strong></p>` : ''}
          ${st.actions.length ? `<ul class="keptlist">${st.actions.map((a, i) => `<li>${icon('ticket')}<span>${esc(a)}</span><button type="button" class="linkbtn small no-print" data-action="mp-drop" data-i="${i}">Remove</button></li>`).join('')}</ul>`
            : `<div class="emptystate small-es"><span class="es-ic">${icon('ticket')}</span><p class="es-h">${esc(t('noneKept'))}</p><p class="small">Each move comes with the words to say to the right person.</p></div>`}
          <p class="small no-print"><button type="button" class="linkbtn" data-action="go" data-s="act">Pick three moves for this term</button></p>
        </section>
      </div>

      ${top.length ? `
      <section class="destsec">
        <h2 class="advh">Best next moves</h2>
        <div class="ticketlist">${top.map((m) => ticketHtml(m)).join('')}</div>
      </section>` : ''}

      ${rep.length ? `
      <section class="destsec">
        <h2 class="advh">Targets</h2>
        <div class="targetcells">${rep.map((a) => {
          const ref = a.basis === 'target' ? a.target : a.now;
          return `<div class="tcell"><span class="tcell-k">${esc(a.name)} <small>${a.basis}</small></span><b>${ref.value == null ? '·' : ref.value}</b>
            <span class="tcell-d">${a.dests.map((d) => `<span data-meets="${!!d.meets}">${esc(d.name)} ${d.cutoff}</span>`).join('')}</span></div>`;
        }).join('')}</div>
      </section>` : ''}

      ${talk.length ? `
      <section class="destsec">
        <h2 class="advh">Talk it through</h2>
        <div class="bubbles">${talk.map((t) => `<p class="bubble">${esc(t)}</p>`).join('')}</div>
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
