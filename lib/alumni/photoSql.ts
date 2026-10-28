import { sql } from "drizzle-orm";
import { alumniProfiles, users } from "@/db/schema";

/** users.avatar_url, or NULL when the profile hides its photo (SQL twin of privacy.ts). */
export const visiblePhotoPath = sql<string | null>`case when coalesce((${alumniProfiles.visibility}->>'photo')::boolean, true) then ${users.avatarUrl} end`;
