import { permanentRedirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** Legacy ticket URLs redirect to unified /hackathon/pass/[code]. */
export default async function HackathonTicketRedirectPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  permanentRedirect(`/hackathon/pass/${encodeURIComponent(code)}`);
}
