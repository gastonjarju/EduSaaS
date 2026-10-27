// Alumni self-registration (screen 1c): state between steps and the
// account/profile writes. Step state lives in short-lived httpOnly cookies so
// the verified phone/email can't be edited between steps. Cookies are
// per-host, so each school site has its own; the slug is stored too.
import { and, eq, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "@/db";
import { alumniProfiles, classGroups, users } from "@/db/schema";
import type { Contact } from "./contact";

const PENDING_COOKIE = "join_pending"; // code sent, not yet verified
const VERIFIED_COOKIE = "join_verified"; // code verified, profile not created
const MAX_AGE_SECONDS = 15 * 60;

export type JoinStep =
  | { step: "contact" }
  | { step: "code"; contact: Contact }
  | { step: "profile"; contact: Contact };

function parse(raw: string | undefined, slug: string): Contact | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    if (v?.slug !== slug || (v.kind !== "phone" && v.kind !== "email")) return null;
    if (typeof v.value !== "string") return null;
    return { kind: v.kind, value: v.value };
  } catch {
    return null;
  }
}

export async function readJoinStep(slug: string): Promise<JoinStep> {
  const jar = await cookies();
  const verified = parse(jar.get(VERIFIED_COOKIE)?.value, slug);
  if (verified) return { step: "profile", contact: verified };
  const pending = parse(jar.get(PENDING_COOKIE)?.value, slug);
  if (pending) return { step: "code", contact: pending };
  return { step: "contact" };
}

async function writeCookie(name: string, slug: string, contact: Contact) {
  (await cookies()).set(name, JSON.stringify({ slug, ...contact }), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function markCodeSent(slug: string, contact: Contact) {
  await writeCookie(PENDING_COOKIE, slug, contact);
}

export async function markVerified(slug: string, contact: Contact) {
  (await cookies()).delete(PENDING_COOKIE);
  await writeCookie(VERIFIED_COOKIE, slug, contact);
}

export async function clearJoin() {
  const jar = await cookies();
  jar.delete(PENDING_COOKIE);
  jar.delete(VERIFIED_COOKIE);
}

/** The existing account for this phone/email, if any, and its profile here. */
export async function findAccount(schoolId: string, contact: Contact) {
  const [user] = await db
    .select({ id: users.id, role: users.role, schoolId: users.schoolId })
    .from(users)
    .where(contact.kind === "phone" ? eq(users.phone, contact.value) : eq(users.email, contact.value))
    .limit(1);
  if (!user) return null;

  const [profile] = await db
    .select({ id: alumniProfiles.id, schoolId: alumniProfiles.schoolId })
    .from(alumniProfiles)
    .where(and(eq(alumniProfiles.userId, user.id), isNull(alumniProfiles.deletedAt)))
    .limit(1);
  return {
    user,
    profileHere: profile?.schoolId === schoolId ? profile : null,
    hasProfileElsewhere: Boolean(profile && profile.schoolId !== schoolId),
  };
}

/**
 * Creates the user, their alumni profile (pending verification — honor
 * system for V1) and the class group for their year if it's the first one.
 */
export async function createAlumnus(input: {
  schoolId: string;
  contact: Contact;
  name: string;
  graduationYear: number;
  profession: string | null;
  city: string | null;
  linkedinUrl: string | null;
}): Promise<{ userId: string; profileId: string }> {
  return db.transaction(async (tx) => {
    const [user] = await tx
      .insert(users)
      .values({
        name: input.name,
        role: "alumni",
        phone: input.contact.kind === "phone" ? input.contact.value : null,
        email: input.contact.kind === "email" ? input.contact.value : null,
      })
      .returning({ id: users.id });

    const [profile] = await tx
      .insert(alumniProfiles)
      .values({
        userId: user.id,
        schoolId: input.schoolId,
        graduationYear: input.graduationYear,
        profession: input.profession,
        currentCity: input.city,
        linkedinUrl: input.linkedinUrl,
        verificationStatus: "pending",
      })
      .returning({ id: alumniProfiles.id });

    await tx
      .insert(classGroups)
      .values({
        schoolId: input.schoolId,
        graduationYear: input.graduationYear,
        name: `Class of ${input.graduationYear}`,
      })
      .onConflictDoNothing();

    return { userId: user.id, profileId: profile.id };
  });
}
