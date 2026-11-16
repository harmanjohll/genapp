# Exam Admin: handoff document

Written 16 November 2026. Covers everything discussed so far for the Exam Admin app at Beatty Secondary School: Harman's requirements as he stated them, what the timetable file shows, what outside research found, the design positions taken, and every question still open.

No code has been written. Harman's instruction was to talk first and build later.

## 1. Where things stand

* Repo: `harmanjohll/genapp` (public, published as a GitHub Pages site). Working branch: `claude/bold-volta-1nmvdj`.
* Folder: `exadmin/` created in genapp. It holds this document and one reference file.
* Reference file: `exadmin/reference/BTYTT_2026Sem2_v1.csv`. This is the teacher timetable used by the relief system, copied unchanged from `harmanjohll/pedagogies` at `app/btyrelief/`. It is the only thing taken from pedagogies. Nothing in pedagogies was changed.
* Caution on the reference file: it carries staff names plus three email columns (teacher, IP Head, reporting officer) for about 105 staff. Genapp is public. The same file is already public in pedagogies. Scheduling needs the class codes, not the emails, so stripping the three email columns is an option Harman has not yet ruled on.
* Rules already in genapp's `CLAUDE.md` that apply here: every folder is a live address and must not be moved or renamed; shared files name apps and never version numbers; the root `README.md` lists every app (Exam Admin should be added there once a page exists).

## 2. The brief, as Harman stated it

Purpose: one application for all examination and assessment scheduling and administration at Beatty. It must be an end to end system that helps with planning, deconflicting and communicating. Done well, it saves a lot of time for many people.

### 2.1 Original seventeen points

1. First users are the exam admin personnel, followed by the Instructional Programme (IP) HODs.
2. Background data includes the timetable and the school calendar. Look out for swapped days, even or odd weeks, and HBL days. The timetable arrives as a .csv file.
3. IP Heads decide in which week the students of a cohort do their assessment. Cohorts are Sec 1, Sec 2, Sec 3, Sec 4 and Sec 5. Each cohort has two Teaching Groups (TG A and TG B).
4. There are three levels of demand: G3, G2 and G1.
5. Ideally all students in a cohort, whatever level they read the subject at, do their WA on the same day. Timetable constraints may force different days. It must be done within the same week, with as little time as possible between the two sittings.
6. Within a TG, students MUST all do the WA at the same time: G3, G2 and G1 go together.
7. Input from IP Heads includes assessment duration, topics assessed and marks. Percentage weights will be provided later.
8. Student data will be provided and is CRITICAL for two rules: (a) a student should have no more than 2 assessments per day; (b) a student should have no more than 4 assessments per week.
9. Combined sciences and combined humanities each count as one subject.
10. A day after a public holiday must be assessment free; in Harman's words, no assessment the day just before or just after.
11. The portal should help with communication to parents, teachers and students. They should receive a card, which can be mail merged and sent via Teams. Think end to end.
12. Oral examinations count as an assessment. If there is REALLY NO OTHER CHOICE, a student may have two other written assessments on the same day as an oral. Avoid this at all costs where possible.
13. Take the timetable .csv from the pedagogies repo as a reference only. Do not touch anything in pedagogies. Copy only the latest .csv used by the teacher relief system.
14. Ongoing student performance tasks and projects should also be keyed in. They do not count towards the limits in points 5 to 8.
15. In Term 1, WA should be no earlier than Term 1 Week 4 (T1W4).
16. The candidature list is an .xlsx file where an X means the student reads the subject named in that column's header.
17. The app should also be considered for writing up entry proofs.

Harman also raised whether this is better run locally on his device, noting that calendaring and deconflicting would then be an issue.

### 2.2 Term windows (added later)

* Term 1: WA1 no earlier than T1W4 and finished before T1W10.
* Term 2: assessments can run from T2W2 to T2W9.
* Term 3: anytime, but done by T3W9.
* Term 4: no WA.
* Critical dates in the school calendar must be deconflicted: Annual Awards Day, PTM, UG parade and others like them.

