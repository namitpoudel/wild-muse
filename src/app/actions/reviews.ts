"use server";

import { z } from "zod";
import { getCurrentUser } from "@/server/auth/session";
import { db } from "@/server/db";
import { hasPurchased, publicName, recomputeRating } from "@/server/reviews";
import { rateLimit } from "@/server/security/rate-limit";
import { newKey, processImage, putObject, UploadError } from "@/server/storage";
import { fail, ok, zodFieldErrors, type ActionResult } from "./result";

const reviewSchema = z.object({
  productId: z.string().min(1).max(40),
  rating: z.coerce.number().int().min(1, "Choose a star rating").max(5),
  title: z.string().trim().min(2, "Add a short title").max(80),
  body: z.string().trim().min(20, "Please write at least 20 characters").max(2000),
  variantLabel: z.string().trim().max(60).optional(),
});

/**
 * Create or edit the signed-in customer's review. New and edited reviews go to moderation.
 * Up to 3 photos, validated and re-encoded server-side.
 */
export async function submitReviewAction(formData: FormData): Promise<ActionResult<{ status: string }>> {
  const user = await getCurrentUser();
  if (!user) return fail("Please sign in to write a review.");
  const rl = await rateLimit("review", { max: 5, windowSeconds: 3600, key: user.id });
  if (!rl.ok) return fail("You've submitted several reviews recently — please try again later.");

  const parsed = reviewSchema.safeParse(
    Object.fromEntries(["productId", "rating", "title", "body", "variantLabel"].map((k) => [k, formData.get(k) ?? undefined])),
  );
  if (!parsed.success) return fail("Please check the highlighted fields.", zodFieldErrors(parsed.error.issues));
  const d = parsed.data;
  const product = await db.product.findFirst({ where: { id: d.productId, status: "PUBLISHED", deletedAt: null }, select: { id: true } });
  if (!product) return fail("This product can't be reviewed.");

  const files = formData
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0)
    .slice(0, 3);
  const uploads: { url: string }[] = [];
  try {
    for (const f of files) {
      const img = await processImage(f, { maxBytes: 8 * 1024 * 1024, maxEdge: 1600 });
      const stored = await putObject(newKey("reviews", img.ext), img.buffer, img.contentType, "public");
      uploads.push({ url: stored.url! });
    }
  } catch (e) {
    return fail(e instanceof UploadError ? e.message : "We couldn't upload your photo.");
  }

  const verifiedPurchase = await hasPurchased(user.id, product.id); // computed, never trusted from input
  const existing = await db.review.findUnique({ where: { productId_userId: { productId: product.id, userId: user.id } } });
  await db.$transaction(async (tx) => {
    const data = {
      rating: d.rating,
      title: d.title,
      body: d.body,
      variantLabel: d.variantLabel || null,
      verifiedPurchase,
      status: "PENDING" as const,
      authorName: publicName(user.name),
    };
    const review = existing
      ? await tx.review.update({ where: { id: existing.id }, data: { ...data, editedAt: new Date() } })
      : await tx.review.create({ data: { ...data, productId: product.id, userId: user.id } });
    if (uploads.length) await tx.reviewImage.createMany({ data: uploads.map((u) => ({ reviewId: review.id, url: u.url })) });
    if (existing?.status === "APPROVED") await recomputeRating(product.id, tx); // edited review is re-moderated
  });
  return ok(
    { status: "PENDING" },
    existing
      ? "Thanks — your updated review will appear once checked."
      : "Thanks! Your review will appear once it's been checked (usually within 2 working days).",
  );
}

export async function reportReviewAction(input: { reviewId: string; reason: string }): Promise<ActionResult<null>> {
  const parsed = z
    .object({ reviewId: z.string().min(1).max(40), reason: z.string().trim().min(3, "Tell us briefly what's wrong").max(500) })
    .safeParse(input);
  if (!parsed.success) return fail("Please tell us briefly what's wrong.");
  const rl = await rateLimit("report-review", { max: 5, windowSeconds: 3600 });
  if (!rl.ok) return fail("Too many reports — please try again later.");
  const user = await getCurrentUser();
  const review = await db.review.findUnique({ where: { id: parsed.data.reviewId }, select: { id: true } });
  if (!review) return fail("Review not found.");
  await db.reviewReport.create({ data: { reviewId: review.id, reporterId: user?.id ?? null, reason: parsed.data.reason } });
  return ok(null, "Thanks — our team will look at this review.");
}

/** What the current visitor may do on a product page's review section. */
export async function getReviewEligibilityAction(productId: string) {
  const user = await getCurrentUser();
  if (!user || !z.string().max(40).safeParse(productId).success) return { signedIn: false, purchased: false, existing: null };
  const [purchased, existing] = await Promise.all([
    hasPurchased(user.id, productId),
    db.review.findUnique({
      where: { productId_userId: { productId, userId: user.id } },
      select: { rating: true, title: true, body: true, status: true },
    }),
  ]);
  return { signedIn: true, purchased, existing };
}
