# Backlog for the next version

Built in order, one item per scheduled run (see `LOOP.md`). Statuses: `ready`, `needs Harman` (a question below the item), `blocked` (waiting on something outside the code), `done`.

The decisions behind these items were made with Harman in November 2026:
- serverless first, with school Microsoft 365 later;
- a school staff list in the app, reaching students by one school link;
- delivery to a teacher by a Teams message;
- a PIN on the console;
- coaching that stays offline;
- nudges without pressure;
- feelings data that never leaves the device.

## Waiting on Harman (outside the runs)
- **Support contacts for E1:** the school counsellor's name and how to reach them, and the helplines to show, checked by the counsellor.
- **The timetable for A1:** a CSV from the pilot lead or ICT, with name, school email, subjects with levels, CCAs and form class for each teacher.
- **Microsoft 365 for F:** can the school register an app in its Microsoft setup, or does MOE control that centrally? Ask ICT.
- **Dilemma cards in E5b:** a content review of the twelve cards, in that item's pull request.

## The order, agreed on 4 November
What multiplies use is how often students log, whether anyone answers, and whether the record pays off later. So the loop comes first, and depth comes after reach.
1. **A5 Reply in one tap.** A teacher answers a shared entry in one tap; the student sees it on Home.
2. **B1 Resume where I left off.**
3. **D nudges, with the timetable:** a gentle prompt after a lesson ends (to be specced once the timetable CSV arrives).
4. **F Microsoft 365 sign in,** once ICT answers.
5. **G1 My growth story:** evidence for each competency, ready for testimonials, DSA, ECG and PSG talks (to be specced).
6. **C coaching,** then **E regulation and scenarios.**

The measure: students active each week who got at least one reply from a teacher.

---

## A. Teacher access and sharing

### A1 Staff list
- **Status:** done
- **Needs:** nothing
- **Spec:**
  - **Import.** In the console's Set up tab, a new card "School staff list" lets the pilot lead paste or upload a CSV with these columns:
    - name and school email;
    - subjects, each with its levels (for example `Mathematics: Sec 1, Sec 2`);
    - CCAs;
    - form class.
  - **Review before saving.** The console shows the parsed list for checking and editing: add, remove and correct a teacher. It flags rows with no email or an unknown subject, using the subject names in `school/beatty.json`.
  - **The school link.** The console makes one link: `index.html#/staff?s=` plus the list packed with the same codec as share links (`packCDL` in `assets/app.js`, `unpackCDL` to read).
  - **Copying it.** "Copy school link" puts it on the clipboard for Teams or SLS.
  - **On the student's side.** Opening the link stores the list on the device under the student's log (`db.staff`, with the date it was loaded), then shows "Your school's staff list is here" and goes Home. A newer link replaces an older list.
  - **Nothing in the repository.** No staff data goes in the repository or on the public site.
- **Done when:** a pasted CSV of 5 teachers becomes a link that, opened in the student app, leaves the same 5 teachers on the device, with bad rows flagged before the link is made.
- **Tests:** CSV parsing (quotes, commas inside quotes, blank lines), the flagged rows, and the link's round trip. Also: the list survives a reload; a newer link replaces it; axe on the new console card.

### A2 Pick your teachers
- **Status:** done
- **Needs:** A1
- **Spec:**
  - **At setup.** In `#/setup` ("My experiences") and in Settings, once a staff list is on the device, each chosen subject and the CCA gets a "Who teaches you?" select. It lists teachers from the list who teach that subject at the student's Sec level.
  - **Form teacher.** A "Form teacher" select lists everyone.
  - **Stored as adults.** Choices are stored as the student's adults (`me.shares.adults` and the group shapes in `assets/app.js`), each with name, email, role (subject teacher, CCA teacher, form teacher) and what they teach.
  - **Routing.** An entry about a subject or CCA now knows its teacher, through a helper `teacherFor(entry)` in `assets/app.js`.
  - **Without a staff list.** Setup works exactly as today and explains: "Ask your teacher for the school link to pick your teachers."
