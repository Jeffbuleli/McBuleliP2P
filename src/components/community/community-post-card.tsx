"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";
import {
  CommunityActionBar,
  CommunityBoostBadge,
  CommunityTipTotals,
  CommunityViewsCount,
} from "@/components/community/community-action-bar";
import { CommunityAuthorHeader } from "@/components/community/community-author-header";
import { CommunityCommentThread } from "@/components/community/community-comment-thread";
import { CommunityFormationCard } from "@/components/community/community-formation-card";
import { CommunityBotTemplateCard } from "@/components/community/community-bot-template-card";
import { CommunityExpandableText } from "@/components/community/community-expandable-text";
import { IconMore, IconRepost } from "@/components/community/community-icons";
import { CommunityPostMedia } from "@/components/community/community-post-media";
import { CommunityPostTypeChip } from "@/components/community/community-post-type-chip";
import { CommunityShareSheet } from "@/components/community/community-share-sheet";
import type { CommunityContentKind } from "@/lib/community/post-types";
import { isFeedComposerKind } from "@/lib/community/composer-config";
import { isPostBoosted } from "@/lib/community/boost-utils";
import { COMMUNITY_POST_BOOST } from "@/lib/reward-points-config";
import { utilityTagLabel, isUtilityTag } from "@/lib/community/utility-tags";
import { UtilityTagIcon } from "@/components/community/utility-tag-icons";
import { CommunityTipBpBar } from "@/components/community/community-tip-bp-bar";
import type { CommentView, FeedPostView } from "@/lib/community/feed-service";
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
  trackView?: boolean;
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
  const [reportOpen, setReportOpen] = useState(false);

  const [boostConfirm, setBoostConfirm] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

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
    setBusy(true);
    setBoostConfirm(false);
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
          boost_active_limit: fr ? "Limite boost actif" : "Active boost limit",
          boost_daily_limit: fr ? "Limite / jour" : "Daily limit",
          boost_not_owner: fr ? "Auteur seul" : "Author only",
        };
        flash(map[j.error ?? ""] ?? (fr ? "Échec" : "Failed"));
        return;
      }
      onUpdate({ boostedUntil: j.boostedUntil ?? null });
      flash(`-${j.costBp ?? COMMUNITY_POST_BOOST.costBp} BP`);
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
    `${window.location.origin}${communityPostSharePath(post.repostOfId ?? post.id)}`;

  const targetPostId = post.repostOfId ?? post.id;

  const recordExternalShare = async () => {
    const res = await fetch(`/api/community/feed/${targetPostId}/share`, {
      method: "POST",
    });
    const j = await res.json();
    if (res.ok) {
      onUpdate({ shareCount: j.shareCount });
      if (j.bpGranted > 0) flash(`+${j.bpGranted} BP`);
    }
  };

  const copyLink = async () => {
    setShareOpen(false);
    try {
      await navigator.clipboard.writeText(shareUrl());
      flash(fr ? "Lien copié" : "Link copied");
      await recordExternalShare();
    } catch {
      flash(fr ? "Échec" : "Failed");
    }
  };

  const externalShare = async () => {
    setShareOpen(false);
    const url = shareUrl();
    try {
      if (navigator.share) {
        await navigator.share({
          title: "McBuleli",
          text: (post.repostOf?.body ?? post.body).slice(0, 100),
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        flash(fr ? "Lien copié" : "Link copied");
      }
      await recordExternalShare();
    } catch {
      /* cancelled */
    }
  };

  const toggleRepost = async () => {
    setBusy(true);
    try {
      if (post.repostedByMe) {
        const res = await fetch(`/api/community/feed/${targetPostId}/repost`, {
          method: "DELETE",
        });
        const j = await res.json();
        if (res.ok) {
          onUpdate({
            repostedByMe: false,
            shareCount: j.shareCount ?? Math.max(0, post.shareCount - 1),
          });
          flash(fr ? "Republication annulée" : "Repost removed");
        }
      } else {
        const res = await fetch(`/api/community/feed/${targetPostId}/repost`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        const j = await res.json();
        if (res.ok) {
          onUpdate({
            repostedByMe: true,
            shareCount: j.shareCount ?? post.shareCount + 1,
          });
          if (j.bpGranted > 0) flash(`+${j.bpGranted} BP`);
          else flash(fr ? "Republié" : "Reposted");
        }
      }
      setShareOpen(false);
    } finally {
      setBusy(false);
    }
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
        flash(fr ? "Supprimé" : "Deleted");
        onRemove?.();
      } else {
        onUpdate({ status: action === "hide" ? "hidden" : "published" });
        flash(action === "hide" ? (fr ? "Masqué" : "Hidden") : (fr ? "Visible" : "Visible"));
      }
      setOwnerOpen(false);
    } finally {
      setBusy(false);
    }
  };

  const reportPost = async (reason: string) => {
    setReportOpen(false);
    await fetch("/api/community/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetType: "post",
        targetId: post.id,
        reason,
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
      <div className="flex shrink-0 items-start gap-1">
        <div className="flex flex-col items-end gap-1">
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
          <div className="flex items-center gap-1">
            {post.utilityTag &&
            isUtilityTag(post.utilityTag) &&
            post.utilityTag !== "create" ? (
              <span
                title={utilityTagLabel(post.utilityTag, fr)}
                className="inline-flex items-center rounded-full bg-[#eef6f0] p-1 text-[#305f33]"
              >
                <UtilityTagIcon tag={post.utilityTag} className="h-3 w-3" />
              </span>
            ) : null}
            {boosted ? <CommunityBoostBadge fr={fr} /> : null}
            {post.status === "hidden" ? (
              <span className="rounded-full bg-stone-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-stone-500">
                {fr ? "Masqué" : "Hidden"}
              </span>
            ) : null}
          </div>
        </div>
        {isOwner ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setOwnerOpen((v) => !v)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[#57534e] hover:bg-[#f0f2f5]"
              aria-label="Options"
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
                    onClick={() => {
                      setOwnerOpen(false);
                      setBoostConfirm(true);
                    }}
                  >
                    Boost · {COMMUNITY_POST_BOOST.costBp} BP
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

  const formationBlock = post.formationMeta ? (
    <div className="mb-3">
      <CommunityFormationCard
        meta={post.formationMeta}
        fr={fr}
        isLive={post.formationMeta.eventStatus === "LIVE"}
      />
    </div>
  ) : null;

  const botTemplateBlock = post.botTemplateMeta ? (
    <CommunityBotTemplateCard meta={post.botTemplateMeta} fr={fr} />
  ) : null;

  const textBlock =
    !post.formationMeta &&
    !post.botTemplateMeta &&
    displayBody.trim().length > 0 ? (
      <div className="block">
        <CommunityExpandableText
          text={displayBody}
          fr={fr}
          withMentions
          className={COMMUNITY_BODY_TEXT}
        />
      </div>
    ) : null;

  const original = post.repostOf;
  const isRepostCard = !!post.repostOfId;

  return (
    <article ref={impressionRef} className={COMMUNITY_CARD}>
      <span className={COMMUNITY_CARD_ACCENT} aria-hidden />
      <div className="px-4 pt-4">
        {isRepostCard ? (
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold text-[#78716c]">
            <IconRepost size={14} />
            <span className="truncate">
              {post.author.displayName}{" "}
              {fr ? "a republié" : "reposted"}
            </span>
          </p>
        ) : null}
        {header}
        {formationBlock}
        {botTemplateBlock}
        {textBlock}
        {isRepostCard ? (
          original ? (
            <div className="mb-3 overflow-hidden rounded-2xl border border-[#dce8e0] bg-[#fafcfb]">
              <div className="border-b border-[#eef3f0] px-3 py-2.5">
                <Link
                  href={`/app/community/u/${original.author.handle}`}
                  className="block"
                >
                  <CommunityAuthorHeader
                    author={original.author}
                    publishedAt={original.publishedAt}
                    fr={fr}
                  />
                </Link>
              </div>
              <Link
                href={`/app/community/post/${original.id}`}
                className="block px-3 py-2.5"
              >
                {original.body.trim() ? (
                  <CommunityExpandableText
                    text={postDisplayText(original.body, {
                      hasMedia: original.media.length > 0,
                    })}
                    fr={fr}
                    withMentions
                    className="text-[13px] leading-snug text-[#44403c]"
                  />
                ) : null}
                <CommunityPostMedia
                  media={original.media}
                  postType={original.postType}
                  body={original.body}
                  fr={fr}
                  postId={original.id}
                  feedInline
                />
              </Link>
            </div>
          ) : (
            <div className="mb-3 rounded-2xl border border-dashed border-[#d6d3d1] bg-[#fafaf9] px-3 py-4 text-center text-[12px] text-[#78716c]">
              {fr
                ? "Publication d'origine indisponible"
                : "Original post unavailable"}
            </div>
          )
        ) : (
          <CommunityPostMedia
            media={post.media}
            postType={post.postType}
            body={post.body}
            fr={fr}
            postId={post.id}
            feedInline
          />
        )}
      </div>

      {boostConfirm ? (
        <div className="mx-4 mb-2 rounded-2xl border border-amber-200 bg-amber-50/90 px-3 py-3">
          <p className="text-sm font-bold text-amber-950">
            {fr ? "Booster cette publication ?" : "Boost this post?"}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-amber-900/80">
            {fr
              ? `${COMMUNITY_POST_BOOST.hours}h en tête du feed · ${COMMUNITY_POST_BOOST.costBp} BP. Visible avec le badge Boosté.`
              : `${COMMUNITY_POST_BOOST.hours}h at the top of the feed · ${COMMUNITY_POST_BOOST.costBp} BP. Shows a Boosted badge.`}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => setBoostConfirm(false)}
              className="min-h-[36px] flex-1 rounded-xl border border-amber-200 bg-white text-xs font-bold text-amber-900"
            >
              {fr ? "Annuler" : "Cancel"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void boostPost()}
              className="min-h-[36px] flex-1 rounded-xl bg-amber-800 text-xs font-bold text-white disabled:opacity-50"
            >
              {busy
                ? "…"
                : fr
                  ? `Confirmer · ${COMMUNITY_POST_BOOST.costBp} BP`
                  : `Confirm · ${COMMUNITY_POST_BOOST.costBp} BP`}
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-2 border-t border-[#edf2ef]">
        <CommunityTipTotals
          tipBpTotal={post.tipBpTotal ?? 0}
          tipMcbTotal={post.tipMcbTotal ?? 0}
          fr={fr}
        />
        <CommunityViewsCount viewCount={post.viewCount ?? 0} />
      </div>

      <CommunityActionBar
        fr={fr}
        likeCount={post.likeCount}
        commentCount={post.commentCount}
        shareCount={post.shareCount}
        likedByMe={post.likedByMe}
        busy={busy}
        onLike={() => void toggleLike()}
        onComment={() => void openComments()}
        onShare={() => setShareOpen(true)}
      />

      <CommunityShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        fr={fr}
        repostedByMe={!!post.repostedByMe}
        busy={busy}
        onRepost={() => void toggleRepost()}
        onCopyLink={() => void copyLink()}
        onExternalShare={() => void externalShare()}
      />

      {viewerUserId && !isOwner ? (
        <div className="flex justify-center px-4 pb-2 pt-1">
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
                  tipBpTotal?: number;
                };
                if (!res.ok) {
                  const map: Record<string, string> = {
                    tip_insufficient_bp: fr ? "BP insuffisants" : "Not enough BP",
                    tip_daily_limit: fr ? "Limite / jour" : "Daily limit",
                    tip_self: fr ? "Impossible" : "Not allowed",
                  };
                  flash(map[j.error ?? ""] ?? (fr ? "Échec" : "Failed"));
                  return;
                }
                if (typeof j.tipBpTotal === "number") {
                  onUpdate({ tipBpTotal: j.tipBpTotal });
                } else {
                  onUpdate({ tipBpTotal: (post.tipBpTotal ?? 0) + amount });
                }
                flash(`-${amount} BP`);
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
          onCountChange={(delta) =>
            onUpdate({ commentCount: Math.max(0, post.commentCount + delta) })
          }
        />
      ) : null}

      <div className="relative flex justify-end px-4 pb-2">
        <button
          type="button"
          onClick={() => setReportOpen((v) => !v)}
          className="text-[10px] text-[#a8a29e] active:scale-95"
        >
          {fr ? "Signaler" : "Report"}
        </button>
        {reportOpen ? (
          <div className="absolute bottom-8 right-4 z-10 min-w-[140px] rounded-xl border border-[#f0f4f2] bg-white py-1 shadow-lg">
            {(
              [
                ["spam", "Spam"],
                ["scam", fr ? "Arnaque" : "Scam"],
                ["abuse", fr ? "Abus" : "Abuse"],
                ["off_topic", fr ? "Hors sujet" : "Off-topic"],
                ["other", fr ? "Autre" : "Other"],
              ] as const
            ).map(([code, label]) => (
              <button
                key={code}
                type="button"
                className="block w-full px-3 py-2 text-left text-xs font-semibold text-[#57534e]"
                onClick={() => void reportPost(code)}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {toast ? (
        <div className="bg-[#305f33] px-4 py-1.5 text-center text-xs font-bold text-white">
          {toast}
        </div>
      ) : null}
    </article>
  );
}
