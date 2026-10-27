"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { activeHref, type NavItem } from "@/lib/nav";

// Nav links with the current section highlighted (prototype's active pill).
export default function NavLinks({ items, className = "" }: { items: NavItem[]; className?: string }) {
  const active = activeHref(usePathname(), items);
  return (
    <>
      {items.map((item) => {
        const current = item.href === active;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={current ? "page" : undefined}
            className={`flex h-10 items-center rounded-full px-3 ${
              current
                ? "bg-accent-soft font-bold text-accent-ink"
                : "text-ink-soft hover:bg-accent-soft hover:text-accent-ink"
            } ${className}`}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
