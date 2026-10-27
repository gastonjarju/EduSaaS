import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import EventForm from "@/app/_components/EventForm";
import { getEventForAdmin } from "@/lib/alumni/adminEvents";
import { saveEvent } from "@/lib/alumni/eventActions";
import { getRsvpSummary } from "@/lib/alumni/events";
import { requireAdmin } from "@/lib/auth/session";
import { isUuid } from "@/lib/format";
import { requireSchool, schoolTimeZone } from "@/lib/schools";
import { formatMonth, utcToLocal } from "@/lib/time";

export const metadata: Metadata = { title: "Edit event — admin" };

export default async function EditEvent({
  params,
  searchParams,
}: PageProps<"/sites/[slug]/admin/events/[eventId]">) {
  const { slug, eventId } = await params;
  const school = await requireSchool(slug);
  await requireAdmin(school.id);
  if (!isUuid(eventId)) notFound();

  const event = await getEventForAdmin(school.id, eventId);
  if (!event) notFound();
  const [rsvps, query] = await Promise.all([getRsvpSummary(school.id, event.id), searchParams]);
  const tz = schoolTimeZone(school);
  const startsAt = utcToLocal(event.eventDate, tz);
  const created = query.created;
  const backMonth = formatMonth({ year: Number(startsAt.slice(0, 4)), month: Number(startsAt.slice(5, 7)) });

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Link href={`/admin/events?month=${backMonth}`} className="inline-flex h-10 items-center text-ink-soft">
        ← Events
      </Link>

      {(created === "published" || created === "draft") && (
        <p role="status" className="rounded-xl bg-accent-soft p-4 text-accent-ink">
          {created === "published"
            ? "✓ Event published — it's now on the alumni events page."
            : "✓ Draft saved. It isn't visible to alumni until you publish it."}
        </p>
      )}

      <div className="space-y-4 rounded-xl border border-line bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-bold">{event.title}</h1>
          {event.isPublished ? (
            <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-bold uppercase text-accent-ink">Published</span>
          ) : (
            <span className="rounded-full bg-placeholder px-2 py-0.5 text-xs font-bold uppercase text-ink-soft">Draft</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span>
            <strong>{rsvps.going}</strong> going · <strong>{rsvps.maybe}</strong> maybe · {rsvps.notGoing} can&apos;t go
          </span>
          {event.isPublished && (
            <Link href={`/alumni/events/${event.id}`} className="text-accent-ink underline">
              View on the events page
            </Link>
          )}
        </div>

        <EventForm
          action={saveEvent.bind(null, school.slug, event.id)}
          mode="edit"
          isPublished={event.isPublished}
          timeZoneLabel={tz}
          initial={{
            title: event.title,
            startsAt,
            endsAt: event.endDate ? utcToLocal(event.endDate, tz) : "",
            locationType: event.locationType as "physical" | "virtual" | "hybrid",
            location: event.location ?? "",
            virtualLink: event.virtualLink ?? "",
            description: event.description ?? "",
          }}
        />
      </div>
    </div>
  );
}
