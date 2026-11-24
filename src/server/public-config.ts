import "server-only";
import { getSettings } from "./settings";
import { getShippingMethods } from "./shipping";

/** The subset of settings that is safe to send to the browser. */
export interface PublicConfig {
  businessName: string;
  slogan: string;
  contactEmail: string;
  contactPhone: string;
  contactHours: string;
  address: string;
  social: { instagram: string; tiktok: string; facebook: string };
  freeDeliveryThresholdPence: number | null;
  shipping: { code: string; name: string; description: string; pricePence: number; freeOverPence: number | null }[];
  returnDays: number;
  newsletterDiscountPercent: number;
  popularSearches: string[];
  announcements: string[];
  vatRegistered: boolean;
}

export async function getPublicConfig(): Promise<PublicConfig> {
  const [s, methods] = await Promise.all([getSettings(), getShippingMethods()]);
  const thresholds = methods.map((m) => m.freeOverPence).filter((n): n is number => n !== null);
  return {
    businessName: s.business.name,
    slogan: s.slogan,
    contactEmail: s.business.email,
    contactPhone: s.business.phone,
    contactHours: s.business.hours,
    address: s.business.address,
    social: s.social,
    freeDeliveryThresholdPence: thresholds.length ? Math.min(...thresholds) : null,
    shipping: methods.map((m) => ({
      code: m.code,
      name: m.name,
      description: m.description,
      pricePence: m.pricePence,
      freeOverPence: m.freeOverPence,
    })),
    returnDays: s.commerce.returnDays,
    newsletterDiscountPercent: s.commerce.newsletterDiscountPercent,
    popularSearches: s.popularSearches,
    announcements: s.announcements,
    vatRegistered: s.tax.vatRegistered,
  };
}
