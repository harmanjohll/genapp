// Mode NOW. Build the combination you are considering and see what it opens.
//
// This is the mode closest to the original brief, and the one where the design
// departs from it most sharply. Nothing is ever locked, nothing is greyed out,
// and every destination that is not currently open carries both the specific
// moves that would change that and a real route that goes round another way.
//
// Subject cards lead with what the subject is actually like to do, not with
// what it is worth. That ordering is the whole point of "fidelity to learning,
// not just performance".

import { el, esc, onAction, statusChip } from '../components/dom.js';
import { decorate, bindGlossary } from '../components/glossary.js';
import { reach, sortReaches, allMoves, STATES } from '../engine/reach.js';
import { getState, setYear, setSubjectLevel, clearPlan, YEARS, currentYear } from '../state.js';

export function renderNow(host, data, ctx) {
  const st = getState();
  const year = currentYear();
  const plan = st.plan;
  const chosen = Object.keys(plan).length;

  const reaches = sortReaches(
    data.pathways.destinations.map((d) => reach(plan, d, { ...ctx, plan }))
  );
  const moves = allMoves(reaches);

  host.innerHTML = `
    <div class="wrap">
      ${yearBar(year)}
      ${chosen === 0 ? emptyState() : ''}
      <div class="section">
        <div class="section-head">
          <h2>Your subjects</h2>
          <p>Pick the level you are taking or considering for each one. Tap again to remove it. ${esc(data.subjects.movement.headline)}</p>
        </div>
        ${movementNote(data.subjects.movement)}
        ${data.subjects.groups.map((g) => groupBlock(g, data.subjects.subjects, plan)).join('')}
      </div>

      <div class="section" id="reaches">
        <div class="section-head">
          <h2>Where this could lead</h2>
          <p>${chosen === 0
            ? 'Pick a subject or two above and this fills in. Nothing here will ever tell you that something is closed to you.'
            : 'Sorted by how close each one is right now. None of these is a prediction, and none of them is final.'}</p>
        </div>
        <div class="grid two">
          ${reaches.map((r) => reachCard(r, data)).join('')}
        </div>
      </div>

      ${moves.length ? movesPanel(moves) : ''}
      ${chosen >= 3 ? tradeoffPanel(plan, data) : ''}
      ${disclaimer(data)}
    </div>`;

  bindGlossary(host);
  onAction(host, {
    year: (btn) => setYear(btn.dataset.year),
    level: (btn) => {
      const { subject, level } = btn.dataset;
      const current = getState().plan[subject];
      setSubjectLevel(subject, current === level ? null : level);
    },
    clear: () => {
      if (confirm('Clear every subject you have picked? Your saved actions and journeys stay.')) clearPlan();
    },
  });
}

function yearBar(year) {
  return `
    <div class="section" style="margin-top:var(--s-5)">
      <p class="caps">Where you are</p>
      <div class="modebar" role="group" aria-label="Which year are you in">
        ${YEARS.map((y) => `
          <button type="button" data-action="year" data-year="${y.id}"
                  aria-current="${y.id === year.id}">${esc(y.label)}</button>`).join('')}
      </div>
      <p class="lede" style="margin-top:var(--s-3)">${esc(year.asks)}</p>
    </div>`;
}

function emptyState() {
  return `
    <div class="callout" style="margin-top:var(--s-4)">
      <p><strong>Nothing is selected yet, and that is fine.</strong></p>
      <p class="small">Start with English, your Mother Tongue and Mathematics, since everyone takes those. Then add whatever you are actually thinking about. You can change any of it as often as you like.</p>
    </div>`;
}

function movementNote(m) {
  return `
    <div class="notice" style="margin-bottom:var(--s-4)">
      <strong>${esc(m.headline)}</strong>
      <p style="margin:var(--s-2) 0 0">${esc(m.body)}</p>
    </div>`;
}

