"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";
import {
  CommunityActionBar,
  CommunityEngagementSummary,
} from "@/components/community/community-action-bar";
import { CommunityAuthorHeader } from "@/components/community/community-author-header";
import { CommunityCommentThread } from "@/components/community/community-comment-thread";
import { CommunityExpandableText } from "@/components/community/community-expandable-text";
import { IconGlobe } from "@/components/community/community-icons";
import { CommunityPostMedia } from "@/components/community/community-post-media";
import { CommunityPostTypeChip } from "@/components/community/community-post-type-chip";
import type { CommentView, FeedPostView } from "@/lib/community/feed-service";
import { communityPostSharePath } from "@/lib/community/share-url";

export function CommunityPostCard({
  post,
  onUpdate,
  defaultCommentsOpen = false,
  linkToDetail = true,
}: {
  post: FeedPostView;
  onUpdate: (patch: Partial<FeedPostView>) => void;
  defaultCommentsOpen?: boolean;
  linkToDetail?: boolean;
}) {
  const { locale } = useI18n();
  const fr = locale === "fr";
  const [commentOpen, setCommentOpen] = useState(defaultCommentsOpen);
  const [comments, setComments] = useState<CommentView[] | null>(null);
  const [commentsLoading, setCommentsLoading] = useState(defaultCommentsOpen);

  useEffect(() => {
    if (!defaultCommentsOpen) return;
    fetch(`/api/community/feed/${post.id}/comments`)
      .then((r) => r.json())
      .then((j) => setComments(j.comments ?? []))
      .finally(() => setCommentsLoading(false));
  }, [defaultCommentsOpen, post.id]);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

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
      setCommentsLoading(true);
      const res = await fetch(`/api/community/feed/${post.id}/comments`);
      const j = await res.json();
      setComments(j.comments ?? []);
      setCommentsLoading(false);
    }
  };

  const sharePost = async () => {
    const url = `${window.location.origin}${communityPostSharePath(post.id)}`;
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

  const header = (
    <div className="mb-3 flex items-start justify-between gap-2">
      <CommunityAuthorHeader
        author={post.author}
        publishedAt={post.publishedAt}
        fr={fr}
      />
      <div className="flex shrink-0 flex-col items-end gap-1">
        <CommunityPostTypeChip kind="news" fr={fr} />
        <span className="inline-flex items-center gap-0.5 text-[10px] text-[#a8a29e]">
          <IconGlobe size={11} />
          {fr ? "Public" : "Public"}
        </span>
      </div>
    </div>
  );

  const bodyBlock = (
    <>
      <CommunityExpandableText
        text={post.body}
        fr={fr}
        className="text-[15px] leading-relaxed text-[#292524]"
      />
      <CommunityPostMedia media={post.media} postType={post.postType} fr={fr} />
    </>
  );

  return (
    <article className="overflow-hidden rounded-2xl border border-[#f0f4f2] bg-white shadow-[0_2px_12px_rgba(12,10,9,0.04)]">
      <div className="px-4 pt-4">
        {linkToDetail ? (
          <Link href={`/app/community/post/${post.id}`} className="block">
            {header}
            {bodyBlock}
          </Link>
        ) : (
          <>
            {header}
            {bodyBlock}
          </>
        )}
      </div>

      <CommunityEngagementSummary
        likeCount={post.likeCount}
        commentCount={post.commentCount}
        fr={fr}
      />

      <CommunityActionBar
        fr={fr}
        likeCount={post.likeCount}
        commentCount={post.commentCount}
        shareCount={post.shareCount}
        likedByMe={post.likedByMe}
        busy={busy}
        onLike={() => void toggleLike()}
        onComment={() => void openComments()}
        onShare={() => void sharePost()}
      />

      {commentOpen ? (
        <CommunityCommentThread
          postId={post.id}
          fr={fr}
          initialComments={comments ?? []}
          loading={commentsLoading}
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
