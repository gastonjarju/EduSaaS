import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar, LinkedinLink, VerificationBadge } from "@/app/_components/alumni";
import { getProfile } from "@/lib/alumni/directory";
import { MENTOR_AREAS } from "@/lib/alumni/profileFields";
import { requireViewer } from "@/lib/auth/session";
import { isUuid } from "@/lib/format";
import { countryName, requireSchool } from "@/lib/schools";
import { photoUrl } from "@/lib/storage";

export const metadata: Metadata = { title: "Alumni profile" };

// Screen 1d. Signed-in alumni of this school and its admins only.
export default async function AlumniProfile({
  params,
  searchParams,
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
  // Set by the join flow when a verified contact already had an account here
  const welcome = (await searchParams).welcome;
  const welcomeBack = isSelf && (welcome === "phone" || welcome === "email");
  const location = [profile.city, profile.country && countryName(profile.country)]
    .filter(Boolean)
    .join(", ");
  const role = [profile.profession, profile.employer].filter(Boolean).join(", ");
  const mentorLabels = profile.mentorAreas
    .map((a) => MENTOR_AREAS.find((m) => m.value === a)?.label)
    .filter(Boolean)
    .join(", ");
  const hasWork = Boolean(role || profile.industry || profile.studying || profile.isMentor);
  // Nudge owners whose profile is missing the optional sections
  const missing = isSelf
    ? [
        !profile.photoPath && "a photo",
        !hasWork && "what you do now",
        profile.activities.length === 0 && "your school activities",
        profile.memories.length === 0 && "a memory or two",
      ].filter(Boolean)
    : [];
  const sectionTitle = "text-sm font-bold uppercase tracking-wide text-ink-soft";

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Link href="/alumni" className="inline-flex h-10 items-center text-ink-soft">
        ← Alumni directory
      </Link>

      {welcomeBack && (
        <p role="status" className="rounded-xl bg-accent-soft p-4 text-accent-ink">
          Welcome back, {profile.name.split(" ")[0]}. This {welcome === "email" ? "email" : "number"} is already
          registered, so we&apos;ve signed you in.
        </p>
      )}

      {missing.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-accent bg-accent-soft p-4">
          <p className="min-w-0 flex-1 text-accent-ink">
            <strong>Complete your profile</strong> — add {missing.join(", ").replace(/, ([^,]*)$/, " and $1")} so
            classmates can recognise you.
          </p>
          <Link href="/alumni/profile/edit" className="flex h-12 items-center rounded-md bg-accent px-4 font-semibold text-white">
            Complete profile
          </Link>
        </div>
      )}

      <article className="space-y-6 rounded-xl border border-line bg-white p-6">
        <div className="flex items-center gap-4">
          <Avatar name={profile.name} size="lg" photo={photoUrl(profile.photoPath)} />
          <div className="min-w-0 flex-1 space-y-1">
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

        {location && <p>📍 {location}</p>}

        {profile.bio && (
          <p className="border-l-4 border-accent-soft pl-3 italic text-ink-soft">&ldquo;{profile.bio}&rdquo;</p>
        )}

        {hasWork && (
          <section className="space-y-2">
            <h2 className={sectionTitle}>Current profession</h2>
            <dl className="space-y-1">
              {role && (
                <div className="flex gap-2">
                  <dt aria-label="Work">💼</dt>
                  <dd>{role}</dd>
                </div>
              )}
              {profile.industry && (
                <div className="flex gap-2">
                  <dt aria-label="Industry">🏢</dt>
                  <dd>{profile.industry}</dd>
                </div>
              )}
              {profile.studying && (
                <div className="flex gap-2">
                  <dt aria-label="Studying">🎓</dt>
                  <dd>Studying {profile.studying}</dd>
                </div>
              )}
              {profile.isMentor && (
                <div className="flex gap-2">
                  <dt aria-label="Mentoring">🤝</dt>
                  <dd>Open to mentoring{mentorLabels && `: ${mentorLabels}`}</dd>
                </div>
              )}
            </dl>
          </section>
        )}

        {profile.activities.length > 0 && (
          <section className="space-y-2">
            <h2 className={sectionTitle}>At school</h2>
            <ul className="flex flex-wrap gap-2">
              {profile.activities.map((a) => (
                <li key={a} className="rounded-full bg-accent-soft px-3 py-1 text-sm text-accent-ink">
                  {a}
                </li>
              ))}
            </ul>
          </section>
        )}

        {profile.memories.length > 0 && (
          <section className="space-y-2">
            <h2 className={sectionTitle}>Memories</h2>
            <ul className="space-y-2">
              {profile.memories.map((m, i) => (
                <li key={i} className="whitespace-pre-line rounded-lg bg-canvas p-3">
                  {m}
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {isSelf && (
            <Link
              href="/alumni/profile/edit"
              className="flex h-12 items-center justify-center rounded-md bg-ink px-5 font-semibold text-white"
            >
              Edit profile
            </Link>
          )}
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
          <LinkedinLink url={profile.linkedinUrl} name={profile.name} withLabel />
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
