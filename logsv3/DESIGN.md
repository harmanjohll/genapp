# E21CC Log v3: design, decisions, and the questions that are yours

October 2026. The Learning Log became the Competency Development Log, then the E21CC Log; v2 gave the coach a memory of each learner, and v3 makes Home simpler and help more specific. The newest change comes first. Older sections keep the names of their time; the September design at the end still explains the foundations.

## v3: a simpler Home, three levels, help beside every question (29 October 2026)

Harman asked for a third version, at `logsv3/`, with eight changes:
1. A landing page with less going on: the competencies and their levels in one place, with the levels showing when a competency is hovered.
2. A second place on the landing page that advises the student: Where am I now? and What next?, with What next? in two parts, immediate and longer term.
3. GROW says learning experience wherever it said lesson.
4. Help that is specific to each question, shown from a (i) or (?) beside the question, with more examples; I'm stuck stays.
5. Own asks "What is one real-life example or application?".
6. Watch asks what is coming up first, then what the student already knows or expects; Harman asked for advice on the wording.
7. An alert that asks for any critical setting before the first entry.
8. The aim at ACT's Test step chooses a category first, then a statement, so it works the same on every device.

He also asked for level words tied to the four looks: Emerging, Developing, Proficient (look A); Setting Sail, Navigating, Charting (look B); Level 1, Level 2, Level 3 (look C); and a set for look D.

### Decisions (Harman, 29 October)
- **Three levels, the top one confirmed by a teacher.** Level 1: the competency shows in an entry. Level 2: the Lower Sec band met in every strand. Level 3: the Upper Sec band met in every strand, and a teacher confirms it. v2's in between step (one Upper Sec statement) goes, and v2's Leading folds into level 3, so its confirmations still count.
- **Watch:** "What is coming up next?" then "What do I already know about it, or expect from it?". My advice, which he took: name what is coming first, because that is the forethought step of self regulated learning (Zimmerman); then draw out what is known. "Expect" is plainer than "anticipate" for G1 readers, and it lets a student who knows nothing yet answer with a prediction, which helps later learning even when wrong (Richland, Kornell and Kao, 2009).
- **Look D, Bright and friendly:** One star, Two stars, Three stars.
- **Critical settings:** the Sec level and at least one subject or CCA. A G level and a group code stay optional.

### What changed
- **Home.**
  - Where am I now? holds the wheel and a panel beside it (beside on a wide card, below on a phone). A mouse shows a competency's level on hover and opens it on click. A touch screen shows it on the first tap and opens it on the second. The keyboard shows it on focus.
  - The legend names the look's level words with a count at each, and a star for secured statements.
  - What next? lists Immediate steps (the two settings when missing, a teacher's note, the plan to tick, an unfinished entry, the statement almost secured, a GROW if none this week) and Longer term ones (the aim, a level waiting for a teacher, the nearest next level, the term's look across).
  - The levels list, the secured and almost there lists, latest feedback and the Showcase placeholder are gone from Home. The first two live on in the panel and in What next?; the rest are in Journals and Competencies.
- **Levels.** `LOG_LEVELS` has three entries; `levelOf` returns `need`, the number of statements to the next level, so Home can pick the nearest one. `LEVEL_WORDS` holds the four sets; `setLevelWords` follows the look. The teacher console keeps the standard words and shows the student's beside them; shared domains now carry the look.
- **GROW wording** in the questions, the probes, the doors, the frames, the models and the coach's instructions. The Watch ids keep their meaning, so v2 entries show their answers under the right questions.
- **QHELP**, in `assets/core.js`: for each of the 17 guiding questions, what it asks, what a strong answer has, and three examples from different subjects and CCAs. The desktop guide's "If you are stuck" now points to the (i) instead of listing every probe.
- **The aim**: a competency dropdown, then a statement dropdown grouped by band; changing the competency clears an aim from another one.
- **The alert**: before a new entry, if a setting is missing; Continue is ready once both are set. Not now and Escape go back Home. Editing an entry never asks.
- **Storage**: `cdl.logsv3` and `logs.teacher.logsv3`, copied once from v2 (else the first site).

### Where I pushed back
- Hover alone fails on phones and tablets and for keyboard users, so every hover has a tap and a focus twin.
- Level words that follow the look split a class's language. The console therefore keeps one set of words and shows the student's beside it.
- An example on demand works against help that fades: worked examples help novices and hold back stronger writers (the expertise reversal effect). The (i) is opened only by the student, and puts what the question asks and what a strong answer has before the examples.
- On a phone, New GROW and New ACT must stay in the first screen (checked at 390 by 844). They sit under the wheel, between the two places. On smaller phones (375 by 667) they need a short scroll, as in v2.

### Verified
- New suite t11, 49 checks: three levels and the teacher's confirmation; v2's Leading read as level 3; each look's words in the legend, How levels work and the level pill; Home's two places and two parts; the panel by mouse, by keyboard and by tap then tap; GROW's words and the coach's instructions; v2 Watch answers under the right questions; an (i) on all 17 questions with three examples; hover, click, Escape and keyboard; the two step aim; the alert, Continue, Not now and Escape; the console's words, Confirm Proficient and the student's own word; the one time copy from v2; no dashes in Home or the help.
- The earlier suites, run against `logsv3/` with their expectations moved to v3 where v3 meant to change them: t9 26, t10 20, t2 17, t4 12, t6 23, t7 21, t8 20, all passing.
- The visual audit across the four looks, light and dark.

### Open questions
- The examples behind each (i) are mine. Heads of Department may want examples from their own subjects; they live in one place (`QHELP`).
- Level 3 now asks for the whole Upper Sec band and a teacher. For a Sec 1 or 2 student that is a long way off; the panel and What next? show the next statement, so the climb stays visible.
- Whether a student should be able to choose their level words apart from their look.

## v2: the coach that meets each student where they are (28 October 2026)

Harman asked for a coach that:
- builds confidence without giving too much;
- nudges behaviour with just enough scaffolding;
- coaches for success, with content as the vehicle;
- breaks every competency into knowledge, skills, values and dispositions, drawn out of every response however short;
- says plainly that nothing can be given when nothing is written.

