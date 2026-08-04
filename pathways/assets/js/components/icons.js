// Inline SVG icons. No icon font, no sprite sheet, no network call, no build step.
//
// Every icon here is decorative. Each one sits beside text that already carries
// the meaning, so all of them render aria-hidden and none of them is the only
// way to read anything on screen. Strip the CSS and the app still says
// everything it needs to say.
//
// They draw in currentColor, which means contrast is inherited from the text
// they sit next to rather than being a separate thing to test and re-test. Put
// an icon somewhere the text passes AA and the icon passes too.
//
// Deliberately absent: the eight destinations. Giving Junior College a mortar
// board and ITE a spanner would encode exactly the prestige ordering the
// destination list was built to refuse, and no amount of careful drawing fixes
// that. Destinations stay typographic, equal weight, in the order the data
// gives them. The same reasoning is why the three subject levels have no icons:
// they are three hues of equal weight and a glyph would rank them.

const PATHS = {
  /* ---- the ten named doors ------------------------------------------- */

  // A way in that opens before the main one does.
  d_eae: '<path d="M9.5 2.5H13.5v11H9.5"/><path d="M2.5 8h6.4"/><path d="M6.4 5.6 8.9 8l-2.5 2.4"/>',
  // A case of work you made.
  d_portfolio: '<rect x="2.5" y="4.6" width="11" height="8.4" rx="1.5"/><path d="M6 4.6V3.6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1"/><path d="M2.5 8.4h11"/>',
  // Two people, one of them speaking for you.
  d_people: '<circle cx="6" cy="5.6" r="2.1"/><circle cx="11.7" cy="6.8" r="1.6"/><path d="M2.6 13.4c0-2.1 1.5-3.4 3.4-3.4s3.4 1.3 3.4 3.4"/><path d="M11.2 10.2c1.5 0 2.3 1 2.3 2.3"/>',
  // Two things carried at once.
  d_workstudy: '<rect x="2.4" y="4" width="4.6" height="8" rx="1.3"/><rect x="9" y="4" width="4.6" height="8" rx="1.3" fill="currentColor" stroke="none"/>',
  // A road that climbs in two steps. Paired with d_iteroad below: same family,
  // told apart by how many steps, never by which one sits higher.
  d_polyroad: '<path d="M2 12.6h3.6V9.4h3.6V6.2h3.4"/><circle cx="13.3" cy="6.2" r="1.3" fill="currentColor" stroke="none"/>',
  // The same road, one step.
  d_iteroad: '<path d="M2 12.6h4.8V8.2h4.6"/><circle cx="12.7" cy="8.2" r="1.3" fill="currentColor" stroke="none"/>',
  // More time.
  d_fifth: '<circle cx="8" cy="8" r="5.5"/><path d="M8 4.8V8.3l2.4 1.4"/>',
  // Round again, later.
  d_sflu: '<path d="M13.4 8a5.4 5.4 0 1 1-1.8-4"/><path d="M13.5 2.7v3h-3"/>',
  // Something in your hands.
  d_trade: '<path d="M11.7 2.5a3.1 3.1 0 0 0-3.9 4L2.9 11.4v1.7h1.7l4.9-4.9a3.1 3.1 0 0 0 4-3.9l-1.9 1.9-1.8-1.8z"/>',
  // A road with the horizon at the end of it.
  d_alevels: '<path d="M5.2 13.6 6.6 2.5M10.8 13.6 9.4 2.5"/><path d="M8 5.2v1.9M8 9v1.9"/>',

  /* ---- the three kinds of chance card -------------------------------- */

  // Something rises.
  ch_opportunity: '<path d="M2.6 11.6 7.4 6.7l2.4 2.4 3.6-3.9"/><path d="M13.4 8.6V5.2h-3.3"/>',
  // Two roads meet. Not an X, which reads as a mark against you.
  ch_encounter: '<path d="M2.5 3.4c3.4 0 3.4 4.6 6.4 4.6h4.6"/><path d="M2.5 12.6c3.4 0 3.4-4.6 6.4-4.6"/>',
  // The way round, still going. A setback in this app is a detour and never a
  // wall, so it gets a line that bends and continues, and never a cross.
  ch_setback: '<path d="M2.5 12.2h3.1a2 2 0 0 0 2-2V6a2 2 0 0 1 2-2h4"/><path d="M11.9 2.4 13.5 4l-1.6 1.6"/>',

  /* ---- what you are carrying ----------------------------------------- */

  t_skills: '<path d="M8 3.2 13.6 12.8H2.4z"/>',
  t_network: '<circle cx="8" cy="3.9" r="1.8"/><circle cx="3.6" cy="11.7" r="1.8"/><circle cx="12.4" cy="11.7" r="1.8"/><path d="M6.8 5.5 4.8 9.9M9.2 5.5l2 4.4M5.4 11.7h5.2"/>',
  t_portfolio: '<path d="M8 2.5 13.5 8 8 13.5 2.5 8z"/>',

  /* ---- how you tend to act ------------------------------------------- */

  curiosity: '<circle cx="6.9" cy="6.9" r="4.1"/><path d="M9.9 9.9l3.6 3.6"/>',
  persistence: '<path d="M2.6 13.4v-2.2M6.2 13.4V8.6M9.8 13.4V5.9M13.4 13.4V3.2"/>',
  flexibility: '<path d="M2.6 12.8c0-4.8 4-4.8 5.4-4.8s5.4 0 5.4-4.8"/>',
  optimism: '<path d="M2.9 11.8a5.1 5.1 0 0 1 10.2 0"/><path d="M8 2.4v1.7M3.7 4.1l1.2 1.2M12.3 4.1l-1.2 1.2"/>',
  risk: '<path d="M2.5 11.8h3.2M10.3 11.8h3.2"/><path d="M5.7 11.8C5.7 5.9 10.3 5.9 10.3 11.8"/>',

  /* ---- the three ECG questions --------------------------------------- */
  // The questions recur across two modes and five surfaces. One mark per
  // question, wherever it appears, so a student who meets "Who am I?" in
  // Journey recognises it in NOW without reading a word.

  // One person, facing you.
  q_who: '<circle cx="8" cy="5.4" r="2.4"/><path d="M3.6 13.4c0-2.6 1.9-4.2 4.4-4.2s4.4 1.6 4.4 4.2"/>',
  // A compass, needle set.
  q_where: '<circle cx="8" cy="8" r="5.5"/><path d="M10.4 5.6 9.1 9 5.6 10.4 7 7z"/>',
  // A route from a filled here to an open there.
  q_how: '<circle cx="3.2" cy="12.8" r="1.3" fill="currentColor" stroke="none"/><path d="M4.5 12.6C9.5 12 6.6 4.4 11.3 3.9"/><circle cx="12.7" cy="3.7" r="1.4"/>',

  /* ---- subject groups ------------------------------------------------- */

  g_core: '<rect x="3" y="3" width="10" height="10" rx="2.2"/><path d="M6.1 8l1.5 1.6 3-3.2"/>',
  g_humanities: '<path d="M8 4.6C6.5 3.3 4.6 3 2.6 3.4v8.3c2-.4 3.9.1 5.4 1.4 1.5-1.3 3.4-1.8 5.4-1.4V3.4C11.4 3 9.5 3.3 8 4.6z"/><path d="M8 4.6v8.5"/>',
  g_science: '<path d="M6.4 2.5v4L2.9 12.2a1 1 0 0 0 .9 1.5h8.4a1 1 0 0 0 .9-1.5L9.6 6.5v-4"/><path d="M5.7 2.5h4.6M4.8 9.6h6.4"/>',
  g_maths_extra: '<path d="M2.8 5h4.6M5.1 2.7v4.6"/><path d="M8.8 10.2h4.5M8.8 12.8h4.5"/><path d="M3.4 11.5h3.4"/>',
  g_elective: '<path d="M8 2.7v10.6M3.4 5.4l9.2 5.2M12.6 5.4 3.4 10.6"/>',
  // Three equal bars, the same mark as the app's own favicon. Everyone takes
  // these, and nothing about them is ranked.
  g_common: '<rect x="1.9" y="6.4" width="3.7" height="3.2" rx="1.6" fill="currentColor" stroke="none"/><rect x="6.2" y="6.4" width="3.7" height="3.2" rx="1.6" fill="currentColor" stroke="none"/><rect x="10.5" y="6.4" width="3.7" height="3.2" rx="1.6" fill="currentColor" stroke="none"/>',
};

/**
 * Returns an inline SVG string, or '' for an unknown name.
 *
 * Returning empty rather than throwing is deliberate: an icon is never load
 * bearing here, so a name that drifts out of sync with the data should cost a
 * glyph and nothing else. A student should never see a broken screen because a
 * door id was renamed.
 */
export function icon(name, cls = '') {
  const d = PATHS[name];
  if (!d) return '';
  return `<svg class="ic${cls ? ` ${cls}` : ''}" viewBox="0 0 16 16" aria-hidden="true" focusable="false"`
    + ` fill="none" stroke="currentColor" stroke-width="1.5"`
    + ` stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
}

export function hasIcon(name) {
  return Boolean(PATHS[name]);
}

export const ICON_NAMES = Object.keys(PATHS);
