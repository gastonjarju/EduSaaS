# EduSaaS — Project Conventions

Guidance for developers and Claude Code working in this repository.

## Documentation File Naming (`docs/`)

All files in the `docs/` directory **must use camelCase** for their file names.

**Rules:**

- First letter lowercase; capitalize the first letter of each subsequent word.
- No spaces, underscores (`_`), hyphens (`-`), or `SCREAMING_SNAKE_CASE`.
- Keep names descriptive but concise; use the `.md` extension.
- When adding or renaming docs, follow this convention. When a doc doesn't yet match it, rename the file rather than creating a duplicate.

## Code Review Focus

Claude reviews every PR (`.github/workflows/claude-code-review.yml`). Prioritise these project-specific risks over style:

- **Tenant isolation:** every query on school data must filter on `school_id`. A page under `app/sites/[slug]` must look up its own school (not rely on the layout) and 404 unknown schools.
- **Authorization:** server actions and route handlers must re-check the signed-in user and their membership of the school; `proxy.ts` and page guards are not an auth boundary.
- **Alumni privacy:** profile fields follow the alumnus's `visibility` settings for other alumni (including in filters); phone numbers and emails never appear in page HTML.
- **Mock auth:** `MOCK_AUTH=1` is for development only; nothing may make it the production default.
- **Next.js 16:** middleware is `proxy.ts`; check `node_modules/next/dist/docs/` before assuming older Next.js APIs.
- **Schema changes:** a change under `db/schema/` needs a generated migration in `drizzle/`.
