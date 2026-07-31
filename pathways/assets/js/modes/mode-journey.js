// Mode JOURNEY. Play your life forward, then play it again differently.
//
// The replay diff at the end is the most important screen in this app. It is
// the only place where a student sees, from choices they made themselves, that
// the same starting point produced two different stories that were both fine.
// Everything else here exists to earn that screen.

import { esc, onAction } from '../components/dom.js';
import { decorate, bindGlossary } from '../components/glossary.js';
import {
  createRun, stagesFor, currentStage, applyChoice, resolveChance, finish, diffRuns,
} from '../engine/journey.js';
import { getState, saveRun, clearRuns, currentYear } from '../state.js';

let run = null;
let stages = [];
let rerender = () => {};

export function renderJourney(host, data, ctx, repaint) {
  rerender = repaint;
  const st = getState();
  const j = data.journey;

  if (!run) {
    host.innerHTML = `<div class="wrap">${intro(data, st)}</div>`;
    bindGlossary(host);
    onAction(host, {
      start: () => { startRun(data); rerender(); },
      compare: () => { showDiff(host, data, st.runs); },
      clearruns: () => { if (confirm('Clear your saved journeys?')) { clearRuns(); rerender(); } },
    });
    return;
  }

  if (run.done) {
    host.innerHTML = `<div class="wrap">${ending(run, data, st)}</div>`;
    bindGlossary(host);
    onAction(host, {
      again: () => { startRun(data); rerender(); },
      compare: () => { showDiff(host, data, st.runs); },
      finishup: () => { run = null; rerender(); },
    });
    return;
  }

  const stage = currentStage(run, stages);
  if (!stage) {
    finish(run, j.endingFrames);
    saveRun(structuredCloneSafe(run));
    rerender();
    return;
  }

  if (run.pending) {
    const card = data.chances.cards.find((c) => c.id === run.pending.cardId);
    host.innerHTML = `<div class="wrap">${chanceView(card, run, data)}</div>`;
    bindGlossary(host);
    onAction(host, {
      continue: () => { resolveChance(run, card); rerender(); },
    });
    return;
  }

  host.innerHTML = `<div class="wrap">${turnView(stage, run, data)}</div>`;
  bindGlossary(host);
  onAction(host, {
    choose: (btn) => {
      applyChoice(run, stage, Number(btn.dataset.i), data.chances.cards);
      rerender();
    },
  });
}

function startRun(data) {
  const age = currentYear().age;
  stages = stagesFor(data.journey.stages, age);
  const n = getState().runs.length + 1;
  run = createRun(age, `Story ${n}`);
}

export function resetJourney() { run = null; }

// --------------------------------------------------------------------------

function intro(data, st) {
  const canCompare = st.runs.length >= 2;
  const saved = st.runs.length
    ? `<p class="small mute">You have ${st.runs.length} saved ${st.runs.length === 1 ? 'story' : 'stories'}.</p>`
    : '';
  return `
    <div class="section" style="margin-top:var(--s-6)">
      <p class="caps">Journey</p>
      <h1 class="serif" style="font-size:var(--t-hero);line-height:var(--lh-hero)">Play it forward.</h1>
      <p class="lede" style="max-width:56ch;margin-top:var(--s-4)">
        You start where you are now and move a few years at a time, out to about forty two.
        You make choices. Things turn up that you did not plan for, some good and some not.
        Nothing you pick ends the game, because that is not how it works.
      </p>
      <div class="callout" style="margin-top:var(--s-5)">
        <p><strong>${esc(data.dispositions.framing.headline)}</strong></p>
        <p class="small" style="margin-bottom:0">${esc(data.dispositions.framing.body)}</p>
      </div>
      <div class="grid three" style="margin-top:var(--s-5)">
        ${data.dispositions.dispositions.map((d) => `
          <div class="card">
            <h3>${esc(d.label)}</h3>
            <p class="small mute" style="margin-bottom:var(--s-2)">${esc(d.short)}</p>
            <p class="micro faint" style="margin:0">Builds when ${esc(d.buildsWhen.charAt(0).toLowerCase() + d.buildsWhen.slice(1))}</p>
          </div>`).join('')}
      </div>
      ${saved}
      <div class="btn-row" style="margin-top:var(--s-5)">
        <button class="btn accent" type="button" data-action="start">Start from age ${currentYear().age}</button>
        ${canCompare ? '<button class="btn ghost" type="button" data-action="compare">Compare your last two stories</button>' : ''}
        ${st.runs.length ? '<button class="btn ghost" type="button" data-action="clearruns">Clear saved stories</button>' : ''}
      </div>
    </div>`;
}

function turnView(stage, run, data) {
  const n = stages.indexOf(stage) + 1;
  return `
    <div class="section" style="margin-top:var(--s-6)">
      <p class="caps">Step ${n} of ${stages.length}</p>
      <div class="turn">
        <div class="turn-head">
          <span class="turn-age">${stage.age}</span>
          <h1>${esc(stage.title)}</h1>
        </div>
        <p class="lede" style="max-width:58ch">${decorate(stage.situation)}</p>
        <div class="grid" role="group" aria-label="Your choices">
          ${stage.choices.map((c, i) => `
            <button class="choice" type="button" data-action="choose" data-i="${i}">
              <span class="label">${decorate(c.label)}</span>
            </button>`).join('')}
        </div>
        ${storySoFar(run)}
        ${ledgerView(run, data)}
      </div>
    </div>`;
}

