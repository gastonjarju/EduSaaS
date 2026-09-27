# Per-School Domain Routing Architecture

**EduSaaS Africa**
**Version:** 0.1 (Draft)
**Date:** August 2026
**Status:** Design proposal — not yet built

---

## 1. Context and scope

This document designs how EduSaaS serves each school on its own domain — a free `schoolname.edusaas.africa` subdomain by default, with an option to upgrade to a fully custom domain (`greenhill.ac.zw`, `pointlomahigh.com`) — while every school renders from the *same* shared Next.js template with per-school branding and content-block customization.

**Starting point:** this extends the multi-tenancy section already in `architectureDesign.md` (row-level isolation via `school_id`, Next.js middleware reading subdomain/domain → school config). This doc makes that concrete: the data model, the DNS/SSL flow, the request-routing path, and the customization model.

**Explicitly out of scope for this design** (per discussion): a district/network layer with its own homepage (à la `sandiegounified.org` listing member schools) and a `district_admin` role. Schools stay standalone entities. A school can still fully "break out" onto its own custom domain regardless of how it's branded — there's no parent-domain constraint. If school grouping/networks become a real need later, it can be added as a lightweight nullable tag on `School` without touching anything in this design (see §7).

---

## 2. Domain tiers

| Tier | Example | Who sets it up | Cost driver |
|---|---|---|---|
| Free subdomain | `canyonhills.edusaas.africa` | Automatic at school creation, from the school's slug | Covered by wildcard DNS + wildcard SSL — zero marginal setup |
| Premium custom domain | `pointlomahigh.com` or `greenhill.ac.zw` | Self-serve by school admin, platform automates DNS verification + SSL | One domain provisioning flow per school, but no manual work by EduSaaS |

A school always has a slug and therefore always has a working subdomain, even if it later adds a custom domain. The custom domain becomes canonical (subdomain 301-redirects to it) once verified, so nothing breaks if a custom domain lapses or DNS changes.

---

## 3. Data model changes

Add to the `School` model (or a `SchoolDomain` model if you want multiple historical/aliased domains per school later — start simple with fields directly on `School`):

```
School
- slug: str, unique, DNS-safe (lowercase, hyphens, no underscores)
- custom_domain: str, nullable, unique
- domain_status: enum [none, pending_dns, pending_ssl, active, failed]
- domain_verification_token: str, nullable   # TXT record value, if Vercel requires ownership proof
- domain_added_at: datetime, nullable
- domain_activated_at: datetime, nullable
```

`SchoolProfile` (already planned) carries the rendering side:

```
SchoolProfile
- logo_url, primary_color, secondary_color, hero_image_url   # branding
- content_blocks: JSONField                                   # ordered, toggleable sections
```

`content_blocks` example:

```json
[
  { "type": "hero", "enabled": true, "props": { "headline": "..." } },
  { "type": "news", "enabled": true, "order": 1 },
  { "type": "gallery", "enabled": false, "order": 2 },
  { "type": "events", "enabled": true, "order": 3 },
  { "type": "custom_page", "enabled": true, "slug": "careers", "order": 4 }
]
```

This gives you the "branding + content blocks" tier you specified: every school renders the same component library, but which sections appear, their order, and their copy/images are data-driven per school. No school gets bespoke code — if a school later needs that (a true `pointlomahigh.com`-style one-off), that's a deliberate future tier, not something this design needs to solve now.

---

## 4. DNS setup

**Wildcard subdomain (free tier) — one-time setup, not per school:**

- `*.edusaas.africa` → CNAME → your Vercel deployment (`cname.vercel-dns.com`), added once as a wildcard domain on the Vercel project.
- Every new school's subdomain works immediately at creation time with zero DNS work, because the wildcard already covers it.

**Custom domain (premium tier) — self-serve, per school:**

1. School admin enters their domain in the dashboard (e.g. `greenhill.ac.zw`).
2. Backend calls the Vercel Domains API to add the domain to the project. Vercel returns the DNS record the school needs to add — a CNAME to `cname.vercel-dns.com` for a subdomain-style custom domain, or an A record to Vercel's anycast IP for an apex/root domain (CNAME isn't valid at the root of a zone). If the domain is already claimed elsewhere, Vercel also returns a TXT verification token.
3. The dashboard shows the school admin exactly what record to add at their registrar, with a "check status" button.
4. A Celery periodic task (every few minutes) polls the Vercel API for that domain's verification + SSL-issuance status and updates `domain_status` accordingly (`pending_dns` → `pending_ssl` → `active`, or `failed` with the reason surfaced back to the admin).
5. Once `active`, Vercel has already auto-issued and will auto-renew the Let's Encrypt certificate — no work on your side beyond keeping the domain attached.
6. On activation, notify the school admin (WhatsApp/email, per your existing notification stack) and flip the subdomain to redirect to the custom domain.

