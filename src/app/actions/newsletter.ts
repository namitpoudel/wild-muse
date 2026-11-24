"use server";

import { z } from "zod";
import { emailSchema } from "@/lib/validation";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { requestSubscription } from "@/server/newsletter";
import { rateLimit } from "@/server/security/rate-limit";
import { fail, ok, type ActionResult } from "./result";

export async function subscribeAction(input: { email: string; consent: boolean; source?: string }): Promise<ActionResult<{ already: boolean }>> {
  const parsed = z.object({ email: emailSchema, consent: z.literal(true), source: z.string().max(40).optional() }).safeParse(input);
  if (!parsed.success)
    return fail(input.consent ? "Please enter a valid email address." : "Please tick the box to confirm you'd like to receive our emails.");
  const rl = await rateLimit("newsletter", { max: 5, windowSeconds: 600 });
  if (!rl.ok) return fail("Too many attempts. Please try again later.");
  const user = await getCurrentUser();
  const res = await requestSubscription(parsed.data.email, parsed.data.source ?? "website", user?.id);
  return ok(res);
}

/** Account → Email preferences. */
export async function setMarketingPreferenceAction(subscribed: boolean): Promise<ActionResult<{ status: string }>> {
  const user = await getCurrentUser();
  if (!user) return fail("Please sign in.");
  if (subscribed) {
    const res = await requestSubscription(user.email, "account-preferences", user.id);
    return ok(
      { status: res.already ? "SUBSCRIBED" : "PENDING" },
      res.already ? "You're already subscribed." : "Check your inbox to confirm your subscription.",
    );
  }
  await db.newsletterSubscriber.updateMany({ where: { email: user.email }, data: { status: "UNSUBSCRIBED", unsubscribedAt: new Date() } });
  return ok({ status: "UNSUBSCRIBED" }, "You've been unsubscribed from marketing emails.");
}
