# WILD MUSE — Stage 1: Research, Architecture & Development Plan

_Prepared 22 November 2026. Status: Stage 1 complete, awaiting go-ahead for Stage 2._

> **How to read this document.** Every statement is tagged:
> - **[VERIFIED]** — taken from a cited source (government, regulator, official vendor page or reputable press). Sources are listed at the end of each section.
> - **[SUGGESTION]** — professional recommendation or business estimate. Not a researched fact; validate with your own supplier quotes and sales data.
> - **[CHECK]** — needs confirmation from an accountant, customs agent or solicitor before launch.
>
> No market-size figures have been invented. Where a figure could not be found from a reliable source, the document says so.

---

## 0. Executive summary

| Decision | Recommendation |
|---|---|
| Framework | **Next.js (App Router) + React + TypeScript + Tailwind CSS** — one codebase for storefront, admin and API |
| Database | **PostgreSQL hosted on Supabase** (Pro plan at launch), accessed **only server-side via Prisma ORM** |
| Auth | **Better Auth** (open-source, stores users in our own Postgres, email/password, password reset, rate limiting, optional 2FA for staff). Supabase Auth is the fallback option. |
| Payments | **Stripe Checkout** (hosted, PCI SAQ-A) with cards, Apple Pay, Google Pay, Klarna; PayPal via Stripe if enabled on the account — otherwise PayPal added later as a separate adapter |
| Images | **Supabase Storage** behind a storage adapter (swap to Cloudinary or S3 without code changes elsewhere) + Next.js image optimisation |
| Email | **Resend** behind an email adapter (SMTP fallback) |
| Shipping | Provider-agnostic **shipping adapter**: "Manual" provider (works on day one, admin enters tracking) + **Royal Mail Click & Drop** adapter; DPD/Evri/Parcel2Go can be added later |
| Postcodes | Built-in UK postcode format validation + **postcodes.io** existence check (free, open data) with graceful fallback |
| Hosting | **Vercel Pro** (Hobby plan forbids commercial use) |
| Estimated fixed running cost | roughly **£40–£75/month** at launch, plus per-transaction payment fees and postage (see §9) |

Key regulatory points that shape the build: 14-day cancellation rights (Consumer Contracts Regulations 2013), fake-review ban (DMCC Act 2024, in force April 2025), CMA green-claims guidance for fashion, textile fibre-labelling rules, cookie consent (PECR as amended by the Data (Use and Access) Act 2025), and import duties/VAT on goods from Nepal (EORI, commodity codes, DCTS preferences).

---

## 1. Market research summary

### 1.1 UK online retail context
- **[VERIFIED]** ONS reports the share of UK retail sales made online at **28.8% in September 2026** (28.9% in August 2026). Online spending in Q2 2026 was 11.7% higher than Q2 2025.
- **[VERIFIED]** The ONS September 2026 bulletin noted online clothing retailers reported weak autumn/winter range performance because of unseasonably warm weather — a reminder that UK clothing demand is strongly weather/season-driven.
- **[CHECK]** A clothing-specific online share was not found in public bulletin text; ONS publishes an ad-hoc "internet retail sales by sector" spreadsheet if a precise figure is needed for a business plan.

### 1.2 Bohemian / festival fashion trend signals
- **[VERIFIED]** UK fashion press and retailers describe a boho revival in 2025–26: Oxfam's 2026 festival trends list includes a "boho revival"; Who What Wear called boho a summer-2026 staple with a "grungier, more textural" edge; Marie Claire UK (April 2026) reports festival dressing moving toward durability and comfort; ASOS listed boho-chic as one of four festival trends for 2026.
- **[VERIFIED — gap]** No Mintel or Drapers market-size figure for UK bohemian fashion was accessible (paywalled). **We have no reliable £ market size for "boho" as a segment and do not state one.**
- **[SUGGESTION]** Trend implications for range planning: texture (handloom, crochet, embroidery), durability messaging (handmade, repairable), and layering pieces that sell outside festival season (knitwear, jackets, scarves) to smooth the UK's seasonal demand curve.

### 1.3 Competitor landscape (qualitative — we did not copy designs)
| Competitor | Positioning (observed) | Lesson for Wild Muse **[SUGGESTION]** |
|---|---|---|
| **Free People** | US-owned (URBN) premium boho; editorial photography, lifestyle storytelling | Editorial imagery and styling content drive aspiration; we compete on authenticity and provenance rather than price |
| **Lucy & Yak** | UK ethical brand; **[VERIFIED]** founded 2017, reported revenue £22.7m (2022), discloses its factories with addresses and audits, take-back scheme "Re:Yak", UK stores in Brighton, Bristol, Manchester etc. | Proof that a UK independent with transparent sourcing and a colourful, free-spirited voice can scale. Supplier transparency ("Meet the Artisans") is a genuine differentiator — our supplier module supports it |
| **FatFace / White Stuff** | UK high-street casual-lifestyle, earthy palettes, strong customer service and returns | UK shoppers expect clear delivery/returns pages, size guides, free-delivery thresholds |
| **Monsoon** | UK brand with artisan/embellished heritage, ethnic-inspired prints | Embellishment and occasionwear crossover; customers already accept "craft-inspired" at mid-premium prices |
| **Urban Outfitters** | Youth festival/vintage | Festival capsule drops timed to the April–July season |
| **Independent boho / Nepali-goods sellers (Etsy, markets, festival stalls)** | Low price, inconsistent sizing and photography, weak provenance info | Our gap: **premium presentation + consistent UK sizing + verified provenance + proper UK returns** |

