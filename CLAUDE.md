# Ascend Climbing — Project Context

## What This Is
Static website for **Ascend Climbing**, a bouldering/climbing gym in Jhamsikhel, Lalitpur, Nepal.  
Owner entity: ASCE Pvt. Ltd. / A South City Entertainment Pvt. Ltd.  
Deployed on **Vercel** (`vercel.json` has `cleanUrls: true`). Domain not yet acquired.

No build system. Pure HTML + CSS + JS. No npm, no bundler.

---

## File Map

| File | Purpose |
|------|---------|
| `index.html` | Main page: Landing hero, Pricing, Activities (Kids Courses/Adult Courses/Rock Day), Features (Cafe/Gym/Shower subsections), Testimonials carousel, Footer |
| `cafe.html` | Standalone cafe menu page |
| `styles.css` | All styles — single shared file |
| `main.js` | All JS — single shared file, runs on `DOMContentLoaded` |
| `img/square/` | 9 square climbing photos for fullscreen preloader roulette |
| `img/optimized/` | Optimised assets — `wall.jpg` (hero bg), `cafe.avif` (cafe feature subsection) |
| `img/site-favicon.svg` | SVG favicon — white circle (`#FAFAFA`) with dark (`#171717`) star/asterisk icon, mirrors the mobile navbar button design |
| `img/` | Larger gym photos (JPG/WEBP) |
| `fonts/` | Local font files — `Gandur New-Light.otf` |
| `ref/` | Course images (`kids_image.png`, `adult_image.png`), logo, reference screenshots |
| `vercel.json` | `{ "cleanUrls": true }` |

---

## Tech Stack

- **Lenis 1.1.14** — smooth scroll, loaded via CDN before GSAP. `lerp: 0.1`
- **GSAP 3.12.5** + **ScrollTrigger** — loaded via CDN at bottom of `<body>`
- **Split Type 0.3.4** — character/word splitting for cinematic text reveals, loaded via CDN
- **Inconsolata** (Google Fonts, 400 weight) — body text
- **Bebas Neue** (Google Fonts) — fallback display font
- **Gandur New** (local, `fonts/Gandur New-Light.otf`, weight 300) — primary landing brand heading
- **Newsreader** (Google Fonts, italic 500) — serif italic emphasis in Testimonials carousel decorations
- No framework, no Tailwind (yet)

CDN script order in HTML (order matters):
```html
<script src="https://cdn.jsdelivr.net/npm/lenis@1.1.14/dist/lenis.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/split-type@0.3.4/umd/index.min.js"></script>
<script src="main.js"></script>
```

---

## Design System

**Aesthetic**: Brutalist/minimal, dark, monospace typography.

### CSS Variables (`:root` in `styles.css`)
```
--bg-color: #0e0e0e
--text-color: #FAFAFA
--link-highlight: #0000CD  (blue fill on link hover)
--font-mono: 'Inconsolata', ui-monospace, ...
--line-thickness: 0.5pt
--line-color: #FAFAFA
--header-height: 72px  (also set dynamically via JS)
--gutter: 2vw          (page side padding — used by .grid-container, .landing-row, and #landing negative margins. Change only this to resize gutters site-wide)
```

### Grid System
- `.grid-container` → `padding: 0 var(--gutter)` (page gutters — controlled by `--gutter: 2vw` in `:root`)
- `.grid-row` → `grid-template-columns: repeat(3, 1fr)`, `gap: 2rem`, `padding: 1.5rem 0`
- Columns addressed as `.col-1`, `.col-2`, `.col-3`
- `.grid-row.compact` → reduced padding
- `.grid-row.full-bleed` → zero padding, for image sections
- `.grid-row.no-border` → suppresses row border
- `.grid-row.heading-row` → `padding-bottom: 0`. Section header `h2`s (`#pricing-section-header`, `#activities-section-header`, `#features-section-header`) have `padding-bottom: 0.75rem` to control spacing below the heading text.

