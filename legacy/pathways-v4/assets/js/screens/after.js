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

import { getState, setFamilies } from '../state.js?v=4.4.0';
import { reach } from '../engine/reach.js?v=4.4.0';
import { effective } from '../engine/years.js?v=4.4.0';
import { advise, listNames, sayName } from '../engine/advice.js?v=4.4.0';
import { report } from '../engine/grades.js?v=4.4.0';
import { openCount } from '../ui/map.js?v=4.4.0';
import { yearStrip } from '../ui/yearstrip.js?v=4.4.0';
import { sayMove, roleWords } from '../ui/talk.js?v=4.4.0';
import { ticketHtml } from '../ui/ticket.js?v=4.4.0';
import { boardWord } from '../ui/board.js?v=4.4.0';
import { DEST_CODE } from '../ui/signal.js?v=4.4.0';
import { t, isShort, stateWord } from '../ui/labels.js?v=4.4.0';
import { decorate } from '../ui/glossary.js?v=4.4.0';
import { esc, onAction } from '../ui/dom.js?v=4.4.0';
import { icon } from '../ui/icons.js?v=4.4.0';

const YEAR_LABEL = { sec1: 'Sec 1', sec2: 'Sec 2', sec3: 'Sec 3', sec4: 'Sec 4', sec5: 'Sec 5' };
const STATE_WORD = new Proxy({}, { get: (_, k) => stateWord(String(k)) });
const LINE = { 'open': 'var(--line-open)', 'within-reach': 'var(--line-within)', 'longer-route': 'var(--line-longer)', 'other-route': 'var(--line-other)' };

function rowsNow(api) {
  const c = api.ctx();
  return c.destinations.map((d) => reach(c.plan, d, c));
}

function basisLine(api) {
  const e = effective(getState().plans, api.ctx().subjects);
  if (!e.yearId) return 'No levels set yet. Set your levels to see where you stand.';
  if (e.yearId === 'sec1' || e.yearId === 'sec2') return `From your ${YEAR_LABEL[e.yearId]} levels. Admission reads your SEC results; these levels shape your Sec 3 subjects.`;
  return `From your ${YEAR_LABEL[e.yearId]} levels.`;
}

/** A destination section: open in Detailed wording, one tap away in Short. */
function destSec(title, body) {
  return isShort()
    ? `<details class="fold destsec"><summary>${esc(title)}</summary>${body}</details>`
    : `<section class="destsec"><h2 class="advh">${esc(title)}</h2>${body}</section>`;
}

