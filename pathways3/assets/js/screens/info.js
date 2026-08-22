// The three standalone info pages: money, work, schools.
//
// These are data shaped renderings. Every sentence of substance lives in
// data/money.json, data/work.json and data/schools.json, with their _meta,
// source and status discipline; this file only decides the order and the
// furniture. Two decisions carried over from the v2 audit: one provenance
// banner per page instead of a stamp on every row (the stamp became
// wallpaper), and no wall of sixteen identical cards on the work page (a
// fold per sector keeps the first glance to one sentence each).
//
// Nothing here renders a verdict on a student or on a family's money.
// money.json's own register is the guide: costs first, in full, then the
// help, then the sentences that matter more than either table.

import { getState, setSchoolKind } from '../state.js?v=3.0.0';
import { esc, onAction } from '../ui/dom.js?v=3.0.0';

function fmtDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso || '';
  return d.toLocaleDateString('en-SG', { day: 'numeric', month: 'long', year: 'numeric' });
}

function provline(text, accessed) {
  return `<p class="provline"><span class="caps">Provisional</span>
    <span>${esc(text)}${accessed ? ` Read on ${esc(fmtDate(accessed))}.` : ''}</span></p>`;
}

/* ---- money: costs and help ---------------------------------------------- */

export const money = {
  id: 'money',
  title: 'Costs and help',
  era: 'school',

  render(root, api) {
    const d = api.data.money || {};
    const meta = d._meta || {};
    const costs = d.costs || [];
    const help = d.help || [];
    const truths = d.truths || [];
    const thesis = truths[0] || null;
    const callouts = truths.slice(1, 4);

    root.innerHTML = `
    <div class="wrap-narrow">
      <header class="hero">
        <h1>${esc(api.copy('info.moneyHead', 'Costs and help'))}</h1>
        <p class="lede">${esc(thesis
          ? `${thesis.head}. Here is every cost in the open, and the help attached to each one.`
          : api.copy('info.moneyLede', 'Every cost in the open, and the help attached to each one.'))}</p>
      </header>

      ${provline('Every figure below is a band, not a quote, checked against the official fee and assistance pages this data names.', meta.accessed)}

      <section class="section" aria-label="What each road costs">
        <h2>${esc(api.copy('info.costsHead', 'What each road costs'))}</h2>
        <p class="small">${esc(api.copy('info.costsLede', 'Before any help. In Singapore dollars, for a Singapore Citizen. The help section below is longer than this one, which is the point.'))}</p>
        <div class="infogrid">
          ${costs.map((c) => `
          <article class="card infocard">
            <h3>${esc(c.label)}</h3>
            <p class="figure" style="margin:0">${esc(c.fee)}</p>
            <p class="subline" style="margin:2px 0 0">${esc(c.misc)}</p>
            <p class="small" style="margin:10px 0 0">${esc(c.note)}</p>
          </article>`).join('')}
        </div>
      </section>

      <section class="section" aria-label="The help">
        <h2>${esc(api.copy('info.helpHead', 'The help'))}</h2>
        <p class="small">${esc(api.copy('info.helpLede', 'Nine names. Almost none of this is offered unasked, so knowing the names is itself worth money.'))}</p>
        <ul class="movelist">
          ${help.map((h) => `
          <li class="move"><div>
            <p style="margin:0"><strong>${esc(h.label)}</strong></p>
            <p style="margin:4px 0 0">${esc(h.what)} <strong>${esc(h.howMuch)}</strong></p>
            <p class="small" style="margin:6px 0 0">${esc(h.who)} ${esc(h.howToGet)}</p>
          </div></li>`).join('')}
        </ul>
      </section>

      ${callouts.length ? `
      <section class="section" aria-label="What the tables mean">
        <h2>${esc(api.copy('info.truthsHead', 'What the tables add up to'))}</h2>
        ${callouts.map((t) => `
        <div class="notegood" style="margin:0 0 12px">
          <p style="margin:0"><strong>${esc(t.head)}.</strong> ${esc(t.body)}</p>
        </div>`).join('')}
      </section>` : ''}

      <p class="small" style="margin-top:8px">${esc(api.copy('info.moneyClose', 'These are figures to confirm, not to decide with. The ECG counsellor and the general office know exactly which forms apply to you, and moe.gov.sg holds the current numbers.'))}</p>
    </div>`;
  },
};

