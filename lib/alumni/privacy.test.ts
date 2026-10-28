import { describe, expect, it } from "vitest";
import { isVisible, toProfileView, type ProfileRow } from "./privacy";

const row: ProfileRow = {
  id: "profile-1",
  userId: "user-1",
  name: "Aisha Bojang",
  graduationYear: 2015,
  classSection: "Form 5A",
  currentCity: "Banjul",
  currentCountry: "GM",
  profession: "Teacher",
  employer: "Gambia College",
  bio: "Happy to mentor.",
  linkedinUrl: "https://linkedin.com/in/aisha",
  verificationStatus: "verified",
  isMentor: true,
  visibility: { city: false, profession: true, bio: true, employer: false, linkedin: false, photo: false, memories: false },
  photoPath: "school/profile/photo.webp",
  industry: "Education",
  studying: "MEd, University of The Gambia",
  schoolActivities: ["Debate club", "Netball"],
  schoolMemories: ["Winning the 2014 quiz"],
  mentorAreas: ["career"],
};

const otherAlumnus = { userId: "user-2", isAdmin: false };

describe("toProfileView", () => {
  it("hides fields the alumnus made private from other alumni", () => {
    const view = toProfileView(row, otherAlumnus);
    expect(view.city).toBeNull();
    expect(view.country).toBeNull();
    expect(view.employer).toBeNull();
    expect(view.linkedinUrl).toBeNull();
    expect(view.profession).toBe("Teacher");
    expect(view.bio).toBe("Happy to mentor.");
  });

  it("always shows name, graduation year and class section", () => {
    const view = toProfileView({ ...row, visibility: {} }, otherAlumnus);
    expect(view).toMatchObject({ name: "Aisha Bojang", graduationYear: 2015, classSection: "Form 5A" });
  });

  it("shows everything to the alumnus themselves", () => {
    const view = toProfileView(row, { userId: "user-1", isAdmin: false });
    expect(view.city).toBe("Banjul");
    expect(view.employer).toBe("Gambia College");
  });

  it("shows everything to school admins", () => {
    const view = toProfileView(row, { userId: "admin-1", isAdmin: true });
    expect(view.city).toBe("Banjul");
    expect(view.linkedinUrl).toBe("https://linkedin.com/in/aisha");
  });

  it("treats a signed-out viewer as another person", () => {
    expect(toProfileView(row, { userId: null, isAdmin: false }).city).toBeNull();
  });

  it("never includes contact details", () => {
    const view = toProfileView(row, { userId: "admin-1", isAdmin: true });
    expect(Object.keys(view)).not.toContain("phone");
    expect(Object.keys(view)).not.toContain("email");
  });
});

describe("new profile sections", () => {
  it("hides photo and memories when switched off; shows the rest by default", () => {
    const view = toProfileView(row, otherAlumnus);
    expect(view.photoPath).toBeNull();
    expect(view.memories).toEqual([]);
    expect(view.activities).toEqual(["Debate club", "Netball"]);
    expect(view.studying).toBe("MEd, University of The Gambia");
    expect(view.industry).toBe("Education");
    expect(view.mentorAreas).toEqual(["career"]);
  });

  it("industry follows the profession setting", () => {
    const hidden = toProfileView({ ...row, visibility: { profession: false } }, otherAlumnus);
    expect(hidden.industry).toBeNull();
    expect(hidden.profession).toBeNull();
  });

  it("owners and admins see everything", () => {
    for (const viewer of [{ userId: "user-1", isAdmin: false }, { userId: "admin-1", isAdmin: true }]) {
      const view = toProfileView(row, viewer);
      expect(view.photoPath).toBe("school/profile/photo.webp");
      expect(view.memories).toEqual(["Winning the 2014 quiz"]);
    }
  });

  it("doesn't show mentor areas unless they're a mentor", () => {
    expect(toProfileView({ ...row, isMentor: false }, otherAlumnus).mentorAreas).toEqual([]);
  });
});

describe("isVisible", () => {
  it("falls back to the schema defaults for missing or malformed settings", () => {
    expect(isVisible({}, "city")).toBe(true);
    expect(isVisible({}, "employer")).toBe(false);
    expect(isVisible(null, "bio")).toBe(true);
    expect(isVisible({ city: "no" }, "city")).toBe(true);
  });
});
