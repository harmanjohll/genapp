# NOTES

Working notes for the `house/` folder. Written so this can be picked up cold, by you or by a future session, without rereading the conversation that produced it.

---

## 1. Live, and where things sit

The folder is live and self contained. Nothing here imports from, or is imported by, any other folder in `genapp`.

- `harmanjohll.github.io/genapp/houses/` overview
- `harmanjohll.github.io/genapp/houses/studio2.html` the leadership dashboard
- `harmanjohll.github.io/genapp/houses/studio.html` the first Studio, unchanged

**It must land on `main`.** GitHub Pages serves `genapp` from `main`, so a feature branch or an open PR publishes nothing. A PR is fine if you prefer the audit trail, but it has to be merged before anything appears. Root `.nojekyll` already exists, so no further configuration is needed. Give Pages a minute or two to rebuild after any push.

**Folder layout.** The written record and the source workbook live in `references/`. The interactive tools sit at the folder root beside `index.html`, because `index.html` links to them and Pages serves them directly.

---

## 2. Which file is which

The names changed during the build. This is the mapping.

| File | Status | What it is |
| --- | --- | --- |
| `studio2.html` | **Current** | House Dashboard. Seven tabs, analytics and presentation. The leadership facing tool. Treats the whole question as open, including whether to do this at all |
| `studio.html` | Current | House Studio, first pass. Vertical house architecture only. Left untouched by the studio2 build |
| `index.html` | Current | Overview page. Provenance table, open questions, the five houses |
| `audit.html` | Current | Enrichment band audit, 2024 and 2025 |
| `configurator.html` | Superseded on house architecture, still valid on band capacity | Earlier pass. Staffing, choice and overcommitment modelling |
| `references/REPORT.md` | Reference | Written report from the first pass. Predates the discovery that the houses already exist, so its naming section is obsolete. Everything on band capacity, the club catalogue and change management still stands |
| `references/TAXONOMY.md` | Reference | The ten category classification applied to every activity record |
| `references/enrichment-audit-2024-2025.xlsx` | Source data | 1,380 activity records with verbatim source text |

If you only open one thing, open `studio2.html`.

---

## 3. State of play

**Settled.**

- The houses already exist: Hood, Jellicoe, Harwood, Sturdee, Fisher. The naming question is closed. All five are Royal Navy officers connected to Admiral David Beatty, after whom the school and Beatty Road are named.
- Recommended sorting model is **class anchored vertical**: whole form classes assigned to a house at Sec 1, staying four years. This is the only model where inter class competition at a level is automatically inter house competition, which fills the house table from events already running rather than requiring new ones in an already full band.
- Recommended identity scheme is **the admiral's disposition drawn from the record**, optionally paired with a HEART element. Each house stewards one talent domain for the whole school, mapped to what its namesake is actually remembered for.
- Wushu must be counted as a Sport for the one Sport per house arithmetic to close. MOE files it under Visual and Performing Arts, which leaves only four sports for five houses.

**Not settled, and blocking.** See section 4.

**Deliberately out of scope this pass.** CCA attendance and participation quality. The audit covers what was scheduled, not who turned up.

---

## 4. The four numbers needed before the next pass

Everything modelled in `studio.html` is a slider with a defensible default. Four real figures would replace most of the modelled layer.

1. **Form classes per level.** The single most consequential unknown. Five houses can only hold whole classes evenly if the class count divides by five. Eight does not; ten does. With eight, the remainder has to rotate across levels, which evens out over four years but not at any single level, so one house fields more classes than another in a Sec 2 carnival. This resolves itself at Sec 1 registration whether or not it is modelled first.
2. **CCA roll by CCA**, split by level and gender if the data allows. Replaces the modelled sizes and gender mixes wholesale.
3. **Facilitator supply per band day.** Determines whether the choice architecture is real or nominal. This was the open question from the first pass and it is still open.
4. ~~**House colours.**~~ **Settled.** Confirmed by the school: Hood Red, Jellicoe Green, Harwood Yellow, Sturdee Orange, Fisher Blue. No published source states them; the school's confirmation is the record. An earlier draft had Jellicoe Orange, Harwood Green and Sturdee Yellow, all three now corrected.

---

## 5. The five tensions the modelling exposed

