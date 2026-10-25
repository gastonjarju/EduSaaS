// Custom domain → school slug lookup (docs/domainRoutingArchitecture.md §5, step 3).
//
// STUB: the real store is Vercel Edge Config, synced by the backend whenever a
// school's domain_status flips to `active`. Until that exists, mappings are read
// from the CUSTOM_DOMAIN_MAP env var, e.g. {"greenhill.ac.zw":"greenhill"}.
// Swapping in Edge Config should only require changing the body of
// lookupCustomDomain; callers already treat it as an async edge read.

let envMap: Record<string, string> | undefined;

function readEnvMap(): Record<string, string> {
  if (envMap) return envMap;
  envMap = {};
  const raw = process.env.CUSTOM_DOMAIN_MAP;
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        for (const [domain, slug] of Object.entries(parsed)) {
          if (typeof slug === "string") envMap[domain.toLowerCase()] = slug;
        }
      }
    } catch {
      console.error("CUSTOM_DOMAIN_MAP is not valid JSON; ignoring it.");
    }
  }
  return envMap;
}

/** Resolves a normalized (lowercase, port-less) hostname to a school slug. */
export async function lookupCustomDomain(host: string): Promise<string | null> {
  return readEnvMap()[host] ?? null;
}
