/* =============================================================================
   Ascend CMS — admin SPA. Vanilla JS, no framework. Talks to /api/* (same
   origin). CMS_FIELDS (from cms-fields.js) drives the Site Content editor.

   Site Content is edited VISUALLY: /index.html is fetched, scripts stripped,
   and rendered into an <iframe srcdoc> (the site's X-Frame-Options: DENY /
   frame-ancestors 'none' headers don't apply to srcdoc, so no header changes
   were needed). data-cms elements become click-to-edit via contenteditable.
   The old form remains available behind the "Edit as a list" toggle.

   Publishing (all tabs) goes through a review modal (old → new per change),
   then the existing PUT endpoints, then a deploy watcher that polls the public
   file until the change is actually live (snapshot-diff + value check — no
   Vercel API needed).
   ============================================================================= */
(() => {
  "use strict";
  const root = document.getElementById("cms-root");
  const CATS = [["event", "Event"], ["story", "Story"], ["rock", "Rock Day"]];
  const DETAIL_KEYS = ["time", "date", "dates", "depart", "returns", "location",
    "capacity", "grades", "ages", "access", "lodging", "entry", "meet"];

  // ---- tiny helpers --------------------------------------------------------
  const h = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "post";
  // JSON safe to embed inside a <script> tag (a literal "</script>" in a
  // string would end the tag mid-JSON).
  const jsonForScript = (o) => JSON.stringify(o).replace(/</g, "\\u003c");

  // key → "Group · Sub · Label" for the review modal / tooltips.
  const FIELD_INFO = {};
  CMS_FIELDS.groups.forEach((g) => g.fields.forEach((f) => {
    const sub = f.sub && f.sub !== "Section" ? f.sub + " · " : "";
    FIELD_INFO[f.key] = { label: `${g.label} · ${sub}${f.label}`, group: g.label };
  }));

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

  // ---- modals ---------------------------------------------------------------
  function openModal(node, opts = {}) {
    const overlay = h(`<div class="cms-overlay"></div>`);
    const box = h(`<div class="cms-modal${opts.full ? " full" : ""}${opts.wide ? " wide" : ""}" role="dialog" aria-modal="true"></div>`);
    box.appendChild(node);
    overlay.appendChild(box);
    const close = () => { overlay.remove(); document.removeEventListener("keydown", onKey); };
    const cancel = () => { close(); opts.onCancel && opts.onCancel(); };
    const onKey = (e) => { if (e.key === "Escape") cancel(); };
    overlay.addEventListener("click", (e) => { if (e.target === overlay) cancel(); });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(overlay);
    return { close };
  }

  // Styled replacement for window.confirm(). Resolves true/false.
  function confirmModal({ title, message, confirmLabel = "Confirm", cancelLabel = "Cancel", danger = false }) {
    return new Promise((resolve) => {
      const node = h(`<div>
        <h2 class="cms-modal-title">${esc(title)}</h2>
        <p class="cms-modal-msg">${esc(message)}</p>
        <div class="cms-modal-actions">
          <button class="cms-btn ghost" data-no>${esc(cancelLabel)}</button>
          <button class="cms-btn${danger ? " danger-solid" : ""}" data-yes>${esc(confirmLabel)}</button>
        </div>
      </div>`);
      const m = openModal(node, { onCancel: () => resolve(false) });
      node.querySelector("[data-no]").addEventListener("click", () => { m.close(); resolve(false); });
      node.querySelector("[data-yes]").addEventListener("click", () => { m.close(); resolve(true); });
    });
  }

  // Review-before-publish. rows: [{ key?, label, from?, to? }]. Rows with both
  // from+to render as old → new; from-only = removed; to-only = added.
  // onRevert (optional) adds a per-row undo. Resolves true when confirmed.
  function reviewModal({ title = "Review changes", rows, note, confirmLabel = "Publish", onRevert }) {
    return new Promise((resolve) => {
      const node = h(`<div>
        <h2 class="cms-modal-title">${esc(title)}</h2>
        <div class="cms-diff" data-rows></div>
        ${note ? `<p class="cms-modal-msg">${esc(note)}</p>` : ""}
        <div class="cms-modal-actions">
          <button class="cms-btn ghost" data-no>Keep editing</button>
          <button class="cms-btn" data-yes>${esc(confirmLabel)}</button>
        </div>
      </div>`);
      const m = openModal(node, { wide: true, onCancel: () => resolve(false) });
      const wrap = node.querySelector("[data-rows]");
      rows.forEach((r) => {
        const row = h(`<div class="cms-diff-row">
          <div class="cms-diff-label">${esc(r.label)}</div>
          <div class="cms-diff-vals">
            ${r.from != null ? `<del>${esc(r.from)}</del>` : ""}
            ${r.to != null ? `<ins>${esc(r.to)}</ins>` : ""}
          </div>
          ${onRevert ? `<button class="cms-iconbtn" data-undo title="Undo this edit">↩ undo</button>` : ""}
        </div>`);
        if (onRevert) row.querySelector("[data-undo]").addEventListener("click", () => {
          onRevert(r);
          row.remove();
          if (!wrap.children.length) { m.close(); resolve(false); }
        });
        wrap.appendChild(row);
      });
      node.querySelector("[data-no]").addEventListener("click", () => { m.close(); resolve(false); });
      node.querySelector("[data-yes]").addEventListener("click", () => { m.close(); resolve(true); });
    });
  }

  // ---- unsaved-edits guard ---------------------------------------------------
  // Each view sets dirtyCheck to a fn returning whether it has unpublished
  // edits; tab switches, logout and page close all funnel through it.
  let dirtyCheck = null;
  window.addEventListener("beforeunload", (e) => {
    if (dirtyCheck && dirtyCheck()) { e.preventDefault(); e.returnValue = ""; }
  });
  async function confirmLeave() {
    if (!(dirtyCheck && dirtyCheck())) return true;
    return confirmModal({
      title: "Unpublished edits",
      message: "You have edits that haven't been published yet. Leave and lose them?",
      confirmLabel: "Discard & leave", danger: true,
    });
  }

  // ---- deploy watcher --------------------------------------------------------
  // After a publish, poll the public file until it differs from the pre-publish
  // snapshot (and passes `verify`, when given) — honest "it's actually live"
  // feedback without any Vercel API access.
  function watchDeploy(statusEl, { url, snapshot, verify }) {
    let tries = 0;
    statusEl.className = "cms-status";
    statusEl.textContent = "Published ✓ — site is rebuilding…";
    const tick = async () => {
      if (!statusEl.isConnected) return; // view re-rendered; stop polling
      tries++;
      try {
        const text = await fetch(url, { cache: "no-store" }).then((r) => r.text());
        if ((snapshot == null || text !== snapshot) && (!verify || verify(text))) {
          statusEl.className = "cms-status ok";
          statusEl.textContent = "Live on the site ✓";
          return;
        }
      } catch {}
      if (tries >= 24) { // ~6 min
        statusEl.textContent = "Taking longer than usual — the edit is committed and will appear soon.";
        return;
      }
      statusEl.textContent = `Published ✓ — site is rebuilding… (${tries * 15}s)`;
      setTimeout(tick, 15000);
    };
    setTimeout(tick, 8000);
  }

  const fetchText = (url) => fetch(url, { cache: "no-store" }).then((r) => { if (!r.ok) throw new Error(`Could not load ${url}`); return r.text(); });

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
    dirtyCheck = null;
    document.body.classList.remove("cms-fullbleed");
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
        <button class="cms-tab" data-tab="menu">Menu</button>
        <button class="cms-tab" data-tab="posts">Field Notes</button>
      </div>
      <button class="cms-iconbtn" data-logout>Log out</button>
    </div>`));
    const body = h(`<div id="cms-body"></div>`);
    root.appendChild(body);
    root.querySelectorAll(".cms-tab").forEach((b) =>
      b.addEventListener("click", () => switchTab(b.dataset.tab)));
    root.querySelector("[data-logout]").addEventListener("click", async () => {
      if (!(await confirmLeave())) return;
      await api("/api/logout", { method: "POST" }); renderLogin();
    });
    switchTab(tab, true);
  }

  async function switchTab(tab, force) {
    if (!force && !(await confirmLeave())) return;
    dirtyCheck = null;
    document.body.classList.remove("cms-fullbleed");
    root.querySelectorAll(".cms-tab").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
    const body = document.getElementById("cms-body");
    body.innerHTML = `<p style="color:#8a8a8a">Loading…</p>`;
    (tab === "posts" ? renderPosts : tab === "menu" ? renderMenu : renderContent)(body);
  }

  // =========================================================================
  // SITE CONTENT — visual click-to-edit (default) or classic list form
  // =========================================================================
  async function renderContent(body) {
    let data;
    try { data = await api("/api/content"); }
    catch (e) { body.innerHTML = `<p class="cms-status err">${esc(e.message)}</p>`; return; }
    const values = data.values || {};
    if ((localStorage.getItem("cms-content-view") || "visual") === "list") renderContentForm(body, values);
    else renderVisualEditor(body, values);
  }

  // Styles injected into the preview page. body/animate-up overrides undo the
  // pre-animation hidden states (index.html hides content until main.js runs,
  // and we strip all scripts). nav-links/menu-toggle are positioned by JS, so
  // without it they'd float in the wrong place — hide them.
  const PREVIEW_CSS = `
    body { opacity: 1 !important; }
    .scroll-section .animate-up { opacity: 1 !important; transform: none !important; }
    .nav-links, .menu-toggle { display: none !important; }
    html { scroll-behavior: smooth; }
    [data-cms] { cursor: pointer; outline: 1px dashed rgba(57,255,20,.4); outline-offset: 4px; }
    [data-cms]:hover { outline: 2px dashed #39FF14; background: rgba(57,255,20,.07); }
    [data-cms].cms-editing { cursor: text; outline: 2px solid #39FF14; background: rgba(57,255,20,.1); }
    [data-cms].cms-edited { outline: 2px solid #6b7dff; }
  `;

  // Firefox <136 lacks contenteditable="plaintext-only"; fall back to a paste
  // sanitizer so pasted rich text can't inject markup into the page.
  const PLAINTEXT_OK = (() => {
    const d = document.createElement("div");
    try { d.contentEditable = "plaintext-only"; } catch { return false; }
    return d.contentEditable === "plaintext-only";
  })();

  async function renderVisualEditor(body, values) {
    document.body.classList.add("cms-fullbleed");
    body.innerHTML = "";
    const baseline = { ...values };   // repo truth (from /api/content)
    const pending = new Map();        // key → new value, not yet published
    const elByKey = {};               // key → element inside the iframe

    body.appendChild(h(`<div class="cms-toolbar">
      <span class="cms-toolhint">Click any outlined text on the page to edit it — <b>Enter</b> keeps the edit, <b>Esc</b> cancels. Nothing goes live until you publish.</span>
      <select class="cms-jump" data-jump>
        <option value="">Jump to…</option>
        ${CMS_FIELDS.groups.map((g) => `<option value="${g.id}">${esc(g.label)}</option>`).join("")}
      </select>
      <button class="cms-iconbtn" data-listview>Edit as a list</button>
    </div>`));

    const loading = h(`<p class="cms-hint">Loading page preview…</p>`);
    const frame = h(`<iframe class="cms-preview" title="Homepage preview"></iframe>`);
    body.append(loading, frame);

    const bar = h(`<div class="cms-actions">
      <span class="cms-status" data-status></span>
      <span class="cms-pending" data-pending></span>
      <button class="cms-btn ghost" data-discard>Discard edits</button>
      <button class="cms-btn" data-review>Review &amp; publish</button>
    </div>`);
    body.appendChild(bar);
    const statusEl = bar.querySelector("[data-status]");
    const updateBar = () => {
      const n = pending.size;
      bar.querySelector("[data-pending]").textContent = n ? `${n} edit${n > 1 ? "s" : ""} pending` : "";
      bar.querySelector("[data-discard]").disabled = !n;
      bar.querySelector("[data-review]").disabled = !n;
    };
    updateBar();
    dirtyCheck = () => pending.size > 0;

    body.querySelector("[data-listview]").addEventListener("click", async () => {
      if (!(await confirmLeave())) return;
      localStorage.setItem("cms-content-view", "list");
      dirtyCheck = null;
      renderContentForm(body, baseline);
    });
    body.querySelector("[data-jump]").addEventListener("change", (e) => {
      const g = CMS_FIELDS.groups.find((x) => x.id === e.target.value);
      e.target.value = "";
      if (!g) return;
      const el = g.fields.map((f) => elByKey[f.key]).find(Boolean);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    // Build the preview document: strip scripts, anchor relative URLs, undo
    // the pre-animation hidden states, then overwrite each marked element with
    // the repo value (the live HTML can lag a deploy behind the repo).
    let doc;
    try {
      doc = new DOMParser().parseFromString(await fetchText("/index.html"), "text/html");
    } catch {
      loading.textContent = "Could not load the page preview — use “Edit as a list” instead.";
      return;
    }
    doc.querySelectorAll("script").forEach((s) => s.remove());
    const baseEl = doc.createElement("base");
    baseEl.href = location.origin + "/";
    doc.head.prepend(baseEl);
    const styleEl = doc.createElement("style");
    styleEl.textContent = PREVIEW_CSS;
    doc.head.appendChild(styleEl);
    doc.body.style.opacity = "1";
    doc.querySelectorAll("[data-cms]").forEach((el) => {
      const k = el.getAttribute("data-cms");
      if (k in baseline) el.textContent = baseline[k];
    });

    frame.addEventListener("load", () => {
      loading.remove();
      const idoc = frame.contentDocument;
      if (!idoc) return;
      // Editing surface, not a browsing one: swallow link clicks.
      idoc.addEventListener("click", (e) => { if (e.target.closest("a")) e.preventDefault(); }, true);
      idoc.querySelectorAll("[data-cms]").forEach((el) => {
        const key = el.getAttribute("data-cms");
        if (!FIELD_INFO[key]) return;
        elByKey[key] = el;
        el.title = "Click to edit — " + FIELD_INFO[key].label;
        el.addEventListener("click", () => startEdit(el, key));
      });
    });
    frame.srcdoc = "<!DOCTYPE html>" + doc.documentElement.outerHTML;

    function shownValue(key) { return pending.has(key) ? pending.get(key) : (baseline[key] != null ? baseline[key] : ""); }

    function startEdit(el, key) {
      if (el.isContentEditable) return;
      el.setAttribute("contenteditable", PLAINTEXT_OK ? "plaintext-only" : "true");
      el.classList.add("cms-editing");
      el.focus();
      const idoc = el.ownerDocument, win = idoc.defaultView;
      const range = idoc.createRange();
      range.selectNodeContents(el);
      const sel = win.getSelection();
      sel.removeAllRanges(); sel.addRange(range);

      let cancelled = false;
      const onKey = (e) => {
        if (e.key === "Enter") { e.preventDefault(); el.blur(); }
        else if (e.key === "Escape") { cancelled = true; el.blur(); }
      };
      const onPaste = PLAINTEXT_OK ? null : (e) => {
        e.preventDefault();
        idoc.execCommand("insertText", false, (e.clipboardData || win.clipboardData).getData("text/plain"));
      };
      const onBlur = () => {
        el.removeEventListener("keydown", onKey);
        if (onPaste) el.removeEventListener("paste", onPaste);
        el.removeEventListener("blur", onBlur);
        el.removeAttribute("contenteditable");
        el.classList.remove("cms-editing");
        const next = cancelled ? shownValue(key) : el.textContent.replace(/\s+/g, " ").trim();
        // Empty would blank the element on the live site — treat as cancel.
        el.textContent = next === "" ? shownValue(key) : next;
        if (el.textContent === (baseline[key] != null ? baseline[key] : "")) {
          pending.delete(key); el.classList.remove("cms-edited");
        } else {
          pending.set(key, el.textContent); el.classList.add("cms-edited");
        }
        updateBar();
      };
      el.addEventListener("keydown", onKey);
      if (onPaste) el.addEventListener("paste", onPaste);
      el.addEventListener("blur", onBlur);
    }

    const revertKey = (key) => {
      pending.delete(key);
      const el = elByKey[key];
      if (el) { el.textContent = baseline[key] != null ? baseline[key] : ""; el.classList.remove("cms-edited"); }
      updateBar();
    };

    bar.querySelector("[data-discard]").addEventListener("click", async () => {
      if (!(await confirmModal({ title: "Discard edits", message: `Throw away ${pending.size} unpublished edit(s) and restore the current site text?`, confirmLabel: "Discard", danger: true }))) return;
      [...pending.keys()].forEach(revertKey);
    });

    bar.querySelector("[data-review]").addEventListener("click", async () => {
      const rows = [...pending.entries()].map(([key, to]) => ({ key, label: FIELD_INFO[key].label, from: baseline[key], to }));
      const ok = await reviewModal({
        rows,
        note: "Publishing saves these edits to the site. They go live after a rebuild (~1–2 min) — you can watch the status below.",
        onRevert: (r) => revertKey(r.key),
      });
      if (!ok || !pending.size) return;
      const valuesOut = Object.fromEntries(pending);
      const reviewBtn = bar.querySelector("[data-review]");
      reviewBtn.disabled = true;
      statusEl.className = "cms-status"; statusEl.textContent = "Publishing…";
      let snapshot = null;
      try { snapshot = await fetchText("/index.html"); } catch {}
      try {
        await api("/api/content", { method: "PUT", body: { values: valuesOut } });
        Object.assign(baseline, valuesOut);
        pending.forEach((v, k) => elByKey[k] && elByKey[k].classList.remove("cms-edited"));
        pending.clear();
        updateBar();
        watchDeploy(statusEl, {
          url: "/index.html", snapshot,
          verify: (text) => {
            try {
              const d = new DOMParser().parseFromString(text, "text/html");
              return Object.entries(valuesOut).every(([k, v]) => {
                const el = d.querySelector(`[data-cms="${k}"]`);
                return el && el.textContent === v;
              });
            } catch { return false; }
          },
        });
      } catch (e) {
        statusEl.className = "cms-status err"; statusEl.textContent = e.message;
        updateBar();
      }
    });
  }

  // Classic grouped form — kept as a fallback (covers anything hard to click
  // in the preview, e.g. elements a media query hides at narrow widths).
  function renderContentForm(body, values) {
    document.body.classList.remove("cms-fullbleed");
    body.innerHTML = "";
    const baseline = { ...values };

    body.appendChild(h(`<div class="cms-toolbar">
      <span class="cms-toolhint">Editing every field as a list. Changed fields turn blue.</span>
      <button class="cms-iconbtn" data-pageview>Edit on the page</button>
    </div>`));

    const bar = h(`<div class="cms-actions">
      <span class="cms-status" data-status></span>
      <button class="cms-btn" data-save disabled>Review &amp; publish</button>
    </div>`);
    const saveBtn = bar.querySelector("[data-save]");
    const statusEl = bar.querySelector("[data-status]");
    const refreshSave = () => { saveBtn.disabled = body.querySelectorAll(".cms-dirty").length === 0; };
    const updateCount = (det) => {
      const n = det.querySelectorAll(".cms-dirty").length;
      det.querySelector("[data-count]").textContent = n ? `${n} changed` : "";
      refreshSave();
    };
    dirtyCheck = () => body.querySelectorAll(".cms-dirty").length > 0;

    body.querySelector("[data-pageview]").addEventListener("click", async () => {
      if (!(await confirmLeave())) return;
      localStorage.setItem("cms-content-view", "visual");
      dirtyCheck = null;
      renderVisualEditor(body, baseline);
    });

    CMS_FIELDS.groups.forEach((g, gi) => {
      const det = h(`<details class="cms-group" ${gi === 0 ? "open" : ""}>
        <summary>${esc(g.label)} <span class="cms-badge" data-count></span></summary>
        <div class="cms-group-body"></div>
      </details>`);
      const gbody = det.querySelector(".cms-group-body");

      // Cluster fields by their `sub` label (preserving order) so each
      // sub-category (Boulder vs Full Experience, each age group, …) renders
      // as its own clearly separated block, fields stacked one per line.
      const order = []; const bySub = {};
      g.fields.forEach((f) => {
        const s = f.sub || "";
        if (!(s in bySub)) { bySub[s] = []; order.push(s); }
        bySub[s].push(f);
      });

      order.forEach((s) => {
        const block = h(`<div class="cms-subblock">${s ? `<div class="cms-subhead">${esc(s)}</div>` : ""}</div>`);
        bySub[s].forEach((f) => {
          const big = f.type === "textarea";
          const field = h(`<div class="cms-field" data-key="${esc(f.key)}">
            <label>${esc(f.label)}</label>
            ${big ? `<textarea rows="3"></textarea>` : `<input type="text">`}
          </div>`);
          const input = field.querySelector(big ? "textarea" : "input");
          input.value = baseline[f.key] != null ? baseline[f.key] : "";
          input.addEventListener("input", () => {
            field.classList.toggle("cms-dirty", input.value !== (baseline[f.key] != null ? baseline[f.key] : ""));
            updateCount(det);
          });
          block.appendChild(field);
        });
        gbody.appendChild(block);
      });

      body.appendChild(det);
      updateCount(det);
    });

    body.appendChild(bar);

    saveBtn.addEventListener("click", async () => {
      const dirtyFields = [...body.querySelectorAll(".cms-dirty")];
      const rows = dirtyFields.map((f) => {
        const key = f.dataset.key;
        return { key, field: f, label: FIELD_INFO[key] ? FIELD_INFO[key].label : key, from: baseline[key], to: f.querySelector("input, textarea").value };
      });
      if (!rows.length) return;
      const ok = await reviewModal({
        rows,
        note: "Publishing saves these edits to the site. They go live after a rebuild (~1–2 min).",
        onRevert: (r) => {
          r.field.querySelector("input, textarea").value = baseline[r.key] != null ? baseline[r.key] : "";
          r.field.classList.remove("cms-dirty");
          updateCount(r.field.closest(".cms-group"));
        },
      });
      const remaining = rows.filter((r) => r.field.classList.contains("cms-dirty"));
      if (!ok || !remaining.length) return;
      const valuesOut = {};
      remaining.forEach((r) => { valuesOut[r.key] = r.field.querySelector("input, textarea").value; });
      saveBtn.disabled = true; statusEl.className = "cms-status"; statusEl.textContent = "Publishing…";
      let snapshot = null;
      try { snapshot = await fetchText("/index.html"); } catch {}
      try {
        await api("/api/content", { method: "PUT", body: { values: valuesOut } });
        Object.assign(baseline, valuesOut);
        remaining.forEach((r) => r.field.classList.remove("cms-dirty"));
        body.querySelectorAll(".cms-group").forEach(updateCount);
        watchDeploy(statusEl, {
          url: "/index.html", snapshot,
          verify: (text) => {
            try {
              const d = new DOMParser().parseFromString(text, "text/html");
              return Object.entries(valuesOut).every(([k, v]) => {
                const el = d.querySelector(`[data-cms="${k}"]`);
                return el && el.textContent === v;
              });
            } catch { return false; }
          },
        });
      } catch (e) {
        statusEl.className = "cms-status err"; statusEl.textContent = e.message; refreshSave();
      }
    });
  }

  // =========================================================================
  // MENU (cafe)
  // =========================================================================
  let MENU = [];        // [{ title, items: [{ name, price }] }]
  let ORIG_MENU = [];   // snapshot at load / last publish, for diff + dirty
  let menuDirty = false;

  const menuLines = (m) => m.flatMap((s) => s.items.map((it) => `${s.title} — ${it.name} · ${it.price || "no price"}`));

  async function renderMenu(body) {
    try {
      const d = await api("/api/menu");
      MENU = d.sections || [];
      ORIG_MENU = JSON.parse(JSON.stringify(MENU));
      menuDirty = false;
    }
    catch (e) { body.innerHTML = `<p class="cms-status err">${esc(e.message)}</p>`; return; }
    dirtyCheck = () => menuDirty;
    drawMenu(body);
  }

  function markMenuDirty(body) {
    menuDirty = true;
    const b = body.querySelector("[data-publish]");
    if (b) b.disabled = false;
  }

  function drawMenu(body) {
    body.innerHTML = "";
    body.appendChild(h(`<div class="cms-row" style="justify-content:space-between">
      <strong style="text-transform:uppercase;letter-spacing:.04em">Cafe Menu</strong>
      <button class="cms-iconbtn" data-add-sec>+ Add section</button>
    </div>`));
    body.querySelector("[data-add-sec]").addEventListener("click", () => {
      MENU.push({ title: "New Section", items: [] }); markMenuDirty(body); drawMenu(body);
    });

    MENU.forEach((sec, si) => {
      const block = h(`<div class="cms-block cms-menu-sec">
        <div class="cms-block-head">
          <input class="cms-menu-sec-title" type="text" data-sec-title>
          <button class="cms-iconbtn danger" data-del-sec>Delete section</button>
        </div>
        <div data-items></div>
        <button class="cms-iconbtn" data-add-item>+ Add item</button>
      </div>`);
      const titleInp = block.querySelector("[data-sec-title]");
      titleInp.value = sec.title;
      titleInp.addEventListener("input", () => { sec.title = titleInp.value; markMenuDirty(body); });
      block.querySelector("[data-del-sec]").addEventListener("click", async () => {
        if (!(await confirmModal({ title: "Delete section", message: `Delete the "${sec.title}" section and its ${sec.items.length} item(s)?`, confirmLabel: "Delete", danger: true }))) return;
        MENU.splice(si, 1); markMenuDirty(body); drawMenu(body);
      });

      const itemsWrap = block.querySelector("[data-items]");
      sec.items.forEach((it, ii) => itemsWrap.appendChild(menuItemRow(body, sec, it, ii)));
      block.querySelector("[data-add-item]").addEventListener("click", () => {
        sec.items.push({ name: "New item", price: "", __edit: true }); markMenuDirty(body); drawMenu(body);
      });
      body.appendChild(block);
    });

    const bar = h(`<div class="cms-actions">
      <span class="cms-status" data-status></span>
      <button class="cms-btn" data-publish ${menuDirty ? "" : "disabled"}>Review &amp; publish</button>
    </div>`);
    body.appendChild(bar);
    bar.querySelector("[data-publish]").addEventListener("click", () => publishMenu(body, bar));
  }

  function menuItemRow(body, sec, it, ii) {
    const row = h(`<div class="cms-menu-item"></div>`);
    const draw = () => {
      row.innerHTML = "";
      if (it.__edit) {
        row.classList.add("editing");
        const name = h(`<input class="mi-name" type="text" placeholder="Item name">`);
        const price = h(`<input class="mi-price" type="text" placeholder="Price">`);
        name.value = it.name; price.value = it.price;
        name.addEventListener("input", () => { it.name = name.value; markMenuDirty(body); });
        price.addEventListener("input", () => { it.price = price.value; markMenuDirty(body); });
        const done = h(`<button class="cms-iconbtn" title="Done">✓</button>`);
        const del = h(`<button class="cms-iconbtn danger" title="Remove">✕</button>`);
        done.addEventListener("click", () => { it.__edit = false; draw(); });
        del.addEventListener("click", () => { sec.items.splice(ii, 1); markMenuDirty(body); drawMenu(body); });
        row.append(name, price, done, del);
      } else {
        row.classList.remove("editing");
        const name = h(`<span class="mi-name">${esc(it.name)}</span>`);
        const price = h(`<span class="mi-price">${esc(it.price) || "<em style='opacity:.5'>no price</em>"}</span>`);
        const edit = h(`<button class="cms-iconbtn" title="Edit">✎</button>`);
        const del = h(`<button class="cms-iconbtn danger" title="Remove">✕</button>`);
        edit.addEventListener("click", () => { it.__edit = true; draw(); });
        del.addEventListener("click", async () => {
          if (!(await confirmModal({ title: "Remove item", message: `Remove "${it.name}" from the menu?`, confirmLabel: "Remove", danger: true }))) return;
          sec.items.splice(ii, 1); markMenuDirty(body); drawMenu(body);
        });
        row.append(name, price, edit, del);
      }
    };
    draw();
    return row;
  }

  async function publishMenu(body, bar) {
    const btn = bar.querySelector("[data-publish]");
    const statusEl = bar.querySelector("[data-status]");

    const before = menuLines(ORIG_MENU), after = menuLines(MENU);
    const rows = [
      ...before.filter((l) => !after.includes(l)).map((l) => ({ label: "Removed", from: l })),
      ...after.filter((l) => !before.includes(l)).map((l) => ({ label: "Added", to: l })),
    ];
    if (!rows.length) {
      statusEl.className = "cms-status"; statusEl.textContent = "Nothing changed — the menu matches the site.";
      menuDirty = false; btn.disabled = true;
      return;
    }
    if (!(await reviewModal({ title: "Review menu changes", rows, note: "Publishing saves the menu to the site. It goes live after a rebuild (~1–2 min)." }))) return;

    const sections = MENU.map((s) => ({ title: s.title, items: s.items.map((it) => ({ name: it.name, price: it.price })) }));
    btn.disabled = true; statusEl.className = "cms-status"; statusEl.textContent = "Publishing…";
    let snapshot = null;
    try { snapshot = await fetchText("/cafe.html"); } catch {}
    try {
      await api("/api/menu", { method: "PUT", body: { sections } });
      menuDirty = false;
      ORIG_MENU = JSON.parse(JSON.stringify(sections));
      watchDeploy(statusEl, { url: "/cafe.html", snapshot });
    } catch (e) {
      statusEl.className = "cms-status err"; statusEl.textContent = e.message; btn.disabled = false;
    }
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

  function renderPostsList(body, watch) {
    dirtyCheck = null;
    body.innerHTML = "";
    body.appendChild(h(`<div class="cms-row" style="justify-content:space-between">
      <strong style="text-transform:uppercase;letter-spacing:.04em">Field Notes — ${MODEL.posts.length} post(s)</strong>
      <button class="cms-btn" data-new>+ New post</button>
    </div>`));
    const statusEl = h(`<p class="cms-status" data-status></p>`);
    body.appendChild(statusEl);
    if (watch) watchDeploy(statusEl, watch);

    const list = h(`<div></div>`);
    [...MODEL.posts].sort((a, b) => b.id - a.id).forEach((p) => {
      const row = h(`<div class="cms-postrow">
        ${p.img ? `<img class="cms-postthumb" src="/${esc(p.img.replace(/^\//, ""))}" alt="" onerror="this.style.visibility='hidden'">` : `<span class="cms-postthumb empty"></span>`}
        <span class="meta">#${p.id} · ${esc(p.cat)} · ${esc(p.date)}</span>
        <span class="title">${esc(p.title)} ${p.pinned ? '<span class="pin">★</span>' : ""}</span>
        <button class="cms-iconbtn" data-edit>Edit</button>
        <button class="cms-iconbtn danger" data-del>Delete</button>
      </div>`);
      row.querySelector("[data-edit]").addEventListener("click", () => renderPostEditor(body, p.id));
      row.querySelector("[data-del]").addEventListener("click", () => deletePost(body, p));
      list.appendChild(row);
    });
    if (!MODEL.posts.length) list.appendChild(h(`<p class="cms-hint">No posts yet. Create your first one.</p>`));
    body.appendChild(list);
    body.querySelector("[data-new]").addEventListener("click", () => renderPostEditor(body, null));
  }

  async function deletePost(body, post) {
    const ok = await confirmModal({
      title: "Delete post",
      message: `Delete "${post.title}"? This removes it from the site (goes live after a rebuild).`,
      confirmLabel: "Delete post", danger: true,
    });
    if (!ok) return;
    const prev = MODEL;
    MODEL = { posts: MODEL.posts.filter((p) => p.id !== post.id), bodies: { ...MODEL.bodies } };
    delete MODEL.bodies[post.id];
    let snapshot = null;
    try { snapshot = await fetchText("/posts.data.js"); } catch {}
    try {
      await api("/api/posts", { method: "PUT", body: MODEL });
      renderPostsList(body, { url: "/posts.data.js", snapshot });
    }
    catch (e) {
      MODEL = prev;
      renderPostsList(body);
      const st = body.querySelector("[data-status]");
      st.className = "cms-status err"; st.textContent = "Delete failed: " + e.message;
    }
  }

  // DD.MM.YY ↔ <input type="date"> (yyyy-mm-dd)
  const toInputDate = (d) => {
    const m = /^(\d{2})\.(\d{2})\.(\d{2})$/.exec(d || "");
    return m ? `20${m[3]}-${m[2]}-${m[1]}` : "";
  };
  const fromInputDate = (v) => {
    const m = /^\d{2}(\d{2})-(\d{2})-(\d{2})$/.exec(v || "");
    return m ? `${m[3]}.${m[2]}.${m[1]}` : "";
  };

  function estimateRead(post, bodyData) {
    const count = (s) => String(s || "").split(/\s+/).filter(Boolean).length;
    let words = count(post.excerpt);
    if (bodyData) {
      words += count(bodyData.dek);
      (bodyData.sections || []).forEach((s) => {
        if (s.quote != null) words += count(s.quote);
        else (s.paragraphs || []).forEach((p) => { words += count(p.text); });
      });
    }
    return Math.max(1, Math.round(words / 200)) + " min";
  }

  function renderPostEditor(body, id) {
    const isNew = id == null;
    const post = isNew
      ? { id: (MODEL.posts.reduce((m, p) => Math.max(m, p.id), 0) + 1), cat: "event", date: todayDDMMYY(), title: "", excerpt: "", read: "", img: "", tag: "", pinned: false, details: {} }
      : JSON.parse(JSON.stringify(MODEL.posts.find((p) => p.id === id)));
    post.details = post.details || {};
    const hasBody = !isNew && !!MODEL.bodies[id];
    const bodyData = hasBody ? JSON.parse(JSON.stringify(MODEL.bodies[id])) : null;
    let coverDataUrl = null; // freshly uploaded cover (deploy lags ~1–2 min, so preview from memory)

    body.innerHTML = "";
    const form = h(`<div>
      <div class="cms-row" style="justify-content:space-between">
        <strong style="text-transform:uppercase;letter-spacing:.04em">${isNew ? "New post" : "Edit post #" + id}</strong>
        <button class="cms-iconbtn" data-back>← Back to list</button>
      </div>
      <div class="cms-grid2">
        <div class="cms-field"><label>Title</label><input data-f="title" type="text"></div>
        <div class="cms-field"><label>Category</label><select data-f="cat">${CATS.map(([v, l]) => `<option value="${v}">${l}</option>`).join("")}</select></div>
        <div class="cms-field"><label>Date</label><input data-f="date" type="date"></div>
        <div class="cms-field"><label>Read time</label><input data-f="read" type="text" placeholder="auto"><p class="cms-hint">Leave blank to estimate from the article length.</p></div>
        <div class="cms-field"><label>Topic label</label><input data-f="tag" type="text" placeholder="Gym // Main Wall"><p class="cms-hint">Small label shown above the title in the list.</p></div>
        <div class="cms-field cms-checkbox" style="align-self:end;margin-bottom:22px"><input id="cms-pin" type="checkbox" data-f="pinned"><label for="cms-pin">Pin to top of the list</label></div>
      </div>
      <div class="cms-field"><label>Summary</label><textarea data-f="excerpt" rows="2"></textarea><p class="cms-hint">Short teaser shown in the post list (1–2 sentences).</p></div>

      <div class="cms-field">
        <label>Cover image</label>
        <div class="cms-row">
          <img class="cms-thumb" data-thumb style="display:none" alt="Cover preview">
          <div style="flex:1">
            <input data-f="img" type="text" placeholder="img/stories/slug.webp">
            <p class="cms-hint">Pick a photo to auto-resize &amp; upload, or paste an existing path.</p>
            <input type="file" accept="image/*" data-file>
          </div>
        </div>
      </div>

      <hr class="cms-sep">
      <label>Event info box (optional)</label>
      <p class="cms-hint" style="margin-bottom:8px">Key facts shown as a list on the post — time, location, capacity…</p>
      <div data-details></div>
      <button class="cms-iconbtn" data-add-detail>+ Add a fact</button>

      <hr class="cms-sep">
      <div class="cms-checkbox" style="margin-bottom:12px"><input id="cms-hasbody" type="checkbox"><label for="cms-hasbody">Write the full article</label></div>
      <p class="cms-hint" style="margin:-6px 0 12px">Off = visitors see just the summary as a short “Brief”. On = write the full story below.</p>
      <div data-body style="display:none"></div>

      <div class="cms-actions">
        <span class="cms-status" data-status></span>
        <button class="cms-btn ghost" data-back2>Cancel</button>
        <button class="cms-btn ghost" data-preview>Preview</button>
        <button class="cms-btn" data-save>Save &amp; publish</button>
      </div>
    </div>`);

    // populate meta
    form.querySelectorAll("[data-f]").forEach((inp) => {
      const f = inp.dataset.f;
      if (f === "pinned") inp.checked = !!post.pinned;
      else if (f === "date") inp.value = toInputDate(post.date);
      else inp.value = post[f] != null ? post[f] : "";
    });
    const thumb = form.querySelector("[data-thumb]");
    if (post.img) { thumb.src = "/" + post.img.replace(/^\//, ""); thumb.style.display = ""; }

    // unsaved-edits tracking (any input anywhere in the editor)
    let editorDirty = false;
    form.addEventListener("input", () => { editorDirty = true; });
    dirtyCheck = () => editorDirty;

    // details rows
    const detailsWrap = form.querySelector("[data-details]");
    const addDetailRow = (k = "", v = "") => detailsWrap.appendChild(detailRow(k, v));
    Object.entries(post.details).forEach(([k, v]) => addDetailRow(k, v));
    form.querySelector("[data-add-detail]").addEventListener("click", () => { addDetailRow(); editorDirty = true; });

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
        coverDataUrl = dataUrl;
        thumb.src = dataUrl; thumb.style.display = "";
        status.className = "cms-status ok"; status.textContent = "Image uploaded ✓ (appears on the site after the next publish).";
      } catch (err) { status.className = "cms-status err"; status.textContent = err.message; }
    });

    const back = async () => {
      if (editorDirty && !(await confirmModal({ title: "Unsaved edits", message: "This post has edits that haven't been saved. Leave and lose them?", confirmLabel: "Discard & leave", danger: true }))) return;
      renderPostsList(body);
    };
    form.querySelector("[data-back]").addEventListener("click", back);
    form.querySelector("[data-back2]").addEventListener("click", back);

    // Inline validation: mark bad fields in place instead of a bottom-bar error.
    const validate = () => {
      form.querySelectorAll(".cms-invalid").forEach((f) => f.classList.remove("cms-invalid"));
      form.querySelectorAll(".cms-field-err").forEach((n) => n.remove());
      const problems = [];
      const need = (sel, msg) => {
        const inp = form.querySelector(sel);
        if (!inp.value.trim()) problems.push({ inp, msg });
      };
      need('[data-f="title"]', "The post needs a title.");
      need('[data-f="date"]', "Pick a date.");
      need('[data-f="excerpt"]', "Write a short summary — it's what shows in the list.");
      problems.forEach(({ inp, msg }) => {
        const field = inp.closest(".cms-field");
        field.classList.add("cms-invalid");
        field.appendChild(h(`<p class="cms-field-err">${esc(msg)}</p>`));
      });
      if (problems.length) problems[0].inp.scrollIntoView({ behavior: "smooth", block: "center" });
      return problems.length === 0;
    };

    form.querySelector("[data-preview]").addEventListener("click", () => {
      if (!validate()) return;
      const next = collectPost(form, post, hasBodyCb.checked, bodyWrap);
      previewArticle(next.post, next.body, coverDataUrl);
    });

    form.querySelector("[data-save]").addEventListener("click", async () => {
      const status = form.querySelector("[data-status]");
      if (!validate()) return;
      const next = collectPost(form, post, hasBodyCb.checked, bodyWrap);

      // merge into model
      const posts = MODEL.posts.filter((p) => p.id !== next.post.id);
      posts.push(next.post);
      const bodies = { ...MODEL.bodies };
      if (next.body) bodies[next.post.id] = next.body; else delete bodies[next.post.id];
      const candidate = { posts, bodies };

      const saveBtn = form.querySelector("[data-save]");
      saveBtn.disabled = true; status.className = "cms-status"; status.textContent = "Publishing…";
      let snapshot = null;
      try { snapshot = await fetchText("/posts.data.js"); } catch {}
      try {
        await api("/api/posts", { method: "PUT", body: candidate });
        MODEL = candidate;
        editorDirty = false;
        renderPostsList(body, { url: "/posts.data.js", snapshot });
      } catch (e) { status.className = "cms-status err"; status.textContent = e.message; saveBtn.disabled = false; }
    });

    body.appendChild(form);
  }

  // Pixel-perfect article preview: reuse stories.html itself in an iframe with
  // the draft injected in place of posts.data.js — zero duplicated rendering.
  async function previewArticle(post, bodyData, coverDataUrl) {
    let html;
    try { html = await fetchText("/stories.html"); }
    catch { return confirmModal({ title: "Preview unavailable", message: "Could not load the Field Notes page for the preview.", confirmLabel: "OK" }); }
    const draft = { ...post };
    if (coverDataUrl) draft.img = coverDataUrl; // uploaded cover isn't deployed yet
    const bodies = bodyData ? { [draft.id]: bodyData } : {};
    // The stories SPA opens #post-{id} on load; set the hash before its script
    // runs so the preview lands directly on the article view.
    const inject = `<script>const POSTS=${jsonForScript([draft])};const BODIES=${jsonForScript(bodies)};try{location.hash="#post-${draft.id}"}catch(e){}</` + `script>`;
    html = html
      .replace(/<script src="posts.data.js"><\/script>/, inject)
      .replace(/<head>/i, `<head><base href="${location.origin}/">`);

    const node = h(`<div class="cms-previewpost">
      <div class="cms-previewpost-head">
        <span>Preview — not published</span>
        <button class="cms-iconbtn" data-close>✕ Close</button>
      </div>
      <iframe class="cms-previewpost-frame" title="Article preview"></iframe>
    </div>`);
    const m = openModal(node, { full: true });
    node.querySelector("[data-close]").addEventListener("click", m.close);
    node.querySelector("iframe").srcdoc = html;
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
      <div class="cms-field"><label>Subheading</label><textarea data-bf="dek" rows="2"></textarea><p class="cms-hint">One-sentence intro shown under the title.</p></div>
      <div class="cms-grid2">
        <div class="cms-field"><label>Photo caption — bold lead</label><input data-bf="caption.lead" type="text" placeholder="THE WALL."></div>
        <div class="cms-field"><label>Photo caption — note</label><input data-bf="caption.note" type="text" placeholder="Shot on opening day."></div>
      </div>
      <label>Article blocks</label>
      <p class="cms-hint" style="margin-bottom:8px">Build the article from numbered sections and pull-quotes, in order.</p>
      <div data-sections></div>
      <div class="cms-row">
        <button class="cms-iconbtn" data-add-section>+ Section</button>
        <button class="cms-iconbtn" data-add-quote>+ Quote</button>
      </div>
      <hr class="cms-sep">
      <div class="cms-grid2">
        <div class="cms-field"><label>Sign-off — author</label><input data-bf="signoff.author" type="text"></div>
        <div class="cms-field"><label>Sign-off — role</label><input data-bf="signoff.role" type="text"></div>
        <div class="cms-field"><label>Sign-off — date</label><input data-bf="signoff.date" type="date"></div>
        <div class="cms-field"><label>Topics (comma-separated)</label><input data-bf="tags" type="text" placeholder="bouldering, community"></div>
      </div>
    </div>`);
    const set = (sel, val) => { const el = wrap.querySelector(`[data-bf="${sel}"]`); if (el) el.value = val != null ? val : ""; };
    set("dek", data.dek);
    set("caption.lead", data.caption && data.caption.lead);
    set("caption.note", data.caption && data.caption.note);
    set("signoff.author", data.signoff && data.signoff.author);
    set("signoff.role", data.signoff && data.signoff.role);
    set("signoff.date", toInputDate(data.signoff && data.signoff.date));
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
      <div class="cms-field"><label>Text (leave a blank line between paragraphs)</label><textarea data-s="paragraphs" rows="4"></textarea></div>
      <div class="cms-checkbox"><input type="checkbox" data-s="lede"><label>Start with a big drop-cap letter</label></div>
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
      <div class="cms-field"><label>Who said it</label><input data-q="cite" type="text"></div>
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
    post.date = fromInputDate(get("date").value);
    post.read = get("read").value.trim();
    post.tag = get("tag").value.trim();
    post.excerpt = get("excerpt").value.trim();
    post.img = get("img").value.trim();
    post.pinned = get("pinned").checked;
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
        signoff: { author: bf("signoff.author") || "Ascend Editorial", role: bf("signoff.role"), date: fromInputDate(bf("signoff.date")) || post.date },
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
    if (!post.read) post.read = estimateRead(post, body);
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