### Typography
- `h1` (standard): 128px, weight 500, uppercase, line-height 1
- `.landing-brand`: Gandur New (fallback Bebas Neue), weight 300, `clamp(72px, 14vw, 200px)`, line-height 0.88, white — primary landing hero text
- `.landing-climbing-sub`: Inconsolata, 24px (16px mobile), weight 600, uppercase, letter-spacing 0.35em
- `.landing-tagline`: Inconsolata, 14px, uppercase, letter-spacing 0.2em, opacity 1
- `h2`: 96px, weight 700, uppercase — section headers (Pricing, Activities, Features)
- `h3`: `clamp(24px, 3vw, 32px)`, weight 600, line-height 32px, uppercase — subsection headings (Day Passes, Memberships, Kids Courses, Adult Courses, Rock Day). Mobile override: 28px
- `h4`: 24px, weight 600, uppercase — sub-subsection headings (Boulder Pass—, w/ Shoes—, Ages 6–8—, etc.). Mobile override: 20px
- Body/p/span/li/a: 14px, weight 400

> Note: `.landing-heading` class still exists in CSS but is no longer used in the HTML — replaced by `.landing-brand`.

### Special Effects
- **Noise overlay**: SVG fractalNoise on `body::after`, `opacity: 0.08`, fixed, `z-index: 9999`, `pointer-events: none`
- **Navbar**: `mix-blend-mode: difference` on `<header>` so white text inverts against page content. Links: Index | Pricing | Activities | Features | About. `.nav-meta` (right side) contains both `#nav-datetime` and `.nav-location` in a flex row
- **Link hover**: blue `clip-path` fill slides up from bottom + scramble text effect (JS)
- **`body` uses `overflow-x: clip`** (not `hidden`) — prevents horizontal scroll without creating a scroll container that would clip child `overflow: visible` (e.g. SVG animations)

---

## Key CSS Classes (quick reference)

