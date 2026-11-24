import "server-only";
import { db } from "../db";

export async function variantOptions() {
  const v = await db.productVariant.findMany({
    where: { product: { deletedAt: null } },
    include: { product: { select: { name: true } } },
    orderBy: [{ product: { name: "asc" } }, { sortOrder: "asc" }],
  });
  return v.map((x) => ({ id: x.id, label: `${x.product.name} — ${x.colour} / ${x.size} (${x.sku})` }));
}
export const isoDate = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : "");
export const pounds = (p: number) => (p / 100).toFixed(2);
