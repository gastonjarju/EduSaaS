import type { Metadata } from "next";
import Link from "next/link";
import EventForm from "@/app/_components/EventForm";
import { saveEvent } from "@/lib/alumni/eventActions";
import { requireAdmin } from "@/lib/auth/session";
import { requireSchool, schoolTimeZone } from "@/lib/schools";

export const metadata: Metadata = { title: "New event — admin" };

export default async function NewEvent({ params }: PageProps<"/sites/[slug]/admin/events/new">) {
  const school = await requireSchool((await params).slug);
  await requireAdmin(school.id);

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Link href="/admin/events" className="inline-flex h-10 items-center text-ink-soft">
        ← Events
      </Link>
      <div className="rounded-xl border border-line bg-white p-6">
        <h1 className="mb-4 text-2xl font-bold">New event</h1>
        <EventForm
          action={saveEvent.bind(null, school.slug, null)}
          mode="create"
          isPublished={false}
          timeZoneLabel={schoolTimeZone(school)}
          initial={{ title: "", startsAt: "", endsAt: "", locationType: "physical", location: "", virtualLink: "", description: "" }}
        />
      </div>
    </div>
  );
}
