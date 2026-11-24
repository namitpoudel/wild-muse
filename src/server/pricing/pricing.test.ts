import { describe, expect, it } from "vitest";
import { allocate, computeDiscount, computeTotals, vatFromGross } from "./pricing";

const line = (key: string, unit: number, qty = 1, rate = 2000) => ({ key, unitPricePence: unit, quantity: qty, taxRateBps: rate });
const std = { pricePence: 395, freeOverPence: 7500 };

describe("vatFromGross", () => {
  it("extracts 20% VAT from a VAT-inclusive price", () => {
    expect(vatFromGross(12000, 2000)).toBe(2000); // £120 inc VAT contains £20 VAT
    expect(vatFromGross(8900, 2000)).toBe(1483);
  });
  it("is zero for zero-rated or empty amounts", () => {
    expect(vatFromGross(5000, 0)).toBe(0);
    expect(vatFromGross(0, 2000)).toBe(0);
  });
});

describe("allocate", () => {
  it("allocates exactly the amount with no rounding drift", () => {
    const parts = allocate(1000, [3333, 3333, 3334]);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(1000);
  });
  it("handles zero amounts", () => {
    expect(allocate(0, [1, 2])).toEqual([0, 0]);
  });
});

describe("computeDiscount", () => {
  it("applies percentage and fixed coupons, never exceeding the subtotal", () => {
    expect(computeDiscount(8900, { code: "A", type: "PERCENT", value: 10 })).toBe(890);
    expect(computeDiscount(1000, { code: "B", type: "FIXED", value: 1500 })).toBe(1000);
    expect(computeDiscount(1000, { code: "C", type: "FREE_SHIPPING", value: 0 })).toBe(0);
  });
});

describe("computeTotals", () => {
  it("charges delivery below the free threshold", () => {
    const r = computeTotals({ lines: [line("a", 3800)], shipping: std, vatRegistered: false, shippingTaxRateBps: 2000 });
    expect(r).toMatchObject({ subtotalPence: 3800, discountPence: 0, shippingPence: 395, totalPence: 4195, taxPence: 0, freeShipping: false });
  });

  it("gives free delivery at or above the threshold", () => {
    const r = computeTotals({ lines: [line("a", 3800, 2)], shipping: std, vatRegistered: false, shippingTaxRateBps: 2000 });
    expect(r.shippingPence).toBe(0);
    expect(r.totalPence).toBe(7600);
  });

  it("checks the free-delivery threshold AFTER discount", () => {
    const r = computeTotals({
      lines: [line("a", 8000)],
      coupon: { code: "TEN", type: "PERCENT", value: 10 },
      shipping: std,
      vatRegistered: false,
      shippingTaxRateBps: 2000,
    });
    expect(r.discountPence).toBe(800);
    expect(r.shippingPence).toBe(395); // £72 after discount < £75
    expect(r.totalPence).toBe(8000 - 800 + 395);
  });

  it("FREE_SHIPPING coupon removes delivery cost", () => {
    const r = computeTotals({
      lines: [line("a", 2000)],
      coupon: { code: "SHIP", type: "FREE_SHIPPING", value: 0 },
      shipping: std,
      vatRegistered: false,
      shippingTaxRateBps: 2000,
    });
    expect(r.shippingPence).toBe(0);
    expect(r.totalPence).toBe(2000);
  });

  it("extracts VAT per line (incl. zero-rated kids' items) and on delivery when VAT registered", () => {
    const r = computeTotals({
      lines: [line("adult", 6000, 1, 2000), line("kids", 2400, 1, 0)],
      shipping: { pricePence: 600, freeOverPence: null },
      vatRegistered: true,
      shippingTaxRateBps: 2000,
    });
    expect(r.lineTax).toEqual({ adult: 1000, kids: 0 });
    expect(r.taxPence).toBe(1000 + 100);
    expect(r.totalPence).toBe(9000);
  });

  it("shows no VAT when the business is not VAT registered", () => {
    const r = computeTotals({ lines: [line("a", 6000)], shipping: std, vatRegistered: false, shippingTaxRateBps: 2000 });
    expect(r.taxPence).toBe(0);
  });

  it("allocates discount across lines and reduces VAT accordingly", () => {
    const r = computeTotals({
      lines: [line("a", 6000), line("b", 3000)],
      coupon: { code: "F", type: "FIXED", value: 900 },
      shipping: std,
      vatRegistered: true,
      shippingTaxRateBps: 2000,
    });
    expect(r.lineDiscounts).toEqual({ a: 600, b: 300 });
    expect(r.taxPence).toBe(vatFromGross(5400, 2000) + vatFromGross(2700, 2000));
  });

  it("has no delivery charge for an empty cart", () => {
    expect(computeTotals({ lines: [], shipping: std, vatRegistered: false, shippingTaxRateBps: 2000 }).totalPence).toBe(0);
  });

  it("rejects invalid quantities and prices (never trust the browser)", () => {
    expect(() => computeTotals({ lines: [line("a", 1000, 0)], vatRegistered: false, shippingTaxRateBps: 0 })).toThrow();
    expect(() => computeTotals({ lines: [line("a", -5, 1)], vatRegistered: false, shippingTaxRateBps: 0 })).toThrow();
  });
});