| Class | Behaviour |
|-------|-----------|
| `.landing-inner` | Flex column, centered, `gap: 1rem`, `opacity: 0.8` — wraps all landing content |
| `.landing-geo` | Inline SVG geometric mark (2 rows of 2 circles + 4 triangles), `clamp(90px, 23vw, 190px)` wide, `overflow: visible`. First triangle in each row is equilateral (apex at x=143). Triangles chain tip-to-base: 100→143→173→191→202. `#geo-circle-tr` = top-right circle; `#geo-tri-a` = bottom-left triangle (animated) |
| `.landing-brand` | Primary hero text — Gandur New, weight 300, `clamp(72px, 14vw, 200px)` |
| `.landing-climbing-sub` | "Climbing and Bouldering" subtitle — uppercase, spaced, 24px |
| `.landing-tagline` | "The Wall in the South" — 14px, opacity 1, `width: 100%` for correct desktop centering |
| `.landing-heading` | Legacy class (still in CSS, not used in HTML) |
| `.scroll-section` | Marks a section for GSAP scroll animation |
| `.animate-up` | Initial state: `opacity:0; transform:translateY(40px)` — GSAP animates in |
| `.delay-1`, `.delay-2` | Used with GSAP stagger (0.15s per step) |
| `.full-bleed` | Full-height image grid rows |
| `.sticky-card` | `position: sticky; top: 0` — used on course sections |
| `.img-reveal-container` | GSAP clip-path scroll reveal (wipes upward as you scroll) |
| `.text-bg-cover` | Absolute pseudo-background behind text columns in full-bleed rows |
| `.push-right` | `padding-left: 15%` — nudges col-2 content toward image |
| `.flex-col` | `display:flex; flex-direction:column` |
| `.mt-auto`, `.mb-2`, `.pt-1`, `.pt-2` | Spacing utilities |
| `.menu-toggle` | Hamburger button — **direct child of `<body>`**, not inside `<header>`; fixed position on mobile (≤992px), `z-index: 2000` |
| `.mobile-active` | Added to `.nav-links` when hamburger is open |
| `.features-grid` | 2-col grid for Features subsections (`repeat(2,1fr)`), collapses to 1-col at ≤992px. `row-gap: 6rem; column-gap: 10rem`. **Direct child of `<section id="features">`, not inside `.grid-container`** — has no side padding of its own |
| `.feature-item` | Flex column wrapper for one feature subsection (index label + image + heading) |
| `.feature-img-wrap` | Image container — `aspect-ratio: 4/3`, `overflow: hidden`, `background-color: #0000CD` (blue shows before reveal). Has an `img` for real photos, empty for placeholders |
| `.feature-img-placeholder` | Added to `.feature-img-wrap` when no real image yet — overrides to `background-color: #000` (black), while `.feature-img-wrap` itself is blue (`#0000CD`) |
| `.feature-item-info` | Heading area below image, `padding: 0.75rem 0` |
| `.feature-index` | `[001]` / `[002]` / `[003]` label placed directly above a heading — green `#39FF14`, monospace, `letter-spacing: 0.1em`, `display: block`, `margin-bottom: 0.5rem`. Used in Features (above each feature image) and in Pricing/Activities (above each subsection `h3`). Numbering restarts at `[001]` per section. |
| `.pricing-label`, `.activities-label`, `.features-label` | Green `#39FF14` inline label spans inside each section `h2` (e.g. `[PRICING]`, `[COURSES/TRIPS]`, `[FEATURES]`). Inconsolata, weight 400, `letter-spacing: 0.1em`, `margin-left: 1.8em`. No space character before the span in HTML — gap is controlled purely by `margin-left`. |
| `#testimonials` | Section between Features and Footer. Contains eyebrow + section title (`.testi-title-main` Inconsolata + `.testi-title-serif` Newsreader italic green) and the featured carousel. `padding-top: var(--section-pt)` |
| `.testi-carousel-wrap` | Direct child of `.grid-container` in `#testimonials`. Has `border-top` hairline. Children: `.testi-quote`, `.testi-attrib`, `.testi-footer-row` |
| `.testi-quote` | Big decorated quote block — Inconsolata, `clamp(20px, 2.6vw, 38px)`. Content populated by JS. `min-height` is set dynamically by JS on init (tallest slide measured invisibly) — do not rely on the CSS `min-height: 6.5em` fallback for layout stability. `transition: opacity, transform` used for carousel fade |
| `.t-pill`, `.t-outline`, `.t-oval`, `.t-sparkle`, `.t-wave`, `.t-underline` | Inline decoration spans inside `.testi-quote`. All use Newsreader italic. Green (`#39FF14`) accent color. `.t-pill` = green bg dark text; `.t-outline` = green border; `.t-oval` = SVG ellipse; `.t-sparkle` = `✦` before/after via pseudo-elements; `.t-wave`/`.t-underline` = SVG stroke underlines |
| `.testi-attrib` | Attribution row below quote: dash + uppercase name (`.testi-attrib-name`, 14px) + `✦` stars (green, `.testi-attrib-stars`) + muted "via Google · X ago" (`.testi-attrib-when`, 14px). Populated by JS. Uses `flex-wrap: wrap` — `.testi-attrib-when` gets `width: 100%` at ≤992px (mobile only) to force it onto its own line; on desktop it flows inline with the rest |
| `.testi-footer-row` | Bottom of carousel: counter (`.testi-counter`, e.g. "01 / 06") on left, controls (dots + prev/next buttons) on right. `border-top` hairline. Counter is 14px (matches body text) |
| `.testi-dot` | Dot pager button — `6×6px` round, dim white inactive; active = green `#39FF14`, `width: 22px`, pill shape |
| `.testi-nav` | Circular prev/next buttons — `38px`, hairline border. Hover invert (white fill) is wrapped in `@media (hover: hover)` so it never sticks on touch devices |
| `.footer-grid` | 2-col grid: `minmax(280px,1fr) minmax(0,2fr)`, `gap: 80px`. Left col = big diagonal arrow SVG. Right col = eyebrow + nav list. Collapses to 1-col at ≤992px |
| `.footer-nav-list` / `.footer-nav-row` | Nav list of 5 page anchors. Row = grid `96px 1fr 56px`. Hover: `padding-left: 12px` slide + name nudge + diagonal arrow swap (main↗ exits, ghost enters from ↙). Global `a::before` suppressed on all footer links |
| `.footer-wordmark` | `position: absolute; left: var(--gutter); bottom: 32px` — "Ascend / Climbing / Gym ↘" stacked, goes static at ≤992px |
| `.footer-bottom-bar` | 8-col grid `1fr auto auto 1fr auto auto auto auto`. `margin-left: 240px` on desktop to clear wordmark. Contains tagline / copyright / 2 spacers / phone / email / Facebook / Instagram |
| `.footer-bb-cell` | Bottom bar cell — `display: flex`, `padding: 14px 24px`, `border-right` hairline rules. `.spacer` has `padding: 0; border-right: none` |

---

## JS Behaviours (`main.js`)

All code runs inside `DOMContentLoaded`. GSAP plugin registered at top: `gsap.registerPlugin(ScrollTrigger)`.

