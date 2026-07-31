// Mode AIM. Start from what you want and work backwards.
//
// Futures are stated as wants, never as job titles. Naming a job invites a
// fourteen year old to rule it in or out on prestige and on who they think does
// it, which is exactly the circumscription that career development research
// warns about. Naming a want does not.
//
// Every future carries at least three structurally different routes, listed in
// no order, with no ranking, and the absence of the ranking is the content.

import { esc, onAction } from '../components/dom.js';
import { decorate, bindGlossary } from '../components/glossary.js';
import { getState, setAim, toggleAction, currentYear } from '../state.js';

export function renderAim(host, data, ctx, repaint) {
  const st = getState();
  const future = data.futures.futures.find((f) => f.id === st.aim);

  host.innerHTML = `
    <div class="wrap">
      ${future ? detail(future, st, data) : chooser(data)}
    </div>`;

  bindGlossary(host);
  onAction(host, {
    pick: (btn) => { setAim(btn.dataset.id); repaint(); window.scrollTo({ top: 0, behavior: 'smooth' }); },
    back: () => { setAim(null); repaint(); },
    action: (btn) => { toggleAction(btn.dataset.text); repaint(); },
    save: () => downloadPlan(data),
    print: () => window.print(),
  });
}

function chooser(data) {
  return `
    <div class="section" style="margin-top:var(--s-6)">
      <p class="caps">Aim</p>
      <h1 class="serif" style="font-size:var(--t-hero);line-height:var(--lh-hero)">Start from what you want.</h1>
      <p class="lede" style="max-width:56ch;margin-top:var(--s-4)">
        Not a job title. Job titles are a bad way to choose at your age, because
        you have only ever seen about six of them and most of what you think you
        know about them is wrong. Start from the kind of work you want your days
        to be made of.
      </p>
      <div class="grid two" style="margin-top:var(--s-5)">
        ${data.futures.futures.map((f) => `
          <button class="future-btn" type="button" data-action="pick" data-id="${f.id}">
            <span class="want">${esc(f.want)}</span>
            <span class="looks">${esc(f.looksLike)}</span>
          </button>`).join('')}
      </div>
    </div>`;
}

function detail(f, st, data) {
  const year = currentYear();
  const routes = f.routes.map((r, i) => `
    <article class="card">
      <p class="caps">Road ${i + 1} of ${f.routes.length}</p>
      <h3>${esc(r.label)}</h3>
      <div class="steps" style="display:flex;flex-wrap:wrap;gap:var(--s-1);align-items:center;margin:var(--s-3) 0">
        ${r.steps.map((s, j) => `${j ? '<span class="arrow" aria-hidden="true">→</span>' : ''}<span class="step">${esc(s)}</span>`).join('')}
      </div>
      <p class="small">${decorate(r.note)}</p>
      ${r.years ? `<p class="micro faint" style="margin-bottom:0">About ${r.years} year${r.years === 1 ? '' : 's'} to the first qualification.</p>` : ''}
    </article>`).join('');

  const actions = f.thisTerm.map((t) => {
    const on = st.actions.includes(t);
    return `
      <li>
        <button class="btn ${on ? 'accent' : 'ghost'} small" type="button" data-action="action" data-text="${esc(t)}"
                aria-pressed="${on}">${on ? '✓ on my list' : 'add to my list'}</button>
        <span style="margin-left:var(--s-2)">${esc(t)}</span>
      </li>`;
  }).join('');

  const breadth = f.isBreadthTour ? `
    <div class="callout" style="margin-top:var(--s-5)">
      <p><strong>Not knowing is the normal state at fourteen.</strong></p>
      <p class="small" style="margin-bottom:0">The students who sound certain are mostly repeating something an adult said to them. Not knowing yet is not a problem to be solved before the subject combination form is due. It is a reason to keep the door wide and go and look at things.</p>
    </div>` : '';

  return `
    <div class="section" style="margin-top:var(--s-6)">
      <button class="btn ghost small" type="button" data-action="back">← All the others</button>
      <h1 class="serif" style="font-size:var(--t-h1);margin-top:var(--s-4)">${esc(f.want)}</h1>
      <p class="lede" style="max-width:56ch">${esc(f.looksLike)}</p>
      ${breadth}

      <div class="section">
        <div class="section-head">
          <h2>${f.routes.length} roads that get there</h2>
          <p>These are not ranked and they are not in order of quality. They are different shapes of the same journey, and which one suits you depends on how you like to learn, not on how clever anyone thinks you are.</p>
        </div>
        <div class="grid two">${routes}</div>
      </div>

      <div class="section">
        <div class="thisterm">
          <p class="caps">You are in ${esc(year.label)}</p>
          <h2>Three things you could do this term</h2>
          <p class="small mute">Small, specific, and none of them require anyone's permission.</p>
          <ol style="list-style:decimal">${actions}</ol>
          <div class="btn-row" style="margin-top:var(--s-4)">
            <button class="btn" type="button" data-action="save">Save this as a card</button>
            <button class="btn ghost" type="button" data-action="print">Print it</button>
          </div>
        </div>
      </div>

      ${st.actions.length ? myList(st, data) : ''}
    </div>`;
}

function myList(st, data) {
  return `
    <div class="section">
      <div class="panel" id="plan-card">
        <p class="caps">My list</p>
        <h2>What I am actually going to do</h2>
        <ul style="margin-top:var(--s-3)">
          ${st.actions.map((a) => `<li>${esc(a)}</li>`).join('')}
        </ul>
        <p class="micro faint" style="margin-top:var(--s-4);margin-bottom:0">
          Made with a pathways thinking tool. Not official advice. Talk to your ECG counsellor.
        </p>
      </div>
    </div>`;
}

async function downloadPlan() {
  const node = document.getElementById('plan-card');
  if (!node) {
    alert('Add at least one thing to your list first.');
    return;
  }
  try {
    const mod = await import('../../vendor/html2canvas.min.js');
    const h2c = window.html2canvas || mod.default;
    const canvas = await h2c(node, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'my-next-term.png';
    a.click();
  } catch (e) {
    console.error(e);
    alert('Could not make the image. Use Print instead, and save as PDF.');
  }
}
