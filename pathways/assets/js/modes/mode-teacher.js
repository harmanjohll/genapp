// Teacher layer, reachable at ?mode=teacher only.
//
// It used to be a button in the student header, which thirty five students find
// in about ninety seconds. It is now URL only.
//
// Its job is to make the artefact leave the screen and land in a conversation,
// which is where the learning actually happens. The evidence on career tools is
// consistent that a screen on its own is the weakest form of the intervention.

import { esc, onAction } from '../components/dom.js';
import { getState, setOffer } from '../state.js';

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

export function renderTeacher(host, data, ctx, repaint) {
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
              Admission criteria for the 2028 intake are still being finalised, so please
              treat any number in it as a starting point for a conversation with us, not
              as advice.
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

  onAction(host, {
    print: () => window.print(),
    saveoffer: () => {
      const ids = [...host.querySelectorAll('.offer-item input:checked')].map((i) => i.dataset.sid);
      setOffer(ids.length === subjects.length ? null : ids);
      repaint();
    },
    alloffer: () => { setOffer(null); repaint(); },
  });
}