### 1. `initPreloader(onComplete)` — Fullscreen Preloader Roulette
- Fixed fullscreen overlay (`#square-grid-stage`) with 3×3 colored image grid — lives at top of `<body>`, before `<header>`
- On load: body scroll locked, images shuffle randomly for ~3s, then lock in final order `[4,0,2,6,8,1,3,5,7]`
- After roulette: GSAP wipes stage upward (`clipPath: inset(0% 0% 100% 0%)`), then hides it
- `onComplete` callback: unlocks scroll, initializes all GSAP scroll animations + ScrollTrigger
- Respects `prefers-reduced-motion` (skips roulette, wipes immediately)
- No hover effects; images shown in full color (no grayscale filter)

### 2. Header & Landing Entrance Animations
- Header: slides down from `-100%` y + fades in, duration 0.7s, `power3.out`, delay 0.1s
- `.nav-links` (desktop only, `min-width: 993px`): same slide-in as header — was implicit when nav lived inside `<header>`, made explicit after the iOS fix moved it to a direct `<body>` child
- `.menu-toggle`: fades up from `y: 30`, duration 0.5s, delay 0.8s, `clearProps: 'transform'` — required to restore CSS `transform: translateX(-50%)` centering after GSAP finishes
- Landing content timeline (delay 0.5s): `.landing-geo` → `.landing-brand` → `.landing-climbing-sub` → `.landing-tagline`, each fading up sequentially with overlaps
- `onComplete` on the entrance timeline calls `startHeroIdleAnimations()`

### 2a. `startHeroIdleAnimations()` — Hero Idle Animations
Fires after the entrance timeline completes. Skipped if `prefers-reduced-motion`.
- **Triangle spin** (`#geo-tri-a`, bottom-left triangle): 360° rotation, `power2.inOut`, 1.1s, `svgOrigin: '114 75'` (centroid), repeats every 7–12s after a 1.5s initial delay
- **Circle bounce** (`#geo-circle-tr`, top-right circle): bounces up 12px (`power2.out` up, `bounce.out` down), repeats every 5–9s after a 2.5s initial delay

### 2b. Scroll-Hide Navbar
- After scrolling past `#landing` bottom: scrolling **down** fires `gsap.to([header, navLinksEl], { y: -120, ... })` on both elements simultaneously; scrolling **up** animates both back to `y: 0`
- Uses GSAP (not CSS transitions) so both elements are on the same frame — avoids the pill-before-text timing mismatch that CSS transitions produce (header is sticky/no base transform; `.nav-links` has `translate(-50%,-50%)` — compositing order differs)
- `navIsHidden` bool + `navPeakY` guard re-triggering; `overwrite: true` cancels in-progress tweens
- **30px hysteresis**: once hidden, `navPeakY` tracks the furthest scroll position reached (updates on every frame while nav is hidden). Nav reappears only when `navPeakY - scrollY > 30`. Using the rolling peak (not the position where nav first hid) means the 30px is always measured from the most recent scroll peak — prevents jitter without requiring a full scroll back to the original hide point
- `.menu-toggle` (mobile hamburger) is intentionally unaffected — it's a separate `position: fixed` element

### 3. `updateNavDateTime()` — Live Clock
- Updates `#nav-datetime` every second
- Timezone: `Asia/Kathmandu`

### 4. Scroll Animations (deferred until after preloader)
- All `.scroll-section` elements: GSAP `fromTo` on nested `.animate-up` children
- `y: 40 → 0`, `opacity: 0 → 1`, duration 0.8s, ease `power3.out`, stagger 0.15s
- ScrollTrigger `start: "top 85%"`, `toggleActions: "play none none none"`
- **Initialized inside `initPreloader` callback** — not at DOMContentLoaded

### 6. Section Header Cinematic Reveal (`cinematicCharReveal`)
- Applied to `#pricing-section-header`, `#activities-section-header`, and `#features-section-header`
- Each `h2` is split with **SplitType** into `.chars`
- Each char: blurs in (`blur(20px) → 0`) on scroll-in, then flickers green (`#39FF14` glow) and resolves to `color: inherit`
- Random per-char delay (up to 0.4s × `Math.random()`), `toggleActions: "play none none reverse"`
- Skipped if `prefers-reduced-motion` or SplitType not loaded

### 7. Day Pass Price Flash Animation
- `.pass-price` elements: GSAP `fromTo` on scroll-in — starts blue (`#0000CD`), transitions to white (`#FAFAFA`)
- Duration 0.7s, ease `power2.out`, staggered by 0.15s per card
- Font size: `24px / weight 600` desktop, `20px` mobile (matches `h4`)

