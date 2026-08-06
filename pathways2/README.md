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
