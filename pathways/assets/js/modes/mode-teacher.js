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
