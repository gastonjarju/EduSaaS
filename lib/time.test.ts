import { describe, expect, it } from "vitest";
import {
  addMonths,
  localDateKey,
  localToUtc,
  monthGrid,
  monthRange,
  parseMonth,
  utcToLocal,
} from "./time";

describe("localToUtc / utcToLocal", () => {
  it("converts school-local times to UTC", () => {
    expect(localToUtc("2026-12-20T16:00", "Africa/Banjul")?.toISOString()).toBe("2026-12-20T16:00:00.000Z");
    expect(localToUtc("2026-12-20T16:00", "Africa/Harare")?.toISOString()).toBe("2026-12-20T14:00:00.000Z");
  });

  it("handles daylight saving zones", () => {
    expect(localToUtc("2026-07-01T09:00", "Europe/London")?.toISOString()).toBe("2026-07-01T08:00:00.000Z");
    expect(localToUtc("2026-01-15T09:00", "Europe/London")?.toISOString()).toBe("2026-01-15T09:00:00.000Z");
  });

  it("round-trips", () => {
    const d = localToUtc("2027-01-14T15:00", "Africa/Harare")!;
    expect(utcToLocal(d, "Africa/Harare")).toBe("2027-01-14T15:00");
  });

  it("rejects malformed or impossible values", () => {
    expect(localToUtc("2026-02-31T10:00", "Africa/Banjul")).toBeNull();
    expect(localToUtc("2026-12-20 16:00", "Africa/Banjul")).toBeNull();
    expect(localToUtc("", "Africa/Banjul")).toBeNull();
  });

  it("gives the local calendar day", () => {
    // 23:30 UTC on 31 Dec is already 1 Jan in Harare (UTC+2)
    expect(localDateKey(new Date("2026-12-31T23:30:00Z"), "Africa/Harare")).toBe("2027-01-01");
    expect(localDateKey(new Date("2026-12-31T23:30:00Z"), "Africa/Banjul")).toBe("2026-12-31");
  });
});

describe("months", () => {
  it("parses and steps months", () => {
    expect(parseMonth("2026-12")).toEqual({ year: 2026, month: 12 });
    expect(parseMonth("2026-13")).toBeNull();
    expect(parseMonth(undefined)).toBeNull();
    expect(addMonths({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 });
    expect(addMonths({ year: 2026, month: 1 }, -1)).toEqual({ year: 2025, month: 12 });
  });

  it("bounds a month in local time", () => {
    const r = monthRange({ year: 2026, month: 12 }, "Africa/Harare");
    expect(r.start.toISOString()).toBe("2026-11-30T22:00:00.000Z");
    expect(r.end.toISOString()).toBe("2026-12-31T22:00:00.000Z");
  });

  it("builds a Sunday-first grid", () => {
    const g = monthGrid({ year: 2026, month: 12 }); // 1 Dec 2026 is a Tuesday
    expect(g[0]).toEqual([null, null, "2026-12-01", "2026-12-02", "2026-12-03", "2026-12-04", "2026-12-05"]);
    expect(g.flat().filter(Boolean)).toHaveLength(31);
    expect(g.every((w) => w.length === 7)).toBe(true);
  });
});
