// Stepped line of carbon tax 2019 → 2050.

let chart = null;

export function mountCarbonTaxStep(data) {
  const canvas = document.getElementById('tax-canvas');
  if (!canvas || !window.Chart) return;

  const steps = data['carbon-tax-timeline'].steps;
  // Expand into year-by-year series.
  const labels = [];
  const values = [];
  steps.forEach((s) => {
    for (let y = s.from; y <= s.to; y++) {
      labels.push(String(y));
      values.push(s.rate);
    }
  });

  const ink = getCss('--ink');
  const amber = getCss('--amber');
  const rule = getCss('--rule');

  if (chart) chart.destroy();
  chart = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Carbon tax (S$/tCO₂e)',
          data: values,
          stepped: 'before',
          borderColor: ink,
          backgroundColor: 'rgba(217,143,48,0.14)',
          fill: true,
          borderWidth: 2,
          pointRadius: (ctx) => (isStepEdge(ctx.dataIndex, values) ? 4 : 0),
          pointBackgroundColor: amber,
          pointBorderColor: amber,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: (ctx) => `S$${ctx.parsed.y}/tCO₂e` },
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { family: getCss('--body'), size: 10 }, autoSkip: true, autoSkipPadding: 20 } },
        y: {
          grid: { color: rule },
          border: { display: false },
          ticks: { font: { family: getCss('--body'), size: 10 }, callback: (v) => 'S$' + v },
          suggestedMax: 90,
        },
      },
    },
  });
}

function isStepEdge(i, arr) {
  if (i === 0) return true;
  return arr[i] !== arr[i - 1];
}

function getCss(varname) {
  return getComputedStyle(document.documentElement).getPropertyValue(varname).trim() || '#000';
}
