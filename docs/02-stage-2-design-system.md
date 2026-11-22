# WILD MUSE — Stage 2: Brand, Design System & UI/UX

_Completed 22 November 2026. Status: Stage 2 complete, awaiting go-ahead for Stage 3._

Stage 2 was built as **real, production-grade React components** rather than static mock-ups, so
everything here carries straight into Stages 3–4. Screenshots are in [`docs/screenshots/`](screenshots/).
A live reference of every token and component is at **`/design-system`** when the app is running.

## 1. Brand system

| Element | Decision |
|---|---|
| Wordmark | `WILD MUSE` set in Fraunces, tracked 0.22em, with a sun-over-the-Himalaya mark (`src/components/brand/logo.tsx`) |
| Slogan | "Find Your Wild. Wear Your Soul." (default). Alternatives: "Woven by Hand. Worn by Free Spirits." · "From the Himalaya to Your Heart." · "Handmade Soul for Wild Hearts." |
| Motif | A Dhaka-inspired woven triangle band, used sparingly (image bases, dividers) |
| Shapes | Arched "temple-window" image crops (`rounded-t-full`) for editorial moments; near-square 2px corners elsewhere |
| Texture | One CSS-only woven-grain texture (`.texture-grain`) — no image requests |

### Colour tokens (`src/app/globals.css`)

| Token | Hex | Use | Contrast |
|---|---|---|---|
| `linen` | #FBF7F0 | Page background | — |
| `cream` | #F5EDE0 | Section background | — |
| `sand` | #E9DBC4 | Cards, chips | — |
| `sand-deep` | #D9C3A1 | Borders | — |
| `chocolate` | #3A2417 | Body text, dark sections | 13.61:1 on linen |
| `bark` | #6B5444 | Secondary text | 6.61:1 on linen |
| `terracotta` | #A84A2A | Primary actions, links, sale | 5.35:1 on linen; white on it 5.71:1 |
| `olive` | #5B6738 | Secondary actions, in-stock | 5.71:1 on linen |
| `mustard` | #C99A2E | Stars/highlights **on dark only** | 5.64:1 on chocolate |
| `burnt` | #C2602A | Graphics/accents only | 3.93:1 (not for text) |

All 18 text/background pairs used in the UI pass **WCAG 2.2 AA** — run `npm run check:contrast`.

### Typography
- **Display:** Fraunces (variable, light 300 for editorial headlines; italic for emphasis).
- **UI/body:** Manrope (variable).
- Both **self-hosted** via `next/font/local` (OFL licences in `src/app/fonts/`): no third-party font requests (GDPR-friendly), preloaded, `font-display: swap`, automatic fallback metrics to avoid layout shift.
- Fluid display scale using `clamp()` (`text-display-xl/lg/md`), uppercase tracked "eyebrow" labels.

### Imagery strategy
There is no product photography yet, and stock photos carry licence risk, so the site renders
**branded SVG placeholder artwork** (`src/components/brand/artwork.tsx`): deterministic garment illustrations
in the brand palette, under 3 KB each, labelled "(placeholder image)" in alt text. `MediaImage` automatically
switches to the real photo as soon as one is uploaded (Stage 4 admin).

## 2. Component library (`src/components/ui`)
Button / ButtonLink (8 variants, 4 sizes) · TextField / TextArea / SelectField / Checkbox (labels, hints and errors
programmatically linked; `aria-invalid`) · Badge · Price (sale price, struck "was" price, discount %, screen-reader text) ·
StarRating (renders nothing when there are no reviews) · Dialog & Sheet (Radix: focus trap, Escape, scroll lock) ·
Accordion · QuantitySelector · Skeletons · EmptyState · Breadcrumbs · SectionHeading · toasts (Sonner).

## 3. Pages and layouts delivered

| Page | Route | What works now |
|---|---|---|
| Homepage | `/` | Rotating announcement bar (pauses on hover/focus, respects reduced motion), editorial hero, value strip, 7 collection cards, best sellers, new arrivals (automatic by publish date), Handmade-in-Nepal story, shop by category, honest reviews empty state, social gallery, GDPR newsletter form, footer |
| Navigation | all | Two-tier desktop header with **Radix mega-menu** (keyboard accessible); mobile slide-in drawer with search and accordion menus |
| Listing | `/women`, `/men`, `/kids`, `/accessories` + all 51 category pages | Category chips, result count, sort, **combinable filters** (availability, sale, size, colour, material, price) kept in the URL, active-filter chips, mobile filter sheet, empty state |
| Product | `/products/[slug]` (17 demo products) | Gallery with thumbnails, hover zoom, full-screen view, mobile swipe; colour + size selection with **per-variant stock** (sold-out sizes disabled, low-stock warnings, unavailable variants cannot be added); quantity capped at stock; Add to bag, Buy now, wishlist, share, ask a question, size guide; accordions for description / fibre composition & care / country of origin & handmade story / delivery & returns; reviews section; related and recently viewed |
| Bag | drawer + `/cart` | Updates instantly without reload, quantity changes capped to stock, remove, free-delivery progress meter, persisted between visits (this device) |
| Checkout | `/checkout` | Distraction-free layout; guest or sign-in; UK address with autocomplete hints; **UK postcode validation + normalisation**; delivery methods with free-threshold logic; billing address; delivery instructions; order summary; discount field; accessible error summary focus |
| Account | `/account` | Dashboard layout: orders, addresses, wishlist, reviews, email preferences, privacy & data (design preview) |
| Wishlist | `/wishlist` | Working on this device |
| Admin | `/admin` | Sidebar for every admin module, KPI tiles (genuinely £0.00 — no fake sales), sales/best-seller empty states, **low-stock table computed from inventory**. Only rendered when `ENABLE_UI_PREVIEW=1` so an unprotected admin is never deployed |
| Design system | `/design-system` | Living reference of tokens and components |
| 404 | any unknown URL | Branded not-found page |

## 4. Verification performed
- `next build` — succeeds; **89 pages prerendered** (static or partial prerender) with Cache Components enabled.
- `tsc --noEmit` — no errors. `eslint` — no errors or warnings.
- Contrast script — all pairs pass AA.
- Playwright (Chromium) checks on desktop 1440px and iPhone 13:
  - Add to bag without size → "Please choose a size." shown ✔; select size → drawer opens with the line ✔
  - Checkout submit with empty form → postcode error shown ✔
  - `/women?sale=1` → 2 products (correct) ✔
  - Mega-menu opens on hover ✔; mobile drawer opens and expands ✔
  - **No horizontal overflow** at phone width on home, listing, product, cart, checkout, account ✔
  - **No console or runtime errors** ✔ (only expected 404 prefetches for Stage 3 pages)

## 5. Honest limitations (by design, resolved in later stages)
- Data comes from a typed **demo catalogue** (`src/lib/catalog/demo-data.ts`); Stage 4 replaces `queries.ts` with Prisma — no UI changes required.
- Bag/wishlist persist in the browser only; Stage 4 moves them to the database (cross-device).
- Newsletter, "Ask about this product", discount codes and the payment button show an explicit
  "connected in Stage 4/5 — nothing was saved/sent" message rather than pretending to work.
- Account and admin are layout previews without authentication.
- Links to Stage 3 pages (collections, sale, new arrivals, Handmade-in-Nepal content, policies, search) currently show the branded 404.
- The admin has no mobile navigation yet (desktop-first; added with the admin modules in Stage 4).

## 6. External configuration required
None for Stage 2.
