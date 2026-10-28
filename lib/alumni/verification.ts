// Admin verification of alumni (wireframe screen 1i). Every function takes
// the school id. Decisions are logged in alumni_verification_requests so the
// review history survives later changes.
import { and, asc, count, desc, eq, ilike, inArray, isNull, type SQL } from "drizzle-orm";
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
  const where = and(...filterConditions(schoolId, filter.status, filter.q));

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        profileId: alumniProfiles.id,
        name: users.name,
        photoPath: users.avatarUrl,
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

export const BULK_LIMIT = 1000;

function filterConditions(schoolId: string, status: ReviewStatus | "all", q?: string): SQL[] {
  const conditions: SQL[] = [active(schoolId)];
  if (status !== "all") conditions.push(eq(alumniProfiles.verificationStatus, status));
  if (q) conditions.push(ilike(users.name, `%${escapeLike(q)}%`));
  return conditions;
}

/** Profile ids in a tab (status + search), for "select all N in this tab". */
export async function idsMatching(schoolId: string, status: ReviewStatus | "all", q?: string): Promise<string[]> {
  const rows = await db
    .select({ id: alumniProfiles.id })
    .from(alumniProfiles)
    .innerJoin(users, eq(users.id, alumniProfiles.userId))
    .where(and(...filterConditions(schoolId, status, q)))
    .limit(BULK_LIMIT);
  return rows.map((r) => r.id);
}

/**
 * Records the school's decision on one or more profiles, in one
 * transaction. Ids that aren't active profiles of this school are ignored.
 * Returns how many profiles were updated.
 */
export async function recordDecisions(
  schoolId: string,
  profileIds: string[],
  decision: "verified" | "rejected",
  reviewerId: string
): Promise<number> {
  if (profileIds.length === 0) return 0;
  return db.transaction(async (tx) => {
    const updated = await tx
      .update(alumniProfiles)
      .set({ verificationStatus: decision, updatedAt: new Date() })
      .where(and(inArray(alumniProfiles.id, profileIds), active(schoolId)))
      .returning({ id: alumniProfiles.id, answer: alumniProfiles.verificationAnswer });
    if (updated.length === 0) return 0;

    const review = {
      status: decision === "verified" ? "approved" : "rejected",
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
    };
    // Close open requests (at most one per profile); log the rest as new,
    // already-reviewed requests so every decision is in the history.
    const closed = await tx
      .update(alumniVerificationRequests)
      .set(review)
      .where(
        and(
          inArray(alumniVerificationRequests.alumniProfileId, updated.map((u) => u.id)),
          eq(alumniVerificationRequests.status, "pending")
        )
      )
      .returning({ profileId: alumniVerificationRequests.alumniProfileId });
    const closedIds = new Set(closed.map((c) => c.profileId));
    const toLog = updated.filter((u) => !closedIds.has(u.id));
    if (toLog.length > 0) {
      await tx.insert(alumniVerificationRequests).values(
        toLog.map((u) => ({ alumniProfileId: u.id, schoolId, verificationAnswerSnap: u.answer ?? "", ...review }))
      );
    }
    return updated.length;
  });
}
