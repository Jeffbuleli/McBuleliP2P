"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { CommunityPostCard } from "@/components/community/community-post-card";
import type { FeedPostView } from "@/lib/community/feed-service";

export function CommunityPostDetailClient({ postId }: { postId: string }) {
  const { locale } = useI18n();
  const fr = locale === "fr";
  const [post, setPost] = useState<FeedPostView | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/community/feed/${postId}`)
      .then((r) => r.json())
      .then((d: { post?: FeedPostView }) => {
        if (!d.post) setNotFound(true);
        else setPost(d.post);
      })
      .catch(() => setNotFound(true));
  }, [postId]);

  if (notFound) {
    return (
      <div className="community-theme mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-sm text-[#57534e]">
          {fr ? "Publication introuvable" : "Post not found"}
        </p>
        <Link href="/app/community" className="mt-4 inline-block text-sm text-[#305f33]">
          ← {fr ? "Communauté" : "Community"}
        </Link>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="community-theme mx-auto max-w-lg px-4 py-16 text-center text-sm text-[#78716c]">
        …
      </div>
    );
  }

  return (
    <div className="community-theme mx-auto w-full max-w-lg px-4 pb-28 pt-3">
      <Link href="/app/community" className="text-sm font-semibold text-[#305f33]">
        ← {fr ? "Communauté" : "Community"}
      </Link>
      <div className="mt-3">
        <CommunityPostCard
          post={post}
          defaultCommentsOpen
          linkToDetail={false}
          trackView
          onUpdate={(patch) => setPost((p) => (p ? { ...p, ...patch } : p))}
        />
      </div>
    </div>
  );
}
