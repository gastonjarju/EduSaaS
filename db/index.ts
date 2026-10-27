import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// POSTGRES_URL is Supabase's pooled (PgBouncer, transaction mode) connection —
// what the app runtime should use. `prepare: false` is required in transaction
// mode, which doesn't support prepared statements.
const client = postgres(process.env.POSTGRES_URL!, { prepare: false });

export const db = drizzle(client, { schema });
