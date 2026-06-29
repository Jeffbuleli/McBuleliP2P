"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";
import {
  CommunityActionBar,
  CommunityEngagementSummary,
} from "@/components/community/community-action-bar";
import { CommunityAuthorHeader } from "@/components/community/community-author-header";
import { CommunityCommentThread } from "@/components/community/community-comment-thread";
import { CommunityFormationCard } from "@/components/community/community-formation-card";
import { CommunityBotTemplateCard } from "@/components/community/community-bot-template-card";
import { CommunityExpandableText } from "@/components/community/community-expandable-text";
import { IconGlobe, IconMore } from "@/components/community/community-icons";
import { CommunityPostMedia } from "@/components/community/community-post-media";
import { CommunityPostTypeChip } from "@/components/community/community-post-type-chip";
import type { CommunityContentKind } from "@/lib/community/post-types";
import { isFeedComposerKind } from "@/lib/community/composer-config";
import type { CommentView, FeedPostView } from "@/lib/community/feed-service";
import { telegramShareUrl } from "@/lib/community/link-embed";
import { postDisplayText } from "@/lib/community/link-embed";
import { communityPostSharePath } from "@/lib/community/share-url";
import { usePostImpression } from "@/hooks/use-post-impression";
import {
  COMMUNITY_BODY_TEXT,
  COMMUNITY_CARD,
  COMMUNITY_CARD_ACCENT,
  COMMUNITY_OWNER_MENU,
} from "@/lib/community/community-ui";