function chanceView(card, run, data) {
  const can = run.pending.canUse;
  const disp = data.dispositions.dispositions.find((d) => d.id === card.requires?.disposition);
  const kind = card.type === 'setback' ? 'Something goes wrong' : card.type === 'encounter' ? 'Someone turns up' : 'A chance appears';

  const body = can
    ? `<p>${decorate(card.ifTaken)}</p>`
    : `<p class="missed">${decorate(card.ifMissed)}</p>
       <p class="small mute">This one needed ${esc(disp ? disp.label.toLowerCase() : 'a disposition')} you had not built up much of yet. It happened while you were not looking. That is worth knowing, and it is worth playing again.</p>`;

  const onward = card.onwardMoves && card.onwardMoves.length ? `
    <div class="moves" style="margin-top:var(--s-4)">
      <h4>What you can do from here</h4>
      <ul>${card.onwardMoves.map((m) => `<li>${decorate(m)}</li>`).join('')}</ul>
    </div>` : '';

  return `
    <div class="section" style="margin-top:var(--s-6)">
      <div class="chance ${card.type === 'setback' ? 'setback' : ''}">
        <p class="kind">${esc(kind)}</p>
        <h1 style="margin:var(--s-2) 0 var(--s-3)">${esc(card.title)}</h1>
        <p>${decorate(card.body)}</p>
        <hr style="border:none;border-top:1px dashed var(--rule);margin:var(--s-4) 0">
        ${body}
        ${onward}
      </div>
      <div class="btn-row" style="margin-top:var(--s-5)">
        <button class="btn" type="button" data-action="continue">Keep going</button>
      </div>
      ${ledgerView(run, data)}
    </div>`;
}

function storySoFar(run) {
  if (!run.steps.length) return '';
  const last = run.steps[run.steps.length - 1];
  return `
    <div class="card" style="background:var(--paper-warm)">
      <p class="caps">Last time</p>
      <p class="small" style="margin-bottom:0"><strong>Age ${last.age}.</strong> ${decorate(last.outcome)}${last.chance ? ` ${decorate(last.chance.text)}` : ''}</p>
    </div>`;
}

function ledgerView(run, data) {
  const items = data.journey.ledger.map((l) => `
    <div class="ledger-item">
      <span class="n">${run.ledger[l.id]}</span>
      <span class="lbl">${esc(l.label)}</span>
    </div>`).join('');

  const max = Math.max(4, ...Object.values(run.disp));
  const bars = data.dispositions.dispositions.map((d) => `
    <div class="disp-row">
      <span>${esc(d.label)}</span>
      <span class="disp-track"><span class="disp-fill" style="width:${Math.round((run.disp[d.id] / max) * 100)}%"></span></span>
      <span class="micro mute">${run.disp[d.id]}</span>
    </div>`).join('');

  return `
    <div class="section" style="margin-top:var(--s-5)">
      <p class="caps">What you are carrying</p>
      <div class="ledger">${items}</div>
      <div class="disp-bars" style="margin-top:var(--s-4)">${bars}</div>
      <p class="micro faint" style="margin-top:var(--s-2)">No score, and nothing to lose. Doors open to you never goes down.</p>
    </div>`;
}

function ending(run, data, st) {
  const frame = run.frame || data.journey.endingFrames[0];
  const disp = data.dispositions.dispositions.find((d) => d.id === run.topDisposition);
  const prose = run.steps.map((s) => `
    <p><strong>Age ${s.age}.</strong> ${decorate(s.outcome)}${s.chance ? ` ${decorate(s.chance.text)}` : ''}</p>`).join('');

  const paths = data.stories.typicalPaths.slice(0, 2).map(storyCard).join('');
  const profiles = data.stories.profiles.length
    ? data.stories.profiles.slice(0, 1).map(storyCard).join('')
    : `<div class="story" data-kind="typical">
         <span class="kindmark">◇ note</span>
         <p class="small" style="margin-bottom:0">Real named profiles have not been added to this build yet. The cards above are patterns drawn from how the system works, not people. Nobody has been invented to make a point.</p>
       </div>`;

  const canCompare = st.runs.length >= 2;

  return `
    <div class="section" style="margin-top:var(--s-6)">
      <p class="caps">Your story</p>
      <h1 class="serif" style="font-size:var(--t-hero);line-height:var(--lh-hero)">${esc(frame.title)}</h1>
      <p class="lede" style="max-width:56ch;margin-top:var(--s-3)">${esc(frame.body)}</p>

      <div class="panel" style="margin-top:var(--s-5)">
        <p class="caps">How it went</p>
        ${prose}
      </div>

      ${ledgerView(run, data)}

      <div class="callout" style="margin-top:var(--s-5)">
        <p><strong>What actually made the difference</strong></p>
        <p style="margin-bottom:0">${esc(disp ? disp.label : 'Curiosity')}. ${esc(disp ? disp.body : '')}</p>
        <p class="small mute" style="margin-top:var(--s-3);margin-bottom:0">Not an aggregate. Not a posting group. Across a whole working life, this is the sort of thing that decides what happens to people.</p>
      </div>

      <div class="section">
        <div class="section-head">
          <h2>Paths that look like yours</h2>
          <p>Two kinds of card below, and they are marked differently on purpose. A pattern is a shape the system produces. A profile is a real named person with a link.</p>
        </div>
        <div class="grid two">${paths}${profiles}</div>
      </div>

      <div class="panel" style="margin-top:var(--s-6);border:2px solid var(--accent)">
        <p class="caps">The point of all this</p>
        <h2>Now play it again, differently.</h2>
        <p>Same start. Same age. Different choices. Then put the two side by side and look at what your starting point actually decided.</p>
        <div class="btn-row" style="margin-top:var(--s-4)">
          <button class="btn accent" type="button" data-action="again">Play again from age ${run.startAge}</button>
          ${canCompare ? '<button class="btn" type="button" data-action="compare">Compare your two stories</button>' : ''}
          <button class="btn ghost" type="button" data-action="finishup">Back to the start</button>
        </div>
      </div>
    </div>`;
}