### 2.3 Sec 4 and Sec 5 (added later)

* Sec 4 and Sec 5 have only WA1 and WA2.
* They then sit a preliminary examination.
* The prelim schedule is to be modelled after the SEC (Singapore Cambridge Secondary Education Certificate) examination.

### 2.4 Booking at the point of registration (latest requirement)

* Goal: cut the to and fro. Today an IP Head keys in a preferred date, and the exam committee lead then goes back and forth to deconflict when rules are violated (more than 2 assessments a day for some students, more than 4 a week for others).
* Conflicts are to be managed at the point of registration itself, by the IP Head.
* Most students have at most 7 examinable subjects.
* Harman does not exactly want first come, first served, but accepts that a line must be drawn somewhere.
* Proposed line: a limit on the number of students in breach.
  * If only a handful breach (the example given was 5 students with more than 4 assessments in a week or more than 2 in a day), the booking goes through with a flag. The IP Head is made aware that those students, and their parents, need to be engaged.
  * If more than the limit breach, the IP Head cannot make the booking. The app must show a pop up window explaining why the booking is not possible.

## 3. What the timetable file shows

Facts read from `BTYTT_2026Sem2_v1.csv` (Semester 2, 2026). A 2027 timetable will be needed for the real build.

* Layout: one row per teacher (113 teachers). Seven leading columns: DEPARTMENT, SUBJECT, SUBJECT_2, NAME, Teacher's Email, IP Head's Email, RO's Email. Then 110 slot columns named by week parity, day and period, for example `OddMonP01` and `EvenFriP10`.
* Days are uneven. Odd Mon runs P01 to P11; Odd Wed runs P04 to P14; Odd and Even Thu run P01 to P14; Even Mon runs P03 to P11; Even Wed runs P02 to P14; Fridays run P01 to P10. There is no P12 column on any day.
* Cell format: `CLASSCODE / VENUE ( FORM CLASS )`, for example `3MA2B2 / B4-01 ( 3-4 )`.
* Class codes carry the structure. Of 483 distinct codes, 287 follow the pattern level, subject, G level, TG, group number. `3MA2B1` means Sec 3, Maths, G2, TG B, group 1.
* Subject codes seen in that pattern: AM, CA, EL, GE, HE, HU, LI, MA, PB, PC, PO, PP, SB, SC, SE, SP, SS, ST. Meanings are inferred (for example PP, PC and PB as the pure sciences; SP, SC and SB as the combined science components; ST as lower secondary science) and need confirming.
* Rule 6 is already guaranteed by the timetable. Example: every Sec 3 Maths group in TG A (G3 and G2) sits in the same periods, and every group in TG B (G3, G2 and G1) sits in the same periods. The app should verify this rather than solve for it.
* Rule 5 depends on week parity. Sec 3 Maths TG A and TG B never share a period. They share a day on only 3 of the 10 timetable days: Odd Tue, Odd Wed and Even Thu. So the week an IP Head picks decides whether a same day WA is possible at all.
* Exceptions to the TG A and TG B pattern:
  * Sec 5 runs as a third group, TG C (for example `5MA3C1`).
  * Mother Tongue codes use an S marker (for example `1CL3S1`) and appear to be banded across TGs.
  * PE, Music, Art, D&T and similar subjects use form class based codes (for example `1MU152`, `1PE1-2`).
  * Some electives use other markers (for example `4NF2E1`).
* The companion file `CalendarReference.csv` in pedagogies (not copied, per instruction) holds only the Monday date of each week and whether it is Odd, Even or N.A. It has no swapped days, HBL days, public holidays or school events. A richer calendar is needed.

## 4. What outside research found

### 4.1 The SEC from 2027

