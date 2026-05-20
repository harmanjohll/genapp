import { SCOPES, getState, setScope, subscribe } from '../state.js';

export function mountGeoToggle(mount) {
  mount.innerHTML = '';
  const group = document.createElement('div');
  group.className = 'geo-toggle';
  group.setAttribute('role', 'group');
  group.setAttribute('aria-label', 'Comparator scope');

  Object.values(SCOPES).forEach((s) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'geo-toggle__btn';
    btn.textContent = s.label;
    btn.dataset.id = s.id;
    btn.setAttribute('aria-pressed', getState().scope === s.id ? 'true' : 'false');
    btn.addEventListener('click', () => setScope(s.id));
    group.appendChild(btn);
  });

  mount.appendChild(group);

  function render() {
    const cur = getState().scope;
    group.querySelectorAll('.geo-toggle__btn').forEach((b) => {
      b.setAttribute('aria-pressed', b.dataset.id === cur ? 'true' : 'false');
    });
  }
  subscribe(render);
}