function storyCard(s) {
  const isProfile = s.kind === 'profile';
  const shape = (s.shape || []).map((x, i) => `
    ${i ? '<span class="arrow" aria-hidden="true">→</span>' : ''}<span class="step">${esc(x)}</span>`).join('');
  return `
    <article class="story" data-kind="${isProfile ? 'profile' : 'typical'}">
      <span class="kindmark">${isProfile ? '● a real person' : '◇ a pattern, not a person'}</span>
      <h3>${esc(s.label || s.name)}</h3>
      <div class="shape">${shape}</div>
      <p class="small">${decorate(s.body)}</p>
      ${s.takes ? `<p class="micro mute">${esc(s.takes)}</p>` : ''}
      ${s.whatMattered ? `<p class="small"><strong>What mattered:</strong> ${esc(s.whatMattered)}</p>` : ''}
      ${s.url ? `<p class="micro"><a href="${esc(s.url)}" target="_blank" rel="noopener">Read the source</a></p>` : ''}
    </article>`;
}

function showDiff(host, data, runs) {
  const [a, b] = runs.slice(-2);
  const d = diffRuns(a, b);
  const rows = d.rows.map((r) => `
    <div class="diff-line ${r.differs ? 'differs' : ''}">
      <span class="caps">Age ${r.age}</span><br>
      ${r.a ? decorate(r.a.choice) : '<span class="faint">nothing here</span>'}
    </div>`).join('');
  const rowsB = d.rows.map((r) => `
    <div class="diff-line ${r.differs ? 'differs' : ''}">
      <span class="caps">Age ${r.age}</span><br>
      ${r.b ? decorate(r.b.choice) : '<span class="faint">nothing here</span>'}
    </div>`).join('');

  const differing = d.rows.filter((r) => r.differs).length;

  host.innerHTML = `
    <div class="wrap">
      <div class="section" style="margin-top:var(--s-6)">
        <p class="caps">Two stories</p>
        <h1 class="serif" style="font-size:var(--t-h1)">Same start. ${differing} different ${differing === 1 ? 'choice' : 'choices'}.</h1>
        <div class="diff" style="margin-top:var(--s-5)">
          <div class="diff-col">
            <h3>${esc(a.label)}</h3>
            ${rows}
            <div class="ledger" style="margin-top:var(--s-4)">
              ${data.journey.ledger.map((l) => `<div class="ledger-item"><span class="n">${a.ledger[l.id]}</span><span class="lbl">${esc(l.label)}</span></div>`).join('')}
            </div>
          </div>
          <div class="diff-col">
            <h3>${esc(b.label)}</h3>
            ${rowsB}
            <div class="ledger" style="margin-top:var(--s-4)">
              ${data.journey.ledger.map((l) => `<div class="ledger-item"><span class="n">${b.ledger[l.id]}</span><span class="lbl">${esc(l.label)}</span></div>`).join('')}
            </div>
          </div>
        </div>
        <div class="diff-verdict">
          <h2>Both of those were fine.</h2>
          <p>You began both stories at exactly the same age, in exactly the same place, with exactly the same results. They ended differently, and neither one is the wrong answer.</p>
          <p style="margin-bottom:0">Whatever happens at the end of Sec 4, that is the thing worth taking away. Your starting point set the first step. It did not write the rest.</p>
        </div>
        <div class="btn-row" style="margin-top:var(--s-5)">
          <button class="btn ghost" type="button" data-action="back">Back</button>
        </div>
      </div>
    </div>`;
  bindGlossary(host);
  onAction(host, { back: () => rerender() });
}

function structuredCloneSafe(obj) {
  try { return structuredClone(obj); } catch { return JSON.parse(JSON.stringify(obj)); }
}
