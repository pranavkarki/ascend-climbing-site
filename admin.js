/* =============================================================================
   Ascend CMS — admin SPA. Vanilla JS, no framework. Talks to /api/* (same
   origin). CMS_FIELDS (from cms-fields.js) drives the Site Content form.
   ============================================================================= */
(() => {
  "use strict";
  const root = document.getElementById("cms-root");
  const CATS = ["event", "story", "rock"];
  const DETAIL_KEYS = ["time", "date", "dates", "depart", "returns", "location",
    "capacity", "grades", "ages", "access", "lodging", "entry", "meet"];

  // ---- tiny helpers --------------------------------------------------------
  const h = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "post";

  async function api(path, opts = {}) {
    const res = await fetch(path, {
      method: opts.method || "GET",
      headers: opts.body ? { "Content-Type": "application/json" } : undefined,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    let data = {};
    try { data = await res.json(); } catch {}
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  }

  // ---- boot ----------------------------------------------------------------
  async function boot() {
    try {
      const { authed } = await api("/api/session");
      authed ? renderApp("content") : renderLogin();
    } catch {
      renderLogin();
    }
  }

  // ---- login ---------------------------------------------------------------
  function renderLogin(msg) {
    root.innerHTML = "";
    const view = h(`<div class="cms-login">
      <h1>Ascend Editor</h1>
      <p>Enter the password to edit the site.</p>
      <form>
        <input type="password" name="pw" placeholder="Password" autocomplete="current-password" autofocus>
        <button class="cms-btn" type="submit">Sign in</button>
        <p class="cms-status err" data-msg>${msg ? esc(msg) : ""}</p>
      </form>
    </div>`);
    view.querySelector("form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = view.querySelector("button");
      btn.disabled = true; view.querySelector("[data-msg]").textContent = "";
      try {
        await api("/api/login", { method: "POST", body: { password: e.target.pw.value } });
        renderApp("content");
      } catch (err) {
        view.querySelector("[data-msg]").textContent = err.message;
        btn.disabled = false;
      }
    });
    root.appendChild(view);
  }

  // ---- app shell -----------------------------------------------------------
  function renderApp(tab) {
    root.innerHTML = "";
    root.appendChild(h(`<div class="cms-top">
      <div class="cms-brand">Ascend <small>Site Editor</small></div>
      <div class="cms-tabs">
        <button class="cms-tab" data-tab="content">Site Content</button>
        <button class="cms-tab" data-tab="posts">Field Notes</button>
      </div>
      <button class="cms-iconbtn" data-logout>Log out</button>
    </div>`));
    const body = h(`<div id="cms-body"></div>`);
    root.appendChild(body);
    root.querySelectorAll(".cms-tab").forEach((b) =>
      b.addEventListener("click", () => switchTab(b.dataset.tab)));
    root.querySelector("[data-logout]").addEventListener("click", async () => {
      await api("/api/logout", { method: "POST" }); renderLogin();
    });
    switchTab(tab);
  }

  function switchTab(tab) {
    root.querySelectorAll(".cms-tab").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
    const body = document.getElementById("cms-body");
    body.innerHTML = `<p style="color:#8a8a8a">Loading…</p>`;
    (tab === "posts" ? renderPosts : renderContent)(body);
  }

  // =========================================================================
  // SITE CONTENT
  // =========================================================================
  async function renderContent(body) {
    let data;
    try { data = await api("/api/content"); }
    catch (e) { body.innerHTML = `<p class="cms-status err">${esc(e.message)}</p>`; return; }
    const original = data.values || {};
    body.innerHTML = "";

    // Build the action bar + helpers FIRST so they exist before any group renders
    // (the per-group updateCount() calls refreshSave()).
    const bar = h(`<div class="cms-actions">
      <span class="cms-status" data-status></span>
      <button class="cms-btn" data-save disabled>Publish changes</button>
    </div>`);
    const saveBtn = bar.querySelector("[data-save]");
    const status = bar.querySelector("[data-status]");
    const refreshSave = () => { saveBtn.disabled = body.querySelectorAll(".cms-dirty").length === 0; };
    const updateCount = (det) => {
      const n = det.querySelectorAll(".cms-dirty").length;
      det.querySelector("[data-count]").textContent = n ? `${n} changed` : "";
      refreshSave();
    };

    CMS_FIELDS.groups.forEach((g, gi) => {
      const det = h(`<details class="cms-group" ${gi === 0 ? "open" : ""}>
        <summary>${esc(g.label)} <span class="cms-badge" data-count></span></summary>
        <div class="cms-group-body cms-grid2"></div>
      </details>`);
      const grid = det.querySelector(".cms-group-body");
      g.fields.forEach((f) => {
        const val = original[f.key] != null ? original[f.key] : "";
        const big = f.type === "textarea";
        const field = h(`<div class="cms-field" data-key="${esc(f.key)}">
          <label>${esc(f.label)}</label>
          ${big
            ? `<textarea rows="3"></textarea>`
            : `<input type="text" value="${esc(val)}">`}
        </div>`);
        const input = field.querySelector(big ? "textarea" : "input");
        if (big) input.value = val;
        input.addEventListener("input", () => {
          const dirty = input.value !== val;
          field.classList.toggle("cms-dirty", dirty);
          updateCount(det);
        });
        grid.appendChild(field);
      });
      body.appendChild(det);
      updateCount(det);
    });

    body.appendChild(bar);
    body.addEventListener("input", refreshSave);

    saveBtn.addEventListener("click", async () => {
      const values = {};
      body.querySelectorAll(".cms-dirty").forEach((f) => {
        const inp = f.querySelector("input, textarea");
        values[f.dataset.key] = inp.value;
      });
      if (!Object.keys(values).length) return;
      saveBtn.disabled = true; status.className = "cms-status"; status.textContent = "Publishing…";
      try {
        await api("/api/content", { method: "PUT", body: { values } });
        status.className = "cms-status ok";
        status.textContent = "Saved — live in ~1–2 min.";
        // Re-baseline every input to its current value so fields no longer read dirty.
        refreshContentBaselines(body);
        saveBtn.disabled = true;
      } catch (e) {
        status.className = "cms-status err"; status.textContent = e.message; saveBtn.disabled = false;
      }
    });
  }

  // After a successful save, re-bind each input's baseline to its current value.
  function refreshContentBaselines(body) {
    body.querySelectorAll(".cms-field").forEach((f) => {
      const inp = f.querySelector("input, textarea");
      const base = inp.value;
      const clone = inp.cloneNode(true);
      inp.replaceWith(clone);
      clone.addEventListener("input", () => {
        f.classList.toggle("cms-dirty", clone.value !== base);
        const det = f.closest(".cms-group");
        const n = det.querySelectorAll(".cms-dirty").length;
        det.querySelector("[data-count]").textContent = n ? `${n} changed` : "";
        body.querySelector("[data-save]").disabled = body.querySelectorAll(".cms-dirty").length === 0;
      });
    });
    body.querySelectorAll(".cms-group [data-count]").forEach((c) => (c.textContent = ""));
  }

  // =========================================================================
  // FIELD NOTES
  // =========================================================================
  let MODEL = { posts: [], bodies: {} }; // working copy

  async function renderPosts(body) {
    try { MODEL = await api("/api/posts"); MODEL.posts = MODEL.posts || []; MODEL.bodies = MODEL.bodies || {}; }
    catch (e) { body.innerHTML = `<p class="cms-status err">${esc(e.message)}</p>`; return; }
    renderPostsList(body);
  }

  function renderPostsList(body) {
    body.innerHTML = "";
    body.appendChild(h(`<div class="cms-row" style="justify-content:space-between">
      <strong style="text-transform:uppercase;letter-spacing:.04em">Field Notes — ${MODEL.posts.length} post(s)</strong>
      <button class="cms-btn" data-new>+ New post</button>
    </div>`));
    const list = h(`<div></div>`);
    [...MODEL.posts].sort((a, b) => b.id - a.id).forEach((p) => {
      const row = h(`<div class="cms-postrow">
        <span class="meta">#${p.id} · ${esc(p.cat)} · ${esc(p.date)}</span>
        <span class="title">${esc(p.title)} ${p.pinned ? '<span class="pin">★</span>' : ""}</span>
        <button class="cms-iconbtn" data-edit>Edit</button>
        <button class="cms-iconbtn" data-del>Delete</button>
      </div>`);
      row.querySelector("[data-edit]").addEventListener("click", () => renderPostEditor(body, p.id));
      row.querySelector("[data-del]").addEventListener("click", () => deletePost(body, p.id));
      list.appendChild(row);
    });
    if (!MODEL.posts.length) list.appendChild(h(`<p class="cms-hint">No posts yet. Create your first one.</p>`));
    body.appendChild(list);
    body.querySelector("[data-new]").addEventListener("click", () => renderPostEditor(body, null));
  }

  async function deletePost(body, id) {
    if (!confirm("Delete this post? This publishes immediately.")) return;
    const prev = MODEL;
    MODEL = { posts: MODEL.posts.filter((p) => p.id !== id), bodies: { ...MODEL.bodies } };
    delete MODEL.bodies[id];
    try { await api("/api/posts", { method: "PUT", body: MODEL }); renderPostsList(body); }
    catch (e) { MODEL = prev; alert("Delete failed: " + e.message); }
  }

  function renderPostEditor(body, id) {
    const isNew = id == null;
    const post = isNew
      ? { id: (MODEL.posts.reduce((m, p) => Math.max(m, p.id), 0) + 1), cat: "event", date: todayDDMMYY(), title: "", excerpt: "", read: "3 min", img: "", tag: "", pinned: false, details: {} }
      : JSON.parse(JSON.stringify(MODEL.posts.find((p) => p.id === id)));
    post.details = post.details || {};
    const hasBody = !isNew && !!MODEL.bodies[id];
    const bodyData = hasBody ? JSON.parse(JSON.stringify(MODEL.bodies[id])) : null;

    body.innerHTML = "";
    const form = h(`<div>
      <div class="cms-row" style="justify-content:space-between">
        <strong style="text-transform:uppercase;letter-spacing:.04em">${isNew ? "New post" : "Edit post #" + id}</strong>
        <button class="cms-iconbtn" data-back>← Back to list</button>
      </div>
      <div class="cms-grid2">
        <div class="cms-field"><label>Title</label><input data-f="title" type="text"></div>
        <div class="cms-field"><label>Category</label><select data-f="cat">${CATS.map((c) => `<option value="${c}">${c}</option>`).join("")}</select></div>
        <div class="cms-field"><label>Date (DD.MM.YY)</label><input data-f="date" type="text" placeholder="17.07.26"></div>
        <div class="cms-field"><label>Read time</label><input data-f="read" type="text" placeholder="3 min"></div>
        <div class="cms-field"><label>Tag (meta label)</label><input data-f="tag" type="text" placeholder="Gym // Main Wall"></div>
        <div class="cms-field cms-checkbox" style="align-self:end;margin-bottom:22px"><input id="cms-pin" type="checkbox" data-f="pinned"><label for="cms-pin">Pin to top</label></div>
      </div>
      <div class="cms-field"><label>Excerpt</label><textarea data-f="excerpt" rows="2"></textarea></div>

      <div class="cms-field">
        <label>Cover image</label>
        <div class="cms-row">
          <img class="cms-thumb" data-thumb style="display:none">
          <div style="flex:1">
            <input data-f="img" type="text" placeholder="img/stories/slug.webp">
            <p class="cms-hint">Pick a photo to auto-resize &amp; upload, or paste an existing path.</p>
            <input type="file" accept="image/*" data-file>
          </div>
        </div>
      </div>

      <hr class="cms-sep">
      <label>Event details (optional)</label>
      <div data-details></div>
      <button class="cms-iconbtn" data-add-detail>+ Add detail</button>

      <hr class="cms-sep">
      <div class="cms-checkbox" style="margin-bottom:12px"><input id="cms-hasbody" type="checkbox"><label for="cms-hasbody">Full long-form article (otherwise shows a short “Brief”)</label></div>
      <div data-body style="display:none"></div>

      <div class="cms-actions">
        <span class="cms-status" data-status></span>
        <button class="cms-btn ghost" data-back2>Cancel</button>
        <button class="cms-btn" data-save>Save &amp; publish</button>
      </div>
    </div>`);

    // populate meta
    form.querySelectorAll("[data-f]").forEach((inp) => {
      const f = inp.dataset.f;
      if (f === "pinned") inp.checked = !!post.pinned;
      else inp.value = post[f] != null ? post[f] : "";
    });
    const thumb = form.querySelector("[data-thumb]");
    if (post.img) { thumb.src = "/" + post.img.replace(/^\//, ""); thumb.style.display = ""; }

    // details rows
    const detailsWrap = form.querySelector("[data-details]");
    const addDetailRow = (k = "", v = "") => detailsWrap.appendChild(detailRow(k, v));
    Object.entries(post.details).forEach(([k, v]) => addDetailRow(k, v));
    form.querySelector("[data-add-detail]").addEventListener("click", () => addDetailRow());

    // body editor
    const bodyWrap = form.querySelector("[data-body]");
    const hasBodyCb = form.querySelector("#cms-hasbody");
    const buildBody = (data) => { bodyWrap.innerHTML = ""; bodyWrap.appendChild(bodyEditor(data)); };
    hasBodyCb.checked = hasBody;
    bodyWrap.style.display = hasBody ? "" : "none";
    if (hasBody) buildBody(bodyData);
    hasBodyCb.addEventListener("change", () => {
      bodyWrap.style.display = hasBodyCb.checked ? "" : "none";
      if (hasBodyCb.checked && !bodyWrap.firstChild) buildBody(bodyData || blankBody(post));
    });

    // image upload
    form.querySelector("[data-file]").addEventListener("change", async (e) => {
      const file = e.target.files[0]; if (!file) return;
      const status = form.querySelector("[data-status]");
      const slug = slugify(form.querySelector('[data-f="title"]').value || ("post-" + post.id));
      status.className = "cms-status"; status.textContent = "Processing image…";
      try {
        const dataUrl = await resizeToWebp(file, 1200, 0.82);
        const { path } = await api("/api/upload", { method: "POST", body: { slug, dataUrl } });
        form.querySelector('[data-f="img"]').value = path;
        thumb.src = dataUrl; thumb.style.display = "";
        status.className = "cms-status ok"; status.textContent = "Image uploaded.";
      } catch (err) { status.className = "cms-status err"; status.textContent = err.message; }
    });

    const back = () => renderPostsList(body);
    form.querySelector("[data-back]").addEventListener("click", back);
    form.querySelector("[data-back2]").addEventListener("click", back);

    form.querySelector("[data-save]").addEventListener("click", async () => {
      const status = form.querySelector("[data-status]");
      let next;
      try { next = collectPost(form, post, hasBodyCb.checked, bodyWrap); }
      catch (e) { status.className = "cms-status err"; status.textContent = e.message; return; }

      // merge into model
      const posts = MODEL.posts.filter((p) => p.id !== next.post.id);
      posts.push(next.post);
      const bodies = { ...MODEL.bodies };
      if (next.body) bodies[next.post.id] = next.body; else delete bodies[next.post.id];
      const candidate = { posts, bodies };

      const saveBtn = form.querySelector("[data-save]");
      saveBtn.disabled = true; status.className = "cms-status"; status.textContent = "Publishing…";
      try {
        await api("/api/posts", { method: "PUT", body: candidate });
        MODEL = candidate;
        renderPostsList(body);
      } catch (e) { status.className = "cms-status err"; status.textContent = e.message; saveBtn.disabled = false; }
    });

    body.appendChild(form);
  }

  function detailRow(k, v) {
    const row = h(`<div class="cms-row" data-detail>
      <select style="max-width:160px">${DETAIL_KEYS.map((d) => `<option value="${d}">${d}</option>`).join("")}</select>
      <input type="text" placeholder="value" style="flex:1">
      <button class="cms-iconbtn" data-rm>✕</button>
    </div>`);
    if (k) row.querySelector("select").value = k;
    row.querySelector("input").value = v || "";
    row.querySelector("[data-rm]").addEventListener("click", () => row.remove());
    return row;
  }

  // ---- body editor ---------------------------------------------------------
  function blankBody(post) {
    return { dek: post.excerpt || "", caption: { lead: "", note: "" }, sections: [], signoff: { author: "Ascend Editorial", role: "Field Notes Desk", date: post.date }, tags: [] };
  }

  function bodyEditor(data) {
    const wrap = h(`<div>
      <div class="cms-field"><label>Dek (subheading)</label><textarea data-bf="dek" rows="2"></textarea></div>
      <div class="cms-grid2">
        <div class="cms-field"><label>Caption — lead (bold)</label><input data-bf="caption.lead" type="text"></div>
        <div class="cms-field"><label>Caption — note</label><input data-bf="caption.note" type="text"></div>
      </div>
      <label>Sections</label>
      <div data-sections></div>
      <div class="cms-row">
        <button class="cms-iconbtn" data-add-section>+ Section</button>
        <button class="cms-iconbtn" data-add-quote>+ Quote</button>
      </div>
      <hr class="cms-sep">
      <div class="cms-grid2">
        <div class="cms-field"><label>Sign-off — author</label><input data-bf="signoff.author" type="text"></div>
        <div class="cms-field"><label>Sign-off — role</label><input data-bf="signoff.role" type="text"></div>
        <div class="cms-field"><label>Sign-off — date</label><input data-bf="signoff.date" type="text" placeholder="17.07.26"></div>
        <div class="cms-field"><label>Tags (comma-separated)</label><input data-bf="tags" type="text"></div>
      </div>
    </div>`);
    const set = (sel, val) => { const el = wrap.querySelector(`[data-bf="${sel}"]`); if (el) el.value = val != null ? val : ""; };
    set("dek", data.dek);
    set("caption.lead", data.caption && data.caption.lead);
    set("caption.note", data.caption && data.caption.note);
    set("signoff.author", data.signoff && data.signoff.author);
    set("signoff.role", data.signoff && data.signoff.role);
    set("signoff.date", data.signoff && data.signoff.date);
    set("tags", (data.tags || []).join(", "));

    const secWrap = wrap.querySelector("[data-sections]");
    (data.sections || []).forEach((s) => secWrap.appendChild(s.quote != null ? quoteBlock(s) : sectionBlock(s)));
    wrap.querySelector("[data-add-section]").addEventListener("click", () => secWrap.appendChild(sectionBlock({})));
    wrap.querySelector("[data-add-quote]").addEventListener("click", () => secWrap.appendChild(quoteBlock({})));
    return wrap;
  }

  function sectionBlock(s) {
    const paras = (s.paragraphs || []).map((p) => p.text).join("\n\n");
    const lede = (s.paragraphs || [])[0] && s.paragraphs[0].lede;
    const blk = h(`<div class="cms-block" data-block="section">
      <div class="cms-block-head"><span class="cms-badge">SECTION</span><button class="cms-iconbtn" data-rm>✕</button></div>
      <div class="cms-grid2">
        <div class="cms-field"><label>Number</label><input data-s="n" type="text" placeholder="01" style="max-width:90px"></div>
        <div class="cms-field"><label>Title</label><input data-s="title" type="text"></div>
      </div>
      <div class="cms-field"><label>Paragraphs (blank line between)</label><textarea data-s="paragraphs" rows="4"></textarea></div>
      <div class="cms-checkbox"><input type="checkbox" data-s="lede"><label>Drop-cap first paragraph</label></div>
    </div>`);
    blk.querySelector('[data-s="n"]').value = s.n || "";
    blk.querySelector('[data-s="title"]').value = s.title || "";
    blk.querySelector('[data-s="paragraphs"]').value = paras;
    blk.querySelector('[data-s="lede"]').checked = !!lede;
    blk.querySelector("[data-rm]").addEventListener("click", () => blk.remove());
    return blk;
  }

  function quoteBlock(s) {
    const blk = h(`<div class="cms-block" data-block="quote">
      <div class="cms-block-head"><span class="cms-badge">QUOTE</span><button class="cms-iconbtn" data-rm>✕</button></div>
      <div class="cms-field"><label>Quote</label><textarea data-q="quote" rows="2"></textarea></div>
      <div class="cms-field"><label>Citation</label><input data-q="cite" type="text"></div>
    </div>`);
    blk.querySelector('[data-q="quote"]').value = s.quote || "";
    blk.querySelector('[data-q="cite"]').value = s.cite || "";
    blk.querySelector("[data-rm]").addEventListener("click", () => blk.remove());
    return blk;
  }

  // ---- collect form → model ------------------------------------------------
  function collectPost(form, base, withBody, bodyWrap) {
    const get = (f) => form.querySelector(`[data-f="${f}"]`);
    const post = { id: base.id };
    post.title = get("title").value.trim();
    post.cat = get("cat").value;
    post.date = get("date").value.trim();
    post.read = get("read").value.trim();
    post.tag = get("tag").value.trim();
    post.excerpt = get("excerpt").value.trim();
    post.img = get("img").value.trim();
    post.pinned = get("pinned").checked;

    if (!post.title) throw new Error("Title is required");
    if (!/^\d{2}\.\d{2}\.\d{2}$/.test(post.date)) throw new Error("Date must be DD.MM.YY (e.g. 17.07.26)");
    if (!post.excerpt) throw new Error("Excerpt is required");
    if (!post.read) post.read = "3 min";
    if (!post.tag) post.tag = "Field Note";

    const details = {};
    form.querySelectorAll("[data-detail]").forEach((r) => {
      const k = r.querySelector("select").value;
      const v = r.querySelector("input").value.trim();
      if (v) details[k] = v;
    });
    if (Object.keys(details).length) post.details = details;

    let body = null;
    if (withBody) {
      const w = bodyWrap;
      const bf = (s) => { const el = w.querySelector(`[data-bf="${s}"]`); return el ? el.value.trim() : ""; };
      body = {
        dek: bf("dek"),
        caption: { lead: bf("caption.lead"), note: bf("caption.note") },
        sections: [],
        signoff: { author: bf("signoff.author") || "Ascend Editorial", role: bf("signoff.role"), date: bf("signoff.date") || post.date },
        tags: bf("tags").split(",").map((t) => t.trim()).filter(Boolean),
      };
      w.querySelectorAll("[data-block]").forEach((blk) => {
        if (blk.dataset.block === "quote") {
          const quote = blk.querySelector('[data-q="quote"]').value.trim();
          const cite = blk.querySelector('[data-q="cite"]').value.trim();
          if (quote) body.sections.push({ quote, cite });
        } else {
          const n = blk.querySelector('[data-s="n"]').value.trim();
          const title = blk.querySelector('[data-s="title"]').value.trim();
          const lede = blk.querySelector('[data-s="lede"]').checked;
          const paras = blk.querySelector('[data-s="paragraphs"]').value.split(/\n\s*\n/).map((t) => t.trim()).filter(Boolean);
          if (!title && !paras.length) return;
          const paragraphs = paras.map((text, i) => (i === 0 && lede) ? { lede: true, text } : { text });
          body.sections.push({ n, title, paragraphs });
        }
      });
    }
    return { post, body };
  }

  // ---- image resize → WebP (client-side, no server tooling) ----------------
  function resizeToWebp(file, maxW, quality) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const w = Math.round(img.width * scale), hh = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = hh;
        canvas.getContext("2d").drawImage(img, 0, 0, w, hh);
        const out = canvas.toDataURL("image/webp", quality);
        if (!out.startsWith("data:image/webp")) return reject(new Error("Browser could not encode WebP"));
        resolve(out);
      };
      img.onerror = () => reject(new Error("Could not read that image"));
      const fr = new FileReader();
      fr.onload = () => (img.src = fr.result);
      fr.onerror = () => reject(new Error("Could not read file"));
      fr.readAsDataURL(file);
    });
  }

  function todayDDMMYY() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, "0");
    return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${p(d.getFullYear() % 100)}`;
  }

  boot();
})();