* English Language and Mother Tongue written papers are held in September each year.
* All other written papers run in one common period from October to November, similar to the old O Level timetable.
* Non written components (oral, listening comprehension, science practical) come before the written papers.
* Mother Tongue has one written sitting a year for all levels; the mid year sitting is gone.
* Students sit each subject at G1, G2 or G3 on one common timetable. Results come out the following January.
* The paper by paper 2027 timetable was not found. Third party sites reported that SEAB had not released it as of late October 2026. This needs rechecking.

### 4.2 The 2027 calendar

* Term 1: Mon 4 Jan to Fri 12 Mar. Term 2: Mon 22 Mar to Fri 28 May. Term 3: Mon 28 Jun to Fri 3 Sep. Term 4: Mon 13 Sep to Fri 19 Nov.
* Schools used as SEC written exam venues end the year on Fri 29 Oct.
* Public holidays confirmed: New Year's Day Fri 1 Jan; Chinese New Year Sat 6 and Sun 7 Feb, with Mon 8 Feb off; Hari Raya Puasa Wed 10 Mar; Good Friday Fri 26 Mar.
* Reported by secondary sources, to verify: Labour Day Sat 1 May; Vesak Day Thu 20 May; Deepavali Thu 28 Oct; Christmas Sat 25 Dec. National Day and Hari Raya Haji dates were not confirmed.
* Consequence for WA1: T1W4 starts Mon 25 Jan. Chinese New Year falls inside the T1W4 to W9 window and removes the holiday plus the days around it under rule 10.
* Consequence for prelims: English and Mother Tongue national papers land soon after the September holidays, so those prelim scripts must be marked and returned before Fri 3 Sep. National orals and listening also sit in Term 3. Prelims cannot sit where O Level prelims used to.

### 4.3 Sources

* SEAB, Secondary Education Certificate: https://www.seab.gov.sg/secondary-education-certificate-sec/
* MOE, School terms and holidays for 2027: https://www.moe.gov.sg/news/press-releases/20260714-school-terms-and-holidays-for-2027
* MOE infosheet on the SEC examination timetable: https://moe.gov.sg/news/press-releases/20240304-infosheet-2-full-sbb-related-changes-on-sec-examination-timetable-polytechnic-year-1-admission-criteria
* MOM, Public holidays for 2027: https://mom.gov.sg/newsroom/press-releases/2026/0618-public-holidays-for-2027

## 5. Design positions taken so far

These are proposals made in conversation. None has been confirmed by Harman unless stated.

### 5.1 The problem is slot picking, not timetabling

Each subject, cohort and TG has only a handful of lesson blocks in any given week. The search space is small. The value lies in showing conflicts instantly and offering the least bad choice, which a browser can do without a solver.

### 5.2 Two engines, one set of data

* WA engine: picks from the subject's own lesson blocks in the chosen week.
* Prelim and exam engine: suspends the timetable; common sittings, halls, invigilators, seating.
* Both draw on the same calendar, candidature and rules.

### 5.3 A calendar that resolves any date

Every date must resolve to: school day or not, week parity, which timetable day it follows (for swapped days), HBL or not, and what events touch it. Critical dates need three attributes: who is affected (whole school, a cohort, or a student group such as UG members), when (whole day or certain periods), and strength (hard block, avoid, or information only).

### 5.4 Student data and privacy

* Genapp is public. Student data must never be committed to it.
* Rules 8a and 8b depend on a student's subject bundle, not on their name. The candidature .xlsx can be reduced, on the exam admin's device, to anonymous bundles with counts (for example: Sec 3 TG B, 41 students read this set of 7 subjects). Conflict checks run on bundles.
* Names are needed only to list the students flagged for engagement. That lookup should happen only on devices entitled to hold the candidature file.

### 5.5 Booking at registration: the seat map model

The answer to the latest requirement. Think of choosing seats in a cinema: seats already taken are greyed out, so nobody asks the usher and nobody is sent back.

