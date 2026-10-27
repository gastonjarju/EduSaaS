import type { Metadata } from "next";
import Link from "next/link";
import MockAuthBar from "@/app/_components/MockAuthBar";
import NavLinks from "@/app/_components/NavLinks";
import { getViewer } from "@/lib/auth/session";
import { countryName, getSchoolBySlug, requireSchool } from "@/lib/schools";

// Shell for every page of a school site. It sits in a route group below
// [slug] so that notFound() here is caught by app/sites/[slug]/not-found.tsx.
// Links are host-relative ("/alumni"): the proxy adds the /sites/[slug] prefix.

export async function generateMetadata({
  params,
}: LayoutProps<"/sites/[slug]">): Promise<Metadata> {
  const school = await getSchoolBySlug((await params).slug);
  return school
    ? { title: { default: school.name, template: `%s — ${school.name}` } }
    : {};
}

// Placeholder nav until the school home page and site nav land (issue #9).
const NAV = [
  { href: "/", label: "Home" },
  { href: "/alumni", label: "Alumni" },
  { href: "/alumni/events", label: "Events" },
];

export default async function SchoolLayout({
  children,
  params,
}: LayoutProps<"/sites/[slug]">) {
  const school = await requireSchool((await params).slug);
  const viewer = await getViewer(school.id);
  const nav = viewer?.isAdmin ? [...NAV, { href: "/admin/events", label: "Admin" }] : NAV;

  return (
    <div className="flex flex-1 flex-col bg-canvas font-sans text-base text-ink">
      <MockAuthBar schoolId={school.id} />
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-7">
          <Link href="/" className="min-w-0">
            <p className="truncate font-bold">{school.name}</p>
            <p className="text-sm text-ink-soft">{countryName(school.country)}</p>
          </Link>
          <nav className="flex gap-1 text-sm">
            <NavLinks items={nav} />
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-7">
        {children}
      </main>
    </div>
  );
}