function groupBlock(group, subjects, plan) {
  const list = subjects.filter((s) => s.group === group.id);
  if (!list.length) return '';
  return `
    <section style="margin-bottom:var(--s-6)">
      <h3 style="margin-bottom:var(--s-1)">${esc(group.label)}</h3>
      <p class="small mute" style="margin-bottom:var(--s-3)">${esc(group.note)}</p>
      <div class="grid three">
        ${list.map((s) => subjectCard(s, plan[s.id])).join('')}
      </div>
    </section>`;
}

function subjectCard(s, level) {
  const chips = s.levels.map((lv) => `
    <button type="button" class="level-chip" data-level="${lv}"
            data-action="level" data-subject="${s.id}" data-level-value="${lv}"
            aria-pressed="${level === lv}"
            aria-label="${esc(s.name)} at ${lv}">
      <span class="level-dot ${lv}" aria-hidden="true"></span>${lv}<span class="mark" aria-hidden="true">✓</span>
    </button>`).join('');

  return `
    <article class="subject ${level ? 'on' : ''}">
      <h3>${esc(s.name)} ${s.compulsory ? '<span class="req">everyone takes this</span>' : ''}</h3>
      <div class="levels" data-subject="${s.id}">${chips}</div>
      <dl>
        <div><dt>What you actually do</dt><dd>${esc(s.doing)}</dd></div>
        <div><dt>You will probably like this if</dt><dd>${esc(s.likeIf)}</dd></div>
      </dl>
      <details>
        <summary>Where it shows up later</summary>
        <ul class="shows">${s.showsUp.map((x) => `<li>${decorate(x)}</li>`).join('')}</ul>
      </details>
      ${s.note ? `<p class="micro mute">${decorate(s.note)}</p>` : ''}
      ${s.caution ? `<p class="caution">${esc(s.caution)}</p>` : ''}
      ${s.status === 'provisional' ? statusChip('provisional') : ''}
    </article>`;
}

function reachCard(r, data) {
  const label = STATES[r.state].label;
  const met = r.met.map((m) => `
    <li class="yes"><span class="icon" aria-hidden="true">✓</span><span>${decorate(m.label)}${m.soft ? ' <span class="mute">(usually expected)</span>' : ''}</span></li>`).join('');
  const gap = r.gap.map((g) => `
    <li class="not"><span class="icon" aria-hidden="true">○</span><span>${decorate(g.label)}${g.soft ? ' <span class="mute">(usually expected)</span>' : ''}</span></li>`).join('');

  const moves = r.moves.length ? `
    <div class="moves">
      <h4>What would move this</h4>
      <ul>${r.moves.map((m) => `<li>${decorate(m.label)} <span class="who">Talk to ${esc(m.who)}, ${esc(m.when)}.</span></li>`).join('')}</ul>
    </div>` : '';

  const routes = r.routes.length ? `
    <div class="routes">
      <p class="caps">Another road to the same place</p>
      ${r.routes.map(routeChip).join('')}
    </div>` : '';

  const perf = r.performance.length ? `
    <div class="perf">
      <h4>What it asks for at the end</h4>
      ${r.performance.map((p) => `
        <p style="margin-bottom:var(--s-2)"><strong>${decorate(p.label)}</strong> ${statusChip(p.status)}<br>
        <span class="mute">${decorate(p.note)}</span></p>`).join('')}
      <p class="micro faint">This app does not know your grades and does not guess them. These are here so you know what the thing asks for, not so you can be measured against it.</p>
    </div>` : '';

  const also = r.alsoIn.length ? `
    <ul class="small mute" style="padding-left:1.1em;margin:0">
      ${r.alsoIn.map((a) => `<li>${decorate(a)}</li>`).join('')}
    </ul>` : '';

  return `
    <article class="reach" data-state="${r.state}">
      <span class="reach-state">${esc(label)}</span>
      <div>
        <h3>${esc(r.name)}</h3>
        <p class="duration">${esc(r.duration)} &middot; leads to ${esc(r.leadsTo)}</p>
      </div>
      <p class="feels">${decorate(r.feels)}</p>
      <ul class="checklist">${met}${gap}</ul>
      ${moves}
      ${routes}
      ${also}
      ${perf}
      <div class="chip-row">${statusChip(r.status, r.asOf)}</div>
    </article>`;
}

