# Paths v4

A planning and conversation tool for Singapore students, parents and teachers
under Full Subject Based Banding, first SEC cohort. Version 4 reorganises the
app year by year: a page each for P6, Sec 1, Sec 2, Sec 3, Sec 4 and Sec 5,
then After Sec. **v1, v2 and v3 are frozen** and stay as controls.

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
# then open http://localhost:8000/pathways4/
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
cd pathways4 && node tools/verify.mjs
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
