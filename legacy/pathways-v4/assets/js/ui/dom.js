// Minimal DOM helpers. No framework, no dependencies.

export function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function el(tag, attrs = {}, html = '') {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (v == null || v === false) return;
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else node.setAttribute(k, v === true ? '' : String(v));
  });
  if (html) node.innerHTML = html;
  return node;
}

/**
 * Bind by data-action, so no inline handlers appear anywhere.
 *
 * Modes re-render into the same host element and call this again each time, so
 * the listener is installed once per element and the handler map is merged and
 * overwritten in place. Attaching a fresh listener per render instead would
 * leave stale closures alive: one click would then fire every handler ever
 * bound, each holding the stage or plan it captured at the time. That produced
 * a journey that recorded the same age ten times over.
 */
export function onAction(root, handlers) {
  if (!root.__actions) {
    root.__actions = {};
    root.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action]');
      if (!target || !root.contains(target)) return;
      const fn = root.__actions[target.dataset.action];
      if (fn) { e.preventDefault(); fn(target, e); }
    });
  }
  Object.assign(root.__actions, handlers);
}

export function statusChip(status, asOf) {
  if (status === 'provisional') {
    return `<span class="src-chip provisional" title="Not yet read from a primary MOE or SEAB page. Treat as indicative and check.">provisional</span>`;
  }
  if (asOf) return `<span class="src-chip">as of ${esc(asOf)}</span>`;
  return '';
}
