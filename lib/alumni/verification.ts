// Admin verification of alumni (wireframe screen 1i). Every function takes
// the school id. Decisions are logged in alumni_verification_requests so the
// review history survives later changes.
import { and, asc, count, desc, eq, ilike, isNull, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { alumniProfiles, alumniVerificationRequests, users } from "@/db/schema";
import { escapeLike } from "@/lib/format";

export const REVIEW_STATUSES = ["pending", "verified", "unverified", "rejected"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];
export const REVIEW_PAGE_SIZE = 25;

const active = (schoolId: string) =>
  and(eq(alumniProfiles.schoolId, schoolId), isNull(alumniProfiles.deletedAt))!;

export async function countByStatus(schoolId: string): Promise<Record<ReviewStatus, number>> {
  const rows = await db
    .select({ status: alumniProfiles.verificationStatus, n: count() })
    .from(alumniProfiles)
    .where(active(schoolId))
    .groupBy(alumniProfiles.verificationStatus);
  const counts = { pending: 0, verified: 0, unverified: 0, rejected: 0 };
  for (const r of rows) if (r.status in counts) counts[r.status as ReviewStatus] = r.n;
  return counts;
}

export async function listForReview(
  schoolId: string,
  filter: { status: ReviewStatus | "all"; q?: string; page: number }
) {
  const conditions: SQL[] = [active(schoolId)];
  if (filter.status !== "all") conditions.push(eq(alumniProfiles.verificationStatus, filter.status));
  if (filter.q) conditions.push(ilike(users.name, `%${escapeLike(filter.q)}%`));
  const where = and(...conditions);

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        profileId: alumniProfiles.id,
        name: users.name,
        phone: users.phone,
        email: users.email,
        graduationYear: alumniProfiles.graduationYear,
        classSection: alumniProfiles.classSection,
        status: alumniProfiles.verificationStatus,
        joinedAt: alumniProfiles.createdAt,
      })
      .from(alumniProfiles)
      .innerJoin(users, eq(users.id, alumniProfiles.userId))
      .where(where)
      // Oldest first in the pending queue (first come, first served); else by name
      .orderBy(
        ...(filter.status === "pending"
          ? [asc(alumniProfiles.createdAt), asc(users.name)]
          : [asc(users.name), desc(alumniProfiles.createdAt)])
      )
      .limit(REVIEW_PAGE_SIZE)
      .offset((filter.page - 1) * REVIEW_PAGE_SIZE),
    db
      .select({ total: count() })
      .from(alumniProfiles)
      .innerJoin(users, eq(users.id, alumniProfiles.userId))
      .where(where),
  ]);
  return { rows, total };
}

/**
 * Records the school's decision on a profile. Returns false if the profile
 * isn't an active profile of this school.
 */
export async function recordDecision(
  schoolId: string,
  profileId: string,
  decision: "verified" | "rejected",
  reviewerId: string
): Promise<boolean> {
  return db.transaction(async (tx) => {
    const [profile] = await tx
      .update(alumniProfiles)
      .set({ verificationStatus: decision, updatedAt: new Date() })
      .where(and(eq(alumniProfiles.id, profileId), active(schoolId)))
      .returning({ id: alumniProfiles.id, answer: alumniProfiles.verificationAnswer });
    if (!profile) return false;

    const review = {
      status: decision === "verified" ? "approved" : "rejected",
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
    };
    // Close the open request if there is one (at most one per profile);
    // otherwise log the decision as a new, already-reviewed request.
    const closed = await tx
      .update(alumniVerificationRequests)
      .set(review)
      .where(
        and(
          eq(alumniVerificationRequests.alumniProfileId, profileId),
          eq(alumniVerificationRequests.status, "pending")
        )
      )
      .returning({ id: alumniVerificationRequests.id });
    if (closed.length === 0) {
      await tx.insert(alumniVerificationRequests).values({
        alumniProfileId: profileId,
        schoolId,
        verificationAnswerSnap: profile.answer ?? "",
        ...review,
      });
    }
    return true;
  });
}
