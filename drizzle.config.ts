import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

export default defineConfig({
  schema: "./db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Supabase's direct (non-pooled) connection — required for migrations;
    // the pooled POSTGRES_URL doesn't support the DDL drizzle-kit runs.
    url: process.env.POSTGRES_URL_NON_POOLING!,
  },
});
