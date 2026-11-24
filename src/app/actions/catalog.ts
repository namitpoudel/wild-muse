"use server";

import { z } from "zod";
import { getLiveStock } from "@/server/catalog/queries";

/** Live (uncached) availability per variant for the product page. */
export async function getLiveStockAction(productId: string): Promise<Record<string, number>> {
  if (!z.string().min(1).max(64).safeParse(productId).success) return {};
  return getLiveStock(productId);
}
