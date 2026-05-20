// Renders the persistent persona chip in the top bar, opens a small menu
// that re-uses the persona-chooser UI by scrolling back to Zone 0.

import { PERSONAS, getState, setPersona, subscribe } from '../state.js';

export function mountPersonaSwitch(mount) {
  mount.innerHTML = '';

  const chip = document.createElement('button');
  chip.type = 'button';
  chip.className = 'persona-chip';
  chip.setAttribute('aria-haspopup', 'true');
  chip.innerHTML = `
    <span class="persona-chip__dot" aria-hidden="true"></span>
    <span class="persona-chip__label">Reading as <span data-persona-label>—</span></span>
    <span class="persona-chip__role" data-persona-role></span>
    <span class="persona-chip__caret" aria-hidden="true">▾</span>
  `;
  mount.appendChild(chip);

  function render() {
    const { persona } = getState();
    const p = PERSONAS[persona];
    chip.querySelector('[data-persona-label]').textContent = p ? p.label : '—';
    chip.querySelector('[data-persona-role]').textContent = p ? `· ${p.short}` : '· choose';
  }

  chip.addEventListener('click', () => {
    // Scroll to Zone 0 so the user re-picks from the full chooser.
    const z0 = document.getElementById('zone-0');
    if (z0) z0.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  render();
  subscribe(render);
}