### 1.4 Nepali craft & materials (product authenticity research)
- **[VERIFIED] Dhaka** — a handwoven textile made on traditional handlooms by weaving coloured threads into patterns; Palpa is a historic centre (handloom brought to Tansen in 1958–59). The Kathmandu Post (2024, 2026) reports the craft is under pressure from cheap machine-made fabric — so **genuine handloom Dhaka is a credible premium story, but provenance claims must be verified with suppliers** (machine-made "Dhaka-print" exists).
- **[VERIFIED] Allo** — fibre from the Himalayan giant nettle (*Girardinia diversifolia*), traditionally processed by women, spun and woven into textiles; the World Bank describes allo products alongside Dhaka weaving and lokta paper among traditional Nepali skill sets.
- **[VERIFIED — limited]** Hemp and cotton are widely used in Nepali clothing but we found little authoritative data on Nepali hemp production. Treat "hemp" product claims as supplier-certified only.
- Other categories (felted wool, pashmina, beadwork, macramé, Tibetan-style silver, wooden accessories) are long-standing Nepali export goods; **[VERIFIED]** Nepal's ministry officials list garments, carpets, pashmina and felt items among Nepal's traditional exports.

### 1.5 UK regulation & compliance research (government sources prioritised)

**Importing from Nepal**
- **[VERIFIED]** To import into Great Britain you need a **GB EORI number**; most businesses use a **customs agent / courier broker**; every item needs a **commodity code** which sets the duty rate; the declared value (plus duty) is the basis for **import VAT**; VAT-registered importers reclaim import VAT using the **C79 certificate**; commercial invoices and customs records must be kept. (GOV.UK "Import goods into the UK: step by step".)
- **[VERIFIED]** Nepal is in the **Comprehensive Preferences tier of the UK Developing Countries Trading Scheme (DCTS)** — duty-free access for the large majority of tariff lines, with clothing and textiles among the main beneficiaries. Goods must meet **DCTS rules of origin** and be supported by an origin statement to claim 0% duty.
- **[VERIFIED — recent, secondary sources]** Nepal's UN LDC graduation was reportedly moved from 24 Nov 2026 to **24 Nov 2029** (UNGA decision late Oct 2026); under DCTS a graduating LDC keeps Comprehensive Preferences for about three years afterwards. **[CHECK]** Confirm on GOV.UK DCTS guidance before relying on it.
- **[VERIFIED]** Example: women's cotton woven dresses fall under commodity code **6204 42 00**. The non-preferential (UK Global Tariff) duty rate could not be confirmed from an official page in this research — **[CHECK]** on the UK Trade Tariff tool for each product.
- **Design consequence:** the admin product form stores **commodity code, country of origin, DCTS-preference claimed (yes/no), duty %, import VAT** per product/shipment, and calculates landed cost.

**Product labelling & safety**
- **[VERIFIED]** The **Textile Products (Labelling and Fibre Composition) Regulations 2012** require full fibre composition on textile products, using only approved fibre names; the manufacturer **or UK importer** is responsible. Claims online must be accurate (Consumer Rights Act 2015: goods must be "as described"). **Handmade/small batch is not exempt.**
- **[VERIFIED]** The **General Product Safety Regulations 2005** remain the operative general safety law in Great Britain (Northern Ireland follows EU GPSR 2023/988 since Dec 2024). A new UK product-safety framework is being consulted on under the Product Regulation and Metrology Act 2025. **[CHECK]** Children's clothing: drawstring/cord safety standards (BS EN 14682) and jewellery: nickel/lead/cadmium restrictions under retained REACH — confirm with Trading Standards (Primary Authority advice is available) before listing kids' items and metal jewellery.
- **Design consequence:** product form has required fields for **fibre composition**, **care instructions**, **country of origin**, and a "compliance checked" flag that blocks publishing until set (configurable).

**Consumer law (online selling)**
- **[VERIFIED]** **Consumer Contracts Regulations 2013:** 14-day cancellation period starting the day after goods are received; refund due within 14 days of receiving returned goods (or proof of return); required pre-contract information must be confirmed in a durable medium (order confirmation email); a model cancellation form must be provided; an email address should be given (a contact form alone is insufficient).
- **[VERIFIED]** **DMCC Act 2024** (in force 6 April 2025) automatically bans fake reviews and concealed incentivised reviews; publishers of reviews must take reasonable steps to prevent them and have a clear policy. CMA guidance CMA208; penalties up to 10% of global turnover. **Design consequence:** reviews only from customers with accounts; "Verified purchase" badge computed from real order data; moderation queue; public review policy page; no seeded reviews in production.
- **[VERIFIED]** **CMA green-claims guidance for fashion (Sept 2024):** broad terms such as "sustainable", "eco-friendly", "green" are high-risk unless substantiated; avoid naming ranges with vague green terms. **Design consequence:** copy uses specific, provable statements ("hand-loomed in Palpa", "100% cotton, plant-based dyes — supplier certificate on file") and the brand trait "sustainable-minded" is expressed as specifics, not a headline claim. The collection originally named "Earth & Soul" is fine (not an environmental claim); we avoid e.g. "Eco Edit".

**VAT**
- **[VERIFIED]** VAT registration threshold is **£90,000** taxable turnover (since 1 April 2024; unchanged for 2026/27 per reported Budget). Standard rate 20%. **Children's clothing designed for young children can be zero-rated** subject to HMRC size/design conditions (VAT Notice 714).
- **Design consequence:** tax engine is fully admin-configurable: "VAT registered: yes/no", VAT number, prices entered **inclusive** of VAT (UK B2C convention), per-product **tax class** (Standard 20% / Zero-rated / Exempt / Custom). If not VAT registered the site shows no VAT line and the invoice omits VAT. **[CHECK]** with an accountant: zero-rating of each kids' product, VAT on delivery charges, and Flat Rate Scheme suitability.

