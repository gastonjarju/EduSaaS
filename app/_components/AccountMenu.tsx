"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { Avatar } from "./alumni";

export type AccountMenuProps =
  | { kind: "signedOut" }
  | {
      kind: "member";
      name: string;
      photo: string | null;
      profileId: string | null; // null for admins (no alumni profile)
      graduationYear: number | null;
      isAdmin: boolean;
    };

// Header account menu: your photo/initials and first name, opening links to
// your profile, the editor and your class (or the admin console). Built on
// <details>, so it opens without JavaScript; JS adds closing on outside click,
// Escape and navigation.
export default function AccountMenu(props: AccountMenuProps) {
  const ref = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    ref.current?.removeAttribute("open"); // close after navigating
  }, [pathname]);

  useEffect(() => {
    const close = (e: Event) => {
      const el = ref.current;
      if (!el?.open) return;
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !el.contains(e.target as Node)) {
        el.removeAttribute("open");
        if (e instanceof KeyboardEvent) el.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("click", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", close);
    };
  }, []);

  if (props.kind === "signedOut") {
    return (
      <Link href="/alumni/join" className="flex h-10 items-center rounded-full bg-ink px-4 text-sm font-semibold text-white">
        Sign in
      </Link>
    );
  }

  const first = props.name.split(" ")[0];
  const item = "flex h-12 items-center px-4 hover:bg-accent-soft hover:text-accent-ink";
  return (
    <details ref={ref} className="relative">
      <summary
        aria-label={`Account menu for ${props.name}`}
        className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-full py-1 pl-1 pr-3 hover:bg-accent-soft [&::-webkit-details-marker]:hidden"
      >
        <Avatar name={props.name} size="sm" photo={props.photo} />
        <span className="max-w-24 truncate text-sm font-semibold">{first}</span>
        <span aria-hidden className="text-xs text-ink-soft">
          ▾
        </span>
      </summary>
      <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-line bg-white py-1 text-ink shadow-lg">
        <p className="truncate px-4 py-2 text-xs text-ink-soft">Signed in as {props.name}</p>
        {props.profileId && (
          <>
            <Link href={`/alumni/profile/${props.profileId}`} className={item}>
              My profile
            </Link>
            <Link href="/alumni/profile/edit" className={item}>
              Edit profile
            </Link>
            {props.graduationYear && (
              <Link href={`/alumni/class/${props.graduationYear}`} className={item}>
                My class · {props.graduationYear}
              </Link>
            )}
          </>
        )}
        {props.isAdmin && (
          <Link href="/admin" className={item}>
            Admin console
          </Link>
        )}
      </div>
    </details>
  );
}
