import type { Metadata } from "next";
import Link from "next/link";
import { Avatar, LinkedinLink, VerificationBadge, profileSummary } from "@/app/_components/alumni";
import {
  directoryFilterOptions,
  PAGE_SIZE,
  searchDirectory,
  type DirectoryFilters,
} from "@/lib/alumni/directory";
import { countByStatus } from "@/lib/alumni/verification";
import { requireViewer } from "@/lib/auth/session";
import { requireSchool } from "@/lib/schools";

export const metadata: Metadata = { title: "Alumni directory" };

function first(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v?.trim() || undefined;
}

function parseFilters(params: Record<string, string | string[] | undefined>): DirectoryFilters {
  const year = Number(first(params.year));
  const page = Number(first(params.page));
  return {
    q: first(params.q)?.slice(0, 100),
    year: Number.isInteger(year) && year >= 1950 && year <= 2100 ? year : undefined,
    city: first(params.city)?.slice(0, 120),
    page: Number.isInteger(page) && page > 1 ? page : 1,
  };
}

function pageHref(filters: DirectoryFilters, page: number): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.year) params.set("year", String(filters.year));
  if (filters.city) params.set("city", filters.city);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/alumni?${qs}` : "/alumni";
}

// Screen 1b. Signed-in alumni of this school and its admins only.
export default async function AlumniDirectory({
  params,
  searchParams,
}: PageProps<"/sites/[slug]/alumni">) {
  const school = await requireSchool((await params).slug);
  const viewer = await requireViewer(school.id);
  const ctx = { userId: viewer.user.id, isAdmin: viewer.isAdmin };
  const filters = parseFilters(await searchParams);

  const [{ profiles, total }, options, statusCounts] = await Promise.all([
    searchDirectory(school.id, filters, ctx),
    directoryFilterOptions(school.id, ctx),
    viewer.isAdmin ? countByStatus(school.id) : null,
  ]);
  const pendingCount = statusCounts?.pending ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filtered = Boolean(filters.q || filters.year || filters.city);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Alumni directory</h1>
          <p className="text-ink-soft">
            {total} {total === 1 ? "alumnus" : "alumni"}
            {filtered ? " match your search" : ` of ${school.name}`}
          </p>
        </div>
        {viewer.isAdmin && (
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/alumni"
              className="flex h-12 items-center rounded-md bg-accent px-4 font-semibold text-white"
            >
              Review pending ({pendingCount})
            </Link>
            <a
              href="/alumni/export"
              className="flex h-12 items-center rounded-md border border-line-strong bg-white px-4 font-semibold"
            >
              Export list
            </a>
          </div>
        )}
      </div>

      <form
        action="/alumni"
        className="grid gap-2 rounded-xl border border-line bg-white p-3 sm:grid-cols-[1fr_auto_auto_auto]"
      >
        <input
          type="search"
          name="q"
          defaultValue={filters.q}
          placeholder="Search name…"
          aria-label="Search by name"
          className="h-12 rounded-md bg-placeholder px-3"
        />
        <select
          name="year"
          defaultValue={filters.year ?? ""}
          aria-label="Graduation year"
          className="h-12 rounded-md bg-placeholder px-3"
        >
          <option value="">Any year</option>
          {options.years.map((y) => (
            <option key={y} value={y}>
              Class of {y}
            </option>
          ))}
        </select>
        <select
          name="city"
          defaultValue={filters.city ?? ""}
          aria-label="Location"
          className="h-12 rounded-md bg-placeholder px-3"
        >
          <option value="">Any location</option>
          {options.cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button className="h-12 rounded-md bg-ink px-5 font-semibold text-white">
          Search
        </button>
      </form>

      {profiles.length === 0 ? (
        <div className="rounded-xl border border-line bg-white px-6 py-12 text-center">
          <p className="font-semibold">No alumni found</p>
          {filtered && (
            <Link href="/alumni" className="mt-2 inline-block text-accent-ink underline">
              Clear search
            </Link>
          )}
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((p) => (
            <li
              key={p.id}
              className="relative flex h-full items-center gap-3 rounded-xl border border-line bg-white p-4 hover:border-accent"
            >
              <Avatar name={p.name} />
              <div className="min-w-0 flex-1">
                {/* The name link stretches over the whole card; the LinkedIn
                    button sits above it (z-10) since links can't nest. */}
                <Link
                  href={`/alumni/profile/${p.id}`}
                  className="block truncate font-semibold after:absolute after:inset-0 after:rounded-xl"
                >
                  {p.name}
                </Link>
                  <p className="text-sm text-ink-soft">{profileSummary(p)}</p>
                  {viewer.isAdmin && p.verificationStatus !== "verified" && (
                    <div className="mt-1">
                      <VerificationBadge status={p.verificationStatus} />
                      {p.verificationStatus === "unverified" && (
                        <span className="text-xs text-ink-soft">Unverified</span>
                      )}
                    </div>
                  )}
              </div>
              <LinkedinLink url={p.linkedinUrl} name={p.name} className="relative z-10 flex-none" />
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <nav aria-label="Pages" className="flex items-center justify-center gap-2">
          {filters.page > 1 && (
            <Link href={pageHref(filters, filters.page - 1)} className="flex h-12 items-center rounded-md border border-line bg-white px-4">
              ‹ Previous
            </Link>
          )}
          <span className="px-2 text-ink-soft">
            Page {Math.min(filters.page, pages)} of {pages}
          </span>
          {filters.page < pages && (
            <Link href={pageHref(filters, filters.page + 1)} className="flex h-12 items-center rounded-md border border-line bg-white px-4">
              Next ›
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
