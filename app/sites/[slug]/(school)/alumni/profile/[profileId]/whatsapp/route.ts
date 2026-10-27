import { notFound, redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { getProfilePhone } from "@/lib/alumni/directory";
import { requireViewer } from "@/lib/auth/session";
import { isUuid, whatsappNumber } from "@/lib/format";
import { requireSchool } from "@/lib/schools";

// "Message on WhatsApp": redirects to wa.me so the alumnus's phone number is
// never in page HTML, only revealed to a signed-in member who clicks through
// (docs/designDocAlumni.md §7).
export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/sites/[slug]/alumni/profile/[profileId]/whatsapp">
) {
  const { slug, profileId } = await ctx.params;
  const school = await requireSchool(slug);
  const viewer = await requireViewer(school.id);
  if (!isUuid(profileId)) notFound();

  const contact = await getProfilePhone(school.id, profileId);
  if (!contact) notFound();

  const firstName = contact.name.split(" ")[0];
  const text = `Hi ${firstName}, it's ${viewer.user.name} — I found you on the ${school.name} alumni network.`;
  redirect(`https://wa.me/${whatsappNumber(contact.phone)}?text=${encodeURIComponent(text)}`);
}
