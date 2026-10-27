# EduSaaS Architecture Design

## Context
EduSaaS is an Africa-focused SaaS platform for schools, launching in Zimbabwe and The Gambia. The V1 pivot focuses on two modules: **school websites** (informational, templated, subdomain-based) and **alumni relations** (directory, profiles, events, donations). Attendance, payments, and student registry are deferred to V2.

---

## Stack Overview

| Layer | Choice | Reasoning |
|---|---|---|
| App | Next.js full-stack (App Router) + Tailwind CSS | One TypeScript codebase for UI and server logic; SSR for SEO on public school pages |
| Server logic | Server Components (reads), Server Actions (mutations), Route Handlers (webhooks, integrations) | No separate backend service to deploy or keep in sync |
| ORM | Drizzle ORM | Typed SQL-first schema in TypeScript, lightweight enough for serverless |
| Database | Neon Postgres | Serverless Postgres that fits Vercel; multi-tenancy via row-level isolation |
| Messaging | Twilio (WhatsApp + SMS) | OTP and notifications on the channels users actually use |
| Architecture | Monolith first | Solo/small team — avoid over-engineering at MVP, split later if needed |

---

## 1. App — Next.js full-stack
- Next.js 16, App Router, TypeScript throughout
- Tailwind CSS + shadcn/ui for component library
- Server-side rendering for school public pages (SEO critical — parents search for schools)
- Data reads in Server Components; mutations in Server Actions; Route Handlers for webhooks (Twilio, payment providers)
- PWA manifest + service worker for the alumni portal (see `docs/designDocAlumni.md` §6); full offline sync deferred to V2

## 2. Database — Neon Postgres + Drizzle
- Schema defined in Drizzle (TypeScript); the canonical table design is `docs/edusaasSchemas.md`
- **Multi-tenancy**: Row-level isolation — every tenant-scoped table has a `school_id` foreign key
- All schools share one database, one schema
- Tenant scoping enforced through Drizzle query helper wrappers that always apply `school_id`, with Postgres Row-Level Security as defense-in-depth
- Neon's serverless driver / connection pooling for serverless functions

## 3. Authentication & Roles
- Phone-based sign-in: OTP sent via Twilio (WhatsApp primary, SMS fallback), then a session
- OTP rate limiting: max 5 requests per phone number per hour
- Role system:
  - `super_admin` — platform owner
  - `school_admin` — manages their school
  - `teacher` — V2 (attendance)
  - `parent` — V2
  - `student` — V2
  - `alumni` — registers on alumni portal, manages own profile
- Platform administration UI must be built in the app (no framework-provided admin)

## 4. Multi-tenancy & Subdomains
- **Free tier**: `schoolname.edusaas.africa` (wildcard DNS)
- **Premium tier**: custom domain (e.g. `greenhill.ac.zw`) — school points their DNS to Vercel
- School-specific branding (logo, colors, hero image) and content blocks stored per school
- Next.js Proxy (`proxy.ts`, the Next.js 16 name for middleware) maps the host to a school slug and rewrites to the shared school-site route — see `docs/domainRoutingArchitecture.md`

## 5. File Storage — Cloudflare R2
- S3-compatible, cheaper than AWS S3 (no egress fees)
- Used for: school logos, alumni profile photos, event images, prospectus PDFs
- Images served via Cloudflare CDN — critical for low-bandwidth users
- Uploads via an S3-compatible client from Server Actions / Route Handlers (e.g. presigned URLs)

## 6. Hosting & Infrastructure
- App: **Vercel** (Next.js native, auto-deploy, preview deployments per PR)
- Database: **Neon** Postgres
- CDN/Storage: **Cloudflare R2**
- Build with environment variables from day one — no hardcoded URLs, easy migration

## 7. Payments

Not settled yet — the two design docs name different providers (see Open Questions).

- Payment abstraction layer in the app so adding providers later requires minimal changes
- Provider callbacks handled by Route Handlers

## 8. Notifications
- **WhatsApp via Twilio** — primary channel (highest open rates in both markets)
- **SMS via Twilio** — fallback for OTP
- **Email** via **Resend** — transactional (signup, alumni welcome, event reminders)
- In-app notifications as primary for non-urgent updates; WhatsApp opt-in (see `docs/designDocAlumni.md` §8)

## 9. AI / ML
- **V1**: None
- **V2**: Claude API for content generation (school news, event copy), alumni engagement scoring
- **V3**: Dropout prediction, cross-school benchmarking

## 10. DevOps & CI/CD
- Version control: **GitHub** (`gastonjarju/EduSaaS`)
- CI/CD: **GitHub Actions** for lint/tests; Vercel deploys on push to `main` and builds a preview per PR
- Error tracking: **Sentry** (free tier covers MVP)
- Environments: `dev` (local) → `preview` (Vercel preview deployments) → `prod`

---

## V1 Feature Scope

### School Websites
- Templated school site (hero, about, news, gallery, contact)
- School admin dashboard to edit content
- Announcement/news system
- Event calendar
- Online enquiry form (not full application — V2)
- SEO metadata per school

### Alumni Relations
- Alumni self-registration and profile (name, graduation year, class, current role, location)
- Alumni directory (searchable by year, name, location)
- Class-year groups
- Events (create, RSVP)
- Donations
- School admin can manage and verify alumni

---

## V2 Scope (deferred)
- Student registry + unique IDs
- Attendance tracking (with offline sync)
- Fee management
- Online school applications
- Parent portal
- Stripe payments (diaspora)
- AI content generation

---

## Open Questions
1. **Payment providers:** this doc previously listed Paynow (Zimbabwe) and Africa's Talking (The Gambia); `docs/designDocAlumni.md` lists Wave (Gambia), EcoCash/Innbucks (Zimbabwe) and Stripe (diaspora). Pick one set.
2. **Auth library:** hand-rolled sessions vs a library (e.g. Auth.js or Better Auth) on top of Twilio OTP.
3. **Background jobs:** notification fan-out, event reminders and custom-domain status polling need scheduled/queued work (e.g. Vercel Cron, a queue such as QStash or Inngest). Not chosen.
4. **Hosting at scale:** whether to stay on Vercel + Neon or move closer to users (e.g. AWS af-south-1, Cape Town) once traffic justifies it.

---

## Verification Checklist
1. `schoolname.edusaas.africa` resolves and renders the correct school's branded site
2. An alumni can register with phone OTP, complete their profile, and appear in the directory
3. A school admin can log in, post news, and create an event
4. A WhatsApp notification fires (via Twilio) when an alumni registers
5. A test-mode payment completes for a donation on the alumni page
6. GitHub Actions runs lint/tests on PRs, and Vercel deploys on push to `main`
7. Sentry captures a test error and it appears in the dashboard
