# WILD MUSE — Stage 3: Frontend (all customer-facing pages)

_Completed 22 November 2026. Status: Stage 3 complete, awaiting go-ahead for Stage 4._

Every link in the storefront now leads to a real, designed page. An automated crawl of the site found
**111 internal URLs, all returning 200 — zero dead links**.

## 1. What was added

### Search & product discovery
| Feature | Details |
|---|---|
| Live search overlay | Opens from the header; debounced suggestions (products with images and prices, matching categories, result count) from `GET /api/search/suggest` |
| Search history | Last 6 searches, stored only in the visitor's browser, clearable |
| Popular searches | Configurable list (`src/config/search.ts`; admin-editable in Stage 4) |
| Search results page | `/search?q=` with result count, the full filter/sort panel, and a no-results state with suggestions + best sellers |
| Matching | Name, category/clothing type, department, colour, material, collection and description; weighted relevance; plural-tolerant and prefix matching; all words must match |
| Curated listings | `/new-arrivals`, `/best-sellers`, `/sale` (sale explains reference pricing), `/collections`, `/collections/[slug]` |

### Handmade in Nepal
Hub page plus 7 editorial pages: Our Nepal Story, Meet the Artisans, Traditional Craftsmanship, Our Materials,
Ethical Sourcing, Handmade Collections, Behind the Scenes. Craft facts follow the Stage 1 research.
**No artisans, quotes or statistics were invented**: owner prompts mark where real stories and consented
artisan profiles go.

### Information & policy pages (`/pages/[slug]`)
About, Contact (enquiry form), FAQs (with FAQPage structured data), Delivery Information, Returns & Refunds
(14-day statutory cancellation right, refund timings, Consumer Rights Act remedies, **model cancellation form**),
Size Guide, Wholesale Enquiries (trade form), Review Policy (DMCC Act 2024 / CMA208), Terms & Conditions,
Privacy Policy (UK GDPR lawful bases, processors, transfers, 6-year HMRC retention, ICO complaints) and Cookie Policy.

- Content is stored as structured blocks (`src/content/*.ts`) rendered by an **XSS-safe** renderer that supports only
  `**bold**` and `[links](/path)`. Unsafe link schemes such as `javascript:` are blocked. In Stage 4 the same blocks move to the
  `ContentPage` table and become editable in the admin.
- Legal pages show a visible **"Pre-launch template — needs solicitor review"** notice until the owner approves them.

### Accounts (UI)
`/login`, `/register`, `/forgot-password`, `/reset-password`; account area with Overview, Orders, Addresses
(UK postcode-validated address form), Wishlist, My reviews, Email preferences, and Privacy & data (data export and
account deletion with a typed confirmation).
- Password policy follows NCSC guidance: at least 10 characters, blocks common passwords, show/hide toggle, no arbitrary complexity rules.
- Forgot-password gives the same response whether or not an account exists, to prevent account enumeration.

### Order tracking
`/track-order` takes an order number and email; both must match, which prevents order enumeration.

### Cookie consent (fully working)
- Banner on first visit with **Accept all / Reject all at equal prominence**, plus Manage preferences.
- Categories: Strictly necessary (always on), Analytics, Marketing. The choice is stored in a first-party cookie for 6 months.
- **Google Analytics 4, Meta Pixel and TikTok Pixel load only after opt-in, and only if their IDs are set**
  (`NEXT_PUBLIC_GA4_ID`, `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_TIKTOK_PIXEL_ID`). IDs are validated before use.
- Withdrawing consent clears tracker cookies and reloads the page without the scripts.
- "Cookie settings" link in the footer and on the Cookie Policy page.

### SEO
- `sitemap.xml` (all public pages, products, categories, collections and content) and `robots.txt`
  (blocks admin, account, checkout, cart, API and search).
- Canonical URLs and unique titles and descriptions on every indexable page; noindex on private pages.
- Structured data:
  - Organization and WebSite (with SearchAction) on the homepage.
  - BreadcrumbList on every page with breadcrumbs.
  - **ProductGroup with per-variant Offers** (price in GBP, stock availability, UK shipping details, return policy).
  - FAQPage on the FAQs page.
- Ratings are added to structured data **only when real reviews exist**.
- Branded SVG favicon. A friendly error page that never exposes internal details.

### Other
- Product video support: uploaded `.mp4`/`.webm` media plays in the gallery.
- Prettier formatting added (`npm run format`).

## 2. Verification
| Check | Result |
|---|---|
| `next build` | ✔ 136 routes generated |
| TypeScript / ESLint / Prettier | ✔ no errors |
| Link crawl from the homepage | ✔ 111 URLs, 0 non-200 |
| Playwright journey checks | ✔ all 17 pass: consent banner, reject, consent cookie set, stays dismissed after reload, reopens from footer, no trackers loaded without consent, live suggestions, search results, search history, no-results page, combined filters (size + in-stock + colour), weak password rejected, FAQ accordion, FAQ / Product / Breadcrumb JSON-LD present, no horizontal overflow at 375px on 19 pages, no console errors |

Fixes made during testing:
- The logo wrapped onto two lines on 375px phones.
- The Handmade in Nepal hero text had too little contrast over the artwork.
- Short policy tables forced horizontal scrolling on mobile.
- The search overlay reopened with the old query instead of showing recent searches.

## 3. Still placeholder (resolved in later stages)
| Item | Connected in |
|---|---|
| Sign-in, registration, password reset, account data, saved addresses, preferences, data export/deletion | Stage 4 |
| Order lookup on `/track-order` | Stage 4 (+ carrier events in Stage 5) |
| Newsletter, contact, wholesale and product-question emails | Stage 4–5 |
| Admin modules behind the admin sidebar links (`/admin/orders`, `/admin/products`, …) | Stage 4 |
| Social sharing images (Open Graph image per product) | Stage 4, once real photography exists |

Each placeholder tells the user plainly that it isn't connected yet. None pretends to save or send anything.

## 4. Owner actions (no code needed)
- Fill in the `[square-bracket]` placeholders in the policy pages: legal name, company number, address, ICO fee
  registration, VAT number, and the returns-postage decision.
- Have Terms, Privacy, Cookies and Returns reviewed by a UK solicitor.
- Write your own Our Nepal Story, and gather written consent for any artisan names or photos you want to publish.
- When you're ready for analytics or ads, create GA4, Meta and TikTok accounts and send me the IDs. They are only used after a visitor opts in.