**Data protection & cookies**
- **[VERIFIED]** UK GDPR + PECR. The **Data (Use and Access) Act 2025** added exceptions so certain **first-party, aggregate statistical analytics** can run without consent; non-essential tracking (Google Analytics 4 in default config, Meta Pixel, TikTok Pixel) still requires prior consent, with an equally easy "Reject" option. The ICO is actively monitoring the top 1,000 UK websites.
- **Design consequence:** consent manager with categories (Necessary / Analytics / Marketing); GA4, Meta and TikTok scripts are only injected after consent; consent records stored with timestamp and policy version; newsletter consent is a separate unticked checkbox (PECR soft opt-in documented).

Sources (§1): see §11.

---

## 2. Product catalogue proposal

All prices are **[SUGGESTION]** retail positioning (GBP, VAT-inclusive) for "premium but accessible", benchmarked qualitatively against the competitor tiers above. Margins assume a target **landed-cost multiple of 2.5×–3.5×** (typical for independent fashion retail) — validate against real supplier quotes.

| Category | Example products | Suggested retail (£) | Seasonality | Differentiator | Import notes |
|---|---|---|---|---|---|
| Women — Dresses | Hand-block-printed cotton maxi, Dhaka-trim midi, embroidered smock | 55–110 | Peak Apr–Aug | Handloom / embroidery provenance | Commodity 6204 4x; fibre label |
| Women — Harem & palazzo pants | Cotton/rayon harem, hemp-cotton palazzo | 32–55 | Year-round, peak festival | Comfort + UK sizing consistency | Rayon = viscose (use legal fibre name) |
| Women — Tops/blouses/shirts | Embroidered peasant blouse, tie-dye tee | 28–60 | Spring/summer | Small-batch dyeing | |
| Jackets | Patchwork cotton jacket, quilted Dhaka jacket | 75–150 | Autumn/spring | One-of-a-kind patchwork (each unique) | Variant = one-off SKU handling |
| Knitwear & cardigans | Hand-knitted wool cardigan, fleece-lined woollen hoodie (classic Nepal export) | 55–120 | **Oct–Feb — counter-seasonal hero** | Hand-knit, wool | Wool composition %, care |
| Co-ords / jumpsuits | Cotton co-ord sets | 60–95 | Spring/summer | | |
| Men | Grandad-collar cotton shirts, harem trousers, woollen hoodies, waistcoats | 30–95 | Mixed | Under-served in boho market **[SUGGESTION]** | |
| Kids | Cotton harem pants, small dresses, woollen hats | 15–35 | Mixed | | Zero-rating & drawstring safety **[CHECK]** |
| Scarves & shawls | Handwoven cotton, yak/wool blend, allo-blend | 25–75 | Autumn/winter; gifting | Allo nettle fibre story | "Pashmina" only if certified cashmere — legally sensitive descriptor |
| Bags | Hemp crossbody, embroidered backpack, felt bag | 25–70 | Year-round | Durable natural fibres | |
| Jewellery | Beaded necklaces, Tibetan-style silver earrings/rings, wooden bangles | 12–65 | Year-round; Christmas gifting | Handmade | **Silver**: items over 7.78 g need UK hallmarking to be described as silver **[CHECK]**; nickel limits |
| Hats, belts, hair accessories | Felted wool hats, macramé belts, scrunchies | 10–40 | Seasonal | | |

**Launch range recommendation [SUGGESTION]:** ~60–90 SKUs (≈25 styles × colours/sizes), weighted 45% womenswear, 15% menswear, 5% kids, 35% accessories/jewellery (accessories have lower size risk, lower return rates, and ship as Large Letter — cheaper postage).

**Margin model** (implemented in admin, illustrative figures only):
```
supplier_cost (NPR → GBP at admin-set rate)
+ freight allocation (per shipment, split by units/weight/value)
+ customs duty (0% if DCTS preference proven; else Trade Tariff rate)
+ broker/clearance fees allocation
+ non-reclaimable import VAT (only if NOT VAT-registered)
= landed cost per unit
retail ex-VAT − landed cost = gross margin  → margin % and markup shown on product
```

---

## 3. Website architecture

### 3.1 Sitemap
```
/                               Home
/new-arrivals                   New Arrivals
/women  /men  /kids             Department landing → /women/[category] e.g. /women/maxi-dresses
/accessories/[category]         Jewellery & Accessories
/handmade-in-nepal              Editorial hub
   /our-nepal-story /meet-the-artisans /traditional-craftsmanship
   /our-materials /ethical-sourcing /behind-the-scenes   (CMS pages)
/collections  /collections/[slug]
/sale
/products/[slug]                Product detail (one canonical URL per product)
/search?q=                      Search results
/cart  /checkout  /checkout/success  /checkout/cancelled
/account  (orders, order/[id], addresses, wishlist, reviews, preferences, privacy)
/login /register /forgot-password /reset-password
/wishlist                       (guest wishlist → merged on login)
/track-order                    Order tracking by order number + email
/pages/[slug]                   CMS pages: about, contact, faqs, delivery, returns, privacy,
                                cookies, terms, size-guide, wholesale, review-policy
/admin/...                      Admin dashboard (separate layout, role-protected)
/api/...                        Webhooks + JSON endpoints (Stripe webhook, search suggestions, uploads)
/sitemap.xml /robots.txt
```

### 3.2 Application architecture (single deployable — no microservices)
```
┌──────────────── Next.js app (Vercel) ────────────────┐
│  app/(store)   Server Components, ISR-cached pages    │
│  app/(account) authenticated customer area            │
│  app/admin     role-protected admin UI                │
│  app/api       webhooks, uploads, search suggest      │
│        │ server actions (validated with Zod)          │
│  src/server/   domain services (pure TS, testable)    │
│    catalog · cart · pricing · tax · checkout · orders │
│    inventory · shipping · reviews · cms · suppliers   │
│    audit · auth/permissions                           │
│  src/integrations/  adapters (interfaces + impls)     │
│    payments/stripe · shipping/manual, royalmail       │
│    email/resend, smtp · storage/supabase, local       │
│    postcode/postcodes-io                              │
└───────────┬─────────────┬───────────────┬────────────┘
            │ Prisma      │ HTTPS         │ HTTPS
     Supabase Postgres   Stripe       Resend / Royal Mail / postcodes.io
     Supabase Storage
```
Principles: UI never talks to the DB directly; every mutation goes through a domain service that **re-computes prices, discounts, stock and permissions server-side**; integrations are swappable behind interfaces; every admin mutation writes an **AuditLog** row.

