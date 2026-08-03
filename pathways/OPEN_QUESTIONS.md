# Open questions

Editorial and factual decisions left to the maintainer. **Read this before the tool goes in front of students.**

## 1. The verification checklist

The session that built this app had a network policy that blocked `moe.gov.sg`, `seab.gov.sg`, every `*.moe.edu.sg` school site, and the major Singapore news outlets at the proxy. Not one primary page could be opened. Every figure below came from search result summaries.

The app is honest about this on screen: anything unverified renders a `provisional` badge next to the number, and the footer states the count. It still needs closing.

| Claim in the app | Where it lives | Verify against | If it turns out different |
| --- | --- | --- | --- |
| JC and MI: L1R4 aggregate of 16 or better | `pathways.json` → `jc`, `mi` | MOE post secondary admissions | Changes the headline JC figure. High visibility, fix first. |
| Polytechnic: four G3 subjects, one counted subject may be G2, ELR2B2 net 22 | `pathways.json` → `poly` | MOE polytechnic admission criteria for the 2028 intake | Changes the structural rule `poly_g3` as well as the displayed aggregate. |
| PFP: ELMAB3 gross 12, computed at G2 equivalent | `pathways.json` → `pfp` | MOE PFP eligibility criteria | Displayed only, no structural effect. |
| Higher Nitec direct Year 2 entry at G2, ELMAB3 19, from AY2028 | `pathways.json` → `hnitec` | MOE and ITE admissions | Displayed only. |
| DPP retired with the 2028 ITE intake | `glossary.json`, `pathways.json` | MOE DPP page | If DPP survives, it needs adding as a destination with its own route. |
| ITE to polytechnic: GPA 2.5 minimum from 2027, guaranteed at 3.5 | `progressions.json` → `ite_to_poly` | MOE press release, July 2023 | This is the single most motivating number in the app. Get it right. |
| Fifth year eligibility: 3 or more G3 passes and not qualifying; or ELMAB3 21, ELB3 14, MAB3 14 at G2 with minimum Grade 5 | `pathways.json` → `sec5` | MOE | Displayed only. |
| SkillsFuture $4,000 Mid Career Credit at 40, 36,000 users since May 2024 | `lifelong.json`, `journey.json` | SkillsFuture Singapore | Update the take up figure annually. |
| Mid Career Training Allowance, 50 percent of income, $300 to $3,000, part time extension from 1 March 2026 at $300 | `lifelong.json` | SkillsFuture Singapore | Update annually. |
| MCES up to 90 percent for full time diplomas from AY2025 | `lifelong.json`, `stories.json` | SkillsFuture Singapore | Update annually. |
| Combined Science pair to syllabus code mapping | `subjects.json` → `sci_pc`, `sci_pb`, `sci_cb` | SEAB 2027 SEC syllabus list, codes in the K34x range | The three pairs themselves are confirmed. The app shows no syllabus codes, so a wrong mapping cannot bite, but confirm before ever adding codes to the rows. |
| Economics at SEC, code K343 | `subjects.json` → `economics` | SEAB syllabus list for the 2027 SEC | New subject, marked provisional and "selected schools". If it is not offered at SEC after all, delete the row. |
| Drama, Design and Technology, and Music at G2 | `subjects.json` | SEAB syllabus list | Listed and marked provisional. The G3 versions are solid; the G2 versions were reconstructed from search summaries. |
| Exercise and Sports Science SEC code and level span | `subjects.json` → `ess` | SEAB | Marked provisional, "selected schools". |
| Higher Art and Higher Music school gating | `subjects.json` | MOE AEP and MEP pages | Modelled as G3 at selected schools. Confirm the programme names have not changed. |
| Per school subject availability | the `availability: "selected"` tags | MOE SchoolFinder and your own school's offer | The tags say "selected schools", never which ones. The disclaimer under the subject list, and the sheet behind it, carry the SchoolFinder link. |

| Lower secondary: only English, Mother Tongue, Maths and Science can be raised at Sec 1, Humanities not until Sec 2 | `subjects.json` → `raisableFrom`, `junctures` | MOE Full SBB pages | This is the most falsifiable new claim in the app and it is asserted in three places. If Humanities can in fact move at Sec 1, the Sec 1 juncture line, the `raisableFrom` values and the `ls_hums_not_yet` card all need changing together. |
| Posting Group to subject level thresholds: PG2 to G3 at AL 5, PG1 to G2 at AL 6 or Foundation AL A | not shown on screen, but it shapes the model | MOE | Not currently rendered anywhere, deliberately. One source contained an obvious typo. Verify before ever displaying. |
| Level review criteria: roughly 75 percent to move up, roughly 50 percent to continue | `subjects.json` → `junctures.schoolNote` | School FSBB handbooks | These are SCHOOL set, not MOE mandated, and the app deliberately never shows either number. If they are ever added, they must arrive already qualified as what schools tend to use. |
| Upward level movement between Sec 3 and Sec 4 | `copy.json` → `thisYear.sec3`, `junctures.years.sec3` | MOE | The app now says levels are largely settled by Sec 3. No MOE provision for upward movement then could be found, and what is documented at end of Sec 2 and Sec 3 is downward recalibration. If upward movement does exist at Sec 3, this is the line to change. |
| How a G2 grade maps onto the grade 1 to 6 bands in polytechnic entry requirements | `subjects.json` → `keepsOpen` on the Science pairs | Polytechnic course pages | **The load bearing unknown.** A G2 student taking Science as a pair almost certainly satisfies the SUBJECT condition. Whether they clear the GRADE condition is genuinely open, and G2 students are a core audience. |
| Combined Science is named in poly engineering, nursing and biomedical entry requirements | `subjects.json` → `keepsOpen` | Polytechnic course pages | Well evidenced across three polytechnics. Do NOT extend it to university: for NUS and NTU engineering, O Level Physics specifically appears as a floor. |

