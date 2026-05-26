// =============================================================================
// FIELD NOTES — Post Data
// =============================================================================
// To add a new post:
//   1. Add an entry to POSTS below — fill in all required fields.
//   2. Optionally add a matching entry to BODIES (keyed by the same id) for a
//      full long-form article. Without a BODIES entry the post will render in
//      "Brief" mode (just the excerpt + a short note).
//
// To remove a post: delete it from POSTS (and its BODIES entry if one exists).
// Entry numbers (N° 001, N° 002 …) are assigned automatically by date — oldest
// filed = lowest number — so the order in this array doesn't matter.
// =============================================================================

// -----------------------------------------------------------------------------
// POSTS — one object per entry.
//
// Required fields:
//   id       {number}   Unique integer. Never reuse a deleted post's id.
//   cat      {string}   "event" | "story" | "rock"
//   date     {string}   "DD.MM.YY"  (e.g. "28.06.26")
//   title    {string}   Displayed in Bebas Neue on the index row.
//   excerpt  {string}   One or two sentences shown below the title on the index.
//   read     {string}   Estimated read time, e.g. "3 min".
//   img      {string}   URL or path to the cover image (used on hover + article hero).
//   tag      {string}   Short label shown in the row meta, e.g. "Gym // Main Wall".
//
// Optional fields:
//   pinned   {boolean}  Highlights the row title in green. Use sparingly.
//   details  {object}   Key/value pairs shown in the event info strip (article view
//                       and sidebar). Allowed keys: time, date, dates, depart,
//                       returns, location, capacity, grades, ages, access, lodging,
//                       entry, meet.
// -----------------------------------------------------------------------------
const POSTS = [

  // ── EVENTS ─────────────────────────────────────────────────────────────────
  {
    id: 1,
    cat: "event",
    date: "17.07.26",
    title: "Himalayan Open Vol. 2 — Bouldering Competition",
    excerpt: "20 boulders, two days, three rounds. 2000 NPR entry — registration closes 15 July.",
    read: "3 min",
    img: "img/stories/boulder-brawl.jpg",   // replace with real photo
    pinned: true,
    tag: "Gym // Main Wall",
    details: {
      dates: "17–18 July 2026",
      location: "Main Wall · Jhamsikhel",
      capacity: "30 climbers",
      entry: "2000 NPR / 1500 members",
    },
  },

  // ── STORIES ────────────────────────────────────────────────────────────────
  // {
  //   id: 2,
  //   cat: "story",
  //   date: "01.06.26",
  //   title: "How We Built The Cave",
  //   excerpt: "Three months. Two welders. The making of the 45° room, in our own words.",
  //   read: "9 min",
  //   img: "img/stories/cave-build.jpg",
  //   tag: "Field Note 001",
  // },

  // ── ROCK DAY ───────────────────────────────────────────────────────────────
  // {
  //   id: 3,
  //   cat: "rock",
  //   date: "24.05.26",
  //   title: "Nagarjun Forest — Trip Report",
  //   excerpt: "Granite eggs, six leeches, one sandbagged 6c that took the whole afternoon. Photos, beta, and the exact bus you want.",
  //   read: "6 min",
  //   img: "img/stories/nagarjun.jpg",
  //   tag: "Outdoor // Kathmandu Valley",
  //   details: {
  //     depart: "06:30 from gym",
  //     location: "Nagarjun N.F.",
  //     returns: "~18:30",
  //   },
  // },

];

