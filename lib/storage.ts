// Profile photos in Supabase Storage, via its REST API (no SDK needed).
// Server-only: uses the service-role key, which must never reach the browser.
// The bucket is public (anyone with a photo's link can load it); file names
// are random. Create it once with `npm run storage:setup`.

export const PHOTO_BUCKET = "profile-photos";

function config() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (.env.local)");
  return { url: url.replace(/\/$/, ""), key };
}

const headers = (key: string) => ({ apikey: key, Authorization: `Bearer ${key}` });

export async function uploadPhoto(path: string, webp: Buffer): Promise<void> {
  const { url, key } = config();
  const res = await fetch(`${url}/storage/v1/object/${PHOTO_BUCKET}/${path}`, {
    method: "POST",
    // Short cache: after a photo is removed or replaced, its old link can still
    // be served from the CDN until this expires
    headers: { ...headers(key), "Content-Type": "image/webp", "Cache-Control": "max-age=3600", "x-upsert": "false" },
    body: new Uint8Array(webp),
  });
  if (!res.ok) throw new Error(`Photo upload failed (${res.status}): ${await res.text()}`);
}

/** Deletes photos; missing files are ignored. */
export async function deletePhotos(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const { url, key } = config();
  const res = await fetch(`${url}/storage/v1/object/${PHOTO_BUCKET}`, {
    method: "DELETE",
    headers: { ...headers(key), "Content-Type": "application/json" },
    body: JSON.stringify({ prefixes: paths }),
  });
  if (!res.ok) throw new Error(`Photo delete failed (${res.status}): ${await res.text()}`);
}

/** Public URL for a stored photo path, or null. */
export function photoUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const base = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
  return base ? `${base}/storage/v1/object/public/${PHOTO_BUCKET}/${path}` : null;
}
