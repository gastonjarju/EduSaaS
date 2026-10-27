// Normalising the phone number or email someone signs up with, so the same
// person always maps to the same users row. No database access.
import { z } from "zod";

export type ContactKind = "phone" | "email";
export type Contact = { kind: ContactKind; value: string };

// Calling code and national number length for pilot countries, used for
// local-format numbers.
const LOCAL_FORMATS: Record<string, { dial: string; digits: number }> = {
  GM: { dial: "220", digits: 7 },
  ZW: { dial: "263", digits: 9 },
};
const E164 = /^\+[1-9]\d{7,14}$/;

/**
 * Returns the number in E.164 ("+2207712345"), or null if it isn't valid.
 * Local numbers (no "+") get the school's country code; a leading trunk "0"
 * (as in Zimbabwe's "0771 234 567") is dropped.
 */
export function normalizePhone(input: string, schoolCountry: string): string | null {
  let s = input.replace(/[\s\-().]/g, "");
  if (s.startsWith("00")) s = `+${s.slice(2)}`;
  if (!s.startsWith("+")) {
    const local = LOCAL_FORMATS[schoolCountry];
    const national = s.replace(/^0/, "");
    if (!local || !/^\d+$/.test(national) || national.length !== local.digits) return null;
    s = `+${local.dial}${national}`;
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
  schoolCountry: string
): Contact | null {
  const value = kind === "phone" ? normalizePhone(input, schoolCountry) : normalizeEmail(input);
  return value ? { kind, value } : null;
}