### 3.3 Critical flow: checkout & stock (transaction-safe)
1. Customer clicks Checkout → server loads cart, **re-prices** every line from DB, validates coupon, calculates shipping & VAT.
2. In one DB transaction: create `Order (status=PENDING_PAYMENT)` + `OrderItems` (price snapshots) and **reserve stock** with a conditional update (`UPDATE inventory SET reserved = reserved + n WHERE variant_id = ? AND on_hand - reserved >= n`); if any row fails → abort, tell customer which item is short. Write `StockMovement(RESERVE)`.
3. Create Stripe Checkout Session (amounts from server, `metadata.orderId`, idempotency key) with 30-min expiry.
4. **Stripe webhook** (signature verified, idempotent via `ProcessedWebhookEvent` table):
   - `checkout.session.completed` / `payment_intent.succeeded` → order `PAID`, convert reservation to sale (`on_hand -= n, reserved -= n`, `StockMovement(SALE)`), record `Payment`, coupon usage, send confirmation email.
   - `checkout.session.expired` / payment failed → order `CANCELLED (unpaid)`, release reservation.
   - `charge.refunded` → record `Refund`, optional restock.
5. The success page **reads** order status — it never marks anything paid.
6. A scheduled sweeper (Vercel Cron) releases stale reservations as a safety net.

---

## 4. Technology stack recommendation (with reasoning)

| Layer | Choice | Why / alternatives considered |
|---|---|---|
| Framework | Next.js (App Router), React, TypeScript (strict) | Your preference; SSR/ISR for SEO & speed; server actions remove need for a separate backend |
| Styling | Tailwind CSS + small in-house component library built on **Radix UI primitives** (accessible dialogs, menus, popovers) | Fully custom brand look (not a template) with accessibility handled by Radix |
| ORM / DB | **Prisma + PostgreSQL (Supabase)** | Typed schema, migrations, transactions, seed scripts. Supabase gives managed Postgres + backups + storage in one bill. All DB access is server-side, so Supabase RLS is enabled as defence-in-depth with **no public policies** (anon key unused for data) |
| Auth | **Better Auth** (Prisma adapter) | Users live in our DB (one source of truth with orders), supports email/password with secure hashing, email verification, password reset, session management, rate limiting, 2FA plugin for staff. Alternative: Supabase Auth — good, but splits users across two systems and couples to Supabase |
| Validation | Zod (shared client/server schemas) | |
| Payments | Stripe Checkout + webhooks | Hosted page = lowest PCI burden, built-in Apple Pay/Google Pay/Klarna/Link, 3-D Secure (SCA) handled. Stripe Elements possible later for a fully embedded checkout |
| Email | Resend + React Email templates | Simple API; adapter allows any SMTP provider |
| Storage | Supabase Storage (public bucket for product media, private bucket for supplier invoices/review uploads pending moderation) | |
| Search | **PostgreSQL full-text search** (tsvector + trigram for typo tolerance) | No extra service/cost at our catalogue size (< 10k SKUs). Algolia/Meilisearch only if needed later |
| Charts (admin) | Recharts | |
| Testing | Vitest (unit/domain), Playwright (E2E incl. mobile viewports), axe-core (accessibility) | |
| Hosting | Vercel Pro | Best Next.js support, preview deployments, cron, edge caching. Cloudflare (OpenNext) is cheaper at scale but adds complexity; revisit if traffic grows |
| Monitoring | Vercel logs + Sentry free tier (optional) | |

---

## 5. Database design (PostgreSQL via Prisma)

Money stored as **integer pence** (`Int`) to avoid floating-point errors. All tables have `id` (cuid/uuid PK), `createdAt`, `updatedAt`. Soft-delete (`deletedAt`) on products/customers where history matters.

### 5.1 Identity & access
| Table | Key columns | Constraints / indexes |
|---|---|---|
| **User** | email (unique, citext), name, emailVerified, role (`CUSTOMER`/`STAFF`/`MANAGER`/`ADMIN`/`OWNER`), status (`ACTIVE`/`SUSPENDED`/`DELETION_REQUESTED`) | unique email |
| Session / Account / Verification | managed by Better Auth | |
| **CustomerProfile** | userId (1:1), phone, marketingConsent, consentAt, consentSource | FK User |
| **Role** / **Permission** / **RolePermission** | e.g. `products.write`, `orders.refund`, `settings.write`, `users.manage` | composite PK |
| **AdminUser** | modelled as `User.role ≥ STAFF` + optional per-user permission overrides (`UserPermission`) — avoids a duplicate user table | |
| **Address** | userId?, type (shipping/billing), fullName, line1, line2, city, county, postcode (normalised upper-case), countryCode (`GB`), phone, isDefault | index userId |