/* ---- work: the sixteen sectors ------------------------------------------ */

export const work = {
  id: 'work',
  title: 'The work itself',
  era: 'school',

  render(root, api) {
    const d = api.data.work || {};
    const meta = d._meta || {};
    const levelPay = d.levelPay || [];
    const sectors = d.sectors || [];
    const subjName = Object.fromEntries(
      ((api.data.subjects && api.data.subjects.subjects) || []).map((s) => [s.id, s.name]));

    root.innerHTML = `
    <div class="wrap-narrow">
      <header class="hero">
        <h1>${esc(api.copy('info.workHead', 'The work itself'))}</h1>
        <p class="lede">${esc(api.copy('info.workLede', 'Sixteen parts of working Singapore: what each one actually is, what a day in it looks like, and a real way in at more than one level.'))}</p>
      </header>

      ${provline('Pay bands come from the published graduate employment surveys. They describe first jobs, not ceilings.', meta.accessed)}

      <section class="section" aria-label="What pay actually does">
        <h2>${esc(api.copy('info.payHead', 'What pay actually does'))}</h2>
        <p class="small">${esc(api.copy('info.payLede', 'Pay is listed once per level of entry and never per sector. Comparing sectors on pay is a ranking wearing a dollar sign, and this page does not render one.'))}</p>
        <div class="infogrid">
          ${levelPay.map((p) => `
          <article class="card infocard">
            <h3>${esc(p.label)}</h3>
            <p class="figure" style="margin:0">${esc(p.band)}</p>
            <p class="subline" style="margin:2px 0 0">${esc(p.note)}</p>
          </article>`).join('')}
        </div>
        <p class="small" style="margin-top:12px">${esc(api.copy('info.payAfter', 'A level of entry is a starting rung, not a ceiling. Every sector below has ways in at three levels or more.'))}</p>
      </section>

      <section class="section" aria-label="Sixteen sectors">
        <h2>${esc(api.copy('info.sectorsHead', 'The sixteen'))}</h2>
        <p class="small">${esc(api.copy('info.sectorsOrder', 'A to Z, because any other order would be a ranking.'))}</p>
        <div class="infogrid">
          ${sectors.map((s) => sectorCard(s, subjName)).join('')}
        </div>
      </section>

      <p class="small" style="margin-top:8px">${esc(api.copy('info.workClose', 'Each fold ends with something to try this term. One afternoon inside a sector answers more than any page about it.'))}</p>
    </div>`;
  },
};

function sectorCard(s, subjName) {
  const subjects = (s.subjects || []).map((id) => subjName[id]).filter(Boolean);
  return `
  <article class="card infocard">
    <h3>${esc(s.label)}</h3>
    <p style="margin:0">${esc(s.isWhat)}</p>
    <details style="margin-top:10px">
      <summary><strong>${esc('A day in it')}</strong></summary>
      <p class="small" style="margin:10px 0 0">${(s.dayLooks || []).map(esc).join('. ')}.</p>
      <p class="caps" style="margin:14px 0 4px">Ways in</p>
      ${(s.entries || []).map((e) => `
      <p class="small" style="margin:0 0 6px"><strong>${esc(e.role)}.</strong> ${esc(e.route)}. ${esc(e.note)}</p>`).join('')}
      ${s.myth ? `<p style="margin:12px 0 0"><strong>The myth:</strong> ${esc(s.myth)}</p>` : ''}
      ${subjects.length ? `<p class="small" style="margin:12px 0 0">Subjects that feed this: ${subjects.map(esc).join(' · ')}.</p>` : ''}
      ${(s.thisTerm || []).length ? `<p class="small" style="margin:10px 0 0"><strong>This term:</strong> ${s.thisTerm.map(esc).join('. ')}.</p>` : ''}
    </details>
  </article>`;
}

/* ---- schools: the kind of school this actually is ------------------------ */

