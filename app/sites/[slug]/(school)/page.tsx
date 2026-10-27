import Link from "next/link";
import { requireSchool } from "@/lib/schools";

// Placeholder school home page. Never visited directly: proxy.ts rewrites
// <slug>.edusaas.africa (and active custom domains) here. The real template
// is issue #9.
export default async function SchoolHome({
  params,
}: PageProps<"/sites/[slug]">) {
  const school = await requireSchool((await params).slug);

  return (
    <div className="rounded-xl border border-line bg-white px-6 py-16 text-center">
      <p className="text-sm font-medium uppercase tracking-widest text-ink-soft">
        School site
      </p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">
        {school.name}
      </h1>
      <p className="mt-4 text-ink-soft">
        Placeholder for this school&apos;s home page.
      </p>
      <Link
        href="/alumni"
        className="mt-8 inline-flex h-12 items-center rounded-md bg-accent px-5 font-semibold text-white"
      >
        Find your classmates →
      </Link>
    </div>
  );
}
