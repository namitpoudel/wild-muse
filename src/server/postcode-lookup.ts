import "server-only";
import { isValidUkPostcode, normaliseUkPostcode } from "@/lib/postcode";

/**
 * Postcode existence check via postcodes.io (free, open data: OS OpenData / ONS, OGL —
 * commercial use permitted for Great Britain). Northern Ireland (BT) postcodes need a separate
 * licence, so BT postcodes are format-checked only. Never blocks checkout: on any error we
 * return "unknown" and the customer can continue.
 */
export async function lookupPostcode(input: string): Promise<{ postcode: string; status: "valid" | "not-found" | "unknown" | "bad-format" }> {
  const postcode = normaliseUkPostcode(input);
  if (!isValidUkPostcode(postcode)) return { postcode, status: "bad-format" };
  if (postcode.startsWith("BT")) return { postcode, status: "unknown" };
  try {
    const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode.replace(" ", ""))}/validate`, {
      signal: AbortSignal.timeout(3000),
      next: { revalidate: 86400 },
    });
    if (!res.ok) return { postcode, status: "unknown" };
    const data = (await res.json()) as { result?: boolean };
    return { postcode, status: data.result ? "valid" : "not-found" };
  } catch {
    return { postcode, status: "unknown" };
  }
}