* The IP Head picks cohort, subject, term and week. The app shows only that subject's real lesson blocks in that week, each already checked against every existing booking.
* Each slot carries a status:
  * Clear: no student breaches a rule.
  * Flagged: a few students breach, at or under the limit. Booking is allowed; the IP Head acknowledges, and the app produces the list of students to engage.
  * Blocked: more students breach than the limit allows. Booking is refused, with a pop up.
  * Closed: outside the term window, on or beside a public holiday, or on a critical date.
* The pop up for a blocked slot states: which rule is broken, how many students against the limit, which other assessments cause the clash, and the nearest slots that would work. It also offers a route to ask the exam admin for an exception, so rare cases have one path instead of general back and forth.
* A booking is one transaction per subject and cohort: the TG A slot and the TG B slot are chosen and checked together, so the same day preference and the gap between sittings are judged at once.

Design issues raised with this model, all unresolved:

1. Per booking or cumulative. If every booking may add 5 breaches, eight subjects could leave 40 students affected, or the same 5 students hit again and again. Proposal: two meters. One counts the students newly put in breach by this booking. The other caps how often any one student can be in breach in a term.
2. A hard ceiling. Even under the allowance, some loads should never be bookable (for example, 3 written papers in a day or 6 in a week). Proposal: flagged status covers one step over the cap only.
3. Count or proportion. Five students is a sliver of a large cohort and a large share of Sec 5. Proposal: a limit per cohort, kept in settings.
4. The last booker carries the breach. A clash is made jointly by two or more subjects, but only the later booker is flagged or refused. That is first come, first served by the back door. Proposal: open booking in rounds, with the most constrained subjects first (those with the fewest lesson blocks per week), then subjects with more slack such as English and Maths. Order by constraint, not by speed.
5. One voice to parents. A breach belongs to a set of assessments, not to one department. Proposal: flagged students go to the Year Head or form teacher as one consolidated note per student, so a family is not contacted by three IP Heads.
6. Orals. An oral runs over several days with a slot per student. It counts on the student's own oral day. Rule 12 (oral plus two written) should show as flagged with a recorded reason, not as blocked.
7. Live shared state. Booking with instant confirmation means every IP Head must see the same bookings at once. This breaks the earlier suggestion of a single master file with the exam admin as the only writer. The app now needs a shared live store: a list inside the school's Microsoft tenancy, or a small backend. This is the largest open architecture decision.

### 5.6 Capacity check

With at most 7 examinable subjects and a cap of 4 a week, a student needs at least two WA weeks. Term 1 offers six weeks, so capacity is ample. The risk is clustering, not shortage. A cohort by week load board, shown before IP Heads choose, steers them apart early.

### 5.7 Rule tiers

Hard rules, soft rules, and overrides that need a recorded reason and an approver. Rule 12 cases and split day TG sittings go into an exception register.

### 5.8 Prelims modelled on the SEC

A prelim cannot copy the SEC literally, because the SEC spreads over about ten weeks. Proposal: keep five things and relax one.

* Keep: paper structure and durations as each syllabus sets them; one sitting per paper for all levels with TGs merged; SEAB's order (non written first, then English and Mother Tongue, then the rest); morning and afternoon sessions with SEAB style start times; SEAB's handling of clashes and access arrangements.
* Relax: the gaps between papers.
* Until SEAB releases the 2027 timetable, load the 2026 O Level order as a stand in.

### 5.9 Cards and entry proofs

A SEAB entry proof is a candidate's personal slip: subjects, papers, dates, times, venues. The card in point 11 and the entry proof in point 17 are read as the same artefact at two scales. Outputs considered: a personal card per student, a view per class and per teacher, a mail merge file for Teams, a PDF route for parents (Teams reaches staff and students; parents are on Parents Gateway), and a calendar file.

### 5.10 Boundary

This app schedules and communicates. Marks stay in School Cockpit.

## 6. Ideas flagged as missing from the brief

