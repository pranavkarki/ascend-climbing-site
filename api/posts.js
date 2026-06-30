// Field Notes (blog) API.
//   GET /api/posts                 → { posts, bodies }
//   PUT /api/posts { posts, bodies } → validates, serializes posts.data.js, commits.
// Auth required for both.
const { requireAuth } = require("./_lib/auth");
const { getFile, putText } = require("./_lib/github");
const { parse, validate, serialize } = require("./_lib/posts-data");

const FILE = "posts.data.js";

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (!requireAuth(req)) return res.status(401).json({ error: "Not authenticated" });

  try {
    if (req.method === "GET") {
      const { text } = await getFile(FILE);
      const model = text ? parse(text) : { posts: [], bodies: {} };
      return res.status(200).json(model);
    }

    if (req.method === "PUT") {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
      let model;
      try {
        model = validate({ posts: body.posts, bodies: body.bodies });
      } catch (e) {
        return res.status(400).json({ error: e.message });
      }
      const out = serialize(model);
      const { sha } = await getFile(FILE);
      await putText(FILE, out, sha, `cms: update field notes (${model.posts.length} posts)`);
      return res.status(200).json({ ok: true, count: model.posts.length });
    }

    res.setHeader("Allow", "GET, PUT");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
