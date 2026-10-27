import { redirect } from "next/navigation";

// /admin opens the first admin section.
export default function AdminHome() {
  redirect("/admin/events");
}
