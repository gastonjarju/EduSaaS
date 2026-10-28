import type { Metadata } from "next";
import Link from "next/link";
import PhotoUploader from "@/app/_components/PhotoUploader";
import ProfileEditor from "@/app/_components/ProfileEditor";
import { removeProfilePhoto, saveProfile, uploadProfilePhoto } from "@/lib/alumni/profileActions";
import { getOwnProfile } from "@/lib/alumni/profileEdit";
import { isVisible, PRIVACY_FIELDS } from "@/lib/alumni/privacy";
import { requireViewer } from "@/lib/auth/session";
import { requireSchool } from "@/lib/schools";
import { photoUrl } from "@/lib/storage";

export const metadata: Metadata = { title: "Edit profile" };

// Edit your own alumni profile: photo, basics, current profession, school
// activities, memories and privacy. All sections are optional.
export default async function EditProfile({ params }: PageProps<"/sites/[slug]/alumni/profile/edit">) {
  const school = await requireSchool((await params).slug);
  const viewer = await requireViewer(school.id);
  const p = viewer.profile ? await getOwnProfile(school.id, viewer.user.id) : null;

  if (!p) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-line bg-white p-6 text-center">
        <h1 className="text-xl font-bold">No alumni profile</h1>
        <p className="mt-2 text-ink-soft">Only alumni have profiles to edit. School admins manage alumni from the admin console.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link href={`/alumni/profile/${p.profileId}`} className="inline-flex h-10 items-center text-ink-soft">
        ← Back to my profile
      </Link>
      <h1 className="text-2xl font-bold">Edit profile</h1>
      <p className="text-ink-soft">Everything here is optional. Fill in as much as you like.</p>

      <section className="space-y-3 rounded-xl border border-line bg-white p-5">
        <h2 className="text-lg font-bold">Photo</h2>
        <PhotoUploader
          name={p.name}
          photo={photoUrl(p.photoPath)}
          upload={uploadProfilePhoto.bind(null, school.slug)}
          remove={removeProfilePhoto.bind(null, school.slug)}
        />
      </section>

      <ProfileEditor
        action={saveProfile.bind(null, school.slug)}
        graduationYear={p.graduationYear}
        initial={{
          name: p.name,
          classSection: p.classSection ?? "",
          currentCity: p.currentCity ?? "",
          bio: p.bio ?? "",
          profession: p.profession ?? "",
          employer: p.employer ?? "",
          industry: p.industry ?? "",
          studying: p.studying ?? "",
          linkedinUrl: p.linkedinUrl ?? "",
          isMentor: p.isMentor,
          mentorAreas: p.mentorAreas,
          activities: p.schoolActivities,
          memories: p.schoolMemories,
          visible: PRIVACY_FIELDS.filter((f) => isVisible(p.visibility, f)),
        }}
      />
    </div>
  );
}
