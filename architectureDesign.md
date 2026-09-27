# EduSaaS Architecture Design

## Context
EduSaaS is an Africa-focused SaaS platform for schools, launching in Zimbabwe and The Gambia. The V1 pivot focuses on two modules: **school websites** (informational, templated, subdomain-based) and **alumni relations** (directory, profiles, events, donations). Attendance, payments, and student registry are deferred to V2.

---

## Stack Overview

| Layer | Choice | Reasoning |
|---|---|---|
| Frontend | Next.js + Tailwind CSS | SSR for SEO on public school pages, best ecosystem for learning |
| Backend | Python + Django + DRF | Developer knows Python, Django's built-in admin saves time, strong ORM |
| Database | PostgreSQL | Multi-tenancy via row-level isolation, relational data model |
| API style | REST (Django REST Framework) | Simpler than GraphQL for this use case, DRF is battle-tested |
| Architecture | Monolith first | Solo/small team — avoid over-engineering at MVP, split later if needed |

---

## 1. Frontend — Next.js + Tailwind CSS
- Server-side rendering for school public pages (SEO critical — parents search for schools)
- App Router (Next.js 14+)
- Tailwind CSS + shadcn/ui for component library
- TypeScript throughout
- PWA not required for V1 (offline deferred to V2)

## 2. Backend — Python + Django + DRF
- Django 5.x with Django REST Framework
- Modular Django apps: `schools`, `alumni`, `websites`, `accounts`
- JWT authentication via **SimpleJWT** — no third-party auth vendor (avoids per-user billing at scale)
- Django's built-in admin for platform management
- Background tasks via **Celery + Redis** (WhatsApp notifications, email queuing)

## 3. Database — PostgreSQL
- **Multi-tenancy**: Row-level isolation — every table has a `school_id` foreign key
- All schools share one database, one schema
- Django ORM enforces tenant scoping via custom model managers
- Connection pooling via **PgBouncer** when moving to AWS

## 4. Authentication & Roles
- Django built-in auth + **SimpleJWT** for API tokens
- Role system:
  - `super_admin` — platform owner
  - `school_admin` — manages their school
  - `teacher` — V2 (attendance)
  - `parent` — V2
  - `student` — V2
  - `alumni` — registers on alumni portal, manages own profile

## 5. Multi-tenancy & Subdomains
- **Free tier**: `schoolname.edusaas.africa` (wildcard DNS)
- **Premium tier**: custom domain (e.g. `greenhill.ac.zw`) — school points their DNS to our servers
- School-specific branding (logo, colors, hero image) stored in `SchoolProfile` model
- Next.js middleware reads subdomain/domain → fetches school config → renders branded site

## 6. File Storage — Cloudflare R2
- S3-compatible, cheaper than AWS S3 (no egress fees)
- Used for: school logos, alumni profile photos, event images, prospectus PDFs
- Images served via Cloudflare CDN — critical for low-bandwidth users
- Django storage backend: `django-storages` with S3-compatible config pointing to R2

## 7. Hosting & Infrastructure

### MVP
- Frontend: **Vercel** (Next.js native, auto-deploy)
- Backend + DB: **Railway** (Django + managed PostgreSQL)
- CDN/Storage: **Cloudflare R2**

### At Scale
- Migrate backend to **AWS af-south-1 (Cape Town)** — lowest latency for sub-Saharan Africa
- RDS PostgreSQL, ECS for Django, CloudFront CDN
- Build with environment variables from day one — no hardcoded URLs, easy migration

## 8. Payments

| Provider | Market | Phase |
|---|---|---|
| Paynow | Zimbabwe (EcoCash, OneMoney, card) | MVP |
| Africa's Talking | The Gambia (mobile money) | MVP |
| Stripe | Diaspora parents (international cards) | Phase 2 |

- Payment abstraction layer in Django so adding Stripe later requires minimal changes

## 9. Notifications
- **WhatsApp Business API** — primary channel (highest open rates in both markets)
  - Via Meta's Cloud API (free to start, pay per conversation)
  - Queued via Celery for reliability
- **Email** via **Resend** — transactional (signup, alumni welcome, event reminders)
- SMS — deferred to V2

## 10. AI / ML
- **V1**: None
- **V2**: Claude API for content generation (school news, event copy), alumni engagement scoring
- **V3**: Dropout prediction, cross-school benchmarking

## 11. DevOps & CI/CD
- Version control: **GitHub** (African-Tech-Bros org)
- CI/CD: **GitHub Actions** — run tests + deploy on push to `main`
- Error tracking: **Sentry** (free tier covers MVP)
- Environments: `dev` (local) → `staging` (Railway preview) → `prod`

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
- Donations (via Paynow/Africa's Talking)
- School admin can manage and verify alumni

---

## V2 Scope (deferred)
- Student registry + unique IDs
- Attendance tracking (with offline sync)
- Fee management
- Online school applications
- Parent portal
- SMS fallback notifications
- Stripe payments (diaspora)
- AI content generation

---

## Verification Checklist
1. `schoolname.edusaas.africa` resolves and renders the correct school's branded site
2. An alumni can register, complete their profile, and appear in the directory
3. A school admin can log in, post news, and create an event
4. A WhatsApp notification fires when an alumni registers (via Celery worker)
5. A payment (Paynow test mode) completes for a donation on the alumni page
6. GitHub Actions runs tests and deploys to Railway on push to `main`
7. Sentry captures a test error and it appears in the dashboard
