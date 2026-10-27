// Per-field profile privacy (docs/designDocAlumni.md §7). Name, graduation
// year and class section are always visible to members of the school; every
// other field follows the alumnus's `visibility` settings, except for the
// alumnus themselves and school admins, who see everything. Phone and email
// are never part of a profile view.

export const PRIVACY_FIELDS = [
  "city",
  "profession",
  "employer",
  "bio",
  "linkedin",
] as const;
export type PrivacyField = (typeof PRIVACY_FIELDS)[number];
export type Visibility = Partial<Record<PrivacyField, boolean>>;

// Matches the column default in db/schema/alumni.ts for keys a row lacks.
const DEFAULT_VISIBILITY: Record<PrivacyField, boolean> = {
  city: true,
  profession: true,
  bio: true,
  employer: false,
  linkedin: true,
};

export type ProfileRow = {
  id: string;
  userId: string;
  name: string;
  graduationYear: number;
  classSection: string | null;
  currentCity: string | null;
  currentCountry: string | null;
  profession: string | null;
  employer: string | null;
  bio: string | null;
  linkedinUrl: string | null;
  verificationStatus: string;
  isMentor: boolean;
  visibility: unknown;
};

export type ProfileView = {
  id: string;
  name: string;
  graduationYear: number;
  classSection: string | null;
  city: string | null;
  country: string | null;
  profession: string | null;
  employer: string | null;
  bio: string | null;
  linkedinUrl: string | null;
  verificationStatus: string;
  isMentor: boolean;
};

export type ViewerContext = { userId: string | null; isAdmin: boolean };

export function isVisible(
  visibility: unknown,
  field: PrivacyField
): boolean {
  const value =
    visibility && typeof visibility === "object"
      ? (visibility as Record<string, unknown>)[field]
      : undefined;
  return typeof value === "boolean" ? value : DEFAULT_VISIBILITY[field];
}

export function toProfileView(
  row: ProfileRow,
  viewer: ViewerContext
): ProfileView {
  const all = viewer.isAdmin || viewer.userId === row.userId;
  const show = (field: PrivacyField) => all || isVisible(row.visibility, field);

  return {
    id: row.id,
    name: row.name,
    graduationYear: row.graduationYear,
    classSection: row.classSection,
    city: show("city") ? row.currentCity : null,
    country: show("city") ? row.currentCountry : null,
    profession: show("profession") ? row.profession : null,
    employer: show("employer") ? row.employer : null,
    bio: show("bio") ? row.bio : null,
    linkedinUrl: show("linkedin") ? row.linkedinUrl : null,
    verificationStatus: row.verificationStatus,
    isMentor: row.isMentor,
  };
}
