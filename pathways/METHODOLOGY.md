# Methodology

What this app models, how, and what it refuses to do.

## The problem it is answering

Under Full Subject Based Banding a Singaporean student now assembles a combination of subjects at G1, G2 and G3 rather than being placed in a stream. That is more freedom and considerably more complexity, arriving at fourteen, mediated by adults who mostly went through a different system, and landing on the first cohort to sit the SEC in 2027.

The obvious tool to build is a checker: enter your subjects, find out which post secondary pathways you qualify for. That tool is easy to build, easy to explain, and teaches the wrong thing. It presents a fourteen year old's provisional subject plan as a set of locks, and it presents the pathways as a hierarchy with one at the top.

This app models the same system and inverts the framing.

## What is modelled

### Reach, not eligibility

For a given plan and destination, `reach()` returns one of four states.

| State | Meaning |
| --- | --- |
| `open` | Every structural requirement is currently met |
| `within-reach` | Total distance of 2 or fewer moves |
| `longer-route` | Total distance of 5 or fewer moves |
| `other-route` | Further than that, and reachable another way |

There is no fifth state. `locked` is not in the data model and cannot be returned.

Distance is the number of discrete moves that would satisfy the unmet rules, measured in level steps from where the student actually is, with "not taking it" counted as step zero. It is always finite, which is another way of saying no requirement is modelled as unreachable.

**Distance is never shown to a student.** It orders nothing on screen and is not encoded as position, length or colour. It exists to pick the state, to rank the lever, and to be asserted against in the monotonicity sweep.

### Structural rules versus performance rules

This is the central distinction and it is what keeps the tool honest.

**Structural rules** are evaluated. They depend only on which subjects a student takes and at what level, which are things a student controls now and can change at the next subject review. Example: English at G3, at least five subjects at G3.

**Performance rules are never evaluated by anything.** Aggregates like L1R4, ELR2B2 and ELMAB3 depend on examination grades. This app does not have them, does not ask for them, and does not predict them. They are displayed as information about what a destination asks for at the end, with an explicit note on the card that no one is being measured against them.

The alternative design, asking for predicted grades, would produce a more precise tool. It would also hand a fourteen year old a number that looks like a forecast of their life, generated from a guess, and there is a reasonable amount of evidence that deterministic feedback of that kind produces foreclosure rather than motivation. The precision is not worth it.

### The monotonicity invariant

Adding a subject, or raising one a level, must never increase the distance to any destination.

The first version of this engine violated it. `subjectAtLevel` charged one move for a subject the student was not taking, and two for the same subject held at G1 when G3 was needed. A student on a mostly G1 plan therefore entered an honest picture of themselves and watched three destinations get further away. Nothing in the interface said so, because distance was not displayed, but the state buckets shifted and every downstream feature inherited the artifact.

The fix was to measure from where the student is rather than from an idealised empty plan. `monotonicityFailures()` now sweeps every subject at every level it is offered at, from an empty plan and several seeded ones, and fails the build if any addition or raise increases any distance.

This is the invariant that makes the app's central promise a property of arithmetic rather than a claim in body copy.

### The no dead end invariant

Enforced in code, not in copy.

`runInvariantSweep()` generates 93 plan states: the empty plan, every single subject alone at every level it is offered at, uniform plans of increasing size at each level, 24 mixed plans designed to break naive rule logic, everything at once, and a single subject at the lowest level. It evaluates all eight destinations against each, 744 checks, and asserts that none produced an unknown state, a locked state, a state that is not open with no onward route, or a state that is not open with nothing a student could do about it.

It runs under `?dev=1` and fails loudly in the console. The point is that a bad data edit breaks the build's own test rather than quietly producing a padlock.

Where a destination's authors did not supply a specific onward route, the engine substitutes universal ones: work study programmes and a later part time degree. These are not filler. They are genuinely available to essentially anyone at essentially any age, which is the fact the whole app is trying to convey.

### Journey mode

A turn engine over thirteen life stages from age 15 to 48. It went through three versions, and the third is the first one that is a game rather than a slideshow.

The second version was measured before the rebuild: a full run was 29 taps and 14 of them were the single word "Keep going"; a 4,000 run Monte Carlo showed the ending was 100 percent predictable from which button column the player favoured; and the disposition bars, the mode's only feedback, had rendered at zero width since the mode shipped. Those numbers, not taste, drove the redesign.

**The want.** Before turn one the player answers "What do you want by twenty five?", with "Not sure yet" as a first class pick. The ending opens by answering it. This gives a run a spine without giving it a score.

**Attention, not resources.** Two points per turn; every choice costs 1 or 2 and shows what it grows. Nothing is subtracted from any stat and the budget resets each turn. The design rejects resource management, where a fifteen year old could go bankrupt, in favour of the one scarcity that is actually true at fifteen: you cannot do everything this year. The cost of a choice is only ever the thing you did not do.

