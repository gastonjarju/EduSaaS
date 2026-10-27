# EduSaaS

A multi-tenant platform for African schools, piloting in Zimbabwe and The Gambia. Every school gets a branded website at `schoolname.edusaas.africa` (or its own domain) and an alumni network.

**V1:** school websites (templated site + admin dashboard) and alumni relations (directory, class-year groups, events, news). Student registry, attendance, fees and online applications are planned for V2.

**Stack:** Next.js full-stack (App Router) + Tailwind, Drizzle ORM, Neon Postgres, Twilio (WhatsApp/SMS), Cloudflare R2, hosted on Vercel.

## Docs

- [architectureDesign.md](./architectureDesign.md) — stack, infrastructure, V1/V2 scope
- [docs/designDocAlumni.md](./docs/designDocAlumni.md) — alumni survey findings and feature spec
- [docs/edusaasSchemas.md](./docs/edusaasSchemas.md) — canonical database schema
- [docs/domainRoutingArchitecture.md](./docs/domainRoutingArchitecture.md) — subdomains, custom domains, tenant resolution
- [docs/localDevelopment.md](./docs/localDevelopment.md) — running the app, database and Drizzle Studio, Vercel
- [docs/alumniFeaturesSmokeTests.md](./docs/alumniFeaturesSmokeTests.md) — end-to-end checks for the alumni features

## Running locally

Full guide: **[docs/localDevelopment.md](./docs/localDevelopment.md)**. It covers setup, Vercel environment variables, the database and Drizzle Studio, test users, Vercel previews, and troubleshooting.

```bash
npm install
npx vercel env pull .env.local   # first time; needs Vercel project access
MOCK_AUTH=1 npm run dev
```

Then open http://stpeterstechnical.localhost:3000/alumni and sign in with the yellow **Dev sign-in** bar. Join codes are always `1234` in this mode.
