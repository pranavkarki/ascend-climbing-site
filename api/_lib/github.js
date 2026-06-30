// GitHub Contents API helper — read/write files in the site repo from a
// serverless function, which commits to the default branch and triggers a
// Vercel redeploy. Uses global fetch (Node 18+); no external dependencies.
//
// Required env vars (set in the Vercel dashboard, never committed):
//   GITHUB_TOKEN  — fine-grained PAT scoped to THIS repo, Contents: read/write
//   GITHUB_REPO   — "owner/repo" (e.g. "pranavkarki/asend")
//   GITHUB_BRANCH — optional, defaults to "main"

const API = "https://api.github.com";

function cfg() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || "main";
  if (!token || !repo) {
    throw new Error("Server not configured: GITHUB_TOKEN and GITHUB_REPO are required.");
  }
  return { token, repo, branch };
}

function headers(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "ascend-cms",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

// Fetch a file. Returns { text, sha } for text files (utf8-decoded).
async function getFile(path) {
  const { token, repo, branch } = cfg();
  const url = `${API}/repos/${repo}/contents/${encodeURIComponent(path).replace(/%2F/g, "/")}?ref=${encodeURIComponent(branch)}`;
  const r = await fetch(url, { headers: headers(token) });
  if (r.status === 404) return { text: null, sha: null };
  if (!r.ok) throw new Error(`GitHub getFile ${path} failed: ${r.status} ${await r.text()}`);
  const j = await r.json();
  const text = Buffer.from(j.content, "base64").toString("utf8");
  return { text, sha: j.sha };
}

// Get just the sha of a file (or null if missing) — used before overwriting binary.
async function getSha(path) {
  const { token, repo, branch } = cfg();
  const url = `${API}/repos/${repo}/contents/${encodeURIComponent(path).replace(/%2F/g, "/")}?ref=${encodeURIComponent(branch)}`;
  const r = await fetch(url, { headers: headers(token) });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`GitHub getSha ${path} failed: ${r.status}`);
  const j = await r.json();
  return j.sha;
}

// Commit a text file. Pass the existing sha to update (omit/null to create).
async function putText(path, text, sha, message) {
  return putBase64(path, Buffer.from(text, "utf8").toString("base64"), sha, message);
}

// Commit raw base64 content (e.g. an uploaded image).
async function putBase64(path, base64, sha, message) {
  const { token, repo, branch } = cfg();
  const url = `${API}/repos/${repo}/contents/${encodeURIComponent(path).replace(/%2F/g, "/")}`;
  const body = { message, content: base64, branch };
  if (sha) body.sha = sha;
  const r = await fetch(url, { method: "PUT", headers: headers(token), body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`GitHub putFile ${path} failed: ${r.status} ${await r.text()}`);
  return r.json();
}

module.exports = { getFile, getSha, putText, putBase64 };
