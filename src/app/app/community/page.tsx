import { Suspense } from "react";
import { CommunityHomeClient } from "@/components/community/community-home-client";

export const dynamic = "force-dynamic";

export default function CommunityPage() {
  return (
    <Suspense fallback={<div className="community-theme mx-auto max-w-lg sm:max-w-xl md:max-w-2xl py-16 text-center text-sm text-[#78716c]">…</div>}>
      <CommunityHomeClient />
    </Suspense>
  );
}
