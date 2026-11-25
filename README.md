# WILD MUSE

Premium bohemian and handmade Nepali fashion — a UK e-commerce platform built with Next.js 16, TypeScript, Tailwind CSS,
PostgreSQL (Prisma 7) and Better Auth.

> Project status: **Stage 6 of 7 complete** (security headers, WCAG 2.2 AA audit, Lighthouse, load test). See `docs/`.

## Run locally

Requires **Node.js 22+** and **PostgreSQL 15+**.

1. Install dependencies (this also generates the Prisma client):

```bash
npm install
```

2. Create a database and user (example for a local PostgreSQL):

```bash
sudo -u postgres psql -c "CREATE ROLE wildmuse LOGIN PASSWORD 'wildmuse_dev' CREATEDB;" -c "CREATE DATABASE wildmuse OWNER wildmuse;"
```

3. Copy the environment file and set a secret:

```bash
cp .env.example .env
```

```bash
openssl rand -base64 32
```

Paste the output into `BETTER_AUTH_SECRET` in `.env`.

4. Create the tables and load the starter data (categories, delivery methods, tax classes, pages and the **demo** catalogue):

```bash
npm run db:migrate
```

```bash
npm run db:seed
```

Use `SEED_DEMO=false npm run db:seed` to skip the demo products.

5. Start the app:

```bash
npm run dev
```

6. Create the owner account: register at http://localhost:3000/register, then promote it:

```bash
npm run admin:create -- you@example.com
```

The admin dashboard is at http://localhost:3000/admin. In development, emails (verification, password reset, order
updates) are printed to the terminal instead of being sent.

### Payments in development

Set `STRIPE_SECRET_KEY` to a **test** key (`sk_test_…`). To receive webhooks locally, use the Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the `whsec_…` it prints into `STRIPE_WEBHOOK_SECRET`. Pay with test card `4242 4242 4242 4242`. Without a Stripe key,
checkout refuses to create orders. There is no simulated payment.

## Scripts

| Command                                  | Purpose                                               |
| ---------------------------------------- | ----------------------------------------------------- |
| `npm run dev`                            | Development server                                    |
| `npm run build` / `npm start`            | Production build / server                             |
| `npm test`                               | Unit + integration tests (needs the database)         |
| `npm run typecheck`                      | Route types + TypeScript                              |
| `npm run lint` / `npm run format`        | ESLint / Prettier                                     |
| `npm run db:migrate`                     | Apply migrations (development)                        |
| `npm run db:deploy`                      | Apply migrations (production)                         |
| `npm run db:seed`                        | Seed reference data (+ demo catalogue)                |
| `npm run db:studio`                      | Browse the database                                   |
| `npm run admin:create -- <email> [ROLE]` | Give an existing account a staff role (default OWNER) |
| `npm run check:contrast`                 | WCAG 2.2 AA contrast check for the colour tokens      |

## Project structure

```
prisma/              schema, migrations, seed
src/app/             routes — (store) storefront, admin, account, api, server actions
src/components/      UI components (ui, layout, product, cart, checkout, admin, …)
src/server/          server-only domain logic: auth, catalogue, cart, pricing, orders, sourcing, storage, email, security
src/lib/             shared pure helpers (money, postcode, validation, content format, SEO)
src/content/         first-run copy for policy/info pages (seeded into the database)
tests/               integration tests and E2E fixtures
docs/                stage reports and screenshots
```

## Documentation

- `docs/01-stage-1-research-and-plan.md` — market research, UK compliance, architecture, database design, costs
- `docs/02-stage-2-design-system.md` — brand, design system, UI
- `docs/03-stage-3-frontend.md` — search, content pages, cookie consent, SEO
- `docs/04-stage-4-backend.md` — database, auth, cart/orders, admin, security model, test results
- `docs/05-stage-5-payments-shipping.md` — Stripe, webhooks, refunds, returns, Click & Drop, emails, test status
- `docs/06-stage-6-security-quality.md` — security headers/CSP, OWASP review, accessibility audit, Lighthouse, load test
- `docs/screenshots/` — desktop, mobile and admin screenshots
