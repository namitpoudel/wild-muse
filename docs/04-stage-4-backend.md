# WILD MUSE — Stage 4: Backend, Database, Authentication & Admin

_Completed 22 November 2026. Status: Stage 4 complete, awaiting go-ahead for Stage 5 (payments, shipping & notifications)._

The shop now runs on a real PostgreSQL database. Customers have accounts, the bag and wishlist are stored on the server,
and the owner can run the business from the admin dashboard without touching code.

## 1. Architecture as built

| Layer | Implementation |
|---|---|
| Database | PostgreSQL 16 via **Prisma 7** (`prisma/schema.prisma`, driver adapter `@prisma/adapter-pg`) |
| Migrations | `prisma/migrations/…_init` (tables) + `…_constraints` (CHECK constraints, case-insensitive email index, trigram/full-text indexes, Row Level Security) |
| Auth | **Better Auth** (email + password, sessions in our DB, rate limiting, password reset, email verification) |
| Data access | `src/server/**` — every module imports `server-only`; UI never touches the DB directly |
| Caching | Next.js Cache Components: catalogue/settings/content reads are `use cache` + tagged; writes call `updateTag` so changes appear immediately |
| Files | Storage adapter (`src/server/storage`): `local` for development, `supabase` for production; images re-encoded with sharp |
| Email | Email adapter (`src/server/email`): `console` in development, Resend in production (wired and tested in Stage 5) |

### Database entities
`user`, `session`, `account`, `verification`, `rateLimit`, `Address`, `Category` (self-referencing tree), `Collection`,
`CollectionProduct`, `TaxClass`, `Product`, `ProductColour`, `ProductVariant` (includes inventory: on-hand / reserved /
low-stock threshold), `ProductImage` (images and video), `StockMovement` (append-only ledger), `Cart`, `CartItem`,
`WishlistItem`, `Coupon`, `CouponRedemption`, `Order`, `OrderItem`, `Payment`, `Refund`, `ProcessedWebhookEvent`,
`ShippingMethod`, `Shipment`, `ShipmentEvent`, `ReturnRequest`, `Review`, `ReviewImage`, `ReviewReport`,
`NewsletterSubscriber`, `ConsentRecord`, `Supplier`, `Artisan`, `PurchaseOrder`, `PurchaseOrderItem`, `ImportShipment`,
`SupplierDocument`, `SiteSetting`, `ContentPage`, `AuditLog`.

**Deliberate simplifications from the Stage 1 plan:**
- *Inventory* lives on `ProductVariant` rather than a separate table: one row per sellable item makes atomic stock updates simpler.
- *Roles/Permissions* are a matrix in code (`src/server/auth/permissions.ts`) rather than editable rows. A compromised admin account therefore cannot grant itself new powers. Owners and admins assign **roles** to people in the admin.
- *Navigation menus* are generated from the live category tree, so adding a category in the admin updates the menu automatically.

## 2. Safety guarantees (and how they're enforced)

| Guarantee | How |
|---|---|
| Never oversell | Stock is reserved inside a transaction with a conditional `UPDATE … WHERE on_hand − reserved ≥ qty`. DB CHECK constraints forbid negative stock or reserved > on-hand. **Tested:** two simultaneous checkouts for the last unit → exactly one succeeds. |
| Never trust browser prices | Cart lines, coupons, delivery and VAT are recalculated on the server for every quote and again when the order is created. |
| Payment confirmation only from the provider | `markOrderPaid()` is idempotent, checks the paid amount equals the order total, and will only be called from the signature-verified Stripe webhook (Stage 5). Without Stripe configured, checkout refuses to create orders. |
| Abandoned checkouts release stock | Reservations expire (default 30 min). A protected cron route `/api/cron/release-reservations` sweeps them (`vercel.json`). |
| Server-side authorisation | Every admin page calls `requirePermission()`. Every server action is wrapped in `adminAction()`, which re-checks the session and permission and validates input with zod. The admin shell itself doesn't render until a staff session is confirmed. |
| No role escalation | `role` can't be set at sign-up. Only the owner can create admins or owners, and the last owner can't be removed. The first owner is created by CLI (`npm run admin:create`). |
| Rate limiting | Sign-in 5/min, sign-up 3/min, password reset, checkout, coupons, newsletter, enquiries, order tracking and reviews are all limited (Postgres-backed, works across serverless instances). |
| CSRF | Better Auth checks the request origin. Server Actions use Next.js's built-in origin checks. |
| Secure uploads | File types are checked from the actual bytes, sizes are capped, images are re-encoded (removing EXIF/GPS data) and file names are generated on the server. Supplier documents are stored privately and served only to staff. |
| XSS | React escaping; content pages use a restricted text format (no raw HTML); JSON-LD is escaped. |
| CSV injection | Exported cells beginning with `= + - @` are prefixed. |
| Audit trail | Every admin change writes an `AuditLog` row (who, what, before/after, hashed IP). |
| Account enumeration | Password reset and order tracking give identical responses whether or not the account or order exists. |