He asked for it as a separate site, so it lives in `logsv2/` and `logs/` is unchanged.

His decisions:
- I draft the knowledge, skills, values and dispositions map, and the school reviews it.
- Blank answers get nothing; "idk" gets one question.
- Help goes up to sentence frames, and a model from another subject comes only after two calls for help.
- The coach gets a summary profile, not past entries.
- The behaviour to nudge is following through on plans.
- Subject levels G1, G2 and G3 are set by the student.
- A content error comes back as a question that sends the student to their teacher.
- Students see plain words; teachers see the labels.

What changed:
- **The coach is no longer stateless.**
  - `learnerProfile` (core.js) builds the summary on the device.
  - `profileBlock` writes it as plain lines ahead of the entry.
  - The profile is kept out of the input hash, so a read does not go stale as the history grows.
- **The instructions were rewritten** (`coachSystem`), one set for every model. They cover:
  - how confidence is built (mastery evidence, crediting strategy and effort, no inflation);
  - reading where the student is;
  - register by subject level;
  - the status of every answer;
  - distilling knowledge, skills, values and dispositions (a value counts only when an action shows it, and a missing value is never named as a lack);
  - the order of the feedback (feed up, feed back, feed forward, one question);
  - follow through;
  - scaffold levels;
  - content checks;
  - language.
- **The schema grew:**
  - `answers`;
  - `stretch_qid`;
  - `follow_through`;
  - `scaffold`;
  - `content_check`;
  - `e21cc.ksvd`.
- **Every reply is checked before it is kept:**
  - unknown ids and words not in the entry are dropped;
  - a thin answer is capped at a glimpse;
  - help is held to the profile's level;
  - a frame must keep its blanks and none of the student's words;
  - a content check must be a question.
- **The built in coach follows the same policy offline.**
  - Its empty entry praise is gone.
  - Knowledge, skills, values and dispositions come from cue words in the map.
  - Frames and models come from `FRAMES` and `MODELS`. Each question has two models, from two different subjects; the one from a subject other than the entry's is used.
- **Fixed on the way:**
  - vague words are now matched as whole words, so "ok" is no longer found inside "textbook";
  - an entry about the task alone is asked for the how first.

Verified:
- **New suite, t10, a golden set.** It covers:
  - a blank entry: not sent, not counted, nothing said but that;
  - "idk";
  - an answer about the task only;
  - a strong answer, with verbatim quotes from the map;
  - uptake fading the help;
  - a frame for a question still at its start;
  - "I'm stuck" three times;
  - follow through;
  - content checks;
  - G1 and G3 register.
- **The prompt sent to a mocked Gemini:**
  - holds the instructions, the map and the profile;
  - carries no name, no email and no past answers except the last plans.
- **Reply checks:** invented ids are dropped, and help is clamped to the profile's level.
- **What each person sees:** the student's views, the teacher reader, and the one time copy from the first site.
- **Earlier suites, all passing on `logsv2/`:** t9 (26), t6 (23), t2 (17), t4 (12), t7 (21), t8 (20).

Open:
1. **The map is a draft.** I wrote it from Beatty's statements, MOE's milestones, DREAM and MOE's core values. The school should review the labels, especially the values and dispositions, before students see them in earnest.
2. **Cue words** let the offline coach find knowledge, skills, values and dispositions without AI. They are deliberately narrow; expect the AI coach to find more.
3. **Ask the coach** gives one AI hint per entry. Watch whether students lean on it.

## The E21CC Log: journals, Beatty's statements, levels, four views (20 October 2026)

Harman named the frame and asked for the school's own statements, a gradation, and a better layout.
- **Names.** The frame is the **E21CC Log**: a case that holds loose leaves and notebooks. Inside are journals: GROW, ACT, and ASK (a placeholder until its questions are written). No portfolio or folio wording anywhere.
- **Structure.** Four places on every device: Home, Competencies, Journals (GROW, ACT, ASK switched in one place), Settings. Old addresses still work. Home holds the wheel shaded by level, what was secured this term, what is almost there, the next step and its aim, and a Showcase placeholder.
- **The statements.** Beatty's draft V1 (`E21CC_Statements_for_BTYSS_V1.docx`), parsed with its tracked changes: where a cell held an original and a rewrite, the rewrite is used.
  - 9 competencies, 2 strands each: 18 strands, 38 Lower Sec and 47 Upper Sec statements, each strand a ladder.
  - Ids are the strand plus band and rung (`ct1.l1`, `ct1.u3`). The set lives in `statements/beatty-v1.json` and is embedded in `core.js` so the log works offline.
  - Statements are quoted word for word, hyphens included; the wording checks exempt them.
  - Mission, Vision and DREAM tags show quietly under each strand; MOE's milestones sit in a fold.
- **Flagged for the school, not fixed** (in the JSON's notes and the console's Statements tab):
  - the 16 reviewer comments;
  - Adaptive Thinking 3: the Upper Sec rewrite reads easier than its Lower Sec statement;
  - Inventive Thinking 6: an Upper Sec cell repeats a Lower Sec statement.
- **The claim.** The last writing step asks "Which I can statements does this entry show?" Up to two, each with the sentence of the student's that shows it. Suggestions come from the competencies the words already show. The choice becomes the entry's links; its competency claims follow, so the coach checks them. GROW's Watch and ACT's Test can name a statement to aim for next time; Home shows it beside the next step.
- **Bands.** Sec 1 and 2 work towards Lower Sec, with Upper Sec as a stretch they can claim; Sec 3 to 5 work towards Upper Sec, with Lower Sec as earlier ground. The student sets their Sec level in setup or Settings; a form group's band applies only if they have not. The coach is given only the student's own band.
- **Secured.** A link counts when the entry's own words back it (the gate is unchanged). A statement is secured by at least two backed entries, from two different subjects or CCAs, at least two weeks apart. The log says what is missing: one more entry, from somewhere other than Football, on or after a date (a date already past is not mentioned).
- **Levels**, earned, never judged overall. A band is met in a strand when half its statements, rounded up, are secured.
  - Emerging: the competency shows in an entry, or any statement is secured.
  - Developing: in every strand, the Lower Sec band is met or an Upper Sec statement is secured.
  - Proficient: Developing, and an Upper Sec statement secured.
  - Leading: the Upper Sec band met in every strand, and a teacher confirms it. Until then the log reads "Leading: waiting for a teacher".
  - The social and emotional competencies stay on the wheel as evidence only (hatched), with no level, until their statements exist.
