import { describe, expect, it } from "vitest";
import { normalizeContact, normalizeEmail, normalizePhone } from "./contact";

describe("normalizePhone", () => {
  it("keeps international numbers, stripping formatting", () => {
    expect(normalizePhone("+220 771 2345", "GM")).toBe("+2207712345");
    expect(normalizePhone("+263 (77) 123-4567", "GM")).toBe("+263771234567");
    expect(normalizePhone("00447700900123", "ZW")).toBe("+447700900123");
  });

  it("adds the school's country code to local numbers", () => {
    expect(normalizePhone("771 2345", "GM")).toBe("+2207712345");
    expect(normalizePhone("0771 234 567", "ZW")).toBe("+263771234567");
  });

  it("rejects numbers that are too short, too long or not numeric", () => {
    expect(normalizePhone("12345", "GM")).toBeNull();
    expect(normalizePhone("+1234567890123456", "GM")).toBeNull();
    expect(normalizePhone("call me", "GM")).toBeNull();
    expect(normalizePhone("7712345", "XX")).toBeNull(); // unknown country, no "+"
    expect(normalizePhone("7712345", "US")).toBeNull(); // too short for the US
  });
});

describe("normalizePhone with a chosen country", () => {
  it("uses the chosen country's code for numbers without +", () => {
    expect(normalizePhone("8599794189", "US")).toBe("+18599794189");
    expect(normalizePhone("(859) 979-4189", "US")).toBe("+18599794189");
    expect(normalizePhone("1 859 979 4189", "US")).toBe("+18599794189");
    expect(normalizePhone("07700 900123", "GB")).toBe("+447700900123");
    expect(normalizePhone("070 123 45 67", "SE")).toBe("+46701234567");
  });

  it("ignores the chosen country when the number has +", () => {
    expect(normalizePhone("+1 859 979 4189", "GM")).toBe("+18599794189");
  });

  it("rejects a number that doesn't fit the chosen country", () => {
    expect(normalizePhone("8599794189", "GM")).toBeNull();
  });
});

describe("normalizeEmail", () => {
  it("lowercases and trims", () => {
    expect(normalizeEmail("  Aisha.Bojang@Example.COM ")).toBe("aisha.bojang@example.com");
  });

  it("rejects invalid emails", () => {
    expect(normalizeEmail("aisha@")).toBeNull();
    expect(normalizeEmail("not an email")).toBeNull();
  });
});

describe("normalizeContact", () => {
  it("dispatches on kind", () => {
    expect(normalizeContact("phone", "0771234567", "ZW")).toEqual({ kind: "phone", value: "+263771234567" });
    expect(normalizeContact("email", "A@B.co", "ZW")).toEqual({ kind: "email", value: "a@b.co" });
    expect(normalizeContact("email", "0771234567", "ZW")).toBeNull();
  });
});
