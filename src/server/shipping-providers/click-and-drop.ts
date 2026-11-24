/**
 * Royal Mail Click & Drop API adapter (https://api.parcel.royalmail.com, spec: /swagger/v1/swagger.json).
 *
 * Flow: "Send to Click & Drop" creates the order there (POST /orders) → you print the label and
 * buy postage in Click & Drop → "Sync" (or the cron job) reads GET /orders/{id} and, once a
 * tracking number and shipped date exist, marks our order dispatched and emails the customer.
 *
 * Needs a Click & Drop account with API access: Settings → Integrations → "Click & Drop API"
 * → generate an API key → set ROYALMAIL_CLICKDROP_API_KEY. Pure request/response mapping lives
 * in this file so it can be unit-tested without the network.
 */
const BASE = "https://api.parcel.royalmail.com/api/v1";

export interface CDOrderInput {
  reference: string;
  email: string;
  orderDate: Date;
  address: { fullName: string; line1: string; line2?: string | null; city: string; county?: string | null; postcode: string; phone?: string | null };
  items: { name: string; sku: string; quantity: number; unitPricePence: number; unitWeightGrams: number }[];
  subtotalPence: number;
  shippingPence: number;
  totalPence: number;
  instructions?: string | null;
  serviceCode?: string | null;
}

const gbp = (p: number) => Math.round(p) / 100;

/** Build the Click & Drop CreateOrdersRequest body (field names and limits from the official spec). */
export function buildCreateOrderBody(o: CDOrderInput) {
  const weight = o.items.reduce((n, i) => n + i.unitWeightGrams * i.quantity, 0) + 50; // + packaging
  return {
    items: [
      {
        orderReference: o.reference.slice(0, 40),
        recipient: {
          address: {
            fullName: o.address.fullName.slice(0, 210),
            addressLine1: o.address.line1.slice(0, 100),
            addressLine2: o.address.line2?.slice(0, 100) || undefined,
            city: o.address.city.slice(0, 100),
            county: o.address.county?.slice(0, 100) || undefined,
            postcode: o.address.postcode.slice(0, 20),
            countryCode: "GB",
          },
          phoneNumber: o.address.phone?.slice(0, 25) || undefined,
          emailAddress: o.email.slice(0, 254),
        },
        packages: [
          {
            weightInGrams: weight,
            packageFormatIdentifier: weight <= 750 ? "largeLetter" : "smallParcel",
            contents: o.items.map((i) => ({
              name: i.name.slice(0, 800),
              SKU: i.sku.slice(0, 100),
              quantity: i.quantity,
              unitValue: gbp(i.unitPricePence),
              unitWeightInGrams: i.unitWeightGrams,
            })),
          },
        ],
        orderDate: o.orderDate.toISOString(),
        specialInstructions: o.instructions?.slice(0, 500) || undefined,
        subtotal: gbp(o.subtotalPence),
        shippingCostCharged: gbp(o.shippingPence),
        total: gbp(o.totalPence),
        currencyCode: "GBP",
        postageDetails: {
          ...(o.serviceCode ? { serviceCode: o.serviceCode.slice(0, 10) } : {}),
          sendNotificationsTo: "recipient",
          receiveEmailNotification: true,
        },
      },
    ],
  };
}

export class ClickAndDropError extends Error {}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const key = process.env.ROYALMAIL_CLICKDROP_API_KEY;
  if (!key) throw new ClickAndDropError("Royal Mail Click & Drop is not connected (ROYALMAIL_CLICKDROP_API_KEY).");
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", Accept: "application/json", ...init.headers },
    signal: AbortSignal.timeout(20_000),
  });
  const text = await res.text();
  if (!res.ok) throw new ClickAndDropError(`Click & Drop ${res.status}: ${text.slice(0, 300)}`);
  return (text ? JSON.parse(text) : null) as T;
}

interface CreateResponse {
  successCount: number;
  errorsCount: number;
  createdOrders?: { orderIdentifier: number; orderReference?: string; trackingNumber?: string }[];
  failedOrders?: { errors?: { errorMessage?: string; fields?: { fieldName?: string }[] }[] }[];
}

export function parseCreateResponse(r: CreateResponse) {
  const created = r.createdOrders?.[0];
  if (r.successCount > 0 && created) return { orderIdentifier: String(created.orderIdentifier), trackingNumber: created.trackingNumber ?? null };
  const err = r.failedOrders?.[0]?.errors
    ?.map((e) => `${e.errorMessage}${e.fields?.length ? ` (${e.fields.map((f) => f.fieldName).join(", ")})` : ""}`)
    .join("; ");
  throw new ClickAndDropError(`Click & Drop rejected the order: ${err || "unknown error"}`);
}

export async function createClickAndDropOrder(o: CDOrderInput) {
  return parseCreateResponse(await call<CreateResponse>("/orders", { method: "POST", body: JSON.stringify(buildCreateOrderBody(o)) }));
}

export interface CDOrderStatus {
  trackingNumber: string | null;
  printedOn: string | null;
  shippedOn: string | null;
}

export async function getClickAndDropOrder(orderIdentifier: string): Promise<CDOrderStatus | null> {
  if (!/^\d+$/.test(orderIdentifier)) throw new ClickAndDropError("Invalid Click & Drop order id");
  const rows = await call<{ trackingNumber?: string; printedOn?: string; shippedOn?: string }[]>(`/orders/${orderIdentifier}`);
  const r = rows?.[0];
  return r ? { trackingNumber: r.trackingNumber ?? null, printedOn: r.printedOn ?? null, shippedOn: r.shippedOn ?? null } : null;
}

export const isClickAndDropConfigured = () => !!process.env.ROYALMAIL_CLICKDROP_API_KEY;
