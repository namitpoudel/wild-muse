/**
 * UK postcode validation (format only). Covers all current GB/NI outward+inward
 * formats plus GIR 0AA and BFPO is intentionally excluded (handled manually).
 * Stage 5 adds an optional existence check via postcodes.io that never blocks checkout.
 */
const UK_POSTCODE =
  /^(GIR ?0AA|[A-PR-UWYZ]([0-9]{1,2}|([A-HK-Y][0-9]([0-9ABEHMNPRV-Y])?)|[0-9][A-HJKPS-UW]) ?[0-9][ABD-HJLNP-UW-Z]{2})$/;

export function normaliseUkPostcode(input: string): string {
  const compact = input.toUpperCase().replace(/\s+/g, "");
  if (compact.length < 5) return compact;
  return `${compact.slice(0, -3)} ${compact.slice(-3)}`;
}

export function isValidUkPostcode(input: string): boolean {
  return UK_POSTCODE.test(normaliseUkPostcode(input));
}
