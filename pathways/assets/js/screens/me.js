// Me: the compass. Who the student says they are, in their own taps and words.
//
// 6.0 knew a student's levels and where they led, and nothing about the
// student. The game tracked curiosity and persistence, but only inside a
// story. This is the first of MOE's three guiding questions given its own
// place: what you enjoy, what you are good at, what matters to you, and
// where you are aiming.
//
// The student writes all of it. The app offers words to tap and never works
// out a type, a score or a match. What is here feeds the goal, the game and
// the counsellor session, and leaves the device only if the student adds it
// to a card they share.
//
// One part is open at a time, so the page is the compass and one short list.
// Taps redraw in place and put focus back where the finger was.

import {
  getState, toggleEnjoy, toggleValue, toggleStrength, setProof, addNote, dropNote, compassFill,
} from '../state.js?v=7.0.0';
import { compassSvg, POINTS, nextPoint, pips, compassWords } from '../ui/compass.js?v=7.0.0';
import { esc, onAction } from '../ui/dom.js?v=7.0.0';
import { icon } from '../ui/icons.js?v=7.0.0';
import { goalLine } from './path.js?v=7.0.0';

const COLOR = { enjoy: 'var(--cp-enjoy)', strengths: 'var(--cp-good)', values: 'var(--cp-matter)', goal: 'var(--cp-aim)' };
const NEXT_WORDS = { strengths: 'what you are good at', values: 'what matters to you', goal: 'where you are aiming' };

const day = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

/** The words a student picked for one part, in the order the lists give them. */
function picked(api, part) {
  return compassWords(api.data, getState().compass)[part] || [];
}

function chip(action, key, label, on) {
  return `<button type="button" class="mechip press" data-action="${action}" data-key="${esc(key)}" aria-pressed="${on}">${on ? icon('check') : ''}<span>${esc(label)}</span></button>`;
}

function bodyHtml(api, part) {
  const st = getState();
  const c = st.compass;
  const cd = api.data.compass || {};
  if (part === 'enjoy') {
    return `<div class="chipset wide">${((api.data.goals || {}).interests || []).map((x) => chip('me-enjoy', x.code, x.label, c.enjoy.includes(x.code))).join('')}</div>`;
  }
  if (part === 'strengths') {
    const rows = c.strengths.map((r) => ({ ...r, label: ((cd.strengths || []).find((x) => x.id === r.id) || {}).label })).filter((r) => r.label);
    return `<div class="chipset">${(cd.strengths || []).map((x) => chip('me-strength', x.id, x.label, c.strengths.some((r) => r.id === x.id))).join('')}</div>
      ${rows.length ? `<div class="proofs">${rows.map((r) => `<label class="proof"><span>${esc(r.label)}</span>
        <input type="text" maxlength="90" data-proof="${esc(r.id)}" value="${esc(r.proof)}" placeholder="${esc(cd.proofHint || 'What shows it? One line.')}" autocomplete="off"></label>`).join('')}</div>` : ''}`;
  }
  if (part === 'values') {
    return `<div class="chipset">${(cd.values || []).map((x) => chip('me-value', x.id, x.label, c.values.includes(x.id))).join('')}</div>`;
  }
  return st.goal
    ? `<p class="me-goal">${icon('target')}<span>${esc(goalLine(api, st.goal))}</span></p>
       ${st.goal.why ? `<p class="small">${esc(st.goal.why)}</p>` : ''}
       <p><button type="button" class="btn small press" data-action="go" data-s="goal">Open your goal ${icon('arrow')}</button></p>`
    : `<p><button type="button" class="btn press" data-action="go" data-s="goal">${icon('target')} Set a goal</button></p>`;
}

function partHtml(api, p, open, fill) {
  const meta = ((api.data.compass || {}).parts || []).find((x) => x.id === p.id) || { head: p.short, ask: '' };
  const n = fill[p.id] || 0;
  const isOpen = open === p.id;
  const words = picked(api, p.id);
  const after = POINTS[POINTS.indexOf(p) + 1];
  const sum = p.id === 'goal'
    ? (getState().goal ? esc(goalLine(api, getState().goal)) : 'No goal yet')
    : (words.length ? words.map((w) => `<span>${esc(w)}</span>`).join('') : 'Nothing picked yet');
  return `<section class="mepart" data-part="${p.id}" data-open="${isOpen}" data-filled="${n > 0}" style="--pc:${COLOR[p.id]}">
    <button type="button" class="mepart-h press" data-action="me-open" data-part="${p.id}" data-key="h-${p.id}" aria-expanded="${isOpen}">
      <span class="mepart-dot" aria-hidden="true"></span>
      <span class="mepart-t">${esc(meta.head)}</span>
      <span class="mepart-n">${n} of ${p.max}</span>
      ${icon('caret', 'mepart-chev')}
    </button>
    ${isOpen ? `<div class="mepart-b">
      ${p.id !== 'goal' ? `<p class="small mepart-ask" id="me-ask-${p.id}">${esc(meta.ask)}</p>` : ''}
      ${bodyHtml(api, p.id)}
      ${after && n > 0 ? `<p class="mepart-next"><button type="button" class="btn ghost small press" data-action="me-open" data-part="${after.id}" data-key="n-${after.id}">Next: ${esc(NEXT_WORDS[after.id])} ${icon('arrow')}</button></p>` : ''}
    </div>` : `<p class="mepart-sum${p.id === 'goal' || !words.length ? ' plain' : ''}">${sum}</p>`}
  </section>`;
}

