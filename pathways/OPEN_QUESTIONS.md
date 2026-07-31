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
| Subject availability by level | `subjects.json` | SEAB syllabus list and your own school's offer | Several subjects are marked provisional. Combined Science shapes, A Maths at G2, and the G1 subjects are the least certain. |

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

Working title is *The Long Game*, folder slug `pathways`. It lives in `index.html` `<title>`, the `<meta name="description">` and the `.brand` block in `main.js`. Alternatives considered: *Many Roads*, *Still Open*, *Long Runway*, *Where Next*.

## 4. Calls already made, and why

- **The uploaded spec's traffic light palette was rejected.** It coloured G1 green, G2 amber, G3 blue. In front of a class that reads as good, warning, best, and it ranks children by band. The three levels now carry three hues of equal weight, and semantic colour is reserved for reach state.
- **No red anywhere.** Nothing in this app is a failure, so nothing gets a failure colour.
- **Reach is structural, not predictive.** The alternative was asking students for predicted grades, which would have made the tool more precise and considerably more harmful.
- **A folder, not a single file.** This departs from the `frontend-design` skill's single file rule. The data has to be separately maintainable and independently citable, and three modes in one file would not survive a year of edits. There are still zero external dependencies and zero runtime network calls.
- **Doors never decrease in Journey mode.** A deliberate asymmetry. Setbacks cost time in the narrative and never cost options in the ledger.

## 5. Things worth building next

- A parent view. Parents drive a lot of subject combination decisions and are working from a system that no longer exists.
- Per school subject availability, since the national list overstates what any one school actually runs.
- A short pre and post question set, so a teacher can see whether a class's beliefs about the system actually shifted.
