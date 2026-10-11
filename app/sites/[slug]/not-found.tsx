import SchoolNotFound from "@/app/_components/SchoolNotFound";

// Shown when a page under a school site calls notFound(), e.g. a well-formed
// subdomain that no school owns.
export default function NotFound() {
  return <SchoolNotFound />;
}
