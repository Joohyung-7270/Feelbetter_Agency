# FeelBetter 스토어 테스트 보고서 (2026-10-04)

대상: `shop.feelbetter.agency` (Shopify · Advanced 플랜 · 라이브 테마 "FeelBetter Dawn" #188839690470), Feelbetter 앱(로컬 `localhost:3003`, 브랜치 `concierge-shopify`), FeelBetter Workspace(Town).

## 1. 한 줄 요약

- 스토어 페이지 **119개(7개 언어) · 내부 링크 119개 모두 200**, Liquid/번역 오류 0건 (`docs/QA_REPORT.md`).
- 요청 → 접수 → 제작(상품 등록) → 링크 메일 → **주문 → `ordered` 상태 반영**까지 실제로 동작했습니다 (FB-00003 · 주문 #1001).
- **오픈 전 반드시 할 일 3가지**: 결제 수단 설정(현재 없음), 스토어 비밀번호 해제(UCP·Agentic 활성 조건), Vercel 환경변수 + PR #8 머지.

## 2. 테스트 결과

| # | 항목 | 방법 | 결과 | 비고 |
|---|---|---|---|---|
| 1 | 요청 접수 | `POST /api/request` (ko, 사진 없음) | ✅ FB-00005 `received`, 추적 `/ko/r/FB-00005` | AI 브리프 생성됨 |
| 2 | Town 자동 가져가기 | Town을 `localhost:3003`에 연결해 재시작, 요청함 폴링 | ⚠️ 폴링 안 함 | 웹 검색 가능한 팀원이 출근 상태가 아니라 설계대로 건너뜀 (아래 6-④) |
| 3 | Town `/컨시어지 FB-00005` 직접 실행 | 명령 API | ⚠️ `needs_human` | 소싱 담당 체인: 제미나이 **한도**(10/7까지) → Claude **터미널 미로그인** → 커서(웹 도구 거절). 흐름 자체(claim · 아마존 후보 수집 · 실패 시 요청함 반환)는 정상 |
| 4 | 작업자 API로 제작 | 사람이 소싱한 매치를 `POST /api/concierge/fulfill` | ⚠️ `needs_human` | 검증기가 Amazon.co.jp 페이지의 "out of stock" 문구(다른 오퍼·변형)를 품절로 판단. 안전장치는 작동, 대형 마켓 페이지에서 **오탐** 가능 — 7-① 참고 |
| 5 | 제작 → 링크 메일 (기존) | FB-00003/4 (`demo`, `radar-test`) | ✅ `sent` | 상품 FB-00003 라이브, 인보이스 메일 수신 확인(이전 세션) |
| 6 | 테스트 주문 | Admin API 드래프트 주문 → 완료(결제 완료 표시) | ✅ 주문 **#1001** PAID ₩150,000 | 수신자 feelbetter.startup@gmail.com, 태그 `test` — 주문 확인 메일 Shopify가 발송 |
| 7 | 주문 → 요청 상태 | `orders/paid` 웹훅 모사(HMAC 서명) → 로컬 앱 | ✅ `matched 1` → FB-00003 **`ordered`** | 잘못된 서명 → **401** 확인. Flow용 `/api/concierge/order`도 주문 재조회 정상 |
| 8 | 체크아웃 화면 | 스토어프론트 → Buy now | ✅ 브랜드 체크아웃(네이비 헤더 · 세리프) 렌더 | PayPal 익스프레스 버튼 노출, **결제 제공업체 미설정** |
| 9 | 7개 언어 URL | QA 크롤러 (`scripts/shopify-qa.mjs`) | ✅ 119/119 | 처음엔 `/ko` 등 전부 404 → **마켓 도메인에 언어 6개 배정**해서 해결. 중국어 경로는 `/zh` |
| 10 | 번역 등록 | 테마 JSON 252건 · 페이지 제목 4건 · 저널 300건 | ✅ | `shopify-translations.mjs`, `shopify-blog.mjs` |
| 11 | SEO/GEO | 라이브 HTML 검사 | ✅ | title/meta description/og:image(브랜드 카드 1200×630)/hreflang 36/JSON-LD(Organization · WebSite+SearchAction · HowTo · FAQPage · Article · BreadcrumbList) 모두 유효, robots.txt에 AI 크롤러 14종 허용 + sitemap |
| 12 | 블로그 | 저널 10편 × 7개 언어 | ✅ `/blogs/journal` | 홈에 최신 3편 스트립, 기사 템플릿 FeelBetter 스타일 |
| 13 | UCP | `/.well-known/ucp`, Agentic 채널 | ⚠️ 준비 완료 · 비활성 | Shopify가 자동 관리(ChatGPT · Copilot · Shop), 카탈로그 접근 ✅ 정책 ✅. **비밀번호 해제 + 상품 이미지**가 있어야 활성 |
| 14 | 무료 앱 | 설치 | ✅ Forms, Search & Discovery 추가 | 기존: Flow, Messaging(=Shopify Email), Translate & Adapt. Knowledge Base는 Advanced 플랜에서 **월 $50** → 미설치 |
| 15 | 테마 품질 | `shopify theme check` | ✅ 오류 0 (경고 9건은 Dawn 기본) | git `Feelbetter_Agency@adc528e` |
| 16 | 앱 타입체크 | `npm run typecheck` | ✅ | git `Feelbetter@004a341` (PR #8) |

## 3. 오픈 가능 여부

**지금은 "소프트 오픈 직전" 상태입니다.** 아래 블로커를 처리하면 오픈할 수 있습니다.

| 구분 | 항목 | 왜 |
|---|---|---|
| 🔴 블로커 | 결제 제공업체 없음 (설정 → 결제: PayPal 설정 미완료) | 고객이 결제할 수 없음. PayPal 완료 또는 국내 PG(Eximbay · KG이니시스 · 토스 등 Shopify 지원 업체) 연결 |
| 🔴 블로커 | Vercel 환경변수 + PR #8 머지 + `node scripts/shopify-webhooks.mjs` | feelbetter.agency 가 요청함 API를 아직 못 받음 → Town·Flow·웹훅이 운영 서버에 붙지 않음 |
| 🔴 블로커 | 스토어 비밀번호(비공개 모드) 해제 | 고객 접근 + UCP/Agentic/카탈로그 활성 조건 |
| 🟡 권장 | Town의 Claude 터미널 로그인 | 지금은 소싱 가능한 AI가 없어 요청이 사람 차례로 감. `claude auth login` 한 번 |
| 🟡 권장 | RESEND_API_KEY · MAIL_FROM | 링크 메일을 Shopify 인보이스 대신 브랜드 메일(Resend)로. DNS는 이미 끝남 |
| 🟡 권장 | 환영/생일 자동화 (Messaging) | 템플릿은 있으나 iframe이라 자동 클릭이 안 됨 — 6-⑤ 수동 2분 |
| 🟢 선택 | 데모 상품 FB-00003 · 테스트 주문 #1001 정리 | 보관(archive) 처리 |

## 4. 이번에 구성한 것

- **스토어**: About · For AI assistants 페이지, 저널 블로그, 메뉴(메인 6 · 푸터 7), 7개 언어 도메인 배정, 홈 SEO 제목, 테스트 주문.
- **테마(라운드 4)**: 저널 목록/기사/홈 스트립, FAQ 섹션(How it works), `feelbetter-seo` JSON-LD, meta 설명 폴백, OG 브랜드 카드, `robots.txt.liquid`(AI 크롤러), llms.txt 성격의 `/pages/for-ai-assistants`, 로컬라이즈 홈 타이틀, 저널 링크를 스토어 저널로.
- **앱 스크립트**: `shopify-blog.mjs`(저널 업로드 · 7개 언어), `shopify-qa.mjs`(크롤 QA · 리포트), `shopify-setup.mjs`(About/저널/AI 페이지·메뉴), `shopify-translations.mjs`(페이지 제목 매칭 수정).
- **콘텐츠**: `content/blog/*.json` 10편(two sites · inside the hour · verify sellers · photo request · one link · price · UCP · gifts · sold-out · how to write), 각 7개 언어 + FAQ.

## 5. 필요한 API · 키 목록

| 키 | 용도 | 상태 | 넣는 곳 |
|---|---|---|---|
| `SHOPIFY_CLIENT_ID` / `SHOPIFY_CLIENT_SECRET` | Admin API(상품 · 드래프트 주문 · 번역 · 메뉴 · 정책 · 웹훅 서명) | ✅ 있음 (`.env.local`) | Vercel env |
| `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_STOREFRONT_URL` | 스토어 식별 · 링크 생성 | ✅ | Vercel env |
| `CONCIERGE_TOKEN` | 작업자(Town · Flow · 크론) 인증 | ✅ (Supabase vault와 동일) | Vercel env · `town.config.local.json` |
| Supabase URL · anon · service role | 요청함 DB | ✅ (프로젝트 AutoFeelbetter) | Vercel env |
| `RESEND_API_KEY`, `MAIL_FROM` | 브랜드 메일 발송 | ⏳ 사용자 입력 대기 | `.env.local` · Vercel env (채팅에 붙여 주시면 제가 저장) |
| `ANTHROPIC_API_KEY` (선택) | Town이 없을 때 API 모드 소싱(웹 검색) | ⏳ | Vercel env (`CONCIERGE_SOURCER=api`) |
| `CRON_SECRET` (선택) | Vercel 크론 보호 | ⏳ | Vercel env |
| Shopify 앱 스코프 추가 (선택) | `write_orders`(주문 취소 · 테스트 주문), `write_markets`(언어 배정 자동화) | 현재 없음 | Dev Dashboard → 앱 → 스코프 → 재설치 |
| 결제 제공업체 계정 | PayPal 비즈니스 완료 또는 국내 PG | 🔴 없음 | Shopify 설정 → 결제 |
| Google Merchant Center / Google & YouTube 채널 | Google AI Mode · Gemini(UCP) 노출 | ⏳ | 판매 채널 추가 후 구글 계정 연결 |
| Shopify Knowledge Base 앱 | AI 에이전트용 FAQ(월 $50) | 선택 | 에이전틱 채널 → Knowledge Base |
| Claude CLI 로그인 (Town) | 소싱 · 상세 문구 담당 | 🔴 미로그인 | 터미널에서 `claude auth login` |
| Gemini(Antigravity) · Codex · Cursor 로그인 | Town 팀원 | ✅ (제미나이는 한도, 10/7 리셋) | — |
| Discord 채널 ID | Town 완료 알림 | ✅ | `town.config.local.json` |

## 6. 사용자가 직접 할 일 (순서대로)

1. **Vercel 환경변수** 입력 후 **PR #8 머지** → 배포 뒤 `cd feelbetter && node scripts/shopify-webhooks.mjs` 실행 (orders/paid 웹훅 등록).
2. **결제 설정**: Shopify 설정 → 결제 → 공급업체 선택(또는 PayPal 설정 완료).
3. **비밀번호 해제**: 온라인 스토어 → 기본 설정 → 비공개 모드 끄기 (해제 후 `/.well-known/ucp` 공개, 에이전틱 채널 자동 활성).
4. **Town**: 터미널에서 `claude auth login` 후 Town 재시작(지금은 터미널 탭 "Town server"에서 `npm start`로 다시 켜 두었습니다. 운영 URL `https://feelbetter.agency`를 바라봅니다).
5. **환영 · 생일 메일 (2분)**: 마케팅 → 자동화 → "할인 이메일로 신규 가입자 환영" 템플릿 → 할인 코드 **WELCOME10** → 켜기. 생일: Flow → 템플릿 "Send birthday discount" 검색 → 코드 **BIRTHDAY15** → 켜기. (생일 수집은 Forms 앱의 팝업 양식에 생일 필드 추가.)
6. **RESEND_API_KEY**를 채팅에 붙여 주시면 `.env.local`에 저장합니다(화면에 출력하지 않음).
7. 데모 상품(FB-00003) · 테스트 주문 #1001은 오픈 전에 보관 처리.

## 7. 다음 개선 제안

1. **판매 페이지 검증기 오탐**: 대형 마켓 페이지는 다른 오퍼의 "품절" 문구가 섞여 있어 `needs_human`으로 빠집니다. 작업자가 `in_stock: true`를 높은 신뢰도로 보고하면 경고로만 남기도록 바꾸는 편이 운영에 맞습니다. (이번 세션에서는 자동 승인 정책이 이 변경을 막아 **그대로 두었습니다** — 원하시면 지시해 주세요.)
2. Town 소싱 체인에 Codex(웹 검색 가능)를 추가하면 제미나이 한도 · Claude 로그인에 덜 흔들립니다.
3. 상품 이미지: 아마존 CDN 이미지는 Shopify가 거부할 수 있어 Radar가 이미지를 받아 Files로 올리는 경로가 안전합니다.
4. 오픈 후 Google Search Console 등록 · sitemap 제출, Shop 채널 활성 확인.

## 8. 산출물 위치

- QA 크롤 리포트: `docs/QA_REPORT.md` · 이 보고서: `docs/TEST_REPORT.md` (Feelbetter_Agency)
- 테마 커밋 `adc528e` (main) · 앱 커밋 `004a341` (`concierge-shopify`, PR #8)