## 3. Customer features now live
- Register, sign in/out, verify email, reset password (1-hour links that sign out other sessions), change password.
- **The bag is stored on the server.** It persists across visits, and a guest bag merges into the account on sign-in. Quantities are capped to live stock, and problem lines ("Sold out", "Only 2 available") are flagged before checkout.
- **The wishlist is stored on the server when signed in.** A guest wishlist merges into the account on sign-in.
- Live stock on product pages (fetched fresh, bypassing the page cache).
- Checkout totals are calculated by the server: delivery methods from the database, the free-delivery threshold, coupon validation (dates, limits, minimum spend, first order only, per-customer limit), and VAT when registered. Saved addresses are offered at checkout.
- Account pages: overview, orders and order detail (with tracking), invoices (VAT invoice once registered), addresses, details & email preferences, reviews, GDPR data export (JSON) and account deletion (password + typed confirmation; orders are kept but detached from the account, reviews anonymised).
- Reviews: 1–5 stars, text, up to 3 photos, edit, report. The **verified-purchase badge is calculated from paid orders**. Every review is moderated, and ratings are recalculated only from published reviews.
- Newsletter with **double opt-in**. The consent text, timestamp and source are stored. After confirmation the subscriber receives a unique one-time welcome code (first order only, 60 days). One-click unsubscribe.
- Contact, wholesale and "ask about this product" forms email the shop inbox (honeypot field + rate limit).
- Guest order tracking needs both the order number and the email used.
- "Meet the Artisans" shows only profiles with recorded written consent.

## 4. Admin dashboard (`/admin`)
| Section | What the owner can do |
|---|---|
| Dashboard | Total sales (net of refunds), today, this month, average order value, order counts by stage, customers, 30-day revenue chart, best sellers by units, low-stock list, recent orders, demo-data reminder |
| Reports | Sales by month (orders, revenue, discounts, delivery, VAT) and gross margin per product |
| Orders | Search by number, email, name or SKU; filter by status and date; detail view; status workflow; **dispatch** with carrier and tracking (Royal Mail, Parcelforce, DPD, Evri, DHL links built automatically) plus a customer email; mark delivered; cancel (restock option, customer email); internal notes; invoice; **CSV export** |
| Customers | List and search, lifetime spend, order history, suspend/reactivate (signs them out everywhere), change role |
| Discount codes | % / £ / free delivery, start and end dates, total and per-customer limits, minimum spend, first order only, deactivate |
| Reviews | Moderation queue, reported reviews, publish/reject with reason |
| Products | List and filter; create/edit every field; colour × size **variant matrix** with SKU, stock, price override and availability; images and video upload (reorder, alt text, delete); collections; tax class; supplier; landed cost; SEO; draft/published/archived; **publishing blocked until "labelling & safety checked" is ticked**; delete (archives if there are orders); remove all demo products |
| Inventory | All variants with available/reserved stock; record received, correction, damaged or returned stock with a reason; full movement history |
| Categories & collections | Create/edit/hide categories and subcategories (menus update automatically); collections with images, featured flag and SEO |
| Suppliers | Supplier records (Nepal contacts, currency, terms, lead time, certifications), artisan profiles with consent tracking and photos, private documents (invoices, origin statements, C79s) |
| Purchase orders | Lines in the supplier's currency at the exchange rate actually paid, status workflow, link to an import shipment; **receiving adds stock through the ledger** and calculates landed cost per unit |
| Import shipments | Freight, duty, import VAT (reclaimable or not), broker and other fees, DCTS claim, EORI, C79 reference; landed-cost allocation across all purchase orders in the shipment |
| Pages & policies | Edit every information/policy page and Handmade in Nepal story in a simple text format; legal-review notice toggle; create and delete pages |
| Homepage & announcements | Hero text, buttons and images; slogan; announcement bar messages |
| Store settings | Business details, social links, VAT registration (requires a VAT number), VAT on delivery, returns window (minimum 14 days enforced), newsletter discount, checkout stock-hold time, guest checkout, popular searches, default SEO, delivery methods, tax classes |
| Staff & roles | Grant/revoke Staff/Manager/Admin/Owner roles and view the permission matrix |
| Audit log | Searchable history of every admin action |

