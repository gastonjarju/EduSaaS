// Converting between UTC timestamps and a school's local wall-clock time,
// without a date library. "Local" strings use the <input type="datetime-local">
// format: "2026-12-20T16:00".

function parts(date: Date, timeZone: string) {
  const p = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => Number(p.find((x) => x.type === type)!.value);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute"), second: get("second") };
}

/** Offset of `timeZone` from UTC at `date`, in milliseconds. */
function offsetMs(date: Date, timeZone: string): number {
  const p = parts(date, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

const LOCAL = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

/** "2026-12-20T16:00" in `timeZone` → the UTC instant, or null if invalid. */
export function localToUtc(local: string, timeZone: string): Date | null {
  const m = LOCAL.exec(local);
  if (!m) return null;
  const [y, mo, d, h, mi] = m.slice(1).map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  if (new Date(guess).getUTCDate() !== d || h > 23 || mi > 59) return null; // e.g. 31 Feb
  // Apply the offset twice so a DST change between guess and result is handled
  let utc = guess - offsetMs(new Date(guess), timeZone);
  utc = guess - offsetMs(new Date(utc), timeZone);
  return new Date(utc);
}

const pad = (n: number) => String(n).padStart(2, "0");

/** UTC instant → "2026-12-20T16:00" in `timeZone` (for datetime-local inputs). */
export function utcToLocal(date: Date, timeZone: string): string {
  const p = parts(date, timeZone);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`;
}

/** UTC instant → "2026-12-20", the calendar day in `timeZone`. */
export function localDateKey(date: Date, timeZone: string): string {
  return utcToLocal(date, timeZone).slice(0, 10);
}

export type Month = { year: number; month: number }; // month: 1–12

/** Parses "2026-12"; anything else → null. */
export function parseMonth(value: string | undefined): Month | null {
  const m = value && /^(\d{4})-(\d{2})$/.exec(value);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  return month >= 1 && month <= 12 && year >= 1950 && year <= 2100 ? { year, month } : null;
}

export function formatMonth({ year, month }: Month): string {
  return `${year}-${pad(month)}`;
}

export function addMonths({ year, month }: Month, delta: number): Month {
  const i = year * 12 + (month - 1) + delta;
  return { year: Math.floor(i / 12), month: (i % 12) + 1 };
}

export function currentMonth(timeZone: string, now = new Date()): Month {
  const p = parts(now, timeZone);
  return { year: p.year, month: p.month };
}

/** UTC instants bounding the month in `timeZone`: [start, end). */
export function monthRange(m: Month, timeZone: string): { start: Date; end: Date } {
  const next = addMonths(m, 1);
  return {
    start: localToUtc(`${formatMonth(m)}-01T00:00`, timeZone)!,
    end: localToUtc(`${formatMonth(next)}-01T00:00`, timeZone)!,
  };
}

/**
 * Calendar grid for a month, Sunday-first, as weeks of "YYYY-MM-DD" keys
 * (null for days outside the month).
 */
export function monthGrid({ year, month }: Month): (string | null)[][] {
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: (string | null)[] = Array(firstWeekday).fill(null);
  for (let d = 1; d <= days; d++) cells.push(`${year}-${pad(month)}-${pad(d)}`);
  while (cells.length % 7) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}
