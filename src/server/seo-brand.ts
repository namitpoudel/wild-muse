import "server-only";
import type { SeoBrand } from "@/lib/seo";
import { getSettings } from "./settings";
import { getShippingMethods } from "./shipping";

export async function getSeoBrand(): Promise<SeoBrand> {
  const [s, methods] = await Promise.all([getSettings(), getShippingMethods()]);
  return {
    name: s.business.name,
    slogan: s.slogan,
    email: s.business.email,
    social: s.social,
    standardShippingPence: methods[0]?.pricePence ?? 0,
    returnDays: s.commerce.returnDays,
  };
}
