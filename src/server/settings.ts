import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "./db";

/**
 * Admin-editable business settings, stored as JSON rows in SiteSetting.
 * Missing keys fall back to DEFAULTS, so a fresh database still renders a working shop.
 */
export interface StoreSettings {
  business: {
    name: string;
    legalName: string;
    email: string;
    phone: string;
    hours: string;
    address: string;
    companyNumber: string;
    vatNumber: string;
  };
  social: { instagram: string; tiktok: string; facebook: string };
  commerce: { returnDays: number; newsletterDiscountPercent: number; reservationMinutes: number; allowGuestCheckout: boolean };
  /** VAT is never assumed: the owner sets registration status and rates (confirm with an accountant). */
  tax: { vatRegistered: boolean; showVatOnInvoices: boolean; shippingTaxRateBps: number };
  announcements: string[];
  hero: {
    eyebrow: string;
    heading: string;
    subheading: string;
    ctas: { label: string; href: string }[];
    primaryImageUrl: string;
    secondaryImageUrl: string;
  };
  seo: { defaultTitle: string; defaultDescription: string };
  popularSearches: string[];
  slogan: string;
  logoUrl: string;
}

export const DEFAULT_SETTINGS: StoreSettings = {
  business: {
    name: "WILD MUSE",
    legalName: "[Legal business name]",
    email: "hello@example.com",
    phone: "+44 (0)0000 000000",
    hours: "Mon–Fri, 9am–5pm UK time",
    address: "Registered address to be confirmed",
    companyNumber: "",
    vatNumber: "",
  },
  social: { instagram: "https://www.instagram.com/", tiktok: "https://www.tiktok.com/", facebook: "https://www.facebook.com/" },
  commerce: { returnDays: 30, newsletterDiscountPercent: 10, reservationMinutes: 30, allowGuestCheckout: true },
  tax: { vatRegistered: false, showVatOnInvoices: true, shippingTaxRateBps: 2000 },
  announcements: ["Free UK delivery on orders over £75", "Discover handmade fashion from Nepal", "The new autumn collection is here"],
  hero: {
    eyebrow: "Find your wild. Wear your soul.",
    heading: "Wear your wild side.",
    subheading: "Discover handcrafted bohemian fashion, inspired by Nepal and made for free spirits.",
    ctas: [
      { label: "Shop Women", href: "/women" },
      { label: "Shop Men", href: "/men" },
      { label: "Explore Handmade", href: "/handmade-in-nepal" },
    ],
    primaryImageUrl: "",
    secondaryImageUrl: "",
  },
  seo: {
    defaultTitle: "WILD MUSE — Handmade Bohemian Fashion from Nepal",
    defaultDescription: "Handmade bohemian clothing, jewellery and accessories crafted by artisans in Nepal. Free UK delivery over £75.",
  },
  popularSearches: ["Maxi dress", "Harem pants", "Wool cardigan", "Beaded necklace", "Patchwork jacket", "Hemp bag"],
  slogan: "Find Your Wild. Wear Your Soul.",
  logoUrl: "",
};

export type SettingKey = keyof StoreSettings;

function merge<T>(def: T, value: unknown): T {
  if (value && typeof value === "object" && !Array.isArray(value) && def && typeof def === "object" && !Array.isArray(def)) {
    return { ...def, ...(value as object) } as T;
  }
  return (value ?? def) as T;
}

/** Cached read of all settings — invalidated by the "settings" tag when the admin saves. */
export async function getSettings(): Promise<StoreSettings> {
  "use cache";
  cacheTag("settings");
  cacheLife("hours");
  try {
    const rows = await db.siteSetting.findMany();
    const out = { ...DEFAULT_SETTINGS } as Record<string, unknown>;
    for (const r of rows) if (r.key in DEFAULT_SETTINGS) out[r.key] = merge(DEFAULT_SETTINGS[r.key as SettingKey], r.value);
    return out as unknown as StoreSettings;
  } catch (e) {
    // Database unavailable (e.g. build without DB): fall back to defaults rather than failing the whole page.
    console.error("[settings] falling back to defaults:", (e as Error).message);
    return DEFAULT_SETTINGS;
  }
}

export async function saveSetting<K extends SettingKey>(key: K, value: StoreSettings[K]) {
  await db.siteSetting.upsert({ where: { key }, create: { key, value: value as object }, update: { value: value as object } });
}
