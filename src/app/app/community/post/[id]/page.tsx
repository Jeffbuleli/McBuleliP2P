import { CommunityPostDetailClient } from "@/components/community/community-post-detail-client";

export const dynamic = "force-dynamic";

export default async function CommunityPostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CommunityPostDetailClient postId={id} />;
}
