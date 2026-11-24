# WILD MUSE — Stage 5: Payments, Shipping, Notifications & Returns

_Completed 24 November 2026. Status: Stage 5 built and tested locally. A **live Stripe test payment is still to be done**:
the Stripe key saved in the environment is invalid (see §6)._

## 1. What was built

| Area | Implementation |
|---|---|
| Stripe Checkout | `src/server/payments/stripe.ts`. Hosted Stripe Checkout, so card data never touches our servers. Line items, delivery and the discount are built **from the server-side order**, never from the browser. The session's `amount_total` must equal the order total, or it is not used. Idempotency keys stop duplicate sessions or coupons. |
| Webhook | `POST /api/webhooks/stripe`. The raw body is verified with `STRIPE_WEBHOOK_SECRET` (`constructEventAsync`), so a bad signature gets a 400. Each event is processed **exactly once** (`ProcessedWebhookEvent`). Events handled: `checkout.session.completed`, `async_payment_succeeded` / `failed`, `expired`, `refund.created/updated/failed`, `charge.dispute.created`. |
| Marking paid | Only the verified webhook (or a server-to-Stripe re-check) calls `markOrderPaid`. If the amount Stripe charged doesn't match the order, the order is **not** marked paid and Stripe retries. The success page is read-only: it shows "confirming payment…" and polls until the webhook has landed. |
| Failed / abandoned payments | Cancelling, an expired session or a failed delayed payment cancels the pending order and releases the reserved stock. If Stripe can't be reached when the order is placed, the order is cancelled at once and the customer keeps their bag. |
| Reconciliation | The cron job `/api/cron/release-reservations` re-checks pending orders directly with Stripe, which covers a missed webhook. Admin order page: **"Check payment with Stripe"** button. |
| Refunds | Admin → order → Refund (full or partial, reason, optional restock). The `Refund` row is written first, then Stripe is called with an idempotency key. Refunds can't exceed the remaining paid amount. The final status comes from the refund webhooks, which also email the customer. A Stripe error is recorded as FAILED and the order is unchanged. |
| Disputes | A chargeback adds an internal note to the order. Respond to it in the Stripe Dashboard. |
| Emails | Order confirmation, new-order alert to the shop, dispatch, refund, return request received, return approved/declined. They go through the email adapter (console in development, Resend in production). |
| Royal Mail Click & Drop | `src/server/shipping-providers/click-and-drop.ts`, built against Royal Mail's published OpenAPI spec. Admin → order → **Send to Click & Drop** creates the order there. Buy and print the label in Click & Drop. **Sync** (or the cron job) pulls back the tracking number and marks the order dispatched. Manual dispatch with a tracking number still works without it. |
| Postcode check | postcodes.io checks UK postcodes at checkout and gives a gentle hint for a likely typo. It **never blocks** checkout. Northern Ireland (BT) postcodes are format-checked only. |
| Returns | Customers request a return from their order page: they pick the items, a reason, and say whether they're cancelling within the 14-day statutory period. Admin → **Returns**: approve, decline (blocked for statutory cancellations, which can't be refused), mark received with restock, then refund from the order. Both the customer and the shop are emailed at each step. |

## 2. Rules from the brief, and how they're met

| Rule | How |
|---|---|
| Never store raw card information | Stripe-hosted Checkout. We store only Stripe IDs (session, payment intent, refund). |
| Paid only after verified webhook | Signature-verified, amount-checked, idempotent. No "success" from the redirect alone. |
| No simulated payments in production | There is no fake-payment code path. Without `STRIPE_SECRET_KEY`, checkout refuses to create orders. |
| No secrets in the frontend | Stripe, Resend and Click & Drop keys are read only in `server-only` modules. Checkout is a redirect, so no publishable key is needed. |
| Don't trust browser prices/stock/payment | Totals are recalculated on the server, stock is reserved in a transaction, and payment state comes only from Stripe. |

## 3. Verification

| Check | Result |
|---|---|
| typecheck, lint, Prettier | ✔ clean |
| `next build` | ✔ 175 routes |
| Unit + integration tests | ✔ **34/34**. New: webhook suite (6): bad signature rejected; paid exactly once with emails sent once on a replayed event; amount mismatch not marked paid; delayed payment; expiry releases stock; refund webhook. Click & Drop request/response mapping (3). |
| End-to-end browser test (production build + real DB) | ✔ **53/53**. New in this stage: Stripe unreachable → order cancelled, stock released, bag kept, honest message; signed webhook over HTTP → order paid, confirmation and shop emails; success page shows the paid order and clears the bag; refund attempt with Stripe refusing → recorded as FAILED, order unchanged; return request → admin approve → customer email; postcode hint. All Stage 4 checks still pass. |

## 4. Tested vs not yet tested (honest status)

| Integration | Status |
|---|---|
| Webhook verification, order state machine, emails, stock | ✔ Tested with real signatures generated locally. |
| Live Stripe Checkout (test card on Stripe's page) | ✘ **Not yet tested.** The saved key is rejected by Stripe ("Invalid API Key provided"). |
| Live Stripe refund | ✘ Not yet tested (same reason). The failure path is tested. |
| Resend (real email delivery) | ✘ Not tested: no API key or verified domain yet. The console driver is tested. |
| Royal Mail Click & Drop | ✘ Not tested live: no API key. Built to the official spec and unit-tested. Needs a Click & Drop account. The API is included with the account; check your plan. |
| postcodes.io | ✔ Reached through the network allowlist (free, no key). |

## 5. Operating notes
- **Stripe webhook (production):** Stripe Dashboard → Developers → Webhooks → add `https://<domain>/api/webhooks/stripe` with
  the events listed in §1, and copy its signing secret into `STRIPE_WEBHOOK_SECRET`. This is covered step by step in Stage 7.
- **Bank holds and disputes:** respond in the Stripe Dashboard. The order note tells staff a dispute exists.
- **Returns policy:** the returns window (minimum 14 days) is set in Store settings. Statutory cancellations can't be declined in the admin.

## 6. What's needed from you
1. **A valid Stripe test secret key** (`sk_test_…`, from Dashboard → Developers → API keys, test mode) saved in the
   environment's secure credential form for `api.stripe.com`. Then the live hosted checkout and a refund can be run end to end.
2. Optional now, needed before launch: a Resend API key and a verified sending domain, and a Royal Mail Click & Drop API key.

## 7. Next
Stage 6: security headers/CSP, accessibility and Lighthouse audits, performance and load testing.
Stage 7: deployment, Stripe live mode and webhooks, backups, launch checklist.
