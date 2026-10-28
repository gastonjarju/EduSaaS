"use server";

// Edit profile page: save the profile, upload or remove the photo. Each
// action re-checks that the signed-in user is an alumnus of this school and
// only ever touches their own profile.
import { randomUUID } from "node:crypto";
import { refresh } from "next/cache";
import sharp from "sharp";
import { z } from "zod";
import { getViewer } from "@/lib/auth/session";
import { getSchoolBySlug } from "@/lib/schools";
import { deletePhotos, uploadPhoto } from "@/lib/storage";
import { normalizeLinkedinUrl } from "./linkedin";
import { PRIVACY_FIELDS } from "./privacy";
import { setOwnPhoto, updateOwnProfile } from "./profileEdit";
import { isIndustry, isMentorArea, normalizeActivities, normalizeMemories } from "./profileFields";

export type ProfileFormState = {
  error?: string;
  message?: string;
  values?: Record<string, string | string[]>; // submitted values, restored after an error
  attempt?: number;
};

async function ownProfile(slug: string) {
  const school = await getSchoolBySlug(slug);
  const viewer = school && (await getViewer(school.id));
  if (!school || !viewer?.profile) return null;
  return { school, viewer, profile: viewer.profile };
}

const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((s) => s || null);

const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(100, "Name is too long."),
  classSection: optional(100),
  currentCity: optional(120),
  bio: optional(1000),
  profession: optional(150),
  employer: optional(150),
  industry: z
    .string()
    .transform((s) => (s ? s : null))
    .refine((s) => s === null || isIndustry(s), "Choose an industry from the list."),
  studying: optional(200),
  linkedinUrl: z.string().transform((s, ctx) => {
    if (!s.trim()) return null;
    const url = normalizeLinkedinUrl(s);
    if (!url) ctx.addIssue({ code: "custom", message: "Enter a linkedin.com profile URL, or leave it blank." });
    return url;
  }),
});

export async function saveProfile(slug: string, _prev: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const text = (k: string) => String(formData.get(k) ?? "");
  const list = (k: string) => formData.getAll(k).map(String);
  const values: Record<string, string | string[]> = {
    name: text("name"),
    classSection: text("classSection"),
    currentCity: text("currentCity"),
    bio: text("bio"),
    profession: text("profession"),
    employer: text("employer"),
    industry: text("industry"),
    studying: text("studying"),
    linkedinUrl: text("linkedinUrl"),
    isMentor: formData.get("isMentor") ? "on" : "",
    mentorAreas: list("mentorAreas"),
    activities: list("activities"),
    memories: list("memories"),
    visible: list("visible"),
  };
  const fail = (error: string): ProfileFormState => ({ error, values, attempt: Date.now() });

  const ctx = await ownProfile(slug);
  if (!ctx) return fail("Sign in as an alumnus of this school to edit your profile.");

  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  const visible = new Set(list("visible"));
  const visibility = Object.fromEntries(PRIVACY_FIELDS.map((f) => [f, visible.has(f)]));
  const isMentor = values.isMentor === "on";

  const saved = await updateOwnProfile(ctx.school.id, ctx.viewer.user.id, {
    ...parsed.data,
    isMentor,
    mentorAreas: isMentor ? list("mentorAreas").filter(isMentorArea) : [],
    schoolActivities: normalizeActivities(list("activities")),
    schoolMemories: normalizeMemories(list("memories")),
    visibility,
  });
  if (!saved) return fail("Your profile couldn't be found.");
  refresh();
  return { message: "✓ Profile saved.", attempt: Date.now() };
}

export type PhotoState = { error?: string; ok?: boolean };

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export async function uploadProfilePhoto(slug: string, _prev: PhotoState, formData: FormData): Promise<PhotoState> {
  const ctx = await ownProfile(slug);
  if (!ctx) return { error: "Sign in as an alumnus of this school to change your photo." };

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a photo first." };
  if (file.size > MAX_UPLOAD_BYTES) return { error: "That photo is too large (max 8 MB)." };

  let webp: Buffer;
  try {
    // Upright (EXIF), square crop around the most interesting part, 400px, WebP
    webp = await sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 50_000_000 })
      .rotate()
      .resize(400, 400, { fit: "cover", position: sharp.strategy.attention })
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    return { error: "That file isn't a photo we can read. Try a JPEG or PNG." };
  }

  const path = `${ctx.school.id}/${ctx.profile.id}/${randomUUID()}.webp`;
  try {
    await uploadPhoto(path, webp);
  } catch (err) {
    console.error(err);
    return { error: "The photo couldn't be uploaded. Please try again." };
  }
  const previous = await setOwnPhoto(ctx.viewer.user.id, path);
  if (previous) await deletePhotos([previous]).catch((err) => console.error("Old photo not deleted:", err));
  refresh();
  return { ok: true };
}

export async function removeProfilePhoto(slug: string): Promise<void> {
  const ctx = await ownProfile(slug);
  if (!ctx) return;
  const previous = await setOwnPhoto(ctx.viewer.user.id, null);
  if (previous) await deletePhotos([previous]).catch((err) => console.error("Photo not deleted:", err));
  refresh();
}

