# PSE 2028 rules: verification summary (first read 2026-10-27; primary pages read in full 2026-11-11)

**Read the section "Primary page re-check, 2026-11-11" at the end first.** It supersedes anything above it that it contradicts; the two lines it corrects are marked in place.

**How this was checked.** WebFetch could not reach moe.gov.sg, seab.gov.sg or the school sites in this session, and the proxy refused curl to moe.gov.sg. Everything below comes from search-engine extracts of the cited pages. "Confirmed" means the extract quoted a primary MOE, SEAB or institution page. Spot-check the live pages before release. Full detail and source URLs are in `pse.json`.

## Confirmed by primary sources

- **JC.** The L1R4 gross aggregate must be 16 or less.
  - L1 is EL or HMTL. R1 is a Humanities subject, R2 is a Maths/Science subject, R3 is either, and R4 is any subject.
  - All five L1R4 subjects must be G3. That is the real "five subjects at G3" rule; no other count of G3 subjects is required.
  - Grade floors: EL G3 C6, and G3 Maths or A Maths D7.
  - MTL can be G3 D7, G2 grade 5 or better, G1 grade D or better, or G3 HMTL E8. MTL does not have to be G3.
  - Bonus points: the cap is now 3 (it was 4), plus 2 for students selected for an MTL Language Elective Programme. The net aggregate (gross minus bonus) is used for posting.
- **MI.** L1R4 must be 20 or less, with the same subject structure, grade floors and bonus cap as JC.
- **Poly.** The ELR2B2 NET aggregate must be 22 or less (Nursing: ELR2B2-C net, 24 or less).
  - EL, R1, R2 and B1 are counted at their G3 grade.
  - **B2 is always counted at a G2-equivalent grade.** It can be a G2 subject, or a G3 subject mapped down.
  - G3 grade 9 and G2 grades 5 and 6 cannot be used. CCA bonus: Excellent 2, Good 1.
- **PFP.** ELMAB3 gross must be 12 or less, computed at G2-equivalent grades. (Corrected 2026-11-11: the 12 is read before bonus points, but CCA points, up to 2, then come off for posting.) Students taking G3 subjects or a G2/G3 mix can apply. G3 grade 9 and G2 grades 5 and 6 cannot be used.
- **ITE 2-year Higher Nitec.** ELMAB3 gross must be 19 or less at G2-equivalent grades, excluding CCA points, plus the course MERs. DPP ends from the AY2028 intake.
  - G3 grade 9 (which maps to 5) and G2 grade 6 count in the aggregate but cannot meet MERs.
  - If a subject was taken at two levels, the better grade is used.
- **ITE 3-year Higher Nitec.** Open to all SEC candidates. Admission is set at G1: four subjects at G1-equivalent grades, using the aggregate types R2B2, R1B3-A, R1B3-B, R1B3-C or B4.
  - Three of the four subjects need G3 E8, G2 grade 5 or G1 grade D or better: R1, R2 and B1 in R2B2; R1, B1 and B2 in R1B3-A, -B and -C. The last B subject has no grade requirement, and B4 has none at all. (Corrected 2026-11-11.)
  - No numeric cut-off is published.
- **Sec 5.** A student qualifies by either route below.
  - Route 1: three or more G3 passes and not eligible for JC, MI or Poly Year 1.
  - Route 2: two or fewer G3 passes, plus ELMAB3 of 21 or less, ELB3 of 14 or less, or MAB3 of 14 or less, computed at G2 with every subject at grade 5 or better.
  - To take all subjects at G3 in Year 5, ELMAB3 must be 19 or less.
- **Grade scales (SEAB).** G3 is A1 to 9, G2 is 1 to 6 and G1 is A to E. Certificate thresholds are E8, grade 5 and grade D.
- **Mapping G3 to G2 (published).**

  | G3 grade | G2 equivalent |
  |---|---|
  | A1, A2, B3 | 1 |
  | B4, C5, C6 | 2 |
  | D7 | 3 |
  | E8 | 4 |
  | 9 | 5 |

