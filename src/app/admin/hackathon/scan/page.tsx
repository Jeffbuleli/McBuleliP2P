import { redirect } from "next/navigation";

/** Legacy admin URL → télécommande porte (même accès que /hackathon/mc). */
export default function AdminHackathonScanPage() {
  redirect("/hackathon/scan");
}
