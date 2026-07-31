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

A turn engine over fourteen life stages from age 15 to 55. Each turn is a situation, four or five genuinely available choices, and then a chance card.

**Paths.** A choice at 17 puts the player on one of four families, and every stage after that resolves a variant against it. The first version had ten stages that ran identically whether the player went to Junior College, polytechnic or ITE, which meant nothing chosen at seventeen changed anything seen at eighteen. That, rather than the word count, was why the mode felt hollow.

The branches are deliberately not spread evenly. Fully branched at 18, 19, 21 and 24; the situation only at 27 and 30; shared from 34. The convergence is an argument: by the mid thirties the route stops deciding what is available, and structuring the content that way states it more convincingly than prose could.

Chance cards implement planned happenstance, from Krumboltz (2009). Whether a player can use a chance is checked against five dispositions accumulated through their choices: curiosity, persistence, flexibility, optimism and risk taking. **Chances never check grades.** That substitution is the argument of the mode, expressed as a mechanic rather than as a paragraph.

A chance a player could not use is rendered as something that happened while they were not looking, with a replay hook. It is never scored as a loss. There is no failure state, no game over, and doors open to me has a floor and never decreases.

The replay comparison is the point of the mode and arguably of the app. Two runs from the same start, side by side, both fine.

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

The loader takes the oldest `accessed` date across all eleven files and raises a stale data banner past 90 days. Admission criteria change annually. A tool that quietly serves last year's thresholds to someone making a decision is worse than no tool.

The build's own verification gap is documented in `OPEN_QUESTIONS.md` and stated on screen in the footer and in the teacher layer.

## References

- Krumboltz, J. D. (2009). The Happenstance Learning Theory. *Journal of Career Assessment*, 17(2), 135 to 154.
- Gottfredson, L. S. (1981). Circumscription and compromise: a developmental theory of occupational aspirations. *Journal of Counseling Psychology*, 28(6), 545 to 579. The reason futures in Aim mode are stated as wants rather than as job titles.
