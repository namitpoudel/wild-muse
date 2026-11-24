import { z } from "zod";
import { isValidUkPostcode, normaliseUkPostcode } from "./postcode";

/** Shared validation schemas (used by server actions; mirrored by client-side checks for UX). */
const text = (max: number, label: string) => z.string().trim().min(1, `Enter ${label}`).max(max, `${label} is too long`);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => v || null);

export const ukAddressSchema = z.object({
  fullName: text(100, "a full name"),
  line1: text(120, "the first line of the address"),
  line2: optionalText(120),
  city: text(80, "a town or city"),
  county: optionalText(80),
  postcode: z.string().trim().refine(isValidUkPostcode, "Enter a valid UK postcode, like SW1A 1AA").transform(normaliseUkPostcode),
  phone: z
    .string()
    .trim()
    .max(30)
    .regex(/^[0-9+()\s-]*$/, "Enter a valid phone number")
    .optional()
    .transform((v) => v || null),
  country: z.literal("GB").default("GB"),
});
export type UkAddress = z.infer<typeof ukAddressSchema>;

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address, like name@example.com").max(254));
