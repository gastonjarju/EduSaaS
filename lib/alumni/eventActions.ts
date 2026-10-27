"use server";

// Admin create/update of events. Re-checks that the signed-in user is this
// school's admin (pages aren't an authorization boundary), validates input,
// and converts times typed in the school's local time to UTC.
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getViewer } from "@/lib/auth/session";
import { isUuid } from "@/lib/format";
import { getSchoolBySlug, schoolTimeZone } from "@/lib/schools";
import { localToUtc } from "@/lib/time";
import { insertEvent, updateEvent, type EventInput } from "./adminEvents";

export type EventFormState = {
  error?: string;
  message?: string;
  // Submitted values, so the form can be restored after an error
  values?: Record<string, string>;
  // Changes on every response so the form remounts with `values`
  attempt?: number;
};

const FIELDS = ["title", "startsAt", "endsAt", "locationType", "location", "virtualLink", "description"] as const;

const text = (max: number) => z.string().trim().max(max);
const eventSchema = z
  .object({
    title: text(200).min(1, "Enter a title."),
    startsAt: z.string().min(1, "Choose the date and start time."),
    endsAt: z.string(),
    locationType: z.enum(["physical", "virtual", "hybrid"], "Choose where the event happens."),
    location: text(255),
    virtualLink: text(500),
    description: text(5000),
  })
  .superRefine((v, ctx) => {
    if (v.locationType !== "virtual" && !v.location) {
      ctx.addIssue({ code: "custom", message: "Enter the location (e.g. Lamin campus)." });
    }
    if (v.locationType !== "physical") {
      let ok = false;
      try {
        const u = new URL(v.virtualLink);
        ok = u.protocol === "https:" || u.protocol === "http:";
      } catch {}
      if (!ok) ctx.addIssue({ code: "custom", message: "Enter the online link, starting with https://." });
    }
  });

export async function saveEvent(
  slug: string,
  eventId: string | null,
  _prev: EventFormState,
  formData: FormData
): Promise<EventFormState> {
  const values = Object.fromEntries(FIELDS.map((f) => [f, String(formData.get(f) ?? "")]));
  const fail = (error: string): EventFormState => ({ error, values, attempt: Date.now() });

  const school = await getSchoolBySlug(slug);
  const viewer = school && (await getViewer(school.id));
  if (!school || !viewer?.isAdmin) return fail("Only school admins can manage events.");
  if (eventId !== null && !isUuid(eventId)) return fail("This event doesn't exist.");

  const parsed = eventSchema.safeParse(values);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const v = parsed.data;

  const tz = schoolTimeZone(school);
  const eventDate = localToUtc(v.startsAt, tz);
  if (!eventDate) return fail("Choose a valid date and start time.");
  let endDate: Date | null = null;
  if (v.endsAt) {
    endDate = localToUtc(v.endsAt, tz);
    if (!endDate) return fail("Choose a valid end time, or leave it blank.");
    if (endDate <= eventDate) return fail("The end time must be after the start time.");
  }

  // Which button was pressed: publish, draft (save unpublished), or save (keep status)
  const intent = String(formData.get("intent") ?? "save");
  const input: Omit<EventInput, "isPublished"> = {
    title: v.title,
    description: v.description || null,
    eventDate,
    endDate,
    locationType: v.locationType,
    location: v.locationType === "virtual" ? null : v.location,
    virtualLink: v.locationType === "physical" ? null : v.virtualLink,
  };

  if (eventId === null) {
    const id = await insertEvent(school.id, viewer.user.id, { ...input, isPublished: intent === "publish" });
    redirect(`/admin/events/${id}?created=${intent === "publish" ? "published" : "draft"}`);
  }

  const status =
    intent === "publish" ? { isPublished: true } : intent === "draft" ? { isPublished: false } : {};
  const found = await updateEvent(school.id, eventId, { ...input, ...status });
  if (!found) return fail("This event doesn't exist.");
  refresh();
  return {
    message:
      intent === "publish"
        ? "✓ Published — it's now on the events page."
        : intent === "draft"
          ? "✓ Unpublished — it's hidden from the events page."
          : "✓ Changes saved.",
    values,
    attempt: Date.now(),
  };
}
