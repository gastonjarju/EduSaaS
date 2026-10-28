// Small presentational pieces shared by the alumni pages.
import Image from "next/image";
import { normalizeLinkedinUrl } from "@/lib/alumni/linkedin";
import { initials } from "@/lib/format";

const AVATAR_SIZES = {
  sm: "h-8 w-8 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-20 w-20 text-2xl",
};
const AVATAR_PX = { sm: 32, md: 48, lg: 80 };

/** Profile photo when there is one (a public Storage URL), else initials. */
export function Avatar({
  name,
  size = "md",
  photo,
}: {
  name: string;
  size?: keyof typeof AVATAR_SIZES;
  photo?: string | null;
}) {
  if (photo) {
    return (
      <Image
        src={photo}
        alt=""
        width={AVATAR_PX[size]}
        height={AVATAR_PX[size]}
        // Already a small 400px WebP from Storage: skip Next's image optimizer
        unoptimized
        className={`flex-none rounded-full bg-placeholder-strong object-cover ${AVATAR_SIZES[size]}`}
      />
    );
  }
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

/**
 * LinkedIn button. Renders nothing unless the stored URL is a valid https
 * linkedin.com URL, so a bad value can never become a clickable link.
 */
export function LinkedinLink({
  url,
  name,
  withLabel = false,
  className = "",
}: {
  url: string | null;
  name: string;
  withLabel?: boolean;
  className?: string;
}) {
  const href = url && normalizeLinkedinUrl(url);
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={withLabel ? undefined : `${name} on LinkedIn`}
      className={`inline-flex h-12 min-w-12 items-center justify-center gap-2 rounded-md ${withLabel ? "border border-line-strong px-4 font-semibold" : ""} ${className}`}
    >
      <span aria-hidden className="flex h-6 w-6 items-center justify-center rounded bg-[#0a66c2] text-xs font-bold text-white">
        in
      </span>
      {withLabel && "LinkedIn"}
    </a>
  );
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
