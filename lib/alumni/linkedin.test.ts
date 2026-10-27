import { describe, expect, it } from "vitest";
import { normalizeLinkedinUrl } from "./linkedin";

describe("normalizeLinkedinUrl", () => {
  it("accepts LinkedIn profile URLs in common forms", () => {
    expect(normalizeLinkedinUrl("https://www.linkedin.com/in/aisha-bojang/")).toBe("https://www.linkedin.com/in/aisha-bojang");
    expect(normalizeLinkedinUrl("linkedin.com/in/aisha-bojang")).toBe("https://www.linkedin.com/in/aisha-bojang");
    expect(normalizeLinkedinUrl("http://gm.linkedin.com/in/aisha?trk=x")).toBe("https://www.linkedin.com/in/aisha");
  });

  it("rejects other sites and look-alikes", () => {
    expect(normalizeLinkedinUrl("https://example.com/in/aisha")).toBeNull();
    expect(normalizeLinkedinUrl("https://linkedin.com.evil.io/in/aisha")).toBeNull();
    expect(normalizeLinkedinUrl("https://evil.io/linkedin.com/in/aisha")).toBeNull();
    expect(normalizeLinkedinUrl("https://user@linkedin.com/in/aisha")).toBeNull();
  });

  it("rejects non-web schemes and empty paths", () => {
    expect(normalizeLinkedinUrl("javascript:alert(1)//linkedin.com/in/x")).toBeNull();
    expect(normalizeLinkedinUrl("ftp://linkedin.com/in/aisha")).toBeNull();
    expect(normalizeLinkedinUrl("https://www.linkedin.com/")).toBeNull();
    expect(normalizeLinkedinUrl("")).toBeNull();
  });
});
