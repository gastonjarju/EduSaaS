"use server";

// Server actions for the join flow (screen 1c). Codes are mocked: with
// MOCK_AUTH=1 the code is always MOCK_CODE and nothing is sent. Real codes
// via Twilio SMS and email replace sendCode/verifyCode later.
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { mockAuthEnabled, startSession } from "@/lib/auth/session";
import { getSchoolBySlug } from "@/lib/schools";
import type { ActionState } from "./actions";
import { normalizeContact } from "./contact";
import { normalizeLinkedinUrl } from "./linkedin";
import { phoneCountry } from "./phoneCountries";
import {
  clearJoin,
  createAlumnus,
  findAccount,
  JoinConflictError,
  markCodeSent,
  markVerified,
  readJoinStep,
} from "./join";

const MOCK_CODE = "1234";

export async function sendCode(slug: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!mockAuthEnabled()) return { error: "Sign-up isn't available yet." };
  const school = await getSchoolBySlug(slug);
  if (!school) return { error: "School not found." };

  const kind = formData.get("kind") === "email" ? "email" : "phone";
  const raw = String(formData.get("contact") ?? "");
  // Country picked next to the phone field; anything unexpected → school's country
  const picked = String(formData.get("phoneCountry") ?? "");
  const country = phoneCountry(picked) ? picked : school.country;
  const contact = normalizeContact(kind, raw, country);
  if (!contact) {
    return {
      error:
        kind === "phone"
          ? "Enter a valid phone number for the selected country, or start with + and the country code."
          : "Enter a valid email address.",
      content: raw,
      country,
    };
  }

  await markCodeSent(slug, contact);
  refresh();
  return { ok: true };
}

export async function verifyCode(slug: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!mockAuthEnabled()) return { error: "Sign-up isn't available yet." };
  const school = await getSchoolBySlug(slug);
  const state = await readJoinStep(slug);
  if (!school || state.step !== "code") return { error: "Your code expired. Please start again." };

  const code = String(formData.get("code") ?? "").replace(/\s/g, "");
  if (code !== MOCK_CODE) return { error: "Incorrect code. Please try again." };

  // The code proves they own this phone/email. Existing members sign in.
  const account = await findAccount(school.id, state.contact);
  if (account) {
    const isThisSchoolsAdmin =
      account.user.role === "school_admin" && account.user.schoolId === school.id;
    if (account.profileHere || isThisSchoolsAdmin) {
      await clearJoin();
      await startSession(account.user.id);
      // ?welcome= makes the profile say they were signed in to an existing account
      redirect(
        account.profileHere
          ? `/alumni/profile/${account.profileHere.id}?welcome=${state.contact.kind}`
          : "/alumni"
      );
    }
    // Stay on the code step (don't clear the join cookies) for refusals:
    // changing cookies re-renders the page, which would lose the error.
    if (account.hasProfileElsewhere) {
      return { error: "This contact is already registered with another school's alumni network." };
    }
    if (account.user.role !== "alumni") {
      return { error: "This contact belongs to an existing staff account." };
    }
    // An alumni account with no active profile (e.g. they deleted it) can
    // rejoin: completeProfile reuses the account.
  }

  await markVerified(slug, state.contact);
  refresh();
  return { ok: true };
}

const thisYear = new Date().getFullYear();
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((s) => s || null);

const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(100),
  graduationYear: z.coerce
    .number()
    .int()
    .min(1950, "Choose your graduation year.")
    .max(thisYear + 1, "Choose your graduation year."),
  profession: optionalText(150),
  city: optionalText(120),
  linkedinUrl: z
    .string()
    .trim()
    .transform((s, ctx) => {
      if (!s) return null;
      const url = normalizeLinkedinUrl(s);
      if (!url) ctx.addIssue({ code: "custom", message: "Enter a linkedin.com profile URL, or leave it blank." });
      return url;
    }),
});

export async function completeProfile(slug: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  if (!mockAuthEnabled()) return { error: "Sign-up isn't available yet." };
  const school = await getSchoolBySlug(slug);
  const state = await readJoinStep(slug);
  if (!school || state.step !== "profile") return { error: "Your session expired. Please start again." };

  const parsed = profileSchema.safeParse({
    name: formData.get("name") ?? "",
    graduationYear: formData.get("graduationYear") ?? "",
    profession: formData.get("profession") ?? "",
    city: formData.get("city") ?? "",
    linkedinUrl: formData.get("linkedinUrl") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  let profileId: string;
  try {
    const created = await createAlumnus({ schoolId: school.id, contact: state.contact, ...parsed.data });
    profileId = created.profileId;
    await startSession(created.userId);
  } catch (err) {
    if (err instanceof JoinConflictError) return { error: err.message };
    if (isUniqueViolation(err)) {
      return { error: "This contact was just registered. Please sign in instead." };
    }
    throw err;
  }
  await clearJoin();
  redirect(`/alumni/profile/${profileId}`);
}

export async function restartJoin() {
  await clearJoin();
  refresh();
}

function isUniqueViolation(err: unknown): boolean {
  const e = err as { code?: string; cause?: { code?: string } };
  return e?.code === "23505" || e?.cause?.code === "23505";
}
