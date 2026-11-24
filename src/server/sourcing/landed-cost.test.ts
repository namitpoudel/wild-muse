import { describe, expect, it } from "vitest";
import { landedCosts, marginPercent } from "./landed-cost";

describe("landedCosts", () => {
  it("converts NPR to GBP and allocates shipment overheads by value", () => {
    // 10 dresses at NPR 2,000 (200,000 paisa) and 20 scarves at NPR 500, rate 0.0058 GBP/NPR
    const r = landedCosts(
      [
        { key: "dress", quantity: 10, unitCostMinor: 200_000, rateToGbp: 0.0058 },
        { key: "scarf", quantity: 20, unitCostMinor: 50_000, rateToGbp: 0.0058 },
      ],
      { freightPence: 15_000, dutyPence: 0, importVatPence: 5_000, brokerFeesPence: 3_000, otherCostsPence: 0, importVatReclaimable: true },
    );
    expect(r.totalGoodsPence).toBe(11_600 + 5_800);
    expect(r.totalOverheadPence).toBe(18_000); // reclaimable import VAT excluded
    expect(r.lines.dress.overheadPence + r.lines.scarf.overheadPence).toBe(18_000);
    expect(r.lines.dress.landedUnitPence).toBe(Math.round((11_600 + r.lines.dress.overheadPence) / 10));
  });

  it("includes import VAT as a cost when it can't be reclaimed", () => {
    const r = landedCosts([{ key: "a", quantity: 1, unitCostMinor: 1000, rateToGbp: 1 }], {
      freightPence: 0,
      dutyPence: 0,
      importVatPence: 200,
      brokerFeesPence: 0,
      otherCostsPence: 0,
      importVatReclaimable: false,
    });
    expect(r.lines.a.landedUnitPence).toBe(1200);
  });

  it("works without a linked shipment (goods cost only)", () => {
    expect(landedCosts([{ key: "a", quantity: 4, unitCostMinor: 1000, rateToGbp: 1 }], null).lines.a.landedUnitPence).toBe(1000);
  });
});

describe("marginPercent", () => {
  it("calculates margin on the ex-VAT price", () => {
    expect(marginPercent(6000, 2000, 2000)).toBe(60); // £60 inc VAT = £50 net; £20 cost → 60%
    expect(marginPercent(6000, 2000, 0)).toBe(66.7);
  });
});
