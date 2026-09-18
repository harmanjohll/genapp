# Learning Log

A personal learning log for Beattyians. Two frameworks from the school's own slides, **GROW by reflecting** (Gift, Rise, Own, Watch) after a lesson and **ACT on Feedback** (Acknowledge, Connect, Test) when feedback comes back, with every guiding question quoted verbatim. A competency lens asks which of MOE's 21st Century Competencies the entry stretched. A coach reads every entry: a built in one that works offline, and optionally Claude in the teacher's voice.

No accounts, no database. The log lives in the student's browser and exports as a file. Entries reach the teacher through a form the teacher owns (Microsoft Form to Excel in OneDrive, or Google Form to Sheet), or as export files.

## Run locally

```bash
# from the repository root
python3 -m http.server 8000
# students:  http://localhost:8000/logs/
# teachers:  http://localhost:8000/logs/teacher.html
```

`file://` works for the student app except for loading class files by code; use a share link instead.

## Files

| Path | Purpose |
| --- | --- |
| `index.html` | Student app |
| `teacher.html` | Teacher console: class file, coach voice preview, drop box mapping, review exports |
| `assets/core.js` | Shared engine: frameworks, competency lens, built in coach, AI coach prompt |
| `classes/*.json` | Published class files, one per class code (`DEMO.json` is a sample) |
| `relay/` | Cloudflare Worker that holds the school's API key |
| `DESIGN.md` | Decisions, alternatives, verification status, and the open questions |
| `E21CC.md` | Research brief on MOE's refreshed 21CC framework, with sources |

## URL parameters

| URL | What it does |
| --- | --- |
| `index.html?class=2E3-MATH` | Pre fills the class code on the welcome screen |
| `index.html?guest=1` | Reads and writes nothing on the device |
| `index.html?adult=1` | Shows the adult held API key option in Settings (hidden from students by default) |
| `index.html#/config?c=...` | A share link carrying a whole class file (generated in `teacher.html`) |
| `index.html#/grow`, `#/act`, `#/journey`, `#/settings` | The screens, addressable |

## Quick start for a teacher

1. Open `teacher.html`. Fill in the class, your voice and success criteria. Watch the coach preview change.
2. Optional: connect a Microsoft Form (the Drop box tab walks through it, about fifteen minutes).
3. Download the class file (send it to whoever maintains this repo to place in `classes/`) or copy the share link and paste it into SLS, Classroom or Teams.
4. Students open the app, type their name, school email and the class code. After a lesson: GROW. When feedback returns: ACT.
