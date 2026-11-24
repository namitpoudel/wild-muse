"use server";

import { z } from "zod";
import { emailSchema } from "@/lib/validation";
import { sendEmail } from "@/server/email";
import { layout } from "@/server/email/templates";
import { rateLimit } from "@/server/security/rate-limit";
import { getSettings } from "@/server/settings";
import { fail, ok, zodFieldErrors, type ActionResult } from "./result";

const schema = z.object({
  kind: z.enum(["contact", "wholesale", "product"]),
  name: z.string().trim().min(1, "Enter your name").max(100),
  email: emailSchema,
  message: z.string().trim().min(10, "Please write a little more (at least 10 characters)").max(2000),
  topic: z.string().trim().max(80).optional(),
  order: z.string().trim().max(20).optional(),
  business: z.string().trim().max(120).optional(),
  website: z.string().trim().max(200).optional(),
  type: z.string().trim().max(60).optional(),
  product: z.string().trim().max(160).optional(),
  company_website: z.string().max(0).optional(), // honeypot must be empty
});

/** Contact / wholesale / "ask about this product" enquiries → emailed to the shop inbox. */
export async function sendEnquiryAction(input: Record<string, string>): Promise<ActionResult<null>> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    if (parsed.error.issues.some((i) => i.path[0] === "company_website")) return ok(null, "Thanks — we'll be in touch."); // silently drop bots
    return fail("Please check the highlighted fields.", zodFieldErrors(parsed.error.issues));
  }
  if (parsed.data.kind === "wholesale" && !parsed.data.business)
    return fail("Please check the highlighted fields.", { business: "Enter your business name" });
  const rl = await rateLimit("enquiry", { max: 5, windowSeconds: 900 });
  if (!rl.ok) return fail("You've sent several messages recently — please try again later or email us directly.");
  const d = parsed.data;
  const s = await getSettings();
  const title =
    d.kind === "wholesale" ? "Wholesale enquiry" : d.kind === "product" ? `Product question: ${d.product}` : `Contact form: ${d.topic ?? "General"}`;
  const lines = [
    `From: ${d.name} <${d.email}>`,
    d.order && `Order: ${d.order}`,
    d.business && `Business: ${d.business} (${d.type ?? "—"})`,
    d.website && `Website: ${d.website}`,
    "",
    d.message,
  ].filter((l): l is string => typeof l === "string");
  const { html, text } = await layout({ title, intro: `New ${d.kind} enquiry from the website.`, paragraphs: lines });
  const sent = await sendEmail({
    to: s.business.email,
    replyTo: d.email,
    subject: `[Wild Muse] ${title}`,
    html,
    text,
    tags: { type: `enquiry-${d.kind}` },
  });
  if (!sent.ok) return fail("Sorry, your message couldn't be sent. Please email us directly.");
  return ok(null, "Thanks — we'll reply within one working day.");
}