## 5. Verification

| Check | Result |
|---|---|
| `npm run typecheck`, `npm run lint`, Prettier | ✔ clean |
| `next build` | ✔ 171 routes |
| Unit + integration tests (`npm test`) | ✔ **25/25**: pricing/VAT/discount engine (14), transaction-safe orders against real Postgres (5, including the concurrency test), content format round-trip (2), landed cost & margin (4) |
| End-to-end browser test against a production build + real DB | ✔ **44/44** checks: guest bag persistence, server totals, invalid coupon rejected, no order without a payment provider, registration with bag/wishlist merge, address + postcode normalisation, GDPR export, admin locked to customers and anonymous users, order → account → invoice, verified review → moderation → published, dashboard totals, dispatch + tracking + customer email, price edit visible immediately on the storefront, compliance gate, discount code applied at checkout, announcement edit, supplier → shipment → PO → receive (stock +4, landed cost £26.20 checked by hand), all 15 admin sections load, guest tracking (and refusal with the wrong email), admin usable on a phone, edited pages regenerate, unknown URLs → 404, no page errors |
| Auth API probes | ✔ role injection at sign-up ignored; weak password rejected; wrong-origin requests rejected; sign-up rate limit triggers |

### Bugs found and fixed during testing
1. Unknown URLs returned **500 instead of 404**, and edited pages failed to regenerate. The cause was the experimental Partial Prefetching flag combined with top-level `params`. The flag is now off, and the documented blocking-ISR pattern is used.
2. `revalidateTag(…, { expire: 0 })` made cache entries "dynamic holes" during regeneration. Server actions now use `updateTag`.
3. Signing in could land back on the login page, because a signed-out prefetch of `/account` was reused. Navigation after an auth change is now a full page load.
4. Admin forms produced duplicate element IDs, which broke label association for screen readers. Each field now gets a unique ID.
5. The admin sidebar (menu labels only) rendered for signed-in customers before the not-found page. The whole admin shell is now behind the staff check.
6. The bag's product image was a duplicate link for screen readers. It is now hidden from assistive technology.
7. Every admin page prefetched all ~18 admin sections, which was unnecessary database load. Prefetch is now off for admin navigation.

## 6. Not yet done (by design — later stages)
| Item | Stage |
|---|---|
| Stripe Checkout session, signature-verified webhook → `markOrderPaid`, order confirmation email, refunds through Stripe from the admin (the button is present but says so) | 5 |
| Resend email in production (the adapter is written; it needs an API key and a verified domain) | 5 |
| Royal Mail Click & Drop API adapter (manual dispatch with tracking links works now) | 5 |
| Return-request workflow UI (the table exists; returns are currently handled by email plus admin cancel/restock) | 5 |
| Security headers / CSP, Lighthouse and accessibility audit, load tests | 6 |
| Deployment guide, backups, launch checklist | 7 |

## 7. External configuration required
- **None to run locally.** See the README for setup with a local PostgreSQL.
- For production (Stage 7): a Supabase project (database + storage buckets `media` public and `private`), `BETTER_AUTH_SECRET`, and `CRON_SECRET`. See `.env.example`.
