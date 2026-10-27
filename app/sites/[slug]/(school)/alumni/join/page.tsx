import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CodeStep, ContactStep, ProfileStep, StepIndicator } from "@/app/_components/JoinForms";
import { readJoinStep } from "@/lib/alumni/join";
import { completeProfile, restartJoin, sendCode, verifyCode } from "@/lib/alumni/joinActions";
import { getViewer, mockAuthEnabled } from "@/lib/auth/session";
import { requireSchool } from "@/lib/schools";

export const metadata: Metadata = { title: "Join the alumni network" };

// Screen 1c. Two steps: verify a phone or email with a one-time code, then
// create a profile. Verifying a contact that already has a profile here signs
// that alumnus in, so this page is also the alumni sign-in. The school comes
// from the host — there is no school picker.
export default async function JoinAlumni({
  params,
}: PageProps<"/sites/[slug]/alumni/join">) {
  const school = await requireSchool((await params).slug);
  const viewer = await getViewer(school.id);
  if (viewer?.profile) redirect(`/alumni/profile/${viewer.profile.id}`);

  const enabled = mockAuthEnabled();
  const state = enabled ? await readJoinStep(school.slug) : null;
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: thisYear - 1950 + 1 }, (_, i) => thisYear - i);

  return (
    <div className="mx-auto max-w-md space-y-5 rounded-xl border border-line bg-white p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">Join the alumni network</h1>
        <p className="text-ink-soft">
          Find classmates from {school.name}. Already a member? Verify your phone or email to sign in.
        </p>
      </header>

      {viewer?.isAdmin ? (
        <p className="rounded-md bg-accent-soft p-3 text-accent-ink">
          You&apos;re signed in as a school admin.{" "}
          <Link href="/alumni" className="underline">
            Go to the alumni directory
          </Link>
        </p>
      ) : !state ? (
        <p className="rounded-md bg-placeholder p-3 text-ink-soft">
          Sign-up isn&apos;t available yet. Please check back soon.
        </p>
      ) : (
        <>
          <StepIndicator step={state.step === "profile" ? 2 : 1} />

          {state.step === "contact" && (
            <ContactStep
              action={sendCode.bind(null, school.slug)}
              defaultCountry={school.country}
            />
          )}

          {state.step === "code" && (
            <CodeStep
              action={verifyCode.bind(null, school.slug)}
              restart={restartJoin}
              sentTo={state.contact.value}
              hint="Development: nothing is sent — the code is always 1234."
            />
          )}

          {state.step === "profile" && (
            <>
              <p className="text-sm text-accent-ink">✓ Verified {state.contact.value}</p>
              <ProfileStep action={completeProfile.bind(null, school.slug)} years={years} />
              <p className="text-sm text-ink-soft">
                Your profile shows as pending until the school verifies it. You can use the network straight away.
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
}