**Chance cards as decisions.** Planned happenstance, from Krumboltz (2009), now interactive. Each card states what it asks for against five dispositions accumulated through choices, curiosity, persistence, flexibility, optimism, risk taking, and offers two or three authored responses. **Chances never check grades.** A response whose ask is unmet stays fully tappable and routes to a stretch outcome: doing it anyway without the footing goes roughly and builds that very disposition. Nothing is locked, a near miss is visible and motivating, and effort in the direction of a disposition is always rewarded, which is the mode's model of growth.

**Named doors.** Doors used to be an integer with a floor. An integer is a score, and a floor is a promise defended in code review. Doors are now a Set of real named things, Early Admissions, a portfolio, the poly to uni road, that only ever adds and renders as chips. The invariant became structural, and the display became unreadable as a ranking across a classroom desk.

**Memory.** Choices set flags, ten callback cards name what the player did stages ago, and late stage outcomes vary with the route taken, so the merged years still remember the player's particular life.

**Paths and shape.** A fork at 17 sets one of four families and every stage after resolves a variant against it; forks at 27 and 43 render full bleed with the age huge; 38 is a quiet reflection turn whose answer is never scored and reappears verbatim on the compare screen, since the serious games literature is consistent that in play reflection is where the learning happens. Branches are deliberately uneven: fully branched through the twenties, shared from 34. The convergence is the argument: by the mid thirties the route stops deciding what is available.

The replay comparison is the point of the mode and arguably of the app. Two runs from the same start, side by side, both fine, with different wants and different doors.

### The subject list is the 2027 SEC, and it says where it is unsure

The subject data was verified against the SEAB syllabus list and MOE subject pages as far as the build's network policy allowed. The big structural facts are modelled exactly: one Combined Humanities pair, Social Studies with Geography, History or Literature in English, is part of every G2 and G3 package and Social Studies never stands alone; sciences at G2 come only as named pairs while pure sciences are G3 only; pure Humanities subjects are additive beside the pair, with the anti duplication rule rendered as a caution and never a lock.

Two honesty devices sit on top. Anything not read from a primary page carries a `provisional` badge. And because no national list can know a particular school's offer, subjects that only some schools run carry a "selected schools" tag, and a single line under the list says that schools offer different subsets and the school's own list is the real one, with MOE SchoolFinder linked behind it. The alternative, presenting the national list as if every student could pick from all of it, would set up a small disappointment at exactly the wrong moment.

### The Long View ribbon

Ages 12 to 65, persistent across every mode. Secondary school occupies roughly seven percent of it. Everything after formal education is populated with real, named, sourced programmes.

The proportion is doing the work. It is the cheapest anti determinism device in the build and probably the most effective.

## What is refused

- **No score prediction.** Stated above, and load bearing.
- **No eligibility ruling.** The app describes reach and names moves. It does not adjudicate anyone's future.
- **No personality verdict.** No quiz that returns a type and points it at a pathway. Interest inventories have their place and a type that arrives at fourteen and sticks is not it.
- **No ranking of pathways.** JC, polytechnic, PFP, ITE and the arts institutions are presented beside each other, in a fixed alphabetical order that never changes as a student taps. Alphabetical is chosen precisely because it is visibly arbitrary: any order derived from the student's plan would be read as a ranking.
- **No red, no padlocks, no greyed out cards, no opacity 0.38, no disabled controls.**
- **No distance on screen.** Not as a number, a bar, a dot on a track, or a sort order. A continuous measure of how far a child is from something is a ranking whatever it is called.
- **No data collection.** No account, no server, no analytics, no cookies. State is in `localStorage` on the student's own device.

## Sources and freshness

Every data file declares `_meta` with `source`, `url`, `accessed`, `units` and `notes`, following the convention set by `ecdm/`. Individual rules additionally carry `status`, one of `confirmed`, `provisional` or `not_yet_published`, and anything provisional renders a badge next to itself on screen.

The loader takes the oldest `accessed` date across all twelve files and raises a stale data banner past 90 days. Admission criteria change annually. A tool that quietly serves last year's thresholds to someone making a decision is worse than no tool.

The build's own verification gap is documented in `OPEN_QUESTIONS.md` and stated on screen in the footer and in the teacher layer.

## References

- Krumboltz, J. D. (2009). The Happenstance Learning Theory. *Journal of Career Assessment*, 17(2), 135 to 154.
- Gottfredson, L. S. (1981). Circumscription and compromise: a developmental theory of occupational aspirations. *Journal of Counseling Psychology*, 28(6), 545 to 579. The reason futures in Aim mode are stated as wants rather than as job titles.