- **The teacher console.**
  - A Statements tab shows every ladder, with the Draft V1 label and the open questions.
  - A shared domain now carries each competency's level and the statements under way. The Class grid shows one letter per competency (E, D, P, L, and ! where Leading waits).
  - Confirm Leading makes a note link that names the competency. It opens only in the log of the student whose email it was made for, like margin notes, and sets Leading there.
- **Four views, chosen in Settings.** Clean record (the default), Case and notebooks, Editorial, Bright and friendly; each with a light and a dark theme and the student's colour.
  - One set of markup: `body[data-look]`, `data-theme` and `data-colour` swap tokens; components use tokens only.
  - On a laptop the places sit in a sidebar, or in a row across the top in Editorial. On a phone they sit in a bottom bar styled for each view.
  - Old cover and paper choices carry across: the cover colour becomes the colour, dark paper the dark theme.
  - Inter (four weights, Latin only, about 100 KB) is bundled so Clean record looks the same on every device.

Verified:
- **Engine fixtures.** One entry; two entries in one subject; two subjects within two weeks; then secured. The ladder from Emerging to Developing to Proficient, then waiting, then Leading once confirmed. SEC has no level.
- **New suite, t9** (26 checks):
  - the set's counts, and the embedded copy matches the JSON word for word;
  - Sec 2 and Sec 4 bands, and the coach gets only the student's band;
  - the ladders as the student sees them, including the missing piece;
  - Home's secured, almost there and aim;
  - SEC evidence only, and the ASK placeholder;
  - the claim capped at two, saved as links;
  - Leading waiting, the console's Confirm Leading link opened by the student, and refused for another student;
  - the views kept after reload;
  - no portfolio or folio, and the new name.
- **Earlier suites** updated and passing: t6 (23), t2 (17), t4 (12), t7 (21), t8 (20).
- **Audit:** 0 findings at 320, 390, 768, 1280 and 1920 for all four views, light and dark (overflow, 44px targets, AA contrast, labels, names, headings, text under 12px, Home).

Open, for Harman:
1. Who may confirm Leading: any teacher the student shares a domain with (as built), or only the form teacher?
2. Developing can be reached through Upper Sec statements alone. That rewards a stretch, but it means a student can skip Lower Sec ground in a strand. Keep it?
3. The draft's open questions above need the school's wording before V2; ids should stay stable through the edit.
4. Showcase and ASK are placeholders: their design waits for your decisions.

## Layouts that fit the device (19 October 2026)

Harman found the laptop view squashed: most screens sat in a 780px column. He also asked for care on phones. He chose an open spread for laptops, tabs at the bottom on phones, and a writing page with a guide for the editor.
- **Phone, under 600px.**
  - Ribbon tabs hang from the bottom edge, within thumb reach. They hide while a field has focus, so the keyboard never covers a field.
  - The sheet starts right under the header.
  - On the E21CC page, New GROW and New ACT come straight after the wheel, inside the first screen.
- **Tablet, 600 to 1023px.** Top ribbon tabs and one page up to 900px. Writing boxes are taller.
- **Laptop, 1024px and up.** The notebook opens flat into two leaves, with a fold, up to 1440px (1600px on very wide screens):
  - E21CC: the wheel on the left; the actions and Where you stand on the right.
  - Journals: bookmarks turned on their side and the entry list on the left (sticky); the chosen entry on the right. The URL carries the entry, so Back works and links still open the right entry. An entry link opens in its journal's reader.
  - Editor: the writing page on the left. On the right, a guide: the GROW or ACT ring, every step (jump once a subject is chosen), what the entry is about, and a tip for the step.
  - Competency, Settings (a section index with one section at a time), Sharing, Setup and Welcome are spreads too.
- **Breakpoint changes.** Resizing or rotating across 1024px re-renders the view. Reading text is capped near 74 characters per line.

**Verified.**
- A new suite passes all 20 checks. It covers phone and laptop behaviour, plus no sideways scroll on ten devices from 320x568 to 1920x1080, including a phone held sideways.
- The audit reports 0 findings at 320, 390, 768, 1280 and 1920, on lined and on dark paper.
- All earlier suites pass.

## Flow, voice and interface pass (19 October 2026)

Harman tested the rebuild and raised five points. What changed:
- **No preset subject.** The "Mathematics" he saw came from a draft saved by the earlier build. An unfinished draft now asks first: continue it, or start a new one (which deletes it). A new entry starts blank.
- **A better picker.** Step 1 asks "What is this entry about?":
  - "Your usual" chips: the student's CCA, subjects and recent experiences.
  - Six type tiles: Subject, CCA, Camp or trip, Competition, Service, Something else.
  - Subject opens every subject; the other types open a name field.
  - A new pick joins the student's list when they press Next, with Undo.
  - The group dropdown became a quiet "Teacher's group" line with Change.
- **Home everywhere.** A Home button sits top left on every page, in the entry editor (it saves the draft first) and in the teacher console.
- **A teacher's voice.** Every student facing line and the built in coach were rewritten: plain words, short sentences, specific instructions, no sayings. The Gemini prompt asks for a caring secondary school teacher marking a reflection.
- **ACT is visible in the wheel.** ACT always counted. Now the wheel labels, Where you stand and each competency page give GROW and ACT counts, and the entries carry a GROW or ACT badge.
- **Interface: option A, Clothbound notebook**, chosen from four rendered options:
  - a cloth cover and ribbon tabs with icons and labels;
  - cream lined paper with a red margin, and a red ribbon on the E21CC page;
  - a two column E21CC page on laptops.
