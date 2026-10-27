"use server";

import { cookies } from "next/headers";
import { mockAuthEnabled, SESSION_COOKIE, startSession } from "./session";

export async function signInAs(formData: FormData) {
  if (!mockAuthEnabled()) throw new Error("Mock auth is disabled");
  const userId = formData.get("userId");
  if (typeof userId !== "string" || !userId) return;
  await startSession(userId);
}

export async function signOut() {
  (await cookies()).delete(SESSION_COOKIE);
}
