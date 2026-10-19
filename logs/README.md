# E21CC Learning Log

One log per Beattyian, anchored in MOE's 21st Century Competencies, with two journals inside it: **GROW** (Gift, Rise, Own, Watch) after any learning moment, and **ACT on Feedback** (Acknowledge, Connect, Test) when feedback comes back. Every guiding question is quoted verbatim from the school's slides.

The log is a notebook: bookmark tabs for E21CC, GROW, ACT and Settings, on paper the student chooses, under a cover in their colour.
- **E21CC tab.** A competency wheel drawn like MOE's framework. Each segment deepens with the strongest evidence in the student's own words. Tap one for its I can statements and the entries that show it.
- **Journals.** GROW and ACT are organised by the student's own subjects, CCA and experiences, as bookmarks or a shelf of notebooks. They pivot by date, competency or term.
- **Entries.** The student chooses the subject or experience for every entry; nothing is preset. Each entry carries a claim (up to two competencies, and where they show), and the coach holds it against the words.
- **Coach.** A built in coach works offline. For testing, an adult's Gemini API key gives AI feedback anchored in E21CC, in a tone the student chooses (warm, direct, playful). The school relay (Claude, school held key) is ready for later.
- **Statements.** 28 starter I can statements, one starting and one stretching per competency, stand in until the school's own.

No accounts, no database. The log lives in the student's browser and exports as a file. Students can share sections with named adults; teachers read in a console and reply with notes in the margin.

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
| `assets/app.js` | Student app: notebook frame, E21CC wheel and competency pages, GROW and ACT journals, composer, entries, sharing, settings, the Gemini coach |
| `teacher.html` | Teacher console: Inbox, Class grid, Students, group set up, guide |
| `classes/*.json` | Published group files, one per code (`DEMO.json` is a sample) |
| `statements/*.json` | I can statement sets. `default.json` holds the 28 starter statements; `example-banded.json` shows statements by level band |
| `relay/` | Cloudflare Worker that holds the school's API key and throttles per student |
| `DESIGN.md` | Decisions, verification status, and the open questions |
| `PHASE2-REQUEST.md` | What MOE IT needs to clear before the log can live in students' OneDrive |
| `E21CC.md` | Research brief on MOE's refreshed 21CC framework, with sources |

## Addresses

| Address | What it does |
| --- | --- |
| `index.html?class=2E3-MATH` | Pre fills the group code on the welcome screen |
| `index.html?guest=1` | Reads and writes nothing on the device |
| `index.html?adult=1` | Also shows the adult held Anthropic key option in Settings |
| `index.html?embed=1` | Forces the embedded layout (automatic inside a frame) |
| `index.html#/config?c=…` | A share link carrying a whole group file (made in the console) |
| `index.html#/note?n=…` | A teacher's margin notes for one student; opens only in the log whose email it was made for |
| `index.html#/`, `#/journal/grow`, `#/journal/act`, `#/c/critical`, `#/write/grow`, `#/across/sec`, `#/settings`, `#/sharing` | The screens, addressable. Journals take `?p=experience|date|competency|term` and `?v=bookmarks|shelf` |
| `teacher.html#/in?p=…` | Items a student shared by link; opens in the teacher's Inbox |

## Quick start for a teacher

1. Open `teacher.html`, Set up. Make a group file for each class or CCA: your voice, success criteria, the kind of group. Form teachers can also set the statement set and level band.
2. Optional: connect a Microsoft Form with the eighteen fields (Set up walks through it). Without one, students send you a link in Teams.
3. Give students the code or share link. They add the group, then open Sharing and turn on the sections you ask for.
4. Read in the Inbox: paste new rows from the form's Excel sheet, or open the links students send. Write a note beside a paragraph, then Send notes: a Teams chat opens with the link.

## Replacing the sample statements

Edit `statements/default.json`, or add a new set (for example `statements/bty-2027.json`) and name it in the form class's group file. Keep each statement's `id` stable once students link to it. List the competency ids whose evidence can back each statement in `competencies`; a statement without them can only be lit by the AI coach's match.

## Testing with a Gemini key

1. Make a key at Google AI Studio (aistudio.google.com) with an adult's account. Restrict it to the Generative Language API, and to this site if you can.
2. In the log: Settings, Coach, choose **Gemini (for testing)**, paste the key, press **Load models**, keep the suggested Flash model.
3. Write a GROW entry and log it. The E21CC feedback appears on the entry within seconds.

The key stays in that browser only. Gemini's terms do not allow users under 18, so this is for adult testing; students get the school relay later.
