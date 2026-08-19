// The school a student is actually in, ?mode=schools.
//
// WHY THIS PAGE HAD TO EXIST. Every other screen assumes one student: in a
// government or government aided secondary school, under Full Subject Based
// Banding, sitting the SEC at the end of four years. That is most of a cohort and
// it is not all of it. A student at Spectra is working toward an ITE Skills
// Certificate that appears nowhere else in the app. A student at NUS High will
// never sit the SEC. A student in an Integrated Programme skips the exam the whole
// planner is built around. A student in a special education school is not
// addressed by one word of it.
//
// Those are precisely the students most likely to have been told, in one way or
// another, that something is not for them. A careers tool that silently assumes
// them away is doing the same thing more politely.
//
// WHAT THIS PAGE REFUSES TO BE. A pretend specialist. This build has no business
// advising on special educational needs and a page that tried would be worse than
// none. So it does three things it can do honestly: names every kind of secondary
// school and what it actually leads to, says out loud where the app's own planner
// stops applying, and names the people and the schemes so a family knows what to
// ask for. The badge on each school is the load bearing element: a road the
// planner does not fit says so, beside what to use instead.

import { esc, onAction } from '../components/dom.js?v=2.14.0';
import { icon } from '../components/icons.js?v=2.14.0';
import { decorate, bindGlossary } from '../components/glossary.js?v=2.14.0';
import { openSheet, onSheetAction, close as closeSheet } from '../components/sheet.js?v=2.14.0';
import { getState, setSchoolKind } from '../state.js?v=2.14.0';

// Deliberately not a traffic light. "Not this app" is a fact about the app, not a
// verdict on the student, so it is rendered in the same neutral weight as the
// other two and never in a warning colour.
const APPLIES = {
  fully: { label: 'The planner fits this', cls: 'ap-full' },
  partly: { label: 'Part of the app fits this', cls: 'ap-part' },
  no: { label: 'This app does not model this road', cls: 'ap-none' },
};

function kindCard(k, mine) {
  const a = APPLIES[k.appliesHere] || APPLIES.partly;
  const on = mine === k.id;
  return `
    <li>
      <button class="future-btn${on ? ' on' : ''}" type="button" data-action="kind" data-id="${k.id}" aria-haspopup="dialog">
        <span class="want">${esc(k.label)}</span>
        <span class="small mute" style="display:block;margin-top:var(--s-2)">${esc(k.examples)}</span>
        <span class="chip-row">
          <span class="applies ${a.cls}">${esc(a.label)}</span>
          ${on ? '<span class="kind-chip">This is mine</span>' : ''}
        </span>
      </button>
    </li>`;
}

function openKind(data, id, trigger, mine, repaint) {
  const k = ((data.schools && data.schools.kinds) || []).find((x) => x.id === id);
  if (!k) return;
  const a = APPLIES[k.appliesHere] || APPLIES.partly;
  const src = ((data.schools && data.schools.sources) || {})[k.sourceRef] || '';
  const body = openSheet(`
    <h2 id="sheet-title">${esc(k.label)}</h2>
    <p>${decorate(k.examples)}</p>
    <dl class="framedl">
      <dt>What is sat at the end</dt><dd>${decorate(k.sits)}</dd>
      <dt>Where it leads</dt><dd>${decorate(k.leadsTo)}</dd>
      <dt>How much of this app fits</dt><dd><span class="applies ${a.cls}">${esc(a.label)}</span></dd>
      <dt>Which means</dt><dd>${decorate(k.note)}</dd>
    </dl>
    <span class="cprov">Not yet verified</span>
    <p class="micro faint" style="margin-top:var(--s-3)">${esc(src)}</p>`, trigger,
  // In the pinned foot, because it is the one thing on this sheet a student might
  // DO, and a sheet whose point is a button put that button below the fold once
  // before.
  mine === k.id
    ? `<button class="btn ghost small" type="button" data-action="unclaim">${esc('This is not mine after all')}</button>`
    : `<button class="btn small" type="button" data-action="claim" data-id="${k.id}">${esc('This is the school I am in')}</button>`);
  bindGlossary(body);
  onSheetAction({
    claim: (b) => { setSchoolKind(b.dataset.id); closeSheet(); repaint(); },
    unclaim: () => { setSchoolKind(null); closeSheet(); repaint(); },
  });
}

