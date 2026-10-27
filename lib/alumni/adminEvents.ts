// Event queries and writes for the admin Events screen. Unlike lib/alumni/
// events.ts, these include drafts. Every function takes the school id.
import { and, asc, eq, gte, lt } from "drizzle-orm";
import { db } from "@/db";
import { events } from "@/db/schema";
import type { Event } from "./events";

export async function listEventsBetween(schoolId: string, start: Date, end: Date) {
  return db
    .select()
    .from(events)
    .where(and(eq(events.schoolId, schoolId), gte(events.eventDate, start), lt(events.eventDate, end)))
    .orderBy(asc(events.eventDate));
}

export async function getEventForAdmin(schoolId: string, eventId: string): Promise<Event | null> {
  const [event] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.schoolId, schoolId)))
    .limit(1);
  return event ?? null;
}

export type EventInput = {
  title: string;
  description: string | null;
  eventDate: Date;
  endDate: Date | null;
  locationType: "physical" | "virtual" | "hybrid";
  location: string | null;
  virtualLink: string | null;
  isPublished: boolean;
};

export async function insertEvent(schoolId: string, createdBy: string, input: EventInput): Promise<string> {
  const [row] = await db
    .insert(events)
    .values({ ...input, schoolId, createdBy })
    .returning({ id: events.id });
  return row.id;
}

/** Updates an event of this school; false if there's no such event. */
export async function updateEvent(schoolId: string, eventId: string, input: Partial<EventInput>): Promise<boolean> {
  const rows = await db
    .update(events)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(events.id, eventId), eq(events.schoolId, schoolId)))
    .returning({ id: events.id });
  return rows.length > 0;
}
