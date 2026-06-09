"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CommunityMentionInput } from "@/components/community/community-mention-input";
import { CommunityMentionText } from "@/components/community/community-mention-text";
import { IconLike, IconReply, IconSend } from "@/components/community/community-icons";
import { formatRelativeTime } from "@/lib/community/relative-time";
import type { CommentView } from "@/lib/community/feed-service";

function commentErrorMessage(code: string | undefined, fr: boolean): string {
  switch (code) {
    case "community_comment_length":
      return fr ? "Minimum 2 caractères." : "At least 2 characters required.";
    case "Unauthorized":
    case "unauthorized":
      return fr ? "Connectez-vous pour commenter." : "Sign in to comment.";
    case "parent_not_found":
      return fr ? "Commentaire parent introuvable." : "Parent comment not found.";
    case "blocked":
      return fr ? "Action impossible." : "Action not allowed.";
    default:
      return fr ? "Envoi impossible. Réessayez." : "Could not send. Try again.";
  }
}

function updateCommentTree(
  list: CommentView[],
  id: string,
  patch: Partial<CommentView>,
): CommentView[] {
  return list.map((c) => {
    if (c.id === id) return { ...c, ...patch };
    if (c.replies.length) {
      return { ...c, replies: updateCommentTree(c.replies, id, patch) };
    }
    return c;
  });
}

