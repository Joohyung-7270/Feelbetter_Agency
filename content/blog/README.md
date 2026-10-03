# Journal content (shop.feelbetter.agency/blogs/journal)

One JSON file per article: `content/blog/<slug>.json`. Uploaded by
`Feelbetter/feelbetter/scripts/shopify-blog.mjs` (creates the `journal` blog, the articles in English, and
registers the other six locales with `translationsRegister`). Re-running updates in place (matched by handle).

```json
{
  "slug": "why-two-sites",                // article handle (ASCII, hyphens)
  "published": "2026-10-04",              // ISO date; the uploader sets publishedAt
  "tags": ["concierge", "company"],       // 2–4 lowercase tags
  "author": "FeelBetter Concierge",
  "image": {
    "url": "https://images.unsplash.com/photo-XXXX?w=1600&q=80",  // Unsplash only (free licence)
    "alt": "English alt text"
  },
  "locales": {
    "en":    { "title": "", "excerpt": "", "meta_title": "", "meta_description": "", "body_html": "" },
    "ko":    { ... }, "ja": { ... }, "zh-CN": { ... }, "es": { ... }, "de": { ... }, "fr": { ... }
  }
}
```

Field rules
- `title` ≤ 70 chars. `meta_title` ≤ 60 chars (may equal title). `meta_description` 120–160 chars (EN/ES/DE/FR) or 80–120 (KO/JA/ZH).
- `excerpt`: one or two plain sentences (no HTML), shown on the journal index and as `summary_html`.
- `body_html`: allowed tags only — `<p> <h2> <h3> <ul> <ol> <li> <strong> <em> <a href> <blockquote> <table> <thead> <tbody> <tr> <th> <td>`.
  No inline styles, no images, no scripts. 450–750 English words (other languages equivalent length), 3–5 `<h2>` sections,
  and END with `<h2>FAQ</h2>` followed by 2–3 `<h3>question</h3><p>answer</p>` pairs (used for FAQ structured data).
- Internal links use locale-relative paths that the theme rewrites: `/pages/request`, `/pages/how-it-works`, `/pages/about`,
  `/blogs/journal/<slug>`. Links to the agency site: `https://feelbetter.agency/<en|ko|ja|es>/...` (de/fr/zh-CN link to `/en/`).
- Every locale is a native-quality adaptation (not a literal translation): natural idiom, same facts, same structure.
