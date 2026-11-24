"use server";

import { z } from "zod";
import { ok } from "@/app/actions/result";
import { zBool } from "@/lib/zod-helpers";
import { adminAction, AdminError, formToObject } from "@/server/admin/action";
import { TAGS } from "@/server/cache";
import { db } from "@/server/db";
import { emailReturnDecision } from "@/server/returns";
import { audit } from "@/server/security/audit";

type Item = { orderItemId: string; quantity: number; name: string };

const decide = adminAction(
  "orders.update",
  z.object({
    id: z.string().max(40),
    decision: z.enum(["APPROVED", "REJECTED", "RECEIVED"]),
    note: z.string().trim().max(500).optional(),
    restock: zBool,
  }),
  async (d, actor) => {
    const r = await db.returnRequest.findUnique({ where: { id: d.id }, include: { order: true } });
    if (!r) throw new AdminError("Return not found.");
    if (d.decision === "REJECTED" && !d.note) throw new AdminError("Explain why the return is declined (it's emailed to the customer).");
    if (d.decision === "REJECTED" && r.isStatutoryCancellation)
      throw new AdminError(
        "This is within the 14-day statutory cancellation period — it can't be refused except for excluded goods (e.g. unsealed pierced earrings). Contact the customer instead.",
      );
    if (d.decision === "RECEIVED") {
      if (r.status !== "APPROVED" && r.status !== "REQUESTED") throw new AdminError("This return has already been completed.");
      await db.$transaction(async (tx) => {
        for (const it of r.items as Item[]) {
          const oi = await tx.orderItem.findUnique({ where: { id: it.orderItemId } });
          if (!oi) continue;
          if (d.restock && oi.variantId) {
            await tx.productVariant.update({ where: { id: oi.variantId }, data: { stockOnHand: { increment: it.quantity } } });
            await tx.stockMovement.create({
              data: {
                variantId: oi.variantId,
                type: "RETURN",
                quantity: it.quantity,
                orderId: r.orderId,
                reason: "Customer return",
                userId: actor.id,
              },
            });
          }
          await tx.orderItem.update({ where: { id: oi.id }, data: { refundedQuantity: Math.min(oi.quantity, oi.refundedQuantity + it.quantity) } });
        }
        await tx.returnRequest.update({ where: { id: r.id }, data: { status: "RECEIVED", notes: d.note || r.notes } });
      });
    } else {
      await db.returnRequest.update({ where: { id: r.id }, data: { status: d.decision, notes: d.note || null } });
      await emailReturnDecision(r.id, d.decision === "APPROVED", d.note ?? "");
    }
    await audit(actor, `return.${d.decision.toLowerCase()}`, { type: "ReturnRequest", id: r.id }, { summary: d.note });
    return ok(
      null,
      d.decision === "RECEIVED"
        ? "Marked received — now issue the refund on the order"
        : d.decision === "APPROVED"
          ? "Approved — return instructions emailed"
          : "Declined — customer emailed",
    );
  },
  { tags: [TAGS.orders, TAGS.products] },
);
export async function decideReturnAction(fd: FormData) {
  return decide(formToObject(fd));
}
