# PSE 2028 rules: verification summary (accessed 2026-10-27)

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
- **PFP.** ELMAB3 gross must be 12 or less, computed at G2-equivalent grades, with no bonus points. Students taking G3 subjects or a G2/G3 mix can apply. G3 grade 9 and G2 grades 5 and 6 cannot be used.
- **ITE 2-year Higher Nitec.** ELMAB3 gross must be 19 or less at G2-equivalent grades, excluding CCA points, plus the course MERs. DPP ends from the AY2028 intake.
  - G3 grade 9 (which maps to 5) and G2 grade 6 count in the aggregate but cannot meet MERs.
  - If a subject was taken at two levels, the better grade is used.
- **ITE 3-year Higher Nitec.** Open to all SEC candidates. Admission is set at G1: four subjects at G1-equivalent grades, using the aggregate types R2B2, R1B3-A, R1B3-B, R1B3-C or B4.
  - R and B subjects need G3 E8, G2 grade 5 or G1 grade D or better. B4 has no grade requirement.
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