function CommentNode({
  comment,
  fr,
  depth,
  onReply,
  onLike,
  replyToId,
  replyText,
  setReplyText,
  onSubmitReply,
  busy,
}: {
  comment: CommentView;
  fr: boolean;
  depth: number;
  onReply: (id: string) => void;
  onLike: (id: string) => void;
  replyToId: string | null;
  replyText: string;
  setReplyText: (v: string) => void;
  onSubmitReply: () => void;
  busy: boolean;
}) {
  return (
    <li className={`flex gap-2 ${depth > 0 ? "ml-8 mt-2" : "mt-3"}`}>
      <Link
        href={`/app/community/u/${comment.author.handle}`}
        className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e8f3ee] text-[10px] font-bold text-[#305f33]"
      >
        {comment.author.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={comment.author.avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          comment.author.displayName.slice(0, 1).toUpperCase()
        )}
      </Link>
      <div className="min-w-0 flex-1">
        <div className="inline-block max-w-full rounded-2xl rounded-tl-md bg-[#f0f2f5] px-3 py-2">
          <p className="text-[13px] leading-snug text-[#0c0a09]">
            <Link
              href={`/app/community/u/${comment.author.handle}`}
              className="font-bold hover:underline"
            >
              {comment.author.displayName}
            </Link>{" "}
            <span className="font-normal text-[#292524]">
              <CommunityMentionText text={comment.body} />
            </span>
          </p>
        </div>
        <div className="mt-1 flex items-center gap-3 px-1 text-[11px] text-[#78716c]">
          <span>{formatRelativeTime(comment.createdAt, fr)}</span>
          <button
            type="button"
            aria-label={fr ? "J'aime" : "Like"}
            className={`relative flex h-8 w-8 items-center justify-center rounded-full active:scale-95 ${
              comment.likedByMe ? "text-[#305f33]" : "text-[#78716c]"
            }`}
            onClick={() => onLike(comment.id)}
          >
            <IconLike size={16} filled={comment.likedByMe} />
            {comment.likeCount > 0 ? (
              <span className="absolute -right-1 -top-0.5 text-[9px] font-bold">
                {comment.likeCount}
              </span>
            ) : null}
          </button>
          {depth < 2 ? (
            <button
              type="button"
              aria-label={fr ? "Répondre" : "Reply"}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[#78716c] active:scale-95"
              onClick={() => onReply(comment.id)}
            >
              <IconReply size={16} />
            </button>
          ) : null}
        </div>

        {replyToId === comment.id ? (
          <div className="mt-2 flex gap-2">
            <CommunityMentionInput
              value={replyText}
              onChange={setReplyText}
              disabled={busy}
              placeholder={fr ? "Réponse… (@pseudo)" : "Reply… (@handle)"}
              className="min-h-[40px] w-full rounded-full border border-[#e8f3ee] bg-white px-4 text-sm"
              onSubmit={onSubmitReply}
            />
            <button
              type="button"
              disabled={busy || replyText.trim().length < 2}
              onClick={onSubmitReply}
              aria-label={fr ? "Envoyer" : "Send"}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#305f33] text-white disabled:opacity-50"
            >
              <IconSend />
            </button>
          </div>
        ) : null}

        {comment.replies.length > 0 ? (
          <ul>
            {comment.replies.map((r) => (
              <CommentNode
                key={r.id}
                comment={r}
                fr={fr}
                depth={depth + 1}
                onReply={onReply}
                onLike={onLike}
                replyToId={replyToId}
                replyText={replyText}
                setReplyText={setReplyText}
                onSubmitReply={onSubmitReply}
                busy={busy}
              />
            ))}
          </ul>
        ) : null}
      </div>
    </li>
  );
}

export function CommunityCommentThread({
  postId,
  fr,
  initialComments,
  loading = false,
  onCountChange,
}: {
  postId: string;
  fr: boolean;
  initialComments: CommentView[];
  loading?: boolean;
  onCountChange: (delta: number) => void;
}) {
  const [comments, setComments] = useState(initialComments);
  const [text, setText] = useState("");
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) setComments(initialComments);
  }, [initialComments, loading]);

  const reload = async () => {
    const res = await fetch(`/api/community/feed/${postId}/comments`);
    const rj = await res.json();
    setComments(rj.comments ?? []);
  };

  const submit = async (body: string, parentId?: string | null) => {
    const trimmed = body.trim();
    if (trimmed.length < 2) {
      setError(commentErrorMessage("community_comment_length", fr));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/community/feed/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: trimmed, parentId: parentId ?? null }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(
          commentErrorMessage(
            j.error ?? (res.status === 401 ? "Unauthorized" : undefined),
            fr,
          ),
        );
        return;
      }
      await reload();
      onCountChange(1);
      setText("");
      setReplyText("");
      setReplyToId(null);
    } finally {
      setBusy(false);
    }
  };

  const likeComment = async (commentId: string) => {
    const res = await fetch(`/api/community/comments/${commentId}/like`, {
      method: "POST",
    });
    const j = await res.json();
    if (res.ok) {
      setComments((list) =>
        updateCommentTree(list, commentId, {
          likedByMe: j.liked,
          likeCount: j.likeCount,
        }),
      );
    }
  };

  return (
    <div className="border-t border-[#f0f4f2] bg-[#fafaf9] px-3 py-3">
      {loading ? (
        <p className="py-4 text-center text-xs text-[#a8a29e]">…</p>
      ) : comments.length === 0 ? (
        <p className="mb-3 text-center text-xs text-[#a8a29e]">
          {fr ? "Aucun commentaire — soyez le premier." : "No comments yet — be the first."}
        </p>
      ) : (
        <ul className="mb-3 max-h-80 overflow-y-auto">
          {comments.map((c) => (
            <CommentNode
              key={c.id}
              comment={c}
              fr={fr}
              depth={0}
              onReply={setReplyToId}
              onLike={(id) => void likeComment(id)}
              replyToId={replyToId}
              replyText={replyText}
              setReplyText={setReplyText}
              onSubmitReply={() => void submit(replyText, replyToId)}
              busy={busy}
            />
          ))}
        </ul>
      )}
      {error ? (
        <p className="mb-2 text-center text-xs font-medium text-red-600">{error}</p>
      ) : null}
      <div className="flex items-center gap-2 rounded-full border border-[#e8f3ee] bg-white px-3 py-1.5 shadow-sm">
        <CommunityMentionInput
          value={text}
          onChange={setText}
          disabled={busy}
          placeholder={fr ? "Ajouter un commentaire…" : "Add a comment…"}
          className="min-h-[40px] w-full border-0 bg-transparent px-1 text-sm outline-none"
          onSubmit={() => void submit(text)}
        />
        <button
          type="button"
          disabled={busy || text.trim().length < 2}
          onClick={() => void submit(text)}
          aria-label={fr ? "Envoyer" : "Send"}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#305f33] disabled:opacity-40"
        >
          <IconSend />
        </button>
      </div>
    </div>
  );
}
