# E21CC Log

The E21CC Log lives at `genapp/e21cclog/` for students and `genapp/e21cclog/teacher.html` for teachers. The address stays the same from version to version, so bookmarks and links shared in Teams keep working. The version shows only inside the app: the small badge, and Settings, About. This is version 3.

## Where things are
| Path | What it is |
| --- | --- |
| `e21cclog/` | The Log: the student app, the teacher console, the statements, the tests |
| `e21cclog/legacy/v1/`, `e21cclog/legacy/v2/` | The first version and v2, kept read only so nothing is lost. A banner sends students to the Log, and **Bring newer entries across** adds anything written there after the move (the newer copy of an entry wins) |
| `logs/`, `logsv2/`, `logsv3/` | Short pages left at the old addresses. Teacher note links, group links, class codes and share links go to the Log; other pages go to their legacy copy |
| `e21cclog/school/beatty.json` | Beatty's offering: subjects for Lower and Upper Sec with the levels of demand each is offered at, CCAs, NEXUS@BTY modules, and the year's fixed experiences. See **Changing the school offering** |
| `e21cclog/tests/` | Every browser test, run with `run.sh`, and on each pull request by `.github/workflows/e21cclog.yml` |

The Log keeps one lasting store in the browser (`e21cclog`, and `e21cclog.teacher` for the console). The first time it opens, it copies in the newest older log once (v3, then v2, then the first version) and never writes back. Later versions change the data in place.

## Keeping the log safe
Until Phase 2 puts each log in the student's OneDrive, the log lives in one browser, and a cleared history, a new device or Safari's tracking prevention can lose it. So the Log:
- **Asks the browser to keep it** (persistent storage), once there is an entry.
- **Offers to install itself to the Home Screen.** On an iPad it gives the steps; on Chrome it shows a button. An installed app is not cleared the way an ordinary site can be.
- **Asks for a backup.** After 5 new entries, or 3 weeks with anything new, What next? offers **Back up now**, a file the student keeps in OneDrive or Files. Settings, Your data shows the last backup, whether the browser has agreed to keep the log, and whether the Log is installed.
- **Opens without wifi.** An offline copy (`sw.js`) serves pages and scripts from the network first, with the copy kept for when the network is down.
- **Backs up the console too.** The teacher console has **Back up the console** and **Restore from a backup**.

## Tests
`e21cclog/tests/run.sh` starts a local server and a mock coach relay, then runs:
- every suite (t2 to t13);
- the console sweep;
- one colour sweep per look.

`FULL=1 run.sh` adds the full 48 combination colour sweep and the route audit at 7 screen sizes. You need Node, Python 3, Playwright with Chromium, and `npm ci` in `e21cclog/tests`.

| Suite | Covers |
| --- | --- |
| t2, t4, t6 to t10 | Groups and relay, links and the console, the composer, layouts, statements and levels, the coach |
| t11 | Version 3: Home, levels in the look's words, GROW wording, the (i), the aim, the settings alert |
| t12 | The new home: forwarding, legacy mode, the lasting store, backups, installing, the offline copy, console backup |
| t13 | Accessibility: axe, the keyboard, 200% zoom, forced colours |
| t14 | Beatty's offering: subjects by Sec level with their levels of demand, CCAs and NEXUS@BTY, renaming older logs, the coach's level, the console |
| `sweep.js`, `tsweep.js`, `audit.js` | Colour and state contrast in every look, theme and colour; the console; every route at every size |

A screen reader still needs a person. The **VoiceOver check for an iPad** (about 10 minutes):
1. Turn on VoiceOver (Settings, Accessibility).
2. Open the Log, and swipe through Home. Each part of the wheel should read its competency and level, and What next? should read as a list.
3. Double tap New GROW. Focus should land on the step's heading.
4. Swipe through the step: each question, its (i) button, the box and I'm stuck.
5. Open an (i). Its help should be read.
6. Close the entry. Focus should return to New GROW.
7. In Settings, turn on a look and a theme. The pressed state should be read.

Note anything that is silent, out of order, or unclear.

## Version 3

