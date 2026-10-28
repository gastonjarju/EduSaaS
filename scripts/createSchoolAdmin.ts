// Creates a school admin for an existing school. Safe to re-run: an
// existing admin with the same email/phone at that school is reported, not
// duplicated.
//
//   npm run admin:create -- --school stfaiths --name "St Faiths Admin" --email admin@stfaiths.test
//   npm run admin:create -- --school stfaiths --name "Jane Moyo" --phone +263771234567
//
// Sign in as them with the dev bar (MOCK_AUTH=1), or on /alumni/join with
// that email/phone and code 1234.
import { config } from "dotenv";
import { eq, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { parseArgs } from "node:util";
import * as schema from "../db/schema";
import { normalizeEmail, normalizePhone } from "../lib/alumni/contact";

config({ path: ".env.local", quiet: true });

async function main() {
  const { values } = parseArgs({
    options: { school: { type: "string" }, name: { type: "string" }, email: { type: "string" }, phone: { type: "string" } },
  });
  if (!values.school || !values.name || (!values.email && !values.phone)) {
    throw new Error('Usage: npm run admin:create -- --school <slug> --name "<name>" (--email <email> | --phone <+number>)');
  }

  const client = postgres(process.env.POSTGRES_URL_NON_POOLING!, { max: 1, onnotice: () => {} });
  const db = drizzle(client, { schema });
  try {
    const [school] = await db.select().from(schema.schools).where(eq(schema.schools.slug, values.school)).limit(1);
    if (!school) throw new Error(`No school with slug "${values.school}"`);

    const email = values.email ? normalizeEmail(values.email) : null;
    const phone = values.phone ? normalizePhone(values.phone, school.country) : null;
    if (values.email && !email) throw new Error(`Invalid email: ${values.email}`);
    if (values.phone && !phone) throw new Error(`Invalid phone: ${values.phone} (use +<country code><number>)`);

    const matches = [email && eq(schema.users.email, email), phone && eq(schema.users.phone, phone)].filter(Boolean);
    const [existing] = await db.select().from(schema.users).where(or(...(matches as never[]))).limit(1);
    if (existing) {
      if (existing.role === "school_admin" && existing.schoolId === school.id) {
        console.log(`Already an admin of ${school.name}: ${existing.name}`);
        return;
      }
      throw new Error(`That ${email ? "email" : "phone"} already belongs to another account (${existing.name}, ${existing.role})`);
    }

    const [admin] = await db
      .insert(schema.users)
      .values({ name: values.name.trim(), email, phone, role: "school_admin", schoolId: school.id })
      .returning();
    console.log(`Created admin "${admin.name}" for ${school.name} (${email ?? phone})`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