export function CommunityPostCard({
  post,
  onUpdate,
  onRemove,
  defaultCommentsOpen = false,
  linkToDetail = true,
  trackView = false,
  trackImpression,
}: {
  post: FeedPostView;
  onUpdate: (patch: Partial<FeedPostView>) => void;
  onRemove?: () => void;
  defaultCommentsOpen?: boolean;
  linkToDetail?: boolean;
  /** Compte une lecture unique (page détail uniquement). */
  trackView?: boolean;
  /** Compte une impression feed (visible ≥50 % pendant 1 s). */
  trackImpression?: boolean;
}) {
  const { locale } = useI18n();
  const fr = locale === "fr";
  const shouldTrackImpression = trackImpression ?? (!trackView && linkToDetail);
  const impressionRef = usePostImpression(
    post.id,
    shouldTrackImpression,
    (viewCount) => onUpdate({ viewCount }),
  );
  const [commentOpen, setCommentOpen] = useState(defaultCommentsOpen);
  const [comments, setComments] = useState<CommentView[] | null>(null);
  const [commentsLoading, setCommentsLoading] = useState(defaultCommentsOpen);
  const viewedRef = useRef(false);

  useEffect(() => {
    if (!defaultCommentsOpen) return;
    fetch(`/api/community/feed/${post.id}/comments`)
      .then((r) => r.json())
      .then((j) => setComments(j.comments ?? []))
      .finally(() => setCommentsLoading(false));
  }, [defaultCommentsOpen, post.id]);

  useEffect(() => {
    if (!trackView || viewedRef.current) return;
    viewedRef.current = true;
    fetch(`/api/community/feed/${post.id}/view`, { method: "POST" })
      .then((r) => r.json())
      .then((j: { viewCount?: number }) => {
        if (typeof j.viewCount === "number") {
          onUpdate({ viewCount: j.viewCount });
        }
      })
      .catch(() => {});
  }, [post.id, onUpdate, trackView]);

  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [viewerUserId, setViewerUserId] = useState<string | null>(null);
  const [ownerOpen, setOwnerOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d: { user?: { id: string } | null }) => {
        if (d.user?.id) setViewerUserId(d.user.id);
      })
      .catch(() => {});
  }, []);

  const isOwner = viewerUserId === post.author.userId;

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

  const shareUrl = () =>
    `${window.location.origin}${communityPostSharePath(post.id)}`;

  const sharePost = async () => {
    const url = shareUrl();
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

  const shareTelegram = () => {
    const url = telegramShareUrl({
      url: shareUrl(),
      text: post.body.slice(0, 120),
    });
    window.open(url, "_blank", "noopener,noreferrer");
    void fetch(`/api/community/feed/${post.id}/share`, { method: "POST" })
      .then((r) => r.json())
      .then((j) => {
        if (j.shareCount) onUpdate({ shareCount: j.shareCount });
      })
      .catch(() => {});
  };

  const ownerAction = async (action: "hide" | "unhide" | "delete") => {
    setBusy(true);
    try {
      const res = await fetch(`/api/community/feed/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) return;
      if (action === "delete") {
        flash(fr ? "Publication supprimée" : "Post deleted");
        onRemove?.();
      } else {
        onUpdate({ status: action === "hide" ? "hidden" : "published" });
        flash(
          action === "hide"
            ? fr
              ? "Masquée du public"
              : "Hidden from public"
            : fr
              ? "Visible à nouveau"
              : "Visible again",
        );
      }
      setOwnerOpen(false);
    } finally {
      setBusy(false);
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

  const detailHref = `/app/community/post/${post.id}`;

  const header = (
    <div className="mb-3 flex items-start justify-between gap-2">
      {linkToDetail ? (
        <Link href={detailHref} className="min-w-0 flex-1">
          <CommunityAuthorHeader
            author={post.author}
            publishedAt={post.publishedAt}
            fr={fr}
          />
        </Link>
      ) : (
        <CommunityAuthorHeader
          author={post.author}
          publishedAt={post.publishedAt}
          fr={fr}
        />
      )}
      <div className="flex shrink-0 flex-col items-end gap-1">
        <CommunityPostTypeChip
          kind={
            post.contentKind === "formation"
              ? "formation"
              : ((isFeedComposerKind(post.contentKind)
                  ? post.contentKind
                  : "news") as CommunityContentKind)
          }
          fr={fr}
        />
        <span className="inline-flex items-center gap-0.5 text-[10px] text-stone-500">
          <IconGlobe size={11} />
          {post.status === "hidden"
            ? fr
              ? "Masqué"
              : "Hidden"
            : fr
              ? "Public"
              : "Public"}
        </span>
        {isOwner ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setOwnerOpen((v) => !v)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-stone-400 hover:bg-white/5"
              aria-label={fr ? "Options" : "Options"}
            >
              <IconMore size={18} />
            </button>
            {ownerOpen ? (
              <div className={COMMUNITY_OWNER_MENU}>
                {post.status === "hidden" ? (
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-left text-xs font-semibold text-emerald-400"
                    onClick={() => void ownerAction("unhide")}
                  >
                    {fr ? "Afficher" : "Unhide"}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-left text-xs font-semibold text-stone-300"
                    onClick={() => void ownerAction("hide")}
                  >
                    {fr ? "Masquer" : "Hide"}
                  </button>
                )}
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-xs font-semibold text-red-400"
                  onClick={() => void ownerAction("delete")}
                >
                  {fr ? "Supprimer" : "Delete"}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );

  const displayBody = postDisplayText(post.body, {
    hasMedia: post.media.length > 0,
  });

  const formationBlock =
    post.formationMeta ? (
      <div className="mb-3">
        <CommunityFormationCard
          meta={post.formationMeta}
          fr={fr}
          isLive={post.formationMeta.eventStatus === "LIVE"}
        />
      </div>
    ) : null;

  const botTemplateBlock =
    post.botTemplateMeta ? (
      <CommunityBotTemplateCard meta={post.botTemplateMeta} fr={fr} />
    ) : null;

  const textBlock =
    !post.formationMeta && !post.botTemplateMeta && displayBody.length > 0 ? (
      <div className="block">
        <CommunityExpandableText
          text={displayBody}
          fr={fr}
          withMentions
          className={COMMUNITY_BODY_TEXT}
        />
      </div>
    ) : null;

  return (
    <article
      ref={impressionRef}
      className={COMMUNITY_CARD}
    >
      <span className={COMMUNITY_CARD_ACCENT} aria-hidden />
      <div className="px-4 pt-4">
        {header}
        {formationBlock}
        {botTemplateBlock}
        {textBlock}
        <CommunityPostMedia
          media={post.media}
          postType={post.postType}
          body={post.body}
          fr={fr}
          feedInline
        />
      </div>

      <CommunityEngagementSummary
        likeCount={post.likeCount}
        commentCount={post.commentCount}
        shareCount={post.shareCount}
        viewCount={post.viewCount ?? 0}
        fr={fr}
        alwaysShowViews
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
        onTelegramShare={shareTelegram}
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
          className="text-[10px] text-stone-500 active:scale-95"
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
