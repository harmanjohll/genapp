# Paths 6.0

The latest Paths, and the one to build on. Share it as **genapp/pathways.html**,
which forwards here. 6.0 joins v4.4 and v5 into one app; every version, what is
critical in it and why it was superseded is logged in
[`../PATHWAYS_VERSIONS.md`](../PATHWAYS_VERSIONS.md). v1 to v4.4 are frozen in
[`../legacy/`](../legacy/); `../pathways5/` only forwards here.

## What 6.0 is

- **Four tabs.** Path, Goal, Explore and Saved (`NAV_ITEMS` in `assets/js/main.js`).
- **Path** (`screens/path.js`) is home: P6 to after Sec on one line, each year
  opening in place with its levels, best move and dates. v4's next step sits on
  top for what the open year cannot show (`nextStep`). "Try a what if" opens
  Compare (`screens/compare.js`) for that year.
- **Goal** (`screens/goal.js`, `engine/goal.js`) works back from what a student
  enjoys to this year's moves.
- **Explore** (`screens/explore.js`) holds the 8 places, jobs, fees, school
  types, help for parents and teachers, and the game.
- **Saved** (`screens/myplan.js`) keeps moves, targets and the printable plan,
  and opens the plan card and link (`screens/share.js`) and the counsellor
  session (`screens/session.js`).
- **Saved plans.** Stored under `paths6.state.v1`. The first visit joins what
  v4.4 and v5 saved on the device (`engine/migrate.js`) and never writes to
  their keys.
- **Checks.** `node pathways/tools/verify.mjs`: 30 sweeps, including Reachable
  (every screen within two taps of the menu) and Migrate.

The notes below describe the v4 base 6.0 is built on; they still hold.

A planning and conversation tool for Singapore students, parents and teachers
under Full Subject Based Banding, first SEC cohort. Version 4 reorganises the
app year by year: a page each for P6, Sec 1, Sec 2, Sec 3, Sec 4 and Sec 5,
then After Sec.

Read `DESIGN.md` for the audit, the decisions and the verification gates.
Research notes, with every source, are in `research/`.

## What v4 is, in six lines

- **Year by year.** One transit line across the top (Primary · Lower Sec ·
  Upper Sec · After Sec), one page per year, each with its own levels.
- **The answer stays in view.** Tabs that each fit a screen (Levels, Advice,
  Targets, This year), a dock on phones and a side panel on wide screens.
- **Advice that names the move.** "If any one of Social Studies with
  Geography, Mother Tongue or Principles of Accounts moves up to G3,
  Polytechnic opens." Single moves, pairs, and what is holding a door open.
- **Targets.** Enter grades now and aimed for; see L1R4, ELR2B2 and ELMAB3
  against each cut off, and the grade steps, by name, that close a gap.
- **Planning and conversation together.** Every piece of advice carries the
  words to say to a real person, voiced for a student, a parent or a teacher.
  My plan gathers it all on one printable page.
- **The night line.** Navy and signal yellow, a departures board that flips
  as you slide a level, advice as tickets, scores as a train on a track.
  Bricolage Grotesque and JetBrains Mono (OFL) and Phosphor icons (MIT),
  all bundled: still zero network calls at runtime.
- **The game, restyled.** Play is unchanged underneath and now reads its
  subjects from the year pages.

## Run locally

```bash
# from the repository root
python3 -m http.server 8000
# then open http://localhost:8000/pathways/
```

| URL | What it does |
| --- | --- |
| `?s=year&y=sec2` | A year page (`p6`, `sec1` to `sec5`); `&tab=advice`, `targets`, `year` |
| `?s=after` / `?s=dest&id=poly` | The eight destinations, and one destination's page |
| `?s=myplan` | The conversation card |
| `?s=play` | The game |
| `?sec1=el3~maths2&sec3=...` | Loads year plans from a link (the carry link writes these) |
| `?s=plan`, `?mode=now` | v3 and v2 addresses redirect to the year page |
| `?board=1`, `?guest=1`, `?dev=1` | As in v3 |

Terminal sweeps, no browser needed:

```bash
cd pathways && node tools/verify.mjs
```

## Before students see it

1. `node tools/verify.mjs`: every sweep PASS, including the four v4 gates
   (advice, grades, PSLE, dashes).
2. Figures were re-checked on 2026-10-27 from search engine extracts of
   the MOE, SEAB and institution pages (the research session could not
   open the pages end to end). Eyeball the confirmed rows once on
   moe.gov.sg. Course families are all provisional until the 2028 lists
   arrive on CourseFinder in mid 2027.
3. Beatty specifics in use: the 2025 PSLE posting ranges on the P6 page.
   School subject list and review criteria are national defaults for now.
