// Teacher layer, reachable at ?mode=teacher only.
//
// It used to be a button in the student header, which thirty five students find
// in about ninety seconds. It is now URL only.
//
// Its job is to make the artefact leave the screen and land in a conversation,
// which is where the learning actually happens. The evidence on career tools is
// consistent that a screen on its own is the weakest form of the intervention.

import { esc, onAction } from '../components/dom.js';
import { icon } from '../components/icons.js';
import { cue } from '../sound.js';
import { getState, setOffer } from '../state.js';
import { readClassCode } from '../engine/reach.js';

const KIND_NAME = { R: 'Doers', I: 'Thinkers', A: 'Creators', S: 'Helpers', E: 'Persuaders', C: 'Organisers', '-': 'Not sure yet' };

/**
 * The class picture, computed here and nowhere else.
 *
 * A room cannot see its own spread, and the app has no server to give it one.
 * The claim the whole resource rests on, that there is no best combination and
 * that between them a class already holds every destination, is the one thing
 * a student cannot check alone. Students read five characters out, the teacher
 * types them, and this runs in the teacher's browser and dies with the tab.
 * No names, no grades, nothing stored, nothing sent.
 */
function classPicture(raw, data) {
  const rows = String(raw || '').split(/[\s,]+/).map(readClassCode).filter(Boolean);
  if (!rows.length) return null;
  const kinds = {};
  let union = 0; let lo = 99; let hi = 0;
  rows.forEach((r) => {
    kinds[r.kind] = (kinds[r.kind] || 0) + 1;
    union |= r.mask;
    lo = Math.min(lo, r.subjects); hi = Math.max(hi, r.subjects);
  });
  const total = (data.pathways.destinations || []).length;
  let held = 0;
  for (let i = 0; i < total; i += 1) if (union & (1 << i)) held += 1;
  return { n: rows.length, kinds, held, total, lo, hi };
}

const PROMPTS = [
  { mode: 'Now', ask: 'What did you assume was closed to you that turned out not to be?',
    why: 'Surfaces beliefs picked up from siblings and from adults schooled under a different system.' },
  { mode: 'Now', ask: 'Find a subject you have never considered. What would you do in it all day?',
    why: 'Counters circumscription: students rule out whole fields on prestige long before they know anything about them.' },
  { mode: 'Now', ask: 'Whose combination looks nothing like yours, and what does it open that yours does not?',
    why: 'Makes the point that there is no best combination, using the person sitting next to them as the evidence.' },
  { mode: 'Journey', ask: 'Which chance did you miss, and what would you have needed to use it?',
    why: 'Moves the conversation from grades to dispositions without anyone saying the word.' },
  { mode: 'Journey', ask: 'You played twice from the same start. What did your starting point actually decide?',
    why: 'The load bearing question of the whole resource. Worth ten minutes, not two.' },
  { mode: 'Journey', ask: 'What went wrong in your story, and what happened after it?',
    why: 'Normalises setback as an event with a next step rather than an ending.' },
  { mode: 'Aim', ask: 'Three roads to the same place. Which suits how you like to learn?',
    why: 'Reframes the choice as fit rather than rank.' },
  { mode: 'Aim', ask: 'Which of your actions will you actually have done by the end of the month?',
    why: 'Turns the session into a commitment. Follow it up or it does not count.' },
];