What v3 changes:
- **Home in two parts, each the full width of the page.**
  - Where am I now?: the competency wheel, as large as the screen allows, with a panel beside it (below it on a phone). The panel shows a competency's level, each strand's progress, the next step and the statement to aim at, and the student's own words that showed it. Before anything is pointed at, it shows the most recently active competency. Pointing at a part (mouse), tapping it (phone or tablet) or tabbing to it (keyboard) shows that one; on a touch screen a second tap opens it.
  - What next?, below, with Immediate and Longer term side by side on a wide screen: Immediate (this week: the two settings if missing, a teacher's note, the plan to tick, an unfinished entry, the statement almost secured, a GROW if none this week) and Longer term (the statement aimed for, a level waiting for a teacher, the nearest next level, the term's look across).
  - New GROW and New ACT sit under the wheel on a phone, and in the sidebar on a laptop.
- **Three levels, in the words of the student's look.** The top level needs the Upper Sec band in every strand and a teacher's confirmation. v2's Leading folds into it, and confirmations carry over.

  | Look | Level 1 | Level 2 | Level 3 |
  | --- | --- | --- | --- |
  | Case and notebooks | Emerging | Developing | Proficient |
  | Clean record (default) | Setting Sail | Navigating | Charting |
  | Editorial | Level 1 | Level 2 | Level 3 |
  | Bright and friendly | One star | Two stars | Three stars |

  The teacher console always uses Emerging, Developing, Proficient, with the student's word beside it.
- **GROW says learning experience.** "From the lesson" becomes "from this learning experience". Own asks for "one real-life example or application". Watch asks "What is coming up next?" first, then "What do I already know about it, or expect from it?". The ids keep their meaning (w2 is what comes next, w1 what the student knows), so earlier entries read the same.
- **Help beside every question.** An (i) beside each guiding question opens on hover, tap or key press: what the question asks, what a strong answer has, and three short examples from different subjects and CCAs (`QHELP` in `assets/core.js`). I'm stuck stays under each box.
- **The aim in two steps.** "Next time, aim for" asks for a competency first, then lists only its statements, grouped by band, in two native dropdowns that work the same on every device.
- **Two settings before writing.** A student without a Sec level, or without any subject or CCA, sees an alert before a new entry and sets both there, then carries on.

v3 keeps everything v2 added: the coach that meets each student where they are. That is described next.

## From v2

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

The rest of this README describes the log as a whole, the same in every version except where v3 says otherwise above.

# E21CC Log

One log per Beattyian, anchored in MOE's 21st Century Competencies. The Log holds journals: **GROW** (Gift, Rise, Own, Watch) after any learning moment, and **ACT on Feedback** (Acknowledge, Connect, Test) when feedback comes back. A third journal, **ASK**, is a placeholder until its questions are written. Every guiding question is quoted verbatim from the school's slides.

