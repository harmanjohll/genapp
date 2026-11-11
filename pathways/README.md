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

Five tabs, in the order of MOE's three guiding questions (Who am I? Where do
I want to go? How do I get there?):

- **Me.** The compass: what a student enjoys, is good at and cares about, and
  where they are aiming. The student fills it in by tapping, and can add one
  line of proof to each strength and lines they noticed about themselves.
  Nothing is computed from it.
- **Goal.** From what a student enjoys, to the work that fits, the place that
  leads there and the course family. Then the goal itself: why, the steps
  (a subject move, and things to do outside class), a date to look at it
  again, and the adult it was agreed with.
- **Path.** Home. P6 to after Sec on one line. Each year opens in place with
  its levels, the best move and the dates that matter. After the 8 places
  comes the long view: ages 12 to 65, drawn to scale. Links at the foot open
  the places, jobs, fees, school types and the pages for adults.
- **Play.** The game: a life played forward from the student's own subjects,
  compass and goal. At the end it offers one line to keep on Me and one step
  to keep on the goal.
- **Saved.** The record: the goal, the compass, the steps with ticks, grade
  targets and the printable plan. It also opens the plan card and share
  link, and the 15 minute counsellor session.

For adults, picking Parent or Teacher under "I am" opens their own page:
what changed as four dates, an old stream in today's words, a 45 minute
lesson, and the one counsellor session.

Underneath:

- **Advice that names the move.** "If any one of Social Studies with
  Geography, Mother Tongue or Principles of Accounts moves up to G3,
  Polytechnic opens." Single moves, pairs, and what is holding a door open.
- **Targets.** Grades now and aimed for, read as L1R4, ELR2B2 and ELMAB3
  against each cut off, with the grade steps that close a gap.
- **Words for the conversation.** Every move carries the words to say to a
  real person, voiced for a student, a parent or a teacher.
- **Private and offline.** No account, nothing leaves the device, and no
  network calls at runtime. The compass leaves the device only if the
  student adds it to a card they share; a link carries its ids and never
  what was typed. Fonts (Bricolage Grotesque, JetBrains Mono; OFL) and icons
  (Phosphor; MIT) are bundled, and a service worker keeps a copy for use
  with no signal.

## Where things are

| Part | Where |
| --- | --- |
| Screens | `assets/js/screens/`: `me`, `goal`, `path`, `play`, `myplan` (Saved), `year`, `after`, `compare`, `share`, `session`, `adults` and the rest |
| Rules and advice | `assets/js/engine/`: `reach.js`, `years.js`, `advice.js`, `grades.js`, `psle.js`, `goal.js` |
| The compass | `data/compass.json` (the lists), `assets/js/ui/compass.js` (the drawing), `state.js` (`compass`) |
| The long view | `data/lifelong.json`, `assets/js/ui/longview.js` |
| Data | `data/*.json`, each with a `_meta` block saying where it came from and when |
| Beatty's subjects | `data/offer.json`. It mirrors `../e21cclog/school/beatty.json`: change both together |
| Saved plans | `localStorage` key `paths7.state.v1`. The first visit reads what the build before saved on the device, and never writes to it (`engine/migrate.js`) |
| Words | `STYLE.md`, checked by `engine/style-lint.js` |
| Visible labels | `assets/js/ui/labels.js`: plain words, and the transit words of Line mode |

Some file names carry a number (`tokens4.css`, `v4.css`, `v7.css`,
`journey4.js`). They are names only; renaming them would gain nothing and
break caches.

## Run locally

```bash
# from the repository root
python3 -m http.server 8000
# then open http://localhost:8000/pathways/
```

| URL | What it opens |
| --- | --- |
| `?s=path&y=sec2` | The path, with one year open |
| `?s=me`, `?s=goal`, `?s=play`, `?s=myplan` | The other four tabs; `?s=me&part=strengths` opens one part of the compass |
| `?s=adults&tab=parent` | The pages for adults (`parent`, `teacher`, `counsellor`, `evidence`) |
| `?s=year&y=sec2` | A year page (`p6`, `sec1` to `sec5`); `&tab=advice`, `targets` or `year` |
| `?s=after`, `?s=dest&id=poly` | The 8 places, and one place's page |
| `?s=compare&y=sec2` | Plan A beside Plan B for a year |
| `?s=share`, `?s=shared&d=...` | Share a plan; a shared plan, read only |
| `?s=session` | The counsellor session |
| `?s=play` | The game |
| `?sec1=el3~maths2&sec3=...` | Loads year plans from a link |
| `?s=home`, `?s=plan`, `?s=explore`, `?s=act`, `?mode=now` | Older addresses land on the right screen |
| `?board=1`, `?guest=1`, `?dev=1` | Projector mode; a guest session that saves nothing; the checks in the browser console |

## Checks

```bash
node pathways/tools/verify.mjs    # from the repository root
```

Every sweep must say PASS before a push. They cover the rules and their
invariants, the advice, grades and PSLE, policy fixtures, the school offer,
house style, contrast, offline use, that every screen is within two taps of
the menu, how older saved plans come across, and the compass, goal dates
and links (the Seven sweep).

## Before students see it

1. `node pathways/tools/verify.mjs`: every sweep PASS.
2. The admission rules, the school year facts and the fees were read again
   on 2026-11-11, this time from the primary pages on moe.gov.sg and
   seab.gov.sg, fetched in full (`research/`). Course families stay
   provisional until the 2028 lists arrive on CourseFinder in mid 2027; what
   MOE has not yet published is marked "to confirm" on screen.
3. Beatty specifics in use: the subject offer (`data/offer.json`) and the
   2025 PSLE posting ranges on the P6 page.
4. The "a day at" stories on each place's page are composites, labelled as
   such. Beatty alumni stories can replace them (`data/daysin.json`).

## Releasing

`node pathways/tools/release.mjs x.y.z` stamps the version everywhere a
browser might cache it. Then add the notes to `data/version.json` and a line
to `../PATHWAYS_VERSIONS.md`.
