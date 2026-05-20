// Signals page: TLDR synthesis at top, filterable feed below, zoom-in modal on click.

const DATA_URL = '../data/signals.json';

const state = {
  data: null,
  kind: 'all',
  q: '',
};

const KIND_LABEL = {
  'official-sg': 'SG official',
  'operator':    'Operator',
  'regional':    'Regional',
  'intl':        'International',
  'market':      'Market',
  'analyst':     'Analyst',
  'press':       'Press',
  'civil':       'Civil society',
};

async function init() {
  try {
    const res = await fetch(DATA_URL, { cache: 'no-cache' });
    state.data = await res.json();
  } catch (e) {
    document.getElementById('feed-grid').innerHTML = '<p class="muted">Could not load signals.</p>';
    return;
  }

  buildTLDR();
  wireFilters();
  renderFeed();
  wireZoom();

  document.getElementById('tldr-asof').textContent = formatDate(latestDate());
  document.getElementById('tldr-srccount').textContent = Object.keys(state.data.sources).length;
  document.getElementById('footer-date').textContent = formatDate(latestDate());
}

function latestDate() {
  const dates = state.data.items.map((i) => i.date).sort();
  return dates[dates.length - 1];
}

function formatDate(s) {
  if (!s) return '—';
  const d = new Date(s);
  return d.toLocaleDateString('en-SG', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ── TLDR ──────────────────────────────────────────────────────────────

function buildTLDR() {
  // The TLDR is editorial: 3 "what to focus on" cards drawn from items tagged or
  // chosen by recency + kind. We pick by hand here — they're the entry points.
  const items = state.data.items;
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));

  // Card 1: the immediate price signal (latest market or tariff print)
  const card1 = byId['s003']; // Q3 tariff confirmed
  // Card 2: the supply-side weekly signal (Hormuz / cargoes)
  const card2 = byId['s006'] || byId['s001'];
  // Card 3: the pathway / structural signal
  const card3 = byId['s022'] || byId['s016'];

  const grid = document.getElementById('tldr-grid');
  grid.innerHTML = '';
  [
    { item: card1, lab: '01 · The bill',     num: '29.93¢' },
    { item: card2, lab: '02 · The supply',   num: 'Hormuz', warn: true },
    { item: card3, lab: '03 · The pathway',  num: 'Slipping', warn: true },
  ].forEach((t) => {
    if (!t.item) return;
    const src = state.data.sources[t.item.src];
    const card = document.createElement('div');
    card.className = 'tldr-card' + (t.warn ? ' is-warning' : '');
    card.innerHTML = `
      <div class="lab">${t.lab}</div>
      <div class="num">${t.num}</div>
      <div class="body">${t.item.headline}</div>
      <div class="src">${src.name} · <a href="${src.url}" target="_blank" rel="noopener">${src.handle}</a> · ${formatDate(t.item.date)}</div>
    `;
    card.addEventListener('click', () => openZoom(t.item));
    card.style.cursor = 'pointer';
    grid.appendChild(card);
  });

  // The "focus this week" one-liner — the editorial synthesis.
  document.getElementById('tldr-focus').innerHTML =
    'The next tariff hike is real and traceable to a single April event. Imports — the largest lever — are slipping on permitting, not engineering. Watch <em>delivery dates</em>, not announcements.';
}

// ── Filters ───────────────────────────────────────────────────────────

function wireFilters() {
  document.querySelectorAll('.chip-filter').forEach((b) => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.chip-filter').forEach((x) => x.setAttribute('aria-pressed', 'false'));
      b.setAttribute('aria-pressed', 'true');
      state.kind = b.dataset.kind;
      renderFeed();
    });
  });
  const search = document.getElementById('filter-search');
  search.addEventListener('input', () => {
    state.q = search.value.trim().toLowerCase();
    renderFeed();
  });
}

// ── Feed ──────────────────────────────────────────────────────────────

function renderFeed() {
  const grid = document.getElementById('feed-grid');
  grid.innerHTML = '';

  let items = state.data.items.slice().sort((a, b) => (a.date < b.date ? 1 : -1));
  if (state.kind !== 'all') items = items.filter((i) => i.kind === state.kind);
  if (state.q) {
    items = items.filter((i) => {
      const blob = [i.headline, i.body, i.why, state.data.sources[i.src]?.name].join(' ').toLowerCase();
      return blob.includes(state.q);
    });
  }

  document.getElementById('filter-count').textContent = `${items.length} signal${items.length === 1 ? '' : 's'}`;

  if (!items.length) {
    grid.innerHTML = '<p class="muted" style="grid-column:1/-1;">No signals match.</p>';
    return;
  }

  items.forEach((i) => {
    const src = state.data.sources[i.src];
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'signal';
    card.dataset.kind = i.kind;
    card.innerHTML = `
      <div class="signal__top">
        <span class="signal__kind">${KIND_LABEL[i.kind] || i.kind}</span>
        <span class="signal__date">${formatDate(i.date)}</span>
      </div>
      <div class="signal__src">${src.name}<span class="handle">· ${src.handle}</span></div>
      <div class="signal__head">${i.headline}</div>
      <div class="signal__why">↳ ${i.why}</div>
    `;
    card.addEventListener('click', () => openZoom(i));
    grid.appendChild(card);
  });
}

// ── Zoom ──────────────────────────────────────────────────────────────

function wireZoom() {
  document.getElementById('zoom-close').addEventListener('click', closeZoom);
  document.getElementById('zoom-veil').addEventListener('click', closeZoom);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeZoom(); });
}

function openZoom(i) {
  const src = state.data.sources[i.src];
  document.getElementById('zoom-top').innerHTML =
    `<span style="color:var(--amber)">${KIND_LABEL[i.kind] || i.kind}</span> · <span>${formatDate(i.date)}</span> · <span>${src.name}</span>`;
  document.getElementById('zoom-title').textContent = i.headline;
  document.getElementById('zoom-body').textContent = i.body;
  document.getElementById('zoom-why').textContent = i.why;
  document.getElementById('zoom-meta').innerHTML =
    `<strong>${src.name}</strong> · <span>${src.handle}</span>` +
    (src.url ? ` · <a href="${src.url}" target="_blank" rel="noopener">${src.url.replace(/^https?:\/\//, '')}</a>` : '') +
    `<br><span class="muted">Signal id: ${i.id}. The text above is an editorial paraphrase of a real public position by this source; live integration in Phase 2 will replace it with verbatim feeds.</span>`;
  document.getElementById('zoom').classList.add('is-open');
  document.getElementById('zoom-veil').classList.add('is-open');
}

function closeZoom() {
  document.getElementById('zoom').classList.remove('is-open');
  document.getElementById('zoom-veil').classList.remove('is-open');
}

document.addEventListener('DOMContentLoaded', init);