Four places, the same on every device:
- **Home.** Where am I now?: the competency wheel, drawn like MOE's framework and shaded by the student's level in each competency, with the level of any part shown beside it. What next?: immediate steps and longer term ones.
- **Competencies.** Each of the nine emerging competencies with its level (three levels, named by the student's look). A competency page shows its two strands as ladders of Beatty's I can statements, Lower Sec then Upper Sec, each marked secured, started, linked or not yet. The social and emotional competencies show evidence only until the school's statements for them exist.
- **Journals.** GROW, ACT and ASK, organised by the student's own subjects, CCA and experiences; they pivot by date, competency or term.
- **Settings.** Sec level (which sets the band of statements), the view, the coach, experiences, groups, data.

The student chooses one of four views, each with a light and a dark theme and a colour: **Clean record** (the default), **Case and notebooks**, **Editorial**, and **Bright and friendly**. Only the look changes.

How it works:
- **Claim.** Every entry ends with "Which I can statements does this entry show?": up to two, each with the sentence that shows it. Suggestions come from the competencies the words already show. Upper Sec statements are a stretch for Sec 1 and 2; Lower Sec is earlier ground for Sec 3 to 5.
- **Backed.** A link counts when the entry's own words back it: the coach saw the competency, clearly, in a quote that is really there.
- **Secured.** At least two backed entries, from two different subjects or CCAs, at least two weeks apart.
- **Levels.** A band is met in a strand when half its statements, rounded up, are secured. Emerging: the competency shows in an entry. Developing: each strand's Lower Sec band is met (or an Upper Sec statement is secured there). Proficient: the Upper Sec band met in every strand, and a teacher confirms it. The student sees these in their look's words.
- **Coach.** A built in coach works offline. For testing, an adult's Gemini API key gives AI feedback anchored in E21CC, in a tone the student chooses. The school relay (Claude, school held key) is ready for later. The coach sees only the student's own band of statements.

No accounts, no database. The log lives in the student's browser and exports as a file. Students share sections with named adults; teachers read in a console, reply with notes in the margin, and confirm the top level.

## Run locally

```bash
# from the repository root
python3 -m http.server 8000
# students:  http://localhost:8000/e21cclog/
# teachers:  http://localhost:8000/e21cclog/teacher.html
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
| `sw.js` | The offline copy: pages and scripts from the network first, kept for when the wifi is down |
| `manifest.webmanifest` | Lets the Log install to a Home Screen |
| `legacy/` | The first version and v2, read only, and `bridge.js`, which adds their banner and brings newer entries across |
| `tests/` | Every browser test; `run.sh` runs them |
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
| `index.html#/note?n=…` | A teacher's margin notes, or a confirmation of the top level, for one student; opens only in the log whose email it was made for |
| `index.html#/`, `#/c`, `#/c/critical`, `#/journal/grow`, `#/journal/act`, `#/journal/ask`, `#/write/grow`, `#/across/sec`, `#/settings`, `#/sharing` | The screens, addressable. Journals take `?p=experience|date|competency|term` and `?v=bookmarks|shelf` |
| `teacher.html#/in?p=…` | Items a student shared by link; opens in the teacher's Inbox |

## Quick start for a teacher

1. Open `teacher.html`, Set up. Make a group file for each class or CCA: your voice, success criteria, the kind of group.
2. Optional: connect a Microsoft Form with the eighteen fields (Set up walks through it). Without one, students send you a link in Teams.
3. Give students the code or share link. They add the group, set their Sec level, then open Sharing and turn on the sections you ask for.
4. Read in the Inbox: paste new rows from the form's Excel sheet, or open the links students send. Write a note beside a paragraph, then Send notes: a Teams chat opens with the link. A shared domain shows the student's levels; where Proficient is waiting, press Confirm Proficient and send the link.
5. Statements shows Beatty's ladders, with the draft's open questions.

## Changing the statements

Edit `statements/beatty-v1.json`, then paste it into `DEFAULT_STATEMENTS` in `assets/core.js` (the header on one line, one strand per line) so the log works offline. Keep statement ids stable once students link to them: an id is the strand id plus its band and rung (`ct1.l1`, `ct1.u3`). A new set can also live in its own file and be named in the form class's group file.

## Changing the school offering

Each year, edit `school/beatty.json`, then copy it into `DEFAULT_SCHOOL` in `assets/core.js` so the Log works offline (t14 fails until the two match).
- **Subjects** sit under `subjects.lower` (Sec 1 and 2) and `subjects.upper` (Sec 3 to 5), in the order students see them. Each has a `name` in full, a `group`, and `levels`: the levels of demand it is offered at, or `null` for one common level. `outside` lists levels taken at another school or centre; `examinable: false` marks a subject that is not examined.
- **`notes`** add a line under a group, by level.
- **`aliases`** map short or old names to full ones, so older logs and group files still match.
- **`cca`** and **`nexus`** are listed alphabetically in the app, whatever their order in the file. A NEXUS tier's `levels` says which Sec levels see it.
- **`experiences`** holds the year's fixed experiences: `{"name", "type": "camp" | "service" | "competition" | "other", "levels": [1, 2]}`. ALP and LLP activities go here too. The composer offers them by name under their type.

Keep names stable within a year: entries are filed under the name a student chose.

## Testing with a Gemini key

1. Make a key at Google AI Studio (aistudio.google.com) with an adult's account. Restrict it to the Generative Language API, and to this site if you can.
2. In the log: Settings, Coach, choose **Gemini (for testing)**, paste the key, press **Load models**, keep the suggested Flash model.
3. Write a GROW entry and log it. The E21CC feedback appears on the entry within seconds.

The key stays in that browser only. Gemini's terms do not allow users under 18, so this is for adult testing; students get the school relay later.
