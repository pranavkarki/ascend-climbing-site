// Cafe Menu API.
//   GET /api/menu              → { sections: [{ title, items: [{ name, price }] }] }
//   PUT /api/menu { sections } → regenerates the menu region in cafe.html + commits.
// Auth required for both.
const { requireAuth } = require("./_lib/auth");
const { getFile, putText } = require("./_lib/github");
const { parseMenu, setMenu } = require("./_lib/menu-html");

const FILE = "cafe.html";

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (!requireAuth(req)) return res.status(401).json({ error: "Not authenticated" });

  try {
    if (req.method === "GET") {
      const { text } = await getFile(FILE);
      return res.status(200).json({ sections: text ? parseMenu(text) : [] });
    }

    if (req.method === "PUT") {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
      const sections = Array.isArray(body.sections) ? body.sections : null;
      if (!sections) return res.status(400).json({ error: "sections array required" });

      // Clean: trim strings, drop items with no name, require a section title.
      const clean = [];
      for (const sec of sections) {
        const title = String(sec.title || "").trim();
        if (!title) return res.status(400).json({ error: "Every section needs a title" });
        const items = (Array.isArray(sec.items) ? sec.items : [])
          .map((it) => ({ name: String(it.name || "").trim(), price: String(it.price || "").trim() }))
          .filter((it) => it.name);
        clean.push({ title, items });
      }

      const { text, sha } = await getFile(FILE);
      if (!text) return res.status(500).json({ error: "Could not read cafe.html" });
      const html = setMenu(text, clean);
      const count = clean.reduce((n, s) => n + s.items.length, 0);
      await putText(FILE, html, sha, `cms: update cafe menu (${clean.length} sections, ${count} items)`);
      return res.status(200).json({ ok: true, sections: clean.length, items: count });
    }

    res.setHeader("Allow", "GET, PUT");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
