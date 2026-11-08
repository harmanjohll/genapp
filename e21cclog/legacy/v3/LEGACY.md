This is Version 3 of the E21CC Log, the pilot from 29 October to 8 November 2026, kept read only to compare with. The Log lives at `e21cclog/` (Version 4), and reads the same log on each device.

Edits made when it was frozen, and nothing else:
- `assets/store.js`: the one time fresh start is left out, so this copy can never clear the live Log.
- `index.html`: loads `../bridge.js` after `store.js`. The bridge adds the banner, stops every save, keeps the writing pages closed, and registers no offline copy (Version 3's would clear the live Log's).
- `teacher.html`: forwards to the live console. Version 3's console cannot read the live console's sealed store, and must never write over it. Its code is in git, at commit `1fd86ec`.
- No `sw.js`, `tests/` or `relay/`: the live Log has them.
