# Local Development

How to run EduSaaS on your machine: setup, the database (Drizzle and Drizzle Studio), the dev server, signing in as test users, Vercel, and fixes for common problems.

**Quick start** (once set up):

```bash
npm install
MOCK_AUTH=1 npm run dev
# open http://stpeterstechnical.localhost:3000/alumni
```

---

## 1. Prerequisites

| Tool | Why | Check |
|---|---|---|
| **Node.js 22** (via [nvm](https://github.com/nvm-sh/nvm) recommended) | Runs Next.js, Drizzle and the scripts | `node --version` |
| **npm** (comes with Node) | Installs packages, runs scripts | `npm --version` |
| **Git** and access to `gastonjarju/EduSaaS` | Code | `git --version` |
| **Vercel CLI** | Downloads the environment variables | `npx vercel --version` |
| **Vercel project access** (`edu-saa-s`) | Ask a teammate to invite you | — |
| **Chrome, Edge or Firefox** | Safari may not open `*.localhost` subdomains | — |
| GitHub CLI (`gh`), optional | PRs from the terminal | `gh --version` |

---

## 2. First-time setup

```bash
git clone git@github.com:gastonjarju/EduSaaS.git
cd EduSaaS
npm install

npx vercel login          # once per machine
npx vercel link           # choose the "edu-saa-s" project
npx vercel env pull .env.local
```

`vercel env pull` writes `.env.local` with the database connection strings, among other things. It's git-ignored: **never commit it or paste its values anywhere**, because it contains the database password.

The app needs these values:

| Variable | Used for |
|---|---|
| `POSTGRES_URL` | The app's database connection (pooled) |
| `POSTGRES_URL_NON_POOLING` | Migrations, seeding, Drizzle Studio (direct connection) |

Optional variables, set on the command line or in `.env.local`:

| Variable | Effect |
|---|---|
| `MOCK_AUTH=1` | Development sign-in: the yellow **Dev sign-in** bar and the fixed join code `1234`. **Never set it in Vercel.** |
| `ROOT_DOMAIN` | Root domain for school subdomains. Defaults to `edusaas.africa`; `localhost` always works locally. |
| `CUSTOM_DOMAIN_MAP` | Stub custom domains, e.g. `{"greenhill.test":"greenhill"}` (see §8). |

---

## 3. The database

The app uses **Postgres** through **Drizzle ORM**. The database itself is the **Supabase Postgres** from the Vercel project; nothing runs on your machine.

> ⚠️ **One database for everything.** Vercel's Development, Preview and Production environments currently share this same database. Anything you change locally is also what the deployed site sees. That's fine before launch, but production needs its own database before real schools use it.

### Commands

| Command | What it does |
|---|---|
| `npm run db:migrate` | Applies new migrations from `drizzle/` to the database. Run it after pulling changes that add migrations. |
| `npm run db:seed` | Resets the two demo schools (`stpeterstechnical`, `kristemambo`) with ~60 alumni each, class groups, posts, events and RSVPs. Safe to re-run. |
| `npm run db:studio` | Opens **Drizzle Studio** to browse and edit tables (below). |
| `npm run db:generate` | Creates a new migration after you change `db/schema/`. |
| `npm run db:push` | Pushes schema changes without a migration file. **Don't use it on the shared database;** use generate + migrate. |

### What `db:seed` does and doesn't reset

- **Reset:** the two demo schools and everything in them, plus users whose email ends in `@seed.edusaas.test`. Anyone's edits to that demo data are lost.
- **Not touched:** schools you add yourself (e.g. `stfaiths`), and accounts created through the join form. Those accounts can always sign back in or rejoin.

### Drizzle Studio: view and edit the data

```bash
npm run db:studio
```

Then open **https://local.drizzle.studio** in Chrome or Firefox (Brave and Safari may block it).

- It's a web page that talks to a small server Studio runs on your machine (`127.0.0.1:4983`). Opening `127.0.0.1:4983` directly shows **404 Not Found**; that's normal.
- **`EADDRINUSE … 4983`** means Studio is already running in another terminal. Use that one, or stop it (Ctrl+C there, or `lsof -i :4983` then `kill <pid>`) and start again.
- Edits save straight to the shared database (see the warning above).

Other tools work too, connected with `POSTGRES_URL_NON_POOLING` and SSL on:
- the **Supabase dashboard** (Table Editor, SQL Editor);
- desktop apps such as **TablePlus**, **Postico**, **DBeaver** or **pgAdmin**.

### Changing the schema

1. Edit the tables in `db/schema/` (`core.ts`, `website.ts`, `alumni.ts`).
2. `npm run db:generate -- --name short_description` creates `drizzle/00NN_short_description.sql`. Review it.
3. `npm run db:migrate` applies it.
4. Commit both the schema change and the files in `drizzle/`.

Don't add or alter columns by hand in Studio or Supabase, or the database drifts from the migrations.

---

## 4. Running the app

```bash
MOCK_AUTH=1 npm run dev
```

Each school is a subdomain of `localhost`:

| URL | What |
|---|---|
| http://localhost:3000 | Platform site (placeholder) |
| http://stpeterstechnical.localhost:3000 | St. Peter's Technical (The Gambia) |
| http://kristemambo.localhost:3000 | Kriste Mambo High School (Zimbabwe) |
| http://anything.localhost:3000 | "School not found" (404) unless a school has that slug |

Useful paths on a school:
- `/alumni` (directory)
- `/alumni/join`
- `/alumni/events`
- `/alumni/class/2015`
- `/admin` (admins only)

**Production build** (closer to what Vercel runs; use it to check performance or a bug that only shows in production):

```bash
npm run build
MOCK_AUTH=1 npm start            # or: npx next start -p 3100
```

**Another port:** `npm run dev -- -p 3100`. Use this if something else already uses port 3000.

### Signing in (development only)

With `MOCK_AUTH=1`, school pages show a yellow **Dev sign-in** bar. Pick a user → **Switch**. Each school has its own sign-in.

| User | School | Role |
|---|---|---|
| Mariama Touray | St. Peter's | School admin |
| Aisha Bojang | St. Peter's | Alumna, Class of 2015, verified |
| Musa Jallow | St. Peter's | Alumnus, Class of 2012 |
| Tafadzwa Makoni | Kriste Mambo | School admin |
| Liberty Mupotsa | Kriste Mambo | Alumnus, Class of 2017 |

You can also sign in or sign up through `/alumni/join`. **The code is always `1234`**, and no SMS or email is sent. Use made-up numbers, e.g. 🇬🇲 `771 5xxx`.

### Adding a school

In Drizzle Studio, open **schools** → **Add record**:
- **name**
- **slug**: lowercase letters, numbers and hyphens, e.g. `stfaiths`
- **country**: two letters, e.g. `ZW`

Save, then open `http://<slug>.localhost:3000`. Dates show in local time for `GM` and `ZW`; other countries fall back to UTC until a time zone is added in `lib/schools.ts`.

---

## 5. Checks before opening a PR

```bash
npm run lint
npm test          # Vitest unit tests
npm run build     # also type-checks
```

For changes to the alumni features, run the relevant parts of [alumniFeaturesSmokeTests.md](./alumniFeaturesSmokeTests.md).

---

## 6. Vercel

- **Project:** `edu-saa-s` (Vercel team `sonko9187-3313`). It's connected to the GitHub repo.
- **Previews:** every push to a PR branch builds a **preview deployment**. The PR shows a **Vercel** check with the link. Merging to `main` deploys **production**.
- **Environment variables:** managed in Vercel and pulled with `npx vercel env pull .env.local`. List them with `npx vercel env ls`.
- **Previews show only the platform page.** School sites are reached by subdomain (`<slug>.edusaas.africa`), and `*.vercel.app` preview URLs have none. A preview can still confirm that the build works.
- **There's no sign-in on Vercel** because `MOCK_AUTH` isn't set there (and mustn't be). Real sign-in (Twilio SMS codes) isn't built yet.

---

## 7. Troubleshooting

| Problem | Fix |
|---|---|
| `Another next dev server is already running` | One is already running for this folder. Use it, or stop it (`kill <PID>` from the message). |
| `EADDRINUSE` on port 3000 | Something else uses the port. Run `npm run dev -- -p 3100`. |
| `*.localhost` doesn't open | Use Chrome, Edge or Firefox; Safari may not resolve it. |
| No yellow Dev sign-in bar | Start with `MOCK_AUTH=1 npm run dev`. |
| "Signed out" after `db:seed` | Seeding gives users new IDs. Pick a user in the dev bar again. |
| `POSTGRES_URL… is not set` | Run `npx vercel env pull .env.local` (needs Vercel project access). |
| Drizzle Studio `EADDRINUSE 4983` | Studio is already running. Open https://local.drizzle.studio, or stop the old one. |
| `127.0.0.1:4983` shows 404 | Normal. Use https://local.drizzle.studio. |
| Errors about missing columns or tables | Run `npm run db:migrate`. |
| `npm install` fails resolving peers (`ERESOLVE`, `edgesOut`) | `npm install --legacy-peer-deps` for that one install, then a plain `npm install` should work again. |

---

## 8. Testing a custom domain (optional)

School custom domains (e.g. `greenhill.ac.zw`) are stubbed with an environment variable until Vercel Edge Config is wired up:

```bash
CUSTOM_DOMAIN_MAP='{"greenhill.test":"stpeterstechnical"}' MOCK_AUTH=1 npm run dev
sudo sh -c 'echo "127.0.0.1 greenhill.test" >> /etc/hosts'   # once
# open http://greenhill.test:3000
```

See [domainRoutingArchitecture.md](./domainRoutingArchitecture.md) for how school routing works.
