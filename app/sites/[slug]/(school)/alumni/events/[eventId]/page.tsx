import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/app/_components/alumni";
import RsvpButtons from "@/app/_components/RsvpButtons";
import ShareButton from "@/app/_components/ShareButton";
import { setRsvp } from "@/lib/alumni/actions";
import { eventPlace, getEvent, getRsvpSummary, getViewerRsvp } from "@/lib/alumni/events";
import { getViewer } from "@/lib/auth/session";
import { isUuid } from "@/lib/format";
import { formatSchoolDate, requireSchool } from "@/lib/schools";
import { photoUrl } from "@/lib/storage";

export const metadata: Metadata = { title: "Event" };

const SHOWN_ATTENDEES = 8;

// Screen 1g. Public details; the virtual link, attendee avatars and RSVP
// buttons are for signed-in members only.
export default async function EventDetail({
  params,
}: PageProps<"/sites/[slug]/alumni/events/[eventId]">) {
  const { slug, eventId } = await params;
  const school = await requireSchool(slug);
  if (!isUuid(eventId)) notFound();

  const [event, viewer] = await Promise.all([
    getEvent(school.id, eventId),
    getViewer(school.id),
  ]);
  if (!event) notFound();

  const [summary, myRsvp, requestHeaders] = await Promise.all([
    getRsvpSummary(school.id, event.id),
    viewer ? getViewerRsvp(school.id, event.id, viewer.user.id) : null,
    headers(),
  ]);

  const when = event.endDate
    ? `${formatSchoolDate(school, event.eventDate)} – ${formatSchoolDate(school, event.endDate, { hour: "2-digit", minute: "2-digit" })}`
    : formatSchoolDate(school, event.eventDate);
  const isPast = (event.endDate ?? event.eventDate) < new Date();

  const host = requestHeaders.get("host");
  const proto = requestHeaders.get("x-forwarded-proto") ?? "http";
  const eventUrl = `${proto}://${host}/alumni/events/${event.id}`;
  // The URL is passed separately; share targets add it to the message.
  const shareText = `You're invited! 🎉 ${event.title} at ${school.name} on ${formatSchoolDate(school, event.eventDate, { day: "numeric", month: "short" })}.`;

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center justify-between">
        <Link href="/alumni/events" className="inline-flex h-10 items-center text-ink-soft">
          ← Events
        </Link>
        {viewer?.isAdmin && (
          <Link href={`/admin/events/${event.id}`} className="inline-flex h-10 items-center font-semibold text-accent-ink underline">
            Edit event
          </Link>
        )}
      </div>

      <article className="space-y-5 rounded-xl border border-line bg-white p-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold">{event.title}</h1>
          <p>📅 {when}</p>
          <p>📍 {eventPlace(event)}</p>
          {event.virtualLink &&
            (viewer ? (
              <a href={event.virtualLink} rel="noopener noreferrer" target="_blank" className="inline-block text-accent-ink underline">
                Join online
              </a>
            ) : (
              <p className="text-sm text-ink-soft">Sign in to see the online link.</p>
            ))}
        </header>

        {event.description && <p className="text-ink-soft">{event.description}</p>}

        <section className="space-y-3 border-t border-line pt-4">
          <p className="text-sm text-ink-soft">
            {summary.going} going · {summary.maybe} maybe
          </p>
          {viewer && summary.goingAttendees.length > 0 && (
            <div className="flex items-center">
              {summary.goingAttendees.slice(0, SHOWN_ATTENDEES).map((a, i) => (
                <span key={`${a.name}-${i}`} title={a.name} className="-mr-2 rounded-full ring-2 ring-white">
                  <Avatar name={a.name} size="sm" photo={photoUrl(a.photoPath)} />
                </span>
              ))}
              {summary.goingAttendees.length > SHOWN_ATTENDEES && (
                <span className="ml-4 text-sm text-ink-soft">
                  +{summary.goingAttendees.length - SHOWN_ATTENDEES} going
                </span>
              )}
            </div>
          )}

          {!isPast &&
            (viewer ? (
              <RsvpButtons
                current={myRsvp}
                action={setRsvp.bind(null, school.slug, event.id)}
              />
            ) : (
              <Link href="/alumni/join" className="flex h-12 items-center justify-center rounded-md bg-ink px-5 font-semibold text-white">
                Join the alumni network to RSVP
              </Link>
            ))}
        </section>

        <ShareButton url={eventUrl} title={event.title} text={shareText} />
      </article>
    </div>
  );
}
