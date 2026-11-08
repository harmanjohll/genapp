# Moved

The test version of the E21CC Log, built here beside the pilot from 3 to 8 November 2026, was folded into the E21CC Log as Version 4 on 8 November 2026. The Log is at `e21cclog/`, with its backlog (`../BACKLOG.md`), build rules (`../LOOP.md`), tests (`../tests/`) and demo (`../demo/`).

What stays here, so old links and installed copies keep working:
- `index.html`, `teacher.html` and `demo/` forward to the same pages at `e21cclog/`, keeping the query and the hash.
- `sw.js` replaces the old offline copy on any device that opened the test version: it clears the copy, removes itself, and reloads the page, which then forwards.

A log kept in the test version on a device stays where it was (`e21cclog.next` in that browser). The Log offers it once, on Home or the welcome page, and brings it across with nothing doubled. The build history is in pull requests #110 to #119.
