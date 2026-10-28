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
  "photo",
  "studying",
  "activities",
  "memories",
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
  photo: true,
  studying: true,
  activities: true,
  memories: true,
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
  photoPath?: string | null; // users.avatar_url (Storage path)
  industry?: string | null;
  studying?: string | null;
  schoolActivities?: string[];
  schoolMemories?: string[];
  mentorAreas?: string[];
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
  photoPath: string | null;
  industry: string | null; // follows the "profession" setting
  studying: string | null;
  activities: string[];
  memories: string[];
  mentorAreas: string[];
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
    photoPath: show("photo") ? (row.photoPath ?? null) : null,
    industry: show("profession") ? (row.industry ?? null) : null,
    studying: show("studying") ? (row.studying ?? null) : null,
    activities: show("activities") ? (row.schoolActivities ?? []) : [],
    memories: show("memories") ? (row.schoolMemories ?? []) : [],
    mentorAreas: row.isMentor ? (row.mentorAreas ?? []) : [],
  };
}
