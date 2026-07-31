// Teacher layer, behind ?mode=teacher or the toggle in the header.
//
// Kept entirely out of the student's way. Its job is to make the artefact leave
// the screen and land in a conversation, which is where the actual learning
// happens.

import { esc, onAction } from '../components/dom.js';

const PROMPTS = [
  {
    mode: 'Now',
    ask: 'What did you assume was closed to you that turned out not to be?',
    why: 'Surfaces inherited beliefs about the system, usually picked up from siblings and from adults who were in school under a different one.',
  },
  {
    mode: 'Now',
    ask: 'Find one subject you have never seriously considered. What would you actually do in it all day?',
    why: 'Counters circumscription: students rule out whole fields on prestige and on who they imagine does them, long before they know anything about them.',
  },
  {
    mode: 'Now',
    ask: 'Whose combination in this room looks nothing like yours, and what does it open that yours does not?',
    why: 'Makes the point that there is no single best combination, and does it with evidence from the person sitting next to them.',
  },
  {
    mode: 'Journey',
    ask: 'Which chance did you miss, and what would you have needed to be able to use it?',
    why: 'Moves the conversation from grades to dispositions without anyone having to say the word.',
  },
  {
    mode: 'Journey',
    ask: 'You played twice from the same start. What did your starting point actually decide?',
    why: 'The load bearing question of the whole resource. Worth ten minutes, not two.',
  },
  {
    mode: 'Journey',
    ask: 'What went wrong in your story, and what happened after it?',
    why: 'Normalises setback as an event with a next step rather than as an ending.',
  },
  {
    mode: 'Aim',
    ask: 'Three roads to the same place. Which one suits how you like to learn?',
    why: 'Reframes the choice as a fit question rather than a rank question.',
  },
  {
    mode: 'Aim',
    ask: 'Which of your three actions will you actually have done by the end of the month?',
    why: 'Turns the session into a commitment. Follow it up, or it does not count.',
  },
];

export function renderTeacher(host, data, ctx, repaint) {
  const f = data._freshness;
  host.innerHTML = `
    <div class="wrap">
      <div class="section" style="margin-top:var(--s-6)">
        <p class="caps">Facilitation</p>
        <h1 class="serif" style="font-size:var(--t-h1)">Running this with a class</h1>
        <p class="lede" style="max-width:60ch">
          The resource does not teach anything on its own. The learning is in what
          students say to each other afterwards. Budget more time for the
          conversation than for the screen.
        </p>

        <div class="teacher-note">
          <h4>Before you start</h4>
          <p style="margin-bottom:0">Say out loud that this tool never tells anyone they cannot do something, and that this is deliberate rather than kind. Students will look for the padlock. It is worth naming that there is not one, and asking them why they expected it.</p>
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
            <h2>A 45 minute shape</h2>
            <ol>
              <li><strong>5 min.</strong> Ask what they already believe decides their future. Write the answers up. Do not correct any of them yet.</li>
              <li><strong>10 min.</strong> Now mode. Build a combination, honestly, the one they are actually considering.</li>
              <li><strong>10 min.</strong> Journey mode, once through.</li>
              <li><strong>10 min.</strong> Journey mode again from the same start, choosing differently. Then the comparison screen.</li>
              <li><strong>5 min.</strong> Aim mode. Pick three actions for the term and write them down somewhere that is not this website.</li>
              <li><strong>5 min.</strong> Back to the list from the first five minutes. Ask what they would change.</li>
            </ol>
          </div>
        </div>

        <div class="section">
          <div class="notice">
            <strong>Before you put this in front of students, read this.</strong>
            <p style="margin:var(--s-2) 0 0">${data._provisionalCount} figures in this build are marked provisional, which means they were not read from a primary MOE or SEAB page. Admission criteria for the first SEC cohort are still settling. The tool is built to be honest about that, and it still needs a teacher who knows which parts to caveat. Data last checked ${f.known ? f.accessed : 'unknown'}.</p>
          </div>
        </div>

        <div class="btn-row">
          <button class="btn ghost" type="button" data-action="print">Print these prompts</button>
        </div>
      </div>
    </div>`;

  onAction(host, { print: () => window.print() });
}
