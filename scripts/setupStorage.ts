// Creates (or updates) the Supabase Storage bucket for profile photos.
// Safe to re-run.
//
//   npm run storage:setup
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

const BUCKET = {
  id: "profile-photos",
  name: "profile-photos",
  public: true, // anyone with a photo's link can load it; names are random
  file_size_limit: 1024 * 1024, // stored photos are ~400px WebP, far below this
  allowed_mime_types: ["image/webp"],
};

async function main() {
  const url = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL)?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (.env.local)");
  const headers = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };

  const existing = await fetch(`${url}/storage/v1/bucket/${BUCKET.id}`, { headers });
  const res = existing.ok
    ? await fetch(`${url}/storage/v1/bucket/${BUCKET.id}`, { method: "PUT", headers, body: JSON.stringify(BUCKET) })
    : await fetch(`${url}/storage/v1/bucket`, { method: "POST", headers, body: JSON.stringify(BUCKET) });
  if (!res.ok) throw new Error(`Bucket setup failed (${res.status}): ${await res.text()}`);
  console.log(`${existing.ok ? "Updated" : "Created"} public bucket "${BUCKET.id}"`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
