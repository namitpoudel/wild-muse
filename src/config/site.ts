/**
 * Business settings — PLACEHOLDERS until the owner supplies real details.
 * In Stage 4 these move to the `SiteSetting` table and become editable at
 * /admin/settings; this file then only provides first-run defaults.
 */
export const siteConfig = {
  name: "WILD MUSE",
  slogan: "Find Your Wild. Wear Your Soul.",
  description:
    "Handmade bohemian clothing, jewellery and accessories crafted by artisans in Nepal. Free UK delivery over £75.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  contact: {
    email: "hello@example.com", // PLACEHOLDER — replace with business email
    phone: "+44 (0)0000 000000", // PLACEHOLDER — replace with business phone
    hours: "Mon–Fri, 9am–5pm UK time",
    address: "Registered address to be confirmed", // PLACEHOLDER
  },
  social: {
    instagram: "https://www.instagram.com/", // PLACEHOLDER handle
    tiktok: "https://www.tiktok.com/", // PLACEHOLDER handle
    facebook: "https://www.facebook.com/", // PLACEHOLDER page
  },
  commerce: {
    currency: "GBP",
    freeDeliveryThresholdPence: 7500,
    standardDeliveryPence: 395,
    expressDeliveryPence: 695,
    returnDays: 30, // Statutory minimum is 14 days (Consumer Contracts Regs 2013); 30 is a commercial choice.
    newsletterDiscountPercent: 10,
  },
  announcements: [
    "Free UK delivery on orders over £75",
    "Discover handmade fashion from Nepal",
    "The new autumn collection is here",
  ],
} as const;
