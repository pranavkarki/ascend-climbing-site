// Read/write the inner TEXT of data-cms-marked elements without touching any
// surrounding markup. Phase-1 editable elements all have plain-text inner
// content (no nested tags), so an anchored regex is safe and reliable — no DOM
// parser needed. Values are HTML-escaped on write and unescaped on read so the
// owner edits/sees real characters (e.g. & not &amp;).

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function unescapeHtml(s) {
  return String(s)
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Matches: (opening tag remainder up to '>')(inner text)(closing '<')
function markerRegex(key) {
  return new RegExp(`(data-cms="${escapeRegex(key)}"[^>]*>)([^<]*)(<)`);
}

// Extract current value (unescaped) for one key, or null if not found.
function extractValue(html, key) {
  const m = html.match(markerRegex(key));
  return m ? unescapeHtml(m[2]) : null;
}

function extractValues(html, keys) {
  const out = {};
  keys.forEach((k) => {
    const v = extractValue(html, k);
    if (v !== null) out[k] = v;
  });
  return out;
}

// Replace inner text for the given { key: value } map. Returns { html, changed:[keys], missing:[keys] }.
function setValues(html, map) {
  const changed = [];
  const missing = [];
  for (const [key, value] of Object.entries(map)) {
    const re = markerRegex(key);
    if (!re.test(html)) { missing.push(key); continue; }
    html = html.replace(re, (_m, open, _inner, close) => `${open}${escapeHtml(value)}${close}`);
    changed.push(key);
  }
  return { html, changed, missing };
}

// Parse the leading integer out of a price string ("NPR 9,000" → 9000).
function priceNumber(v) {
  const digits = String(v).replace(/[^\d]/g, "");
  return digits ? parseInt(digits, 10) : null;
}

// Recompute the JSON-LD SportsActivityLocation priceRange from current values.
function syncPriceRange(html, valuesByKey, jsonLdCfg) {
  const nums = (jsonLdCfg.priceRangeFrom || [])
    .map((k) => priceNumber(valuesByKey[k]))
    .filter((n) => n !== null);
  if (!nums.length) return html;
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const range = `${jsonLdCfg.priceCurrency} ${min}–${max}`; // en dash, matches existing
  return html.replace(/("priceRange"\s*:\s*")[^"]*(")/, `$1${range}$2`);
}

module.exports = { escapeHtml, unescapeHtml, extractValue, extractValues, setValues, syncPriceRange, priceNumber };
