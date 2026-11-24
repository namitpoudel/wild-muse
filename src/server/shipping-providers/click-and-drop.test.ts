import { describe, expect, it } from "vitest";
import { buildCreateOrderBody, ClickAndDropError, parseCreateResponse } from "./click-and-drop";

const input = {
  reference: "WM-10042",
  email: "customer@example.com",
  orderDate: new Date("2026-11-24T10:00:00Z"),
  address: {
    fullName: "Asha Gurung",
    line1: "12 High Street",
    line2: null,
    city: "Bristol",
    county: null,
    postcode: "BS1 4DJ",
    phone: "07700 900123",
  },
  items: [
    { name: "Hemp Crossbody Bag (Natural, One size)", sku: "WM-BAG-NAT", quantity: 1, unitPricePence: 3400, unitWeightGrams: 300 },
    { name: "Beaded Necklace (Olive, One size)", sku: "WM-NEC-OLI", quantity: 2, unitPricePence: 2400, unitWeightGrams: 60 },
  ],
  subtotalPence: 8200,
  shippingPence: 0,
  totalPence: 8200,
  instructions: "Leave with neighbour",
};

describe("Click & Drop request mapping", () => {
  it("builds a CreateOrdersRequest matching the official spec", () => {
    const body = buildCreateOrderBody(input);
    const o = body.items[0];
    expect(o.orderReference).toBe("WM-10042");
    expect(o.recipient.address).toMatchObject({
      fullName: "Asha Gurung",
      addressLine1: "12 High Street",
      city: "Bristol",
      postcode: "BS1 4DJ",
      countryCode: "GB",
    });
    expect(o.subtotal).toBe(82);
    expect(o.total).toBe(82);
    expect(o.currencyCode).toBe("GBP");
    expect(o.packages[0].weightInGrams).toBe(300 + 120 + 50);
    expect(o.packages[0].packageFormatIdentifier).toBe("largeLetter");
    expect(o.packages[0].contents[1]).toMatchObject({ SKU: "WM-NEC-OLI", quantity: 2, unitValue: 24 });
    expect(o.specialInstructions).toBe("Leave with neighbour");
  });

  it("uses a parcel format for heavier orders", () => {
    const heavy = buildCreateOrderBody({ ...input, items: [{ ...input.items[0], unitWeightGrams: 900 }] });
    expect(heavy.items[0].packages[0].packageFormatIdentifier).toBe("smallParcel");
  });

  it("parses created and failed responses", () => {
    expect(parseCreateResponse({ successCount: 1, errorsCount: 0, createdOrders: [{ orderIdentifier: 1001, trackingNumber: undefined }] })).toEqual({
      orderIdentifier: "1001",
      trackingNumber: null,
    });
    expect(() =>
      parseCreateResponse({
        successCount: 0,
        errorsCount: 1,
        failedOrders: [{ errors: [{ errorMessage: "Postcode is invalid", fields: [{ fieldName: "postcode" }] }] }],
      }),
    ).toThrow(ClickAndDropError);
  });
});
