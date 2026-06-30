// Parse and regenerate the cafe menu region inside cafe.html. The menu stays
// STATIC HTML in the page (good for SEO / no flash); the CMS Menu tab edits a
// structured model and this regenerates the marked region on save. The region
// is bounded by <!-- cms:menu:start --> / <!-- cms:menu:end --> comments.
const { escapeHtml, unescapeHtml } = require("./content-html");

const REGION = /<!-- cms:menu:start -->([\s\S]*?)<!-- cms:menu:end -->/;
const SECTION_SPLIT = /<div class="menu-section">/;
const H2 = /<h2>([\s\S]*?)<\/h2>/;
const ROW = /<div class="menu-row">\s*<span>([\s\S]*?)<\/span>\s*<span[^>]*>([\s\S]*?)<\/span>\s*<\/div>/g;

// cafe.html → [{ title, items: [{ name, price }] }]
function parseMenu(html) {
  const m = html.match(REGION);
  if (!m) return [];
  const region = m[1];
  const sections = [];
  region.split(SECTION_SPLIT).slice(1).forEach((chunk) => {
    const t = chunk.match(H2);
    if (!t) return;
    const items = [];
    let r;
    ROW.lastIndex = 0;
    while ((r = ROW.exec(chunk)) !== null) {
      items.push({ name: unescapeHtml(r[1].trim()), price: unescapeHtml(r[2].trim()) });
    }
    sections.push({ title: unescapeHtml(t[1].trim()), items });
  });
  return sections;
}

// Render the menu markup (matches cafe.html's existing indentation).
function renderMenu(sections) {
  return sections.map((sec) => {
    const rows = (sec.items || [])
      .map((it) => `                        <div class="menu-row"><span>${escapeHtml(it.name)}</span> <span>${escapeHtml(it.price)}</span></div>`)
      .join("\n");
    return `                    <div class="menu-section">\n                        <h2>${escapeHtml(sec.title)}</h2>\n${rows}\n                    </div>`;
  }).join("\n\n");
}

// Splice a regenerated menu back into cafe.html between the markers.
function setMenu(html, sections) {
  if (!REGION.test(html)) throw new Error("Menu markers not found in cafe.html");
  const block = renderMenu(sections);
  return html.replace(REGION, `<!-- cms:menu:start -->\n${block}\n                    <!-- cms:menu:end -->`);
}

module.exports = { parseMenu, renderMenu, setMenu };
