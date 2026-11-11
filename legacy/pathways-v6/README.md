# Paths

A planning and conversation tool for Singapore students, parents and teachers
under Full Subject Based Banding, for the first SEC cohort.

Share it as **genapp/pathways.html**, which opens this folder. This README
describes the app as it is now. Its version history, and what each earlier
build was for, is in [`../PATHWAYS_VERSIONS.md`](../PATHWAYS_VERSIONS.md);
earlier builds are frozen in [`../legacy/`](../legacy/).

Read `DESIGN.md` for the design decisions and the checks behind them.
Research notes, with every source, are in `research/`.

## What it does

Four tabs:

- **Path.** P6 to after Sec on one line. Each year opens in place with its
  levels, the best move and the dates that matter. A next step card sits on
  top when the open year cannot show that step itself. "Try a what if" opens
  Compare for that year.
- **Goal.** From what a student enjoys, to the work that fits, the place that
  leads there and the course family; then what that asks of each school year,
  and the best move for it now.
- **Explore.** The 8 places after Sec (what each asks for and costs), jobs and
  sectors, fees and financial help, school types, help for parents and
  teachers, and the game.
- **Saved.** Saved moves, grade targets and the printable plan. It also opens
  the plan card and share link, and a 15 minute counsellor session.

Underneath:

- **Advice that names the move.** "If any one of Social Studies with
  Geography, Mother Tongue or Principles of Accounts moves up to G3,
  Polytechnic opens." Single moves, pairs, and what is holding a door open.
- **Targets.** Grades now and aimed for, read as L1R4, ELR2B2 and ELMAB3
  against each cut off, with the grade steps that close a gap.
- **Words for the conversation.** Every move carries the words to say to a
  real person, voiced for a student, a parent or a teacher.
- **Private and offline.** No account, nothing leaves the device, and no
  network calls at runtime. Fonts (Bricolage Grotesque, JetBrains Mono; OFL)
  and icons (Phosphor; MIT) are bundled, and a service worker keeps a copy
  for use with no signal.

## Where things are

| Part | Where |
| --- | --- |
| Screens | `assets/js/screens/`: `path`, `goal`, `explore`, `myplan` (Saved), `year`, `after`, `compare`, `share`, `session`, `play` and the rest |
| Rules and advice | `assets/js/engine/`: `reach.js`, `years.js`, `advice.js`, `grades.js`, `psle.js`, `goal.js` |
| Data | `data/*.json`, each with a `_meta` block saying where it came from and when |
| Beatty's subjects | `data/offer.json`. It mirrors `../e21cclog/school/beatty.json`: change both together |
| Saved plans | `localStorage` key `paths6.state.v1`. The first visit joins what older builds saved on the device (`engine/migrate.js`) |
| Words | `STYLE.md`, checked by `engine/style-lint.js` |
| Visible labels | `assets/js/ui/labels.js`: plain words, and the transit words of Line mode |

Some file names carry an old number (`tokens4.css`, `v4.css`, `journey4.js`).
They are names only; renaming them would gain nothing and break caches.

## Run locally

```bash
# from the repository root
python3 -m http.server 8000
# then open http://localhost:8000/pathways/
```

| URL | What it opens |
| --- | --- |
| `?s=path&y=sec2` | The path, with one year open |
| `?s=goal`, `?s=explore`, `?s=myplan` | The other three tabs |
| `?s=year&y=sec2` | A year page (`p6`, `sec1` to `sec5`); `&tab=advice`, `targets` or `year` |
| `?s=after`, `?s=dest&id=poly` | The 8 places, and one place's page |
| `?s=compare&y=sec2` | Plan A beside Plan B for a year |
| `?s=share`, `?s=shared&d=...` | Share a plan; a shared plan, read only |
| `?s=session` | The counsellor session |
| `?s=play` | The game |
| `?sec1=el3~maths2&sec3=...` | Loads year plans from a link |
| `?s=home`, `?s=plan`, `?mode=now` | Older addresses land on the right screen |
| `?board=1`, `?guest=1`, `?dev=1` | Projector mode; a guest session that saves nothing; the checks in the browser console |

## Checks

```bash
node pathways/tools/verify.mjs    # from the repository root
```

Every sweep must say PASS before a push. They cover the rules and their
invariants, the advice, grades and PSLE, policy fixtures, the school offer,
house style, contrast, offline use, that every screen is within two taps of
the menu, and how older saved plans come across.

## Before students see it

1. `node pathways/tools/verify.mjs`: every sweep PASS.
2. The 2028 admission rules were re-checked on 2026-10-27 from search engine
   extracts of the MOE, SEAB and institution pages. Eyeball the confirmed
   rows once on moe.gov.sg. Course families stay provisional until the 2028
   lists arrive on CourseFinder in mid 2027.
3. Beatty specifics in use: the subject offer (`data/offer.json`) and the
   2025 PSLE posting ranges on the P6 page.
4. The "a day at" stories on each place's page are composites, labelled as
   such. Beatty alumni stories can replace them (`data/daysin.json`).

## Releasing

`node pathways/tools/release.mjs x.y.z` stamps the version everywhere a
browser might cache it. Then add the notes to `data/version.json` and a line
to `../PATHWAYS_VERSIONS.md`.
