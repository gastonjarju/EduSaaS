// Alumni directory and profile queries. Every function takes the school id
// and filters on it — this is the tenant-scoping wrapper the design doc
// calls for (docs/designDocAlumni.md §7).
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  isNotNull,
  isNull,
  ne,
  sql,
  type SQL,
} from "drizzle-orm";
import { db } from "@/db";
import { alumniProfiles, users } from "@/db/schema";
import { escapeLike } from "@/lib/format";
import {
  toProfileView,
  type PrivacyField,
  type ProfileView,
  type ViewerContext,
} from "./privacy";

export const PAGE_SIZE = 20;

export type DirectoryFilters = {
  q?: string;
  year?: number;
  city?: string;
  page: number;
};

const profileColumns = {
  id: alumniProfiles.id,
  userId: alumniProfiles.userId,
  name: users.name,
  graduationYear: alumniProfiles.graduationYear,
  classSection: alumniProfiles.classSection,
  currentCity: alumniProfiles.currentCity,
  currentCountry: alumniProfiles.currentCountry,
  profession: alumniProfiles.profession,
  employer: alumniProfiles.employer,
  bio: alumniProfiles.bio,
  linkedinUrl: alumniProfiles.linkedinUrl,
  verificationStatus: alumniProfiles.verificationStatus,
  isMentor: alumniProfiles.isMentor,
  visibility: alumniProfiles.visibility,
  photoPath: users.avatarUrl,
  industry: alumniProfiles.industry,
  studying: alumniProfiles.studying,
  schoolActivities: alumniProfiles.schoolActivities,
  schoolMemories: alumniProfiles.schoolMemories,
  mentorAreas: alumniProfiles.mentorAreas,
};

// Active profiles of this school. Profiles the school rejected (admin
// verification) are hidden everywhere outside the admin Alumni screen.
function inSchool(schoolId: string): SQL {
  return and(
    eq(alumniProfiles.schoolId, schoolId),
    isNull(alumniProfiles.deletedAt),
    ne(alumniProfiles.verificationStatus, "rejected")
  )!;
}

// SQL twin of isVisible() in ./privacy.ts, for filtering on a private field
// without leaking it (e.g. a city filter must not match hidden cities).
// Only used for fields whose default is visible.
function visibleTo(field: PrivacyField, viewer: ViewerContext): SQL {
  if (viewer.isAdmin) return sql`true`;
  return sql`(coalesce((${alumniProfiles.visibility}->>${field})::boolean, true) or ${alumniProfiles.userId} = ${viewer.userId})`;
}

export async function searchDirectory(
  schoolId: string,
  filters: DirectoryFilters,
  viewer: ViewerContext
): Promise<{ profiles: ProfileView[]; total: number }> {
  const conditions = [inSchool(schoolId)];
  if (filters.q) {
    conditions.push(ilike(users.name, `%${escapeLike(filters.q)}%`));
  }
  if (filters.year) {
    conditions.push(eq(alumniProfiles.graduationYear, filters.year));
  }
  if (filters.city) {
    conditions.push(
      sql`lower(${alumniProfiles.currentCity}) = lower(${filters.city})`,
      visibleTo("city", viewer)
    );
  }
  const where = and(...conditions);

  const [rows, [{ total }]] = await Promise.all([
    db
      .select(profileColumns)
      .from(alumniProfiles)
      .innerJoin(users, eq(users.id, alumniProfiles.userId))
      .where(where)
      .orderBy(asc(users.name), asc(alumniProfiles.id))
      .limit(PAGE_SIZE)
      .offset((filters.page - 1) * PAGE_SIZE),
    db
      .select({ total: count() })
      .from(alumniProfiles)
      .innerJoin(users, eq(users.id, alumniProfiles.userId))
      .where(where),
  ]);

  return { profiles: rows.map((r) => toProfileView(r, viewer)), total };
}

export async function directoryFilterOptions(
  schoolId: string,
  viewer: ViewerContext
): Promise<{ years: number[]; cities: string[] }> {
  const [years, cities] = await Promise.all([
    db
      .selectDistinct({ year: alumniProfiles.graduationYear })
      .from(alumniProfiles)
      .where(inSchool(schoolId))
      .orderBy(desc(alumniProfiles.graduationYear)),
    db
      .selectDistinct({ city: alumniProfiles.currentCity })
      .from(alumniProfiles)
      .where(
        and(
          inSchool(schoolId),
          isNotNull(alumniProfiles.currentCity),
          visibleTo("city", viewer)
        )
      )
      .orderBy(asc(alumniProfiles.currentCity)),
  ]);
  return {
    years: years.map((r) => r.year),
    cities: cities.map((r) => r.city!),
  };
}

export async function getProfile(
  schoolId: string,
  profileId: string,
  viewer: ViewerContext
): Promise<(ProfileView & { userId: string; hasPhone: boolean }) | null> {
  const [row] = await db
    .select({ ...profileColumns, hasPhone: sql<boolean>`${users.phone} is not null` })
    .from(alumniProfiles)
    .innerJoin(users, eq(users.id, alumniProfiles.userId))
    .where(and(inSchool(schoolId), eq(alumniProfiles.id, profileId)))
    .limit(1);
  return row
    ? { ...toProfileView(row, viewer), userId: row.userId, hasPhone: row.hasPhone }
    : null;
}

/** The alumnus's phone, for the WhatsApp redirect only — never rendered. */
export async function getProfilePhone(
  schoolId: string,
  profileId: string
): Promise<{ name: string; phone: string | null } | null> {
  const [row] = await db
    .select({ name: users.name, phone: users.phone })
    .from(alumniProfiles)
    .innerJoin(users, eq(users.id, alumniProfiles.userId))
    .where(and(inSchool(schoolId), eq(alumniProfiles.id, profileId)))
    .limit(1);
  return row ?? null;
}

/** Full rows including contact details, for the admin-only CSV export. */
export async function exportDirectory(schoolId: string) {
  return db
    .select({
      name: users.name,
      graduationYear: alumniProfiles.graduationYear,
      classSection: alumniProfiles.classSection,
      city: alumniProfiles.currentCity,
      country: alumniProfiles.currentCountry,
      profession: alumniProfiles.profession,
      employer: alumniProfiles.employer,
      verificationStatus: alumniProfiles.verificationStatus,
      phone: users.phone,
      email: users.email,
      joinedAt: alumniProfiles.createdAt,
    })
    .from(alumniProfiles)
    .innerJoin(users, eq(users.id, alumniProfiles.userId))
    .where(inSchool(schoolId))
    .orderBy(asc(users.name));
}
