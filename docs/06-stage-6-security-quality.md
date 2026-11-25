# WILD MUSE — Stage 6: Security Hardening, Accessibility, Performance & Load

_Completed 25 November 2026. Status: Stage 6 complete, awaiting go-ahead for Stage 7 (deployment & launch)._

All results below were measured on a production build (`next build` + `next start`) against the real PostgreSQL
database, on a 4-CPU cloud container. They were not estimated.

## 1. Security hardening

### HTTP security headers (`src/config/security-headers.ts`, applied in `next.config.ts`)
| Header | Value / purpose |
|---|---|
| Content-Security-Policy | `default-src 'self'`; scripts, images, media and connections only from our own origin. The Supabase storage origin and analytics/pixel origins are added **only when configured**. `object-src 'none'`, `frame-src 'none'`, `frame-ancestors 'none'` (no clickjacking), `base-uri 'self'`, `form-action 'self' https://checkout.stripe.com`, `upgrade-insecure-requests` (HTTPS sites only). |
| Strict-Transport-Security | `max-age=63072000; includeSubDomains; preload`, in production only |
| X-Frame-Options | `DENY` (for older browsers) |
| X-Content-Type-Options | `nosniff` |
| Referrer-Policy | `strict-origin-when-cross-origin` |
| Permissions-Policy | camera, microphone, geolocation, payment, USB and FLoC/Topics are all disabled |
| Cross-Origin-Opener-Policy | `same-origin` |
| X-Powered-By | removed |
| Private areas (`/admin`, `/account`, `/checkout`, `/api`, `/invoice`) | `X-Robots-Tag: noindex, nofollow` and `Cache-Control: private, no-store` |

**CSP trade-off.** A nonce-based CSP would make every page render on each request, so catalogue pages could no longer
be cached. The policy therefore allows inline scripts. These are needed for the Next.js page payload; the site has no
user-generated HTML, and React escapes all output. Everything else is restricted to exact origins. This is the
pattern Next.js documents for cached sites. If the business later needs a strict nonce CSP, it can be switched on in
the proxy at the cost of page caching.

Verified: the full E2E suite records CSP violations in the browser and found **0**. Unit tests cover the policy builder (5 tests).

### Dependency audit
`npm audit` reported 6 issues (2 critical), all in **development tools**, none in code that ships to the site:
- vitest's worker pool: fixed by upgrading to vitest 5.1.1
- Prisma CLI's config parser (`effect`): fixed with a patched-version override
- the load-test tool: now run outside the project

Result: **`npm audit`: 0 vulnerabilities.**

### Security probes (production build)
| Probe | Result |
|---|---|
| 12 wrong-password sign-ins from one IP | 5 × 401, then **429** (rate-limited) |
| Stripe webhook without a signature | 400 |
| Cron endpoint without `CRON_SECRET` | 401. With no secret configured it refuses everything, so it fails closed |
| `/admin` while signed out | redirect to sign-in; customers get a 404 (Stage 4) |
| HTTP TRACE | 405 |
| Role injection at sign-up, wrong-origin requests, forged order prices | rejected (Stage 4/5 tests, still passing) |

### Security review checklist (OWASP Top 10, 2021)
| Risk | Status |
|---|---|
| A01 Broken access control | Every admin page and action re-checks the permission on the server; customers can only load their own orders; the role matrix is in code |
| A02 Cryptographic failures | HTTPS + HSTS; passwords hashed by Better Auth (scrypt); no card data stored; private documents are not public |
| A03 Injection | Prisma parameterised queries; zod validation on every input; CSV-injection guard; no raw HTML rendering |
| A04 Insecure design | Prices, stock and payment state are worked out only on the server; stock is reserved in transactions; webhooks are idempotent |
| A05 Misconfiguration | Security headers; X-Powered-By removed; `.env` gitignored; private pages are noindex/no-store |
| A06 Vulnerable components | `npm audit` clean; dependency versions pinned in the lockfile |
| A07 Auth failures | Rate limits; email verification; reset links expire in 1 hour and sign out other sessions; suspending an account revokes its sessions |
| A08 Integrity failures | Stripe webhook signatures verified; amount checked against the order |
| A09 Logging & monitoring | Admin audit log; payment and webhook errors logged. Error alerting (e.g. Sentry) is a Stage 7 recommendation |
| A10 SSRF | Outbound calls go only to fixed hosts (Stripe, Resend, Royal Mail, postcodes.io); no user-supplied URLs are fetched |

## 2. Accessibility (WCAG 2.2 AA)

