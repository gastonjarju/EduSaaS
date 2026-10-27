"use server";

// Verify / Reject buttons on the admin Alumni screen. Plain form actions, so
// they work without JavaScript. Re-checks that the user is this school's admin.
import { refresh } from "next/cache";
import { getViewer } from "@/lib/auth/session";
import { isUuid } from "@/lib/format";
import { getSchoolBySlug } from "@/lib/schools";
import { recordDecision } from "./verification";

export async function reviewAlumnus(slug: string, profileId: string, decision: "verified" | "rejected") {
  if (!isUuid(profileId) || (decision !== "verified" && decision !== "rejected")) return;
  const school = await getSchoolBySlug(slug);
  const viewer = school && (await getViewer(school.id));
  if (!school || !viewer?.isAdmin) return;
  await recordDecision(school.id, profileId, decision, viewer.user.id);
  refresh();
}