This keeps DNS/SSL entirely inside Vercel, which is a natural fit since the frontend is already hosted there — no need for a separate certificate manager or Cloudflare for SaaS unless you later move the frontend off Vercel.

---

## 5. Request routing (tenant resolution)

Runs in Next.js Middleware, at the edge, before any page renders:

1. Read the `Host` header from the incoming request.
2. **If it ends in `.edusaas.africa`:** the subdomain segment *is* the school slug — no lookup needed, rewrite directly to the internal route (e.g. `/_sites/[slug]/...`).
3. **Otherwise (custom domain):** look up `custom_domain → slug` in a fast edge-readable store. Don't hit Django/Postgres per request — sync active custom-domain mappings into **Vercel Edge Config** (or a Redis-backed edge cache) whenever `domain_status` flips to `active`. Edge Config reads are sub-millisecond and designed for exactly this "domain → tenant" lookup pattern.
4. Rewrite the request to the shared dynamic route, passing the resolved slug. The page then fetches that school's `SchoolProfile` + `content_blocks` from the Django API (cached/ISR'd — no need to refetch on every request, revalidate on save).
5. Unresolvable host (not in Edge Config, not a valid subdomain) → a clear 404/"school not found" page, not a generic Vercel error.

The key property: subdomains resolve with **zero external lookups** (the slug is embedded in the hostname), and custom domains resolve with **one cached edge lookup** — both fast enough to run in middleware on every request without adding meaningful latency, which matters given the low-bandwidth-user priority already stated in your architecture doc.

---

## 6. Rendering the shared template

- One Next.js codebase, one component library (hero, news, gallery, events, contact, custom pages).
- Each component reads its config from that school's `content_blocks` entry — enabled/disabled, order, and props — and its colors/logo from `SchoolProfile` branding fields, likely injected as CSS variables at the layout root so Tailwind utility classes stay generic (`bg-primary` mapped to `--school-primary`).
- A school admin's "customize site" screen is really just a UI over the `content_blocks` JSON and branding fields — toggle sections, reorder via drag-and-drop, edit copy — no code changes, no redeploys, and no per-school branches in the codebase.
- `custom_page` blocks (like a "Careers" page) let a school add a page beyond the fixed template without needing full custom code — this is what covers most of the "this school looks different" cases you saw in the San Diego example, without actually forking the template per school.

---

## 7. Deliberately deferred / kept optional

- **District/network homepage:** not built. If you want it later, the cheapest hook to leave in place is a nullable `School.network` string/tag purely for internal filtering (e.g. "these 6 schools are the same mission group") — it costs nothing now and doesn't imply any routing or a shared domain.
- **District admin role:** not built. Roles stay `super_admin` / `school_admin` as already defined.
- **Full custom theme per school:** not built. If a specific premium school eventually needs a materially different look than content blocks can express, that's a distinct, larger feature (school-specific theme override or even a separate deployment) — worth scoping separately if/when a real customer asks for it, not something to design speculatively now.

---

## 8. Edge cases to handle explicitly

- **Apex domains** (`pointlomahigh.com`, no `www`): need an A record, not CNAME — the onboarding flow must detect apex vs subdomain-style custom domains and show the right instructions.
- **www vs apex:** when a school adds both, Vercel can auto-redirect one to the other — decide a canonical default (apex canonical, `www` redirects) and apply it consistently.
- **Domain ownership disputes:** rely on Vercel's TXT-based verification when a domain is already claimed on another Vercel project — surface Vercel's error message directly to the school admin rather than a generic failure.
- **Off-boarding:** when a school cancels or changes domains, remove it from the Vercel project's domain list *and* purge it from Edge Config — an orphaned mapping silently sends traffic to a stale school.
- **Slug collisions:** enforce slug uniqueness and a reserved-word list (`www`, `api`, `admin`, `app`) at school creation so no school can claim `admin.edusaas.africa`.
- **Propagation delay:** DNS changes can take minutes to hours; the "check status" polling should say so explicitly rather than implying something is broken.

---

## 9. Verification checklist

1. Creating a school automatically makes `schoolname.edusaas.africa` resolve and render that school's branded site, with no manual DNS step.
2. A school admin can add a custom domain, see clear DNS instructions (including the apex-vs-subdomain case), and watch status move from pending → active without engineering involvement.
3. Once active, the custom domain serves over HTTPS with a valid, auto-renewing certificate.
4. The old subdomain 301-redirects to the active custom domain.
5. A school admin can toggle/reorder content blocks and change branding, and see it reflected on their live site without a deploy.
6. Removing a school's custom domain (off-boarding or domain change) stops routing to it within one Edge Config sync cycle — no stale traffic.
7. An unrecognized hostname hitting the platform shows a proper "school not found" page, not a raw error.
