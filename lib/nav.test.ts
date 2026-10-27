import { describe, expect, it } from "vitest";
import { activeHref } from "./nav";

const SITE = [
  { href: "/", label: "Home" },
  { href: "/alumni", label: "Alumni" },
  { href: "/alumni/events", label: "Events" },
  { href: "/admin/events", label: "Admin" },
];

describe("activeHref", () => {
  it("matches the section, preferring the most specific link", () => {
    expect(activeHref("/", SITE)).toBe("/");
    expect(activeHref("/alumni", SITE)).toBe("/alumni");
    expect(activeHref("/alumni/profile/abc", SITE)).toBe("/alumni");
    expect(activeHref("/alumni/class/2015", SITE)).toBe("/alumni");
    expect(activeHref("/alumni/events", SITE)).toBe("/alumni/events");
    expect(activeHref("/alumni/events/abc", SITE)).toBe("/alumni/events");
    expect(activeHref("/admin/events/new", SITE)).toBe("/admin/events");
  });

  it("ignores the proxy's internal /sites/<slug> prefix", () => {
    expect(activeHref("/sites/stpeterstechnical", SITE)).toBe("/");
    expect(activeHref("/sites/stpeterstechnical/alumni/events/abc", SITE)).toBe("/alumni/events");
  });

  it("doesn't match look-alike paths", () => {
    expect(activeHref("/alumnihub", SITE)).toBeNull();
    expect(activeHref("/school-not-found", SITE)).toBeNull();
  });
});
