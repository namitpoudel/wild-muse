"use server";

import { z } from "zod";
import { ok } from "@/app/actions/result";
import { adminAction, AdminError, formToObject } from "@/server/admin/action";
import { TAGS } from "@/server/cache";
import { db } from "@/server/db";
import { recomputeRating } from "@/server/reviews";
import { audit } from "@/server/security/audit";

const moderate = adminAction(
  "reviews.moderate",
  z.object({ id: z.string().max(40), status: z.enum(["APPROVED", "REJECTED", "PENDING"]), moderationNote: z.string().trim().max(300).optional() }),
  async (d, actor) => {
    const r = await db.review.findUnique({ where: { id: d.id } });
    if (!r) throw new AdminError("Review not found.");
    if (d.status === "REJECTED" && !d.moderationNote) throw new AdminError("Give a reason when rejecting (kept for your records).");
    await db.$transaction(async (tx) => {
      await tx.review.update({ where: { id: d.id }, data: { status: d.status, moderationNote: d.moderationNote || null } });
      await tx.reviewReport.updateMany({ where: { reviewId: d.id, resolved: false }, data: { resolved: true } });
      await recomputeRating(r.productId, tx);
      await audit(
        actor,
        `review.${d.status.toLowerCase()}`,
        { type: "Review", id: d.id },
        { summary: `${r.rating}★ "${r.title}"${d.moderationNote ? ` — ${d.moderationNote}` : ""}` },
        tx,
      );
    });
    return ok(null, d.status === "APPROVED" ? "Review published" : d.status === "REJECTED" ? "Review rejected" : "Moved back to pending");
  },
  { tags: [TAGS.reviews, TAGS.products] },
);
export async function moderateReviewAction(fd: FormData) {
  return moderate(formToObject(fd));
}
