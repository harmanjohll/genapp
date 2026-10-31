# Paths v3

A pathways thinking tool for Singapore secondary students under Full Subject
Based Banding, first SEC cohort. Version 3: a greenfield rebuild of the whole
interface on top of v2's engine, data and ethics, from a fresh eleven-dimension
audit. **v1 (`pathways/`) and v2 (`pathways2/`) are frozen** and stay as
controls; nothing in them changed.

Read `DESIGN.md` for the whole story: the audit table, the decisions, the
visual system, the game restaging, and the verification gates.

## What v3 is, in six lines

- **The map is the product.** Eight destinations drawn as one transit fan on
  the home screen, repainted live as subjects are tapped in Plan, grown
  station by station in Play, and kept as the story card at the end.
- **A real router.** Back works everywhere, URLs reproduce the screen, a
  reload resumes where you were, and the first-run conversation happens once.
- **Three altitudes for the rulebook.** A state word on the map, a plain
  sentence in the sheet, the exact rule with source and status behind one
  fold. An acronym never reaches a student before its explanation can.
- **The game staged like a game.** A four-beat turn, the envelope on results
  day, a full-screen door ceremony, the hand beside the choices, and an
  ending that leads with the map.
- **Context at the point of need.** Money in the destination sheets, sectors
  from subjects, one adults' hub, one More row; the standalone pages remain
  for bookmarks.
- **One face on every phone.** Literata (OFL) is bundled and served from the
  same origin, so the identity type is the same on the Androids and
  Chromebooks the cohort actually holds. Still zero external network calls.

## Run locally

ES modules and the JSON data layer both need an HTTP origin, so `file://`
will not work.

```bash
# from the repository root
python3 -m http.server 8000
# then open http://localhost:8000/pathways3/
```

| URL | What it does |
| --- | --- |
| `?dev=1` | Runs the sweeps in the console: reach invariant, projection, journey v4, copy lint, DOM lint |
| `?s=plan` / `?s=play` / `?s=act` | The three verbs, addressable |
| `?s=adults&tab=teacher` | The adults' hub (parent, lesson, one student, evidence) |
| `?s=money` / `?s=work` / `?s=schools` | The student-facing satellites |
| `?board=1` | Projector theatre: forced dark, root-scaled type |
| `?guest=1` | Reads and writes nothing on the device (the parent's run) |
| `?p=el2~maths2&y=sec3` | Loads a plan from a link |
| `?mode=parent` (etc.) | v2-era bookmarks redirect to their v3 homes |

Terminal equivalent of the sweeps, no browser needed:

```bash
cd pathways3 && node tools/verify.mjs
```

## Before students see it

1. `node tools/verify.mjs` — all sixteen sweeps must say PASS, including the
   three new gates: undefined CSS variables, the eager byte budget, and
   computed contrast on era-tinted paper.
2. The figures are v2's, fact checked 2026-08-05 against MOE, SEAB and ITE
   extracts, statuses on screen. Eyeball the confirmed rows once against
   moe.gov.sg before a class uses this.
3. The teacher tab (`?s=adults&tab=teacher`) carries the 45-minute shape,
   the projector step and the play code.

## Hosting

Static files, no build step, no server code. Copy the folder anywhere that
serves files over HTTPS, and turn on compression (GitHub Pages, Netlify,
Cloudflare Pages and Firebase Hosting all do it by default).

New in v3: a service worker precaches the shell and data, keyed on the build
version, so the second visit is instant on school wifi and the app works
offline. It registers only over HTTPS and fetches nothing beyond the same
files the page already loads. Release with `node tools/release.mjs x.y.z`,
which stamps the version across the document, the module graph, the service
worker and `version.json` in one move; the version sweep fails on any drift.

## What loads when

- **Eager** (~230KB raw, ~90KB compressed, font included): the shell, the
  engine, and the eight data files the first screen reads.
- **On opening the screen that needs it**: the chance deck and journey for
  Play, futures for Act, the adult pages' files. `MODE_DATA` in
  `data-loader.js` is the single manifest (v2 kept two lists; their
  disagreement was an infinite spinner).
- **Background, after idle**: everything else, skipped when the connection
  asks to save data.
