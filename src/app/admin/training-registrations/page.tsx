import { redirect } from "next/navigation";

export default function AdminTrainingRegistrationsRedirectPage() {
  redirect("/admin/academy?tab=leads");
}
