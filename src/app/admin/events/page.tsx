import { redirect } from "next/navigation";

export default function AdminEventsRedirectPage() {
  redirect("/admin/academy?tab=lives");
}
