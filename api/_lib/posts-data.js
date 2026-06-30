// Parse and regenerate posts.data.js (the machine-editable POSTS + BODIES file).
// Parsing runs the file in an isolated VM context and captures the two globals —
// reliable for arbitrary formatting. Serializing emits clean JSON-literal JS.
const vm = require("vm");

const CATS = ["event", "story", "rock"];
const DETAIL_KEYS = ["time", "date", "dates", "depart", "returns", "location",
  "capacity", "grades", "ages", "access", "lodging", "entry", "meet"];

function parse(text) {
  let captured = null;
  const ctx = vm.createContext({ __capture: (p, b) => { captured = { posts: p, bodies: b }; } });
  // Trailing call runs in the same script scope, so it can see the consts.
  vm.runInContext(text + "\n;__capture(typeof POSTS!=='undefined'?POSTS:[], typeof BODIES!=='undefined'?BODIES:{});", ctx, { timeout: 1000 });
  return captured || { posts: [], bodies: {} };
}

// Validate the incoming model; throws on hard errors. Returns cleaned model.
function validate(model) {
  const posts = Array.isArray(model.posts) ? model.posts : [];
  const bodies = model.bodies && typeof model.bodies === "object" ? model.bodies : {};
  const ids = new Set();
  posts.forEach((p, i) => {
    const where = `Post #${i + 1}`;
    ["id", "cat", "date", "title", "excerpt", "read", "tag"].forEach((f) => {
      if (p[f] === undefined || p[f] === null || p[f] === "") throw new Error(`${where}: "${f}" is required`);
    });
    if (typeof p.id !== "number" || !Number.isInteger(p.id)) throw new Error(`${where}: id must be an integer`);
    if (ids.has(p.id)) throw new Error(`Duplicate post id ${p.id}`);
    ids.add(p.id);
    if (!CATS.includes(p.cat)) throw new Error(`${where}: cat must be one of ${CATS.join(", ")}`);
    if (!/^\d{2}\.\d{2}\.\d{2}$/.test(p.date)) throw new Error(`${where}: date must be DD.MM.YY`);
    if (p.details) {
      for (const k of Object.keys(p.details)) {
        if (!DETAIL_KEYS.includes(k)) throw new Error(`${where}: invalid detail key "${k}"`);
      }
    }
  });
  return { posts, bodies };
}

// Build one post object literal in declaration order, omitting empty optionals.
function serializePost(p) {
  const o = { id: p.id, cat: p.cat, date: p.date, title: p.title, excerpt: p.excerpt, read: p.read, img: p.img || "" };
  if (p.pinned) o.pinned = true;
  o.tag = p.tag;
  if (p.details && Object.keys(p.details).length) o.details = p.details;
  return o;
}

function serialize(model) {
  const { posts, bodies } = model;
  const cleanPosts = posts.map(serializePost);
  // Only keep bodies whose post still exists.
  const ids = new Set(posts.map((p) => p.id));
  const cleanBodies = {};
  Object.keys(bodies || {}).forEach((k) => { if (ids.has(Number(k))) cleanBodies[k] = bodies[k]; });

  const header = `// =============================================================================
// FIELD NOTES — Post Data  (MACHINE-EDITABLE)
// =============================================================================
// Rewritten in full by the CMS (/admin → Field Notes). Keep it to plain
// \`const POSTS = [...]\` / \`const BODIES = {...}\` literals. The utilities and
// docs live in posts.js, which loads AFTER this file.
// =============================================================================
`;
  return `${header}
const POSTS = ${JSON.stringify(cleanPosts, null, 2)};

const BODIES = ${JSON.stringify(cleanBodies, null, 2)};
`;
}

module.exports = { parse, validate, serialize, CATS, DETAIL_KEYS };
