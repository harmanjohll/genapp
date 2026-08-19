// The world of work, ?mode=work, and the sector sheet the other modes open.
//
// WHY IT IS SECTORS AND NOT JOB TITLES. Naming jobs to a fourteen year old
// invites them to rule things in and out on prestige and on who they picture
// doing the work, which is the circumscription Gottfredson describes and the
// exact reason futures.json states wants instead. A sector is bigger than a job
// title and smaller than the economy, and it is the level at which the useful
// fact lives: healthcare hires Higher Nitec holders, diploma holders and degree
// holders, all year, every year, and people move between those three for decades.
//
// SO EVERY CARD IS THE SAME SHAPE, ON PURPOSE. What the work is, what a day
// contains, then three or four real doors in at different levels, then the
// certification that actually moves somebody once inside, then where the work is
// heading, then the local myth about it. A student who reads two of these has
// learned the shape of the argument without being told it.
//
// PAY APPEARS ONCE, at the top, per level of entry, and never per sector. Per
// sector figures would be dozens of numbers this build cannot defend, and
// ranking sectors by pay is a prestige ladder wearing a dollar sign.

import { esc, onAction } from '../components/dom.js?v=2.14.0';
import { icon } from '../components/icons.js?v=2.14.0';
import { decorate, bindGlossary } from '../components/glossary.js?v=2.14.0';
import { openSheet, onSheetAction } from '../components/sheet.js?v=2.14.0';
import { getState } from '../state.js?v=2.14.0';

const LEVEL_LABEL = {
  ite: 'From ITE', poly: 'From a polytechnic', arts: 'From an arts school', uni: 'From a university',
};
const LETTER_WORD = {
  R: 'making and fixing', I: 'working things out', A: 'creating',
  S: 'helping people', E: 'persuading and running', C: 'organising',
};

const sectorsFor = (data, { letter, family } = {}) => {
  const all = (data.work && data.work.sectors) || [];
  if (letter) return all.filter((s) => (s.riasec || []).includes(letter));
  if (family) return all.filter((s) => (s.families || []).includes(family));
  return all;
};

/**
 * The pay ladder, stated once.
 *
 * Every row is marked as not yet checked, in the same words the admissions
 * figures use, because a parent will quote whichever number they read and the
 * honest thing is to say which ones have been verified. The note under the
 * degree row is the one that matters most: the spread inside a level is wider
 * than the gap between levels, which is the whole reason this app refuses to
 * treat a level of entry as a ceiling.
 */
function payLadder(data) {
  const rows = (data.work && data.work.levelPay) || [];
  if (!rows.length) return '';
  return `
    <div class="panel" style="margin-top:var(--s-5)">
      <p class="caps">${icon('q_how')}What a first job pays</p>
      <p class="small mute" style="max-width:52ch">Bands, not promises, and the same figure for every sector. What somebody is paid depends far more on the work and the certifications than on which of these rows they started in.</p>
      <ul class="paylist">
        ${rows.map((r) => `
          <li>
            <span class="pay-when">${esc(r.label)}</span>
            <span class="pay-band">${esc(r.band)}</span>
            <span class="pay-note">${esc(r.note)}</span>
            ${r.status === 'provisional' ? '<span class="cprov">Not yet verified</span>' : ''}
          </li>`).join('')}
      </ul>
      <p class="micro faint" style="margin-top:var(--s-3)">${esc((data.work._meta || {}).source || '')}</p>
    </div>`;
}

/** One sector, as a card in the list. */
function sectorCard(s) {
  const levels = [...new Set((s.entries || []).map((e) => e.level))];
  return `
    <li>
      <button class="future-btn worksec" type="button" data-action="sector" data-id="${s.id}" aria-haspopup="dialog">
        <span class="want">${esc(s.label)}</span>
        <span class="small mute" style="display:block;margin-top:var(--s-2)">${esc(s.isWhat)}</span>
        <span class="chip-row">
          ${levels.map((l) => `<span class="kind-chip">${esc(LEVEL_LABEL[l] || l)}</span>`).join('')}
        </span>
      </button>
    </li>`;
}

/**
 * The sector sheet. Exported, because AIM opens it from a want and NOW opens it
 * from a subject, and three copies of this markup would drift within a term.
 */