- **Accessibility.** The ui-ux-pro-max audit rules were applied:
  - every icon is a line drawing, and emoji avatars map to drawn ones;
  - every tap target is at least 44px;
  - text contrast is at least 4.5:1, and focus rings show on cream paper;
  - there is a skip link and a reduced motion setting;
  - headings run in order, and every field has a label.

**Verified.** An automated audit crawled every route at 320, 390 and 1280:
- It found 137 problems before this pass and 0 after, on both the lined and the dark paper.
- The sharing, credits, notes, console and Gemini suites still pass.
- A new suite covers the new behaviour:
  - the draft card;
  - a subject chosen in two taps, and remembered;
  - Home on every page and every editor step;
  - an ACT entry filling its wheel segment;
  - a wording check: no dashes, no hyphens, no old sayings. The school's guiding questions are exempt, being quoted word for word.

## E21CC Learning Log (19 October 2026)

Harman restated the intent, and the front end was rebuilt around it:
- **One log, two journals.** It is an E21CC Learning Log with a GROW journal and an ACT journal, shown as a notebook with bookmark tabs: E21CC, GROW, ACT, Settings.
- **The E21CC tab is a competency wheel.** It is drawn like MOE's framework diagram: core values at the centre, the five SEC around them, the nine emerging competencies outside in three domain arcs. A segment deepens with the strongest verified evidence; ★ marks an unlocked statement; each segment opens a competency page with its statements and entries. This replaces the Basecamp map and the basket pages.
- **Nothing is preset.** The student lists their subjects, CCA and other experiences (first time setup, then Settings). The composer offers those as chips, CCA first, with nothing selected, and Next waits for a choice. Group files no longer prefill a subject; a group is offered only when it teaches the chosen subject.
- **Journals pivot.** By experience (default, with empty bookmarks for the student's own experiences), date, competency or term. Two views: bookmarks or a shelf of notebooks. Both choices are remembered.
- **Gemini for testing.** The user pastes a Gemini key (stored in the browser). The model list comes from the API, with a Flash model suggested. Each call sends the system prompt with the chosen tone and an instruction to anchor every part in the competencies, plus the response schema (without `additionalProperties`). On a 400 it falls back to asking for JSON by instruction. Quotes are verified as before; an unverified quote counts for nothing anywhere, including the wheel. Gemini's terms bar users under 18: this is for adult testing.
- **Personalisation.** Log title, name, icon, cover colour (six), paper (lined, dotted, plain, dark), highlight colour, text size, and coach tone (warm, direct, playful).
- **Starter statements.** 28 in all: for each competency, one starting (level 1) and one stretching (level 2).

**Verified** in headless Chromium, with Gemini intercepted in the page:
- **Setup.** Setup saved subjects, CCA and a camp. The bookmarks come in the order CCA, subjects, camp. The composer preselects nothing and blocks Next. A bookmark start preselects its experience.
- **The Gemini call.** It carried the key header, the schema, the tone and the anchor line. Its read was stored, with the invented quote demoted. An unchanged edit made no second call. A model that rejects the schema triggers the fallback.
- **Journals and wheel.** All four pivots and the shelf work, and the choice is remembered. The wheel deepens for strong evidence, and the competency page lists its statements.
- **Regressions.** The cover persists, there is no sideways scroll from 320 to 1280, and the sharing, credits, notes and console suites still pass.

**Not verified:** a live Gemini call, because this environment cannot reach Google.

## Competency Development Log (October 2026)

### What changed, and why

The Learning Log treated the entry as its unit. In a log meant to run from Secondary 1 to graduation, the unit is the competency, and entries are its evidence. So:

- **Home is a Basecamp map.** Four trails, one per basket. Each dot is a day with evidence, placed by school term (holidays squeezed out), higher for stronger evidence in the student's own words. Unlocked statements sit as yellow marks in a lane above the trail. The medium carries the message: growth over time, owned by the climber, not a score.
- **Four baskets.** The three E21CC domains and the Social and Emotional Competencies. Full names on basket pages, short labels on the map. Baskets are computed from claims and verified evidence, never stored, so every Learning Log entry filed itself on migration.
- **Write once.** GROW and ACT cover any context: subject, CCA, camp or trip, competition, service, other. There are no separate basket journals to fill; basket pages hold a different genre: the I can statements with their evidence, and a termly Look across (three questions mirroring GROW's shape, written while reading that term's evidence).
- **Groups.** A student belongs to several: form class, subject classes, CCA. Each group file brings an adult, their coach voice and their drop box.
- **Sharing by section, nothing by default.** Each adult sees only the sections the student opens to them (GROW, ACT, each basket), and only when the student sends.
- **Margin notes.** Teachers reply beside the paragraph, in a second ink (Georgia italic, a darker red), on wide screens; under it behind a red rule on phones. The student's words stay primary on the page.

### The evidence gate

A statement lights only when the student has linked an entry **and** that entry's own words back it: the coach saw one of the statement's competencies at clear or strong with a quote that really is in the entry, or the class coach matched the statement to such a quote. Linking alone leaves it half filled ("linked, not backed yet"), with the competency's probe. A coach suggestion alone never lights anything; the student confirms. This is stricter than the plan's first wording, which would have let any verbatim sentence light a statement: picking a sentence from your own entry is always verbatim, so that rule would have been no gate at all.

### Phase 1 transport (no server)

- **Student to adult.** Through the adult's Microsoft Form: the entry is compressed and split across three long answers (payload1 to payload3), and the pre filled link is kept under 8,000 characters by packing items into as few submissions as fit. The student presses Submit once per part. Without a form, the student sends a link in a Teams chat that opens in the teacher's Inbox.
- **Adult to student.** Notes for one student travel in one link, addressed by a one way tag of the student's email; the log refuses a link made for someone else and ignores a replay. There is never a class wide bundle of notes.
- **Teacher reading.** Paste rows from the form's Excel sheet into the Inbox, open students' links, or drop exports. Old thirteen field forms still work, as text only.

### Credit guards

One AI read per version of an entry's words (the hash of exactly what the coach receives). This also fixed a Learning Log bug: editing an entry without changing it threw away the read and bought a new one. A daily allowance per student (eight unless the group file says otherwise), shown in Settings and beside the Ask button. The relay throttles per student using a one way tag instead of per IP address, because a class on school wifi shares one address; a looser per IP limit stops tag spoofing. The relay README now starts with the Console spend cap.

### Storage seam

`assets/store.js` holds the browser store, form submissions and links. Phase 2 replaces it with a OneDrive store and Graph sharing without changing the screens. `PHASE2-REQUEST.md` is the one page for MOE IT. The Learning Log's `logs.v1` is read once and kept untouched as a rollback copy; Settings offers to remove it after an export.

### Verified, October 2026

In headless Chromium, against a mock relay that checks the class token and the student tag and counts calls:

- **Migration.** A seeded Learning Log (two profiles, one with a PIN, a draft, evidence, a sent entry) became v2 with the old key untouched and a second load changing nothing. A CCA entry was recognised from its subject name; the draft reopened with its subject.
- **Coach and credits.** A logged entry was read once, with the student tag. An invented quote was demoted, and an invented statement match dropped. An unchanged edit made no call and kept the read; a changed edit made one. The daily allowance stopped the fourth read.
- **Statements.** A coach matched statement, linked, lit on the basket page and on the map.
- **Sharing.** A Microsoft Form link (under 2,000 characters for one entry) decoded back to the same entry, and the item was marked sent. A Teams link to a teacher without a form opened in the console Inbox.
- **Notes round trip.** The teacher wrote two notes and sent them through a Teams link. They landed beside the paragraph at 1,280 wide and under it at 390. A wrong student was refused, and a replay added nothing.
- **Console.** An Excel paste with a payload split across two answers and a legacy text row produced three items from two students; pasting again added none. The class grid, students timeline and form class set up all rendered.
- **Layout.** No sideways scroll at 320, 360, 390 and 412 wide or on the console at 360 and 1,280, and no console errors. Night mood was checked for the second ink.

Not verified, because they need real accounts: a live Microsoft Form submission and its true URL limit; a Teams deep link between a staff and a student account; a live Anthropic call through the relay.

### The questions that are yours (October)

1. **The I can statements.** Sample statements stand in, one per competency, under a visible banner. Your set can be flat or banded by level; give each statement the competencies whose evidence backs it, and keep ids stable once students link.
2. **The GROW wording.** The questions say "lesson" and were kept verbatim for CCA and camp entries; the composer tells students to read "lesson" as whatever they just learnt from. If the school wants a CCA wording, it is one line per question in `core.js`.
3. **Who sees what by default.** Nothing, today. A form teacher seeing everything by default is one setting, but students tend to write for the audience they know is reading.
4. **Phase 2.** The four gates in `PHASE2-REQUEST.md` decide whether the log can live in OneDrive. Until then, the export reminder is the only protection against a cleared browser.
5. **Term dates.** `TERMS` in `core.js` holds 2026 and 2027 from MOE's calendar. It needs one line a year.

---

# The Learning Log (September 2026)

## What Phase 1 delivers

| File | What it is |
| --- | --- |
| `index.html` | The student app. Welcome, Today, GROW and ACT composers, entry view, Journey, Settings. |
| `assets/core.js` | The shared engine: both frameworks with the guiding questions quoted verbatim, the E21CC lens, the built in coach, and the prompt the AI coach receives. Loaded by both pages so a teacher previews exactly what a student sees. |
| `teacher.html` | The teacher console. Build a class file (voice, criteria, drop box, coach service), preview the coach in your voice, connect a Microsoft or Google Form, review student exports, export CSV. |
| `classes/DEMO.json` | A sample class file. Students who type the code DEMO get Mr Tan's voice. |
| `relay/` | A Cloudflare Worker (about 90 lines) that holds the school's API key so students never do. |
| `E21CC.md` | The research brief behind the competency lens, with MOE's wording and the verification status of each claim. |
| `assets/footer-band.jpg`, `assets/crest.png` | The school's watercolour band and crest, cropped from the template. |

No build step, no framework, no CDN, no database. It runs from GitHub Pages as the other apps in this repo do, and works offline once loaded.

## The five questions I answered before building

The learning UX discipline asks five questions; here are the answers that shaped the app.

1. **The one thing a student must do.** Write one honest reflection against the guiding questions and leave with one next step they chose. Everything else (coach, lens, teacher push) serves that. The Log it button is yellow; nothing else is.
2. **What a confused student looks like at each step.** One letter at a time, the two questions for that letter verbatim, the framework ring showing where they are, a placeholder that says "three honest sentences are enough". The circle at the top of every GROW step is the slide they have already seen in class.
3. **What correct feels like.** The "Logged." screen quotes their own next step back to them, and the Today screen holds it with a checkbox until they tick it. A next step that is only "study more" is quoted back too; the coach has already told them why that is a wish and not a step.
4. **The heaviest cognitive load moment.** The competency lens. It comes after the writing, not before, so the student is looking at their own words when asked which competency they used. The engine pre marks up to three competencies as "maybe" from keyword matches; the limit is two tags per entry, because depth beats breadth.
5. **What happens when they are done.** A clear ending with three options: send to the teacher, copy, or simply go back to Today, where the next step waits.

## Decision 1: saved state without a database

**Chosen.** Each profile lives in the browser's local storage (`logs.v1`), keyed by a generated id, with name, school email, class code, an optional four digit PIN (hashed with SHA-256, salted with the email), preferences, entries and drafts. Export writes one JSON file; import merges entries by id. Several profiles can share one device; a guest mode (`?guest=1`) reads and writes nothing.

**Why.** It is the same pattern the pathways apps in this repo use, it needs no account and no server, and it makes the data literally the student's: a file they can open in Notepad. The cost is that a cleared cache, a reimaged laptop or a new phone loses the log; the app says so on the welcome screen and in Settings, and the teacher push doubles as an off device copy.

**Alternatives considered.**

| Option | Verdict |
| --- | --- |
| Google Drive app data via OAuth (students have iCON Google accounts) | Needs a Google Cloud OAuth client owned by a real account. On iCON that is a school level decision; on a personal account it is the same problem you named with teachers. Phase 3 candidate if MOE HQ permits a school OAuth client. |
| A tiny hosted key value store (Cloudflare KV or Workers) | Turns the school into a data controller for students' private reflections, with PDPA obligations and a breach surface. Not worth it for Phase 1. |
| Carry link (state encoded in the URL) as the pathways apps do | Fine for a plan, wrong for a journal: entries are too long and too personal for URLs in chat. Used only for the teacher's class file, which is small and not personal. |
| Export and import (chosen, alongside local storage) | Zero infrastructure; the student owns the file; the Review tab in the teacher console reads the same files. |

## Decision 2: the smart part, in three tiers

**Tier 0, always on: the built in coach.** Rule based, offline, in `core.js`. For each guiding question it scores the answer for length, specifics (numbers, names, quotes), reasons ("because", "for example"), vague fillers ("study more", "pay attention"), echoing the question back, and, for the next step questions (R2 and T1), whether there is a doing verb and a time or place. From that it writes four things in the teacher's register: a gift (the strongest answer, quoted, with why it works), a stretch (the thinnest answer, with the exact fix), a competency nudge, and one question to answer now. It also grades depth on three notches named for the mountain on the GROW slide: base camp, on the climb, ridge view. There are no marks.

**Tier 1, recommended: Claude through a school relay.** The class file carries a relay URL and a class token; the student presses "Ask the AI coach" and the entry (never the name or email) goes to the Worker, which holds the key, checks the token, rate limits, pins the model and forwards to Anthropic. The response uses structured output (a JSON schema for gift, stretch, question, competency, depth) so the page never has to parse prose, and opts into Anthropic's server side fallbacks so a false positive safety refusal is retried on another model inside the same call. The teacher's voice, phrases, things never to say, success criteria and "what good reflection looks like in my subject" are injected as the system prompt; `teacher.html` shows the exact prompt.

**Tier 1b, optional: on the device.** Chrome's built in Prompt API (stable for web pages since Chrome 148, May 2026) runs a small model locally with no key at all. It needs a desktop Chrome or a Chromebook Plus, 22 GB free disk and a one time 4 GB download, so it is offered as a choice in Settings, not a default. Ordinary Chromebooks are not supported.

**Tier 2, for adults only: a key in the browser.** Present because it is the pattern `prisci/photo.html` already uses and it is the quickest way for you or a teacher to try Claude tonight. Hidden from students: the option appears in Settings only when the page is opened with `?adult=1`. Labelled honestly: the three major AI providers require account holders to be 18 or older, so a student cannot lawfully generate their own key. Your brief asked about that; the answer is no, and the relay is the compliant shape.

**Alternatives ruled out.** Student supplied keys of any kind: all three major providers require account holders to be 18 or older. Gemini's API terms additionally forbid services "likely to be accessed by individuals under the age of 18", so a student facing tool on Gemini breaches the terms whoever holds the key, and its free tier uses submitted text to improve Google products with human review. Decision taken 18 September 2026: no student keys, no Gemini; adult key for trials behind `?adult=1`; the relay for cohorts. OpenAI blocks browser calls entirely (no CORS), so it needs a backend anyway; the relay could be pointed at it later if the school prefers.

**Cost, so you can decide the model.** A coach call is roughly 1,800 input tokens and 300 output tokens. At Anthropic's list prices: Opus 5 about 1.7 cents a call, Sonnet 5 about 0.7 cents, Haiku 4.5 about 0.3 cents. A cohort of 280 students writing two entries a week for a 10 week term, asking the AI coach every time, is 5,600 calls: about S$130 on Opus, S$55 on Sonnet, S$25 on Haiku. The default in the code is Opus 5 at low effort, which is fast and the best writer of feedback; the relay pins whatever the school chooses.

**The smart action (added 18 September).** Logging an entry is now the trigger, not a button. On Log it, the built in engine reads the entry for competencies at once, and if the class provides a coach the same entry (no name, no email) goes out in one call that returns both the coach feedback and a competency read: the stance of the writing (task talk, getting there, competency talk), up to four competencies actually evidenced with the student's exact words quoted and a strength (glimpse, clear, strong), the tags the student chose that the writing does not show, up to two suggested tags with a one tap "Tag it", and one probe. The model's read is checked before it is shown: ids must be real, and every quote must appear verbatim in the student's answers or it is hidden with its reasoning kept, so the model cannot put words in a student's mouth. The Journey shows what the coach saw beside what the student claimed; the teacher's sheet and CSV carry the read. A student can switch the automatic read off in Settings; a bad token or a failed call shows the built in read with a retry.

## Decision 3: the teacher's voice as a class file

A class file is a JSON document, built in `teacher.html`, of about 2 KB:

```
code, teacherName, teacherEmail, subject, subjects[], level,
voice { tone, phrases[], avoid[], sample },
knowledge, criteria[],
relay { url, token },
sink { kind: none | msforms | gforms, url, fields{} }
```

It reaches students two ways. A file placed at `logs/classes/CODE.json` in the repo, fetched when the student types the code (cached six hours); or a share link, `index.html#/config?c=...`, with the whole file encoded inside it, pasted into SLS, Google Classroom or Teams. The link needs no repo access and no upload; the file is the tidier long term home. The built in coach uses the same file: it drops one of the teacher's phrases into the stretch, checks ACT entries against the success criteria, and addresses the gift as "Mr Tan would notice this".

## Decision 4: teacher monitoring without scripts or personal accounts

You asked whether entries could be fed to something in OneDrive. Yes, with one tap from the student, and here is the whole map.

| Route | How it works | Fits | Limits |
| --- | --- | --- | --- |
| **Microsoft Form → Excel in OneDrive** (recommended) | The teacher makes a form with thirteen questions, sets Anyone can respond, generates a pre filled link with the field keys typed in as sample answers, and pastes it into `teacher.html`, which maps the fields automatically. The app opens the form with the entry filled in; the student presses Submit once. Responses land in a workbook in the teacher's OneDrive. | MOE staff accounts, no scripts, each teacher sees their own students, filter by teacher email or class code. | Microsoft does not offer a programmatic submit, so the student's tap is unavoidable. The workbook refreshes when opened in Excel for the web. 4,000 characters per answer. The pre fill parameters are undocumented but stable; if the form is rebuilt, regenerate the link. |
| **Google Form → Sheet** | Silent POST from the page; rows appear at once. | A pilot with one teacher on iCON. | The form must accept responses from outside the organisation, so the endpoint is public and spammable; no success signal. |
| **Copy and paste** | Default when no form is connected. | Today, with nothing set up. | Manual. |
| **Exports → Review tab** | Students hand in their export file through any assignment; the teacher drops the files on the Review tab, filters by student, framework or competency, and exports a CSV. | Term end reading, EAGLES evidence, no infrastructure. | Not live. |
| **Whole school, Phase 3** | One department form, one Power Automate flow (Forms trigger → Add a row into a table; both standard connectors on an education licence) routing each response by teacher email to a SharePoint list with per teacher views, or to per teacher workbooks. | A principal's or HOD's view across classes. | Someone owns the flow. The HTTP trigger is premium, which is why a static page cannot call a flow directly. Roughly 1,500 submissions a day per flow owner before throttling. |

Two facts to verify with one teacher account before choosing: whether Power Automate is enabled on MOE staff licences (open make.powerautomate.com), and whether iCON forms may be opened to outside responses. Both are unconfirmed in public sources.

## Decision 5: the competency lens

MOE's 2023 refresh names nine Emerging 21CC, three per domain, each with a one sentence definition; the app uses those names and definitions verbatim (with MOE's own hyphenation in the proper nouns), plus the five Social-Emotional Competencies, because the ACT framework's first question is a Self-Awareness prompt in CCE terms. The student tags at most two per entry and places themselves on three levels (tried it, getting there, can teach it), always beside their own written moment, so a placement is evidence and not a mood. The coach checks the tag against the text: "You tagged Critical Thinking, but I cannot yet see the moment it happened." An entry that is mostly task nouns (worksheet, test, marks) with no process verbs gets the task talk nudge: tell me what you did with your mind.

