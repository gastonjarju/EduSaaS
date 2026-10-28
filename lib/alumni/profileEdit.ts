// Loading and saving your own alumni profile (the Edit profile page).
// Every function takes the school id and the signed-in user's id, so a user
// can only ever read or change their own active profile at this school.
import { and, eq, isNull, ne } from "drizzle-orm";
import { db } from "@/db";
import { alumniProfiles, users } from "@/db/schema";

const own = (schoolId: string, userId: string) =>
  and(
    eq(alumniProfiles.schoolId, schoolId),
    eq(alumniProfiles.userId, userId),
    isNull(alumniProfiles.deletedAt),
    ne(alumniProfiles.verificationStatus, "rejected")
  )!;

export async function getOwnProfile(schoolId: string, userId: string) {
  const [row] = await db
    .select({
      profileId: alumniProfiles.id,
      name: users.name,
      photoPath: users.avatarUrl,
      graduationYear: alumniProfiles.graduationYear,
      classSection: alumniProfiles.classSection,
      currentCity: alumniProfiles.currentCity,
      bio: alumniProfiles.bio,
      profession: alumniProfiles.profession,
      employer: alumniProfiles.employer,
      industry: alumniProfiles.industry,
      studying: alumniProfiles.studying,
      linkedinUrl: alumniProfiles.linkedinUrl,
      isMentor: alumniProfiles.isMentor,
      mentorAreas: alumniProfiles.mentorAreas,
      schoolActivities: alumniProfiles.schoolActivities,
      schoolMemories: alumniProfiles.schoolMemories,
      visibility: alumniProfiles.visibility,
    })
    .from(alumniProfiles)
    .innerJoin(users, eq(users.id, alumniProfiles.userId))
    .where(own(schoolId, userId))
    .limit(1);
  return row ?? null;
}

export type ProfileUpdate = {
  name: string;
  classSection: string | null;
  currentCity: string | null;
  bio: string | null;
  profession: string | null;
  employer: string | null;
  industry: string | null;
  studying: string | null;
  linkedinUrl: string | null;
  isMentor: boolean;
  mentorAreas: string[];
  schoolActivities: string[];
  schoolMemories: string[];
  visibility: Record<string, boolean>;
};

/** Saves the profile; false if the user has no active profile here. */
export async function updateOwnProfile(schoolId: string, userId: string, u: ProfileUpdate): Promise<boolean> {
  return db.transaction(async (tx) => {
    const { name, ...profile } = u;
    const rows = await tx
      .update(alumniProfiles)
      .set({ ...profile, updatedAt: new Date() })
      .where(own(schoolId, userId))
      .returning({ id: alumniProfiles.id });
    if (rows.length === 0) return false;
    await tx.update(users).set({ name, updatedAt: new Date() }).where(eq(users.id, userId));
    return true;
  });
}

/** Sets (or clears) the user's photo path; returns the previous path. */
export async function setOwnPhoto(userId: string, path: string | null): Promise<string | null> {
  return db.transaction(async (tx) => {
    const [before] = await tx.select({ path: users.avatarUrl }).from(users).where(eq(users.id, userId)).limit(1);
    await tx.update(users).set({ avatarUrl: path, updatedAt: new Date() }).where(eq(users.id, userId));
    return before?.path ?? null;
  });
}