function openSupport(data, id, trigger) {
  const s = ((data.schools && data.schools.support) || []).find((x) => x.id === id);
  if (!s) return;
  const src = ((data.schools && data.schools.sources) || {})[s.sourceRef] || '';
  const body = openSheet(`
    <h2 id="sheet-title">${esc(s.label)}</h2>
    <p>${decorate(s.what)}</p>
    <dl class="framedl">
      <dt>Who it is for</dt><dd>${decorate(s.who)}</dd>
      <dt>How to ask for it</dt><dd>${decorate(s.howToGet)}</dd>
      <dt>Worth knowing</dt><dd>${decorate(s.note)}</dd>
    </dl>
    <span class="cprov">Not yet verified</span>
    <p class="micro faint" style="margin-top:var(--s-3)">${esc(src)}</p>
    <p class="micro mute">This app names what exists and does not advise on it. The school and the named agency are where the actual answer is.</p>`, trigger);
  bindGlossary(body);
  onSheetAction({});
}

export function renderSchools(host, data, repaint) {
  const s = data.schools || {};
  const meta = s._meta || {};
  const mine = getState().schoolKind;
  host.innerHTML = `
    <div class="wrap narrow">
      <div class="section fade-up" style="margin-top:var(--s-6)">
        <p class="caps">Before anything else</p>
        <h1 class="serif" style="font-size:var(--t-hero);line-height:var(--lh-hero)">The school I am actually in.</h1>
        <p class="lede" style="margin-top:var(--s-3);max-width:47ch">The rest of this app assumes one road: a government or government aided school, Full Subject Based Banding, the SEC at sixteen. That is most people and it is not everybody. Here is every kind, and how much of this app fits each one.</p>

        <section class="section">
          <h2 class="h-sm">${icon('q_where')} Seven kinds of secondary school</h2>
          <ul class="helplist" style="margin-top:var(--s-3)">
            ${(s.kinds || []).map((k) => kindCard(k, mine)).join('')}
          </ul>
          <p class="micro mute" style="margin-top:var(--s-3)">Where it says this app does not model a road, that is a fact about the app. Every one of these roads leads somewhere, and the last column says what to use instead.</p>
        </section>

        <section class="section">
          <h2 class="h-sm">${icon('q_who')} If I need school to work differently</h2>
          <p class="small mute" style="max-width:48ch">Named, not advised on. This build has no business giving guidance on special educational needs, so each of these says what it is, who it is for and how to ask, and then stops.</p>
          <ul class="helplist" style="margin-top:var(--s-3)">
            ${(s.support || []).map((x) => `
              <li>
                <button class="future-btn" type="button" data-action="support" data-id="${x.id}" aria-haspopup="dialog">
                  <span class="want">${esc(x.label)}</span>
                  <span class="small mute" style="display:block;margin-top:var(--s-2)">${esc(x.what)}</span>
                  <span class="chip-row"><span class="kind-chip">${esc(x.howToGet.split('.')[0])}</span></span>
                </button>
              </li>`).join('')}
          </ul>
        </section>

        <p class="micro faint" style="margin-top:var(--s-5)">${esc(meta.source || '')}</p>
        <p class="micro faint">Every row needs checking against the named page. None of this is official advice.</p>

        <div class="btn-row" style="margin-top:var(--s-5)">
          <button class="btn ghost" type="button" data-action="print">Print this page</button>
          <a class="btn ghost" href="./?mode=work">What the work is</a>
          <a class="btn ghost" href="./">Back to the tool</a>
        </div>
      </div>
    </div>`;
  bindGlossary(host);
  onAction(host, {
    kind: (btn) => openKind(data, btn.dataset.id, btn, mine, repaint || (() => renderSchools(host, data, repaint))),
    support: (btn) => openSupport(data, btn.dataset.id, btn),
    print: () => window.print(),
  });
}

/**
 * The line that has to appear where the app makes its assumption.
 *
 * Put on the Plan screen, next to the subject planner, because that is the exact
 * screen a student in a specialised school or an Integrated Programme opens and
 * finds does not describe them. Saying it there costs one line and is the
 * difference between a tool that assumed them away and one that noticed.
 */
export function notMyRoadLink(data) {
  const kinds = (data.schools || {}).kinds || [];
  if (!kinds.length) return '';
  // Once a student has said which school they are in, the line stops being a
  // disclaimer they read past every visit and becomes an acknowledgement. A
  // student in a school the planner does not fit gets told so here, once, plainly,
  // rather than discovering it by working through a planner built for somebody
  // else.
  const mine = kinds.find((k) => k.id === getState().schoolKind);
  if (!mine) {
    return `<p class="micro mute notmyroad"><a href="./?mode=schools">This assumes the SEC at sixteen. If my school works differently, start here.</a></p>`;
  }
  const fit = { fully: 'and this planner is built for it', partly: 'so parts of this planner do not apply to me', no: 'and this planner does not model that road' }[mine.appliesHere];
  const named = mine.label.charAt(0).toLowerCase() + mine.label.slice(1);
  return `<p class="micro mute notmyroad">I said I am in ${esc(named)}, ${esc(fit)}. <a href="./?mode=schools">Change that</a></p>`;
}
