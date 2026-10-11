import type { Metadata } from "next";
import SchoolNotFound from "@/app/_components/SchoolNotFound";

export const metadata: Metadata = {
  title: "School not found",
  robots: { index: false },
};

// Rewrite target for hosts the proxy cannot resolve to a school.
export default function SchoolNotFoundPage() {
  return <SchoolNotFound />;
}
