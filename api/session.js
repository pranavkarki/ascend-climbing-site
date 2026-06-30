// GET /api/session → { authed: boolean }. Lets the admin page decide whether to
// show the login screen or the editor on load.
const { requireAuth } = require("./_lib/auth");

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({ authed: requireAuth(req) });
};
