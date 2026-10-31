# E21CC Log v2

This is the second version of the E21CC Log, served beside the first at `genapp/logsv2/`. The first version (`genapp/logs/`) is unchanged. v2 keeps its own log in the browser; the first time it opens, it copies in the log from the first version, once, and never writes back to it.

What v2 adds: a coach that meets each student where they are.
- **A learner profile on the device.** Before each read the coach gets a summary, with no name, no email and no past entries, except the sentence of the last two plans:
  - Sec level and band, and the subject level (G1, G2 or G3) the student sets for each subject;
  - the writing stage of each guiding question;
  - what the student has shown clearly before;
  - statements under way;
  - the last two plans, and whether they were done;
  - whether the last stretch was acted on.
- **Knowledge, skills, values and dispositions.** Each strand, and each social and emotional competency, is broken into a draft map (`statements/beatty-v1.json`, `ksvd`). The coach names what the student's own words show, with a verbatim quote, using only ids from the map.
- **Nothing written, nothing said.**
  - A blank answer gets no comment, and a blank entry is never sent to the AI or counted.
  - "idk" or a few words get one small question and no praise.
- **Just enough help.**
  - "I'm stuck" under every guiding question: first a question, then a sentence frame with blanks, then a short example from another subject.
  - The profile decides where help starts, and it fades once the student acts on it.
  - "Ask the coach" adds one AI hint per entry.
- **Following through.** Before the plan question, the log asks whether last time's plan was done; the coach builds on the answer.
- **Content as the vehicle.** A likely content misconception comes back as a question for the student to check with their teacher. The coach never corrects it.
- **What each person sees.** Students see their growth in plain words. Teachers see the labels in the console:
  - the status of each answer;
  - the help level given;
  - follow through;
  - the content question;
  - the knowledge, skills, values and dispositions ids.

The rest of this README describes the log as a whole, the same in both versions.

# E21CC Log

One log per Beattyian, anchored in MOE's 21st Century Competencies. The Log holds journals: **GROW** (Gift, Rise, Own, Watch) after any learning moment, and **ACT on Feedback** (Acknowledge, Connect, Test) when feedback comes back. A third journal, **ASK**, is a placeholder until its questions are written. Every guiding question is quoted verbatim from the school's slides.

Four places, the same on every device:
- **Home.** The competency wheel, drawn like MOE's framework and shaded by the student's level in each competency; the statements secured this term; the ones almost there; the next step and the statement it aims for. A Showcase card is a placeholder for later.
- **Competencies.** Each of the nine emerging competencies with its level (Emerging, Developing, Proficient, Leading). A competency page shows its two strands as ladders of Beatty's I can statements, Lower Sec then Upper Sec, each marked secured, started, linked or not yet. The social and emotional competencies show evidence only until the school's statements for them exist.
- **Journals.** GROW, ACT and ASK, organised by the student's own subjects, CCA and experiences; they pivot by date, competency or term.
- **Settings.** Sec level (which sets the band of statements), the view, the coach, experiences, groups, data.

The student chooses one of four views, each with a light and a dark theme and a colour: **Clean record** (the default), **Case and notebooks**, **Editorial**, and **Bright and friendly**. Only the look changes.

How it works:
- **Claim.** Every entry ends with "Which I can statements does this entry show?": up to two, each with the sentence that shows it. Suggestions come from the competencies the words already show. Upper Sec statements are a stretch for Sec 1 and 2; Lower Sec is earlier ground for Sec 3 to 5.
- **Backed.** A link counts when the entry's own words back it: the coach saw the competency, clearly, in a quote that is really there.
- **Secured.** At least two backed entries, from two different subjects or CCAs, at least two weeks apart.
- **Levels.** A band is met in a strand when half its statements, rounded up, are secured. Emerging: the competency shows in an entry. Developing: each strand's Lower Sec band is met (or an Upper Sec statement is secured there). Proficient: Developing, and an Upper Sec statement secured. Leading: the Upper Sec band met in every strand, and a teacher confirms it.
- **Coach.** A built in coach works offline. For testing, an adult's Gemini API key gives AI feedback anchored in E21CC, in a tone the student chooses. The school relay (Claude, school held key) is ready for later. The coach sees only the student's own band of statements.

No accounts, no database. The log lives in the student's browser and exports as a file. Students share sections with named adults; teachers read in a console, reply with notes in the margin, and confirm Leading.

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
| `index.html` | Student app: page and styles for the four views, and the three scripts below |
| `assets/core.js` | Shared engine: frameworks, competency lens, Beatty's statements (embedded), the evidence gate, securing and levels, built in coach, AI coach prompt and schema, link codec, migration |
| `assets/store.js` | The storage and transport seam: browser storage, form submissions, links. Phase 2 swaps it for OneDrive |
| `assets/app.js` | Student app: frame, Home, Competencies, journals, composer and claim, entries, sharing, settings, the Gemini coach |
| `assets/fonts/` | Literata and Inter, subset to Latin (SIL Open Font License) |
| `teacher.html` | Teacher console: Inbox, Class grid, Students, Statements, group set up, guide |
| `classes/*.json` | Published group files, one per code (`DEMO.json` is a sample) |
| `statements/beatty-v1.json` | Beatty's I can statements, draft V1, with each strand's MOE milestones, Mission, Vision and DREAM tags, and the draft's open questions |
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
| `index.html#/note?n=…` | A teacher's margin notes, or a confirmation of Leading, for one student; opens only in the log whose email it was made for |
| `index.html#/`, `#/c`, `#/c/critical`, `#/journal/grow`, `#/journal/act`, `#/journal/ask`, `#/write/grow`, `#/across/sec`, `#/settings`, `#/sharing` | The screens, addressable. Journals take `?p=experience|date|competency|term` and `?v=bookmarks|shelf` |
| `teacher.html#/in?p=…` | Items a student shared by link; opens in the teacher's Inbox |

## Quick start for a teacher

1. Open `teacher.html`, Set up. Make a group file for each class or CCA: your voice, success criteria, the kind of group.
2. Optional: connect a Microsoft Form with the eighteen fields (Set up walks through it). Without one, students send you a link in Teams.
3. Give students the code or share link. They add the group, set their Sec level, then open Sharing and turn on the sections you ask for.
4. Read in the Inbox: paste new rows from the form's Excel sheet, or open the links students send. Write a note beside a paragraph, then Send notes: a Teams chat opens with the link. A shared domain shows the student's levels; where Leading is waiting, press Confirm Leading and send the link.
5. Statements shows Beatty's ladders, with the draft's open questions.

## Changing the statements

Edit `statements/beatty-v1.json`, then paste it into `DEFAULT_STATEMENTS` in `assets/core.js` (the header on one line, one strand per line) so the log works offline. Keep statement ids stable once students link to them: an id is the strand id plus its band and rung (`ct1.l1`, `ct1.u3`). A new set can also live in its own file and be named in the form class's group file.

## Testing with a Gemini key

1. Make a key at Google AI Studio (aistudio.google.com) with an adult's account. Restrict it to the Generative Language API, and to this site if you can.
2. In the log: Settings, Coach, choose **Gemini (for testing)**, paste the key, press **Load models**, keep the suggested Flash model.
3. Write a GROW entry and log it. The E21CC feedback appears on the entry within seconds.

The key stays in that browser only. Gemini's terms do not allow users under 18, so this is for adult testing; students get the school relay later.