Recorded here so they are not rediscovered from scratch.

**Class nesting is the binding constraint.** Not headcount, not gender. Whether the class count divides by five decides more about how the house system feels than any other input.

**Gender balance and anchor reach actively fight each other.** Beatty has three boys only CCAs (Football, Boys' Brigade, NCC Land) against one girls only (Volleyball). Levelling gender across houses wants Volleyball paired with a boys uniformed group. Keeping a house's flagships open to all its own members wants them apart. The Studio has separate solver buttons for each so the disagreement is visible rather than silently resolved. There is no configuration that maximises both.

**Under class anchoring, the anchors cannot balance anything.** House size comes from class allocation and gender comes from the classes themselves. The anchors control only reach. Gender is balanced by house aware Sec 1 class allocation, not by which sport a house flies. Three of the four solver buttons will barely move under this model, and that is correct behaviour, not a bug.

**The pure CCA model fails on four counts, not one.** Sizes (Concert Band and NPCC are roughly double Wushu and Football), gender (structural, above), vertical evenness (CCAs thin at upper secondary so the column narrows exactly where the Sec 3 and Sec 4 leaders should be), and class nesting (drops to zero). It is also the Hogwarts move philosophically: sorting by talent on arrival, against the Gagné developmental argument the rest of the design rests on.

**Anchor concentration is bought with student choice.** Steering Sec 1 CCA allocation toward the house flying that flag is the only way to make the flagships felt under class anchoring, and every point of concentration costs first choice satisfaction. The Studio models the trade; the curve is illustrative, not measured.

---

## 6. Loose ends and known gaps

**House colours.** Checked and not found: the school website, its own history page, the school's Wikipedia entry, the MOE Heritage Centre profile, and NewspaperSG. The likely record is one of the two commemorative histories in the NLB catalogue, neither available in full text online:

- *Forward to Glory: Beatty Secondary School Commemorative Magazine 1953 to 1991*
- *50th Anniversary: The Story of Beatty Secondary School 1953 to 2003*

The same two volumes are the likely place to find why these five admirals were chosen, which is also undocumented online. Worth a request to NLB if you want a citable answer for an assembly.

**Which Hood.** Almost certainly Rear-Admiral Sir Horace Hood, who died at Jutland in 1916 commanding the vanguard attached to Beatty's own fleet and had served under a young Captain Beatty in the Sudan two decades earlier. The alternative reading is Admiral Samuel Hood, 1st Viscount Hood, of the eighteenth century, whose defining relationship is to Nelson rather than to Beatty and who fits the other four houses badly. This is an inference, not a documented fact.

**REPORT.md is partly obsolete.** It was written before the existing houses came to light, so its naming families section proposes new names for houses that already have them. Its band capacity work, club catalogue and change management sequence are unaffected.

**Rendering fix applied.** `position:sticky` and `calc(100vh)` were removed from `audit.html` and `configurator.html`. Nested scroll containers sized to the viewport break inside preview frames and iframes: the page appears to scroll behind itself. Do not reintroduce them.

**Modelled is labelled.** Nothing modelled is presented as measured anywhere in these files. If you extend them, keep that discipline. The provenance table on `index.html` is the reference.

---

## 7. The argument, in case it needs restating

Beatty's motto is Non Vi Sed Arte, not by force but by skill. The school then named its houses after five men whose profession was force. That reads as a contradiction until you look at what each is actually remembered for.

Fisher for engineering. Jellicoe for judgement and restraint. Hood for going first. Sturdee for preparation. Harwood for reading a situation while outnumbered.

Not one of the five is remembered for force. Each is remembered for a form of skill. The house system does not need new names. It needs the existing names taken seriously, and the talent domains follow from the dispositions almost without argument.

The dossiers in `studio.html` each end with the complication rather than the hagiography, because a house named after a man is a standing invitation to ask what he actually did. Jellicoe was sacked shabbily and criticised over convoys; Beatty, as First Sea Lord, was involved in revising the official Jutland record at Jellicoe's expense, so the school is named after the man who did that to the man one of its houses is named after. Fisher had Sturdee removed from the Admiralty partly to settle a score. Harwood's heroism is actively contested by naval historians. That is not a problem to manage. It is a history curriculum the school already owns.
