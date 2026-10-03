# FeelBetter Dawn

A Shopify Online Store 2.0 theme for **feelbetter.agency**, built on top of an untouched copy of [Shopify Dawn](https://github.com/Shopify/dawn) v16.0.0.

FeelBetter is an AI shopping concierge. A visitor says what they want (words, a link, a photo), AI writes a sourcing brief, a human concierge verifies a seller, and within 60 minutes the visitor gets **one ready-to-buy link** by email. This store is where that link lands: every fulfilled request becomes one Shopify product (the "match card") that the customer buys.

It is not a browse-thousands-of-products marketplace. The home page is a request-first landing page; the product page is the match card.

> **Better things, for a better you.** · See it. Want it. We'll find it.

Store: `xpshtv-rr.myshopify.com` (KRW, ships worldwide). Brand brief and copy: [`docs/BRAND_FILM.md`](docs/BRAND_FILM.md).

---

## The flow

```
visitor                       Feelbetter app (feelbetter.agency)              Shopify store
-------                       ----------------------------------              -------------
1. request  ───────────────▶  POST /api/request  { prompt, email, locale,
   (home page / /pages/request)                   productUrl, source: "shopify" }
                              AI writes the sourcing brief
                              concierge verifies seller, stock, price
2.                            creates ONE product in this store  ──────────▶  product tagged `feelbetter`
                              + metafields (see below)                        template: product.feelbetter
3. email "Your link is ready" ◀──────────────────────────────────────────── /products/{handle}
4. taps Buy now  ───────────────────────────────────────────────────────▶  /cart/{variant_id}:1  (checkout)
```

The request form on the storefront talks to the Feelbetter app directly (CORS, JSON). The app must allow the storefront origin and answer:

- success `200` → `{ "ok": true, "ref": "FB-00123" }`
- error `4xx/5xx` → `{ "error": "prompt_required" | "email_invalid" | "link_invalid" | "rate_limited" | "save_failed" | ... }`

Theme settings (**Theme settings → FeelBetter**) hold the app URL, the promise in minutes (default 60), whether to show the source seller on match cards, and the concierge sender name.

## Folder map

| Path | What it is |
|---|---|
| `assets/`, `config/`, `layout/`, `locales/`, `sections/`, `snippets/`, `templates/` | Dawn 16.0.0. Treat as upstream. |
| `assets/feelbetter.css` | All styles for the FeelBetter sections (`.fb-*` classes, badges, inbox card, countdown, dotted grid, sunlight dot). |
| `assets/feelbetter-request.js` | `<feelbetter-request>` custom element: validation, POST to the app, "received" panel with countdown. |
| `sections/feelbetter-hero.liquid` | Request-first hero with the inbox preview card. |
| `sections/feelbetter-request.liquid` | Standalone request section (heading + form). |
| `sections/feelbetter-steps.liquid` | "How it works" timeline (00:00 → ≤ 60:00). |
| `sections/feelbetter-statement.liquid` | Big typographic brand statement. |
| `sections/feelbetter-match.liquid` | Product-page "MATCH FOUND" strip with badges and Buy now. |
| `snippets/feelbetter-request-form.liquid` | The form markup shared by hero and request sections. |
| `snippets/feelbetter-badges.liquid` | Compact badges (Verified seller · In stock · Ready to buy). |
| `templates/index.json`, `product.feelbetter.json`, `page.request.json`, `page.how-it-works.json`, `password.json` | FeelBetter page compositions. |
| `docs/BRAND_FILM.md` | Brand brief: copy, tone, colours. |
| `docs/DAWN_RELEASE_NOTES.md` | Dawn's own release notes for the version we forked. |

### Dawn core files we touched

Kept to a minimum so upstream merges stay easy:

- `layout/theme.liquid`, `layout/password.liquid` — load `feelbetter.css` + `feelbetter-request.js`, set `theme-color`.
- `config/settings_schema.json` — theme info + the **FeelBetter** settings group (appended).
- `config/settings_data.json` — the **FeelBetter** preset (colour schemes, fonts, radii).
- `locales/en.default.json`, `ko.json`, `ja.json`, `es.json` — a `feelbetter` namespace appended at the end.
- `templates/product.json` — one `custom_liquid` block that renders the badges.
- `sections/header-group.json`, `sections/footer-group.json` — announcement, selectors, footer blocks.

Everything else is new and prefixed `feelbetter-`.

## Metafields the Feelbetter app writes

Namespace `feelbetter`, on **products**:

| Key | Type | Used for |
|---|---|---|
| `request_ref` | single_line_text | "Request FB-00123" on the match card |
| `seller` | single_line_text | "Verified seller · {seller}" (hidden if the theme setting is off) |
| `source_url` | url | Where the concierge found it (not rendered; kept for ops) |
| `source_price` | money / text | Original price (not rendered; kept for ops) |
| `verified_at` | date_time | "Checked {date}" |
| `status` | single_line_text | `ready` → "Ready to buy"; anything else → "Being verified" |

When no metafields exist the badges fall back to "In stock" / "Ready to buy" from product availability, so manually created products still look right.

## Store setup checklist

- **Collection** `feelbetter-finds` — automatic, condition *product tag is equal to* `feelbetter`. Shown as "Recent finds" on the home page.
- **Pages** `request` (template `page.request`) and `how-it-works` (template `page.how-it-works`).
- **Menus** `main-menu` (e.g. Request · How it works · Recent finds) and `footer` (e.g. Privacy · Terms · Contact).
- **Product template**: products created by the app should use `product.feelbetter`. The default `product.json` also shows the badges.
- **Languages**: publish Korean, Japanese and Spanish in *Settings → Languages* to light up the translated copy; the request form sends the page language (`en`/`ko`/`ja`/`es`) to the app.
- **Markets**: the header shows the country and language selectors when more than one is published.

## Develop

```sh
# Shopify CLI 3.x+ (we use 4.x)
shopify theme dev --store xpshtv-rr
# or, using shopify.theme.toml
shopify theme dev -e production
```

Lint before you push:

```sh
shopify theme check
```

## Push

```sh
# first push: creates an unpublished theme called "FeelBetter Dawn"
shopify theme push --store xpshtv-rr --unpublished --theme "FeelBetter Dawn"

# later pushes to the same theme
shopify theme push --store xpshtv-rr --theme "FeelBetter Dawn"
```

For CI or any non-interactive push, create a **Theme Access** app password (or a custom app with `write_themes`) and pass it explicitly:

```sh
shopify theme push --store xpshtv-rr --theme "FeelBetter Dawn" --password "$SHOPIFY_CLI_THEME_TOKEN"
```

`config/settings_data.json` is pushed as well. It carries the FeelBetter preset, which is what you want on the first push. Once merchants start editing in the theme editor, pull it back before the next push (`shopify theme pull --only config/settings_data.json`) so their changes are not overwritten.

## Keeping up with Dawn

```sh
git remote add upstream https://github.com/Shopify/dawn.git
git fetch upstream
git merge upstream/main   # or cherry-pick a release tag
```

Because FeelBetter lives in `feelbetter-*` files and only the files listed above are edited, conflicts should be limited to `layout/theme.liquid`, `config/settings_schema.json`, the four locale files and `templates/product.json`. After a merge, run `shopify theme check` and open the home, request, product and password pages.

## License

Dawn is © Shopify Inc. and distributed under the MIT License — see [`LICENSE.md`](LICENSE.md). FeelBetter-specific files are © FeelBetter.

---

## 한국어 요약

**FeelBetter Dawn**은 feelbetter.agency를 위한 Shopify 테마입니다. Shopify Dawn 16.0.0을 그대로 두고, `feelbetter-` 접두사가 붙은 섹션·스니펫·에셋만 얹었습니다.

- **흐름**: 방문자가 원하는 걸 말하면(글·링크·사진) → Feelbetter 앱이 AI 브리프를 쓰고 컨시어지가 판매처를 검증 → 이 스토어에 상품 하나가 생성되고(`feelbetter` 태그, `product.feelbetter` 템플릿) → "링크가 준비됐어요" 메일 → **바로 구매**는 `/cart/{variant_id}:1` 체크아웃 링크입니다.
- **요청 폼**은 테마 설정(**테마 설정 → FeelBetter**)의 앱 URL로 JSON을 보냅니다. 성공 시 `{ ok: true, ref }`, 실패 시 `{ error }`.
- **메타필드**(`feelbetter.*`): `request_ref`, `seller`, `source_url`, `source_price`, `verified_at`, `status`. 없으면 재고 기준으로 "재고 있음 / 바로 구매 가능" 배지를 보여줍니다.
- **스토어 준비물**: 자동 컬렉션 `feelbetter-finds`(태그 = `feelbetter`), 페이지 `request`·`how-it-works`, 메뉴 `main-menu`·`footer`.
- **개발**: `shopify theme dev --store xpshtv-rr` · **푸시**: `shopify theme push --store xpshtv-rr --unpublished --theme "FeelBetter Dawn"` (CI는 Theme Access 토큰을 `--password`로 전달).
- **Dawn 업데이트**: `upstream`에 Dawn 저장소를 추가하고 머지합니다. 수정한 Dawn 파일은 위 목록(레이아웃 2개, config 2개, 로케일 4개, `templates/product.json`, 헤더/푸터 그룹)뿐입니다.