export function openSectorSheet(data, id, trigger) {
  const s = ((data.work && data.work.sectors) || []).find((x) => x.id === id);
  if (!s) return;
  const body = openSheet(`
    <h2 id="sheet-title">${esc(s.label)}</h2>
    <p>${decorate(s.isWhat)}</p>

    <p class="caps" style="margin-top:var(--s-4)">Some of what a day holds</p>
    <ul class="chips">${(s.dayLooks || []).map((d) => `<li>${esc(d)}</li>`).join('')}</ul>

    <p class="caps" style="margin-top:var(--s-4)">${icon('q_where')}Ways in, all of them real</p>
    <ul class="doorlist">
      ${(s.entries || []).map((e) => `
        <li>
          <span class="door-level">${esc(LEVEL_LABEL[e.level] || e.level)}</span>
          <span class="door-role">${esc(e.role)}</span>
          <span class="door-route">${decorate(e.route)}</span>
          <span class="door-note">${esc(e.note)}</span>
        </li>`).join('')}
    </ul>
    <p class="micro mute">None of these is the real one. People move between them, and a lot of people use more than one over a working life.</p>

    <p class="caps" style="margin-top:var(--s-4)">What moves somebody once they are in</p>
    <p class="small">${decorate(s.licence)}</p>

    <p class="caps" style="margin-top:var(--s-4)">Where the work is going</p>
    <p class="small">${decorate(s.moving)}</p>

    <div class="mythbox">
      <p class="caps">What people get wrong about it</p>
      <p class="small">${decorate(s.myth)}</p>
    </div>

    <p class="caps" style="margin-top:var(--s-4)">If I wanted to find out for myself</p>
    <ul class="chips">${(s.thisTerm || []).map((t) => `<li>${esc(t)}</li>`).join('')}</ul>

    <p class="micro faint" style="margin-top:var(--s-4)">Sector shapes from the SkillsFuture Skills Frameworks. Nothing here is a prediction about one person.</p>`, trigger);
  bindGlossary(body);
  onSheetAction({});
}

/**
 * WHAT THE DEVICE ALREADY KNOWS, USED.
 *
 * Sixteen sectors in alphabetical order is honest and it is also sixteen identical
 * cards, and a student who has already set a subject plan and played a road has
 * told the app plenty about where to start reading. So the page keeps the
 * alphabetical list underneath, unchanged, and puts a short row on top of the
 * sectors their own subjects point at.
 *
 * It ADDS and never removes, which is the same rule the want block follows and the
 * reason it is safe. Nothing drops out of the full list, nothing is marked as
 * unsuitable, and a plan is a reason to look first rather than a reason to look
 * only. A student with no plan sees the page exactly as it was.
 */
function mineBlock(data, st) {
  const plan = Object.keys(st.plan || {});
  const runs = st.runs || [];
  const road = (runs.length && runs[runs.length - 1].path) || null;
  const all = sectorsFor(data);

  // Score by how many of my subjects a sector names, then by whether the road I
  // actually played leads there. Ties keep alphabetical order, so the ranking is
  // never finer than the evidence for it.
  const scored = all.map((s) => {
    const subj = (s.subjects || []).filter((id) => plan.includes(id)).length;
    const onRoad = road && (s.families || []).includes(road) ? 1 : 0;
    return { s, subj, onRoad };
  }).filter((x) => x.subj > 0);
  if (!scored.length) return '';
  scored.sort((a, b) => (b.subj - a.subj) || (b.onRoad - a.onRoad));
  const top = scored.slice(0, 4);

  const why = road
    ? `Counted from the ${plan.length} subjects on this device and the road played last time.`
    : `Counted from the ${plan.length} subjects on this device.`;
  return `
    <div class="panel minework" style="margin-top:var(--s-5)">
      <p class="caps">${icon('q_who')}Where my own subjects turn up</p>
      <p class="small mute">${esc(why)} Nothing is ruled out by this, and the full sixteen are below.</p>
      <ul class="chipsel" style="margin-top:var(--s-3)">
        ${top.map((x) => `<li><button class="chip-btn" type="button" data-action="sector" data-id="${x.s.id}" aria-haspopup="dialog">${esc(x.s.label)}<span class="mine-n">${x.subj} of my subjects</span></button></li>`).join('')}
      </ul>
    </div>`;
}

