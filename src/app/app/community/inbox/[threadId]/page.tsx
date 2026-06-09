import { CommunityChatClient } from "@/components/community/community-chat-client";

export const dynamic = "force-dynamic";

export default async function CommunityChatPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  return <CommunityChatClient threadId={threadId} />;
}
