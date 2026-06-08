import { CommunityDiscussionDetailClient } from "@/components/community/community-discussion-detail-client";

export const dynamic = "force-dynamic";

export default async function CommunityDiscussionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CommunityDiscussionDetailClient discussionId={id} />;
}
