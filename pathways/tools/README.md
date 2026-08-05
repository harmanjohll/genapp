# tools

Checks that need a real browser, so they live outside the app rather than in
its dev sweeps. Node resolves modules from the script's own folder, so run it
from a directory where playwright-core is installed, with the tool given by
path:

    npm i playwright-core
    cp path/to/pathways/tools/mobile-sweep.mjs .
    node mobile-sweep.mjs 320
    node mobile-sweep.mjs 390

## mobile-sweep.mjs

Walks all twenty one screens and sheets at a phone width and reports, per screen:
the page scrolling sideways, any element sticking past the viewport with no
scroller to excuse it, text clipped by a fixed height, and standalone buttons
under the tap minimum.

Two exclusions, both deliberate. `.sr-only` text is clipped on purpose, that
being how screen reader only text works. A form field scrolling its own long
value is a field doing its job.

The seeded device is told it has already seen the shipped version, read from
`data/version.json` rather than written in. A hardcoded one goes stale on the
next release, the changelog sheet opens over the first screen, and every click
after it is swallowed, so the sweep fails on the release instead of a layout.
The version popup gets its own screen at the end, seeded older on purpose.

Covers: NOW and its four sheets, the JOURNEY intro, turn, staged turn, chance
card, fork, the reflect stage, the ending and compare, AIM's chooser, detail
and road sheet, the teacher page with a class picture in it, the parent page,
and the version popup.
