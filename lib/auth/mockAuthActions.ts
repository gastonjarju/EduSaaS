"use server";

import { cookies } from "next/headers";
import { mockAuthEnabled, SESSION_COOKIE } from "./session";

export async function signInAs(formData: FormData) {
  if (!mockAuthEnabled()) throw new Error("Mock auth is disabled");
  const userId = formData.get("userId");
  if (typeof userId !== "string" || !userId) return;
  (await cookies()).set(SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}

export async function signOut() {
  (await cookies()).delete(SESSION_COOKIE);
}