- **Done when:** a student with three subjects and a CCA picks four teachers and a form teacher in under a minute on a phone, and each new entry resolves to the right teacher.
- **Tests:** the select filtering by subject and level, `teacherFor` across subjects and CCA, changing a teacher in Settings, no list present, and axe.

### A3 Share to the right teacher
- **Status:** done
- **Needs:** A2
- **Spec:**
  - **The entry's Share.** Share on an entry defaults to that entry's teacher from A2. The student can still choose another adult.
  - **Teams.** "Open Teams chat" opens a chat with that teacher's email and the link ready (the existing `#dTeams` flow). "Copy link" and "I sent it" stay.
  - **Bundling.** On `#/sharing`, "Send n new" works per teacher and bundles that teacher's new entries in one link.
  - **The form teacher.** They get only the sections the student turns on for them; nothing is on by default.
  - **Reuse.** Use `packCDL`, `senderInfo`, the sharing sections and the "Send to" dialog. Do not build a second sharing path.
- **Done when:** a Chemistry entry offers Ms Lim first, and three new Chemistry entries go to her in one link. The form teacher receives nothing until the student turns a section on.
- **Tests:** the default adult per entry, the bundle contents per teacher, the form teacher's default, the Teams link's `users` and `message`, and the console opening the link with all items.

### A4 Console PIN
- **Status:** done
- **Needs:** nothing
- **Spec:**
  - **Setting it.** On first open, the console asks the teacher to set a 4 to 6 digit PIN.
  - **Asking for it.** It asks again on every open, and after 10 minutes without use.
  - **Encryption.** The console store (`e21cclog.next.teacher`) is encrypted with a key derived from the PIN (WebCrypto PBKDF2 with a stored salt and many iterations, then AES GCM). On a borrowed device, the stored data shows nothing readable.
  - **Wrong PINs.** They say so. After 5 wrong tries, a 30 second pause.
  - **Forgotten PIN.** "Forgot PIN" offers to clear the console after a clear warning to back it up first. It cannot be recovered; say so.
  - **Existing data.** A console with data and no PIN asks for one and encrypts what is there.
  - **The flows still work.** The share link flow (`#/in?p=`) asks for the PIN first, then adds the items.
- **Done when:** with a PIN set, `localStorage` holds no readable student text, and the console opens only with the right PIN.
- **Tests:**
  - encrypt and decrypt round trip;
  - wrong PIN, the pause, and forgot PIN clearing;
  - the idle lock (use a short test interval);
  - a share link while locked, and existing data migrated;
  - axe on the PIN screen.

### A5 Reply in one tap
- **Status:** done
- **Needs:** nothing
- **Spec:**
  - **Quick replies.** In the console reader, each shared entry offers three replies in a teacher's voice ("Seen. Thank you for sharing this.", "Clear thinking here. Keep going.", "Let’s talk about this next lesson.") and a line of the teacher's own. One tap readies a note on the whole entry, using the existing margin notes.
  - **Replies to send.** At the top of the Inbox, every student with replies waiting, each with one "Send in Teams" button: a Teams chat to the student with one link for all their replies. The tap marks them sent; sending again is harmless, since the student's log ignores a note it already has.
  - **Waiting for a reply.** The Inbox can be ordered to show the entries no one has answered yet, oldest first.
  - **The student's Home.** Unread notes come first, as a "From your teachers" card: who wrote, on which entry, and the words. Open the entry, or mark it read there.
  - **Reuse.** The note link (`#/note?n=`), `sendNotes`, `pendingNotes` and the student's `importNoteLink`. Notes still go one student at a time, never a class bundle.
- **Done when:** a teacher answers five students in under two minutes, and each student sees the reply on Home the moment the link opens.
- **Tests:** a quick reply readied and removable, the own line, Replies to send with the right Teams address and link, sent after the tap, Waiting for a reply, the student's Home card and marking it read, and axe on both.

