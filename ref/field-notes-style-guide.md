# Field Notes — Writing & Formatting Reference

A style guide for anyone contributing to the Ascend Climbing Field Notes page. Read it before you write; refer back when you're editing. The goal is a consistent voice across authors — not uniformity, but coherence.

---

## Voice

- **First person plural by default.** "We built", "we knew", "we did not." The gym speaks as one.
- **Short sentences carry weight.** Long ones are fine but every paragraph should have at least one sentence that lands like a hold slap. Punchy closers matter.
- **No fluff.** Cut anything that doesn't earn its place. No "exciting", "amazing", "awesome". Show the thing, don't describe how the thing made you feel.
- **Concrete over abstract.** "Two welders, ten days" beats "a significant construction effort." Times, grades, names, bus numbers — specifics are the writing.
- **Dry wit is welcome. Hype is not.** Understatement over enthusiasm. "We did not build it to be polite." Not "the cave is an incredible training tool."
- **Don't explain the punchline.** End sections early. If the last line is strong, stop there.

---

## Tone by category

| Category | Tone | Think of it as |
|----------|------|---------------|
| **Story** | Reflective, spare, first-person | A memo to the wall itself |
| **Event** | Factual, tight, no adjectives | A race notice, not a flyer |
| **Rock Day** | Field report — weather, grades, logistics | What you'd tell someone the next day |

---

## Structure (BODIES object)

Every full article has this shape. Follow it exactly — the renderer depends on it.

```
dek          → One or two sentences. Expands on the title. No period at the end of the last sentence if it's a fragment.
caption      → lead: ALL-CAPS short label (e.g. "BUILD WEEK 06", "APPROACH SHOT")
               note: lowercase detail (e.g. "Steel up, plywood pending.")
sections     → Array of section blocks and/or quote blocks (see below)
signoff      → author, role, date
tags         → 3–6 chips. Include cat label + year (e.g. "Year 26")
```

### Section block
```js
{
  n: "01",           // two-digit string, sequential
  title: "...",      // Sentence case, no period. Short — 2–5 words.
  paragraphs: [
    { lede: true, text: "..." },   // first paragraph only — renders drop-cap
    { text: "..." },
  ]
}
```

### Quote block
```js
{
  quote: "...",   // The spoken line, no quotes in the string — renderer adds them
  cite: "— Name, context",   // em-dash, lowercase context
}
```
Use quote blocks sparingly — one per article is usually enough. They break flow by design.

---

## The dek

The dek appears under the title in smaller type. It should:
- Restate the premise with one new piece of information
- Not repeat the title word-for-word
- Be 1–2 sentences. If it needs three, cut one.

**Good:** *"Three months. Two welders. One near-disaster involving a forklift, a steel plate, and a deeply patient electrician. The making of the 45° room, in our own words."*

**Bad:** *"In this article we talk about how the cave was built and what it was like."*

---

## Sections

- Aim for **3–5 sections** per full article. Fewer feels thin; more starts to feel like a listicle.
- Titles in **sentence case**, no period: "45 or nothing", "First send", "What the approach doesn't tell you"
- The **first paragraph** of the first section should have `lede: true` — it gets a drop-cap. Make it count. Don't start with "The" if you can avoid it. Don't start with a quote.
- Each section should be able to stand alone — a reader skimming via TOC should still get the idea.

---

## Paragraphs

- **Max 4–5 sentences.** If a paragraph runs longer, it almost always wants to be two.
- **No transition filler.** Don't write "Having said that," "Moving on," "It's worth noting." Just go.
- Dialogue is good. Use it sparingly and don't attribute every line if the speaker is obvious from context.
- Numbers: write out one through nine, use digits for 10 and above. Exception: grades ("6c", "V7"), times ("06:30"), and measurements are always digits.

---

## The signoff

```js
signoff: {
  author: "P. Sherpa",        // Initial + surname, or full name. No titles.
  role: "Head Setter",        // One role, present tense
  date: "01.06.26",           // DD.MM.YY — publish date, not event date
}
```

The signoff is a byline, not a sign-off letter. Don't add "Thanks for reading" or similar.

---

## Tags

3–6 tags as short chips. Conventions:
- Include the category label: `"Event"`, `"Story"`, `"Rock Day"`
- Include the year: `"Year 26"`
- Add the location if relevant: `"Nagarjun"`, `"Main Wall"`
- Add topic chips: `"Cave"`, `"Setting"`, `"Trip Report"`, `"Competition"`
- No hashtags, no punctuation in tag strings

---

## Caption

```js
caption: {
  lead: "APPROACH SHOT",       // ALL-CAPS, 2–4 words, describes the image moment
  note: "Granite slabs, 06:45 am.",   // lowercase, brief, can be a fragment
}
```

If you don't have a real image yet, use `"PLACEHOLDER"` as lead and `"Photo incoming."` as note rather than leaving it blank.

---

## What not to do

- Don't hype the gym. The writing should make someone want to come, not tell them to.
- Don't use `!!!` or ellipsis `...` for effect. Neither.
- Don't editorialize on grades ("the brutal 7a", "an accessible 5c"). Just name them.
- Don't pad to hit a word count. A 400-word article that's tight beats an 800-word one that wanders.
- Don't start three sentences in a row with the same word.
- Don't use "journey", "community", "passion", "stoked", "psych" (or "psyched"). The gym has its own language — use it.

---

## Rock Day checklist

Rock Day reports should include, somewhere in the article:
- Exact depart time and meet point
- Approach notes (time, terrain, anything surprising)
- At least one grade with honest commentary
- Return time (actual, not planned if they differed)
- One thing that went wrong or unexpected — this is what people actually want to read

---

## Excerpt (index row)

The `excerpt` field appears on the index list, not in the article. It should:
- Be 1–2 sentences, max ~25 words
- Give away one concrete detail that makes someone want to click
- Not repeat the title

**Good:** *"Granite eggs, six leeches, one sandbagged 6c that took the whole afternoon. Photos, beta, and the exact bus you want."*

**Bad:** *"Read about our recent trip to Nagarjun where we had a great time climbing outdoors."*

---

## Quick reference — data format

```js
// POSTS entry
{
  id: 4,                         // unique integer, never reused
  cat: "story",                  // "event" | "story" | "rock"
  date: "DD.MM.YY",
  title: "Title In Title Case",
  excerpt: "One or two punchy sentences.",
  read: "5 min",                 // round to nearest minute
  img: "img/stories/slug.jpg",
  tag: "Context // Location",    // shown in row meta
  pinned: true,                  // optional — use sparingly
  details: { ... },              // optional — event/rock day only
}

// Date format for details fields: "DD.MM.YY" or human-readable ("06:30 from gym")
// Allowed detail keys: time, date, dates, depart, returns, location,
//                      capacity, grades, ages, access, lodging, entry, meet
```