function notesHtml(api) {
  const notes = getState().compass.notes;
  const hint = (api.data.compass || {}).noteHint || 'Something you noticed about yourself.';
  return `<section class="menotes">
    <h2 class="advh">What you noticed</h2>
    ${notes.length ? `<ul class="notelist">${notes.map((n, i) => `<li>
      <span class="note-t">${esc(n.text)}</span>
      <small>${n.from === 'play' ? 'From the game' : 'You wrote'}${day(n.t) ? ` · ${esc(day(n.t))}` : ''}</small>
      <button type="button" class="iconbtn press" data-action="me-note-drop" data-i="${i}" aria-label="Remove this line">${icon('x')}</button></li>`).join('')}</ul>` : ''}
    <div class="noteadd">
      <input type="text" id="me-note" maxlength="140" placeholder="${esc(hint)}" autocomplete="off" aria-label="${esc(hint)}">
      <button type="button" class="btn small press" data-action="me-note-add" data-key="note-add">${icon('plus')} Add</button>
    </div>
  </section>`;
}

export default {
  id: 'me',
  title: 'Me',
  era: 'school',

  render(root, api) {
    const draw = (focusKey) => {
      const st = getState();
      const fill = compassFill();
      const q = api.route().q;
      const next = nextPoint(fill);
      const open = POINTS.some((p) => p.id === q.part) ? q.part : (q.part === 'none' ? null : next);
      const prompts = (((api.data.compass || {}).prompts || {})[st.role]) || [];
      const done = POINTS.filter((p) => fill[p.id] > 0).length;
      root.innerHTML = `
      <div class="wrap-narrow mewrap">
        <header class="ph arrive">
          <p class="ph-k">Me</p>
          <h1>${st.role === 'student' ? 'Your compass' : 'The compass'}</h1>
          <p class="lede">${st.role === 'student' ? 'Four things only you can say. Change them any time.' : 'Four things only the student can say.'}</p>
        </header>
        <div class="rosebox arrive">
          ${POINTS.map((p) => `<button type="button" class="rose-l rose-${p.id} press" data-action="me-open" data-part="${p.id}" data-key="r-${p.id}" aria-pressed="${open === p.id}" style="--pc:${COLOR[p.id]}">
            <b>${esc(p.short)}</b>${pips(p, fill[p.id] || 0)}</button>`).join('')}
          <div class="rose-svg">${compassSvg(fill, { open, label: `Your compass. ${done} of 4 points filled.` })}</div>
        </div>
        ${st.role !== 'student' && prompts.length ? `<div class="bubbles">${prompts.map((x) => `<p class="bubble">${esc(x)}</p>`).join('')}</div>` : ''}
        <div class="meparts">${POINTS.map((p) => partHtml(api, p, open, fill)).join('')}</div>
        ${notesHtml(api)}
        <p class="btnrow me-on">
          ${st.goal ? '' : `<button type="button" class="btn press" data-action="go" data-s="goal">${icon('target')} Set a goal from this</button>`}
          <button type="button" class="btn ${st.goal ? '' : 'ghost'} press" data-action="go" data-s="play">${icon('play')} Play it forward</button>
        </p>
      </div>`;

      // A point on the drawing opens its part, the same as its label.
      root.querySelectorAll('.cp-point').forEach((g) => { g.dataset.action = 'me-open'; g.dataset.part = g.dataset.point; });
      root.querySelectorAll('input[data-proof]').forEach((inp) => {
        inp.addEventListener('change', () => setProof(inp.dataset.proof, inp.value));
      });
      const note = root.querySelector('#me-note');
      if (note) note.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } });
      if (focusKey) {
        const el = root.querySelector(`[data-key="${focusKey}"]`);
        if (el) el.focus({ preventScroll: true });
      }
    };

    const add = () => {
      const inp = root.querySelector('#me-note');
      if (!inp || !inp.value.trim()) return;
      const ok = addNote(inp.value, 'me');
      api.announce(ok ? 'Added.' : 'That line is already here.');
      draw('note-add');
    };

    const full = (part, max) => {
      api.announce(`${max} is the most. Take one off first.`);
      const ask = root.querySelector(`#me-ask-${part}`);
      if (ask) { ask.textContent = `${max} is the most. Take one off first.`; ask.dataset.full = 'true'; }
    };

    draw();

    onAction(root, {
      'me-open': (btn) => {
        const part = btn.dataset.part;
        const cur = root.querySelector('.mepart[data-open="true"]');
        api.setQuery({ part: cur && cur.dataset.part === part ? 'none' : part });
        draw(btn.dataset.key && btn.dataset.key.startsWith('n-') ? `h-${part}` : btn.dataset.key || `h-${part}`);
        const sec = root.querySelector(`.mepart[data-part="${part}"]`);
        if (sec && sec.dataset.open === 'true' && sec.getBoundingClientRect().top > window.innerHeight * 0.6) {
          sec.scrollIntoView({ block: 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
        }
      },
      'me-enjoy': (btn) => { api.setQuery({ part: 'enjoy' }); toggleEnjoy(btn.dataset.key); draw(btn.dataset.key); },
      'me-strength': (btn) => {
        api.setQuery({ part: 'strengths' });
        if (toggleStrength(btn.dataset.key) === false) { full('strengths', 3); return; }
        draw(btn.dataset.key);
      },
      'me-value': (btn) => {
        api.setQuery({ part: 'values' });
        if (toggleValue(btn.dataset.key) === false) { full('values', 3); return; }
        draw(btn.dataset.key);
      },
      'me-note-add': () => add(),
      'me-note-drop': (btn) => { dropNote(Number(btn.dataset.i)); draw('note-add'); },
    });
  },
};
