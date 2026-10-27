// Mock sessions for development (docs/architectureDesign.md Open Questions:
// auth library not chosen yet). A cookie holds the signed-in user's id and is
// trusted only when MOCK_AUTH=1, so production stays signed out until real
// OTP sign-in replaces this module.
import { and, eq, isNull, ne } from "drizzle-orm";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/db";
import { alumniProfiles, users } from "@/db/schema";

export const SESSION_COOKIE = "mock_user_id";

export function mockAuthEnabled(): boolean {
  return process.env.MOCK_AUTH === "1";
}

export type Viewer = {
  user: Pick<typeof users.$inferSelect, "id" | "name" | "role" | "schoolId">;
  profile: typeof alumniProfiles.$inferSelect | null;
  isAdmin: boolean;
};

// The signed-in user, if they belong to this school (as one of its alumni or
// admins). Users from another school are treated as signed out here.
export const getViewer = cache(
  async (schoolId: string): Promise<Viewer | null> => {
    if (!mockAuthEnabled()) return null;
    const userId = (await cookies()).get(SESSION_COOKIE)?.value;
    if (!userId || !/^[0-9a-f-]{36}$/i.test(userId)) return null;

    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        role: users.role,
        schoolId: users.schoolId,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!user) return null;

    const isAdmin =
      user.role === "super_admin" ||
      (user.role === "school_admin" && user.schoolId === schoolId);

    const [profile] = await db
      .select()
      .from(alumniProfiles)
      .where(
        and(
          eq(alumniProfiles.userId, user.id),
          eq(alumniProfiles.schoolId, schoolId),
          isNull(alumniProfiles.deletedAt),
          ne(alumniProfiles.verificationStatus, "rejected") // rejected by the school
        )
      )
      .limit(1);

    if (!isAdmin && !profile) return null;
    return { user, profile: profile ?? null, isAdmin };
  }
);

/** Signs the user in (mock session: the cookie is trusted only with MOCK_AUTH=1). */
export async function startSession(userId: string) {
  (await cookies()).set(SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}

/** Like getViewer, but sends signed-out visitors to the alumni sign-up page. */
export async function requireViewer(schoolId: string): Promise<Viewer> {
  const viewer = await getViewer(schoolId);
  if (!viewer) redirect("/alumni/join");
  return viewer;
}

/**
 * For admin pages: signed-out visitors go to sign in; signed-in users who
 * aren't this school's admin get a 404 (the admin area isn't advertised).
 */
export async function requireAdmin(schoolId: string): Promise<Viewer> {
  const viewer = await requireViewer(schoolId);
  if (!viewer.isAdmin) notFound();
  return viewer;
}