## B. Saved state

### B1 Resume where I left off
- **Status:** done
- **Needs:** nothing
- **Spec:**
  - **Remembering.** The app remembers the last page and scroll position per log, under the log's own small key on this device, so remembering a place never rewrites the log.
  - **On open.** On open, or after the PIN, it returns there.
  - **A draft in progress.** When a draft exists, Home shows one card at the top: "Carry on with your Geography GROW", with Continue and Not now.
  - **What it never does.** It never jumps into the composer by itself.
- **Done when:** a student closes the tab mid entry, opens the Log again, and is one tap from their half written entry, with nothing lost.
- **Tests:** last page restored, scroll restored on a long page, the draft card and both buttons, and no card without a draft.

### B2 Backup and restore
- **Status:** ready
- **Needs:** nothing
- **Spec:**
  - **One tap backup.** One tap "Back up my log" uses the share sheet where it exists (`navigator.share` with a file), so an iPad can save to Files or OneDrive. Otherwise it downloads the file.
  - **What it carries.** The backup includes drafts.
  - **Restore.** "Bring my log from a backup" on the welcome page and in Settings restores from the file. When a log with that name exists, it offers to add the newer entries rather than replace.
  - **Reminders.** They say when the last backup was, and stop once a backup is newer than the last entry.
- **Done when:** a log backed up on one device and restored on another has every entry and draft, and a second restore adds nothing twice.
- **Tests:** the backup file contents, a restore into an empty browser, merging into an existing log with no duplicates, and the reminder timing.

## C. Coaching (offline; the AI coach stays off for students)

### C1 Sharpen the reflection
- **Status:** ready
- **Needs:** nothing
- **Spec:**
  - **Placing the writing.** After Log it, the coach places the entry on the pilot's four step rubric:
    1. describes;
    2. explains;
    3. connects to a competency;
    4. plans a change.
  - **How it decides.** It uses the existing offline coach signals (`assets/core.js`: the learner profile, the competency evidence and the plan checks).
  - **What the student sees.** Where the writing sits, in plain words, and one move up, as a question or a sentence starter (for example "You said what happened. Now say why it worked.").
  - **Who sees it.** The student only. The step is not shown to teachers or used in levels.
- **Done when:** a golden set of at least 20 short entries, written to sit at known steps, is placed correctly at least 85% of the time, and every move up is one sentence.
- **Tests:** a golden set file and checker in the style of `t10`, the card on the entry page, and its absence from share payloads.

### C2 Remember across entries
- **Status:** ready
- **Needs:** C1
- **Spec:**
  - **Noticing.** The coach looks across the student's entries for the same habit or plan in different subjects. It uses the competency evidence and plan text already stored.
  - **Saying so.** At most one connection per entry, shown under the coach's notes (for example "Same habit as your Maths entry on 29 Oct: checking your working before you hand it in.").
  - **Linking.** The connection links to the other entry.
- **Done when:** a seeded log with a planning habit in Maths and Chemistry shows the connection on the newer entry, and a log with nothing in common shows none.
- **Tests:** connections found and not found, at most one per entry, and the link opening the other entry.

### C3 Fit the writer
- **Status:** ready
- **Needs:** C1
- **Spec:**
  - **The writer profile.** It comes from recent entries (length, sentences per answer, how often they are stuck) and the student's levels of demand.
  - **Short writers and G1 students.** They get shorter frames, sentence starters ready to tap, and a tip about dictation on the iPad keyboard.
  - **Confident writers.** They get a harder probe after Log it.
  - **Changing it.** The student can switch in Settings between "Give me more help" and "Push me harder".
- **Done when:** the same question shows starters for a short writer and a harder probe for a long writer, and the student's setting overrides both.
- **Tests:** profile from seeded logs, help per profile, the setting, and no change for a new log until it has three entries.

## D. Nudges (no pressure, no scoreboard)