### 5.2 Catalogue
| Table | Key columns | Notes |
|---|---|---|
| **Category** | parentId (self-FK → subcategories), department (`WOMEN`/`MEN`/`KIDS`/`ACCESSORIES`/`UNISEX`), name, slug, description, image, sortOrder, seoTitle, seoDescription | unique (parentId, slug) |
| **Collection** | name, slug, description, heroImage, isFeatured, sortOrder, rules? | M:N `CollectionProduct` |
| **Product** | name, slug (unique), description (rich text), shortDescription, categoryId, department, status (`DRAFT`/`PUBLISHED`/`ARCHIVED`), isFeatured, isHandmade, handmadeStory, materials, fibreComposition, careInstructions, countryOfOrigin, commodityCode, taxClassId, basePricePence, compareAtPricePence, supplierId, artisanId?, sizeGuideId?, seo fields, publishedAt, **searchVector (tsvector)** | GIN index on searchVector; index (status, department, categoryId) |
| **ProductVariant** | productId, sku (unique), size, colour, colourHex, pricePence? (override), compareAtPricePence?, weightGrams, barcode?, isActive | unique (productId, size, colour) |
| **ProductImage** | productId, variantColour?, url, alt (required), width, height, sortOrder, type (`IMAGE`/`VIDEO`) | |
| **Inventory** | variantId (1:1), onHand, reserved, lowStockThreshold | CHECK onHand ≥ 0, reserved ≥ 0, reserved ≤ onHand |
| **StockMovement** | variantId, type (`RECEIVE`/`RESERVE`/`RELEASE`/`SALE`/`RETURN`/`ADJUST`/`DAMAGE`), quantity, reason, orderId?, purchaseOrderId?, userId | immutable ledger |
| **SizeGuide** | name, content (table JSON) | |
| **TaxClass** | name, ratePercent (basis points), description | admin-editable |

### 5.3 Shopping
| Table | Key columns |
|---|---|
| **Cart** | userId? (unique) or anonymous token (httpOnly cookie), couponId?, expiresAt |
| **CartItem** | cartId, variantId, quantity (CHECK > 0) — unique (cartId, variantId) |
| **Wishlist / WishlistItem** | userId (unique) / productId, variantId? — guest wishlist stored in cookie and merged on login |
| **Coupon** | code (unique, case-insensitive), type (`PERCENT`/`FIXED`/`FREE_SHIPPING`), value, minSubtotalPence, startsAt, endsAt, usageLimit, perCustomerLimit, usedCount, firstOrderOnly, appliesTo (all/categories/products) |
| **CouponRedemption** | couponId, orderId, userId?/email |

### 5.4 Orders, payments & fulfilment
| Table | Key columns |
|---|---|
| **Order** | number (human-friendly, unique, e.g. `WM-10042`), userId?, email, status (`PENDING_PAYMENT`/`PAID`/`PROCESSING`/`DISPATCHED`/`DELIVERED`/`CANCELLED`/`REFUNDED`/`PARTIALLY_REFUNDED`), shipping & billing address snapshots (JSON), subtotalPence, discountPence, shippingPence, taxPence, totalPence, currency `GBP`, vatRegisteredAtTime, shippingMethodId, deliveryInstructions, couponCode, placedAt, cancelledAt — index (status, createdAt), (email) |
| **OrderItem** | orderId, variantId, productName/sku/size/colour **snapshots**, unitPricePence, quantity, taxRate, lineTotalPence |
| **Payment** | orderId, provider `STRIPE`, providerPaymentId (unique), status, amountPence, method (card/apple_pay/klarna…), raw event id |
| **Refund** | orderId, paymentId, amountPence, reason, providerRefundId (unique), status, restocked, createdBy |
| **ProcessedWebhookEvent** | provider, eventId (unique) — idempotency |
| **ShippingMethod** | name (Standard/Express/…), carrier, pricePence, freeOverPence?, estimatedMinDays, estimatedMaxDays, maxWeightGrams?, isActive, sortOrder |
| **Shipment** | orderId, carrier, service, trackingNumber, trackingUrl, status (`LABEL_CREATED`/`DISPATCHED`/`IN_TRANSIT`/`DELIVERED`/`EXCEPTION`), dispatchedAt, deliveredAt, providerRef |
| **ShipmentEvent** | shipmentId, status, description, occurredAt (manual or API) |
| **ReturnRequest** | orderId, items, reason, status, cancellation-form flag (Consumer Contracts compliance) |

### 5.5 Reviews & marketing
| Table | Key columns |
|---|---|
| **Review** | productId, userId, orderItemId? (→ **verifiedPurchase computed, never user-set**), rating (CHECK 1–5), title, body, status (`PENDING`/`APPROVED`/`REJECTED`), editedAt — unique (productId, userId) |
| **ReviewImage** | reviewId, url (validated mime/size, stripped EXIF) |
| **ReviewReport** | reviewId, reporterId?, reason, status |
| **NewsletterSubscriber** | email (unique), status (`PENDING`/`SUBSCRIBED`/`UNSUBSCRIBED`), consentText, consentAt, source, ip hash, double-opt-in token, welcomeCouponId? |
| **ConsentRecord** | anonymous id/userId, categories JSON, policyVersion, timestamp |

### 5.6 Sourcing (Nepal supply chain)
| Table | Key columns |
|---|---|
| **Supplier** | name, type (manufacturer/artisan/workshop/co-op), contactName, email, phone, whatsapp, address, district (e.g. Palpa, Kathmandu), country, paymentTerms, currency (NPR/GBP/USD), leadTimeDays, notes, certifications, isActive |
| **Artisan** (optional public profile) | supplierId, displayName, story, photo, craft, consentToPublish (must be true to show) |
| **SupplierProduct** | supplierId, productId/variantId, supplierSku, unitCost, currency, moq, leadTimeDays |
| **PurchaseOrder** | number, supplierId, status (`DRAFT`/`SENT`/`CONFIRMED`/`IN_PRODUCTION`/`SHIPPED`/`RECEIVED`/`CANCELLED`), currency, exchangeRateToGBP, orderedAt, expectedAt, importShipmentId? |
| **PurchaseOrderItem** | purchaseOrderId, variantId, quantityOrdered, quantityReceived, unitCost |
| **ImportShipment** | carrier/forwarder, awb/tracking, incoterms, freightCostPence, dutyPence, importVatPence, brokerFeesPence, dctsPreferenceClaimed, eoriUsed, c79Reference, arrivedAt, documents |
| **SupplierDocument** | supplierId/purchaseOrderId/shipment, type (invoice, packing list, origin statement, C79), file (private bucket) |
| **ProductCosting** (view/computed) | landed cost, margin %, markup — recalculated when PO received |

