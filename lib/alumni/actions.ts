"use server";

// Alumni mutations. Each action re-derives the school from its slug and
// re-checks the signed-in viewer and their membership: the proxy and page
// guards are not an authorization boundary for server actions.
import { refresh } from "next/cache";
import { z } from "zod";
import { getViewer } from "@/lib/auth/session";
import { isUuid } from "@/lib/format";
import { getSchoolBySlug } from "@/lib/schools";
import { getClassGroup, insertPost, POST_MAX_LENGTH } from "./classGroups";
import { getEvent, upsertRsvp } from "./events";

export type ActionState = { error?: string; ok?: boolean; content?: string };

const postSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Write something first.")
    .max(POST_MAX_LENGTH, `Posts can be up to ${POST_MAX_LENGTH} characters.`),
});

export async function createClassPost(
  slug: string,
  year: number,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const content = formData.get("content");
  const parsed = postSchema.safeParse({ content });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, content: String(content ?? "") };
  }

  const school = await getSchoolBySlug(slug);
  const viewer = school && (await getViewer(school.id));
  if (!school || !viewer) return { error: "Please sign in to post." };
  if (viewer.profile?.graduationYear !== year) {
    return { error: `Only Class of ${year} members can post here.` };
  }
  const group = await getClassGroup(school.id, year);
  if (!group) return { error: "This class group doesn't exist." };

  await insertPost({
    schoolId: school.id,
    classGroupId: group.id,
    authorId: viewer.user.id,
    content: parsed.data.content,
  });
  refresh();
  return { ok: true };
}

const rsvpSchema = z.object({
  status: z.enum(["going", "maybe", "not_going"]),
});

export async function setRsvp(
  slug: string,
  eventId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = rsvpSchema.safeParse({ status: formData.get("status") });
  if (!parsed.success || !isUuid(eventId)) return { error: "Invalid RSVP." };

  const school = await getSchoolBySlug(slug);
  const viewer = school && (await getViewer(school.id));
  if (!school || !viewer) return { error: "Please sign in to RSVP." };
  const event = await getEvent(school.id, eventId);
  if (!event) return { error: "This event doesn't exist." };
  if ((event.endDate ?? event.eventDate) < new Date()) {
    return { error: "This event has already happened." };
  }

  await upsertRsvp({
    schoolId: school.id,
    eventId: event.id,
    userId: viewer.user.id,
    status: parsed.data.status,
  });
  refresh();
  return { ok: true };
}