// The counselling underneath, named, with where each piece is visible on the
// screen. This exists so a teacher or school leader can audit the resource
// against the ECG frame without reverse engineering it from the interface.
const ECG_MAP = [
  { name: 'The three guiding questions', src: 'MOE ECG',
    where: 'They head the rail beside every Journey turn, badge each stage with the question it leans on, and sit over the destination list and the take-a-question card in Now. Who am I, where do I want to go, how do I get there.' },
  { name: 'Planned happenstance', src: 'Krumboltz',
    where: 'The five dispositions the game tracks are his: curiosity, persistence, flexibility, optimism, risk. Chance cards are the unplanned events, and the demanding responses check dispositions built by ordinary choices. The chip says "you built the footing for this".' },
  { name: 'Career as narrative', src: 'Savickas',
    where: 'Every run is told as a story: your story so far in the rail, a written reflection at thirty eight, an ending in sentences rather than scores, and two stories compared, including what each wanted and who each became.' },
  { name: 'Life-span development', src: 'Super',
    where: 'One run spans thirteen to forty eight, and the want named at the start is re-asked at thirty eight. Changing it is treated as progress, and the ending tells both halves.' },
  { name: 'Circumscription and compromise', src: 'Gottfredson',
    where: 'The banner says nothing here can be closed to you, the engine holds a no-dead-end invariant for every plan, and the breadth counter nudges: rule things out after you look, not before.' },
  { name: 'Self efficacy', src: 'Bandura, SCCT',
    where: 'The Can do ledger grows from doing. Taking the demanding response to a chance is the mastery experience, and the outcome screen says where believing you can starts.' },
  { name: 'Decision learning, then action', src: 'CASVE cycle',
    where: 'Aim works backwards from a destination to a saved plan with named actions, and the discussion prompt below turns those actions into a commitment.' },
  { name: 'Six kinds of working', src: 'Holland RIASEC',
    where: 'The wants carry the six types in student words, codes kept to this page: Doers (R) good with my hands, Thinkers (I) work out how things work, Creators (A) make things people use, Helpers (S) there when people are struggling, Persuaders (E) run my own thing, Organisers (C) every detail exactly right. The want feeds the engine gently: choices pointing its way are marked "near your want", chances that fit it turn up more often without narrowing what can happen, and years lived near the want fill the love circle. Bridge to your profiler from here; remind students most people are a mix of two or three.' },
  { name: 'A reason to get up', src: 'Ikigai',
    where: 'The four circles are computed from the story as played, never asked as a quiz: the want and the appetite shown are what you love, Can do and levels moved are what you are good at, people who would vouch for you are what the world needs, doors and things made are what can pay you. Drawn at thirty eight before the want re-check, and again at the ending.' },
  { name: 'Four scarcities, not one', src: 'Game design for realism',
    where: 'Time and energy are the year\'s points, and they move with real load: seven subjects or more makes a fuller year, four or fewer leaves room, a CCA taken seriously takes its share, and at 17 to 24 more of the day is yours to direct. The line under the points says which, in words about hours, never about whether the combination is right. Options are what is on the list to spend them on, and that grows with doors. Opportunity is what arrives uninvited, which is the chance deck. Courage is what asking costs, which is why superpowers are free: a student with no time still has the capacity to ask.' },
  { name: 'Help-seeking as a mechanic', src: 'ECG practice, MOE admissions',
    where: 'The moves are the other half of the deck: chances happen to a student, moves are the student acting. Ask for help, book the ECG counsellor, ask the Year Head about moving up, tell parents the plan, shadow a job, build an EAE folder, ask about DSA-JC and its binding offer, treat the attachment as real, take the exchange, ask a working adult for an hour. They split in two. Asks are superpowers: teacher, ECG counsellor, Year Head, parents, mentor, held as a hand of at most three, free to play, one a year, and playing one draws another, because asking is how you find out who else there is to ask. Commitments take real time: shadowing, the EAE folder, DSA, the attachment, and the exchange at two points because three months is three months. Every move sets a flag, and flagged chance cards are preferred by the draw, so the game makes the true thing visible: asking opens doors. EAE and DSA are checked against moe.gov.sg.' },
  { name: 'The tool defers to people', src: 'ECG practice',
    where: 'Every mode ends at a person: take-one-question cards address the subject teacher, the form teacher and the ECG counsellor by name, and the footer says whose advice this is not.' },
];

function classOut(pic, data) {
  const t = data.copy.teacher || {};
  if (!pic) return `<p class="small mute">${esc(t.classNone || '')}</p>`;
  const order = ['R', 'I', 'A', 'S', 'E', 'C', '-'];
  const max = Math.max(...Object.values(pic.kinds));
  const bars = order.filter((k) => pic.kinds[k]).map((k) => `
    <div class="kindbar">
      <span class="small">${esc(KIND_NAME[k])}</span>
      <span class="track"><span class="fill" style="width:${Math.round((pic.kinds[k] / max) * 100)}%"></span></span>
      <span class="small mute">${pic.kinds[k]}</span>
    </div>`).join('');
  const punch = pic.held >= pic.total
    ? (t.classAll || '')
    : fill(t.classPunch || '', { n: pic.held, total: pic.total });
  return `
    <p class="small">${esc(fill(t.classCount || '', { n: pic.n }))}
       ${esc(fill(t.classLoad || '', { lo: pic.lo, hi: pic.hi }))}</p>
    <p class="caps" style="margin-top:var(--s-3)">${esc(t.classKinds || '')}</p>
    ${bars}
    <div class="classpunch">
      <strong>${esc(punch)}</strong>
      <p class="small" style="margin:var(--s-2) 0 0">${esc(t.classNote || '')}</p>
    </div>`;
}

