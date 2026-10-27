// Normalising the phone number or email someone signs up with, so the same
// person always maps to the same users row. No database access.
import { z } from "zod";
import { phoneCountry } from "./phoneCountries";

export type ContactKind = "phone" | "email";
export type Contact = { kind: ContactKind; value: string };

const E164 = /^\+[1-9]\d{7,14}$/;

/**
 * Returns the number in E.164 ("+2207712345"), or null if it isn't valid.
 * A number typed with "+" (or "00") is used as is. Otherwise it gets the
 * calling code of `country` (chosen in the form, defaulting to the school's
 * country); a leading trunk "0" (as in "0771 234 567") is dropped.
 */
export function normalizePhone(input: string, country: string): string | null {
  let s = input.replace(/[\s\-().]/g, "");
  if (s.startsWith("00")) s = `+${s.slice(2)}`;
  if (!s.startsWith("+")) {
    const c = phoneCountry(country);
    let national = s.replace(/^0/, "");
    // US/Canada numbers are often written with the leading 1
    if (c?.dial === "1" && national.length === 11 && national.startsWith("1")) national = national.slice(1);
    if (!c || !/^\d+$/.test(national)) return null;
    if (national.length < c.digits[0] || national.length > c.digits[1]) return null;
    s = `+${c.dial}${national}`;
  }
  return E164.test(s) ? s : null;
}

const emailSchema = z.email();

export function normalizeEmail(input: string): string | null {
  const s = input.trim().toLowerCase();
  return emailSchema.safeParse(s).success ? s : null;
}

export function normalizeContact(
  kind: ContactKind,
  input: string,
  phoneCountryCode: string
): Contact | null {
  const value = kind === "phone" ? normalizePhone(input, phoneCountryCode) : normalizeEmail(input);
  return value ? { kind, value } : null;
}
