// Chart.js line, with annotation pins for global events.

let chart = null;

export function mountTariffSparkline(data) {
  const canvas = document.getElementById('tariff-canvas');
  const eventsList = document.getElementById('spark-events');
  if (!canvas || !window.Chart) return;

  const series = data['sg-tariff-history'].data;
  const events = data['annotations'].events;

  // Build a lookup
  const eventByQ = Object.fromEntries(events.map((e) => [e.q, e]));

  const labels = series.map((d) => d.q);
  const values = series.map((d) => d.tariff);

  const annotations = {};
  events.forEach((e, i) => {
    annotations['ev' + i] = {
      type: 'line',
      xMin: e.q, xMax: e.q,
      borderColor: getCss('--amber'),
      borderWidth: 1,
      borderDash: [3, 3],
      label: {
        display: false,
      },
    };
  });

  const inkSoft = getCss('--ink-soft');
  const amber   = getCss('--amber');
  const rule    = getCss('--rule');

  if (chart) chart.destroy();
  chart = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Regulated tariff (¢/kWh incl. GST)',
          data: values,
          borderColor: amber,
          backgroundColor: 'rgba(217,143,48,0.10)',
          fill: true,
          tension: 0.32,
          pointRadius: (ctx) => (eventByQ[labels[ctx.dataIndex]] ? 4 : 0),
          pointBackgroundColor: (ctx) => (eventByQ[labels[ctx.dataIndex]] ? amber : 'transparent'),
          pointBorderColor: (ctx) => (eventByQ[labels[ctx.dataIndex]] ? amber : 'transparent'),
          pointHoverRadius: 6,
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: getCss('--ink'),
          borderColor: getCss('--ink'),
          titleFont: { family: getCss('--body') },
          callbacks: {
            label: (ctx) => `${ctx.parsed.y.toFixed(2)}¢/kWh`,
            afterLabel: (ctx) => {
              const ev = eventByQ[labels[ctx.dataIndex]];
              return ev ? `\n${ev.label}\n${ev.detail}` : '';
            },
          },
        },
        annotation: { annotations },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: inkSoft,
            font: { family: getCss('--body'), size: 10 },
            maxRotation: 0,
            autoSkip: true,
            autoSkipPadding: 16,
          },
        },
        y: {
          grid: { color: rule },
          border: { display: false },
          ticks: { color: inkSoft, font: { family: getCss('--body'), size: 10 }, callback: (v) => v + '¢' },
        },
      },
    },
  });

  // events list under the chart
  eventsList.innerHTML = events.map((e) => `<li><strong>${e.q.replace('Q', ' Q')}</strong> — ${e.label}. ${e.detail}</li>`).join('');
}

function getCss(varname) {
  return getComputedStyle(document.documentElement).getPropertyValue(varname).trim() || '#000';
}