// -----------------------------------------------------------------------------
// BODIES — full long-form content, keyed by post id.
//
// If a post has no entry here it renders as a "Brief" (excerpt only).
//
// Structure:
//   dek      {string}           Subheading under the article title. A sentence or two.
//   caption  {lead, note}       Hero image caption. lead = bold part, note = detail.
//   sections {array}            Mix of section blocks and quote blocks (see below).
//   signoff  {author, role, date}
//   tags     {string[]}         Chips shown at the bottom of the article.
//
// Section block:  { n: "01", title: "...", paragraphs: [{ text: "..." }, ...] }
//   First paragraph can have { lede: true, text: "..." } for a drop-cap.
//
// Quote block:    { quote: "...", cite: "..." }
// -----------------------------------------------------------------------------
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

  // 2: {
  //   dek: "Three months. Two welders. One near-disaster involving a forklift, a steel plate, and a deeply patient electrician. The making of the 45° room, in our own words.",
  //   caption: {
  //     lead: "BUILD WEEK 06",
  //     note: "Steel up, plywood pending.",
  //   },
  //   sections: [
  //     {
  //       n: "01",
  //       title: "45 or nothing",
  //       paragraphs: [
  //         {
  //           lede: true,
  //           text: "The cave was an argument before it was a wall. We knew if we built it less than 45 degrees we'd never forgive ourselves. Anything shallower and you're just on a steep wall — the body still works the way the body wants to work. Past 45, the rules change.",
  //         },
  //         {
  //           text: "Pasang drew the angle on the wall with a piece of two-by-four and a builder's level. Then he leaned against it for a full minute, eyes closed, like he was tasting it. \"Yeah,\" he said. \"That.\"",
  //         },
  //       ],
  //     },
  //     {
  //       quote: "If we build it less than 45 we'll never forgive ourselves.",
  //       cite: "— Pasang, on a Tuesday, in February",
  //     },
  //     {
  //       n: "02",
  //       title: "Two welders, ten days",
  //       paragraphs: [
  //         {
  //           text: "We had two welders and ten days before the steel arrived. Between them they cut, drilled, and re-cut the back frame three times before any plywood went up.",
  //         },
  //       ],
  //     },
  //     {
  //       n: "03",
  //       title: "First send",
  //       paragraphs: [
  //         {
  //           text: "The first hold went on at 9:14 AM. The cave is open now. It is loud, it is sweaty, and it punishes weakness. We did not build it to be polite.",
  //         },
  //       ],
  //     },
  //   ],
  //   signoff: {
  //     author: "P. Sherpa",
  //     role: "Head Setter",
  //     date: "01.06.26",
  //   },
  //   tags: ["Cave", "Construction", "Setting", "Field Note 001"],
  // },

};

// =============================================================================
// Utilities — used by stories.js (do not edit unless you know what you're doing)
// =============================================================================

// Stable entry numbering: oldest post by date = N° 001.
const ENTRY_NUM = (() => {
  const sorted = [...POSTS].sort((a, b) => {
    const parse = d => {
      const [dd, mm, yy] = d.split(".").map(Number);
      return (2000 + yy) * 10000 + mm * 100 + dd;
    };
    return parse(a.date) - parse(b.date) || a.id - b.id;
  });
  const map = {};
  sorted.forEach((p, i) => { map[p.id] = String(i + 1).padStart(3, "0"); });
  return map;
})();

// Parse "DD.MM.YY" → sortable integer.
function parsePostDate(d) {
  const [dd, mm, yy] = d.split(".").map(Number);
  return (2000 + yy) * 10000 + mm * 100 + dd;
}

const POST_FILTERS = [
  { id: "all",   label: "All",      match: () => true },
  { id: "event", label: "Events",   match: p => p.cat === "event" },
  { id: "story", label: "Stories",  match: p => p.cat === "story" },
  { id: "rock",  label: "Rock Day", match: p => p.cat === "rock" },
];

const CAT_LABEL = {
  event: "EVENT",
  story: "STORY",
  rock:  "ROCK DAY",
};

const DETAIL_LABELS = {
  time:     "Time",
  date:     "Date",
  dates:    "Dates",
  depart:   "Depart",
  returns:  "Return",
  location: "Location",
  capacity: "Spots",
  grades:   "Grades",
  ages:     "Ages",
  access:   "Access",
  lodging:  "Lodging",
  entry:    "Entry",
  meet:     "Meet",
};

// Falls back to a short "Brief" body for posts without a BODIES entry.
function bodyFor(post) {
  if (BODIES[post.id]) return BODIES[post.id];
  return {
    dek: post.excerpt,
    caption: {
      lead: "ENTRY № " + ENTRY_NUM[post.id],
      note: "Field documentation · Ascend archive.",
    },
    sections: [
      {
        n: "01",
        title: "Brief",
        paragraphs: [
          { lede: true, text: post.excerpt },
          { text: "This one's filed as a brief — short by design. The longer write-up will land in the next issue of Field Notes. If you want the full story, the people who lived it are usually in the chai room after closing." },
        ],
      },
    ],
    signoff: {
      author: "Ascend Editorial",
      role:   "Field Notes Desk",
      date:   post.date,
    },
    tags: ["Brief", CAT_LABEL[post.cat], post.tag, "Year 26"],
  };
}
