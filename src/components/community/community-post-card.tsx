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
import { isPostBoosted } from "@/lib/community/boost-service";
import { COMMUNITY_POST_BOOST } from "@/lib/reward-points-config";
import { utilityTagLabel, isUtilityTag } from "@/lib/community/utility-tags";
import { UtilityTagIcon } from "@/components/community/utility-tag-icons";
import { CommunityTipBpBar } from "@/components/community/community-tip-bp-bar";
import type { CommentView, FeedPostView } from "@/lib/community/feed-service";
import { telegramShareUrl } from "@/lib/community/link-embed";
import { postDisplayText } from "@/lib/community/link-embed";
import { communityPostSharePath } from "@/lib/community/share-url";
import { usePostImpression } from "@/hooks/use-post-impression";
import {
  COMMUNITY_BODY_TEXT,
  COMMUNITY_CARD,
  COMMUNITY_CARD_ACCENT,
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
  const boosted = isPostBoosted(post.boostedUntil);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const boostPost = async () => {
    if (!isOwner || boosted) return;
    const ok = window.confirm(
      fr
        ? `Booster ce post ${COMMUNITY_POST_BOOST.hours}h pour ${COMMUNITY_POST_BOOST.costBp} BP ?`
        : `Boost this post ${COMMUNITY_POST_BOOST.hours}h for ${COMMUNITY_POST_BOOST.costBp} BP?`,
    );
    if (!ok) return;
    setBusy(true);
    setOwnerOpen(false);
    try {
      const res = await fetch(`/api/community/feed/${post.id}/boost`, {
        method: "POST",
      });
      const j = (await res.json().catch(() => ({}))) as {
        error?: string;
        boostedUntil?: string;
        costBp?: number;
      };
      if (!res.ok) {
        const map: Record<string, string> = {
          boost_insufficient_bp: fr ? "BP insuffisants" : "Not enough BP",
          boost_already_active: fr ? "Déjà boosté" : "Already boosted",
          boost_active_limit: fr
            ? "Un boost actif max"
            : "Max one active boost",
          boost_daily_limit: fr
            ? "Limite quotidienne atteinte"
            : "Daily boost limit reached",
          boost_not_owner: fr ? "Réservé à l'auteur" : "Author only",
        };
        flash(map[j.error ?? ""] ?? (fr ? "Échec boost" : "Boost failed"));
        return;
      }
      onUpdate({ boostedUntil: j.boostedUntil ?? null });
      flash(
        fr
          ? `Boosté (-${j.costBp ?? COMMUNITY_POST_BOOST.costBp} BP)`
          : `Boosted (-${j.costBp ?? COMMUNITY_POST_BOOST.costBp} BP)`,
      );
    } finally {
      setBusy(false);
    }
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
        {post.utilityTag && isUtilityTag(post.utilityTag) ? (
          <span
            title={utilityTagLabel(post.utilityTag, fr)}
            className="inline-flex items-center gap-1 rounded-full bg-[#eef6f0] px-1.5 py-0.5 text-[#305f33]"
          >
            <UtilityTagIcon tag={post.utilityTag} className="h-3 w-3" />
          </span>
        ) : null}
        {boosted ? (
          <span
            title={fr ? "Boosté" : "Boosted"}
            className="inline-flex items-center rounded-full bg-amber-50 px-1.5 py-0.5 text-amber-800 ring-1 ring-amber-200"
          >
            <svg
              className="h-3 w-3"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M13 2L4 14h7l-1 8 10-14h-7l1-6z" />
            </svg>
          </span>
        ) : null}
        <span className="inline-flex items-center gap-0.5 text-[10px] text-[#a8a29e]">
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
              className="flex h-8 w-8 items-center justify-center rounded-full text-[#57534e] hover:bg-[#f0f2f5]"
              aria-label={fr ? "Options" : "Options"}
            >
              <IconMore size={18} />
            </button>
            {ownerOpen ? (
              <div className="absolute right-0 z-10 mt-1 min-w-[140px] rounded-xl border border-[#f0f4f2] bg-white py-1 shadow-lg">
                {post.status === "hidden" ? (
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-left text-xs font-semibold text-[#305f33]"
                    onClick={() => void ownerAction("unhide")}
                  >
                    {fr ? "Afficher" : "Unhide"}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-left text-xs font-semibold text-[#57534e]"
                    onClick={() => void ownerAction("hide")}
                  >
                    {fr ? "Masquer" : "Hide"}
                  </button>
                )}
                {!boosted ? (
                  <button
                    type="button"
                    disabled={busy}
                    className="block w-full px-3 py-2 text-left text-xs font-semibold text-amber-800"
                    onClick={() => void boostPost()}
                  >
                    {fr
                      ? `Booster ${COMMUNITY_POST_BOOST.hours}h (${COMMUNITY_POST_BOOST.costBp} BP)`
                      : `Boost ${COMMUNITY_POST_BOOST.hours}h (${COMMUNITY_POST_BOOST.costBp} BP)`}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-xs font-semibold text-red-600"
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

      {viewerUserId && !isOwner ? (
        <div className="flex justify-center px-4 pb-2">
          <CommunityTipBpBar
            fr={fr}
            disabled={busy}
            onTip={async (amount) => {
              setBusy(true);
              try {
                const res = await fetch(`/api/community/feed/${post.id}/tip`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ amount }),
                });
                const j = (await res.json().catch(() => ({}))) as {
                  error?: string;
                };
                if (!res.ok) {
                  const map: Record<string, string> = {
                    tip_insufficient_bp: fr ? "BP insuffisants" : "Not enough BP",
                    tip_daily_limit: fr ? "Limite tip/jour" : "Daily tip limit",
                    tip_self: fr ? "Impossible" : "Not allowed",
                  };
                  flash(map[j.error ?? ""] ?? (fr ? "Échec tip" : "Tip failed"));
                  return;
                }
                flash(fr ? `Tip ${amount} BP` : `Tipped ${amount} BP`);
              } finally {
                setBusy(false);
              }
            }}
          />
        </div>
      ) : null}

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
