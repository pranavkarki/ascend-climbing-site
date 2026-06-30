// Session auth for the CMS — a signed, stateless cookie (no database).
// A single shared password (env ADMIN_PASSWORD) is checked by /api/login, which
// issues an HMAC-signed token stored in an httpOnly cookie. Every protected
// endpoint calls requireAuth() to verify it.
//
// Required env vars:
//   ADMIN_PASSWORD        — the login password
//   ADMIN_SESSION_SECRET  — random secret used to sign session tokens

const crypto = require("crypto");

const COOKIE = "cms_session";
const TTL_SECONDS = 8 * 60 * 60; // 8 hours

function secret() {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s) throw new Error("Server not configured: ADMIN_SESSION_SECRET is required.");
  return s;
}

function b64url(buf) {
  return Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function sign(payloadStr) {
  return b64url(crypto.createHmac("sha256", secret()).update(payloadStr).digest());
}

// Issue a token valid for TTL_SECONDS.
function createToken() {
  const payload = b64url(JSON.stringify({ exp: Date.now() + TTL_SECONDS * 1000 }));
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return false;
  const [payload, mac] = token.split(".");
  const expected = sign(payload);
  // constant-time compare of equal-length buffers
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
    return typeof exp === "number" && Date.now() < exp;
  } catch {
    return false;
  }
}

// Constant-time password check against ADMIN_PASSWORD.
function checkPassword(input) {
  const expected = process.env.ADMIN_PASSWORD || "";
  if (!expected) throw new Error("Server not configured: ADMIN_PASSWORD is required.");
  const a = Buffer.from(String(input || ""));
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    // still spend time to avoid trivial length oracle
    crypto.timingSafeEqual(b, b);
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

function parseCookies(req) {
  const raw = req.headers.cookie || "";
  const out = {};
  raw.split(";").forEach((part) => {
    const i = part.indexOf("=");
    if (i > -1) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}

function requireAuth(req) {
  const token = parseCookies(req)[COOKIE];
  return verifyToken(token);
}

function setSessionCookie(res, token) {
  res.setHeader("Set-Cookie",
    `${COOKIE}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${TTL_SECONDS}`);
}

function clearSessionCookie(res) {
  res.setHeader("Set-Cookie",
    `${COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`);
}

module.exports = {
  createToken, verifyToken, checkPassword, requireAuth,
  setSessionCookie, clearSessionCookie,
};
