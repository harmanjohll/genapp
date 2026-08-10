// The ECG counsellor page, ?mode=counsellor.
//
// WHY THIS IS NOT THE TEACHER PAGE. A form teacher runs this for thirty five
// students in forty five minutes and needs a lesson shape. An ECG counsellor
// runs it for one student in twenty and needs something else entirely: what
// the app will tell that student before they walk in, which of its numbers are
// checked and which are not, what the student can walk out holding, and where
// the app stops so the counsellor knows what is theirs to fill in. Sending a
// counsellor to a class plan was sending them to the wrong page.
//
// It is deliberately short. The person reading it knows the system better than
// this app does; what they do not know is what their student has just been
// shown.

import { esc } from '../components/dom.js?v=2.12.0';
import { bindGlossary } from '../components/glossary.js?v=2.12.0';
import { evidenceLink } from './mode-evidence.js?v=2.12.0';

/**
 * The app's own admission arithmetic, rendered from the same file the students
 * are served from.
 *
 * This is the point of the page. A counsellor cannot vouch for a tool whose
 * numbers they have not seen, and a printed handout would drift from the data
 * within a term. Anything the data marks provisional is marked provisional
 * here too, in the same words, so the gap between what is checked and what is
 * not is visible rather than implied.
 */
function arithmetic(data) {
  const dests = [...(data.pathways.destinations || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
  return `
    <div class="ctable-wrap">
    <table class="ctable">
      <thead>
        <tr><th>Destination</th><th>What the app shows as the bar</th><th>Checked</th></tr>
      </thead>
      <tbody>
        ${dests.map((d) => {
          const perf = d.performance || [];
          const prov = perf.some((x) => x.status === 'provisional') || d.status === 'provisional';
          return `
            <tr>
              <th scope="row">${esc(d.railName)}<span class="cmute">${esc(d.leadsTo || '')}</span></th>
              <td>${perf.length
                ? perf.map((x) => `<span class="cbar">${esc(x.label)}</span>`).join('')
                : '<span class="cmute">Nothing performance based.</span>'}</td>
              <td>${prov ? '<span class="cprov">Not yet verified</span>' : 'Verified'}</td>
            </tr>`;
        }).join('')}
      </tbody>
    </table>
    </div>`;
}

export function renderCounsellor(host, data) {
  const prov = data._provisionalCount || 0;
  const fresh = data._freshness || {};
  host.innerHTML = `
    <div class="wrap narrow">
      <div class="section fade-up" style="margin-top:var(--s-6)">
        <p class="caps">For the ECG counsellor</p>
        <h1 class="serif" style="font-size:var(--t-h1)">What your student has just been told</h1>
        <p class="lede">Twenty minutes, one student, and a tool that has already said
          something to them before they sat down. This page is what it said.</p>

        <div class="teacher-note">
          <h4>The three things it will not do</h4>
          <ul class="tight-list" style="margin-bottom:0">
            <li>It never says a route is closed. There is no padlock anywhere in it, on purpose.</li>
            <li>It does not know their grades and never asks. Every bar it shows is the published
              bar, not a prediction about them.</li>
            <li>It keeps nothing. No account, no server, nothing sent. Everything is in the tab
              they are holding, which is also why it cannot show you their history.</li>
          </ul>
        </div>

        <div class="section">
          <div class="panel">
            <h2>A twenty minute slot</h2>
            <ul class="minlist">
              <li><span class="min">3 min</span>
                <span>Open Plan on their phone. The combination they
                actually have, not the one they wish they had.</span></li>
              <li><span class="min">2 min</span>
                <span>Read the line above the list with them. That is
                the single subject change that opens the most, and it is usually a surprise.</span></li>
              <li><span class="min">8 min</span>
                <span>Play once, short. It runs to the end of their first
                qualification, around twenty, and takes about that long.</span></li>
              <li><span class="min">4 min</span>
                <span>Act. Three things they will do this term, in
                their own words.</span></li>
              <li><span class="min">3 min</span>
                <span>Ask the one question the app cannot answer,
                which is why they are in the room.</span></li>
            </ul>
            <p class="small mute">Ten minutes only: Plan, the lever line, and one commitment.</p>
          </div>
        </div>

        <div class="section">
          <div class="section-head"><h2>What they can walk out holding</h2></div>
          <ul class="tight-list">
            <li><strong>A plan link.</strong> Their combination in a URL. It holds the subjects and
              nothing else, so it is safe to send to a parent.</li>
            <li><strong>A route map.</strong> The story they played, drawn as a transit map, saved as
              a picture from their own device. The pale lines are the roads they refused, and those
              lines rejoin.</li>
            <li><strong>Three commitments.</strong> Written in Act, with a calendar file if they want
              the reminder. Ask for the file: a commitment with a date attached survives the week.</li>
            <li><strong>A table pack.</strong> If you ran the group game, one printed page with each
              student's road, doors, and the debrief questions.</li>
          </ul>
        </div>

        <div class="section">
          <div class="section-head"><h2>The arithmetic it is using</h2></div>
          <p class="small">Read from the same file the students are served, so this cannot drift
            from what they see.
            ${prov ? `<strong>${prov} figures in the app are not yet verified against a primary source.</strong>` : ''}
            ${fresh.known ? `Last checked ${fresh.days} days ago.` : ''}</p>
          ${arithmetic(data)}
          <p class="small mute">Anything marked unverified is the app being honest, not the app being
            wrong. Confirm against moe.gov.sg before a student acts on it.</p>
        </div>

        <div class="section">
          <div class="section-head"><h2>Where it stops, and you begin</h2></div>
          <p class="small">It has nothing to say about any of these, so a student who needs one of
            them needs you.</p>
          <ul class="tight-list">
            <li>Appeals, transfers and late applications, all of which turn on the specific case.</li>
            <li>Financial assistance beyond naming that bursaries exist and that somebody at school
              handles the form.</li>
            <li>Learning and physical needs, and what a particular institution can actually support.</li>
            <li>Private, international and overseas routes.</li>
            <li>Anything about a named school, a named course, or this year's intake numbers.</li>
          </ul>
        </div>

        <div class="section">
          <div class="section-head"><h2>Openers it sets up for you</h2></div>
          <div class="grid two">
            <div class="card"><h3 class="h-sm">After Plan</h3>
              <p class="small">One subject change opened four more things. Did you know that this
                morning, and who else should know it by tonight?</p></div>
            <div class="card"><h3 class="h-sm">After Play</h3>
              <p class="small">Something in that story happened to you and not because of you.
                What did you do next, and would you do that again?</p></div>
            <div class="card"><h3 class="h-sm">After the ending</h3>
              <p class="small">You refused a road at sixteen and it came back at twenty four. Which
                road are you refusing now, and on what evidence?</p></div>
            <div class="card"><h3 class="h-sm">After Act</h3>
              <p class="small">Of your three, which one needs another person to say yes? Start
                there, because that one takes the longest.</p></div>
          </div>
        </div>

        <div class="teacher-note">
          <h4>What it says about you</h4>
          <p style="margin-bottom:0">Every page carries this line, unprompted:
            <em>${esc((data.copy.chrome || {}).footer || '')}</em>
            Students are being sent to you by name of role, so the room being empty is worth
            noticing rather than accepting.</p>
        </div>

        ${evidenceLink(data)}

        <div class="btn-row" style="margin-top:var(--s-5)">
          <a class="btn accent" href="./">Open the student view</a>
          <a class="btn ghost" href="./?mode=evidence">What this is built on</a>
          <a class="btn ghost" href="./?mode=teacher">The class plan</a>
          <a class="btn ghost" href="./?mode=table">The table game</a>
        </div>
      </div>
    </div>`;
  bindGlossary(host);
}
