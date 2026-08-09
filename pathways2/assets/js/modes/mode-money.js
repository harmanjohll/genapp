// The money question, ?mode=money, and the block the parent page shows.
//
// WHY THIS IS THE MOST CONSEQUENTIAL PAGE IN THE APP. Every other page answers a
// question somebody has already decided to ask. This one answers the question
// that stops the asking: a family who has quietly concluded a route is
// unaffordable does not raise it with the counsellor, does not appear in any
// statistic, and never finds out they were wrong. The deciding happens at a
// kitchen table weeks before anybody at school hears about it, which makes a
// wrong belief about money the most reliable way a door gets closed that the
// system itself left open.
//
// SO THE ORDER OF THE PAGE IS THE ARGUMENT. Cost first, in full, with nothing
// softened, because a page that opened with reassurance reads as a sales pitch
// and gets closed. Then what help exists, which is the part families
// underestimate by the largest margin. Then four sentences that matter more than
// either table. Reversing that order would be more comfortable and would not
// work.
//
// The tables are printable on purpose. A parent who takes one page to a general
// office holding the names of the schemes gets a different conversation than a
// parent who arrives asking whether there is any help.

import { esc, onAction } from '../components/dom.js?v=2.8.0';
import { icon } from '../components/icons.js?v=2.8.0';
import { decorate, bindGlossary } from '../components/glossary.js?v=2.8.0';
import { openSheet, onSheetAction } from '../components/sheet.js?v=2.8.0';

const PROV = '<span class="cprov">Not yet verified</span>';

