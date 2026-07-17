import { Suspense } from "react";
import { CommunityTagClient } from "@/components/community/community-tag-client";

export const dynamic = "force-dynamic";

export default async function CommunityTagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  return (
    <Suspense fallback={null}>
      <CommunityTagClient tag={decodeURIComponent(tag)} />
    </Suspense>
  );
}
