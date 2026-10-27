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

To test a custom domain, set `CUSTOM_DOMAIN_MAP='{"greenhill.test":"greenhill"}'` and point `greenhill.test` at `127.0.0.1` in `/etc/hosts`.
