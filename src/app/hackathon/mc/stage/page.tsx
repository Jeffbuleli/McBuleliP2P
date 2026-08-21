import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Scène · McBuleli AI MC",
  robots: { index: false, follow: false },
};

/** Single room projector = /hackathon/live (mode MC). */
export default function HackathonMcStagePage() {
  redirect("/hackathon/live");
}
