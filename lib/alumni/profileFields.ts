// Options and clean-up rules for the editable profile sections. No server
// imports, so the editor (client) and the save action (server) share them.

export const INDUSTRIES = [
  "Agriculture",
  "Arts & Media",
  "Business & Trade",
  "Construction & Trades",
  "Education",
  "Engineering",
  "Finance & Accounting",
  "Government & Public Service",
  "Health & Medicine",
  "Hospitality & Tourism",
  "Law",
  "Non-profit & Development",
  "Science & Research",
  "Technology",
  "Transport & Logistics",
  "Other",
] as const;

export const MENTOR_AREAS = [
  { value: "career", label: "Career guidance" },
  { value: "university", label: "University applications" },
  { value: "tutoring", label: "Subject tutoring" },
  { value: "general", label: "General advice" },
] as const;

export const ACTIVITY_SUGGESTIONS = [
  "Football",
  "Athletics",
  "Basketball",
  "Netball",
  "Volleyball",
  "Debate club",
  "Choir",
  "Drama",
  "Science club",
  "Quiz team",
  "Scouts",
  "Girl Guides",
  "Prefect",
  "Head boy",
  "Head girl",
  "Class monitor",
  "School newspaper",
  "Dance",
  "Chess",
  "Christian Union",
  "Muslim Students Association",
];

export const LIMITS = {
  activities: 15,
  activityLength: 40,
  memories: 5,
  memoryLength: 280,
};

const collapse = (s: string) => s.replace(/\s+/g, " ").trim();

/** Trims, de-duplicates (ignoring case) and caps activity tags. */
export function normalizeActivities(input: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input) {
    const tag = collapse(raw).slice(0, LIMITS.activityLength);
    const key = tag.toLowerCase();
    if (!tag || seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
    if (out.length === LIMITS.activities) break;
  }
  return out;
}

/** Trims memories (keeping line breaks), drops empty ones, caps count and length. */
export function normalizeMemories(input: readonly string[]): string[] {
  return input
    .map((m) => m.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, LIMITS.memoryLength))
    .filter(Boolean)
    .slice(0, LIMITS.memories);
}

export function isIndustry(value: string): value is (typeof INDUSTRIES)[number] {
  return (INDUSTRIES as readonly string[]).includes(value);
}

export function isMentorArea(value: string): boolean {
  return MENTOR_AREAS.some((a) => a.value === value);
}
