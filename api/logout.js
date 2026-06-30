// POST /api/logout → clears the session cookie.
const { clearSessionCookie } = require("./_lib/auth");

module.exports = async (req, res) => {
  clearSessionCookie(res);
  return res.status(200).json({ ok: true });
};
