// D3 horizontal grouped bars comparing per-capita kWh and carbon intensity (g/kWh).
// Reflows on scope change.

import { getState, subscribe } from '../state.js';

let store = null;

export function mountComparator(data) {
  store = data;
  render();
  subscribe(render);
}

function render() {
  const mount = document.getElementById('comparator');
  if (!mount || !window.d3) return;

  const scope = getState().scope;
  const rows = scope === 'sg'
    ? store['comparators'].regional.filter((r) => r.country === 'Singapore')
    : scope === 'regional'
      ? store['comparators'].regional
      : store['comparators'].international;

  // Layout
  const W = mount.clientWidth || 800;
  const H = Math.max(220, rows.length * 38 + 40);
  const margin = { top: 24, right: 24, bottom: 16, left: 130 };
  const innerW = W - margin.left - margin.right;
  const half = innerW / 2 - 16;

  mount.innerHTML = '';
  const svg = d3.select(mount).append('svg')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .attr('width', '100%').attr('height', H);

  const g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

  // headers
  g.append('text').attr('class', 'bar-label').attr('x', 0).attr('y', -8).text('Carbon intensity (gCO₂/kWh)');
  g.append('text').attr('class', 'bar-label').attr('x', half + 32).attr('y', -8).text('Per-capita electricity (kWh / year)');

  // scales
  const maxCarbon = d3.max(rows, (d) => d.gco2_per_kwh) || 800;
  const maxKwh    = d3.max(rows, (d) => d.per_capita_kwh) || 60000;
  const xCarbon = d3.scaleLinear().domain([0, maxCarbon]).range([0, half]);
  const xKwh    = d3.scaleLinear().domain([0, maxKwh]).range([0, half]);
  const y = d3.scaleBand().domain(rows.map((r) => r.country)).range([0, H - margin.top - margin.bottom]).padding(0.35);

  // country labels (left)
  g.selectAll('.country').data(rows).enter().append('text')
    .attr('class', 'axis')
    .attr('x', -8).attr('y', (d) => y(d.country) + y.bandwidth() / 2)
    .attr('text-anchor', 'end').attr('dy', '0.34em')
    .style('font-family', getCss('--body')).style('font-size', '0.82rem')
    .style('fill', (d) => d.country === 'Singapore' ? getCss('--ink') : getCss('--ink-soft'))
    .text((d) => d.country);

  // carbon bars
  g.selectAll('.bar-carbon').data(rows).enter().append('rect')
    .attr('class', (d) => 'bar' + (d.country === 'Singapore' ? ' sg' : ''))
    .attr('x', 0).attr('y', (d) => y(d.country))
    .attr('width', (d) => xCarbon(d.gco2_per_kwh))
    .attr('height', y.bandwidth())
    .attr('fill', getCss('--amber'));

  g.selectAll('.lbl-carbon').data(rows).enter().append('text')
    .attr('class', 'bar-label')
    .attr('x', (d) => Math.min(half, xCarbon(d.gco2_per_kwh) + 6))
    .attr('y', (d) => y(d.country) + y.bandwidth() / 2)
    .attr('dy', '0.34em')
    .text((d) => `${d.gco2_per_kwh}`);

  // kWh bars (right pane)
  const right = g.append('g').attr('transform', `translate(${half + 32}, 0)`);
  right.selectAll('.bar-kwh').data(rows).enter().append('rect')
    .attr('class', (d) => 'bar' + (d.country === 'Singapore' ? ' sg' : ''))
    .attr('x', 0).attr('y', (d) => y(d.country))
    .attr('width', (d) => xKwh(d.per_capita_kwh))
    .attr('height', y.bandwidth())
    .attr('fill', getCss('--teal'));

  right.selectAll('.lbl-kwh').data(rows).enter().append('text')
    .attr('class', 'bar-label')
    .attr('x', (d) => Math.min(half, xKwh(d.per_capita_kwh) + 6))
    .attr('y', (d) => y(d.country) + y.bandwidth() / 2)
    .attr('dy', '0.34em')
    .text((d) => d.per_capita_kwh.toLocaleString());

  // tooltips
  g.selectAll('rect').append('title')
    .text(function () {
      const d = d3.select(this.parentNode).datum();
      return `${d.country} — ${d.share_label}\n${d.why}`;
    });
}

function getCss(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim() || '#000'; }
