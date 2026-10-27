"use server";

// Verify / Reject on the admin Alumni screen, for one row or a selection.
// Plain form actions, so they work without JavaScript. Each re-checks that
// the user is this school's admin.
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth/session";
import { isUuid } from "@/lib/format";
import { getSchoolBySlug } from "@/lib/schools";
import { BULK_LIMIT, idsMatching, recordDecisions, REVIEW_STATUSES, type ReviewStatus } from "./verification";

type Decision = "verified" | "rejected";
const isDecision = (d: unknown): d is Decision => d === "verified" || d === "rejected";

async function adminOf(slug: string) {
  const school = await getSchoolBySlug(slug);
  const viewer = school && (await getViewer(school.id));
  return school && viewer?.isAdmin ? { school, viewer } : null;
}

export async function reviewAlumnus(slug: string, profileId: string, decision: Decision) {
  if (!isUuid(profileId) || !isDecision(decision)) return;
  const admin = await adminOf(slug);
  if (!admin) return;
  await recordDecisions(admin.school.id, [profileId], decision, admin.viewer.user.id);
  refresh();
}

/**
 * Bulk Verify / Reject. Applies to the ticked rows, or, with
 * allMatching=1, to everyone in the current tab (status + search).
 */
export async function reviewSelected(slug: string, formData: FormData) {
  const admin = await adminOf(slug);
  if (!admin) return;

  const statusParam = String(formData.get("status") ?? "pending");
  const status: ReviewStatus | "all" =
    statusParam === "all" || (REVIEW_STATUSES as readonly string[]).includes(statusParam)
      ? (statusParam as ReviewStatus | "all")
      : "pending";
  const q = String(formData.get("q") ?? "").trim().slice(0, 100) || undefined;
  const back = new URLSearchParams({ status });
  if (q) back.set("q", q);

  const decision = formData.get("decision");
  const ids =
    formData.get("allMatching") === "1"
      ? await idsMatching(admin.school.id, status, q)
      : formData.getAll("profileIds").map(String).filter(isUuid).slice(0, BULK_LIMIT);
  if (!isDecision(decision) || ids.length === 0) {
    back.set("bulk", "none");
    redirect(`/admin/alumni?${back}`);
  }

  const n = await recordDecisions(admin.school.id, ids, decision, admin.viewer.user.id);
  back.set("bulk", decision);
  back.set("n", String(n));
  back.set("t", String(Date.now())); // makes each result a new page state
  redirect(`/admin/alumni?${back}`);
}
