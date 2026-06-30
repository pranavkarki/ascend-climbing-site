// =============================================================================
// FIELD NOTES — Post Data  (MACHINE-EDITABLE)
// =============================================================================
// This file holds ONLY the data: the POSTS array and the BODIES map.
// It is rewritten in full by the CMS (/admin → Field Notes tab via /api/posts).
// Keep it to plain `const POSTS = [...]` / `const BODIES = {...}` literals so it
// can be serialized safely — the utilities and docs live in posts.js.
//
// You can still hand-edit it; just keep the two declarations intact.
//
// POSTS — one object per entry.
//   Required: id (number, unique), cat ("event"|"story"|"rock"),
//             date ("DD.MM.YY"), title, excerpt, read (e.g. "3 min"),
//             img (path), tag (short meta label).
//   Optional: pinned (boolean), details (object; allowed keys: time, date,
//             dates, depart, returns, location, capacity, grades, ages,
//             access, lodging, entry, meet).
//
// BODIES — full long-form content keyed by post id. A post with no entry here
//   renders as a "Brief" (excerpt only). Structure:
//     dek {string}, caption {lead, note}, sections {array}, signoff
//     {author, role, date}, tags {string[]}.
//   Section block: { n:"01", title, paragraphs:[{ text }, ...] } — first
//   paragraph may carry { lede:true } for a drop-cap.
//   Quote block:   { quote, cite }
// =============================================================================

const POSTS = [

  // ── EVENTS ─────────────────────────────────────────────────────────────────
  {
    id: 1,
    cat: "event",
    date: "17.07.26",
    title: "Himalayan Open Vol. 2 — Bouldering Competition",
    excerpt: "20 boulders, two days, three rounds. 2000 NPR entry — registration closes 15 July.",
    read: "3 min",
    img: "img/stories/boulder-brawl.avif",
    pinned: true,
    tag: "Gym // Main Wall",
    details: {
      dates: "17–18 July 2026",
      location: "Main Wall · Jhamsikhel",
      capacity: "30 climbers",
      entry: "2000 NPR / 1500 members",
    },
  },

];

const BODIES = {

  1: {
    dek: "26 routes. Three rounds. Two days to find out who's on the wall when it counts.",
    caption: {
      lead: "HIMALAYAN OPEN VOL. 2",
      note: "17–18 July 2026 · Main Wall · Jhamsikhel",
    },
    sections: [
      {
        n: "01",
        title: "Registration",
        paragraphs: [
          { lede: true, text: "2000 NPR to enter. Members pay 1500. Registration closes 15 July — two days out. Show up unregistered on the day and there's a surcharge." },
          { text: "Two scorecards: one for qualifying, a separate one for the rounds on Day 2." },
        ],
      },
      {
        n: "02",
        title: "Qualifying — 17 July",
        paragraphs: [
          { text: "Open system. 20 routes, 10:00 to 20:00. Any order, as many attempts as you need." },
          { text: "Results at 21:00. Top 30 move through — 15 men, 15 women." },
        ],
      },
      {
        n: "03",
        title: "Day 2 — 18 July",
        paragraphs: [
          { text: "Semi-finals: isolation and registration close at 13:00. Thirty climbers on four routes simultaneously from 14:00 — five minutes per route, roughly 1h15 of climbing. Break at ~15:15." },
          { text: "Finals: isolation closes 17:00. Twenty climbers — ten men, ten women — on two routes from 18:00. Two at a time, five-minute format. Results 20:00–20:30." },
        ],
      },
    ],
    signoff: { author: "Ascend Editorial", role: "Event Team", date: "17.07.26" },
    tags: ["Event", "Competition", "Bouldering", "Main Wall", "Year 26"],
  },

};
