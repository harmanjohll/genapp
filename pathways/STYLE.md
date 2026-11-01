# Paths house style

How Paths talks on the planning screens: setup, Home, Subjects, P6, destination pages and Saved. `engine/style-lint.js` enforces it, and `tools/verify.mjs` fails if it breaks. The game keeps its own story voice until the next round.

## Rules
1. Put the fact first, then the move. One idea per sentence, 22 words at most. Built advice may run to 32, because it lists names.
2. Speak to the student as "you". The game keeps "I".
3. No "X, not Y" turns. Plain facts are fine, for example "Social Studies at G1, not examined".
4. No closing morals and no rhetorical questions. Questions are fine when they are scripted "Ask your teacher: ..." lines, or prompts a student asks themselves on the year guide.
5. No metaphor in plain words: no doors, roads or lamps. Line mode keeps its transit words, in `ui/labels.js`.
6. Do not comment on the app. Privacy is stated once, in Settings and in the footer.
7. Banned words: honest, honestly, genuinely, quietly, worth knowing, the whole, simply, actually.
8. Use at most one hedge (usually, often, can) per sentence.
9. Use MOE terms as MOE writes them, and spell names out in full: Humanities (Social Studies, Geography), Additional Mathematics. Never shorthand such as SS/Geog.
10. No hyphens and no dashes.

## Short and Detailed
- **Short** is the default. Each page leads with the fact and the move, and the rest sits behind one tap:
  - move cards fold away "Why and when";
  - the Year guide folds its decisions and questions;
  - destination pages fold the SEC detail, scores, other routes and costs.
- **Detailed** shows everything inline. It is switched on in Settings or on the last setup step, and stored as `wordStyle`.
- When the two modes differ, write the short version first. Detailed adds facts, not more words about the same fact.

## Examples
| Before | After |
| --- | --- |
| None ever closes. Every place keeps a way in. | Every place is still possible. Some need more moves. |
| Starting higher is a choice, not an instruction | You do not have to start higher. Levels are reviewed again before Sec 3. |
| A normal load. Is there one in there I took for the look of it? | A normal load. |
| Nothing shifted, and that is normal. | No change. |
| Eased to G2, it would be a move away again. | If it drops to G2, that place needs one more move. |
| Real depth, at a steadier pace. | More depth, at a steady pace. |
| The lamps show what each level opens. | The chart shows what each level opens. |
