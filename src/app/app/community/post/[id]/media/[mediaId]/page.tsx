import { CommunityMediaDetailClient } from "@/components/community/community-media-detail-client";

export const dynamic = "force-dynamic";

export default async function CommunityMediaDetailPage({
  params,
}: {
  params: Promise<{ id: string; mediaId: string }>;
}) {
  const { id, mediaId } = await params;
  return <CommunityMediaDetailClient postId={id} mediaId={mediaId} />;
}
