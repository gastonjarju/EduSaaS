import type { Metadata } from "next";
import Link from "next/link";
import { listEventsBetween } from "@/lib/alumni/adminEvents";
import { eventPlace } from "@/lib/alumni/events";
import { requireAdmin } from "@/lib/auth/session";
import { formatSchoolDate, requireSchool, schoolTimeZone } from "@/lib/schools";
import { addMonths, currentMonth, formatMonth, localDateKey, monthGrid, monthRange, parseMonth } from "@/lib/time";

export const metadata: Metadata = { title: "Events — admin" };

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function StatusBadge({ published }: { published: boolean }) {
  return published ? (
    <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-bold uppercase text-accent-ink">Published</span>
  ) : (
    <span className="rounded-full bg-placeholder px-2 py-0.5 text-xs font-bold uppercase text-ink-soft">Draft</span>
  );
}

// Admin Events screen: month calendar (list on phones) with drafts, linking
// to the create/edit form.
export default async function AdminEvents({
  params,
  searchParams,
}: PageProps<"/sites/[slug]/admin/events">) {
  const school = await requireSchool((await params).slug);
  await requireAdmin(school.id);
  const tz = schoolTimeZone(school);

  const monthParam = (await searchParams).month;
  const month = parseMonth(typeof monthParam === "string" ? monthParam : undefined) ?? currentMonth(tz);
  const { start, end } = monthRange(month, tz);
  const events = await listEventsBetween(school.id, start, end);

  const byDay = new Map<string, typeof events>();
  for (const e of events) {
    const key = localDateKey(e.eventDate, tz);
    byDay.set(key, [...(byDay.get(key) ?? []), e]);
  }
  const monthName = formatSchoolDate(school, start, { month: "long", year: "numeric" });
  const todayKey = localDateKey(new Date(), tz);
  const time = (d: Date) => formatSchoolDate(school, d, { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Events</h1>
          <p className="text-ink-soft">Reunions, career days, fundraisers — published events show on the alumni events page.</p>
        </div>
        <Link href="/admin/events/new" className="flex h-12 items-center rounded-md bg-accent px-5 font-semibold text-white">
          + New event
        </Link>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-line bg-white p-2">
        <Link href={`/admin/events?month=${formatMonth(addMonths(month, -1))}`} aria-label="Previous month" className="flex h-12 w-12 items-center justify-center rounded-md hover:bg-placeholder">
          ‹
        </Link>
        <h2 className="font-semibold">{monthName}</h2>
        <Link href={`/admin/events?month=${formatMonth(addMonths(month, 1))}`} aria-label="Next month" className="flex h-12 w-12 items-center justify-center rounded-md hover:bg-placeholder">
          ›
        </Link>
      </div>

      {/* Calendar grid: tablets and up */}
      <div className="hidden overflow-hidden rounded-xl border border-line bg-white sm:block">
        <div className="grid grid-cols-7 border-b border-line text-center text-xs font-semibold uppercase text-ink-soft">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-2">{d}</div>
          ))}
        </div>
        {monthGrid(month).map((week, i) => (
          <div key={i} className="grid grid-cols-7 border-b border-line last:border-b-0">
            {week.map((day, j) => (
              <div key={j} className={`min-h-24 border-r border-line p-1 last:border-r-0 ${day ? "" : "bg-canvas"}`}>
                {day && (
                  <>
                    <p className={`text-xs ${day === todayKey ? "font-bold text-accent-ink" : "text-ink-soft"}`}>{Number(day.slice(8))}</p>
                    {byDay.get(day)?.map((e) => (
                      <Link
                        key={e.id}
                        href={`/admin/events/${e.id}`}
                        className={`mt-1 block truncate rounded px-1 py-0.5 text-xs ${e.isPublished ? "bg-accent-soft text-accent-ink" : "border border-dashed border-line-strong text-ink-soft"}`}
                        title={`${e.title}${e.isPublished ? "" : " (draft)"}`}
                      >
                        {time(e.eventDate)} {e.title}
                      </Link>
                    ))}
                  </>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* List: always shown; the main view on phones */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-ink-soft">
          {events.length === 0 ? `No events in ${monthName}.` : `${events.length} ${events.length === 1 ? "event" : "events"} in ${monthName}`}
        </h2>
        <ul className="space-y-2">
          {events.map((e) => (
            <li key={e.id}>
              <Link href={`/admin/events/${e.id}`} className="flex items-center gap-3 rounded-xl border border-line bg-white p-4 hover:border-accent">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{e.title}</p>
                  <p className="text-sm text-ink-soft">
                    {formatSchoolDate(school, e.eventDate)} · {eventPlace(e)}
                  </p>
                </div>
                <StatusBadge published={e.isPublished} />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