### D1 Calendar reminder
- **Status:** ready
- **Needs:** nothing
- **Spec:**
  - **Making it.** In Settings and on Home's What next, "Remind me each week" asks for a day and time. It then gives a weekly repeating calendar event as an `.ics` file, through the share sheet or a download.
  - **The event.** It is titled "Write a GROW in your E21CC Log" and links to the Log.
  - **What the app does not do.** It cannot send notifications itself; say so plainly.
- **Done when:** the file imports into iPad Calendar as a weekly event at the chosen time.
- **Tests:** the `.ics` text (RRULE weekly, the time zone `Asia/Singapore`, the title and link) for several day and time choices.

### D2 If then plans, checked back
- **Status:** ready
- **Needs:** nothing
- **Spec:**
  - **Reading the plan.** When a plan names a day or time ("on Thursday", "tomorrow after CCA", "next Monday"), it is read into a check date.
  - **Checking back.** On or after that day, Home's What next asks "Did you do it?" with Yes, Partly and Not yet. This joins the follow through that exists.
  - **Plans without a date.** They are checked after seven days, as now.
- **Done when:** a plan for Thursday written on Monday is asked about on Thursday, not before, and its answer counts in "Plans you followed through".
- **Tests:** date reading for at least 10 phrasings (including none), the check day, and the answer recorded.

### D3 Gentle prompts when the app opens
- **Status:** ready
- **Needs:** D2
- **Spec:**
  - **One prompt per open.** At most one prompt each time the app opens, on Home, rotating among:
    - a plan that is due;
    - a statement almost secured;
    - a subject or CCA not written about this term.
  - **Wording.** Plain and kind, never "you missed" or "you have not".
  - **Dismissing.** Dismissed prompts stay away for a week.
- **Done when:** a seeded log sees a different single prompt on each of three opens, and a dismissed prompt does not return within a week.
- **Tests:** the rotation, the dismiss rule, the wording scan (no missed or have not), and no prompt when nothing is due.

### D4 Rhythm and milestones
- **Status:** ready
- **Needs:** nothing
- **Spec:**
  - **Rhythm.** On Home, one dot per week of this term, filled when the student wrote that week. There is no count of weeks in a row, nothing that resets, and no message about a missed week.
  - **Milestones.** These are private and unannounced. They appear quietly when reached, and are kept in "My milestones" in Settings:
    - first entry;
    - first secured statement;
    - a competency shown in two subjects;
    - a plan followed through;
    - an ACT that led to a change.
  - **What they are not.** No points, no ranking, and nothing shared or shown to teachers.
- **Done when:** a seeded term shows the right dots, and each milestone appears once, at the moment it is reached.
- **Tests:** dots per week across a term boundary, each milestone's trigger, the absence of streak and missed wording, and none in share payloads.

## E. Regulation and scenarios (inside the Log, private, never shared)

### E1 Check in space and safeguarding
- **Status:** ready
- **Needs:** nothing
- **Spec:**
  - **The space.** A new private area, "Check in" (route `#/feel`), reached from Home and the navigation.
  - **Where its data lives.** Inside the student's log, under `checkins`, and kept out of every sharing payload, every console view and the class grid. A test proves this.
  - **The support card.** After three check ins in a row in the lowest band, it shows gently with "Talk to someone".
    - It reads contacts from `school/beatty.json` under `support`.
    - Until Harman supplies verified contacts, it says "Talk to your form teacher or the school counsellor", with no phone numbers. Never invent contacts.
  - **No reporting.** Nothing is ever sent or reported automatically.
- **Done when:** the area exists with an empty state, the support card appears on the third low check in and not before, and no check in data appears in any share or export a teacher can read.
- **Tests:** the privacy check across share links, the console and exports; the support card rule; and the empty state.

### E2 Name the feeling
- **Status:** ready
- **Needs:** E1
- **Spec:**
  - **The grid.** A quick check in on a grid of energy (low to high) and pleasantness (unpleasant to pleasant). It must be generic: not a copy of any branded programme's chart, names or colours.
  - **Finding the word.** Then "Find a more exact word" offers words for that part of the grid.
  - **Saving.** The check in saves with an optional line of why.
  - **Keyboard and screen readers.** The grid has its own keyboard and screen reader path (two selects, or arrow keys with labels).
