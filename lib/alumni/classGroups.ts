// Class-year groups and their feeds. Membership is implicit: every alumni
// profile with the group's school and graduation year belongs to it
// (see db/schema/alumni.ts). Every function takes the school id.
import { and, count, desc, eq, isNull, ne } from "drizzle-orm";
import { db } from "@/db";
import { alumniProfiles, classGroupPosts, classGroups, users } from "@/db/schema";

export const POST_MAX_LENGTH = 2000; // matches class_group_posts_content_length_check
const FEED_LIMIT = 50;

export async function getClassGroup(schoolId: string, year: number) {
  const [group] = await db
    .select()
    .from(classGroups)
    .where(and(eq(classGroups.schoolId, schoolId), eq(classGroups.graduationYear, year)))
    .limit(1);
  return group ?? null;
}

export async function countMembers(schoolId: string, year: number): Promise<number> {
  const [{ n }] = await db
    .select({ n: count() })
    .from(alumniProfiles)
    .where(
      and(
        eq(alumniProfiles.schoolId, schoolId),
        eq(alumniProfiles.graduationYear, year),
        isNull(alumniProfiles.deletedAt),
        ne(alumniProfiles.verificationStatus, "rejected")
      )
    );
  return n;
}

export async function listPosts(schoolId: string, classGroupId: string) {
  return db
    .select({
      id: classGroupPosts.id,
      content: classGroupPosts.content,
      createdAt: classGroupPosts.createdAt,
      authorName: users.name,
      authorProfileId: alumniProfiles.id,
    })
    .from(classGroupPosts)
    .innerJoin(users, eq(users.id, classGroupPosts.authorId))
    .leftJoin(
      alumniProfiles,
      and(
        eq(alumniProfiles.userId, classGroupPosts.authorId),
        eq(alumniProfiles.schoolId, schoolId),
        isNull(alumniProfiles.deletedAt)
      )
    )
    .where(
      and(
        eq(classGroupPosts.schoolId, schoolId),
        eq(classGroupPosts.classGroupId, classGroupId),
        isNull(classGroupPosts.deletedAt)
      )
    )
    .orderBy(desc(classGroupPosts.createdAt))
    .limit(FEED_LIMIT);
}

export async function insertPost(values: {
  schoolId: string;
  classGroupId: string;
  authorId: string;
  content: string;
}) {
  await db.insert(classGroupPosts).values(values);
}
