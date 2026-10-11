import { NextResponse, type NextRequest } from "next/server";
import { resolveTenant } from "@/lib/tenant/resolveTenant";

// Routes that only exist as rewrite targets and must not be reachable by URL.
const INTERNAL_PATH = /^\/(sites|school-not-found)(\/|$)/;

// Tenant resolution (docs/domainRoutingArchitecture.md §5): map the Host header
// to a school and rewrite to the shared /sites/[slug] route.
export async function proxy(request: NextRequest) {
  const tenant = await resolveTenant(request.headers.get("host"));
  const url = request.nextUrl.clone();

  if (tenant.kind === "school") {
    const path = url.pathname === "/" ? "" : url.pathname;
    url.pathname = `/sites/${tenant.slug}${path}`;
    return NextResponse.rewrite(url);
  }

  if (tenant.kind === "notFound") {
    url.pathname = "/school-not-found";
    return NextResponse.rewrite(url, { status: 404 });
  }

  if (INTERNAL_PATH.test(url.pathname)) {
    url.pathname = "/404";
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  // Skip Next.js internals and static files (anything with a file extension).
  matcher: ["/((?!_next/|.*\\..*).*)"],
};
