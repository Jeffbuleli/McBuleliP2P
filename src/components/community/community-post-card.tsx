"use client";

import { useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { communityImageVariant, isDataSaverEnabled } from "@/lib/community/data-saver";
import type { FeedPostView } from "@/lib/community/feed-service";

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
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<
    { id: string; body: string; author: { displayName: string } }[]
  >([]);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const img = post.media[0];
  const imgSrc = img
    ? communityImageVariant(img.variants, img.url)
    : null;

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
        onUpdate({
          likedByMe: j.liked,
          likeCount: j.likeCount,
        });
        if (j.bpGranted > 0) {
          flash(`+${j.bpGranted} BP`);
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const loadComments = async () => {
    const res = await fetch(`/api/community/feed/${post.id}/comments`);
    const j = await res.json();
    setComments(j.comments ?? []);
  };

  const openComments = async () => {
    const next = !commentOpen;
    setCommentOpen(next);
    if (next && comments.length === 0) await loadComments();
  };

  const submitComment = async () => {
    if (commentText.trim().length < 10) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/community/feed/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: commentText.trim() }),
      });
      const j = await res.json();
      if (res.ok) {
        setComments((c) => [...c, j.comment]);
        setCommentText("");
        onUpdate({ commentCount: post.commentCount + 1 });
        if (j.bpGranted > 0) flash(`+${j.bpGranted} BP`);
      }
    } finally {
      setBusy(false);
    }
  };

  const sharePost = async () => {
    const url = `${window.location.origin}/app/community/feed?post=${post.id}`;
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
      /* user cancelled share */
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
    <article className="fd-card overflow-hidden">
      <header className="flex items-center gap-3 px-4 pt-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e8f3ee] text-xs font-bold text-[#305f33]">
          {post.author.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.author.avatarUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            post.author.displayName.slice(0, 1).toUpperCase()
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-[#0c0a09]">
            {post.author.displayName}
            {post.author.showKycBadge ? (
              <span className="ml-1 text-[10px] font-semibold text-[#305f33]">
                KYC
              </span>
            ) : null}
          </p>
          <p className="text-[10px] text-[#a8a29e]">@{post.author.handle}</p>
        </div>
      </header>

      <p className="px-4 py-2 text-sm leading-relaxed text-[#292524] whitespace-pre-wrap break-words">
        {post.body}
      </p>

      {imgSrc ? (
        <div className="px-4 pb-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgSrc}
            alt=""
            loading="lazy"
            className="max-h-64 w-full rounded-xl object-cover"
          />
        </div>
      ) : null}

      <div className="flex items-center justify-between border-t border-[#f0f4f2] px-2 py-1">
        <button
          type="button"
          disabled={busy}
          onClick={toggleLike}
          className={`min-h-[44px] flex-1 rounded-lg text-xs font-semibold ${
            post.likedByMe ? "text-[#305f33]" : "text-[#57534e]"
          }`}
        >
          {fr ? "J'aime" : "Like"} {post.likeCount > 0 ? `· ${post.likeCount}` : ""}
        </button>
        <button
          type="button"
          onClick={openComments}
          className="min-h-[44px] flex-1 rounded-lg text-xs font-semibold text-[#57534e]"
        >
          {fr ? "Commenter" : "Comment"}{" "}
          {post.commentCount > 0 ? `· ${post.commentCount}` : ""}
        </button>
        <button
          type="button"
          onClick={sharePost}
          className="min-h-[44px] flex-1 rounded-lg text-xs font-semibold text-[#57534e]"
        >
          {fr ? "Partager" : "Share"}
        </button>
      </div>

      {commentOpen ? (
        <div className="border-t border-[#f0f4f2] px-4 py-3">
          <ul className="mb-3 max-h-40 space-y-2 overflow-y-auto">
            {comments.map((c) => (
              <li key={c.id} className="text-xs text-[#44403c]">
                <span className="font-bold">{c.author.displayName}</span>{" "}
                {c.body}
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <input
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={fr ? "Votre commentaire…" : "Your comment…"}
              className="min-h-[44px] flex-1 rounded-xl border border-[#e8f3ee] px-3 text-sm"
            />
            <button
              type="button"
              disabled={busy}
              onClick={submitComment}
              className="rounded-xl bg-[#305f33] px-4 text-xs font-bold text-white"
            >
              OK
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex justify-end px-4 pb-2">
        <button
          type="button"
          onClick={reportPost}
          className="text-[10px] text-[#a8a29e]"
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