- **Done when:** a student can check in with two taps and a word, by touch or keyboard, and see it in their check ins.
- **Tests:** saving by touch and keyboard, the word sets per region, and axe.

### E3 Try a strategy
- **Status:** ready
- **Needs:** E1
- **Spec:** three short guided strategies, each ending with "Did it help?" (Yes, A little, No), which is saved with the check in.
  - **A breathing pacer.** It stays still, with step text, when reduced motion is on.
  - **Reframe a thought.** What happened, the thought, and another way to see it.
  - **Grounding.** Five things you see, four you can touch, and so on.
- **Done when:** each strategy runs start to finish on a phone and its answer is saved.
- **Tests:** each flow, the reduced motion version of the pacer, the saved answers, and axe.

### E4 Patterns over time
- **Status:** ready
- **Needs:** E2, E3
- **Spec:**
  - **A private view of the student's own check ins.** Energy and pleasantness by weekday and time of day, over the term, and the strategies that helped most.
  - **Wording.** Plain sentences such as "Mondays tend to be lower energy", shown only with enough data (at least 8 check ins).
  - **No diagnosis language.**
- **Done when:** a seeded month of check ins shows correct patterns, and fewer than 8 show "Check in a few more times to see patterns".
- **Tests:** the pattern sentences from seeded data, the threshold, and the wording scan.

### E5a Plan ahead
- **Status:** ready
- **Needs:** nothing
- **Spec:**
  - **The scenarios space.** A new "Scenarios" space where the learner picks one of three kinds: Plan ahead (this item), Dilemmas (E5b) and Futures (E5c).
  - **Plan ahead.** For a coming situation (an exam, a match, a talk):
    - what might happen;
    - how I might feel;
    - what I will do if it goes well;
    - what I will do if it goes wrong.
  - **Checking back.** It is checked back after the date, like Watch: "How did it go? Did your plan help?"
- **Done when:** a student plans ahead for a dated situation and is asked how it went on or after that date.
- **Tests:** the flow, the check back date, and the answer saved.

### E5b Dilemma cards
- **Status:** ready
- **Needs:** E5a
- **Spec:**
  - **The cards.** Twelve made up dilemmas for Sec 1 to 4 school life (a friend asks to copy your work, a teammate blames you, a group member does nothing, and so on).
  - **Playing a card.** Each card offers three or four choices, shows a likely consequence of the one picked, and asks for one line of reflection.
  - **As evidence.** A reflection can back self and others statements as evidence only.
  - **Review.** The card text is in a JSON file for Harman's review in the pull request.
- **Done when:** all twelve cards play through, and a reflection can be kept as evidence.
- **Tests:** every card's choices and consequences, the saved reflection, and the evidence link.

### E5c Futures
- **Status:** ready
- **Needs:** E5a
- **Spec:**
  - **Who sees it.** Sec 3 and up only.
  - **Prompts.** Prompts on possible futures (work, Singapore in 2040, a changing world), and what I might need to learn and how I would prepare.
  - **Ties.** To adaptive thinking and global awareness statements as evidence.
- **Done when:** Sec 3 and above see Futures and can save a response; Sec 1 and 2 do not see it.
- **Tests:** level gating, saving, and the evidence link.

## F. Microsoft 365 (after ICT answers)

### F1 Teacher sign in
- **Status:** blocked (waiting on ICT, see above)
- **Spec:** the console signs in with the teacher's school Microsoft account and reads their Forms responses through Microsoft Graph, so there is no pasting.

### F2 Student sign in and OneDrive backup
- **Status:** blocked (waiting on ICT, see above)
- **Spec:** students sign in with their school Microsoft account, and the Log backs up to their own OneDrive automatically.
