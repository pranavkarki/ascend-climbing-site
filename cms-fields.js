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
// `sub` groups fields into a labelled, visually-separated block in the editor
//   (e.g. "Boulder Pass", "Ages 6-8", "w/ Shoes"). Fields with the same `sub`
//   render together under that heading.
//
// To make a NEW element editable: add data-cms="group.key" in the HTML, then add
// a matching field entry below. Nothing else to wire up.
// =============================================================================

const CMS_FIELDS = {
  groups: [
    {
      id: "landing", label: "Landing / Hero", file: "index.html",
      fields: [
        { key: "landing.brand",   label: "Brand title",   type: "text", sub: "Hero" },
        { key: "landing.sub",     label: "Location line",  type: "text", sub: "Hero" },
        { key: "landing.tagline", label: "Tagline",        type: "text", sub: "Hero" },
      ],
    },
    {
      id: "daypasses", label: "Day Passes", file: "index.html",
      fields: [
        { key: "heading.daypasses",     label: "Section heading", type: "text", sub: "Section" },
        { key: "daypass.boulder.name",  label: "Name",  type: "text",  sub: "Boulder Pass" },
        { key: "daypass.boulder.desc",  label: "Description", type: "text", sub: "Boulder Pass" },
        { key: "price.daypass.boulder", label: "Price", type: "price", sub: "Boulder Pass" },
        { key: "daypass.full.name",     label: "Name",  type: "text",  sub: "Full Experience" },
        { key: "daypass.full.desc",     label: "Description", type: "text", sub: "Full Experience" },
        { key: "price.daypass.full",    label: "Price", type: "price", sub: "Full Experience" },
      ],
    },
    {
      id: "memberships", label: "Memberships", file: "index.html",
      fields: [
        { key: "heading.memberships",        label: "Section heading", type: "text", sub: "Section" },
        { key: "perk.belay",                 label: "Belay rate", type: "text", sub: "Perks" },
        { key: "perk.chalk",                 label: "Chalk rate", type: "text", sub: "Perks" },
        { key: "price.member.shoes.1m",      label: "1 Month",  type: "price", sub: "w/ Shoes" },
        { key: "price.member.shoes.3m",      label: "3 Months", type: "price", sub: "w/ Shoes" },
        { key: "price.member.shoes.6m",      label: "6 Months", type: "price", sub: "w/ Shoes" },
        { key: "price.member.shoes.annual",  label: "Annual",   type: "price", sub: "w/ Shoes" },
        { key: "price.member.noshoes.1m",    label: "1 Month",  type: "price", sub: "w/o Shoes" },
        { key: "price.member.noshoes.3m",    label: "3 Months", type: "price", sub: "w/o Shoes" },
        { key: "price.member.noshoes.6m",    label: "6 Months", type: "price", sub: "w/o Shoes" },
        { key: "price.member.noshoes.annual",label: "Annual",   type: "price", sub: "w/o Shoes" },
      ],
    },
    {
      id: "kids", label: "Kids Courses", file: "index.html",
      fields: [
        { key: "heading.kids",               label: "Section heading", type: "text", sub: "Section" },
        { key: "course.kids.6_8.name",       label: "Name",     type: "text",     sub: "Ages 6-8" },
        { key: "course.kids.6_8.schedule",   label: "Schedule", type: "schedule", sub: "Ages 6-8" },
        { key: "price.kids.6_8",             label: "Price",    type: "price",    sub: "Ages 6-8" },
        { key: "course.kids.9_12.name",      label: "Name",     type: "text",     sub: "Ages 9-12" },
        { key: "course.kids.9_12.schedule",  label: "Schedule", type: "schedule", sub: "Ages 9-12" },
        { key: "price.kids.9_12",            label: "Price",    type: "price",    sub: "Ages 9-12" },
        { key: "course.kids.13_16.name",     label: "Name",     type: "text",     sub: "Ages 13-16" },
        { key: "course.kids.13_16.schedule", label: "Schedule", type: "schedule", sub: "Ages 13-16" },
        { key: "price.kids.13_16",           label: "Price",    type: "price",    sub: "Ages 13-16" },
      ],
    },
    {
      id: "adult", label: "Adult Courses", file: "index.html",
      fields: [
        { key: "heading.adult",                      label: "Section heading", type: "text", sub: "Section" },
        { key: "course.adult.fundamentals.name",     label: "Name",     type: "text",     sub: "Fundamentals" },
        { key: "course.adult.fundamentals.schedule", label: "Schedule", type: "schedule", sub: "Fundamentals" },
        { key: "price.adult.fundamentals",           label: "Price",    type: "price",    sub: "Fundamentals" },
        { key: "course.adult.womens.name",           label: "Name",     type: "text",     sub: "Women's Bouldering" },
        { key: "course.adult.womens.schedule",       label: "Schedule", type: "schedule", sub: "Women's Bouldering" },
        { key: "price.adult.womens",                 label: "Price",    type: "price",    sub: "Women's Bouldering" },
        { key: "course.adult.lead.name",             label: "Name",     type: "text",     sub: "Lead Climbing" },
        { key: "course.adult.lead.schedule",         label: "Schedule", type: "schedule", sub: "Lead Climbing" },
        { key: "price.adult.lead",                   label: "Price",    type: "price",    sub: "Lead Climbing" },
      ],
    },
    {
      id: "rockday", label: "Rock Day", file: "index.html",
      fields: [
        { key: "heading.rockday",            label: "Section heading", type: "text",     sub: "Section" },
        { key: "text.rockday.desc",          label: "Description",     type: "textarea", sub: "Section" },
        { key: "price.rockday.member.4",     label: "4 persons (per person)", type: "price", sub: "Members" },
        { key: "text.rockday.member_note",   label: "Members note",    type: "textarea", sub: "Members" },
        { key: "price.rockday.nonmember.1",  label: "1 person",  type: "price", sub: "Non-Members (total)" },
        { key: "price.rockday.nonmember.2",  label: "2 persons", type: "price", sub: "Non-Members (total)" },
        { key: "price.rockday.nonmember.3",  label: "3 persons", type: "price", sub: "Non-Members (total)" },
        { key: "price.rockday.nonmember.4",  label: "4 persons", type: "price", sub: "Non-Members (total)" },
      ],
    },
    {
      id: "amenities", label: "Amenities / About", file: "index.html",
      fields: [
        { key: "heading.activities",    label: "Heading",     type: "text",     sub: "Activities intro" },
        { key: "text.activities_intro", label: "Intro text",  type: "textarea", sub: "Activities intro" },
        { key: "heading.amenities",     label: "Heading",     type: "text",     sub: "Amenities" },
        { key: "heading.cafe",          label: "Heading",     type: "text",     sub: "Cafe feature" },
        { key: "text.feature.cafe",     label: "Description",  type: "textarea", sub: "Cafe feature" },
        { key: "heading.training",      label: "Heading",     type: "text",     sub: "Training Room feature" },
        { key: "text.feature.training", label: "Description",  type: "textarea", sub: "Training Room feature" },
        { key: "heading.about",         label: "Heading",     type: "text",     sub: "About" },
        { key: "text.about",            label: "Body",        type: "textarea", sub: "About" },
      ],
    },
    {
      id: "cafe", label: "Cafe Menu", file: "cafe.html",
      fields: [
        { key: "cafe.coffee.espresso",     label: "Espresso/Doppio",  type: "text", sub: "Coffee" },
        { key: "cafe.coffee.americano",    label: "Americano",        type: "text", sub: "Coffee" },
        { key: "cafe.coffee.cappuccino",   label: "Cappuccino/Latte", type: "text", sub: "Coffee" },
        { key: "cafe.tea.black",           label: "Black/Milk/Lemon", type: "text", sub: "Tea & Refreshers" },
        { key: "cafe.tea.iced",            label: "Iced Tea",         type: "text", sub: "Tea & Refreshers" },
        { key: "cafe.tea.hotlemon",        label: "Hot Lemon",        type: "text", sub: "Tea & Refreshers" },
        { key: "cafe.food.momo",           label: "Momo",             type: "text", sub: "Food" },
        { key: "cafe.food.chowmein",       label: "Chowmein",         type: "text", sub: "Food" },
        { key: "cafe.food.friedrice",      label: "Fried Rice",       type: "text", sub: "Food" },
        { key: "cafe.food.sandwich",       label: "Sandwich",         type: "text", sub: "Food" },
        { key: "cafe.food.honeybanana",    label: "Honey Banana PB",  type: "text", sub: "Food" },
        { key: "cafe.food.chickensalad",   label: "Grilled Chicken Salad", type: "text", sub: "Food" },
        { key: "cafe.food.veggiesalad",    label: "Mix Veggie Salad", type: "text", sub: "Food" },
        { key: "cafe.sides.fries",         label: "French Fries",     type: "text", sub: "Sides" },
        { key: "cafe.sides.chillichicken", label: "Chilli Chicken",   type: "text", sub: "Sides" },
        { key: "cafe.sides.hotwings",      label: "Hot Wings",        type: "text", sub: "Sides" },
        { key: "cafe.sides.sandeko",       label: "Chicken Sandeko",  type: "text", sub: "Sides" },
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
