# Ascend Climbing — Project Context

Static marketing site for **Ascend Climbing**, a bouldering/climbing gym in Jhamsikhel, Lalitpur, Nepal (owner: ASCE Pvt. Ltd.). Pure HTML + CSS + JS — **no build system, no npm, no bundler**. Deployed on Vercel (`vercel.json` → `cleanUrls: true`). Domain not yet acquired.

This file is a **map**. The detailed "why" behind tricky animation/layout decisions lives in inline comments next to the code — read those before changing tuned values.

---

## Files

| File | Purpose |
|------|---------|
| `index.html` | Main page: Landing → Pricing → Activities (Kids/Adult courses, Rock Day) → Features (Cafe/Gym/Shower) → Testimonials → Footer |
| `cafe.html` | Standalone cafe menu page |
| `styles.css` | All styles (single file) |
| `main.js` | All JS (single file), runs on `DOMContentLoaded` |
| `img/square/` | 9 photos for the preloader roulette |
| `img/optimized/` | `wall.jpg` (hero bg), `cafe.avif` |
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

**Type scale**: h1 128px/500 · h2 96px/700 (section headers) · h3 clamp(24,3vw,32) (subsection) · h4 24px (sub-subsection) · body/p/li/a 14px/400. Mobile (≤992px): h3→28, h4→20.

**Grid**: `.grid-container` (page gutters) → `.grid-row` (`repeat(3,1fr)`, gap 2rem) → `.col-1/.col-2/.col-3`. Modifiers: `.compact`, `.no-border`, `.heading-row`, `.subsection-break`.

---

## Structural gotchas (not obvious from reading the code — don't undo these)

- `.nav-links` **and** `.menu-toggle` are **direct children of `<body>`**, NOT inside `<header>`. A WebKit/iOS quirk traps `position: fixed` inside a sticky ancestor; moving them out is what makes the mobile overlay's safe-area overshoot work. See comments in `styles.css` / `main.js`. **Do not move back into `<header>`.**
- Section `<h2>`s wrap their text in a `.section-heading-text` span so SplitType nests char spans correctly (otherwise chars become flex children and stack one-per-line on mobile).
- Entrance animations use `gsap.to()`, **not** `gsap.from()` — body starts at `opacity:0` and JS pre-sets the "from" states in one sync tick to prevent a flash. See the comment at the top of `main.js`.
- `body` uses `overflow-x: clip` (not `hidden`) so child `overflow: visible` (SVG animations) isn't clipped.
- `.feature-index` green `[001]` labels restart numbering per section.
- Scroll past 200px toggles **both** `header.scrolled` and `body.header-scrolled` (the latter scopes nav link-color since `.nav-links` lives outside the header).
- iOS safe areas: mobile nav overlay uses a hardcoded `-200px` overshoot on all sides (not `env()`, which iOS PWA shortcuts cache as 0). Fixed/sticky edge elements add `env(safe-area-inset-*)`. Full rationale in `styles.css` comments.

---

## JS map (`main.js` — all inside `DOMContentLoaded`; `gsap.registerPlugin(ScrollTrigger)` at top)

- `initPreloader(onComplete)` — fullscreen 3×3 image roulette, locks final order `[4,0,2,6,8,1,3,5,7]`, wipes up. **Defers** all scroll/image ScrollTriggers into `onComplete`. Respects `prefers-reduced-motion`.
- Header + `.nav-links` share **one** entrance timeline (same frames). Scroll-hide navbar = GSAP `y` tween on both elements with 30px hysteresis; frozen while menu is open/closing.
- `startHeroIdleAnimations()` — periodic triangle spin (`#geo-tri-a`) + circle bounce (`#geo-circle-tr`) on the landing SVG mark.
- `updateNavDateTime()` — live `#nav-datetime` clock, `Asia/Kathmandu`.
- Scroll reveals: `.scroll-section` → `.animate-up` children (y+opacity, stagger); `cinematicCharReveal()` blur+green-flicker on the 3 section headers; `.pass-price` blue→white flash; `.feature-img-wrap` and `.img-reveal-container` clip-path wipes.
- Scramble-text effect on hover for bare `<a>` tags.
- Hamburger menu — toggles `.active` / `.mobile-active` / `body.menu-open`; close clip-path tween restores scroll-hide state in its `onComplete`.
- `initTestimonialsCarousel()` — renders from a `REVIEWS` array (6 reviews; each `parts` item is `{t}` or `{d,t}` where `d` ∈ pill/outline/oval/sparkle/wave/underline → `.t-*` spans). Measures the tallest slide to fix `min-height` (prevents layout shift). Auto-rotates 8s; arrow keys when in view.
- `updateHeaderHeight()` — writes `--header-height` on load + resize.

---

## Responsive

- **≤992px**: single-column grid; mobile fullscreen nav overlay; sticky course cards → relative; landing `.col-2` hidden; section `<h2>` → flex-column with `.section-label` ordered above the heading.
- **≤480px**: minor logo/size tweaks only.

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
