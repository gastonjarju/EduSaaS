# EduSaaS

A multi-tenant platform for African schools, piloting in Zimbabwe and The Gambia. Every school gets a branded website at `schoolname.edusaas.africa` (or its own domain) and an alumni network.

**V1:** school websites (templated site + admin dashboard) and alumni relations (directory, class-year groups, events, news). Student registry, attendance, fees and online applications are planned for V2.

**Stack:** Next.js full-stack (App Router) + Tailwind, Drizzle ORM, Neon Postgres, Twilio (WhatsApp/SMS), Cloudflare R2, hosted on Vercel.

## Docs

- [architectureDesign.md](./architectureDesign.md) — stack, infrastructure, V1/V2 scope
- [docs/designDocAlumni.md](./docs/designDocAlumni.md) — alumni survey findings and feature spec
- [docs/edusaasSchemas.md](./docs/edusaasSchemas.md) — canonical database schema
- [docs/domainRoutingArchitecture.md](./docs/domainRoutingArchitecture.md) — subdomains, custom domains, tenant resolution

## Running locally

```bash
npm install
npm run dev
```

- http://localhost:3000 — platform site
- http://anyschool.localhost:3000 — a school site (the subdomain is the school slug)

### Demo data and mock sign-in

`.env.local` needs `POSTGRES_URL` and `POSTGRES_URL_NON_POOLING` (from `vercel env pull`).

```bash
npm run db:migrate   # apply migrations
npm run db:seed      # demo schools stpeterstechnical + kristemambo, ~60 alumni each (safe to re-run)
MOCK_AUTH=1 npm run dev
```

With `MOCK_AUTH=1`, school sites show a "Dev sign-in" bar to switch between seeded alumni and the school admin, e.g. http://stpeterstechnical.localhost:3000. Never set it in production.

To test a custom domain, set `CUSTOM_DOMAIN_MAP='{"greenhill.test":"greenhill"}'` and point `greenhill.test` at `127.0.0.1` in `/etc/hosts`.
