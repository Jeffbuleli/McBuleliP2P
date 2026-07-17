"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import {
  CommunityActionBar,
} from "@/components/community/community-action-bar";
import { CommunityMediaImage } from "@/components/community/community-media-image";
import { CommunityAuthorHeader } from "@/components/community/community-author-header";
import { CommunityMentionInput } from "@/components/community/community-mention-input";
import { CommunityTranslatableText } from "@/components/community/community-translatable-text";
import {
  mediaDisplayUrl,
  type MediaCommentView,
  type MediaItemView,
} from "@/lib/community/media-types";
import type { CommunityAuthorView } from "@/lib/community/profile-service";
import { communityMediaSharePath } from "@/lib/community/share-url";

type Payload = {
  media: MediaItemView;
  postBody: string;
  author: CommunityAuthorView;
  publishedAt: string;
  postIndex: number;
  postMediaCount: number;
  postId: string;
};

export function CommunityMediaDetailClient({
  postId,
  mediaId,
}: {
  postId: string;
  mediaId: string;
}) {
  const { locale } = useI18n();
  const fr = locale === "fr";
  const [data, setData] = useState<Payload | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [comments, setComments] = useState<MediaCommentView[]>([]);
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  useEffect(() => {
    fetch(`/api/community/media/${mediaId}?postId=${postId}`)
      .then((r) => r.json())
      .then((d: Payload & { error?: string }) => {
        if (!d.media) setNotFound(true);
        else setData(d);
      })
      .catch(() => setNotFound(true));
  }, [postId, mediaId]);

  useEffect(() => {
    if (!commentOpen) return;
    fetch(`/api/community/media/${mediaId}/comments`)
      .then((r) => r.json())
      .then((j) => setComments(j.comments ?? []))
      .catch(() => {});
  }, [commentOpen, mediaId]);

  const patchMedia = (patch: Partial<MediaItemView>) => {
    setData((d) => (d ? { ...d, media: { ...d.media, ...patch } } : d));
  };

  const toggleLike = async () => {
    if (!data) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/community/media/${mediaId}/like`, {
        method: "POST",
      });
      const j = await res.json();
      if (res.ok) {
        patchMedia({ likedByMe: j.liked, likeCount: j.likeCount });
      }
    } finally {
      setBusy(false);
    }
  };

  const shareMedia = async () => {
    if (!data) return;
    const url = `${window.location.origin}${communityMediaSharePath(postId, mediaId)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "McBuleli", url });
      } else {
        await navigator.clipboard.writeText(url);
        flash(fr ? "Lien copié" : "Link copied");
      }
      const res = await fetch(`/api/community/media/${mediaId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      const j = await res.json();
      if (res.ok) patchMedia({ shareCount: j.shareCount });
    } catch {
      /* cancelled */
    }
  };

  const submitComment = async () => {
    if (!commentText.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/community/media/${mediaId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, body: commentText.trim() }),
      });
      const j = await res.json();
      if (res.ok && j.comment) {
        setComments((c) => [...c, j.comment]);
        setCommentText("");
        patchMedia({ commentCount: (data?.media.commentCount ?? 0) + 1 });
      }
    } finally {
      setBusy(false);
    }
  };

  if (notFound) {
    return (
      <div className="community-theme mx-auto max-w-lg px-4 py-16 text-center text-sm text-[#57534e]">
        {fr ? "Image introuvable" : "Image not found"}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="community-theme mx-auto max-w-lg px-4 py-16 text-center text-sm text-[#78716c]">
        …
      </div>
    );
  }

  const imgSrc = mediaDisplayUrl(data.media);

  return (
    <div className="community-theme mx-auto w-full max-w-lg px-4 pb-4 pt-3">
      <div className="flex items-center justify-between gap-2">
        <Link
          href={`/app/community/post/${postId}`}
          className="text-sm font-semibold text-[#305f33]"
        >
          ← {fr ? "Publication" : "Post"}
        </Link>
        <span className="text-[11px] text-[#a8a29e]">
          {data.postIndex}/{data.postMediaCount}
        </span>
      </div>

      <article className="mt-3 overflow-hidden rounded-2xl border border-[#f0f4f2] bg-white shadow-[0_2px_12px_rgba(12,10,9,0.04)]">
        <div className="px-4 pt-4">
          <CommunityAuthorHeader
            author={data.author}
            publishedAt={data.publishedAt}
            fr={fr}
          />
          {data.postBody ? (
            <p className="mt-2 text-sm text-[#57534e] line-clamp-2">
              <CommunityTranslatableText text={data.postBody} fr={fr} />
            </p>
          ) : null}
        </div>

        <div className="mt-3 overflow-hidden bg-[#0c0a09]">
          <CommunityMediaImage
            src={imgSrc}
            className="max-h-[70vh] w-full"
            objectFit="contain"
          />
        </div>

        <CommunityActionBar
          fr={fr}
          likedByMe={data.media.likedByMe}
          likeCount={data.media.likeCount}
          commentCount={data.media.commentCount}
          shareCount={data.media.shareCount}
          busy={busy}
          onLike={() => void toggleLike()}
          onComment={() => setCommentOpen((v) => !v)}
          onShare={() => void shareMedia()}
        />

        {commentOpen ? (
          <div className="border-t border-[#f0f4f2] px-4 py-3">
            <ul className="mb-3 space-y-2">
              {comments.map((c) => (
                <li key={c.id} className="text-sm text-[#292524]">
                  <span className="font-bold">{c.author.displayName}</span> {c.body}
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <CommunityMentionInput
                value={commentText}
                onChange={setCommentText}
                placeholder={fr ? "Commenter…" : "Comment…"}
                className="flex-1"
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => void submitComment()}
                className="rounded-xl bg-[#305f33] px-4 text-sm font-bold text-white disabled:opacity-50"
              >
                →
              </button>
            </div>
          </div>
        ) : null}
      </article>

      {toast ? (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#305f33] px-4 py-2 text-sm font-bold text-white shadow-lg">
          {toast}
        </div>
      ) : null}
    </div>
  );
}
