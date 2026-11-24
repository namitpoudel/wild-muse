/**
 * Pricing engine — PURE functions (no I/O) so every rule is unit-tested.
 * All amounts are integer pence. UK consumer prices are VAT-INCLUSIVE, so VAT is
 * extracted from the price rather than added on top.
 *
 *   discount      → coupon applied to the merchandise subtotal
 *   shipping      → method price, free when (subtotal − discount) ≥ threshold or FREE_SHIPPING coupon
 *   VAT (if registered) → per line on the discounted line value, plus VAT on delivery
 *   total         → subtotal − discount + shipping
 *
 * VAT treatment of delivery and zero-rated children's clothing should be confirmed
 * with an accountant; rates are configurable per tax class in the admin.
 */
export interface PricingLine {
  key: string;
  unitPricePence: number;
  quantity: number;
  /** Basis points, e.g. 2000 = 20%. */
  taxRateBps: number;
}

export type CouponKind = "PERCENT" | "FIXED" | "FREE_SHIPPING";
export interface PricingCoupon {
  code: string;
  type: CouponKind;
  value: number;
}

export interface PricingShipping {
  pricePence: number;
  freeOverPence: number | null;
}

export interface PricingInput {
  lines: PricingLine[];
  coupon?: PricingCoupon | null;
  shipping?: PricingShipping | null;
  vatRegistered: boolean;
  shippingTaxRateBps: number;
}

export interface PricingResult {
  subtotalPence: number;
  discountPence: number;
  shippingPence: number;
  taxPence: number;
  totalPence: number;
  freeShipping: boolean;
  /** Discount allocated to each line (for VAT and refunds). */
  lineDiscounts: Record<string, number>;
  lineTax: Record<string, number>;
}

/** VAT contained in a VAT-inclusive amount. */
export function vatFromGross(grossPence: number, rateBps: number) {
  if (rateBps <= 0 || grossPence <= 0) return 0;
  return Math.round((grossPence * rateBps) / (10000 + rateBps));
}

/** Split `amount` across weights proportionally, distributing rounding remainders fairly (largest remainder). */
export function allocate(amount: number, weights: number[]): number[] {
  const total = weights.reduce((a, b) => a + b, 0);
  if (amount <= 0 || total <= 0) return weights.map(() => 0);
  const exact = weights.map((w) => (amount * w) / total);
  const floored = exact.map(Math.floor);
  let remainder = amount - floored.reduce((a, b) => a + b, 0);
  const order = exact.map((e, i) => ({ i, frac: e - Math.floor(e) })).sort((a, b) => b.frac - a.frac);
  for (const { i } of order) {
    if (remainder <= 0) break;
    floored[i] += 1;
    remainder -= 1;
  }
  return floored;
}

export function computeDiscount(subtotalPence: number, coupon?: PricingCoupon | null) {
  if (!coupon || subtotalPence <= 0) return 0;
  if (coupon.type === "PERCENT") return Math.min(subtotalPence, Math.round((subtotalPence * Math.min(100, Math.max(0, coupon.value))) / 100));
  if (coupon.type === "FIXED") return Math.min(subtotalPence, Math.max(0, coupon.value));
  return 0;
}

export function computeTotals(input: PricingInput): PricingResult {
  for (const l of input.lines) {
    if (!Number.isInteger(l.unitPricePence) || l.unitPricePence < 0) throw new Error(`Invalid price for ${l.key}`);
    if (!Number.isInteger(l.quantity) || l.quantity < 1) throw new Error(`Invalid quantity for ${l.key}`);
  }
  const lineTotals = input.lines.map((l) => l.unitPricePence * l.quantity);
  const subtotalPence = lineTotals.reduce((a, b) => a + b, 0);
  const discountPence = computeDiscount(subtotalPence, input.coupon);
  const allocations = allocate(discountPence, lineTotals);

  const afterDiscount = subtotalPence - discountPence;
  const s = input.shipping;
  const freeShipping = !!s && (input.coupon?.type === "FREE_SHIPPING" || (s.freeOverPence !== null && afterDiscount >= s.freeOverPence));
  const shippingPence = !s || subtotalPence === 0 ? 0 : freeShipping ? 0 : s.pricePence;

  const lineDiscounts: Record<string, number> = {};
  const lineTax: Record<string, number> = {};
  let taxPence = 0;
  input.lines.forEach((l, i) => {
    lineDiscounts[l.key] = allocations[i];
    const tax = input.vatRegistered ? vatFromGross(lineTotals[i] - allocations[i], l.taxRateBps) : 0;
    lineTax[l.key] = tax;
    taxPence += tax;
  });
  if (input.vatRegistered) taxPence += vatFromGross(shippingPence, input.shippingTaxRateBps);

  return {
    subtotalPence,
    discountPence,
    shippingPence,
    taxPence,
    totalPence: afterDiscount + shippingPence,
    freeShipping,
    lineDiscounts,
    lineTax,
  };
}
