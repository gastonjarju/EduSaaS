import NavLinks from "@/app/_components/NavLinks";

// Admin console frame (wireframes/school-admin-wireframes.html). Only the
// sections that exist are linked. Presentational only: each admin page checks
// requireAdmin() itself, since pages render in parallel with layouts.
const SECTIONS = [
  { href: "/admin/events", label: "Events" },
  { href: "/admin/alumni", label: "Alumni" },
];

export default function AdminLayout({ children }: LayoutProps<"/sites/[slug]/admin">) {
  return (
    <div className="space-y-4">
      <nav aria-label="Admin console" className="flex items-center gap-1 border-b border-line pb-3 text-sm">
        <span className="mr-2 font-bold uppercase tracking-wide text-ink-soft">Admin console</span>
        <NavLinks items={SECTIONS} />
      </nav>
      {children}
    </div>
  );
}
