/** Customer-facing order reference, e.g. WM-10042. */
export const formatOrderNumber = (n: number) => `WM-${10000 + n}`;

/** Parse "WM-10042" (any case/spacing) back to the stored sequence number. */
export function parseOrderNumber(ref: string): number | null {
  const m = ref
    .trim()
    .toUpperCase()
    .match(/^WM-?(\d{5,})$/);
  if (!m) return null;
  const n = Number(m[1]) - 10000;
  return n > 0 ? n : null;
}

export const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: "Awaiting payment",
  PAID: "Paid",
  PROCESSING: "Being prepared",
  DISPATCHED: "Dispatched",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
  PARTIALLY_REFUNDED: "Partly refunded",
};
