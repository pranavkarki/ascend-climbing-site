# Ascend Climbing — Project Context

Static marketing site for **Ascend Climbing**, a bouldering/climbing gym in Jhamsikhel, Lalitpur, Nepal (owner: ASCE Pvt. Ltd.). Pure HTML + CSS + JS — **no build system, no npm, no bundler**. Deployed on Vercel (`vercel.json` → `cleanUrls: true`). Live at **thesouthwall.com** (GoDaddy domain, DNS → Vercel).

This file is a **map**. The detailed "why" behind tricky animation/layout decisions lives in inline comments next to the code — read those before changing tuned values.

---

## Files

| File | Purpose |
|------|---------|
| `index.html` | Main page: Landing → Pricing → Activities (Kids/Adult courses, Rock Day) → Features (Cafe/Training Room) → Testimonials → FAQ → About → Footer |
| `cafe.html` | Standalone cafe menu page |
| `stories.html` | Field Notes page: blog/events/rock-day listing + inline article view. All JS is inline. Loads `posts.js` then renders everything via vanilla JS. |
| `stories.css` | All styles for the Field Notes page. Scoped to `.fn-*` to avoid collision with `styles.css`. `.fn-view` is the grid container (260px sidebar + 1fr main). |
| `posts.js` | Post data array (`POSTS`), full article bodies (`BODIES`), and utilities (`ENTRY_NUM`, `POST_FILTERS`, `CAT_LABEL`, `DETAIL_LABELS`, `parsePostDate`, `bodyFor`). Edit here to add/update posts. |
| `styles.css` | All styles (single file) |
| `main.js` | All JS (single file), runs on `DOMContentLoaded` |
| `img/square/` | 9 photos (currently unused) |
| `img/optimized/` | `wall.jpg` (hero bg), `cafe.avif` (pre-cropped to 4:3 1440×1080 to match its `.feature-img-wrap` box — don't replace with a portrait source or `object-fit: cover` will crop + waste bytes), `rock-day.avif` (Rock Day section), `training-room.avif` |
| `img/stories/` | Cover images for Field Notes posts (`[slug].avif`, AVIF). Referenced by the `img` field in `posts.js`. Each cover serves **two fixed boxes** via `object-fit: cover`: the article hero `.fn-hero-img` (full-width × **440px**, force-grayscaled in CSS) and the list hover thumb `.fn-thumb` (**112×112** square). A landscape source ~1200–1600px wide crops best to both; tall portraits get center-cropped to a band (face/upper-body survives, top+bottom lost — and the cropped-off pixels waste filesize, same caveat as `cafe.avif`). Don't bake grayscale into the file (CSS does it). Encode recipe: `sips --resampleWidth 1200 src.jpg --out /tmp/x.jpg && avifenc -q 32 -s 0 /tmp/x.jpg img/stories/[slug].avif` → ~140KB. |
| `img/site-favicon.svg` | Favicon (white circle + dark star) |
| `fonts/Gandur New-Light.otf` | Local brand display font |
| `ref/` | Course images, logo, reference screenshots |

---

## Stack (CDN, load order matters)

`Lenis 1.1.14` (smooth scroll, `lerp: 0.1`) → `GSAP 3.12.5` + `ScrollTrigger` → `SplitType 0.3.4` (char splitting) → `main.js`. All at bottom of `<body>`.

Fonts: **Inconsolata** (body, 14px) · **Gandur New** (local, `.landing-brand` hero) · **Newsreader** (italic serif accents in testimonials) · **Bebas Neue** (display fallback).

Aesthetic: brutalist/minimal, dark, monospace.

---

## Design tokens (`:root` in `styles.css`)

`--bg-color #0e0e0e` · `--text-color #FAFAFA` · `--link-highlight #0000CD` (blue link-hover fill) · `--gutter 2vw` (site-wide page padding — change this one var to resize gutters) · `--header-height 72px` (also set live by JS) · `--line-color #FAFAFA` / `--line-thickness 0.5pt`. Accent green (labels, testimonial decorations): `#39FF14`.

**Type scale**: h1 `clamp(72px,14vw,200px)`/300 Gandur New (`.landing-brand`, text: "ASCEND CLIMBING & BOULDERING.") · h2 96px/700 (section headers) · h3 clamp(24,3vw,32) (subsection) · h4 24px (sub-subsection) · body/p/li/a 14px/400. Mobile (≤992px): h3→28, h4→20.

**Grid**: `.grid-container` (page gutters) → `.grid-row` (`repeat(3,1fr)`, gap 2rem) → `.col-1/.col-2/.col-3`. Modifiers: `.compact`, `.no-border`, `.heading-row`, `.subsection-break`.

---

## Structural gotchas (not obvious from reading the code — don't undo these)

- `.nav-links` **and** `.menu-toggle` are **direct children of `<body>`**, NOT inside `<header>`. A WebKit/iOS quirk traps `position: fixed` inside a sticky ancestor; moving them out is what makes the mobile overlay's safe-area overshoot work. See comments in `styles.css` / `main.js`. **Do not move back into `<header>`.**
- Section `<h2>`s wrap their text in a `.section-heading-text` span so SplitType nests char spans correctly (otherwise chars become flex children and stack one-per-line on mobile).
- Entrance animations use `gsap.to()`, **not** `gsap.from()` — body starts at `opacity:0` and JS pre-sets the "from" states in one sync tick to prevent a flash. See the comment at the top of `main.js`.
- The hero background is a real `<img class="landing-bg">` (first child of `#landing`), **not** a `background-image` — so GSAP can wipe it in on entrance (clip-path `inset(100% 0 0 0)` → `inset(0)`, revealing up from the bottom). It MUST stay excluded from the `#landing > *:not(.landing-bg)` rule: that rule's ID specificity would otherwise override `position: absolute` with `relative`, pull the img into normal flow, and push the hero text/overlay down (this exact regression was hit and reverted once before). Stacking: img `z-index:0`, `#landing::before` overlay `z-index:1`, content `z-index:2`. The image **wipe** is gated on `landingBg.complete` / its `load` event (with `window.load` fallback) — but the **nav + landing text reveal is NOT gated**; it runs immediately on `DOMContentLoaded`. This decoupling is deliberate: the LCP element is `h1.landing-brand`, and gating the text on a network image inflated LCP to ~5s. Do not re-gate the text on the image.
- `body` uses `overflow-x: clip` (not `hidden`) so child `overflow: visible` (SVG animations) isn't clipped.
- `.feature-index` green `[001]` labels restart numbering per section.
- FAQ answers use `max-height: 0; overflow: hidden` (not `display: none`) so answer text stays in the DOM and is crawlable. A `FAQPage` JSON-LD schema block in `<head>` supplements this for rich results. Do NOT change to `display: none`.
- FAQ layout is a **two-column tab design** and uses the **ARIA tabs pattern**: `.faq-nav` is `role="tablist"`, each `.faq-nav-item` button is `role="tab"` + `aria-selected` + `aria-controls="faq-panel-00X"`, and each `.faq-panel` is `role="tabpanel"` with the matching `id`. `aria-selected` is ONLY valid on `role="tab"` (a bare `<button>` rejects it — this was an a11y audit finding); keep `role="tab"` on the buttons. `.faq-nav` (left, sticky) lists categories; `.faq-panels` (right) shows one active `.faq-panel` at a time. Switching categories is instant `display: none/block` — no max-height needed on panels. Only individual `.faq-answer` elements use the max-height accordion. On ≤992px the nav becomes a horizontal scrollable pill row above the panel. Do NOT revert to nested accordion-of-accordions (the old design clipped questions behind the next section when max-height wasn't updated correctly).
- `id="about"` lives on the `<section>` before the footer, NOT on `<footer>` — the footer nav link `href="#about"` targets this section. Do not move it back to the footer.
- `.about-body` — shared style for the About section paragraph and the Activities intro paragraph. Spans grid columns 1–2, uppercase, 14px, muted colour. Used as a direct child of `.grid-row`.
- Scroll past 200px toggles **both** `header.scrolled` and `body.header-scrolled` (the latter scopes nav link-color since `.nav-links` lives outside the header).
- iOS safe areas: mobile nav overlay uses a hardcoded `-200px` overshoot on all sides (not `env()`, which iOS PWA shortcuts cache as 0). Fixed/sticky edge elements add `env(safe-area-inset-*)`. Full rationale in `styles.css` comments.
- PWA standalone header: `html.pwa-standalone header` gets `background-color: var(--bg-color)`, `padding-top: max(env(safe-area-inset-top), 59px)`, and `top: 0`. The padding pushes the nav-row below the DI; `top: 0` keeps the header flush to the viewport so the background covers the DI zone seamlessly. Do NOT use `body { padding-top }` — it breaks sticky (header starts above the `top` threshold so sticky never fires) and nav-links overrides break the mobile menu overlay. `--header-height` (measured by JS) includes the padding and will be ~86px in PWA mode.

---

## JS map (`main.js` — all inside `DOMContentLoaded`; `gsap.registerPlugin(ScrollTrigger)` at top)

- Header + `.nav-links` share **one** entrance timeline (same frames). Scroll-hide navbar = GSAP `y` tween on both elements with 30px hysteresis; frozen while menu is open/closing.
- `startHeroIdleAnimations()` — periodic triangle spin (`#geo-tri-a`) + circle bounce (`#geo-circle-tr`) on the landing SVG mark.
- `updateNavDateTime()` — live `#nav-datetime` clock, `Asia/Kathmandu`.
- Scroll reveals: `.scroll-section` → `.animate-up` children (y+opacity, stagger); `cinematicCharReveal()` blur+green-flicker on the 3 section headers; `.pass-price` blue→white flash; `.feature-img-wrap` and `.img-reveal-container` clip-path wipes. Feature images animate `scale: 1.03 → 1.01` (zoom-out depth); resting at `1.01` prevents sub-pixel blue-edge bleed. The ScrollTrigger trigger falls back to `.grid-row` for images not inside `.feature-item` (e.g. rock-day).
- Scramble-text effect on hover for bare `<a>` tags.
- Hamburger menu — toggles `.active` / `.mobile-active` / `body.menu-open`; close clip-path tween restores scroll-hide state in its `onComplete`.
- `initTestimonialsCarousel()` — renders from a `REVIEWS` array (6 reviews; each `parts` item is `{t}` or `{d,t}` where `d` ∈ pill/outline/oval/sparkle/wave/underline → `.t-*` spans). Measures the tallest slide to fix `min-height` (prevents layout shift). Auto-rotates 8s; arrow keys when in view.
- `updateHeaderHeight()` — writes `--header-height` on load + resize.
- FAQ (inline at bottom of `DOMContentLoaded`) — two parts: (1) `.faq-nav-item` click switches the active `.faq-panel` (tab-style, collapses open questions in the leaving panel); (2) `.faq-question` click toggles `.open` on `.faq-item`, sets `answer.style.maxHeight` to `scrollHeight` on open and `0` on close. `+` icon rotates 45° via CSS to form `×` when open.

---

## Field Notes page (stories.html)

- The page is a single-page app rendered entirely by JS into `<div id="fn-app">`. There is no static HTML inside the app div — everything is built by `renderIndex()` / `renderArticle()` on each view switch.
- **`.fn-view` IS the CSS grid container** (260px sidebar + 1fr main). Do NOT change this to `display: contents` — it breaks the grid because Chromium doesn't propagate grid context through `display: contents` reliably for dynamically injected subtrees.
- **Dynamic Island / status-bar bleed fix (mobile, ≤900px) — do not regress this; it was hard-won.** On mobile `.fn-view` becomes a `position: fixed` full-viewport pane (`inset: 0; overflow-y: auto`) that scrolls its OWN content; the `.fn-sidebar` is a `position: sticky` strip inside it. **Why:** iOS Safari draws *window*-scrolled content up under the translucent status bar (the area above layout `y=0`), and that zone can't be covered — `env(safe-area-inset-top)` is **0** in the browser and Safari clips fixed/sticky elements to `y≥0`. Scrolling *inside* the fixed pane clips content at the pane's top edge so it can never reach that zone. Things that do NOT work (all tested on-device): removing `viewport-fit=cover` alone, a sticky/fixed top bar with the window scrolling, and any fixed "cover" element over the status-bar zone. Curiously a bare page with the same plain-viewport + sticky header does *not* bleed — something in the global `styles.css` (likely `body { overflow-x: clip }` / the `body::after` fixed overlay) triggers it here, hence the pane.
- **`stories.html` head differs from the main site on purpose:** plain viewport (NO `viewport-fit=cover`), `apple-mobile-web-app-capable=yes`, and `apple-mobile-web-app-status-bar-style=**black**` (opaque, NOT `black-translucent`). The opaque black status bar makes the installed PWA sit *below* the bar (no edge-to-edge), so it doesn't bleed and needs no `env()` padding floor (which previously pushed the PWA header down). There is no `html.pwa-standalone` rule for this page.
- URL hash routing: opening a post pushes `#post-{id}` to history. Reloading with that hash re-opens the article directly. Back/forward browser buttons work via `popstate`.
- Posts are in `posts.js` — `POSTS` array for list data, `BODIES` map for full-length articles. Posts without a `BODIES` entry render a short "Brief" fallback automatically.
- Shared nav/header logic (Lenis, header scroll, menu toggle, clock) is duplicated inline in `stories.html`. If you change nav behavior in `main.js`, mirror the change in `stories.html`.
- The `a::before` blue-fill hover effect (from `styles.css`) is suppressed on sidebar links and top-bar nav links using `::before { display: none }` and `position: static` overrides.

---

## Responsive

- **≤992px**: single-column grid; mobile fullscreen nav overlay; sticky course cards → relative; landing `.col-2` hidden; section `<h2>` → flex-column with `.section-label` ordered above the heading.
- **≤480px**: minor logo/size tweaks only.

---

## SEO

- JSON-LD `SportsActivityLocation` schema in `<head>` of `index.html` — includes name, alternateName ("The South Wall"), address, exact GPS coords, phone, hours, amenities, and `sameAs` links (Facebook, Instagram, Google Business Profile).
- Google Business Profile verified; website link submitted (pending approval).
- Sitemap at `/sitemap.xml`; submit to Google Search Console at `thesouthwall.com`.
- Phone: `+977-9764835306` · Hours: 8am–9pm daily, 8am–10pm Fridays.

---

## Pricing reference (NPR)

- **Day Passes**: Boulder 900 · Full Experience (+shoes +belay) 1100
- **Membership w/ shoes**: 1M 9000 · 3M 22000 · 6M 32000 · Annual 52000
- **Membership w/o shoes**: 1M 7000 · 3M 17000 · 6M 27000 · Annual 37000
- **Kids Courses** (6wk): Ages 6-8 Mon 5-6:30pm 11000 · Ages 9-12 Tue 4-6pm 14000 · Ages 13-16 Tue 4-6pm 14000
- **Adult Courses**: Fundamentals / Women's Bouldering / Lead Climbing
- **Rock Day non-members (total)**: 1pax 19000 · 2pax 24000 · 3pax 30000 · 4pax 36000
- **Rock Day members (per person)**: 4-pax group 4000 · private 1-3pax → non-member rates
- *All prices incl. VAT. Students/kids 15% off.*