The Journey screen shows depth over time and tags per domain, with one deliberate sentence: an empty domain is not a failure, it is a place you have not looked yet.

Where the evidence sits: `E21CC.md`, sections 5 and 6. The short version is that MOE now expects student self assessment of 21CC (SEAB's Assessment as Learning work, the Individual Reflection mark in Project Work, EAGLES in E21CC), that the NIE trials which worked named the competency and set a target before the task, and that self report without feedback inflates.

## Decision 6: design

BTY identity carries the page: navy for weight, yellow for the one action that matters, red only where the ACT slide already uses it, Georgia for headings, a system sans for body (Calibri where present; it is not on Android or ChromeOS, and I chose not to ship a font file). The watercolour band sits on the welcome and teacher pages; the app screens use the slim text footer. The GROW ring and the ACT arcs are drawn from the two slides you attached.

Two deliberate deviations from the visual identity guide, both for individualisation:

- **Moods.** Mountain (the GROW slide's dusk, default), Paper, Sunrise (a pale wash of the school yellow) and Night. The mountain line at the foot of every screen is the slide's landscape, drawn as three quiet SVG ridges.
- **A personal accent.** Yellow, coral, mint, sky or lilac, used only for the student's own marks: the avatar ring, the motto rule, the progress bar, the sparkline dots. Navy and yellow remain the school's; the accent is theirs. The guide says not to add hues on BTY deliverables; I judged that a journal is the one place where a student's own colour earns its exception. Easy to remove: delete the four accent lines in the CSS.

Also theirs: a name, a line under it (five suggestions, or their own), and an emoji mark. Text size has three steps.

## Privacy

- Nothing leaves the device unless the student presses Send (their teacher's form) or Ask the AI coach (the relay or, for an adult's key, Anthropic directly). Both buttons say so.
- The AI coach receives the entry text, the subject and topic, the teacher's class file and, for ACT, the feedback text the student pasted. It never receives the name or email.
- The PIN is a courtesy lock for shared laptops; the profile is readable by anyone with the browser's developer tools. Reflections can be personal. Treat exports as you would a paper journal.
- Under PDPA, the school remains responsible for what the relay forwards to Anthropic; check the API data retention terms before switching the relay on for a cohort, and keep request logs, not text.

## What was verified, and what was not

The competency read was verified against a mock relay that answers in Anthropic's response shape: the request carried the marker, one message, the JSON schema and the fallback flag the Worker enforces; a verified quote was shown and an invented one hidden; a bad class token produced the retry notice; auto off made no call; the teacher console's preview, review and CSV carried the read.

Verified in a headless Chromium at 390 and 1280 pixels: profile creation with the DEMO class, a full GROW entry and a full ACT entry through every step, the lens, the read back with the built in coach, save, the Logged screen, Journey, Settings (moods, accents), export, the send dialog without a drop box, persistence across reload, the teacher console's class set up, coach preview, automatic field mapping from a pre filled Microsoft Forms link with all thirteen keys, the Review tab reading an export, and the share link round trip into the student app. Screenshots are in the pull request.

**Mobile pass (18 September).** Walked every screen of both pages in Chromium emulating an iPhone SE (320 by 568), an iPhone 14, a 360 wide Android and a Pixel 7, asserting no horizontal overflow on each screen. Fixes that came out of it: a bundled serif (Literata, OFL) as the fallback where Georgia does not exist (Android, ChromeOS), so headings match across platforms; the mood, accent and size tokens scoped to `body` (the picker buttons carry the same attributes and were restyling themselves); safe area insets on the bottom bar, toast and composer; the focused box scrolled above the dock when the keyboard opens; 44px touch targets; a smaller composer header on short phones so the first question sits on the first screen; long words wrapping in list rows; native controls following the mood's colour scheme; a web manifest and home screen icons; keyboard hints on inputs. The WebKit engine is not installed in the build environment, so iOS Safari was covered by rule (16px inputs so Safari does not zoom, `100dvh`, `env()` insets, `dialog`, clipboard inside a tap) rather than by running it; one pass on a real iPhone before cohort use is still worth ten minutes. Note for the home screen: a log added to the iPhone home screen runs in its own storage, separate from Safari's, so a student should pick one place and stay there.

**Nothing pinned (18 September, third look).** Your Android screenshots of the live site showed the fixed Back and Next bar rendered as a tall white slab with the questions cut off above it: Chrome's edge to edge mode pads a fixed bottom bar by the system inset, and the same bar had already broken inside frames. Decision: no element is pinned to the screen any more, on any platform. The Today, Journey and Settings tabs sit under the header; the composer is a normal page with Back and Next in the flow under the questions, compact; toasts appear at the top. One layout for phones, laptops and frames, verified in the four device matrix, a fixed frame and a growing frame.

**Claim, then evidence (18 September).** Your question was whether choosing competencies after the entry is the right frame, or whether competencies should be woven into the reflection. The chosen direction is the first, made sharper: the step is now "Your claim", up to two competencies with an optional "where does it show" pointer in the student's own words; the coach holds each claim against the writing and says Seen (with the quote) or Not seen yet (with the probe); competencies the coach saw but the student did not claim appear separately with a one tap "Claim it"; the Journey keeps a running "claims backed by your own words: x of y". The pointer also reaches the coach, so a student who can name where it shows gets checked on exactly that. Weaving competencies into the questions themselves is still open for Phase 2; the guiding questions are the school's and were left verbatim. "MOE" no longer appears on student screens: definitions are given plainly; the research and the coach's prompt still use MOE's wording.

**Framed pass (18 September, second look).** The preview link opens the page inside claude.ai's viewer frame, and on iOS a frame grows to its content, which breaks anything `position: fixed`: the bottom tab bar lands at the end of the page and the composer collapses to a strip with Back and Next covering the questions. Reproduced in a simulated growing frame, then fixed with an embedded mode: when the page is framed (`window.self !== window.top`, or `?embed=1`), nothing is fixed, the tabs move under the header, the composer and its Back and Next flow with the content, dialogs open in the flow, and the page scrolls the host to its top on each screen. Top level (GitHub Pages) keeps the fixed bars. Verified in both a fixed height frame and a growing frame at 390 wide.

**Preview coach.** Inside the claude.ai viewer the page can ask Claude on the viewing account (the `sample` capability) with no key and no Worker, so the smart action can be tried in the preview before any account exists. Students never see it: the option appears only where the viewer runtime exists, and the viewer pays. The same runtime hands the viewer files, so Export and Download work in the preview too.

Not verified here, because they need real accounts: a submission into a live Microsoft Form and the Excel sync; a live Anthropic call through the relay (the request shape follows the current API reference; the Worker is deployable but untested against a real key); Chrome's built in AI (the environment's Chromium has no model).

## The questions that are yours

These are the places where I had to choose and you may choose differently. I have given my position on each.

1. **Who owns the form?** Per teacher (each teacher makes their own Microsoft Form; nothing central) or one department form with a flow routing by teacher email. I built for per teacher because it can start on Monday and gives each teacher exactly their own students; the flow is the Phase 3 upgrade when you want a view across classes.

2. **Who holds the key, and what does the school pay?** The relay needs one Anthropic Console account held by an adult with a school card. At the numbers above the cost is a rounding error against the reading time it saves; the harder question is whether a department or the school holds it. I would hold it centrally and issue one token per teacher, rotated each term.

3. **Is a self typed email an identity?** A student can type any email. That is fine for a journal and weak for monitoring. The alternative is a teacher issued student code in the class file, which is more work and more accurate. My position: start with email plus class code, and let the Excel sheet expose the mismatches; a student who types the wrong email is a conversation, not a system failure.

4. **Is a depth meter a mark by another name?** Base camp, on the climb, ridge view is visible to the student. The evidence says self assessment without feedback inflates, which argues for showing it; the risk is that students write to the meter. I kept it because it is three notches, not a number, and because the coach's question always points at the writing. If you see gaming, the meter is one line to hide.

5. **Lens after writing, or a target before it?** The NIE trials that worked set the target first: "today I am watching for how I handle being stuck". The app asks after. A Phase 2 change would add one optional line before the first question ("What are you watching for today?") and have the coach check whether it showed up. I lean towards adding it once the fodder you mentioned tells us which competencies the school is foregrounding this year.

6. **Teacher time.** Two entries a week from 40 students is 80 reads. The workbook makes it scannable (next step and depth are columns), but nobody should read everything. The honest rhythm is: read the next step column weekly, read whole entries for six students a fortnight, and close the loop aloud in class. That is a practice decision, not a software one.

7. **The three levels.** Tried it, getting there, can teach it are ours. MOE's Learning Goals and Developmental Milestones (go.gov.sg/21cc) may be the better descriptors if the link is open to schools; someone with staff access should check, and the descriptors would slot under the three levels without changing the model.

8. **Personal colour on a BTY artefact.** See Decision 6. Keep or cut.

## Phases

- **Phase 1 (this).** The student app, the built in coach, the AI coach in three modes, the class file, the per teacher Microsoft Form route, the Review tab, the relay, the research.
- **Phase 2 (after your fodder).** The "watching for" pre commitment; the school's foregrounded competencies for the year; MOE milestone descriptors under the three levels if available; an EAGLES evidence export (dated moments per competency); SLS embedding check.
- **Phase 3 (when a department is ready).** One form and a Power Automate flow with per teacher views; the relay deployed and tokens issued; a principal's view across classes built from the same CSV.