function routeChip(route) {
  const steps = route.steps.map((s, i) => `
    ${i ? '<span class="arrow" aria-hidden="true">→</span>' : ''}<span class="step">${esc(s)}</span>`).join('');
  return `
    <div class="route">
      <div class="steps">${steps}</div>
      <div>${decorate(route.detail)}</div>
      ${route.honest ? `<div class="honest">${decorate(route.honest)}</div>` : ''}
    </div>`;
}

function movesPanel(moves) {
  const top = moves.slice(0, 6);
  return `
    <div class="section">
      <div class="panel">
        <p class="caps">If you only do one thing</p>
        <h2>These are the moves that open the most</h2>
        <p class="mute small">Each of these is a real conversation you could have this term. They are ordered by how much they open up.</p>
        <ul style="margin-top:var(--s-4)">
          ${top.map((m) => `
            <li style="margin-bottom:var(--s-3)">
              <strong>${decorate(m.label)}</strong><br>
              <span class="small mute">Opens up ${esc(m.opens.slice(0, 3).join(', '))}${m.opens.length > 3 ? ' and more' : ''}. Talk to ${esc(m.who)}, ${esc(m.when)}.</span>
            </li>`).join('')}
        </ul>
      </div>
    </div>`;
}

// The panel that stops this being a maximiser. Taking everything at the highest
// level is not free, and a combination somebody is drowning in closes more
// doors than it opens.
function tradeoffPanel(plan, data) {
  const levels = Object.values(plan);
  const g3 = levels.filter((l) => l === 'G3').length;
  const total = levels.length;
  const byId = new Map(data.subjects.subjects.map((s) => [s.id, s]));
  const names = Object.keys(plan).map((id) => (byId.get(id) || {}).name).filter(Boolean);

  let verdict;
  if (g3 >= 7) {
    verdict = 'That is a heavy load. It can be the right call, and it is worth being honest with yourself about whether you can carry it across two years without the whole thing sliding. Four subjects done well beats seven done thinly, at every single admission point in the system.';
  } else if (g3 >= 5) {
    verdict = 'A substantial load, and a normal one. The question worth asking is whether there is one subject in there you took for the look of it rather than because you want it.';
  } else if (total >= 6) {
    verdict = 'A balanced spread. Depth in the subjects you care about tends to serve people better than a thin layer across everything.';
  } else {
    verdict = 'Still early. Worth checking you have not closed off a whole area you have simply never tried.';
  }

  return `
    <div class="section">
      <div class="panel">
        <p class="caps">The honest part</p>
        <h2>More is not automatically better</h2>
        <p>You have ${total} subject${total === 1 ? '' : 's'} selected, ${g3} of them at G3.</p>
        <p>${esc(verdict)}</p>
        <p class="small mute">${names.length ? esc(names.join(', ')) + '.' : ''}</p>
        <p class="small">The question underneath a subject combination is not only how far it can take you. It is how you want to spend the next two years, and what you want to be good at. Those are different questions and the second one is the one people regret ignoring.</p>
      </div>
    </div>`;
}

function disclaimer(data) {
  const f = data._freshness;
  const stale = f.stale
    ? `<p class="notice" style="margin-top:var(--s-3)">Some of this data was last checked ${f.days} days ago. Criteria change. Confirm anything that matters against moe.gov.sg.</p>`
    : '';
  return `
    <div class="section">
      <p class="small mute">A thinking tool, not official advice. ${data._provisionalCount} item${data._provisionalCount === 1 ? '' : 's'} here are marked provisional, which means they were not read from a primary MOE or SEAB page. Check anything that matters with your school's ECG counsellor and at moe.gov.sg.</p>
      ${stale}
    </div>`;
}
