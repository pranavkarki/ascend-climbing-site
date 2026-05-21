# Ascend Climbing

Website for **Ascend Climbing** — a bouldering and climbing gym in Jhamsikhel, Lalitpur, Nepal.

---

## Stack

No build system. Pure HTML + CSS + JS, deployed on Vercel.

| Library | Version | Purpose |
|---------|---------|---------|
| Lenis | 1.1.14 | Smooth scroll |
| GSAP + ScrollTrigger | 3.12.5 | Animations |
| Split Type | 0.3.4 | Text character splitting |

All three loaded via CDN in that order. Local font: `fonts/Gandur New-Light.otf`.

---

## Files

| File | What it is |
|------|------------|
| `index.html` | Main page (landing, pricing, courses, features, footer) |
| `cafe.html` | Cafe menu page |
| `styles.css` | All styles |
| `main.js` | All JS |
| `img/optimized/` | Production images (`wall.jpg`, `cafe.avif`) |
| `img/square/` | 9 square photos used in the preloader roulette |
| `fonts/` | Local font files |
| `vercel.json` | `cleanUrls: true` |

---

## Making changes

Open any of the three source files directly — there's no dev server or build step needed. For a live preview, open `index.html` in a browser or use the Live Server extension in VS Code.

**Key CSS variables** (change these to restyle globally):
- `--gutter: 2vw` — page side padding
- `--section-pt: 4rem` — top padding for each section
- `--color-accent: #39FF14` — neon green used for labels and flash effects
- `--bg-color: #0e0e0e` — page background
- `--text-color: #FAFAFA` — primary text

**To add a real image to a feature placeholder:** drop an `<img>` inside any `.feature-img-wrap` — the JS reveal animation picks it up automatically.

---

## Deploy

Push to `main` → Vercel auto-deploys. No other steps.
