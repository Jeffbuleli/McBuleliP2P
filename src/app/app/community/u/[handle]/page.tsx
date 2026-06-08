import { CommunityPublicProfileClient } from "@/components/community/community-public-profile-client";

export const dynamic = "force-dynamic";

export default async function CommunityPublicProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  return <CommunityPublicProfileClient handle={handle} />;
}