### 5.7 CMS & system
| Table | Key columns |
|---|---|
| **SiteSetting** | key (unique), value JSON — business name, contact email/phone, address, socials, VAT config, free-shipping threshold, announcement messages, logo, tracking IDs (GA4/Meta/TikTok), currency formatting |
| **ContentPage** | slug (unique), title, body (rich text / blocks), seoTitle, seoDescription, status, version |
| **HomepageSection** | type (hero/collections/bestsellers/…), config JSON, sortOrder, isActive — drives the homepage entirely from admin |
| **NavigationMenu / NavigationItem** | location (main/footer), parentId, label, href, megaMenuImage, sortOrder |
| **Redirect** | from, to, permanent — protects SEO when slugs change |
| **AuditLog** | actorId, action, entityType, entityId, before JSON, after JSON, ip, userAgent, createdAt — append-only |
| **ExchangeRate** | currency, rateToGBP, source (manual/API), effectiveAt |

Row-Level Security is enabled on all tables with no anonymous policies; the app connects with a server-only role. Migrations via `prisma migrate`; seeds create categories, navigation, shipping methods, tax classes, CMS pages, demo products **flagged as demo** (no fake reviews, no fake orders).

---

## 6. API & third-party service comparison

| Need | Option | Free tier / cost **[VERIFIED unless marked]** | Commercial use | Decision |
|---|---|---|---|---|
| Card payments | **Stripe** (UK) | No monthly fee; **1.5% + 20p standard UK cards**, 2.5% + 20p EEA cards, 3.25% + 20p international (+2% if FX); Klarna from **4.99% + 35p** | Yes | **Primary** |
| PayPal | PayPal via Stripe (if available on account) or PayPal Commerce Platform direct | **[CHECK]** current PayPal UK rates on paypal.com | Yes | Phase 2 adapter, enabled from admin |
| Apple / Google Pay | Through Stripe Checkout | Same as card rates (third-party source) | Yes | Included |
| BNPL | Klarna via Stripe | 4.99% + 35p | Yes — **FCA rules on BNPL promotion apply** **[CHECK]** | Admin toggle, off by default |
| Email | **Resend** | Free: 3,000/month **but max 100/day**; Pro ~$20/mo for 50k | Yes | Free during build, **Pro at launch** (100/day is too tight for a sale day) |
| Postcode validation | **postcodes.io** | Free, MIT software; GB data under OS OpenData/OGL (commercial reuse allowed); **NI (BT) postcodes need a separate licence**; no published rate limit (fair use) | Yes (GB) | Format regex always; postcodes.io existence check; never blocks checkout if API is down |
| Address autocomplete | Ideal Postcodes / getAddress.io (Royal Mail PAF) | Paid per lookup **[CHECK]** prices | Yes | Optional adapter, off at launch (manual entry is fine) |
| Shipping labels | **Royal Mail Click & Drop** | Free to use; you pay postage only; API supports creating orders, retrieving labels (Online Business Account), marking dispatched, tracking numbers | Yes | Adapter + **manual fallback** |
| Tracking | Royal Mail Tracking API | Free developer account; approval may take ~1 week | Yes | Phase 2; manual status updates meanwhile |
| Multi-carrier | Parcel2Go / DPD / Evri / DHL APIs | Generally require a business account / approval **[CHECK]** | Yes | Adapter interface ready; not built until an account exists |
| Image hosting | **Supabase Storage** (in Pro plan) vs Cloudinary | Cloudinary Free: 25 credits/month (1 credit = 1 GB storage or 1 GB bandwidth or 1,000 transforms), soft limits | Cloudinary free tier permits production use per its FAQ | Supabase Storage default; Cloudinary adapter optional |
| Image optimisation | Next.js `<Image>` on Vercel | Included quota on Pro, then usage-based **[CHECK]** | Yes | Default |
| Currency (NPR→GBP for costs only) | Manual rate in admin (default); Nepal Rastra Bank published forex rates **[CHECK]** API terms | ECB/Frankfurter do **not** publish NPR | — | **Manual rate per PO** (also more accurate: use the rate you actually paid) |
| Analytics | GA4 (consent-gated); Vercel Web Analytics or Plausible (cookieless) | GA4 free; Plausible paid | Yes | GA4 behind consent + optional cookieless first-party analytics |
| Marketing pixels | Meta Pixel, TikTok Pixel | Free | Yes | Loaded only after Marketing consent |
| Maps | Not required | — | — | Not built (avoid cost/JS) |
| Hosting | **Vercel** | **Hobby = non-commercial only**; Pro required for commercial use (Pro includes $20/month usage credit; **[CHECK]** current per-seat price, historically $20/user/month) | Pro only | **Vercel Pro** |
| Database | **Supabase** | Free: 500 MB DB, projects pause after 1 week idle — **unsuitable for production**; **Pro $25/month** (8 GB disk, 250 GB egress, daily backups 7-day retention, $10 compute credit) | Yes | **Pro** |

**No third-party retailer APIs are used and no catalogues are scraped.**

---

## 7. Brand direction (input to Stage 2)
- **Default slogan:** "Find Your Wild. Wear Your Soul."
- **Alternatives [SUGGESTION]:** "Woven by Hand. Worn by Free Spirits." · "From the Himalaya to Your Heart." · "Handmade Soul for Wild Hearts."
- **Palette direction:** terracotta, sand, cream, olive, chocolate, mustard, off-white, burnt orange — Stage 2 will produce exact tokens and check every text/background pair against **WCAG 2.2 AA (4.5:1)**; e.g. mustard is used for accents, never for body text on cream.
- **Typography direction:** an editorial serif for display (self-hosted via `next/font`, no layout shift) + a clean humanist sans for UI; one subtle textile/paper texture used sparingly.
- **Imagery:** we cannot supply genuine photography of your products or artisans. Development will use **clearly marked, licence-safe placeholder imagery** (art-directed colour blocks/illustrated textile patterns, or royalty-free stock with licence noted); every image is replaceable in admin. **[ACTION FOR OWNER]** commission product + lifestyle photography; obtain artisan consent before publishing names/photos.

