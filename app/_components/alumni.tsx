// Small presentational pieces shared by the alumni pages.
import { initials } from "@/lib/format";

const AVATAR_SIZES = {
  sm: "h-8 w-8 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-20 w-20 text-2xl",
};

export function Avatar({
  name,
  size = "md",
}: {
  name: string;
  size?: keyof typeof AVATAR_SIZES;
}) {
  return (
    <span
      aria-hidden
      className={`flex flex-none items-center justify-center rounded-full bg-placeholder-strong font-semibold text-ink-soft ${AVATAR_SIZES[size]}`}
    >
      {initials(name)}
    </span>
  );
}

export function VerificationBadge({ status }: { status: string }) {
  if (status === "verified") {
    return (
      <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-accent-ink">
        ✓ Verified
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="rounded-full bg-amber-soft px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-amber">
        Pending verification
      </span>
    );
  }
  return null;
}

/** "Class of 2015 · Banjul · Teacher", skipping hidden fields. */
export function profileSummary(p: {
  graduationYear: number;
  city: string | null;
  profession: string | null;
}): string {
  return [`Class of ${p.graduationYear}`, p.city, p.profession]
    .filter(Boolean)
    .join(" · ");
}
