// =============================================================================
// FIELD NOTES — Utilities
// =============================================================================
// The post DATA (POSTS array + BODIES map) lives in posts.data.js, which MUST
// be loaded BEFORE this file (stories.html loads posts.data.js then posts.js).
// That split keeps the data machine-editable by the CMS while these derived
// helpers stay hand-maintained. Do not edit unless you know what you're doing.
//
// To add/remove/edit a post, use /admin (Field Notes tab) or hand-edit
// posts.data.js. Entry numbers (N° 001, N° 002 …) are assigned automatically by
// date — oldest filed = lowest number — so array order doesn't matter.
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
