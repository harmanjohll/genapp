import { PERSONAS, getState, setPersona, subscribe } from '../state.js';

export function mountPersonaChooser() {
  const grid = document.getElementById('persona-grid');
  if (!grid) return;
  grid.innerHTML = '';

  Object.values(PERSONAS).forEach((p) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'persona-card';
    card.setAttribute('role', 'radio');
    card.setAttribute('aria-checked', getState().persona === p.id ? 'true' : 'false');
    card.setAttribute('aria-pressed', getState().persona === p.id ? 'true' : 'false');
    card.dataset.id = p.id;
    card.innerHTML = `
      <div class="persona-card__role">${p.label}</div>
      <div class="persona-card__desc">${p.desc}</div>
      <div class="persona-card__hint">${p.hint}</div>
    `;
    card.addEventListener('click', () => {
      setPersona(p.id);
      // gentle scroll into the rest of the dashboard
      const z1 = document.getElementById('zone-1');
      if (z1) z1.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    grid.appendChild(card);
  });

  document.getElementById('persona-skip')?.addEventListener('click', () => {
    setPersona('citizen');
    document.getElementById('zone-1')?.scrollIntoView({ behavior: 'smooth' });
  });

  function render() {
    const cur = getState().persona;
    grid.querySelectorAll('.persona-card').forEach((c) => {
      const on = c.dataset.id === cur;
      c.setAttribute('aria-checked', on ? 'true' : 'false');
      c.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }
  subscribe(render);
  render();
}
