import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { alumniProfiles, users } from "@/db/schema";
import { signInAs, signOut } from "@/lib/auth/mockAuthActions";
import { getViewer, mockAuthEnabled } from "@/lib/auth/session";

// Dev-only "sign in as" switcher, shown when MOCK_AUTH=1.
export default async function MockAuthBar({ schoolId }: { schoolId: string }) {
  if (!mockAuthEnabled()) return null;

  const [viewer, admins, alumni] = await Promise.all([
    getViewer(schoolId),
    db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(and(eq(users.role, "school_admin"), eq(users.schoolId, schoolId))),
    db
      .select({
        id: users.id,
        name: users.name,
        year: alumniProfiles.graduationYear,
      })
      .from(alumniProfiles)
      .innerJoin(users, eq(users.id, alumniProfiles.userId))
      .where(
        and(eq(alumniProfiles.schoolId, schoolId), isNull(alumniProfiles.deletedAt))
      )
      .orderBy(asc(users.phone))
      .limit(12),
  ]);

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-amber/30 bg-amber-soft px-4 py-2 text-sm text-ink sm:px-7">
      <span className="font-semibold text-amber">Dev sign-in</span>
      <span className="text-ink-soft">
        {viewer
          ? `Signed in as ${viewer.user.name}${viewer.isAdmin ? " (admin)" : ""}`
          : "Signed out"}
      </span>
      <form action={signInAs} className="flex items-center gap-2">
        <select
          name="userId"
          defaultValue={viewer?.user.id ?? ""}
          className="h-9 rounded-md border border-line bg-white pl-2 pr-9"
          aria-label="Sign in as"
        >
          <option value="" disabled>
            Choose a user…
          </option>
          {admins.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} — school admin
            </option>
          ))}
          {alumni.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} — Class of {u.year}
            </option>
          ))}
        </select>
        <button className="h-9 rounded-md bg-ink px-3 font-semibold text-white">
          Switch
        </button>
      </form>
      {viewer && (
        <form action={signOut}>
          <button className="h-9 rounded-md border border-line bg-white px-3">
            Sign out
          </button>
        </form>
      )}
    </div>
  );
}
