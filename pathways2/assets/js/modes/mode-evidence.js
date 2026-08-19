// What this is built on, ?mode=evidence.
//
// WHO THIS PAGE IS FOR. A head of department deciding whether to run this with a
// cohort, and an ECG counsellor deciding whether it contradicts what they say in
// a room. Neither of them needs to be persuaded that careers guidance matters.
// What they need is the reference list, the reasoning, and the limits, in that
// order, so they can disagree with it precisely.
//
// WHY EACH FRAME CARRIES ITS OWN CRITICISM. A page that listed only supporting
// theory would be a brochure with footnotes. Careers guidance has a real critical
// literature and some of it is aimed at the exact frames this app uses: citing
// Holland without mentioning that measured interests record what a child has
// already seen somebody like them doing is quoting selectively. So every frame
// says what it claims, what it changed in the build, where it is weak, and what
// the app refuses to do because it is weak. The refusals are what a brochure
// would leave out, and they are what a professional reads first.
//
// THE LAST SECTION IS THE ONE THAT MAKES THE REST WORTH READING. This app has no
// outcome data about itself. No trial, no comparison, no follow up. That sentence
// is on the page, in the same typeface as everything else.

import { esc, onAction } from '../components/dom.js?v=2.13.0';
import { icon } from '../components/icons.js?v=2.13.0';
import { decorate, bindGlossary } from '../components/glossary.js?v=2.13.0';

function frame(f) {
  return `
    <article class="frame">
      <h3 class="frame-name serif">${esc(f.name)}</h3>
      <p class="cite">${esc(f.cite)}</p>
      <dl class="framedl">
        <dt>What it claims</dt><dd>${decorate(f.claims)}</dd>
        <dt>What it changed here</dt><dd>${decorate(f.inApp)}</dd>
        <dt>Where it is weak</dt><dd class="weak">${decorate(f.limit)}</dd>
        <dt>So the app will not</dt><dd class="refuse">${decorate(f.refuses)}</dd>
      </dl>
    </article>`;
}

export function renderEvidence(host, data) {
  const e = data.evidence || {};
  const meta = e._meta || {};
  host.innerHTML = `
    <div class="wrap narrow">
      <div class="section fade-up" style="margin-top:var(--s-6)">
        <p class="caps">For a counsellor, a head of department, or anybody sceptical</p>
        <h1 class="serif" style="font-size:var(--t-hero);line-height:var(--lh-hero)">What this is built on, and what it will not claim.</h1>
        <p class="lede" style="margin-top:var(--s-3);max-width:48ch">Ten frames, each with its criticism attached. Then the three works that argue against tools like this one, and what this one does about them. Then the honest limits of this build.</p>

        <section class="section">
          <h2 class="h-sm">${icon('q_who')} The frames, and where each one is weak</h2>
          <div class="frames">${(e.frames || []).map(frame).join('')}</div>
        </section>

        <section class="section">
          <h2 class="h-sm">${icon('q_how')} The case against a tool like this</h2>
          <p class="small mute" style="max-width:48ch">Three works worth reading before deciding to use this. Each is summarised as its author would want it summarised, and then answered.</p>
          ${(e.critical || []).map((c) => `
            <div class="counter">
              <p class="cite">${esc(c.cite)}</p>
              <p class="small"><strong>The argument.</strong> ${decorate(c.says)}</p>
              <p class="small"><strong>What this app does about it.</strong> ${decorate(c.answer)}</p>
            </div>`).join('')}
        </section>

        <section class="section">
          <h2 class="h-sm">What it does not do, and cannot show</h2>
          <div class="truths">
            ${(e.refusals || []).map((r) => `
              <div class="truth">
                <p class="truth-head serif">${esc(r.head)}</p>
                <p class="small">${decorate(r.body)}</p>
              </div>`).join('')}
          </div>
        </section>

        <p class="micro faint" style="margin-top:var(--s-5)">${esc(meta.notes || '')}</p>

        <div class="btn-row" style="margin-top:var(--s-5)">
          <button class="btn ghost" type="button" data-action="print">Print this page</button>
          <a class="btn ghost" href="./?mode=counsellor">The counsellor's page</a>
          <a class="btn ghost" href="./">Back to the tool</a>
        </div>
      </div>
    </div>`;
  bindGlossary(host);
  onAction(host, { print: () => window.print() });
}

/**
 * The line the teacher and counsellor pages carry.
 *
 * Those two pages already name the frames. What they lacked was somewhere to send
 * a reader who wants the citation and the counterargument, which is a different
 * need from wanting to know where a frame shows up on screen.
 */
export function evidenceLink(data) {
  const n = ((data.evidence || {}).frames || []).length;
  const c = ((data.evidence || {}).critical || []).length;
  if (!n) return '';
  return `
    <p class="small"><a href="./?mode=evidence">The ${n} frames with citations, the ${c} works that argue against tools like this, and what this build cannot show</a></p>`;
}
