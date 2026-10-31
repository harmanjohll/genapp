// After Sec: the eight destinations, and one page for each.
//
// v3 kept each destination in a sheet over Plan. A sheet is right for a
// glance and wrong for a decision: a family reading what Polytechnic asks,
// what it costs and which courses want which subjects needs a page they can
// return to, bookmark and send. So the sheet stays for the glance (from the
// year pages) and this is the page.
//
// Read from the effective plan: the latest year this device holds. The page
// says which year that is, every time, because a Sec 1 plan read as a
// destination answer is an inference and must look like one.

import { getState, setFamilies } from '../state.js?v=4.0.0';
import { reach } from '../engine/reach.js?v=4.0.0';
import { effective } from '../engine/years.js?v=4.0.0';
import { advise, listNames, sayName } from '../engine/advice.js?v=4.0.0';
import { report } from '../engine/grades.js?v=4.0.0';
import { openCount } from '../ui/map.js?v=4.0.0';
import { yearStrip } from '../ui/yearstrip.js?v=4.0.0';
import { sayMove, roleWords } from '../ui/talk.js?v=4.0.0';
import { ticketHtml } from '../ui/ticket.js?v=4.0.0';
import { BOARD_WORD } from '../ui/board.js?v=4.0.0';
import { DEST_CODE } from '../ui/signal.js?v=4.0.0';
import { decorate } from '../ui/glossary.js?v=4.0.0';
import { esc, onAction } from '../ui/dom.js?v=4.0.0';
import { icon } from '../ui/icons.js?v=4.0.0';

const YEAR_LABEL = { sec1: 'Sec 1', sec2: 'Sec 2', sec3: 'Sec 3', sec4: 'Sec 4', sec5: 'Sec 5' };
const STATE_WORD = { 'open': 'Open now', 'within-reach': 'A move away', 'longer-route': 'A longer road', 'other-route': 'Another road in' };
const LINE = { 'open': 'var(--line-open)', 'within-reach': 'var(--line-within)', 'longer-route': 'var(--line-longer)', 'other-route': 'var(--line-other)' };

function rowsNow(api) {
  const c = api.ctx();
  return c.destinations.map((d) => reach(c.plan, d, c));
}

function basisLine(api) {
  const e = effective(getState().plans, api.ctx().subjects);
  if (!e.yearId) return 'No levels set yet, so every destination shows what it asks from scratch. Set your year\'s levels to make this yours.';
  return `Read from your ${YEAR_LABEL[e.yearId]} levels${e.yearId === 'sec1' || e.yearId === 'sec2' ? ', through the Sec 3 combination they usually lead to' : ''}.`;
}

export function niceDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  if (!m) return iso || '';
  const mon = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][Number(m[2]) - 1];
  return `${Number(m[3])} ${mon} ${m[1]}`;
}

function station(state) {
  return `<svg class="stn" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="6.5" fill="var(--surface)" stroke="${LINE[state] || 'var(--line-faint)'}" stroke-width="3"/></svg>`;
}

export const after = {
  id: 'after',
  title: 'After Sec',
  era: 'school',
  render(root, api) {
    const st = getState();
    const rows = rowsNow(api);
    const open = openCount(rows);
    root.innerHTML = `
    ${yearStrip('after', st)}
    <div class="wrap yearwrap">
      <header class="sign arrive">
        <div class="sign-code" aria-hidden="true">AS</div>
        <div class="sign-body">
          <p class="sign-meta">After Sec <span>Age 16 to 17</span></p>
          <h1>Eight lines out of secondary school</h1>
          <p class="sign-lede">Every one keeps a road in, whatever your subjects. Levels change how direct the road is, never whether one exists.</p>
        </div>
      </header>
      <p class="basis">${icon('train')} ${esc(basisLine(api))} <b>${open} of ${rows.length}</b> open on that plan.</p>
      <div class="linegrid">
        ${rows.map((r, i) => `
          <button type="button" class="linecard press arrive" style="--lc:${LINE[r.state]};animation-delay:${Math.min(i, 7) * 40}ms" data-action="go" data-s="dest" data-id="${esc(r.id)}">
            <span class="lc-band" aria-hidden="true"><span class="lc-code">${esc(DEST_CODE[r.id] || '')}</span></span>
            <span class="lc-body">
              <span class="lc-status" data-state="${esc(r.state)}">${esc(BOARD_WORD[r.state])}</span>
              <span class="lc-name">${esc(r.name)}</span>
              <span class="lc-feels">${esc(r.feels || '')}</span>
              <span class="lc-meta">${esc(r.duration || '')}${r.leadsTo ? `<br>${esc(r.leadsTo)}` : ''}</span>
              <span class="lc-next">${esc(r.status.text)}</span>
            </span>
          </button>`).join('')}
      </div>
      <p class="srcline">Listed alphabetically by short name, so the order means nothing. Figures checked ${esc(niceDate((api.data.pathways._meta || {}).accessed))}.</p>
    </div>`;
  },
};