1. Week level load board before day level choice.
2. A fuller blackout calendar: camps, Sports Day, learning journeys, national exam dates for Sec 4 and 5, school holidays, days off in lieu.
3. Teaching runway (topics taught before the date) and a marking deadline counted back from the term's cut off.
4. Absentees and make up papers, which also count towards the caps.
5. Access arrangements: extra time and separate rooms change duration and venue.
6. Candidature changes during the year, with effective dates.
7. Paper logistics: setter, vetter and printing deadlines counted back from the date; script counts per class.
8. Orals as their own kind of event: examiner panels, rooms, slots per student, relief for examiners.
9. Teacher marking load: one teacher with several classes sitting in the same week.
10. Change control after publishing: versions, reasons, and notices only to those affected.
11. A completeness check: flag any subject and cohort with no WA booked as a window closes.
12. Showing true slot supply per subject before booking opens, after holidays and critical dates are removed.
13. Membership lists (for example UG rolls) if student group events are to be deconflicted per student.

## 7. Open questions

### 7.1 Rules

1. Is a WA always held in that subject's own lesson block, or can it be pulled out to a common slot?
2. Rule 10: is the blackout the day before a public holiday, the day after, or both? The wording points to both.
3. Combined Science: if the Physics and Chemistry papers fall on different days, is that one assessment or two for the caps? Same question for Social Studies with an elective humanities.
4. How long is one period, and can a WA run longer than a double period?
5. Is it exactly one WA per subject per term for every cohort?
6. Do the term windows bind orals and performance tasks, or only written WAs?
7. Term windows: does "before T1W10" mean the last WA day is the Friday of W9? Is T2W9 inclusive? Does "anytime" in Term 3 include W1?
8. Are the subject code meanings in section 3 right, and is Mother Tongue truly banded across TGs?

### 7.2 Calendar

9. On PTM, Annual Awards Day and similar dates, are lessons cancelled, shortened or normal?
10. Which critical dates affect the whole school, which a cohort, and which only a student group?
11. Are CCA and UG membership lists available to the app?

### 7.3 Booking and the breach limit

12. Is the limit of 5 counted per booking, or cumulatively per cohort per week or term?
13. Is it a fixed count, or should it scale with cohort size?
14. Is there a hard ceiling that no allowance can exceed?
15. Should booking open in rounds with the most constrained subjects first, or open to all at once?
16. Who engages the flagged students and parents: the IP Head, or the Year Head and form teacher with one consolidated note?
17. Who may grant an exception when a slot is blocked?

### 7.4 Prelims and exams

18. One prelim block, or split so that English and Mother Tongue run earlier?
19. Do the daily and weekly caps apply to prelims? The SEC itself allows two papers in a day.
20. Do Sec 5 students in 2027 sit the SEC at G3 on the same timetable as Sec 4?
21. Are prelim orals, listening and practicals in scope, with examiner panels and rooms?
22. Are the Sec 1 to 3 end of year exams in scope, and on the same SEC model?
23. Is the reading of "entry proofs" in section 5.9 what Harman means?

### 7.5 Architecture and data

24. Where does shared booking state live: a list in the school's Microsoft tenancy, a small backend, or something the relief system already uses?
25. Where may student data live under MOE's data rules, and who may see names?
26. Should the three email columns be stripped from the reference timetable before it is published in genapp?
27. Should Exam Admin stay in genapp (public) at all, given the data it handles?

### 7.6 Inputs Harman will provide

28. Percentage weights for each assessment.
29. The candidature .xlsx (student data).
30. The school calendar with swapped days, HBL days and critical dates.
31. The 2027 timetable .csv.

## 8. Working conventions

* Talk first; no code until Harman says so. Start with questions, give a point of view, hold it lightly.
* Writing rules: no hyphens, em dashes or en dashes in prose; no heavy bold or italics; "Beattyian" always capitalised; concise but never at the cost of depth.
* Do not touch the pedagogies repo. It is a reference only.
* Before building, read genapp's `CLAUDE.md` and root `README.md`.
