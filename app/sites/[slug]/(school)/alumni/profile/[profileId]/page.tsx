import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar, VerificationBadge } from "@/app/_components/alumni";
import { getProfile } from "@/lib/alumni/directory";
import { requireViewer } from "@/lib/auth/session";
import { isUuid } from "@/lib/format";
import { countryName, requireSchool } from "@/lib/schools";

export const metadata: Metadata = { title: "Alumni profile" };

// Screen 1d. Signed-in alumni of this school and its admins only.
export default async function AlumniProfile({
  params,
}: PageProps<"/sites/[slug]/alumni/profile/[profileId]">) {
  const { slug, profileId } = await params;
  const school = await requireSchool(slug);
  const viewer = await requireViewer(school.id);
  if (!isUuid(profileId)) notFound();

  const profile = await getProfile(school.id, profileId, {
    userId: viewer.user.id,
    isAdmin: viewer.isAdmin,
  });
  if (!profile) notFound();
  const isSelf = profile.userId === viewer.user.id;
  const location = [profile.city, profile.country && countryName(profile.country)]
    .filter(Boolean)
    .join(", ");
  const role = [profile.profession, profile.employer].filter(Boolean).join(", ");

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Link href="/alumni" className="inline-flex h-10 items-center text-ink-soft">
        ← Alumni directory
      </Link>

      <article className="rounded-xl border border-line bg-white p-6">
        <div className="flex items-center gap-4">
          <Avatar name={profile.name} size="lg" />
          <div className="min-w-0 space-y-1">
            <h1 className="text-2xl font-bold">{profile.name}</h1>
            <p className="text-ink-soft">
              Class of {profile.graduationYear}
              {profile.classSection && ` · ${profile.classSection}`}
            </p>
            <div className="flex flex-wrap gap-2">
              <VerificationBadge status={profile.verificationStatus} />
              {profile.isMentor && (
                <span className="rounded-full bg-placeholder px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-ink-soft">
                  Available to mentor
                </span>
              )}
            </div>
          </div>
        </div>

        <dl className="mt-6 space-y-2">
          {role && (
            <div className="flex gap-2">
              <dt aria-label="Work">💼</dt>
              <dd>{role}</dd>
            </div>
          )}
          {location && (
            <div className="flex gap-2">
              <dt aria-label="Location">📍</dt>
              <dd>{location}</dd>
            </div>
          )}
        </dl>

        {profile.bio && (
          <p className="mt-4 border-l-4 border-accent-soft pl-3 italic text-ink-soft">
            &ldquo;{profile.bio}&rdquo;
          </p>
        )}

        {profile.linkedinUrl && (
          <a
            href={profile.linkedinUrl}
            rel="noopener noreferrer"
            target="_blank"
            className="mt-4 inline-block text-accent-ink underline"
          >
            LinkedIn profile
          </a>
        )}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          {!isSelf && profile.hasPhone && (
            <a
              href={`/alumni/profile/${profile.id}/whatsapp`}
              rel="noopener noreferrer"
              target="_blank"
              className="flex h-12 items-center justify-center rounded-md bg-accent px-5 font-semibold text-white"
            >
              Message on WhatsApp
            </a>
          )}
          <Link
            href={`/alumni/class/${profile.graduationYear}`}
            className="flex h-12 items-center justify-center rounded-md border border-line-strong px-5 font-semibold"
          >
            View Class of {profile.graduationYear} group →
          </Link>
        </div>
      </article>
    </div>
  );
}
