import type { Metadata } from "next";
import Link from "next/link";
import { eventPlace, listEvents, type Event } from "@/lib/alumni/events";
import { formatSchoolDate, requireSchool, type School } from "@/lib/schools";

export const metadata: Metadata = { title: "Events" };

function EventCard({
  school,
  event,
  goingCount,
}: {
  school: School;
  event: Event;
  goingCount: number;
}) {
  return (
    <li>
      <Link
        href={`/alumni/events/${event.id}`}
        className="flex items-center gap-4 rounded-xl border border-line bg-white p-4 hover:border-accent"
      >
        <div className="flex h-16 w-16 flex-none flex-col items-center justify-center rounded-lg bg-accent-soft text-accent-ink">
          <span className="text-xs font-bold uppercase">
            {formatSchoolDate(school, event.eventDate, { month: "short" })}
          </span>
          <span className="text-2xl font-bold leading-none">
            {formatSchoolDate(school, event.eventDate, { day: "numeric" })}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{event.title}</p>
          <p className="text-sm text-ink-soft">
            {formatSchoolDate(school, event.eventDate)} · {eventPlace(event)}
          </p>
          {goingCount > 0 && (
            <p className="text-sm text-ink-soft">{goingCount} going</p>
          )}
        </div>
        <span aria-hidden className="text-ink-soft">
          →
        </span>
      </Link>
    </li>
  );
}

// Screen 1f. Public: published events are listed on the school site too.
export default async function AlumniEvents({
  params,
}: PageProps<"/sites/[slug]/alumni/events">) {
  const school = await requireSchool((await params).slug);
  const { upcoming, past } = await listEvents(school.id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Events</h1>

      <section className="space-y-3">
        <h2 className="font-semibold text-ink-soft">Upcoming</h2>
        {upcoming.length === 0 ? (
          <p className="rounded-xl border border-line bg-white p-6 text-center text-ink-soft">
            No upcoming events yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {upcoming.map(({ event, goingCount }) => (
              <EventCard key={event.id} school={school} event={event} goingCount={goingCount} />
            ))}
          </ul>
        )}
      </section>

      {past.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold text-ink-soft">Past events</h2>
          <ul className="space-y-3 opacity-80">
            {past.map(({ event, goingCount }) => (
              <EventCard key={event.id} school={school} event={event} goingCount={goingCount} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
