/**
 * Body-measurement size guides (cm). These are general UK sizing conventions used as a
 * starting point — the owner must confirm garment measurements with each supplier, because
 * handmade pieces vary. Editable in admin from Stage 4 (SizeGuide table).
 */
export interface SizeGuide {
  title: string;
  note: string;
  columns: string[];
  rows: string[][];
}

export const sizeGuides: Record<string, SizeGuide> = {
  "womens-clothing": {
    title: "Women's size guide",
    note: "Body measurements in centimetres. For XS–XL styles: XS = 6, S = 8–10, M = 12–14, L = 16, XL = 18.",
    columns: ["UK size", "Bust", "Waist", "Hips"],
    rows: [
      ["6", "79", "61", "86"],
      ["8", "84", "66", "91"],
      ["10", "89", "71", "96"],
      ["12", "94", "76", "101"],
      ["14", "99", "81", "106"],
      ["16", "104", "86", "111"],
      ["18", "109", "91", "116"],
    ],
  },
  "mens-clothing": {
    title: "Men's size guide",
    note: "Body measurements in centimetres.",
    columns: ["Size", "Chest", "Waist"],
    rows: [
      ["S", "91–96", "76–81"],
      ["M", "97–102", "82–87"],
      ["L", "103–108", "88–94"],
      ["XL", "109–114", "95–101"],
      ["XXL", "115–120", "102–108"],
    ],
  },
  "kids-clothing": {
    title: "Kids' size guide",
    note: "Height in centimetres. If between sizes, size up for room to grow.",
    columns: ["Age", "Height", "Chest"],
    rows: [
      ["2–3 years", "92–98", "53–55"],
      ["4–5 years", "104–110", "56–58"],
      ["6–7 years", "116–122", "60–62"],
      ["8–9 years", "128–134", "64–67"],
      ["10–11 years", "140–146", "70–73"],
    ],
  },
  "one-size": {
    title: "Sizing",
    note: "This piece is one size or adjustable. See the product description for dimensions.",
    columns: [],
    rows: [],
  },
};
