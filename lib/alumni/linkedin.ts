// LinkedIn profile URLs entered by alumni. Only https linkedin.com URLs are
// accepted and rendered, so a profile link can never be javascript: or point
// somewhere else. No database access.

/**
 * Returns a canonical "https://www.linkedin.com/..." URL, or null if the
 * input isn't a LinkedIn URL. Accepts input without the scheme, e.g.
 * "linkedin.com/in/aisha".
 */
export function normalizeLinkedinUrl(input: string): string | null {
  const raw = input.trim();
  if (!raw || raw.length > 200) return null;
  let url: URL;
  try {
    url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (host !== "linkedin.com" && !host.endsWith(".linkedin.com")) return null;
  if (url.username || url.password || url.port) return null;
  if (url.pathname === "/" || url.pathname === "") return null;
  return `https://www.linkedin.com${url.pathname.replace(/\/+$/, "")}`;
}
