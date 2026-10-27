import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/app/_components/alumni";
import BulkReviewBar from "@/app/_components/BulkReviewBar";
import { countByStatus, listForReview, REVIEW_PAGE_SIZE, REVIEW_STATUSES, type ReviewStatus } from "@/lib/alumni/verification";
import { reviewAlumnus, reviewSelected } from "@/lib/alumni/verificationActions";
import { requireAdmin } from "@/lib/auth/session";
import { formatSchoolDate, requireSchool } from "@/lib/schools";

export const metadata: Metadata = { title: "Alumni — admin" };

const TABS: { status: ReviewStatus | "all"; label: string }[] = [
  { status: "pending", label: "Pending" },
  { status: "verified", label: "Verified" },
  { status: "unverified", label: "Unverified" },
  { status: "rejected", label: "Rejected" },
  { status: "all", label: "All" },
];

const BADGES: Record<string, string> = {
  pending: "bg-amber-soft text-amber",
  verified: "bg-accent-soft text-accent-ink",
  unverified: "bg-placeholder text-ink-soft",
  rejected: "bg-placeholder-strong text-ink",
};

function first(v: string | string[] | undefined) {
  return (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
}

// Screen 1i: the school verifies that people who joined really are alumni.
export default async function AdminAlumni({
  params,
  searchParams,
}: PageProps<"/sites/[slug]/admin/alumni">) {
  const school = await requireSchool((await params).slug);
  await requireAdmin(school.id);

  const query = await searchParams;
  const statusParam = first(query.status);
  const status: ReviewStatus | "all" =
    statusParam === "all" || (REVIEW_STATUSES as readonly string[]).includes(statusParam ?? "")
      ? (statusParam as ReviewStatus | "all")
      : "pending";
  const q = first(query.q)?.slice(0, 100);
  const pageNum = Number(first(query.page));
  const page = Number.isInteger(pageNum) && pageNum > 1 ? pageNum : 1;

  const [counts, { rows, total }] = await Promise.all([
    countByStatus(school.id),
    listForReview(school.id, { status, q, page }),
  ]);
  const allCount = Object.values(counts).reduce((a, b) => a + b, 0);
  const bulk = first(query.bulk);
  const bulkN = Number(first(query.n) ?? 0);
  const pages = Math.max(1, Math.ceil(total / REVIEW_PAGE_SIZE));
  const href = (s: string, p = 1) => {
    const sp = new URLSearchParams({ status: s });
    if (q) sp.set("q", q);
    if (p > 1) sp.set("page", String(p));
    return `/admin/alumni?${sp}`;
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Alumni</h1>
        <p className="text-ink-soft">
          Check that people who joined really are former students. Rejected profiles are hidden from the directory.
        </p>
      </div>

      {(bulk === "verified" || bulk === "rejected") && (
        <p role="status" className="rounded-xl bg-accent-soft p-4 text-accent-ink">
          ✓ {bulkN} {bulkN === 1 ? "alumnus" : "alumni"} {bulk}.
          {bulk === "rejected" && " They're hidden from the directory; verify them from the Rejected tab to undo."}
        </p>
      )}
      {bulk === "none" && (
        <p role="status" className="rounded-xl bg-amber-soft p-4 text-amber">
          Nothing was selected. Tick the alumni you want, then press Verify selected or Reject selected.
        </p>
      )}

      <nav aria-label="Verification status" className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const n = t.status === "all" ? allCount : counts[t.status];
          const current = t.status === status;
          return (
            <Link
              key={t.status}
              href={href(t.status)}
              aria-current={current ? "page" : undefined}
              className={`flex h-10 items-center rounded-full border px-4 text-sm ${current ? "border-accent bg-accent-soft font-bold text-accent-ink" : "border-line bg-white"}`}
            >
              {t.label} ({n})
            </Link>
          );
        })}
      </nav>

      <form action="/admin/alumni" className="flex gap-2">
        <input type="hidden" name="status" value={status} />
        <input type="search" name="q" defaultValue={q} placeholder="Search name…" aria-label="Search by name" className="h-12 min-w-0 flex-1 rounded-md bg-white px-3 border border-line" />
        <button className="h-12 rounded-md bg-ink px-5 font-semibold text-white">Search</button>
      </form>

      {/* Bulk form: row checkboxes and the bar's buttons point at it (form="bulk-review") */}
      <form id="bulk-review" action={reviewSelected.bind(null, school.slug)} className="hidden">
        <input type="hidden" name="status" value={status} />
        {q && <input type="hidden" name="q" value={q} />}
      </form>
      {rows.length > 0 && (
        <BulkReviewBar
          // Remount after each bulk action or page change so the selection resets
          key={`${status}|${q ?? ""}|${page}|${first(query.t) ?? ""}`}
          formId="bulk-review"
          pageCount={rows.length}
          total={total}
          canVerify={status !== "verified"}
          canReject={status !== "rejected"}
        />
      )}

      {rows.length === 0 ? (
        <p className="rounded-xl border border-line bg-white p-6 text-center text-ink-soft">
          {status === "pending" && !q ? "No one is waiting for verification. 🎉" : "No alumni found."}
        </p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">
          {rows.map((r) => (
            <li key={r.profileId} className="flex flex-wrap items-center gap-3 p-4">
              <input
                type="checkbox"
                name="profileIds"
                value={r.profileId}
                form="bulk-review"
                aria-label={`Select ${r.name}`}
                className="h-5 w-5 flex-none cursor-pointer accent-accent"
              />
              <Avatar name={r.name} />
              <div className="min-w-0 flex-1 basis-48">
                {r.status === "rejected" ? (
                  <p className="font-semibold">{r.name}</p>
                ) : (
                  <Link href={`/alumni/profile/${r.profileId}`} className="font-semibold hover:underline">
                    {r.name}
                  </Link>
                )}
                <p className="text-sm text-ink-soft">
                  Class of {r.graduationYear}
                  {r.classSection && ` · ${r.classSection}`} · {r.phone ?? r.email}
                </p>
                <p className="text-xs text-ink-soft">Joined {formatSchoolDate(school, r.joinedAt, { day: "numeric", month: "short", year: "numeric" })}</p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold uppercase ${BADGES[r.status] ?? BADGES.unverified}`}>
                {r.status}
              </span>
              <div className="flex gap-2">
                {r.status !== "verified" && (
                  <form action={reviewAlumnus.bind(null, school.slug, r.profileId, "verified")}>
                    <button className="h-12 rounded-md bg-accent px-4 font-semibold text-white" aria-label={`Verify ${r.name}`}>
                      Verify
                    </button>
                  </form>
                )}
                {r.status !== "rejected" && (
                  <form action={reviewAlumnus.bind(null, school.slug, r.profileId, "rejected")}>
                    <button className="h-12 rounded-md border border-line-strong bg-white px-4 font-semibold" aria-label={`Reject ${r.name}`}>
                      Reject
                    </button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <nav aria-label="Pages" className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Link href={href(status, page - 1)} className="flex h-12 items-center rounded-md border border-line bg-white px-4">
              ‹ Previous
            </Link>
          )}
          <span className="px-2 text-ink-soft">
            Page {Math.min(page, pages)} of {pages}
          </span>
          {page < pages && (
            <Link href={href(status, page + 1)} className="flex h-12 items-center rounded-md border border-line bg-white px-4">
              Next ›
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
