# Catalog content (shop.feelbetter.agency products from the smartstore)

One JSON per product, exported from Sourcing Radar by `Feelbetter/feelbetter/scripts/radar-export.mjs` and uploaded by
`Feelbetter/feelbetter/scripts/shopify-catalog.mjs` (products · variants · images · collections · 7-locale translations).

Exported (do not edit): `id, handle, group (carhartt|plush|otamatone), vendor, source_url, naver_no, price_krw, list_price_krw,
source_price, source_currency, origin, weight_g, options[{name, values[{label, add_price}]}], images[], en{title,bullets,description,specs}, ko{…Radar copy…}`.

Writers fill `locales` — one entry per locale `en, ko, ja, zh-CN, es, de, fr`, all with the same shape:

```json
"locales": {
  "en": {
    "title": "≤ 70 chars, brand + product + key attribute (customer-facing, no ALL CAPS, no emoji)",
    "meta_title": "≤ 60 chars",
    "meta_description": "120–160 chars (EN/ES/DE/FR) · 80–120 (KO/JA/ZH)",
    "headline": "one line: what it is + the biggest benefit",
    "intro": "2–3 sentences. Why someone wants it, what we checked, where it ships from.",
    "highlights": ["4–6 one-sentence benefits (feature → why it matters)"],
    "sections": [{ "h": "2–3 short sections", "p": "2–4 sentences each (use, size/fit, who it's for, care…)" }],
    "specs": [{ "label": "Brand", "value": "…" }],         // 6–10 rows from en.specs + ko.spec_rows; units in the locale's convention (cm and inch for en)
    "faq": [{ "q": "…", "a": "…" }],                       // 3–4 pairs, see FACTS
    "cautions": ["0–3 short notes (plug type, sizing runs large, batteries not included…)"],
    "options": [{ "name": "Color", "values": ["White", "Black"] }]   // same order/count as the exported options; translate names and values
  }
}
```

FACTS for every locale (state only these; never invent certifications, stock counts, ratings or warranty terms):
- FeelBetter buys the item from the overseas seller after the order and ships to the customer (overseas purchase on demand). Typical delivery 7–14 business days after ordering; tracking is sent by email.
- Each item is sourced from an official or authorised seller and checked by a concierge (model, variant, stock, price) before listing.
- Price shown is the final KRW price for Korea; items whose seller price is over USD 150 may incur Korean customs duty, which is noted on the page when it applies (Carhartt jackets qualify).
- Returns/exchanges follow the store's refund policy (`/policies/refund-policy`); overseas-purchase items cannot be cancelled once the seller order is placed, except for defects or wrong items.
- Questions or a different variant → the concierge: `/pages/request`.
- Brand/product facts come from `en.bullets`, `en.description`, `en.specs` and the Korean copy in `ko` — reuse them, do not add features that are not there.

Voice: warm, concrete, plain; no hype. KO 해요체 · JA です・ます · ZH 简体 · ES usted · DE Sie · FR vous. Keep brand names in Latin script.

## Lite mode (bulk catalog, 200+ products)

For the bulk import the uploader fills `specs` (from `en.specs` with translated labels), `faq` (standard shipping / genuine / returns
answers) and `options` (dictionary) by itself. Writers only need, per locale: `title`, `meta_title`, `meta_description`, `headline`,
`intro` (2 sentences), `highlights` (4–5), `sections` (1–2 × 2–3 sentences), `cautions` (0–2). Add `specs`/`faq`/`options` only when
the product needs something specific (sizing table, battery note, licensed-character spelling). Same FACTS and voice as above.
