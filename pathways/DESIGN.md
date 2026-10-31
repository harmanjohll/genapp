# Paths v4: design notes

v4 is built on v3's engine, data discipline and ethics. Read v3's `DESIGN.md`
first; everything it refuses, v4 refuses (no locked state, monotone distance,
no ranking of destinations, no red, nothing leaves the device).

## The audit (2026-10-27)

| Area | Finding in v3 | v4 answer |
| --- | --- | --- |
| Scroll | Plan 3.8 phone screens, Adults 6.4; every page then repeats a one screen footer | Tabs that each fit a screen; a one paragraph footer |
| Tap and answer | The consequence of a tap rendered three scrolls below it | A dock (phones) and a side panel (wide screens) answer every tap in view |
| Stages | Year was a header chip that silently swapped the subject list | A year strip: P6 to Sec 5 and After, grouped by phase, one page each, one plan per year |
| Lower sec accuracy | reach() filtered lower secondary subjects, so a Sec 2 student raising Science was told "Nothing shifted" | Lower secondary plans are read through the Sec 3 projection before any destination sees them (`engine/years.js`) |
| Advice | "One more at G2", never which | `engine/advice.js` tries every move, names the subject, groups equivalent moves, finds pairs, and reports what is holding a door open |
| Grades | Refused entirely | Hypothetical targets, now and aimed for; aggregates computed with MOE's mapping tables (`engine/grades.js`) |
| Personal | One voice | Student, parent, teacher voices on every question; facts never change |
| Rules | JC "five at G3" without the subject structure; poly B2 rule wrong; arts claimed open from anything | JC and MI need a G3 Humanities and a G3 Maths too; poly fifth subject at G2 value; arts ask G3 English (provisional) |
| Bugs | Pulse line "at . Nothing shifted"; red focus ring on every arrival; game want cards nested a button look inside a button; sheet actions squashed into circles | All fixed |

## Decisions

1. Built as `pathways4/`; since 2026-10-31 it is served from `pathways/` (see `PATHWAYS_VERSIONS.md` at the repo root). v1 to v3 are frozen in `legacy/`.
2. One plan per year (`state.plans`), and one derived effective plan
   (`state.plan`, the latest year with entries) that the game and the adults'
   hub read unchanged.
3. Grades are the student's own targets. The app computes from them and never
   guesses them. Bonus points are named, never added.
4. Course families are opt in (Settings, or the button on a destination page).
5. One version for all three readers. The role changes who speaks, never what
   is true.
6. The game keeps its engine; its subject picker now opens the year page.

## Gates added to `tools/verify.mjs`

- Advice: every reported move is a conditional that really moves something.
- Grades: known plans give known L1R4, ELR2B2 and ELMAB3.
- PSLE: every uniform AL maps to a Posting Group or a sentence.
- Dashes: no dashes in v4 data a reader sees.

## Visual language: the night line (second pass, 2026-10-27)

The first v4 build kept v3's look (warm paper, terracotta, a serif, a
labelled card for everything) and read as generic. The second pass makes the
app's own metaphor literal: school is a transit line.

| Element | What it is | Why |
| --- | --- | --- |
| Palette | Night navy (`--night`) and signal yellow (`--accent`), cool paper, semantic transit hues unchanged | Beatty's own colours; yellow is the platform edge. No cream, no clay, no red |
| Type | Bricolage Grotesque (display and text) and JetBrains Mono (codes, grades, counts), both OFL, bundled | A sans with character for teenagers; mono makes every number read like a timetable |
| Icons | Phosphor bold, MIT, inlined | One maintained family instead of hand drawn glyphs |
| Year line | Sticky navy band, yellow track, station roundels P6 to After, phase labels, a YOU tag, a train that glides to the page you open | Wayfinding is the one motion that always plays |
| Station sign | Big mono code (S3) on a navy block with a yellow platform edge | Where you are, at a glance |
| Level switch | Three way pill with a sliding thumb in the level hue | One control per subject, feedback in the control itself |
| Departures board | Eight rows, data order, board words (Open, Nearly, Longer, Other road); rows flip when a tap changes them | The answer to every tap, in a form students read daily |
| Dock | The board folded into a bar on phones: count, next best move, eight lamps | The answer stays in view while the finger is on the list |
| Tickets | Advice as a ticket: stub with the move (G2 to G3), body that leads with what opens, the words to say, Keep punches it | Result first, then condition, then conversation |
| Score track | Aggregate drawn as a line, cut offs as stations, now as a hollow marker, target as the train | A gap you can see, with the grade steps named under it |
| Pass | My plan as a navy pass with the year line and each year's levels | The page that goes to the next conversation, and prints |

Shape system: controls are pills; cards, boards and tickets 18px; tiles 24px;
keys 12px. Motion: train glide, thumb slide, row flip, dock bump, ticket
punch, arrival stagger; all off under `prefers-reduced-motion`.

## Flow pass: the first five minutes (2026-10-31)

Problem: a first-time student did not know what to tap first. Fix:

- **Wordless intro** (first open only, skippable): switches feed one hub,
  every road out of it is drawn, lamps light, one switch slides up and two
  more light, none goes dark. Then "See what your levels open."
- **Guided start** (`screens/start.js`): year, core levels with the live
  signal above them, reveal, one next move with the words to say. Ends on
  "Saved. Next time, start here." Skip counts as done. Deep links skip it.
- **Live signal** (`ui/signal.js`): you wired to the eight destinations. A
  lit lamp on a solid wire is open; dashed is a move or more away; dotted is
  another way in; no wire is ever cut. It is the default answer everywhere.
- **Home is one next step**, computed from what the device holds.
- **Four nav items**: Home, My year, Explore, My plan.
- **Words switch** (`ui/labels.js`): plain words by default; Line mode turns
  on departures, tickets and a pass. Same visuals in both.
