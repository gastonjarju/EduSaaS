import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { cache } from "react";
import { db } from "@/db";
import { schools } from "@/db/schema";

export type School = typeof schools.$inferSelect;

// Cached per request: the layout and every page under a school site call it.
export const getSchoolBySlug = cache(
  async (slug: string): Promise<School | null> => {
    const [school] = await db
      .select()
      .from(schools)
      .where(eq(schools.slug, slug))
      .limit(1);
    return school ?? null;
  }
);

// Every page under app/sites/[slug] must call this itself, not rely on the
// layout: pages render in parallel with layouts, so a layout's notFound()
// does not stop a page from running its queries and streaming its output.
export async function requireSchool(slug: string): Promise<School> {
  const school = await getSchoolBySlug(slug);
  if (!school) notFound();
  return school;
}

const COUNTRY_NAMES: Record<string, string> = {
  GM: "The Gambia",
  ZW: "Zimbabwe",
};

export function countryName(code: string): string {
  return (
    COUNTRY_NAMES[code] ??
    new Intl.DisplayNames(["en"], { type: "region" }).of(code) ??
    code
  );
}