export const dest = {
  id: 'dest',
  title: (q) => 'Destination',
  era: 'school',
  render(root, api) {
    const st = getState();
    const id = api.route().q.id;
    const c = api.ctx();
    const d = c.destinations.find((x) => x.id === id);
    if (!d) { api.nav('after', {}, { replace: true }); return; }
    document.title = `${d.name} · Paths`;
    const r = reach(c.plan, d, c);
    const rw = roleWords(st.role);
    const e = effective(st.plans, c.subjects);

    // Personal moves: the advice engine, filtered to this destination.
    let moves = [];
    if (e.yearId) {
      const a = advise({ yearId: e.yearId, plan: st.plans[e.yearId], ctx: c, offer: st.offer });
      moves = a.singles.filter((m) => m.opens.includes(r.railName) || m.nearer.includes(r.railName)).slice(0, 3);
      const pairs = a.pairs.filter((p) => p.opens.includes(r.railName)).slice(0, 1);
      moves = moves.concat(pairs);
    }

    // Scores, if targets are set.
    const g = api.data.grades;
    const names = Object.fromEntries(c.subjects.map((s) => [s.id, sayName(s)]));
    const scores = g && (Object.keys(st.grades.now).length || Object.keys(st.grades.target).length)
      ? report({ plan: c.plan, grades: st.grades, g, names }).map((a) => ({ a, d: a.dests.find((x) => x.id === id) })).filter((x) => x.d)
      : [];

    const fams = ((api.data.families || {}).destinations || {})[id] || [];
    const costs = ((api.data.money || {}).costs || []).filter((m) => (m.covers || []).includes(id));
    const routes = r.state === 'open' ? [] : (r.routes || []).slice(0, 3);

    root.innerHTML = `
    ${yearStrip('after', st)}
    <div class="wrap-narrow yearwrap">
      <p class="crumb"><button type="button" class="linkbtn" data-action="go" data-s="after">${icon('back')} All eight lines</button></p>
      <header class="linesign arrive" style="--lc:${LINE[r.state]}">
        <span class="ls-code" aria-hidden="true">${esc(DEST_CODE[id] || '')}</span>
        <div class="ls-body">
          <p class="ls-meta">${esc(r.duration || '')}${r.leadsTo ? ` · ${esc(r.leadsTo)}` : ''}</p>
          <h1>${esc(d.name)}</h1>
          ${r.feels ? `<p class="ls-feels">${esc(r.feels)}</p>` : ''}
        </div>
        <span class="ls-status" data-state="${esc(r.state)}">${esc(BOARD_WORD[r.state])}</span>
      </header>
      <p class="basis">${icon('train')} ${r.status.text !== STATE_WORD[r.state] ? `${esc(r.status.text)}. ` : ''}${esc(basisLine(api))}</p>

      ${moves.length ? `
      <section class="destsec">
        <h2 class="advh">${r.state === 'open' ? 'Already open. These would help too' : 'The moves that bring it closer'}</h2>
        <div class="ticketlist">${moves.map((m, i) => ticketHtml(m, { hero: i === 0 && r.state !== 'open' })).join('')}</div>
      </section>` : (r.state !== 'open' && !e.yearId ? `<p class="callout small">Set your levels on your year page and this shows the exact moves that bring ${esc(r.railName)} closer.</p>` : '')}

      <section class="destsec">
        <h2 class="advh">What it asks</h2>
        <ul class="asklist">
          ${(r.met || []).concat(r.gap || []).map((x) => `<li data-met="${x.satisfied}">${x.satisfied ? icon('check') : '<i class="dotq" aria-hidden="true"></i>'}<span>${decorate(esc(x.label))}${x.soft ? ' <span class="small">(usually)</span>' : ''}${x.status === 'provisional' ? ' <span class="src-chip provisional">to confirm</span>' : ''}</span><span class="small">${x.satisfied ? 'you have this' : 'not yet'}</span></li>`).join('')}
        </ul>
        ${(r.performance || []).map((p) => `<div class="rulerow"><p class="rulerow-label">${decorate(esc(p.label))}</p>${p.note ? `<p class="rulerow-note">${decorate(esc(p.note))}</p>` : ''}</div>`).join('')}
      </section>

      ${scores.length ? `
      <section class="destsec">
        <h2 class="advh">${icon('target')} Your score against it</h2>
        ${scores.map(({ a, d: x }) => {
          const ref = a.basis === 'target' ? a.target : a.now;
          return `<p><strong>${esc(a.name)}: ${ref.value == null ? 'not enough grades yet' : `${ref.value} (${a.basis})`}</strong> <span class="small">asks ${x.cutoff} or better.</span></p>
          ${ref.value != null ? `<p class="small">${ref.value <= x.cutoff ? `${icon('check')} Reached${x.gap < 0 ? `, with ${-x.gap} to spare` : ''}.` : (x.steps ? `${x.gap} to go: ${esc(listNames(x.steps.map((s) => `${s.name} ${s.from} to ${s.to}`)))} would do it.` : `${x.gap} to go.`)}</p>` : `<p class="small">${esc(ref.why || '')}</p>`}`;
        }).join('')}
        <p class="small"><button type="button" class="linkbtn" data-action="go" data-s="year" data-y="${esc(e.yearId && e.yearId !== 'sec1' && e.yearId !== 'sec2' ? e.yearId : 'sec3')}" data-tab="targets">Change targets</button></p>
      </section>` : ''}

      ${fams.length ? `
      <section class="destsec">
        <h2 class="advh">Course families</h2>
        ${st.families ? `
          <p class="small">What different groups of courses ask, and whether your levels already carry it. Provisional: 2028 lists arrive mid 2027.</p>
          <div class="famlist">${fams.map((f) => famHtml(f, c)).join('')}</div>
          <p class="small"><button type="button" class="linkbtn" data-action="dt-fam" data-on="0">Hide course families</button></p>` : `
          <p class="small">Each group of courses asks for different subjects. Off by default, because most students do not need this until Sec 3.</p>
          <button type="button" class="btn ghost small press" data-action="dt-fam" data-on="1">Show course families</button>`}
      </section>` : ''}

      ${routes.length ? `
      <section class="destsec">
        <h2 class="advh">Other roads to it</h2>
        <ul class="dest-plain">${routes.map((x) => `<li><strong>${esc(x.label)}</strong>${x.years ? ` · ${esc(String(x.years))} years` : ''}${x.honest ? `. ${esc(x.honest)}` : ''}</li>`).join('')}</ul>
      </section>` : ''}

      ${costs.length ? `
      <section class="destsec">
        <h2 class="advh">What it costs</h2>
        ${costs.map((m) => `<p><strong>${esc(m.fee)}</strong> <span class="small">${esc(m.label)}. ${esc(m.misc || '')}</span></p>`).join('')}
        <p class="small"><button type="button" class="linkbtn" data-action="go" data-s="money">Costs and the help that exists</button></p>
      </section>` : ''}

      <section class="destsec">
        <div class="saybox">
          <p class="caps">${icon('talk')} ${esc(rw.say)}</p>
          <p class="sayline">${esc(st.role === 'parent'
            ? `Ask your child: "What do you imagine a normal day at ${r.railName} looks like?"`
            : st.role === 'teacher'
              ? `Ask the student: "Have you seen ${r.railName} in person, at an open house or a course preview?"`
              : `Ask your ECG counsellor: "What is ${r.railName} actually like, day to day?"`)}</p>
        </div>
        <p class="small srcline">${r.dataStatus === 'provisional' ? 'Some figures are provisional. ' : ''}Checked ${esc(niceDate(r.asOf))}. Confirm anything that matters with your ECG counsellor and at moe.gov.sg.</p>
      </section>
    </div>`;

    onAction(root, {
      'dt-fam': (btn) => { setFamilies(btn.dataset.on === '1'); api.refresh(); },
    });
  },
};

function famHtml(f, c) {
  const plan = c.plan;
  const lv = { G1: 1, G2: 2, G3: 3 };
  const byId = Object.fromEntries(c.subjects.map((s) => [s.id, s]));
  return `<article class="famcard">
    <p class="famname">${esc(f.name)}</p>
    ${(f.needs || []).map((n) => {
      const ids = (n.subjects || []).filter((x) => byId[x]);
      const min = lv[n.minLevel] || 1;
      const have = ids.filter((x) => plan[x] && lv[plan[x]] >= min);
      return `<p class="famneed" data-have="${have.length > 0}">${have.length ? icon('check') : '<i class="dotq" aria-hidden="true"></i>'}
        <span>${esc(n.text)}${ids.length ? `<span class="small"> ${have.length
          ? `You take ${esc(listNames(have.map((x) => sayName(byId[x]))))}.`
          : `Would need one of: ${esc(listNames(ids.slice(0, 5).map((x) => sayName(byId[x])), 'or'))}${ids.length > 5 ? ' and others' : ''}${n.minLevel ? ` at ${esc(n.minLevel)}` : ''}.`}</span>` : ''}</span></p>`;
    }).join('')}
  </article>`;
}