function fill(tpl, vars) {
  return String(tpl || '').replace(/\{(\w+)\}/g, (_, k) => (vars[k] == null ? '' : vars[k]));
}

// --- the stage --------------------------------------------------------------
// Projected, dark or light, codes typed one at a time. Each code lights the
// destinations it holds; the counter climbs; all eight is a moment with the
// biggest sound in the app, if sound is on. Nothing entered here is stored:
// the stage dies with the tab, exactly like the textarea it grew from.

let stageCodes = [];   // { code, decoded }

function renderStage(host, data, ctx) {
  const t = data.copy.teacher || {};
  const dests = (data.pathways.destinations || []).slice()
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  const total = dests.length;
  let union = 0;
  const kinds = {};
  let lo = 99; let hi = 0;
  stageCodes.forEach(({ decoded }) => {
    union |= decoded.mask;
    kinds[decoded.kind] = (kinds[decoded.kind] || 0) + 1;
    lo = Math.min(lo, decoded.subjects); hi = Math.max(hi, decoded.subjects);
  });
  let held = 0;
  for (let i = 0; i < total && i < 8; i += 1) if (union & (1 << i)) held += 1;
  const all = stageCodes.length > 0 && held >= total;

  const KIND_LABEL = { R: 'Doers', I: 'Thinkers', A: 'Creators', S: 'Helpers', E: 'Persuaders', C: 'Organisers', '-': 'Not sure yet' };
  const maxKind = Math.max(1, ...Object.values(kinds));
  const kindBars = ['R', 'I', 'A', 'S', 'E', 'C', '-'].filter((k) => kinds[k]).map((k) => `
    <div class="kindbar">
      <span class="small">${esc(KIND_LABEL[k])}</span>
      <span class="track"><span class="fill" style="width:${Math.round((kinds[k] / maxKind) * 100)}%"></span></span>
      <span class="small mute">${kinds[k]}</span>
    </div>`).join('');

  host.innerHTML = `
    <div class="wrap stage">
      <p class="caps">${esc(t.stageHead)}</p>
      <h1 class="serif stage-holds" aria-live="polite">${all
        ? esc(t.stageAll)
        : esc(fill(t.stageHolds || '', { n: held, total }))}</h1>
      ${all ? `<p class="lede">${esc(t.stageNobody)}</p>` : ''}
      <ul class="eight-grid stage-grid" aria-label="The eight destinations">
        ${dests.map((d, i) => `
          <li class="dest-card${(union & (1 << i)) ? ' revealed' : ''}" style="--i:${i}">
            <span class="dest-name">${esc(d.railName)}</span>
            <span class="road-tag">${icon('q_how')}held in this room</span>
          </li>`).join('')}
      </ul>
      <form class="stage-form" data-ref="form">
        <label class="sr-only" for="stagecode">${esc(t.stagePrompt)}</label>
        <input id="stagecode" class="stagebox" type="text" maxlength="6" autocomplete="off"
               autocapitalize="characters" placeholder="${esc(t.stagePrompt)}">
        <span class="caps stage-count">${esc(fill(t.stageCount || '', { n: stageCodes.length }))}</span>
        ${stageCodes.length ? `<button class="btn ghost small" type="button" data-action="stagereset">${esc(t.stageReset)}</button>` : ''}
      </form>
      ${kindBars ? `<div class="stage-kinds"><p class="caps">${esc(t.classKinds)}</p>${kindBars}
        <p class="small mute">${esc(fill(t.classLoad || '', { lo, hi }))}</p></div>` : ''}
    </div>`;

  const form = host.querySelector('[data-ref="form"]');
  const input = host.querySelector('#stagecode');
  if (form && input) {
    input.focus();
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const raw = input.value.trim().toUpperCase();
      const decoded = readClassCode(raw);
      if (!decoded) { input.classList.add('bad'); setTimeout(() => input.classList.remove('bad'), 600); return; }
      if (!stageCodes.some((c) => c.code === raw)) {
        const before = held;
        stageCodes.push({ code: raw, decoded });
        renderStage(host, data, ctx);
        let u2 = 0;
        stageCodes.forEach(({ decoded: d2 }) => { u2 |= d2.mask; });
        let h2 = 0;
        for (let i = 0; i < total && i < 8; i += 1) if (u2 & (1 << i)) h2 += 1;
        if (h2 >= total) cue('ending');
        else if (h2 > before) cue('door');
      } else {
        input.value = '';
      }
    });
  }
  onAction(host, {
    stagereset: () => { stageCodes = []; renderStage(host, data, ctx); },
  });
}

