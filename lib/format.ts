// Small formatting helpers shared by school-site pages. No database access.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Route params go straight into uuid columns; anything else would 500. */
export function isUuid(value: string): boolean {
  return UUID.test(value);
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

/** Escapes LIKE/ILIKE wildcards so user input matches literally. */
export function escapeLike(input: string): string {
  return input.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/**
 * One CSV cell. Quotes when needed, and neutralises leading = + - @ so a
 * spreadsheet doesn't evaluate a value as a formula (CSV injection).
 */
export function csvCell(value: string | number | null | undefined): string {
  let s = value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function csvRow(values: (string | number | null | undefined)[]): string {
  return values.map(csvCell).join(",");
}

/** Digits only, for wa.me links (which take the number without "+"). */
export function whatsappNumber(e164: string): string {
  return e164.replace(/\D/g, "");
}
