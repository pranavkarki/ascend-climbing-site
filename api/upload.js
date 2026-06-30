// POST /api/upload { slug, dataUrl } → commits a cover image to img/stories/.
// The admin page resizes + re-encodes to WebP in the browser before sending, so
// this just validates and commits the bytes. Returns the repo-relative path to
// store in the post's `img` field. Auth required.
const { requireAuth } = require("./_lib/auth");
const { getSha, putBase64 } = require("./_lib/github");

const ALLOWED = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png", "image/avif": "avif" };
const MAX_BYTES = 3 * 1024 * 1024; // 3 MB safety cap

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (!requireAuth(req)) return res.status(401).json({ error: "Not authenticated" });
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const slug = String(body.slug || "").trim().toLowerCase();
    const dataUrl = String(body.dataUrl || "");

    if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
      return res.status(400).json({ error: "Slug must be lowercase letters, numbers, and dashes" });
    }
    const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!m) return res.status(400).json({ error: "Invalid image data" });
    const ext = ALLOWED[m[1]];
    if (!ext) return res.status(400).json({ error: `Unsupported image type ${m[1]}` });

    const base64 = m[2];
    if (Buffer.byteLength(base64, "base64") > MAX_BYTES) {
      return res.status(413).json({ error: "Image too large (max 3 MB)" });
    }

    const path = `img/stories/${slug}.${ext}`;
    const sha = await getSha(path); // overwrite if it already exists
    await putBase64(path, base64, sha, `cms: upload cover ${path}`);
    return res.status(200).json({ ok: true, path });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