export function renderWork(host, data) {
  const sectors = sectorsFor(data);
  const st = getState();
  host.innerHTML = `
    <div class="wrap">
      <div class="section fade-up" style="margin-top:var(--s-6)">
        <p class="caps">The other half</p>
        <h1 class="serif" style="font-size:var(--t-hero);line-height:var(--lh-hero)">What the work actually is.</h1>
        <p class="lede" style="margin-top:var(--s-3);max-width:46ch">Sixteen parts of working Singapore, in alphabetical order because no other order would be honest. Every one of them takes people in at more than one level, and that is the point of the page.</p>

        ${mineBlock(data, st)}
        ${payLadder(data)}

        <p class="caps rail-q" style="margin-top:var(--s-6)">${icon('q_where')}Which of these is my kind of work?</p>
        <ul class="grid two worklist" style="list-style:none;padding:0;margin-top:var(--s-3)">
          ${sectors.map(sectorCard).join('')}
        </ul>

        <p class="micro faint" style="margin-top:var(--s-6);max-width:56ch">This is a way to find out what exists, not a test of what suits me. Nobody has to pick one, and picking one now does not spend anything.</p>
      </div>
    </div>`;
  bindGlossary(host);
  onAction(host, { sector: (btn) => openSectorSheet(data, btn.dataset.id, btn) });
}

/**
 * The block AIM shows under a want: the sectors that answer it.
 *
 * A want with no work behind it is the oldest failure in careers education, and
 * the sweep refuses to let a want reach fewer than two sectors for exactly that
 * reason. The letter is Holland's, and the word beside it is the letter with the
 * jargon taken off, because a student should never have to learn a taxonomy to
 * use their own answer.
 */
export function wantWorkBlock(data, future) {
  if (!future) return '';
  const ac = (data.copy && data.copy.aim) || {};
  // THE STUDENT WHO SAID THEY DO NOT KNOW.
  //
  // This block first read the Holland letter and returned nothing when there was
  // none, which meant the one future with no letter, "I honestly do not know
  // yet", was the only one that showed no work at all. Exactly backwards: not
  // knowing is the reason to look. So an unlettered want gets a spread instead,
  // one sector per letter, so the six kinds are each represented once and the
  // list is a survey rather than a wall of sixteen.
  const spread = () => {
    const all = sectorsFor(data);
    const out = [];
    ['R', 'I', 'A', 'S', 'E', 'C'].forEach((l) => {
      const hit = all.find((s) => (s.riasec || [])[0] === l && !out.includes(s))
        || all.find((s) => (s.riasec || []).includes(l) && !out.includes(s));
      if (hit) out.push(hit);
    });
    return out;
  };
  const letter = future.riasec;
  const list = letter ? sectorsFor(data, { letter }) : spread();
  if (!list.length) return '';
  const lede = letter
    ? `${list.length} parts of working Singapore turn on ${esc(LETTER_WORD[letter] || 'this')}. Each one takes people in at three or more levels.`
    : `${esc(ac.workUnsure || 'Not knowing yet is the reason to look')}. One from each of the six kinds of working, to see what is out there.`;
  return `
    <div class="aim-linked">
      <p class="caps">${icon('q_where')}${esc(ac.workHead || 'Where that kind of work actually happens')}</p>
      <p class="small mute">${lede}</p>
      <ul class="chipsel" style="margin-top:var(--s-3)">
        ${list.map((s) => `<li><button class="chip-btn" type="button" data-action="sector" data-id="${s.id}" aria-haspopup="dialog">${esc(s.label)}</button></li>`).join('')}
      </ul>
      <p class="micro faint" style="margin-top:var(--s-3)"><a href="./?mode=work">${esc(ac.workBrowse || 'Or look at the work first')}</a></p>
    </div>`;
}

/**
 * Sectors that name this subject. Used by the subject sheet in NOW to answer the
 * oldest question in a classroom, which is why am I learning this.
 *
 * Reading from the sector file rather than from a second list on the subject
 * means a renamed sector cannot leave a subject pointing at nothing.
 */
export function sectorsForSubject(data, subjectId) {
  return ((data.work && data.work.sectors) || [])
    .filter((s) => (s.subjects || []).includes(subjectId));
}
