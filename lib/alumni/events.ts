// Event queries for the alumni pages. Only published events are ever
// returned; every function takes the school id and filters on it.
import { and, asc, count, desc, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { alumniProfiles, eventRsvps, events, users } from "@/db/schema";
import { visiblePhotoPath } from "./photoSql";

export type Event = typeof events.$inferSelect;
export type RsvpStatus = "going" | "maybe" | "not_going";

/** "Online", "Lamin campus + online", or the venue. */
export function eventPlace(event: Event): string {
  if (event.locationType === "virtual") return "Online";
  if (event.locationType === "hybrid") return `${event.location ?? "In person"} + online`;
  return event.location ?? "Location to be confirmed";
}

const goingCount = sql<number>`(
  select count(*)::int from ${eventRsvps}
  where ${eventRsvps.eventId} = ${events.id} and ${eventRsvps.status} = 'going'
)`;

export async function listEvents(schoolId: string, now = new Date()) {
  const published = and(eq(events.schoolId, schoolId), eq(events.isPublished, true));
  const [upcoming, past] = await Promise.all([
    db
      .select({ event: events, goingCount })
      .from(events)
      .where(and(published, gte(events.eventDate, now)))
      .orderBy(asc(events.eventDate)),
    db
      .select({ event: events, goingCount })
      .from(events)
      .where(and(published, lt(events.eventDate, now)))
      .orderBy(desc(events.eventDate))
      .limit(10),
  ]);
  return { upcoming, past };
}

export async function getEvent(
  schoolId: string,
  eventId: string
): Promise<Event | null> {
  const [event] = await db
    .select()
    .from(events)
    .where(
      and(
        eq(events.id, eventId),
        eq(events.schoolId, schoolId),
        eq(events.isPublished, true)
      )
    )
    .limit(1);
  return event ?? null;
}

export async function getRsvpSummary(schoolId: string, eventId: string) {
  const scoped = and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.schoolId, schoolId));
  const [counts, going] = await Promise.all([
    db
      .select({ status: eventRsvps.status, n: count() })
      .from(eventRsvps)
      .where(scoped)
      .groupBy(eventRsvps.status),
    db
      .select({ name: users.name, profileId: alumniProfiles.id, photoPath: visiblePhotoPath })
      .from(eventRsvps)
      .innerJoin(users, eq(users.id, eventRsvps.userId))
      .leftJoin(
        alumniProfiles,
        and(
          eq(alumniProfiles.userId, eventRsvps.userId),
          eq(alumniProfiles.schoolId, schoolId)
        )
      )
      .where(and(scoped, eq(eventRsvps.status, "going")))
      .orderBy(asc(eventRsvps.createdAt)),
  ]);

  const byStatus = Object.fromEntries(counts.map((c) => [c.status, c.n]));
  return {
    going: byStatus.going ?? 0,
    maybe: byStatus.maybe ?? 0,
    notGoing: byStatus.not_going ?? 0,
    goingAttendees: going,
  };
}

/** Creates or changes the user's RSVP (one per event and user). */
export async function upsertRsvp(values: {
  schoolId: string;
  eventId: string;
  userId: string;
  status: RsvpStatus;
}) {
  await db
    .insert(eventRsvps)
    .values(values)
    .onConflictDoUpdate({
      target: [eventRsvps.eventId, eventRsvps.userId],
      set: { status: values.status, updatedAt: new Date() },
    });
}

export async function getViewerRsvp(
  schoolId: string,
  eventId: string,
  userId: string
): Promise<RsvpStatus | null> {
  const [row] = await db
    .select({ status: eventRsvps.status })
    .from(eventRsvps)
    .where(
      and(
        eq(eventRsvps.eventId, eventId),
        eq(eventRsvps.schoolId, schoolId),
        eq(eventRsvps.userId, userId)
      )
    )
    .limit(1);
  return (row?.status as RsvpStatus | undefined) ?? null;
}
