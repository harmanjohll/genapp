# ECDM — Energy: Choices, Decisions, Models

A persona-aware civic dashboard on Singapore's structural energy exposure. Built from the brief in `SG_ENERGY_CRISIS_SPEC.md`.

Live at `./index.html` — the dashboard is a static site with zero build step.

## Run locally

Any static file server will work. From the repo root:

```bash
python3 -m http.server 8000
# then open http://localhost:8000/ecdm/
```

Or:

```bash
npx http-server -p 8000
```

ES modules require an HTTP origin — opening `index.html` directly with `file://` will fail to load `assets/js/main.js`.

## Structure

```
ecdm/
├── index.html                    # entry
├── METHODOLOGY.md                # what we did and did not claim
├── OPEN_QUESTIONS.md             # editorial decisions left to the maintainer
├── assets/
│   ├── css/  tokens, base, components — vanilla CSS, no Tailwind
│   └── js/   ES modules
│       ├── main.js, state.js, data-loader.js
│       ├── components/  charts, sankey, mixer, toggles
│       └── zones/       one module per section of the page
└── data/                         # every number lives here, with _meta source + date
```

## How the model works

Every number on the dashboard resolves to a JSON file in `/data/`. Each file declares a `_meta` block with `source`, `url`, `accessed`, `units`, `notes`. The loader picks the oldest `accessed` date across all files and surfaces a stale-data banner if it is more than 90 days old.

The Decision Studio (Zone 4) is a small live model:

- five linked sliders for the pathways (gas / solar / imports / hydrogen / nuclear+CCS),
- a horizon-year scrubber (2026 → 2030 → 2032 → 2040 → 2050),
- feasibility envelopes from `pathway-models.json` flag slider positions that exceed published plausibility caps,
- outputs (carbon, fiscal revenue, import dependence, land, household bill) recompute on every change.

Persona selection (Zone 0) re-skins:

- the hero subhead (Zone 1),
- the slider set + outputs shown (Zone 4),
- the action cards (Zone 6).

It never hides a zone.

## Sources

See `METHODOLOGY.md` and the footer of the dashboard.
