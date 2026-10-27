import { notFound } from "next/navigation";
import type { NextRequest } from "next/server";
import { exportDirectory } from "@/lib/alumni/directory";
import { getViewer } from "@/lib/auth/session";
import { csvRow } from "@/lib/format";
import { requireSchool } from "@/lib/schools";

// "Export list" on the directory: admin-only CSV including contact details.
export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/sites/[slug]/alumni/export">
) {
  const school = await requireSchool((await ctx.params).slug);
  const viewer = await getViewer(school.id);
  if (!viewer?.isAdmin) notFound();

  const rows = await exportDirectory(school.id);
  const csv = [
    csvRow(["Name", "Graduation year", "Class", "City", "Country", "Profession", "Employer", "Verification", "Phone", "Email", "Joined"]),
    ...rows.map((r) =>
      csvRow([r.name, r.graduationYear, r.classSection, r.city, r.country, r.profession, r.employer, r.verificationStatus, r.phone, r.email, r.joinedAt.toISOString().slice(0, 10)])
    ),
  ].join("\r\n");

  return new Response(csv + "\r\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${school.slug}-alumni.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
