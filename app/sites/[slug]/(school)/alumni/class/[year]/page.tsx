import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ClassFeed from "@/app/_components/ClassFeed";
import { createClassPost } from "@/lib/alumni/actions";
import { countMembers, getClassGroup, listPosts, POST_MAX_LENGTH } from "@/lib/alumni/classGroups";
import { requireViewer } from "@/lib/auth/session";
import { timeAgo } from "@/lib/format";
import { requireSchool } from "@/lib/schools";

export async function generateMetadata({
  params,
}: PageProps<"/sites/[slug]/alumni/class/[year]">): Promise<Metadata> {
  return { title: `Class of ${(await params).year}` };
}

// Screen 1e. Members of that class year can read and post; school admins can
// read (moderation tools come later).
export default async function ClassGroupFeed({
  params,
}: PageProps<"/sites/[slug]/alumni/class/[year]">) {
  const { slug, year: yearParam } = await params;
  const school = await requireSchool(slug);
  const viewer = await requireViewer(school.id);
  if (!/^\d{4}$/.test(yearParam)) notFound();
  const year = Number(yearParam);

  const group = await getClassGroup(school.id, year);
  if (!group) notFound();

  const isMember = viewer.profile?.graduationYear === year;
  if (!isMember && !viewer.isAdmin) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-line bg-white p-6 text-center">
        <h1 className="text-xl font-bold">{group.name}</h1>
        <p className="mt-2 text-ink-soft">This group is only open to Class of {year} members.</p>
        {viewer.profile && (
          <Link
            href={`/alumni/class/${viewer.profile.graduationYear}`}
            className="mt-4 inline-flex h-12 items-center rounded-md bg-ink px-5 font-semibold text-white"
          >
            Go to Class of {viewer.profile.graduationYear}
          </Link>
        )}
      </div>
    );
  }

  const [members, posts] = await Promise.all([
    countMembers(school.id, year),
    listPosts(school.id, group.id),
  ]);
  const now = new Date();

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Link href="/alumni" className="inline-flex h-10 items-center text-ink-soft">
        ← Alumni directory
      </Link>
      <header>
        <h1 className="text-2xl font-bold">{group.name}</h1>
        <p className="text-ink-soft">
          {members} {members === 1 ? "member" : "members"}
          {!isMember && " · viewing as school admin"}
        </p>
      </header>
      <ClassFeed
        posts={posts.map((p) => ({
          id: p.id,
          content: p.content,
          authorName: p.authorName,
          authorProfileId: p.authorProfileId,
          timeLabel: timeAgo(p.createdAt, now),
        }))}
        canPost={isMember}
        viewerName={viewer.user.name}
        maxLength={POST_MAX_LENGTH}
        action={createClassPost.bind(null, school.slug, year)}
      />
    </div>
  );
}
