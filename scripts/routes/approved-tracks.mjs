// The treks whose GPS track may be drawn in the notebook (owner rule: nothing from a GPX shows until he confirms it).
//
// gen:routes reads every GPX in the inbox and prints its report either way, but it writes a route (the line, the
// stops snapped onto it, the scale bar and the strip profile) only for the ids listed here. Add an id once the owner
// has answered NB-4 for that trek: the file is his, it starts at the real trailhead (or he accepts where it starts),
// and the full line may be drawn. Distance and gain stay off the page either way (NB-7).
//
// Example: export const APPROVED_TRACKS = ['dodital'];

/** @type {readonly string[]} */
export const APPROVED_TRACKS = [];
