import type { Metadata } from "next";
import { mockAuthEnabled } from "@/lib/auth/session";
import { requireSchool } from "@/lib/schools";

export const metadata: Metadata = { title: "Join the alumni network" };

// Placeholder for screen 1c (self-registration), built in a later stage.
// Signed-out visitors to members-only alumni pages are sent here.
export default async function JoinAlumni({
  params,
}: PageProps<"/sites/[slug]/alumni/join">) {
  const school = await requireSchool((await params).slug);

  return (
    <div className="mx-auto max-w-xl rounded-xl border border-line bg-white p-6 text-center">
      <h1 className="text-2xl font-bold">Join the {school.name} alumni network</h1>
      <p className="mt-3 text-ink-soft">
        Alumni sign-up is coming soon. Members can browse the directory, see
        profiles and RSVP to events.
      </p>
      {mockAuthEnabled() && (
        <p className="mt-3 text-sm text-amber">
          Development: use the Dev sign-in bar above to sign in as a seeded user.
        </p>
      )}
    </div>
  );
}