---

## 8. Development plan (stages 2–7)

| Stage | Deliverables | Exit criteria |
|---|---|---|
| **2 Brand & UI/UX** | Design tokens (Tailwind theme), type scale, component library (buttons, inputs, product card, mega-menu, drawer, dialogs, toasts, skeletons), page layouts for home, PLP, PDP, cart, checkout, account, admin — built as real components, viewable in the app | Contrast checks pass; responsive at 320/375/768/1024/1440 px |
| **3 Frontend** | All storefront pages and navigation wired to typed data-access functions; mobile drawer; search UI; filters; wishlist; consent banner | Keyboard navigation works end-to-end; no dead links |
| **4 Backend & DB** | Prisma schema + migrations + seeds; auth; catalogue/inventory/cart/order services; full admin (products, variants, media upload, orders, customers, roles, CMS, suppliers/POs/landed cost, coupons, settings, audit log, dashboard charts) | Domain unit tests pass; RBAC tests pass |
| **5 Payments, shipping, notifications** | Stripe Checkout + webhooks + refunds from admin; shipping methods/thresholds; manual + Royal Mail adapters; transactional emails (confirmation, dispatch, refund, password reset, newsletter double opt-in); order tracking | Tested against **Stripe test mode** with Stripe CLI webhooks (success, decline, 3DS, expiry, refund) |
| **6 Testing & optimisation** | Vitest + Playwright E2E (desktop + iPhone/Android viewports), axe accessibility, Lighthouse, security review (headers/CSP, rate limits, upload validation, authz), typecheck, lint, production build | All green; report of results |
| **7 Deployment pack** | README, `.env.example`, migration/seed/admin-creation scripts, API docs, hosting + domain + SSL + Stripe/Resend/Royal Mail setup guides, backup & recovery, launch checklist | `next build` succeeds from a clean clone |

**Honest scope notes**
- Everything that needs **your accounts** (Stripe live keys, Resend domain verification, Royal Mail account, Vercel/Supabase projects, domain) will be fully built and tested in **test/sandbox mode**; going live is a configuration step documented in Stage 7. I will not claim any integration "works in production" until you have connected it.
- Royal Mail tracking API integration depends on Royal Mail approving a developer account; manual tracking entry works regardless.
- Legal page **templates** will be provided and editable, but they must be reviewed by a UK solicitor — they are not legal advice.

---

## 9. Estimated operating costs [SUGGESTION — based on verified list prices, Nov 2026]

| Item | Monthly (launch) | Notes |
|---|---|---|
| Vercel Pro (1 seat) | ~£16–20 | **[CHECK]** current seat price |
| Supabase Pro | ~£20 ($25) | + compute beyond $10 credit if needed |
| Resend Pro | ~£16 ($20) | Free tier possible pre-launch |
| Domain (.co.uk / .com) | ~£1–2 | annual, amortised |
| Google Workspace / business email | ~£5–12 | optional; any provider |
| Royal Mail Click & Drop | £0 | postage only |
| postcodes.io, GA4, Stripe account | £0 | |
| **Total fixed** | **≈ £40–£75 / month** | |
| **Variable** | Stripe 1.5% + 20p per UK card order (e.g. £65 order ≈ £1.18); Klarna 4.99% + 35p; postage | |
| **One-off / business setup [CHECK]** | EORI (free), customs broker fees per shipment, photography, solicitor review of T&Cs, product testing for kids/jewellery, trademark for "WILD MUSE" (UKIPO search recommended before launch) | |

---

