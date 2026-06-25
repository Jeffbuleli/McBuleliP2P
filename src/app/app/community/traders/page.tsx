import { Suspense } from "react";
import { CommunityTradersClient } from "@/components/community/community-traders-client";

export const dynamic = "force-dynamic";

export default function CommunityTradersPage() {
  return (
    <Suspense fallback={<p className="py-8 text-center text-sm text-[#78716c]">…</p>}>
      <CommunityTradersClient />
    </Suspense>
  );
}
