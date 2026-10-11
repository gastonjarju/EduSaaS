import { lookupCustomDomain } from "./customDomains";

export type Tenant =
  | { kind: "platform" } // the EduSaaS site itself (root domain, www, previews)
  | { kind: "school"; slug: string }
  | { kind: "notFound" };

const ROOT_DOMAIN = (process.env.ROOT_DOMAIN ?? "edusaas.africa").toLowerCase();

// `localhost` is treated as a root domain so `greenhill.localhost:3000`
// resolves to a school in local development.
const ROOT_DOMAINS = [ROOT_DOMAIN, "localhost"];

// Subdomains no school may claim (domainRoutingArchitecture.md §8).
const RESERVED_SUBDOMAINS = new Set(["www", "api", "admin", "app"]);

// DNS-safe slug: lowercase alphanumerics separated by single hyphens.
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidSlug(slug: string): boolean {
  return slug.length <= 63 && SLUG_PATTERN.test(slug);
}

export function normalizeHost(host: string | null): string {
  return (host ?? "")
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, "")
    .replace(/\.$/, "");
}

/**
 * Resolves the Host header to a tenant (domainRoutingArchitecture.md §5).
 * Subdomains of the root domain resolve with no lookup: the subdomain is the
 * slug. Any other host goes through the custom-domain lookup.
 */
export async function resolveTenant(hostHeader: string | null): Promise<Tenant> {
  const host = normalizeHost(hostHeader);
  if (!host) return { kind: "notFound" };

  for (const root of ROOT_DOMAINS) {
    if (host === root) return { kind: "platform" };
    if (!host.endsWith(`.${root}`)) continue;

    const subdomain = host.slice(0, -(root.length + 1));
    if (subdomain === "www") return { kind: "platform" };
    // Nested subdomains (a.b.edusaas.africa) contain a dot and fail isValidSlug.
    if (RESERVED_SUBDOMAINS.has(subdomain) || !isValidSlug(subdomain)) {
      return { kind: "notFound" };
    }
    return { kind: "school", slug: subdomain };
  }

  // Vercel preview/deployment URLs serve the platform site.
  if (host.endsWith(".vercel.app")) return { kind: "platform" };

  const slug = await lookupCustomDomain(host);
  return slug && isValidSlug(slug)
    ? { kind: "school", slug }
    : { kind: "notFound" };
}