/** What each route costs, before any help. */
function costTable(data) {
  const rows = (data.money && data.money.costs) || [];
  return `
    <div class="ctable-wrap">
      <table class="ctable moneytable">
        <caption class="sr-only">What each route costs a Singapore Citizen before any assistance</caption>
        <thead><tr><th>Route</th><th>Fee</th><th>And</th></tr></thead>
        <tbody>
          ${rows.map((r) => `
            <tr>
              <th scope="row">${esc(r.label)}<span class="cmute">${esc(r.note)}</span></th>
              <td data-label="Fee"><span class="pay-band">${esc(r.fee)}</span> ${PROV}</td>
              <td data-label="And" class="cmute">${esc(r.misc)}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

/** What help exists. The part families underestimate most. */
function helpList(data) {
  const rows = (data.money && data.money.help) || [];
  return `
    <ul class="helplist">
      ${rows.map((h) => `
        <li>
          <button class="future-btn" type="button" data-action="help" data-id="${h.id}" aria-haspopup="dialog">
            <span class="want">${esc(h.label)}</span>
            <span class="small mute" style="display:block;margin-top:var(--s-2)">${esc(h.what)}</span>
            <span class="chip-row"><span class="kind-chip">${esc(h.howToGet.split('.')[0])}</span></span>
          </button>
        </li>`).join('')}
    </ul>`;
}

function openHelpSheet(data, id, trigger) {
  const h = ((data.money && data.money.help) || []).find((x) => x.id === id);
  if (!h) return;
  const src = ((data.money && data.money.sources) || {})[h.sourceRef] || '';
  const body = openSheet(`
    <h2 id="sheet-title">${esc(h.label)}</h2>
    <p>${decorate(h.what)}</p>
    <dl class="helpdl">
      <dt>Who it is for</dt><dd>${decorate(h.who)}</dd>
      <dt>How much</dt><dd>${decorate(h.howMuch)}</dd>
      <dt>How to get it</dt><dd>${decorate(h.howToGet)}</dd>
    </dl>
    ${PROV}
    <p class="micro faint" style="margin-top:var(--s-3)">${esc(src)}</p>
    <p class="micro mute">Confirm the current criteria with the school's general office or the institution. This page is a list of names to ask about, not a decision about anybody.</p>`, trigger);
  bindGlossary(body);
  onSheetAction({});
}

/** The four sentences. These are the guidance; the tables are the evidence. */
function truthBlock(data) {
  const t = (data.money && data.money.truths) || [];
  if (!t.length) return '';
  return `
    <div class="truths">
      ${t.map((x) => `
        <div class="truth">
          <p class="truth-head serif">${esc(x.head)}</p>
          <p class="small">${decorate(x.body)}</p>
        </div>`).join('')}
    </div>`;
}

export function renderMoney(host, data) {
  const meta = (data.money && data.money._meta) || {};
  host.innerHTML = `
    <div class="wrap narrow">
      <div class="section fade-up" style="margin-top:var(--s-6)">
        <p class="caps">The question that stops the asking</p>
        <h1 class="serif" style="font-size:var(--t-hero);line-height:var(--lh-hero)">What it costs, and what help there is.</h1>
        <p class="lede" style="margin-top:var(--s-3);max-width:46ch">A family that decides a route is unaffordable without asking has closed a door the system left open. Here is the cost, then here is the help, in that order.</p>

        <section class="section">
          <h2 class="h-sm">${icon('q_how')} What it costs, before any help</h2>
          <p class="small mute">For a Singapore Citizen. Every figure needs checking against the source below, because fee schedules change every year.</p>
          ${costTable(data)}
        </section>

        <section class="section">
          <h2 class="h-sm">${icon('q_where')} What help exists</h2>
          <p class="small mute">Almost all of it is applied for once, on a form, early in the year. Nobody offers it, which is why the names are worth knowing.</p>
          ${helpList(data)}
        </section>

        <section class="section">
          <h2 class="h-sm">What is true whatever the numbers say</h2>
          ${truthBlock(data)}
        </section>

        <p class="micro faint" style="margin-top:var(--s-5)">${esc(meta.source || '')}</p>
        <p class="micro faint">Checked against those pages on ${esc(meta.accessed || '')}. Nothing here is a decision about any family, and none of it is official advice.</p>

        <div class="btn-row" style="margin-top:var(--s-5)">
          <button class="btn ghost" type="button" data-action="print">Print this page</button>
          <a class="btn ghost" href="./">Back to the tool</a>
        </div>
      </div>
    </div>`;
  bindGlossary(host);
  onAction(host, {
    help: (btn) => openHelpSheet(data, btn.dataset.id, btn),
    print: () => window.print(),
  });
}

/**
 * The block the parent page shows: the cheapest true thing to say, and a way in.
 *
 * Deliberately not the whole table. The parent page is one calm page and the
 * money question deserves its own, so this says the one fact that changes a
 * family's behaviour and then gets out of the way.
 */
export function parentMoneyBlock(data) {
  const help = (data.money && data.money.help) || [];
  if (!help.length) return '';
  const first = (data.money.truths || [])[0];
  return `
    <section class="section aim-linked">
      <h2 class="h-sm">${icon('q_how')} The money question</h2>
      ${first ? `<p><strong>${esc(first.head)}.</strong> ${esc(first.body)}</p>` : ''}
      <p class="small mute">${help.length} kinds of help exist, from the school's own welfare fund to bursaries, loans and the account already in your child's name.</p>
      <p class="small"><a href="./?mode=money">What each route costs, and every scheme by name</a></p>
    </section>`;
}

/**
 * One line for a destination sheet in Plan: what this route costs.
 *
 * A student looking at Polytechnic and wondering about the fee should not have to
 * find another page to get the number, and a route with no number beside it is
 * the silence a family fills with a guess that is always too high.
 */
export function costLineFor(data, destId) {
  const row = ((data.money && data.money.costs) || []).find((c) => (c.covers || []).includes(destId));
  if (!row) return '';
  return `
    <p class="small costline">
      <strong>${esc(row.fee)}</strong> for a Singapore Citizen, before any help. ${esc(row.misc)}.
      ${PROV}
      <a href="./?mode=money">What help there is</a>
    </p>`;
}
