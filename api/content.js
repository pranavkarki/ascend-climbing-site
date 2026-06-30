// Site Content API.
//   GET  /api/content            → { values: { key: currentValue, ... } }
//   PUT  /api/content { values } → writes changed values into the marked HTML
//                                  elements, syncs JSON-LD priceRange, and
//                                  commits the affected file(s) to GitHub.
// Auth required for both.
const { requireAuth } = require("./_lib/auth");
const { getFile, putText } = require("./_lib/github");
const { extractValues, setValues, syncPriceRange } = require("./_lib/content-html");
const CMS = require("../cms-fields");

// key → file, and the full key list per file (from the single config source).
const KEY_FILE = {};
const FILE_KEYS = {};
CMS.groups.forEach((g) => {
  FILE_KEYS[g.file] = FILE_KEYS[g.file] || [];
  g.fields.forEach((f) => { KEY_FILE[f.key] = g.file; FILE_KEYS[g.file].push(f.key); });
});

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (!requireAuth(req)) return res.status(401).json({ error: "Not authenticated" });

  try {
    if (req.method === "GET") {
      const values = {};
      for (const file of Object.keys(FILE_KEYS)) {
        const { text } = await getFile(file);
        if (text) Object.assign(values, extractValues(text, FILE_KEYS[file]));
      }
      return res.status(200).json({ values });
    }

    if (req.method === "PUT") {
      const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
      const incoming = body.values || {};
      // Only accept known keys.
      const clean = {};
      for (const [k, v] of Object.entries(incoming)) {
        if (KEY_FILE[k] && typeof v === "string") clean[k] = v;
      }
      if (!Object.keys(clean).length) return res.status(400).json({ error: "No valid fields to save" });

      // Group changed keys by file and commit each affected file once.
      const byFile = {};
      for (const k of Object.keys(clean)) {
        (byFile[KEY_FILE[k]] = byFile[KEY_FILE[k]] || {})[k] = clean[k];
      }

      const committed = [];
      for (const [file, map] of Object.entries(byFile)) {
        const { text, sha } = await getFile(file);
        if (!text) return res.status(500).json({ error: `Could not read ${file}` });
        let { html, changed, missing } = setValues(text, map);
        if (missing.length) return res.status(400).json({ error: `Unknown markers in ${file}: ${missing.join(", ")}` });

        // Keep SEO JSON-LD priceRange in sync with the visible prices.
        if (file === "index.html") {
          const all = Object.assign(extractValues(html, FILE_KEYS[file]), {});
          html = syncPriceRange(html, all, CMS.jsonLd);
        }
        await putText(file, html, sha, `cms: update ${file} (${changed.join(", ")})`);
        committed.push({ file, changed });
      }
      return res.status(200).json({ ok: true, committed });
    }

    res.setHeader("Allow", "GET, PUT");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
