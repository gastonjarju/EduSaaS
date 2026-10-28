import { describe, expect, it } from "vitest";
import { isIndustry, isMentorArea, LIMITS, normalizeActivities, normalizeMemories } from "./profileFields";

describe("normalizeActivities", () => {
  it("trims, collapses spaces and drops empties", () => {
    expect(normalizeActivities(["  Debate   club ", "", "   "])).toEqual(["Debate club"]);
  });

  it("removes duplicates ignoring case, keeping the first spelling", () => {
    expect(normalizeActivities(["Football", "football", "FOOTBALL", "Choir"])).toEqual(["Football", "Choir"]);
  });

  it("caps the number and length of tags", () => {
    const many = Array.from({ length: 30 }, (_, i) => `Club ${i}`);
    expect(normalizeActivities(many)).toHaveLength(LIMITS.activities);
    expect(normalizeActivities(["x".repeat(100)])[0]).toHaveLength(LIMITS.activityLength);
  });
});

describe("normalizeMemories", () => {
  it("drops empty memories and keeps line breaks", () => {
    expect(normalizeMemories(["", "  Sports day  ", "Line one\nLine two"])).toEqual(["Sports day", "Line one\nLine two"]);
  });

  it("caps count and length", () => {
    expect(normalizeMemories(Array(9).fill("A memory"))).toHaveLength(LIMITS.memories);
    expect(normalizeMemories(["y".repeat(500)])[0]).toHaveLength(LIMITS.memoryLength);
  });

  it("squeezes runs of blank lines", () => {
    expect(normalizeMemories(["a\n\n\n\n\nb"])).toEqual(["a\n\nb"]);
  });
});

describe("pick-lists", () => {
  it("accepts only known industries and mentor areas", () => {
    expect(isIndustry("Education")).toBe(true);
    expect(isIndustry("Pirate")).toBe(false);
    expect(isMentorArea("career")).toBe(true);
    expect(isMentorArea("hacking")).toBe(false);
  });
});