Since the last pass, one big item moved from this table to confirmed: **Combined Humanities**. One of Humanities (Social Studies, Geography), (Social Studies, History) or (Social Studies, Literature in English) is compulsory for every G2 and G3 student, Social Studies is never standalone, pure Humanities subjects are additive with an anti duplication rule, SEC codes K229 to K231 and K335 to K339. The app now models exactly that.

Also unverified: whether Mathematics at G3 is a hard JC requirement or merely expected. It is currently modelled as `soft`, so it appears in the checklist but does not affect reach state. That is the cautious direction, and it is a guess.

## 2. Real profiles

`stories.json` ships with `profiles: []` on purpose.

The Journey ending and the Aim mode both want real named Singaporeans whose paths were not linear, each with a link a student can follow. None could be verified from this session, and inventing a person and letting them read as real is not an acceptable substitute. The app renders two visibly different card types so that a pattern is never mistaken for a person, and it currently shows only patterns.

To fill it, add objects of this shape to `profiles`:

```json
{
  "id": "unique_id",
  "kind": "profile",
  "name": "Their name",
  "label": "Their name",
  "shape": ["Nitec", "Higher Nitec", "Polytechnic diploma", "Degree"],
  "body": "Two or three sentences, in their own terms.",
  "takes": "How long it took.",
  "whatMattered": "The thing they say made the difference.",
  "url": "https://link.to.the.published.source",
  "status": "confirmed"
}
```

Sources worth trying: SkillsFuture and MOE feature pages, ITE and polytechnic alumni profiles, Straits Times and CNA education features, and the SkillsFuture Fellowships citations.

Alumni from your own school, suitably anonymised, would land harder with your students than anything public. If you go that way, keep `kind: "profile"` only where a student could actually verify it, and use `kind: "typical"` for anything anonymised into a pattern.

## 3. Naming

Title is *Paths*, decided 2026-08. It lives in `index.html` `<title>` and the `chrome.brand` key in `copy.json`, which `main.js` renders into the `.brand` block. It was *The Long Game*, briefly *Still Open*; both were rejected as too clever. *Paths* says what the thing is, matches the folder slug, and a Sec 1 student does not have to decode it.

## 4. Calls already made, and why

- **The uploaded spec's traffic light palette was rejected.** It coloured G1 green, G2 amber, G3 blue. In front of a class that reads as good, warning, best, and it ranks children by band. The three levels now carry three hues of equal weight, and semantic colour is reserved for reach state.
- **No red anywhere.** Nothing in this app is a failure, so nothing gets a failure colour.
- **Reach is structural, not predictive.** The alternative was asking students for predicted grades, which would have made the tool more precise and considerably more harmful.
- **A folder, not a single file.** This departs from the `frontend-design` skill's single file rule. The data has to be separately maintainable and independently citable, and three modes in one file would not survive a year of edits. There are still zero external dependencies and zero runtime network calls.
- **Doors never decrease in Journey mode.** A deliberate asymmetry. Setbacks cost time in the narrative and never cost options in the ledger.
- **Starting personas were designed and rejected; the combination replaced them.** The proposal was a handful of named starts, each carrying a subject combination. Named starts are quick to build, good for a class, and they hand a fourteen year old an identity before they have made a single choice, which is the Gottfredson problem the app already refuses elsewhere. What shipped instead is the student's own combination from Mode NOW, carried into the run as a position rather than a personality: it names their subjects back to them, adds choices, and shifts which chances appear, and it is structurally barred from setting a path, opening a door or reaching the ending. If a future maintainer wants the classroom convenience of ready made starts, they can be added as unnamed combinations, never as characters.
- **The sliding distance rail was designed, reviewed and killed.** It encoded how far each destination was as a dot's position on a track. Two independent reviews found the same fatal flaw: position is a continuous ranking, and combined with a non monotone distance function it meant a student entering an honest G1 plan watched three doors slide away from them. The distance function is fixed and enforced now, but the rail is not coming back, because a continuous measure of how far a child is from something is a ranking whatever you call it. What replaced it is a fixed alphabetical list plus the lever line.
- **html2canvas was deleted.** 198 KB, 62 percent of the payload, to photograph one card. Replaced with about sixty lines of Canvas 2D that draws the card deliberately.
- **First paint counts every visible label,** including each G1/G2/G3 chip glyph. A budget that excluded labels could be met by moving prose into labels.

## 5. Things worth building next

- A short pre and post question set, so a teacher can see whether a class's beliefs about the system actually shifted.
- A predict then reveal card. Ask "how many of these eight stay reachable whatever you take?", let them guess, then show the answer. The thesis lands harder as a surprise the student produced than as a sentence they skimmed.
- A compare tray, so two destinations can be held side by side rather than opened one at a time.
- An anonymous question box. A student will type "what if I fail" into it. That is the value and also the risk: it would sit in `localStorage` where no adult ever sees it, so it must either be labelled plainly as read by nobody, or not shipped in a school.

Already done, from the classroom review: per school subject availability (teacher layer), a parent note (teacher layer), a projector view (`?board=1`), a plan that survives a shared Chromebook (`?p=` link), and a Journey run that survives a refresh.
