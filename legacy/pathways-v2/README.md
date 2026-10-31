# Paths v2

A pathways thinking tool for Singapore secondary students under Full Subject
Based Banding, first SEC cohort. Version 2: a full rebuild of the interface,
the game and the content on top of v1's engine and ethics. **v1 (`pathways/`)
is frozen** and stays as the control; nothing in it changed.

Read `DESIGN.md` for the whole story: every audit finding this build answers,
the decisions taken, the chapter ladder, the content style rules, the
corrected 2026 figures with sources, and the verification gates.

## Run locally

ES modules and the JSON data layer both need an HTTP origin, so `file://`
will not work.

```bash
# from the repository root
python3 -m http.server 8000
# then open http://localhost:8000/pathways2/
```

| URL | What it does |
| --- | --- |
| `?dev=1` | Runs all five sweeps in the console: reach invariant, projection, journey v4 (NS parity, door keys, flag economy, ending coverage), activity monotonicity, copy lint |
| `?mode=teacher` | The facilitation layer, URL only |
| `?mode=parent` | The parent page, printable, linked from the audience strip |
| `?board=1` | Projector view |
| `?p=el2~maths2&y=sec3` | Loads a plan from a link |

Terminal equivalent of the sweeps, no browser needed:

```bash
cd pathways2 && node tools/verify.mjs
```

## What v2 is, in six lines

- A **landing** that asks the app's whole argument as a guess before anything else.
- Navigation that is the loop: **Plan → Play → Act**, each funnelling into the next.
- A game in **chapters**, dense where a student can taste the years (17 to 25),
  set pieces after, with **National Service** asked once, in fiction, and ages
  computed from the road actually taken.
- Content under measured cadence rules: named places, dialogue, money with
  offices attached, one true cost per year rendered as the road not taken,
  and every flag a student sets paid off by a callback.
- Doors as **keys**: late chapters carry choices a held door unlocks, with a
  full doorless turn guaranteed everywhere, swept.
- An interface with **eras** (the paper cools as the decades pass), dark mode,
  a door-opening ceremony, five opt-in synthesised sounds, and a compare
  screen that treats a short run as a chosen stop, never a flatline.

## The figures

Every admission figure was fact checked against multi-source extracts of the
primary MOE, SEAB and ITE pages on 2026-08-05 (MI 20 not 16; the PSE replacing
the JAE; the 3 year Higher Nitec architecture; PFP's expansion). `confirmed`
and `provisional` statuses in `data/` say which is which, on screen. The
session that checked them could not open the primary pages end to end, so
eyeball the confirmed rows once against moe.gov.sg before a class uses this.

## Before students see it

1. `node tools/verify.mjs` — all sweeps must say PASS.
2. Read `DESIGN.md`'s verification gates and the style rules.
3. The teacher layer (`?mode=teacher`) carries the class code round, the
   45 minute shape and the field test protocol.

## Hosting it, and the one setting that matters

Static files, no build step, no server code. Copy the folder anywhere that serves
files over HTTPS.

**Turn on compression.** This is the only hosting decision that changes what a
student experiences, and it changes it by a factor of three.

Measured on a throttled connection standing in for a school access point with
thirty five devices on it:

| | requests | first screen | first contentful paint |
|---|---|---|---|
| Everything up front, uncompressed | 58 | 988 KB | 7.3 s |
| First screen only, uncompressed | 27 | 391 KB | 5.1 s |
| First screen only, compressed | 27 | **121 KB** | **1.6 s** |

The app now fetches only what the first screen needs and tops the rest up in the
background, which is where the request count and two thirds of the bytes went.
The last row is compression, and it is free: GitHub Pages, Netlify, Cloudflare
Pages and Firebase Hosting all do it by default. A plain `python3 -m http.server`
or `npx http-server` does not, which is why a local preview feels slower than the
real thing.

If a school hosts this behind its own web server, check that `gzip` or `brotli` is
on for `text/css`, `text/javascript` and `application/json`. The stylesheet is
91 KB and compresses to 22; the chance deck is 129 KB and compresses to 31.

## What loads when

- **Eager**, because the first screen cannot be correct without it: subjects,
  pathways, progressions, copy, glossary, activities, journey, lifelong, version,
  moves, possibilities.
- **On opening the mode that needs it**: the chance deck for Play and the table,
  futures for Act, the sector file for the work page, and so on. `MODE_DATA` in
  `data-loader.js` is the list.
- **Background, right after first paint**: everything else, with one repaint when
  it lands, so the parts of Plan that use a deferred file appear a second late
  rather than never.

Every read of a deferred file already guards for its absence, so a top up that
never arrives leaves the app exactly as usable as it was a second earlier.
