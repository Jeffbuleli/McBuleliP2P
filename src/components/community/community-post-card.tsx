"use client";

import { useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { CommunityAuthorHeader } from "@/components/community/community-author-header";
import { CommunityCommentThread } from "@/components/community/community-comment-thread";
import { CommunityPostTypeChip } from "@/components/community/community-post-type-chip";
import { communityImageVariant } from "@/lib/community/data-saver";
import type { CommentView, FeedPostView } from "@/lib/community/feed-service";

export function CommunityPostCard({
  post,
  onUpdate,
}: {
  post: FeedPostView;
  onUpdate: (patch: Partial<FeedPostView>) => void;
}) {
  const { locale } = useI18n();
  const fr = locale === "fr";
  const [commentOpen, setCommentOpen] = useState(false);
  const [comments, setComments] = useState<CommentView[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const img = post.media[0];
  const imgSrc = img ? communityImageVariant(img.variants, img.url) : null;

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const toggleLike = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/community/feed/${post.id}/like`, {
        method: "POST",
      });
      const j = await res.json();
      if (res.ok) {
        onUpdate({ likedByMe: j.liked, likeCount: j.likeCount });
        if (j.bpGranted > 0) flash(`+${j.bpGranted} BP`);
      }
    } finally {
      setBusy(false);
    }
  };

  const openComments = async () => {
    const next = !commentOpen;
    setCommentOpen(next);
    if (next && comments === null) {
      const res = await fetch(`/api/community/feed/${post.id}/comments`);
      const j = await res.json();
      setComments(j.comments ?? []);
    }
  };

  const sharePost = async () => {
    const url = `${window.location.origin}/app/community?post=${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "McBuleli",
          text: post.body.slice(0, 100),
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        flash(fr ? "Lien copié" : "Link copied");
      }
      const res = await fetch(`/api/community/feed/${post.id}/share`, {
        method: "POST",
      });
      const j = await res.json();
      if (res.ok) {
        onUpdate({ shareCount: j.shareCount });
        if (j.bpGranted > 0) flash(`+${j.bpGranted} BP`);
      }
    } catch {
      /* cancelled */
    }
  };

  const reportPost = async () => {
    await fetch("/api/community/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetType: "post",
        targetId: post.id,
        reason: "spam",
      }),
    });
    flash(fr ? "Signalé" : "Reported");
  };

  return (
    <article className="overflow-hidden rounded-2xl border border-[#f0f4f2] bg-white shadow-sm">
      <div className="px-4 pt-4">
        <div className="mb-3 flex items-start justify-between gap-2">
          <CommunityAuthorHeader
            author={post.author}
            publishedAt={post.publishedAt}
            fr={fr}
          />
          <CommunityPostTypeChip kind="news" fr={fr} />
        </div>

        <p className="max-w-prose text-[15px] leading-relaxed text-[#292524] whitespace-pre-wrap break-words">
          {post.body}
        </p>

        {imgSrc ? (
          <div className="mt-3 overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imgSrc}
              alt=""
              loading="lazy"
              className="max-h-72 w-full object-cover"
            />
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex items-center border-t border-[#f0f4f2] px-2">
        <button
          type="button"
          disabled={busy}
          onClick={toggleLike}
          className={`min-h-[48px] flex-1 rounded-lg text-xs font-semibold transition active:scale-95 ${
            post.likedByMe ? "text-[#305f33]" : "text-[#57534e]"
          }`}
        >
          {fr ? "J'aime" : "Like"}
          {post.likeCount > 0 ? ` · ${post.likeCount}` : ""}
        </button>
        <button
          type="button"
          onClick={() => void openComments()}
          className="min-h-[48px] flex-1 rounded-lg text-xs font-semibold text-[#57534e] transition active:scale-95"
        >
          {fr ? "Commenter" : "Comment"}
          {post.commentCount > 0 ? ` · ${post.commentCount}` : ""}
        </button>
        <button
          type="button"
          onClick={sharePost}
          className="min-h-[48px] flex-1 rounded-lg text-xs font-semibold text-[#57534e] transition active:scale-95"
        >
          {fr ? "Partager" : "Share"}
          {post.shareCount > 0 ? ` · ${post.shareCount}` : ""}
        </button>
      </div>

      {commentOpen && comments !== null ? (
        <CommunityCommentThread
          postId={post.id}
          fr={fr}
          initialComments={comments}
          onCountChange={() =>
            onUpdate({ commentCount: post.commentCount + 1 })
          }
        />
      ) : null}

      <div className="flex justify-end px-4 pb-2">
        <button
          type="button"
          onClick={reportPost}
          className="text-[10px] text-[#a8a29e] active:scale-95"
        >
          {fr ? "Signaler" : "Report"}
        </button>
      </div>

      {toast ? (
        <div className="bg-[#305f33] px-4 py-1.5 text-center text-xs font-bold text-white">
          {toast}
        </div>
      ) : null}
    </article>
  );
}