### 8. Image Reveals (deferred until after preloader)
- `.img-reveal-container` inside a `.scroll-section`: scrub clip-path from `inset(100% 0% 0% 0%)` → `inset(0%)`
- Triggered from `top bottom` to `top top` of parent `.scroll-section`
- **Initialized inside `initPreloader` callback** — not at DOMContentLoaded

### 9. Scramble Text on Hover
- Applied to all `<a>` with no child elements
- Custom GSAP tween cycles random chars, resolving L→R to original text over 0.7s
- Stores original text in `data-original-text` attribute

### 10. Hamburger Menu
- Toggle `.menu-toggle` adds/removes `.active` (animates spans to X) and `.mobile-active` on `.nav-links`
- Also toggles `menu-open` on `<body>` (disables `mix-blend-mode: difference` on header)

### 11. Feature Image/Placeholder Reveal
- Loops over every `.feature-img-wrap` at `DOMContentLoaded`
- **With `img`**: sets `clipPath: inset(100% 0% 0% 0%)`, `filter: blur(2px)`, `scale: 1.03`, `opacity: 1` on the `img`. On scroll-in: wipes up (0.6s, `power3.out`), then clears blur + scale (0.2s, `power2.out`)
- **Without `img`** (placeholder): sets `clipPath: inset(100% 0% 0% 0%)` on the wrap div itself, wipes up the blue box (0.6s, `power3.out`)
- `toggleActions: 'play none none reverse'` — reverses on scroll-up, replays on scroll-down
- Adding a real `<img>` to a placeholder automatically uses the blur+wipe path — no JS changes needed
- Scale `1.03 → 1` during unblur prevents the blur from bleeding past `overflow: hidden` and showing the blue background at the edge

### 12. Testimonials Carousel (`initTestimonialsCarousel`)
- IIFE inside `DOMContentLoaded`. Populates `#testi-quote`, `#testi-attrib`, `#testi-dots`, `#testi-counter` from a `REVIEWS` array (6 reviews, each with `parts` array of `{t: text}` or `{d: decoration-type, t: text}`)
- Decoration types: `pill`, `outline`, `oval`, `sparkle`, `wave`, `underline` → mapped to `.t-*` CSS classes
- **Layout-shift prevention**: on init, all reviews are rendered invisibly into `quoteEl` to measure their natural height; the tallest result is set as `quoteEl.style.minHeight`. This keeps the quote box a fixed height across all slides so nothing below shifts — if this measurement is removed, carousel transitions will cause other sections to jump and may incorrectly re-trigger ScrollTrigger scroll animations
- Carousel transitions: sets `quoteEl.style.opacity = '0'` + `translateY(7px)`, updates content, then `requestAnimationFrame` restores opacity + translate via inline transition
- Auto-rotates every 8s (`setInterval`). Resets timer on any manual navigation
- Keyboard: `ArrowLeft`/`ArrowRight` fire only when `#testimonials` is in the viewport (`getBoundingClientRect` check)
- Star symbol in attribution: `✦` (U+2726, four-pointed star) in neon green. Inactive stars shown at `opacity: 0.2`

### 13. Header Height CSS Var
- `updateHeaderHeight()` sets `--header-height` on `:root` to actual header pixel height
- Runs on load and `resize`

---

## Responsive Breakpoints

- **≤ 992px**: Single-column grid, mobile fullscreen nav overlay, sticky becomes relative for courses, `.col-2` hidden in landing, `h1` scales with `clamp`. `h3` → 28px, `h4` → 20px, `.pass-price` → 20px, `.membership-row-item` → 20px/32px line-height (matches `h4`). `.subsection-break` border suppressed on mobile (spacing only). First `.pricing-pass-card` and `.course-cards-row` card have `border-top: none` to avoid a line directly under subsection headings.
- **≤ 480px**: Logo size reduction only

---

## iOS Safe Areas (dynamic island / home indicator)

Both `index.html` and `cafe.html` set:
- `<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">` — allows the page to render edge-to-edge on iPhones, behind the dynamic island and home indicator
- `<meta name="apple-mobile-web-app-capable" content="yes">` — enables PWA standalone mode when added to home screen
- `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">` — transparent status bar in PWA, so the page bg (`#0e0e0e`) shows uniformly through the dynamic island region
- `<meta name="theme-color" content="#0e0e0e">` — matches page bg

