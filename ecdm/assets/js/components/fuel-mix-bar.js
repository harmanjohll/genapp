// Hero stacked horizontal bar. Plain DOM, animates via width transitions.

export function mountFuelMix(data) {
  const series2024 = data['sg-fuel-mix'].series.find((s) => s.year === '2024');
  const series2025 = data['sg-fuel-mix'].series.find((s) => s.year === '2025H1');

  const bar    = document.getElementById('fuel-mix-bar');
  const legend = document.getElementById('fuel-mix-legend');
  const overlay= document.getElementById('fuel-mix-overlay');

  bar.innerHTML = '';
  legend.innerHTML = '';

  series2024.values.forEach((v) => {
    const seg = document.createElement('div');
    seg.className = 'fuel-mix__seg';
    seg.dataset.tone = v.tone;
    seg.title = `${v.fuel} — ${v.pct.toFixed(1)}%`;
    bar.appendChild(seg);

    const li = document.createElement('li');
    li.innerHTML = `
      <span class="sw" style="background:${toneColor(v.tone)}"></span>
      <span class="pct tnum">${v.pct.toFixed(1)}%</span>
      <span>${v.fuel}</span>
    `;
    legend.appendChild(li);
  });

  // animate widths after first paint
  requestAnimationFrame(() => {
    const segs = bar.querySelectorAll('.fuel-mix__seg');
    series2024.values.forEach((v, i) => {
      segs[i].style.width = `${v.pct}%`;
    });
  });

  const gas2024 = series2024.values[0].pct.toFixed(1);
  const gas2025 = series2025.values[0].pct.toFixed(1);
  overlay.textContent = `2024 gas share ${gas2024}% · 2025 H1 ${gas2025}% — the line is bending, gently.`;
}

function toneColor(tone) {
  switch (tone) {
    case 'amber':   return 'var(--amber)';
    case 'teal':    return 'var(--teal)';
    case 'neutral': return 'var(--neutral)';
    case 'smoke':   return 'var(--smoke)';
    default:        return 'var(--ink-mute)';
  }
}