function perfHtml(r) {
  return (r.performance || []).map((p) => `<div class="rulerow"><p class="rulerow-label">${decorate(esc(p.label))}</p>${p.note ? `<p class="rulerow-note">${decorate(esc(p.note))}</p>` : ''}</div>`).join('');
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
          <h1>${esc(t('afterTitle'))}</h1>
          <p class="sign-lede">Your levels decide how many moves each place needs.</p>
        </div>
      </header>
      <p class="basis">${icon('train')} ${esc(basisLine(api))} <b>${open} of ${rows.length}</b> open on that plan.</p>
      <div class="linegrid">
        ${rows.map((r, i) => `
          <button type="button" class="linecard press arrive" style="--lc:${LINE[r.state]};animation-delay:${Math.min(i, 7) * 40}ms" data-action="go" data-s="dest" data-id="${esc(r.id)}">
            <span class="lc-band" aria-hidden="true"><span class="lc-code">${esc(DEST_CODE[r.id] || '')}</span></span>
            <span class="lc-body">
              <span class="lc-status" data-state="${esc(r.state)}">${esc(boardWord(r))}</span>
              <span class="lc-name">${esc(r.name)}</span>
              <span class="lc-feels">${esc(r.feels || '')}</span>
              <span class="lc-meta">${esc(r.duration || '')}${r.leadsTo ? `<br>${esc(r.leadsTo)}` : ''}</span>
              <span class="lc-next">${esc(r.status.text)}</span>
            </span>
          </button>`).join('')}
      </div>
      <p class="srcline">Listed in alphabetical order. Figures checked ${esc(niceDate((api.data.pathways._meta || {}).accessed))}.</p>
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
      const a = advise({ yearId: e.yearId, plan: st.plans[e.yearId], ctx: c });
      moves = a.singles.filter((m) => m.opens.includes(r.railName) || m.nearer.includes(r.railName)).slice(0, 3);
      const pairs = a.pairs.filter((p) => p.opens.includes(r.railName)).slice(0, 1);
      moves = moves.concat(pairs);
      // Short wording: the one move that helps most; Detailed lists them all.
      if (isShort()) moves = moves.slice(0, 1);
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
      <p class="crumb"><button type="button" class="linkbtn" data-action="go" data-s="after">${icon('back')} ${esc(t('allPlaces'))}</button></p>
      <header class="linesign arrive" style="--lc:${LINE[r.state]}">
        <span class="ls-code" aria-hidden="true">${esc(DEST_CODE[id] || '')}</span>
        <div class="ls-body">
          <p class="ls-meta">${esc(r.duration || '')}${r.leadsTo ? ` · ${esc(r.leadsTo)}` : ''}</p>
          <h1>${esc(d.name)}</h1>
          ${r.feels ? `<p class="ls-feels">${esc(r.feels)}</p>` : ''}
        </div>
        <span class="ls-status" data-state="${esc(r.state)}">${esc(boardWord(r))}</span>
      </header>
      <p class="basis">${icon('train')} ${r.status.text !== STATE_WORD[r.state] && r.status.text !== boardWord(r) ? `${esc(r.status.text)}. ` : ''}${esc(basisLine(api))}</p>

      ${moves.length ? `
      <section class="destsec">
        <h2 class="advh">${r.state === 'open' ? (r.lens === 'lower' ? 'Already on track. These moves also help' : 'Already open. These moves also help') : 'Moves that bring it closer'}</h2>
        <div class="ticketlist">${moves.map((m, i) => ticketHtml(m, { hero: i === 0 && r.state !== 'open' })).join('')}</div>
      </section>` : (r.state !== 'open' && !e.yearId ? `<p class="callout small">Set your levels on the Subjects page to see the moves that bring ${esc(r.railName)} closer.</p>` : '')}

      <section class="destsec">
        <h2 class="advh">${r.lens === 'lower' ? `What it asks of your ${esc(YEAR_LABEL[e.yearId] || 'Sec 1 and 2')} levels` : 'What it asks'}</h2>
        <ul class="asklist">
          ${(r.met || []).concat(r.gap || []).map((x) => `<li data-met="${x.satisfied}">${x.satisfied ? icon('check') : '<i class="dotq" aria-hidden="true"></i>'}<span>${decorate(esc(x.label))}${x.soft ? ' <span class="small">(usually)</span>' : ''}${x.status === 'provisional' ? ' <span class="src-chip provisional">to confirm</span>' : ''}</span><span class="small">${x.satisfied ? 'you have this' : 'not yet'}</span></li>`).join('')}
        </ul>
        ${r.lens === 'lower' ? (r.horizon ? `<p class="small">${decorate(esc(r.horizon))}</p>` : '') : (isShort() ? '' : perfHtml(r))}
      </section>
      ${r.lens === 'lower' ? destSec('In the SEC, at the end of Sec 4', `
        <ul class="asklist">
          ${(d.structural || []).map((x) => `<li data-met="false"><i class="dotq" aria-hidden="true"></i><span>${decorate(esc(x.label))}${x.soft ? ' <span class="small">(usually)</span>' : ''}${x.status === 'provisional' ? ' <span class="src-chip provisional">to confirm</span>' : ''}</span></li>`).join('')}
        </ul>
        ${perfHtml(r)}`) : (isShort() && (r.performance || []).length ? destSec('Scores it reads', perfHtml(r)) : '')}

      ${scores.length ? `
      <section class="destsec">
        <h2 class="advh">${icon('target')} Your score against it</h2>
        ${scores.map(({ a, d: x }) => {
          const ref = a.basis === 'target' ? a.target : a.now;
          return `<p><strong>${esc(a.name)}: ${ref.value == null ? 'not enough grades yet' : `${ref.value} (${a.basis})`}</strong> <span class="small">asks ${x.cutoff} or better.</span></p>
          ${ref.value != null ? `<p class="small">${x.value != null && x.value !== ref.value ? `Reads ${x.value} here. ` : ''}${x.meets ? `${icon('check')} ${x.via ? esc(x.via) : `Reached${x.gap < 0 ? `, with ${-x.gap} to spare` : ''}`}.` : (x.via ? `${esc(x.via)}.` : (x.steps ? `${x.gap} to go: ${esc(listNames(x.steps.map((s) => `${s.name} ${s.from} to ${s.to}`)))} would do it.` : (x.gap != null ? `${x.gap} to go.` : esc(x.why || x.note || ''))))}</p>` : `<p class="small">${esc(ref.why || '')}</p>`}`;
        }).join('')}
        <p class="small"><button type="button" class="linkbtn" data-action="go" data-s="year" data-y="${esc(e.yearId && e.yearId !== 'sec1' && e.yearId !== 'sec2' ? e.yearId : 'sec3')}" data-tab="targets">Change targets</button></p>
      </section>` : ''}

      ${fams.length ? destSec('Course families', st.families ? `
          <p class="small">What each group of courses asks for, and whether your levels meet it. To be confirmed: the 2028 lists arrive in mid 2027.</p>
          <div class="famlist">${fams.map((f) => famHtml(f, c)).join('')}</div>
          <p class="small"><button type="button" class="linkbtn" data-action="dt-fam" data-on="0">Hide course families</button></p>` : `
          <p class="small">Each group of courses asks for different subjects. Most students need this from Sec 3.</p>
          <button type="button" class="btn ghost small press" data-action="dt-fam" data-on="1">Show course families</button>`) : ''}

      ${routes.length ? destSec('Other routes in', `
        <ul class="dest-plain">${routes.map((x) => `<li><strong>${esc(x.label)}</strong>${x.years ? ` · ${esc(String(x.years))} years` : ''}${x.honest ? `. ${esc(x.honest)}` : ''}</li>`).join('')}</ul>`) : ''}

      ${costs.length ? destSec('What it costs', `
        ${costs.map((m) => `<p><strong>${esc(m.fee)}</strong> <span class="small">${esc(m.label)}. ${esc(m.misc || '')}</span></p>`).join('')}
        <p class="small"><button type="button" class="linkbtn" data-action="go" data-s="money">Fees and financial help</button></p>`) : ''}

      <section class="destsec">
        <div class="saybox">
          <p class="caps">${icon('talk')} ${esc(rw.say)}</p>
          <p class="sayline">${esc(st.role === 'parent'
            ? `Ask your child: "What do you think a normal day at ${r.railName} is like?"`
            : st.role === 'teacher'
              ? `Ask the student: "Have you seen ${r.railName} in person, at an open house or a course preview?"`
              : `Ask your ECG counsellor: "What is a normal day at ${r.railName} like?"`)}</p>
        </div>
        <p class="small srcline">${r.dataStatus === 'provisional' ? 'Some figures are provisional. ' : ''}Checked ${esc(niceDate(r.asOf))}. Check important details with your ECG counsellor and at moe.gov.sg.</p>
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
