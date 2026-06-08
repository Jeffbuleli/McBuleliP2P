import { notFound } from "next/navigation";
import { CommunityBlogDetailClient } from "@/components/community/community-blog-detail-client";
import { getBlogBySlug } from "@/lib/community/blog-service";
import { communityEnabled } from "@/lib/community/config";

export const dynamic = "force-dynamic";

export default async function CommunityBlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (!communityEnabled()) notFound();
  const { slug } = await params;
  const post = await getBlogBySlug(slug);
  if (!post) notFound();
  return <CommunityBlogDetailClient post={post} />;
}
