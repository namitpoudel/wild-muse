/**
 * All money is handled as integer pence to avoid floating-point rounding errors.
 * Formatting is UK English / GBP. Never compute prices from client input — the
 * server re-prices every cart (see src/server/pricing in Stage 4).
 */
const gbp = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
const gbpWhole = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatPence(pence: number): string {
  return pence % 100 === 0 ? gbpWhole.format(pence / 100) : gbp.format(pence / 100);
}

export function formatPenceExact(pence: number): string {
  return gbp.format(pence / 100);
}

/** Whole-number discount percentage, e.g. 6500 vs 8000 → 19. */
export function discountPercent(pricePence: number, compareAtPence?: number | null): number | null {
  if (!compareAtPence || compareAtPence <= pricePence) return null;
  return Math.round(((compareAtPence - pricePence) / compareAtPence) * 100);
}