Fixed/sticky elements that touch the screen edges add `env(safe-area-inset-*)` so they don't sit under the dynamic island or home indicator:
- `header` → `top: calc(0.75rem + env(safe-area-inset-top))`
- `.menu-toggle` (mobile, ≤992px) → `bottom: calc(1.75rem + env(safe-area-inset-bottom))`

The mobile nav overlay (`.nav-links` at ≤992px) uses `position: fixed` with a flat `-200px` overshoot on all four sides:
```css
top: -200px; left: -200px; right: -200px; bottom: -200px;
```
Why hardcoded `-200px` (not `env(safe-area-inset-*)`)? `env()` returns 0 unless `viewport-fit=cover` is actually applied, and iOS PWA shortcuts cache the viewport meta at install time — so a PWA added to home screen *before* the meta tag was updated will still see `env(safe-area-inset-top) = 0`. The hardcoded overshoot covers the dynamic island and home indicator regardless. The popup's flex centering still centers content correctly because the overshoot is symmetric (element center = viewport center).

**Critical**: `.nav-links` is a **direct child of `<body>`**, NOT inside `<header>`. WebKit (Safari/iOS) has a quirk where `position: fixed` *inside* a `position: sticky` ancestor is effectively trapped within the sticky parent's box — negative `top:` values don't extend past the sticky parent's bounds. Moving `.nav-links` out of the sticky `<header>` is what actually makes the overshoot work on iPhone. Do not move it back into the header.

Because `.nav-links` is no longer inside `<header>`, the scroll-color states use a `body.header-scrolled` class instead of `header.scrolled .nav-links`. JS toggles **both** classes (`header.scrolled` and `body.header-scrolled`) on scroll past 200px.

**Belt-and-suspenders for iOS popup coverage**: when `body.menu-open` is set, `<main>` and `<header>` fade to `opacity: 0` (mobile breakpoint only). This makes the body's `--bg-color` show through in the iOS safe-area zones (dynamic island, home indicator) — body bg matches popup bg, so even if iOS clamps the popup's `position: fixed` bounds to the safe area, the safe-area regions appear uniformly dark. The header's GSAP entrance animation uses `clearProps: 'transform,opacity'` (not just `transform`) so the CSS opacity rule isn't overridden by an inline `opacity: 1` left behind by GSAP.

---

## Planned Additions (not yet implemented)

- **Tailwind CSS** — decision pending. Current CSS is custom and hand-crafted. If added, use Play CDN for no-build setup. Risk: Tailwind resets and utilities may conflict with existing custom grid and typography.

---

## Pricing Reference (NPR)

**Day Passes**: Boulder Pass 900 | Full Experience (+ shoes + belay) 1100  
**Memberships w/ Shoes**: 1M 9000 | 3M 22000 | 6M 32000 | Annual 52000  
**Memberships w/o Shoes**: 1M 7000 | 3M 17000 | 6M 27000 | Annual 37000  
**Kids Courses**: Ages 6-8 → Mon 5-6:30pm, 6 weeks, NPR 11000 | Ages 9-12 → Tue 4-6pm, 6 weeks, NPR 14000 | Ages 13-16 → Tue 4-6pm, 6 weeks, NPR 14000  
**Adult Courses**: Fundamentals / Women's Bouldering / Lead Climbing  
**Rock Day (Non-Members, Total)**: 1 pax 19000 | 2 pax 24000 | 3 pax 30000 | 4 pax 36000  
**Rock Day (Members, Per Person)**: 4-pax group 4000 | private 1–3 pax → non-member rates apply  
**Rock Day includes**: Rock Level I certified guides, safety gear & first aid, food/snacks/hydration/transport, serene views  
*All prices include VAT. Students/kids get 15% discount.*

---

## Prompting Tips (for future sessions)

To minimize token usage when asking Claude for help:
- Say **which file** you're modifying: `index.html`, `styles.css`, or `main.js`
- Say **which section** by ID: `#landing`, `#pricing`, `#activities`, `#features`, `#kids`, `#adult`, `#contact`
- Say **which JS function** by name, e.g. "in `initSquareGrid`"
- For CSS, reference the class name from the table above rather than describing it
- For new features, say "add to `main.js` inside `DOMContentLoaded`"