// Deliberately not a traffic light. Where the planner does not fit a road,
// that is a fact about this app, so it is worn in the same quiet weight as
// everything else and never in a warning colour.
const APPLIES = {
  fully: { tone: 'open', label: 'This whole tool fits here' },
  partly: { tone: 'quiet', label: 'Part of this tool fits here' },
  no: { tone: 'quiet', label: 'This tool does not model this road' },
};

export const schools = {
  id: 'schools',
  title: 'My kind of school',
  era: 'school',

  render(root, api) {
    const d = api.data.schools || {};
    const meta = d._meta || {};
    const kinds = d.kinds || [];
    const support = d.support || [];
    const mine = getState().schoolKind;
    const chosen = kinds.find((k) => k.id === mine) || null;

    root.innerHTML = `
    <div class="wrap-narrow">
      <header class="hero">
        <h1>${esc(api.copy('info.schoolsHead', 'My kind of school'))}</h1>
        <p class="lede">${esc(api.copy('info.schoolsLede', 'The rest of this tool makes one assumption: the common road, Sec 1 to 4 in a mainstream school, with the SEC exam at the end. That is most students, and it is not everybody. This page is where the assuming stops.'))}</p>
      </header>

      ${provline('Read against the MOE and SEAB pages named in the sources. Each school answers for itself, so ask the one you mean.', meta.accessed)}

      ${chosen ? `
      <div class="notegood" style="margin:16px 0 0">
        <p style="margin:0"><strong>Noted: ${esc(chosen.label.toLowerCase())}.</strong>
          ${esc(chosen.note)} This stays on this device, and tapping the same button again clears it.</p>
      </div>` : ''}

      <section class="section" aria-label="Kinds of secondary school">
        <h2>${esc(api.copy('info.kindsHead', 'Seven kinds of secondary school'))}</h2>
        <p class="small">${esc(api.copy('info.kindsLede', 'What each one is, what it sits, where it leads, and how much of this tool applies there. If one of them is yours, say so, and the tool stops assuming.'))}</p>
        <div class="infogrid">
          ${kinds.map((k) => kindCard(k, mine)).join('')}
        </div>
      </section>

      <section class="section" aria-label="Support that exists">
        <h2>${esc(api.copy('info.supportHead', 'Support that exists'))}</h2>
        <p class="small">${esc(api.copy('info.supportLede', 'Named one by one, because a thing without a name cannot be asked for.'))}</p>
        <ul class="movelist">
          ${support.map((s) => `
          <li class="move"><div>
            <p style="margin:0"><strong>${esc(s.label)}</strong></p>
            <p style="margin:4px 0 0">${esc(s.what)}</p>
            <p class="small" style="margin:6px 0 0">${esc(s.who)} ${esc(s.howToGet)}</p>
          </div></li>`).join('')}
        </ul>
      </section>

      <p class="small" style="margin-top:8px">${esc(api.copy('info.schoolsClose', 'A page can name things. Weighing them is a conversation with a person who knows you, and the ECG counsellor is that person. The room is usually empty at lunch.'))}</p>
    </div>`;

    onAction(root, {
      'in-kind': (btn) => {
        const id = btn.dataset.id;
        setSchoolKind(getState().schoolKind === id ? null : id);
        api.refresh();
      },
    });
  },
};

function kindCard(k, mine) {
  const held = mine === k.id;
  const a = APPLIES[k.appliesHere] || APPLIES.partly;
  return `
  <article class="card infocard">
    <h3>${esc(k.label)}</h3>
    <p class="small" style="margin:0 0 10px">${esc(k.examples)}</p>
    <p style="margin:0 0 8px"><span class="caps">The exam</span><br>${esc(k.sits)}</p>
    <p style="margin:0 0 8px"><span class="caps">Leads to</span><br>${esc(k.leadsTo)}</p>
    <p style="margin:0 0 6px"><span class="pill" data-tone="${esc(a.tone)}">${esc(a.label)}</span></p>
    <p class="small" style="margin:0 0 12px">${esc(k.note)}</p>
    <button type="button" class="btn ${held ? '' : 'ghost '}small" data-action="in-kind"
      data-id="${esc(k.id)}" aria-pressed="${held}"
      aria-label="${esc(k.label)}. This is my school.${held ? ' Chosen. Tap to clear.' : ''}">
      This is my school</button>
  </article>`;
}
