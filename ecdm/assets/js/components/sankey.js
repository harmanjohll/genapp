// D3 sankey of gas imports → Singapore generation.

export function mountSankey(data) {
  const svgWrap = document.getElementById('sankey');
  const fallback = document.getElementById('sankey-fallback');

  if (!window.d3 || !window.d3.sankey) {
    svgWrap.innerHTML = '<p class="muted small">Sankey visualisation unavailable; see flow list below.</p>';
  }

  // Build nodes + links from data.
  const imports = data['sg-gas-imports'];
  const nodes = [];
  const idx = new Map();
  function addNode(name, group) {
    if (!idx.has(name)) {
      idx.set(name, nodes.length);
      nodes.push({ name, group });
    }
    return idx.get(name);
  }

  // Origin -> mode -> Singapore
  const sgIdx  = addNode('Singapore · 31 power plants', 'dest');
  imports.modes.forEach((m) => {
    const modeIdx = addNode(m.mode, 'mode');
    // mode -> SG
    // sum link added later
  });

  const links = [];
  imports.modes.forEach((m) => {
    const modeIdx = idx.get(m.mode);
    m.origins.forEach((o) => {
      const oIdx = addNode(o.country, 'origin');
      links.push({ source: oIdx, target: modeIdx, value: o.share, chokepoint: o.chokepoint });
    });
    links.push({ source: modeIdx, target: sgIdx, value: m.share });
  });

  // Fallback list (mobile)
  fallback.innerHTML = '<ul>' + imports.modes.flatMap((m) =>
    m.origins.map((o) => `<li><span>${o.country} <span class="muted small">via ${m.mode}${o.chokepoint ? ' · ' + o.chokepoint : ''}</span></span><span class="pct tnum">${o.share}%</span></li>`)
  ).join('') + '</ul>';

  if (!window.d3 || !window.d3.sankey) return;

  const W = svgWrap.clientWidth || 720;
  const H = Math.min(440, Math.max(320, W * 0.55));
  const svg = d3.select(svgWrap).html('').append('svg')
    .attr('viewBox', `0 0 ${W} ${H}`)
    .attr('width', '100%')
    .attr('height', H);

  const sankey = d3.sankey()
    .nodeWidth(12)
    .nodePadding(14)
    .extent([[8, 8], [W - 8, H - 18]]);

  // d3-sankey mutates input — clone
  const graph = sankey({
    nodes: nodes.map((d) => ({ ...d })),
    links: links.map((d) => ({ ...d })),
  });

  function colorFor(d) {
    if (d.group === 'dest') return getCss('--ink');
    if (d.group === 'mode') return d.name === 'Pipeline' ? getCss('--teal-deep') : getCss('--amber-soft');
    return getCss('--amber');
  }

  // links
  const linkSel = svg.append('g').attr('class', 'links')
    .selectAll('path').data(graph.links).join('path')
    .attr('class', (d) => 'link' + (d.chokepoint === 'Strait of Hormuz' ? ' is-hormuz' : ''))
    .attr('d', d3.sankeyLinkHorizontal())
    .attr('stroke', (d) => d.chokepoint === 'Strait of Hormuz' ? getCss('--critical') : getCss('--amber'))
    .attr('stroke-width', (d) => Math.max(1, d.width));

  linkSel.append('title').text((d) => {
    const from = d.source.name;
    const to   = d.target.name;
    return `${from} → ${to}: ${d.value}%${d.chokepoint ? ' · ' + d.chokepoint : ''}`;
  });

  // nodes
  const node = svg.append('g').attr('class', 'nodes')
    .selectAll('g').data(graph.nodes).join('g').attr('class', 'node');

  node.append('rect')
    .attr('x', (d) => d.x0).attr('y', (d) => d.y0)
    .attr('width', (d) => d.x1 - d.x0)
    .attr('height', (d) => Math.max(2, d.y1 - d.y0))
    .attr('fill', (d) => colorFor(d));

  node.append('text')
    .attr('x', (d) => d.x0 < W / 2 ? d.x1 + 6 : d.x0 - 6)
    .attr('y', (d) => (d.y0 + d.y1) / 2)
    .attr('dy', '0.34em')
    .attr('text-anchor', (d) => d.x0 < W / 2 ? 'start' : 'end')
    .text((d) => d.name);

  // Hormuz call-out
  const hormuzLink = graph.links.find((l) => l.chokepoint === 'Strait of Hormuz');
  if (hormuzLink) {
    const mid = {
      x: (hormuzLink.source.x1 + hormuzLink.target.x0) / 2,
      y: (hormuzLink.y0 + hormuzLink.y1) / 2,
    };
    svg.append('text')
      .attr('class', 'hormuz-call')
      .attr('x', mid.x).attr('y', mid.y - 10)
      .attr('text-anchor', 'middle')
      .text('via Strait of Hormuz');
  }

  // gentle breathing on links (skip if reduced motion)
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let t = 0;
    function tick() {
      t += 0.02;
      linkSel.attr('stroke-opacity', (d, i) => 0.42 + Math.sin(t + i) * 0.06);
      raf = requestAnimationFrame(tick);
    }
    let raf = requestAnimationFrame(tick);
  }
}

function getCss(varname) {
  return getComputedStyle(document.documentElement).getPropertyValue(varname).trim() || '#000';
}
