// Which navigation item is "current" for a path. No React or Next imports,
// so it can be unit-tested.

export type NavItem = { href: string; label: string };

/**
 * The visible path ("/alumni/events"). Behind the proxy's rewrite,
 * usePathname() can return the internal "/sites/<slug>/…" path, so strip it
 * to get the same value on the server and in the browser.
 */
function visiblePath(pathname: string): string {
  return pathname.replace(/^\/sites\/[^/]+(?=\/|$)/, "") || "/";
}

/** Which nav item a path belongs to: the longest matching href wins. */
export function activeHref(pathname: string, items: NavItem[]): string | null {
  const path = visiblePath(pathname);
  const matches = items.filter((i) =>
    i.href === "/" ? path === "/" : path === i.href || path.startsWith(`${i.href}/`)
  );
  return matches.sort((a, b) => b.href.length - a.href.length)[0]?.href ?? null;
}