- **Mapping G2 to G1 (published).**

  | G2 grade | G1 equivalent | ITE points |
  |---|---|---|
  | 1, 2, 3 | A | 1 |
  | 4 | B | 2 |
  | 5 | C | 3 |
  | 6 | D | 4 |
  | (G1 E only) | E | 5 |

  No G2-to-G3 or G1-to-G2 up-mapping is published. A G2 grade only enters a "G3" aggregate through the poly B2 slot (and LASALLE/NAFA), where it counts at its G2 value.
- **Arts (LASALLE, 2028 intake onwards).** EL must be a G3 pass at C6 or better, plus an aggregate of 21 or less in four other subjects; one may be G2, otherwise the lowest G3 is mapped to G2. A portfolio is also required. NAFA states the same 21-point rule with three G3 subjects and one G2.

## Corrections to the app's current data

1. Poly: the B2 slot is always counted at its G2 equivalent. "One of the two best may be G2" is not quite right. The 22 and 24 limits are NET cut-offs.
2. Poly families: there are only four types, A to D; ELR2B2-E does not exist. The app's labels are also wrong:
   - A: business, humanities and media.
   - B: business with maths, such as accountancy.
   - C: engineering, IT, applied and health sciences, and Nursing.
   - D: design and architecture.

   The subject lists come from 2026 JAE and TP's 2027 table, so they are provisional. The 2028 lists are due mid-2027.
3. JC/MI bonus cap is 3 (+2 for LEP); MTL can be G2 or G1.
4. 3-year Higher Nitec is computed at G1-equivalent grades, not G2.

## Provisional or uncertain

- Values of individual JC bonus items under the cap of 3 (CCA 2/1, affiliation 2, EL+HMTL 2). These come from older MOE pages.
- Whether JC conditional admission continues, what counts as a "G3 pass" for Sec 5, any poly bonus cap beyond CCA, and which ITE courses use which aggregate type.
- PFP cluster MERs (EL 3, Maths 3, relevant subject 3, two best subjects 4 at G2) and the relevant-subject lists. These come from AY2026 poly pages.
- JC H2 prerequisites. School pages, not MOE, give these:
  - H2 Maths expects A Maths, typically B3 to B4.
  - H2 Physics expects Physics B3 or Combined Science A2.
  - H2 Biology expects Biology B4 or Combined Science B3 (CJC).
- ITE cluster MERs. Only engineering and ICT examples were found.
- G3 points equal to the grade number (A1 = 1 … 9 = 9) is the O-Level convention. No SEC page restating it was found.

## Changes since 2026-08-05

No new MOE press release, Parliamentary reply or SEAB notice was found. MOE pages still say 2028 course details will be published mid-2027. Explainers from October 2026 (edukatesg) restate the same rules.

## Re-check 2026-11-01 (v4.2.0)

How: search engine extracts of moe.gov.sg, seab.gov.sg, lasalle.edu.sg and nafa.edu.sg. moe.gov.sg and seab.gov.sg are not on this environment's allowed network list, so no page was opened in full.

Held, unchanged: L1R4 16 and 20 (gross), all five at G3, English C6, G3 Maths or A Maths D7, Mother Tongue floors; ELR2B2 net 22 (Nursing 24) with B2 at its G2 value; PFP ELMAB3 12; Higher Nitec (2 yrs) ELMAB3 19; Higher Nitec (3 yrs) set at G1; Sec 5 routes. No 2026 announcement changes these (COS 2026, 3 Mar 2026, confirms one PSE from 2028).

Corrected in the app:
- JC and MI: R3 must be a Humanities, Maths or Science at G3, so three of those at G3 is now a rule (MOE JAE changes from 2028; Infosheet 1, 6 Mar 2025).
- NAFA and LASALLE: four other subjects count, at most one at G2, so four at G3 with English (LASALLE diploma admissions; NAFA Art and Design).
- Grade targets: each destination applies its own exclusions. PFP drops G3 9 and G2 5 and 6; Sec 5 drops G2 6; Higher Nitec (2 yrs) counts every grade.
- Sec 5 target: the ELMAB3 21 test applies only with 2 or fewer G3 passes; 3 or more qualify without it.
- JC and MI targets: the grade floors are now checked, not only shown.
- Bonus points: the cut offs are gross; bonus points change only the posting.
- Higher Nitec (3 yrs): English is soft, since B4 has no required subject.

