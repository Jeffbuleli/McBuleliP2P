import { CommunityQuestionDetailClient } from "@/components/community/community-question-detail-client";

export const dynamic = "force-dynamic";

export default async function CommunityQuestionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CommunityQuestionDetailClient questionId={id} />;
}
