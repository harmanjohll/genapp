# Competency Development Log

A Competency Development Log for Beattyians, one per student, from Secondary 1 onwards. Students write **GROW by reflecting** (Gift, Rise, Own, Watch) after any learning moment, a lesson, a CCA session, a camp day, a competition, and **ACT on Feedback** (Acknowledge, Connect, Test) when feedback comes back. Every guiding question is quoted verbatim from the school's slides.

Each entry carries a claim: up to two of MOE's 21st Century Competencies, and where they show. A coach holds the claim against the student's own words. Entries file themselves into four baskets (the three E21CC domains and the Social and Emotional Competencies). Each basket holds I can statements that light only when a linked entry's words back them, and once a term the student looks across a basket.

No accounts, no database. The log lives in the student's browser and exports as a file. Students share section by section with named adults; teachers read in a console and reply with notes in the margin.

## Run locally

```bash
# from the repository root
python3 -m http.server 8000
# students:  http://localhost:8000/logs/
# teachers:  http://localhost:8000/logs/teacher.html
```

`file://` works for the student app except for loading group files by code; use a share link instead.

## Files

| Path | Purpose |
| --- | --- |
| `index.html` | Student app: page, styles, and the three scripts below |
| `assets/core.js` | Shared engine: frameworks, Look across, competency lens and baskets, statements and their evidence gate, built in coach, AI coach prompt and schema, link codec, v1 to v2 migration |
| `assets/store.js` | The storage and transport seam: browser storage, form submissions, links. Phase 2 swaps it for OneDrive |
| `assets/app.js` | Student app screens: map, baskets, composer, entries, log, sharing, settings |
| `teacher.html` | Teacher console: Inbox, Class grid, Students, group set up, guide |
| `classes/*.json` | Published group files, one per code (`DEMO.json` is a sample) |
| `statements/*.json` | I can statement sets. `default.json` holds sample statements; `example-banded.json` shows statements by level |
| `relay/` | Cloudflare Worker that holds the school's API key and throttles per student |
| `DESIGN.md` | Decisions, verification status, and the open questions |
| `PHASE2-REQUEST.md` | What MOE IT needs to clear before the log can live in students' OneDrive |
| `E21CC.md` | Research brief on MOE's refreshed 21CC framework, with sources |

## Addresses

| Address | What it does |
| --- | --- |
| `index.html?class=2E3-MATH` | Pre fills the group code on the welcome screen |
| `index.html?guest=1` | Reads and writes nothing on the device |
| `index.html?adult=1` | Shows the adult held API key option in Settings (hidden from students) |
| `index.html?embed=1` | Forces the embedded layout (automatic inside a frame) |
| `index.html#/config?c=…` | A share link carrying a whole group file (made in the console) |
| `index.html#/note?n=…` | A teacher's margin notes for one student; opens only in the log whose email it was made for |
| `index.html#/basket/cait`, `#/across/sec`, `#/log`, `#/sharing`, `#/settings` | The screens, addressable |
| `teacher.html#/in?p=…` | Items a student shared by link; opens in the teacher's Inbox |

## Quick start for a teacher

1. Open `teacher.html`, Set up. Make a group file for each class or CCA: your voice, success criteria, the kind of group. Form teachers can also set the statement set and level band.
2. Optional: connect a Microsoft Form with the eighteen fields (Set up walks through it). Without one, students send you a link in Teams.
3. Give students the code or share link. They add the group, then open Sharing and turn on the sections you ask for.
4. Read in the Inbox: paste new rows from the form's Excel sheet, or open the links students send. Write a note beside a paragraph, then Send notes: a Teams chat opens with the link.

## Replacing the sample statements

Edit `statements/default.json`, or add a new set (for example `statements/bty-2027.json`) and name it in the form class's group file. Keep each statement's `id` stable once students link to it. List the competency ids whose evidence can back each statement in `competencies`; a statement without them can only be lit by the AI coach's match.