## 10. External configuration required from the owner (can happen in parallel)
1. **GitHub repository** for the code (this cloud session's files are temporary — see note in the chat).
2. Business details: legal entity name, registered address, company number (if Ltd), VAT status, contact email/phone.
3. Stripe account (UK), Supabase project, Vercel account, Resend account + domain DNS access.
4. Royal Mail Click & Drop account (when ready to ship).
5. EORI number; choose a customs broker/forwarder for Nepal shipments.
6. Real product data, photography and supplier/artisan consent.

---

## 11. Sources
**Government / regulator**
- GOV.UK — [Import goods into the UK: step by step](https://www.gov.uk/import-goods-into-uk); [Get UK customs clearance](https://www.gov.uk/import-customs-declaration); [Check if you can delay customs payments](https://www.gov.uk/guidance/check-if-you-can-delay-customs-duty-and-import-vat)
- GOV.UK — [Preference tiers under the DCTS](https://www.gov.uk/guidance/preference-tiers-under-the-developing-countries-trading-scheme); [DCTS rules of origin improvements (July 2025)](https://www.gov.uk/government/publications/rules-of-origin-under-the-developing-countries-trading-scheme-dcts-are-improving/rules-of-origin-under-the-developing-countries-trading-scheme-dcts-are-improving-july-2025); [UK statement, Nepal WTO Trade Policy Review](https://www.gov.uk/government/news/nepals-wto-trade-policy-review-uk-statement)
- HMRC/uktradeinfo — [Commodity 6204 42 00](https://www.uktradeinfo.com/commodities/62044200); GOV.UK [Classifying textile apparel](https://www.gov.uk/classifying-textile-apparel)
- GOV.UK — [Textile labelling](https://www.gov.uk/guidance/textile-labelling); [Textile products labelling guidance](https://www.gov.uk/government/publications/textile-products-labelling-and-fibre-composition-regulations-2012-guidance); Business Companion [Labelling of textiles](https://www.businesscompanion.info/en/quick-guides/goods/labelling-of-textiles?region=england)
- GOV.UK — [General Product Safety Regulations 2005 (GB) statutory guidance](https://www.gov.uk/government/publications/general-product-safety-regulations-2005/general-product-safety-regulations-2005-great-britain); [Product safety advice for businesses](https://www.gov.uk/guidance/product-safety-advice-for-businesses); [UK's new product safety framework consultation](https://www.gov.uk/government/consultations/product-regulation-the-uks-new-product-safety-framework/the-uks-new-product-safety-framework)
- BIS — [Consumer Contracts Regulations guidance (PDF)](https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/429300/bis-13-1368-consumer-contracts-information-cancellation-and-additional-payments-regulations-guidance.pdf); nibusinessinfo [Online selling rules](https://www.nibusinessinfo.co.uk/content/online-selling-rules); Which? [Consumer Contracts Regulations](https://www.which.co.uk/consumer-rights/regulation/consumer-contracts-regulation)
- CMA — [Fake reviews guidance CMA208](https://www.gov.uk/government/publications/fake-reviews-cma208); [Online reviews information for businesses](https://www.gov.uk/government/collections/online-reviews-and-endorsements-information-for-businesses)
- CMA — [Environmental claims in the fashion retail sector](https://www.gov.uk/government/publications/complying-with-consumer-law-when-making-environmental-claims-in-the-fashion-retail-sector/complying-with-consumer-law-when-making-environmental-claims-in-the-fashion-retail-sector); [press release](https://www.gov.uk/government/news/greenwashing-cma-issues-tailored-guide-for-fashion-brands)
- HMRC — [VAT Notice 700/1 supplement (threshold)](https://gov.uk/government/publications/vat-notice-7001-should-i-be-registered-for-vat/vat-notice-7001-supplement--2); [How VAT works: thresholds](https://www.gov.uk/how-vat-works/vat-thresholds); ICAEW [HMRC reminds businesses to register for VAT (May 2026)](https://www.icaew.com/insights/tax-news/2026/may-2026/hmrc-reminds-businesses-to-register-for-vat)
- ICO — [Guidance on storage and access technologies](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/about-this-guidance/); [ICO myths blog (Sept 2025)](https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/2025/09/fact-vs-fiction-ico-debunks-myths-on-storage-and-access-technologies); Burges Salmon [ICO draft guidance after DUAA](https://www.burges-salmon.com/articles/102l7bs/key-insights-from-the-icos-updated-draft-cookies-guidance-following-duaa)
- ONS — [Retail sales, Great Britain: September 2026](https://www.ons.gov.uk/businessindustryandtrade/retailindustry/bulletins/retailsales/september2026); [June 2026](https://www.ons.gov.uk/businessindustryandtrade/retailindustry/bulletins/retailsales/june2026); [Internet retail sales by sector ad hoc](https://www.ons.gov.uk/businessindustryandtrade/retailindustry/adhocs/3545internetretailsalesbysectoruptojune2026greatbritain)
- ONS — [Postcode data licences](https://www.ons.gov.uk/methodology/geography/licences)

**Market / craft / press**
- [Oxfam: 2026 festival fashion trends](https://www.oxfam.org.uk/oxfam-in-action/oxfam-blog/2026-festival-fashion-trends/); [Marie Claire UK: festival dressing 2026](https://www.marieclaire.co.uk/fashion/2026-festival-dressing-guide); [Who What Wear: trends summer 2026](https://www.whowhatwear.com/fashion/trends/trends-making-a-comeback-summer-2026); [ASOS festival trends 2026](https://www.asos.com/women/fashion-feed/2026_05_11-mon/festival-outfits-trends/)
- [Lucy & Yak — Wikipedia](https://en.wikipedia.org/wiki/Lucy_%26_Yak); [Ethical Consumer listing](https://ethicalconsumer.org/node/82893)
- [Kathmandu Post: Palpa's Dhaka cloth (Nov 2026)](https://kathmandupost.com/national/2026/11/11/palpa-s-dhaka-cloth-weaves-its-way-from-festive-gifts-to-tourist-keepsakes); [Kathmandu Post: cheap fabrics threaten Palpali Dhaka (2024)](https://kathmandupost.com/money/2024/02/14/deluge-of-cheap-fabrics-and-modernity-threaten-palpali-dhaka-industry); [World Bank: artisans in Nepal](https://www.worldbank.org/en/news/feature/2018/02/07/artisans-in-nepal-honoring-tradition-crafting-modern); [FAO Forest and Farm Facility (allo)](https://www.fao.org/forest-farm-facility/news-and-events/news-detail/en/c/1756481/); [Onlinekhabar: allo products](https://english.onlinekhabar.com/allo-products-nepal.html)
- Nepal LDC timing (secondary): [Trishakti Apparel duty tracker](https://trishaktiapparel.com/duty-status/); [Digital Solution Nepal](https://digitalsolutionnepal.com/nepal-ldc-graduation-2026/); [Himalayan Times on UK DCTS](https://thehimalayantimes.com/ampArticle/1039391)

**Vendors**
- [Stripe UK pricing](https://stripe.com/gb/pricing); [Supabase pricing](https://supabase.com/pricing); [Vercel fair-use guidelines](https://vercel.com/docs/limits/fair-use-guidelines) and [Hobby plan](https://vercel.com/docs/plans/hobby); [Resend pricing](https://resend.com/pricing) and [pricing FAQ](https://resend.com/docs/knowledge-base/what-is-resend-pricing); [postcodes.io licences](https://api.postcodes.io/docs/licences); [Royal Mail Click & Drop](https://parcel.royalmail.com/click-and-drop), [Click & Drop API help](https://help.parcel.royalmail.com/hc/en-gb/articles/360011462338), [Royal Mail APIs](https://royalmail.com/business/tools-services/apis); [Cloudinary billing & plans](https://cloudinary.com/documentation/billing_and_plans), [Cloudinary free-plan FAQ](https://cloudinary.com/documentation/developer_onboarding_faq_free_plan)
