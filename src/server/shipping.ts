import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "./db";

export interface ShippingOption {
  id: string;
  code: string;
  name: string;
  description: string;
  carrier: string;
  pricePence: number;
  freeOverPence: number | null;
  minDays: number;
  maxDays: number;
}

export async function getShippingMethods(): Promise<ShippingOption[]> {
  "use cache";
  cacheTag("shipping");
  cacheLife("hours");
  try {
    const rows = await db.shippingMethod.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
    return rows.map((m) => ({
      id: m.id,
      code: m.code,
      name: m.name,
      description: m.description ?? "",
      carrier: m.carrier,
      pricePence: m.pricePence,
      freeOverPence: m.freeOverPence,
      minDays: m.estimatedMinDays,
      maxDays: m.estimatedMaxDays,
    }));
  } catch (e) {
    console.error("[shipping] unavailable:", (e as Error).message);
    return [];
  }
}