export function renderTeacher(host, data, ctx, repaint) {
  if (document.body.dataset.board === 'true') return renderStage(host, data, ctx);
  const st = getState();
  const f = data._freshness;
  const subjects = data.subjects.subjects;
  const offer = st.offer || subjects.map((s) => s.id);

  host.innerHTML = `
    <div class="wrap">
      <div class="section" style="margin-top:var(--s-6)">
        <p class="caps">Facilitation</p>
        <h1 class="serif" style="font-size:var(--t-h1)">Running this with a class</h1>
        <p class="lede" style="max-width:60ch">
          The resource does not teach anything on its own. The learning is in what students
          say to each other afterwards. Budget more time for the conversation than the screen.
        </p>

        <div class="panel" style="margin-top:var(--s-4);border:2px solid var(--accent)">
          <h2>${esc(data.copy.table.teacherLink)}</h2>
          <p class="small" style="margin-top:var(--s-2)">${esc(data.copy.table.teacherLinkNote)}</p>
          <div class="btn-row" style="margin-top:var(--s-3)">
            <a class="btn accent" href="./?mode=table">${esc(data.copy.table.teacherLink)}</a>
            <a class="btn ghost" href="./?mode=teacher&amp;board=1">The projector reveal</a>
          </div>
        </div>

        <div class="teacher-note">
          <h4>Say this first</h4>
          <p style="margin-bottom:0">This tool never tells anyone they cannot do something, and that is deliberate rather than kind. Students will look for the padlock. Name that there is not one, and ask them why they expected it.</p>
        </div>

        <div class="section">
          <div class="panel">
            <h2>A 45 minute shape</h2>
            <ol>
              <li><strong>5 min.</strong> Ask what they believe decides their future. Write the answers up. Do not correct any of them.</li>
              <li><strong>8 min.</strong> Now mode. Build the combination they are actually considering, honestly.</li>
              <li><strong>4 min.</strong> Read the one line above the list. That is the lever: the single move that shifts the most. Ask who has the same one.</li>
              <li><strong>10 min.</strong> Journey mode, once through.</li>
              <li><strong>8 min.</strong> Journey again from the same start, choosing differently. Then Compare.</li>
              <li><strong>5 min.</strong> Aim mode. Three actions. Copy the question at the bottom of Now and take it out of the room.</li>
              <li><strong>5 min.</strong> Back to the list from minute five. What would they change?</li>
            </ol>
            <p class="small mute">Finished early? Aim mode is the second activity, not a replay. It runs six to eight minutes and produces something different.</p>
          </div>
        </div>

        <div class="section">
          <div class="section-head"><h2>Discussion prompts</h2></div>
          <div class="grid two">
            ${PROMPTS.map((p) => `
              <div class="card">
                <p class="caps">${esc(p.mode)}</p>
                <h3 style="margin-bottom:var(--s-2)">${esc(p.ask)}</h3>
                <p class="small mute" style="margin-bottom:0">${esc(p.why)}</p>
              </div>`).join('')}
          </div>
        </div>

        <div class="section">
          <div class="panel">
            <h2>${esc((data.copy.teacher || {}).playHead || '')}</h2>
            <p class="small mute">${esc((data.copy.teacher || {}).playIntro || '')}</p>
            <div class="btn-row" style="margin-top:var(--s-3)">
              <button class="btn small" type="button" data-action="playcode">${esc((data.copy.teacher || {}).playBtn || '')}</button>
              <span class="code-big" id="playcode" aria-live="polite"></span>
            </div>
            <p class="micro mute">${esc((data.copy.teacher || {}).playNote || '')}</p>
          </div>
        </div>

        <div class="section">
          <div class="section-head"><h2>${esc((data.copy.teacher || {}).classHead || 'What this room holds')}</h2></div>
          <p class="small mute">${esc((data.copy.teacher || {}).stageOpen || '')}
            <a href="./?mode=teacher&board=1">${esc((data.copy.teacher || {}).stageHead || '')}</a></p>
          <p class="small mute" style="max-width:64ch">${esc((data.copy.teacher || {}).classIntro || '')}</p>
          <label class="sr-only" for="classcodes">Class codes, one per line</label>
          <textarea id="classcodes" class="classbox" data-action-input="codes"
                    placeholder="${esc((data.copy.teacher || {}).classPlaceholder || '')}"></textarea>
          <div id="classout">${classOut(null, data)}</div>
        </div>

        <div class="section">
          <div class="panel">
            <h2>Run a field test</h2>
            <p class="small">One class, 45 minutes, paper slips before and after. Three questions: could you name two places you could go, do you know one thing you could do this year that opens doors later, do you know who to ask. Watch for the student who taps a choice and waits, and the one who shows a neighbour their screen unprompted. The full protocol, with the observation tally and the printable slips, is in FIELD_TEST.md in this folder.</p>
          </div>
        </div>

        <div class="section">
          <div class="section-head"><h2>The counselling underneath</h2></div>
          <p class="small mute" style="max-width:60ch">Each principle this resource is built on, and where it is visible on the screen. Audit it against your ECG programme from here.</p>
          <div class="grid two" style="margin-top:var(--s-3)">
            ${ECG_MAP.map((m) => `
              <div class="card">
                <p class="caps">${esc(m.src)}</p>
                <h3 style="margin-bottom:var(--s-2)">${esc(m.name)}</h3>
                <p class="small mute" style="margin-bottom:0">${esc(m.where)}</p>
              </div>`).join('')}
          </div>
        </div>

        <div class="section">
          <div class="panel">
            <h2>Only show what your school runs</h2>
            <p class="small mute">The list carries all ${subjects.length} subjects nationally. Most schools run about fifteen. Untick the rest so nobody plans around a subject they cannot take here. Saved on this device. Start from your school's real list on <a href="https://www.moe.gov.sg/schoolfinder" target="_blank" rel="noopener">MOE SchoolFinder</a>.</p>
            <div class="offer-grid">
              ${subjects.map((s) => `
                <label class="offer-item">
                  <input type="checkbox" data-sid="${s.id}"${offer.includes(s.id) ? ' checked' : ''}>
                  <span>${esc(s.name)}</span>
                </label>`).join('')}
            </div>
            <div class="btn-row" style="margin-top:var(--s-4)">
              <button class="btn small" type="button" data-action="saveoffer">Save</button>
              <button class="btn ghost small" type="button" data-action="alloffer">Show all again</button>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="panel">
            <h2>At the front of the room</h2>
            <p>Add <code>?board=1</code> to the address for a projector view: bigger type, thicker state bars, subject list hidden.</p>
            <p class="small mute">Students can carry their plan to another device with the link button at the bottom of Now. The link holds the plan and nothing else, which matters on a shared Chromebook trolley.</p>
          </div>
        </div>

        <div class="section">
          <div class="panel">
            <h2>For the class chat, before the lesson</h2>
            <p class="small">There is also a fuller page for parents at <code>?mode=parent</code>, linked from the app footer.</p>
            <p class="small">Feel free to send this to parents as it is.</p>
            <blockquote class="parent-note">
              This week we are using a tool that helps students see what their subject
              levels open up, and what they could do next term to change it. It never
              tells a child that anything is closed to them, because under Full SBB that
              would not be true. It does not predict grades and it collects nothing.
              The headline 2028 admission figures in it match what MOE has announced,
              and it still says so plainly wherever a number is unverified. Please treat
              it as a conversation starter with us, never as advice.
            </blockquote>
          </div>
        </div>

        <div class="section">
          <div class="notice">
            <strong>Before students see this, read OPEN_QUESTIONS.md.</strong>
            <p style="margin:var(--s-2) 0 0">${data._provisionalCount} figures are marked provisional, meaning they were not read from a primary MOE or SEAB page. Criteria for the first SEC cohort are still settling. The tool is honest about that on screen and it still needs a teacher who knows which parts to caveat. Data last checked ${f.known ? esc(f.accessed) : 'unknown'}.</p>
          </div>
        </div>

        <div class="btn-row">
          <button class="btn ghost" type="button" data-action="print">Print this</button>
        </div>
      </div>
    </div>`;

  const box = host.querySelector('#classcodes');
  if (box) {
    box.addEventListener('input', () => {
      const out = host.querySelector('#classout');
      if (out) out.innerHTML = classOut(classPicture(box.value, data), data);
    });
  }

  onAction(host, {
    playcode: () => {
      const el = host.querySelector('#playcode');
      if (el) el.textContent = Array.from({ length: 5 }, () => '0123456789ABCDEFGHJKMNPQRSTUVWXYZ'[Math.floor(Math.random() * 33)]).join('');
    },
    print: () => window.print(),
    saveoffer: () => {
      const ids = [...host.querySelectorAll('.offer-item input:checked')].map((i) => i.dataset.sid);
      setOffer(ids.length === subjects.length ? null : ids);
      repaint();
    },
    alloffer: () => { setOffer(null); repaint(); },
  });
}
