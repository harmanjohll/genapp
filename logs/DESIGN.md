# Learning Log: design, decisions, and the questions that are yours

Phase 1, September 2026. This document is the reasoning behind `logs/`. Read it before changing the app, and read the last section before the next conversation about it: those are the decisions I could not make for you.

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
