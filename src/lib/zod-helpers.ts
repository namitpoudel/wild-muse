import { z } from "zod";

/** Form-friendly coercions shared by admin schemas. */
export const zBool = z.preprocess((v) => v === true || v === "true" || v === "on" || v === "1", z.boolean());
/** "£12.50" / "12.5" → 1250 pence. Empty → undefined. */
export const zPence = z.preprocess((v) => {
  if (v === "" || v === null || v === undefined) return undefined;
  const n = Number(String(v).replace(/[£,\s]/g, ""));
  return Number.isFinite(n) ? Math.round(n * 100) : NaN;
}, z.number().int().min(0, "Must be 0 or more").max(10_000_000).optional());
export const zInt = (min = 0, max = 1_000_000) =>
  z.preprocess((v) => (v === "" || v === null || v === undefined ? undefined : Number(v)), z.number().int().min(min).max(max).optional());
export const zOptText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => v || null);
export const zSlug = z
  .string()
  .trim()
  .toLowerCase()
  .min(2)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens");
export const zDate = z.preprocess((v) => (v ? new Date(String(v)) : undefined), z.date().optional());

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}
