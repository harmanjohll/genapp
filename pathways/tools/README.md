# tools

Checks that need a real browser, so they live outside the app rather than in
its dev sweeps. Run from anywhere with node and playwright-core available:

    node tools/mobile-sweep.mjs 320
    node tools/mobile-sweep.mjs 390

## mobile-sweep.mjs

Walks all twenty screens and sheets at a phone width and reports, per screen:
the page scrolling sideways, any element sticking past the viewport with no
scroller to excuse it, text clipped by a fixed height, and standalone buttons
under the tap minimum.

Two exclusions, both deliberate. `.sr-only` text is clipped on purpose, that
being how screen reader only text works. A form field scrolling its own long
value is a field doing its job.

Covers: NOW and its four sheets, the JOURNEY intro, turn, staged turn, chance
card, fork, the reflect stage, the ending and compare, AIM's chooser, detail
and road sheet, the teacher page with a class picture in it, the parent page,
and the version popup.
