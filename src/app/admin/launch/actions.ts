"use server";

import { z } from "zod";
import { adminAction, AdminError } from "@/server/admin/action";
import { connectStripeWebhook } from "@/server/payments/webhook-setup";
import { isStripeConfigured } from "@/server/payments/stripe";
import { audit } from "@/server/security/audit";

const connect = adminAction(
  "settings.manage",
  z.object({}),
  async (_d, actor) => {
    if (!isStripeConfigured()) throw new AdminError("Connect Stripe to the project first (STRIPE_SECRET_KEY).");
    try {
      const r = await connectStripeWebhook();
      await audit(
        actor,
        "stripe.webhook.connect",
        { type: "Setting", id: "stripeWebhook" },
        { summary: `${r.url} (${r.livemode ? "live" : "test"} mode)` },
      );
      return r;
    } catch (e) {
      throw new AdminError(`Stripe refused: ${(e as Error).message}`);
    }
  },
  { message: "Stripe webhook connected" },
);

export async function connectStripeWebhookAction() {
  return connect({});
}