No rule sets a minimum of five subjects on its own. Five follows from how each score is built, and the SEC certificate itself needs one subject at E8, grade 5 or grade D.

Sources: moe.gov.sg/post-secondary/admissions/jae/changes-from-2028; moe.gov.sg/news/press-releases/20250306-infosheet-1-revised-jc-admission-criteria; moe.gov.sg/post-secondary/admissions/pse/ (jc-and-mi, polytechnic-diploma-course, pfp, ite-2-year-higher-nitec, ite-3-year-higher-nitec, explore-pathways); seab.gov.sg/secondary-education-certificate-sec/; lasalle.edu.sg/study/admissions/diploma-eae-admissions/; nafa.edu.sg/admissions/diploma-admissions/faculty-of-art-design; moe.gov.sg/news/speeches/20260303 (COS 2026).

## Primary page re-check, 2026-11-11 (7.0)

How: every page was fetched in full with curl from www.moe.gov.sg and www.seab.gov.sg, including the expandable sections, which MOE ships as JSON inside the page source. Each quoted line was checked by machine against the saved page text. This is the first check that did not rest on search engine extracts. NAFA, LASALLE, polytechnic and ITE sites were still not opened; two facts from them are marked secondary.

Result: 61 facts confirmed, 19 wrong, 8 not found on a primary page.

Pages that carry the rules, with the date each gives:

| Page | Last updated |
|---|---|
| moe.gov.sg/post-secondary/admissions/pse | 22 Sep 2026 |
| .../pse/jc-and-mi (the old /jae/changes-from-2028 address redirects here) | 28 Jul 2026 |
| .../pse/polytechnic-diploma-course | 23 Jun 2026 |
| .../pse/pfp | 22 Sep 2026 |
| .../pse/ite-2-year-higher-nitec and .../pse/ite-3-year-higher-nitec | 16 Mar 2026 |
| .../pse/explore-pathways (fifth year criteria) | 03 Mar 2026 |
| .../pse/pse-eligibility, how-to-apply, how-posting-works | 09 Jul, 04 Mar, 04 Mar 2026 |
| moe.gov.sg/psle-fsbb/full-subject-based-banding/faq (arts institutions, NAFA Foundation Programme, PFP subject minimums) | sitemap 05 Mar 2026 |
| moe.gov.sg/secondary/schools-offering-full-sbb | 29 Sep 2026 |
| seab.gov.sg/secondary-education-certificate-sec/ | 14 May 2026 |
| MOE Polytechnic Aggregate Types Computation, 2026 JAE (PDF) | 2026 JAE |
| moe.gov.sg/post-secondary/admissions/pfp/eligibility-criteria (current cohort) and the PFP cluster list from AY2027 (PDF) | 12 Mar 2026 |

### What changed in the app

