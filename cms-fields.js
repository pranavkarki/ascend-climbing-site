// =============================================================================
// CMS FIELD CONFIG — single source of truth for the Site Content editor.
// =============================================================================
// Loaded BOTH in the browser (admin.html → window.CMS_FIELDS) and in the
// serverless API (require('../cms-fields.js')). Keep it free of any browser- or
// node-only APIs.
//
// Each field's `key` must match a `data-cms="<key>"` attribute in the HTML file
// named by its group's `file`. The API reads/writes only the inner text of those
// marked elements — it never changes surrounding markup, so layout can't break.
//
// `type` drives the input widget + validation in the admin UI:
//   price     — short text, expected to contain a number (e.g. "NPR 9000")
//   text      — single-line text
//   textarea  — multi-line paragraph
//   schedule  — single-line text (course day/time string)
//
// To make a NEW element editable: add data-cms="group.key" in the HTML, then add
// a matching field entry below. Nothing else to wire up.
// =============================================================================

const CMS_FIELDS = {
  groups: [
    {
      id: "landing", label: "Landing / Hero", file: "index.html",
      fields: [
        { key: "landing.brand",   label: "Brand title",  type: "text" },
        { key: "landing.sub",     label: "Location line", type: "text" },
        { key: "landing.tagline", label: "Tagline",       type: "text" },
      ],
    },
    {
      id: "daypasses", label: "Day Passes", file: "index.html",
      fields: [
        { key: "heading.daypasses",   label: "Section heading",     type: "text" },
        { key: "daypass.boulder.name", label: "Boulder — name",     type: "text" },
        { key: "daypass.boulder.desc", label: "Boulder — desc",     type: "text" },
        { key: "price.daypass.boulder", label: "Boulder — price",   type: "price" },
        { key: "daypass.full.name",   label: "Full Experience — name", type: "text" },
        { key: "daypass.full.desc",   label: "Full Experience — desc", type: "text" },
        { key: "price.daypass.full",  label: "Full Experience — price", type: "price" },
      ],
    },
    {
      id: "memberships", label: "Memberships", file: "index.html",
      fields: [
        { key: "heading.memberships",        label: "Section heading",   type: "text" },
        { key: "perk.belay",                 label: "Perk — belay rate", type: "text" },
        { key: "perk.chalk",                 label: "Perk — chalk rate", type: "text" },
        { key: "price.member.shoes.1m",      label: "w/ Shoes — 1 Month",  type: "price" },
        { key: "price.member.shoes.3m",      label: "w/ Shoes — 3 Months", type: "price" },
        { key: "price.member.shoes.6m",      label: "w/ Shoes — 6 Months", type: "price" },
        { key: "price.member.shoes.annual",  label: "w/ Shoes — Annual",   type: "price" },
        { key: "price.member.noshoes.1m",    label: "w/o Shoes — 1 Month",  type: "price" },
        { key: "price.member.noshoes.3m",    label: "w/o Shoes — 3 Months", type: "price" },
        { key: "price.member.noshoes.6m",    label: "w/o Shoes — 6 Months", type: "price" },
        { key: "price.member.noshoes.annual",label: "w/o Shoes — Annual",   type: "price" },
      ],
    },
    {
      id: "kids", label: "Kids Courses", file: "index.html",
      fields: [
        { key: "heading.kids",                label: "Section heading", type: "text" },
        { key: "course.kids.6_8.name",        label: "Ages 6-8 — name",     type: "text" },
        { key: "course.kids.6_8.schedule",    label: "Ages 6-8 — schedule", type: "schedule" },
        { key: "price.kids.6_8",              label: "Ages 6-8 — price",    type: "price" },
        { key: "course.kids.9_12.name",       label: "Ages 9-12 — name",     type: "text" },
        { key: "course.kids.9_12.schedule",   label: "Ages 9-12 — schedule", type: "schedule" },
        { key: "price.kids.9_12",             label: "Ages 9-12 — price",    type: "price" },
        { key: "course.kids.13_16.name",      label: "Ages 13-16 — name",     type: "text" },
        { key: "course.kids.13_16.schedule",  label: "Ages 13-16 — schedule", type: "schedule" },
        { key: "price.kids.13_16",            label: "Ages 13-16 — price",    type: "price" },
      ],
    },
    {
      id: "adult", label: "Adult Courses", file: "index.html",
      fields: [
        { key: "heading.adult",                    label: "Section heading", type: "text" },
        { key: "course.adult.fundamentals.name",   label: "Fundamentals — name",     type: "text" },
        { key: "course.adult.fundamentals.schedule", label: "Fundamentals — schedule", type: "schedule" },
        { key: "price.adult.fundamentals",         label: "Fundamentals — price",    type: "price" },
        { key: "course.adult.womens.name",         label: "Women's — name",     type: "text" },
        { key: "course.adult.womens.schedule",     label: "Women's — schedule", type: "schedule" },
        { key: "price.adult.womens",               label: "Women's — price",    type: "price" },
        { key: "course.adult.lead.name",           label: "Lead — name",     type: "text" },
        { key: "course.adult.lead.schedule",       label: "Lead — schedule", type: "schedule" },
        { key: "price.adult.lead",                 label: "Lead — price",    type: "price" },
      ],
    },
    {
      id: "rockday", label: "Rock Day", file: "index.html",
      fields: [
        { key: "heading.rockday",            label: "Section heading", type: "text" },
        { key: "text.rockday.desc",          label: "Description",     type: "textarea" },
        { key: "price.rockday.member.4",     label: "Members — 4 persons (pp)", type: "price" },
        { key: "text.rockday.member_note",   label: "Members note",    type: "textarea" },
        { key: "price.rockday.nonmember.1",  label: "Non-members — 1 person",  type: "price" },
        { key: "price.rockday.nonmember.2",  label: "Non-members — 2 persons", type: "price" },
        { key: "price.rockday.nonmember.3",  label: "Non-members — 3 persons", type: "price" },
        { key: "price.rockday.nonmember.4",  label: "Non-members — 4 persons", type: "price" },
      ],
    },
    {
      id: "amenities", label: "Amenities / About", file: "index.html",
      fields: [
        { key: "heading.activities",       label: "Activities heading", type: "text" },
        { key: "text.activities_intro",    label: "Activities intro",   type: "textarea" },
        { key: "heading.amenities",        label: "Amenities heading",  type: "text" },
        { key: "heading.cafe",             label: "Cafe — heading",     type: "text" },
        { key: "text.feature.cafe",        label: "Cafe — description", type: "textarea" },
        { key: "heading.training",         label: "Training Room — heading",     type: "text" },
        { key: "text.feature.training",    label: "Training Room — description", type: "textarea" },
        { key: "heading.about",            label: "About heading",      type: "text" },
        { key: "text.about",               label: "About body",         type: "textarea" },
      ],
    },
    {
      id: "cafe", label: "Cafe Menu", file: "cafe.html",
      fields: [
        { key: "cafe.coffee.espresso",     label: "Espresso/Doppio",  type: "text" },
        { key: "cafe.coffee.americano",    label: "Americano",        type: "text" },
        { key: "cafe.coffee.cappuccino",   label: "Cappuccino/Latte", type: "text" },
        { key: "cafe.tea.black",           label: "Black/Milk/Lemon", type: "text" },
        { key: "cafe.tea.iced",            label: "Iced Tea",         type: "text" },
        { key: "cafe.tea.hotlemon",        label: "Hot Lemon",        type: "text" },
        { key: "cafe.food.momo",           label: "Momo",             type: "text" },
        { key: "cafe.food.chowmein",       label: "Chowmein",         type: "text" },
        { key: "cafe.food.friedrice",      label: "Fried Rice",       type: "text" },
        { key: "cafe.food.sandwich",       label: "Sandwich",         type: "text" },
        { key: "cafe.food.honeybanana",    label: "Honey Banana PB",  type: "text" },
        { key: "cafe.food.chickensalad",   label: "Grilled Chicken Salad", type: "text" },
        { key: "cafe.food.veggiesalad",    label: "Mix Veggie Salad", type: "text" },
        { key: "cafe.sides.fries",         label: "French Fries",     type: "text" },
        { key: "cafe.sides.chillichicken", label: "Chilli Chicken",   type: "text" },
        { key: "cafe.sides.hotwings",      label: "Hot Wings",        type: "text" },
        { key: "cafe.sides.sandeko",       label: "Chicken Sandeko",  type: "text" },
      ],
    },
  ],

  // JSON-LD sync: after a save to index.html, the SportsActivityLocation
  // `priceRange` is recomputed from the min/max numbers found across these
  // price keys, so the SEO structured data never drifts from the visible prices.
  jsonLd: {
    priceRangeFrom: [
      "price.daypass.boulder", "price.daypass.full",
      "price.member.shoes.1m", "price.member.shoes.3m", "price.member.shoes.6m", "price.member.shoes.annual",
      "price.member.noshoes.1m", "price.member.noshoes.3m", "price.member.noshoes.6m", "price.member.noshoes.annual",
    ],
    priceCurrency: "NPR",
  },
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = CMS_FIELDS;
}