**Automated audit (axe-core 4, WCAG 2.0/2.1/2.2 A + AA + best practice).**
- Pages covered: 19 storefront pages on desktop and phone, 6 account pages and 20 admin pages (64 page audits in total).
- First run: **30+ issues** (3 types serious or critical). All were fixed. Final run: **0 violations on all 64.**

| Issue found | Fix |
|---|---|
| Low-contrast "Explore" and "Handmade in Nepal" labels on green (3.4–3.5:1) | Lighter colours, now 5.3:1 and 6.6:1. Both pairs added to `npm run check:contrast` |
| Phone sort menu had no accessible name | The "Sort by" label is kept for screen readers on phones |
| Phone image gallery could not be reached by keyboard | Focusable region with a visible focus ring, labelled "swipe or use arrow keys" |
| Headings skipped levels (h1 → h3) on listings, product pages, FAQs and empty states | Hidden "Products" heading on listings; accordion and empty-state heading levels now follow the page outline |
| A store 404 placed one `<main>` inside another | Store 404 page added inside the store layout, with header and footer |
| Admin tables had empty column headers | Screen-reader labels ("Image", "Actions") |

**Lighthouse accessibility: 100 on every page tested.** Automated tools catch roughly 30–50% of accessibility
problems. Before launch, a manual screen-reader check (VoiceOver on iPhone, NVDA on Windows) is recommended; it's in
the Stage 7 checklist.

## 3. Performance (Lighthouse 12)
| Page | Mobile perf | Desktop perf | Accessibility | Best practices | SEO | Mobile LCP | CLS |
|---|---|---|---|---|---|---|---|
| Home | 80 | 100 | 100 | 100 | 100 | 3.2 s | 0 |
| Women (listing) | 88 | 100 | 100 | 100 | 100 | 3.1 s | 0 |
| Product | 89 | 100 | 100 | 100 | 100 | 3.4 s | 0 |
| Handmade in Nepal | 94 | 100 | 100 | 100 | 100 | 3.0 s | 0 |
| FAQs | 87 | 100 | 100 | 100 | 100 | 3.3 s | 0 |
| Bag | 87 | 100 | 100 | 100 | 63* | 3.8 s | 0.075 |

\* The bag page is deliberately hidden from search engines (noindex), which Lighthouse scores as an SEO failure. This is correct behaviour.

Mobile figures use Lighthouse's simulated slow 4G and a 4× slower CPU, served from a test container rather than a CDN.
The main drag is the **placeholder artwork**: about 2,900 SVG elements on the home page (a 4,100-element page). They
are replaced when real product photography is uploaded; photos load as optimised images. **Re-run Lighthouse after
uploading real photos** (Stage 7 checklist). On a CDN (Vercel), page response time (TTFB) also drops.

## 4. Load test (autocannon, 50 concurrent connections, 15 s per page)
| Page | Requests/s | p50 | p97.5 | p99 | Errors |
|---|---|---|---|---|---|
| Home | 235 | 202 ms | 320 ms | 412 ms | 0 |
| Women (listing) | 932 | 52 ms | 76 ms | 104 ms | 0 |
| Product | 563 | 86 ms | 156 ms | 174 ms | 0 |
| Search (live database) | 103 | 463 ms | 718 ms | 734 ms | 0 |
| FAQs | 934 | 52 ms | 75 ms | 103 ms | 0 |

There were no errors, timeouts or non-200 responses: about **33,000 requests in 75 seconds** on one small server.
For scale, a busy independent boutique might see a few requests per second at peak. Concurrency safety on the
write side (two shoppers buying the last item) was tested in Stage 4 and still passes.

## 5. Regression results
| Check | Result |
|---|---|
| typecheck, lint, Prettier | ✔ clean |
| Unit + integration tests | ✔ **39/39** (new: security headers ×5) |
| End-to-end browser suite | ✔ **54/54** (new: no CSP violations) |
| `npm audit` | ✔ 0 vulnerabilities |
| WCAG contrast token check | ✔ all pairs pass |

## 6. Still outstanding
| Item | Who / when |
|---|---|
| Live Stripe Checkout + refund test | The Stripe credential saved in the environment is still invalid (Stripe: "Invalid API Key provided: Namit…"). The owner needs to fix it in the environment's Network secrets |
| Resend and Click & Drop live tests | Need keys (optional until launch) |
| Manual screen-reader pass; Lighthouse re-run with real photos | Stage 7 launch checklist |
| Error monitoring (e.g. Sentry free tier), uptime check | Stage 7 recommendation |