- **JC and MI Humanities.** MOE now publishes the L1R4 subject groups. Art, Music and Economics are "Others" and count only as R4. Higher Art and Higher Music are Humanities. Computing is "Others". Changed in `data/pathways.json` and `engine/grades.js`; the rule is now confirmed.
- **Conditional admission to JC and MI exists for 2028.** With a floor grade missed: JC at L1R4 12 or better, or 13 to 16 with A1 or A2 in all four R subjects; MI at 15 or better, or 16 to 20 likewise. The grade must be reached by the end of Year 1; an Absent grade does not qualify. In `data/grades.json` (`dests[].conditional`) and `judge()`. The old pin, which forbade it, is replaced.
- **Higher Mother Tongue at E8 or better meets the Mother Tongue floor.** Added as `floors[].alt`.
- **Mother Tongue and Higher Mother Tongue of one language count once** in L1R4, ELR2B2 and ELMAB3. Religious Knowledge cannot be counted for JC and MI.
- **JC and MI bonus points.** Cap 3, from CCA (2 or 1), English with Higher Mother Tongue at A1 to C6 (2), Chinese or Malay (Special Programme) or Bahasa Indonesia at A1 to C6 (2), and an affiliated JC (2). A Language Elective Programme place adds 2 beyond the cap.
- **PFP and both Higher Nitec routes have CCA points for posting** (up to 2). The 12 and 19 are read before them. "No bonus points" was wrong.
- **PFP subject minimums are confirmed for the SEC cohort**, at G2 grades: English 3, Mathematics 3, one relevant subject 3, two others 4. Added as a row and checked in `judge()` as far as it can be: which subjects are "relevant" per cluster arrives in mid 2027.
- **PFP has three clusters**: Sciences; Design, Engineering and Technology; Humanities, Art, Media and Business. Design, and Engineering and Technology, are two smaller groups at NYP and TP only. Family ids are now `pfp_sciences`, `pfp_det`, `pfp_hamb`.
- **Polytechnic and Mathematics.** R1 and R2 must be G3 subjects. MOE states for 2028 that type B counts only Mathematics or Additional Mathematics as R1, and its 2026 table prints the same single first group across B, C and D. The soft rule is now Mathematics or Additional Mathematics at G3. Type A can use another subject.
- **Polytechnic course types, from MOE's own 2026 table.** A: no science in either group, and Principles of Accounts only in the second. B: second group includes Humanities (Social Studies with an elective), Higher Art, Music and Higher Music. D: second group includes the three combined Sciences, Computing, Nutrition and Food Science and Electronics. The earlier "sources disagree" note is settled.
- **Grades that cannot count.** Polytechnic and PFP scores cannot use a G3 9 or a G2 5 or 6. ITE scores can; a G3 9, G2 6 or G1 E only fails a course's subject minimum. G1 subjects are not counted in ELMAB3 at all.
- **Arts institutions.** One rule for NAFA and LASALLE, on MOE's FAQ: G3 English at C6 or better, and 21 points or better in four other subjects, three at G3 and one at G2 (the lowest G3 is mapped down if all four are G3). A portfolio, audition, test or interview is also required and meeting the minimum does not guarantee a place. Both are outside the PSE and run their own early admissions (LASALLE in May, NAFA in June), open to G2 and G3 students from AY2028. The NAFA Foundation Programme asks ELMAB3 of 15 or better at G2 grades.
- **Sec 5.** The criteria are confirmed. Levels do matter: MOE tells students without enough G2 or G3 subjects to ask their school, and students apply through the secondary school. "Not qualified for polytechnic" means a net ELR2B2 of 23 or more, or no course minimum met.
- **The PSE replaces** the Joint Admissions Exercise, the PFP Admissions Exercise and the ITE Joint Intake Exercise (2 year and 3 year Higher Nitec). The DPP is not folded in; it ceases from the AY2028 ITE intake.
- **G3 and G2 points equal the grade number.** MOE's 2028 worked examples show it, so this no longer rests on the O Level convention.

### Still not on a primary page

- **What a "G3 pass" is, for the fifth year.** MOE uses the words without defining them. SEAB's reply on O Level calls A1 to C6 the subject passes; the SEC certificate is awarded at E8. The engine keeps E8 and every screen line says it is to confirm with the school.
- **A student with no Mother Tongue grade.** MOE lists Mother Tongue, or an approved language in its place, as required and says nothing more. The floor is left unchecked when no grade is entered, and marked provisional.
- **How many floors may be missed for conditional admission.** Not stated; no limit is assumed.
- **Weight of the portfolio or audition, and the length of an arts diploma.** Not on any MOE page read.
- **JC H2 prerequisites.** MOE publishes none; each college sets its own.
- **What each polytechnic course type covers, in words.** MOE only links each type to CourseFinder.
- **All 2028 course lists and minimum entry requirements**, including which 3 year Higher Nitec course uses which score type. Due mid 2027 on SchoolFinder and CourseFinder.

### Not in these files, for whoever owns them

- `data/glossary.json`: the PSE entry says it replaces the JAE (it also replaces the PFP exercise and the ITE JIE); Early Admissions says June, but ITE's ran 20 to 26 May 2026 and the polytechnics' 25 June to 1 July 2026.
- `ui/targets.js` still prints "read 27 October 2026" under the scores.
- MOE's own FAQ is not fully consistent: one answer still gives the old L1R5 rule, and several pages still say "2028 JAE". Quote the PSE section for JC.

The full row by row table, with a verbatim quote for every fact, was written to the session scratchpad as `research_admissions.md` on 2026-11-11.
