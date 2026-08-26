import type { Metadata } from "next";
import { KinshasaConfirmClient } from "@/components/hackathon/kinshasa-confirm-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Confirmation place Kinshasa | McBuleli Hackathon",
  robots: { index: false, follow: false },
};

export default async function KinshasaConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const sp = await searchParams;
  return <KinshasaConfirmClient token={sp.token?.trim() || ""} />;
}
