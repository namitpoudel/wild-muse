/**
 * Landed cost — PURE function (unit tested).
 *
 *   goods value (GBP pence) = supplier unit cost (minor units of PO currency) × exchange rate × qty
 *   overheads               = freight + duty + broker fees + other
 *                             (+ import VAT only when it is NOT reclaimable, i.e. not VAT registered)
 *   overheads are allocated to lines in proportion to goods value
 *   landed unit cost        = (goods value + allocated overheads) ÷ qty
 */
import { allocate } from "../pricing/pricing";

export interface LandedLine {
  key: string;
  quantity: number;
  unitCostMinor: number;
  rateToGbp: number;
}

export interface ShipmentCosts {
  freightPence: number;
  dutyPence: number;
  importVatPence: number;
  brokerFeesPence: number;
  otherCostsPence: number;
  importVatReclaimable: boolean;
}

export function landedCosts(lines: LandedLine[], costs: ShipmentCosts | null) {
  const goods = lines.map((l) => Math.round(l.unitCostMinor * l.rateToGbp * l.quantity));
  const overhead = costs
    ? costs.freightPence + costs.dutyPence + costs.brokerFeesPence + costs.otherCostsPence + (costs.importVatReclaimable ? 0 : costs.importVatPence)
    : 0;
  const alloc = allocate(overhead, goods);
  const result: Record<string, { goodsPence: number; overheadPence: number; landedUnitPence: number }> = {};
  lines.forEach((l, i) => {
    result[l.key] = {
      goodsPence: goods[i],
      overheadPence: alloc[i],
      landedUnitPence: l.quantity > 0 ? Math.round((goods[i] + alloc[i]) / l.quantity) : 0,
    };
  });
  return { lines: result, totalGoodsPence: goods.reduce((a, b) => a + b, 0), totalOverheadPence: overhead };
}

/** Gross margin on a VAT-inclusive retail price. */
export function marginPercent(retailPence: number, landedUnitPence: number, vatRateBps = 0) {
  const net = Math.round((retailPence * 10000) / (10000 + vatRateBps));
  if (net <= 0) return 0;
  return Math.round(((net - landedUnitPence) / net) * 1000) / 10;
}
