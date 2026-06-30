// POST /api/login  { password }  → sets session cookie on success.
const { checkPassword, createToken, setSessionCookie } = require("./_lib/auth");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  // Small fixed delay to blunt brute-forcing (functions are stateless, so we
  // can't easily rate-limit; pair this with a strong password).
  await new Promise((r) => setTimeout(r, 400));

  let password;
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    password = body.password;
  } catch {
    return res.status(400).json({ error: "Invalid request body" });
  }

  try {
    if (!checkPassword(password)) {
      return res.status(401).json({ error: "Incorrect password" });
    }
    setSessionCookie(res, createToken());
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
