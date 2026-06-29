"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CommunityAvatar } from "@/components/community/community-avatar";
import { CommunityMentionInput } from "@/components/community/community-mention-input";
import { CommunityTranslatableText } from "@/components/community/community-translatable-text";
import { IconComment, IconLike, IconReply, IconSend } from "@/components/community/community-icons";
import {
  COMMUNITY_AVATAR_RING,
  COMMUNITY_COMMENT_ACTION,
  COMMUNITY_COMMENT_ACTION_ACTIVE,
  COMMUNITY_COMMENT_AUTHOR,
  COMMUNITY_COMMENT_META,
  COMMUNITY_COMMENT_REPLY,
  COMMUNITY_COMMENT_ROOT,
  COMMUNITY_COMMENT_TEXT,
  COMMUNITY_COMPOSER_SHELL,
  COMMUNITY_SEND_BTN,
} from "@/lib/community/community-ui";
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

function CommentAvatar({
  author,
  small = false,
}: {
  author: CommentView["author"];
  small?: boolean;
}) {
  const size = small ? "h-7 w-7 text-[9px]" : "h-9 w-9 text-[11px]";
  return (
    <Link
      href={`/app/community/u/${author.handle}`}
      className={`flex ${size} shrink-0 items-center justify-center overflow-hidden rounded-full ${COMMUNITY_AVATAR_RING}`}
    >
      <CommunityAvatar
        label={author.displayName}
        avatarUrl={author.avatarUrl}
        sizeClass={size}
        textClass={small ? "text-[9px]" : "text-[11px]"}
      />
    </Link>
  );
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
  const isReply = depth > 0;
  const bubbleClass = isReply ? COMMUNITY_COMMENT_REPLY : COMMUNITY_COMMENT_ROOT;

  return (
    <li className={`relative ${depth > 0 ? "mt-3" : "mt-4"}`}>
      {depth > 0 ? (
        <span
          className="absolute -left-4 top-0 h-full w-0.5 rounded-full bg-gradient-to-b from-cyan-400/40 to-transparent"
          aria-hidden
        />
      ) : null}
      <div className={`flex gap-2.5 ${depth > 0 ? "ml-5" : ""}`}>
        <CommentAvatar author={comment.author} small={isReply} />
        <div className="min-w-0 flex-1">
          <div className={`inline-block max-w-full ${bubbleClass}`}>
            <p className={COMMUNITY_COMMENT_TEXT}>
              <Link
                href={`/app/community/u/${comment.author.handle}`}
                className={COMMUNITY_COMMENT_AUTHOR}
              >
                {comment.author.displayName}
              </Link>
            </p>
            <div className={`mt-0.5 ${COMMUNITY_COMMENT_TEXT}`}>
              <CommunityTranslatableText
                text={comment.body}
                fr={fr}
                withMentions
              />
            </div>
          </div>
          <div className={COMMUNITY_COMMENT_META}>
            <span>{formatRelativeTime(comment.createdAt, fr)}</span>
            <button
              type="button"
              aria-label={fr ? "J'aime" : "Like"}
              className={
                comment.likedByMe
                  ? COMMUNITY_COMMENT_ACTION_ACTIVE
                  : COMMUNITY_COMMENT_ACTION
              }
              onClick={() => onLike(comment.id)}
            >
              <IconLike size={14} filled={comment.likedByMe} />
              {comment.likeCount > 0 ? comment.likeCount : null}
            </button>
            {depth < 2 ? (
              <button
                type="button"
                aria-label={fr ? "Répondre" : "Reply"}
                className={COMMUNITY_COMMENT_ACTION}
                onClick={() => onReply(comment.id)}
              >
                <IconReply size={14} />
                {fr ? "Répondre" : "Reply"}
              </button>
            ) : null}
          </div>

          {replyToId === comment.id ? (
            <div className={`mt-3 ${COMMUNITY_COMPOSER_SHELL}`}>
              <CommunityMentionInput
                value={replyText}
                onChange={setReplyText}
                disabled={busy}
                placeholder={fr ? "Votre réponse… (@pseudo)" : "Your reply… (@handle)"}
                className="min-h-[40px] w-full border-0 bg-transparent px-1 text-sm outline-none"
                onSubmit={onSubmitReply}
              />
              <button
                type="button"
                disabled={busy || replyText.trim().length < 2}
                onClick={onSubmitReply}
                aria-label={fr ? "Envoyer" : "Send"}
                className={COMMUNITY_SEND_BTN}
              >
                <IconSend size={18} />
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

  const totalComments = comments.reduce(
    (n, c) => n + 1 + c.replies.length,
    0,
  );

  return (
    <div className="border-t border-white/8 bg-[rgba(5,8,16,0.45)] px-3 py-4">
      <div className="mb-3 flex items-center gap-2 px-1">
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
          <IconComment size={15} />
        </span>
        <p className="text-sm font-bold text-stone-100">
          {fr ? "Commentaires" : "Comments"}
          {totalComments > 0 ? (
            <span className="ml-1.5 font-semibold text-stone-400">
              ({totalComments})
            </span>
          ) : null}
        </p>
      </div>

      {loading ? (
        <p className="py-4 text-center text-xs text-stone-500">…</p>
      ) : comments.length === 0 ? (
        <p className="mb-4 rounded-xl border border-dashed border-white/10 bg-white/5 py-6 text-center text-xs text-stone-400">
          {fr
            ? "Aucun commentaire - lancez la discussion."
            : "No comments yet - start the conversation."}
        </p>
      ) : (
        <ul className="mb-4 max-h-96 overflow-y-auto pr-1">
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
        <p className="mb-2 text-center text-xs font-medium text-red-400">{error}</p>
      ) : null}
      <div className={COMMUNITY_COMPOSER_SHELL}>
        <CommunityMentionInput
          value={text}
          onChange={setText}
          disabled={busy}
          placeholder={fr ? "Écrire un commentaire…" : "Write a comment…"}
          className="min-h-[44px] w-full border-0 bg-transparent px-1 text-sm outline-none"
          onSubmit={() => void submit(text)}
        />
        <button
          type="button"
          disabled={busy || text.trim().length < 2}
          onClick={() => void submit(text)}
          aria-label={fr ? "Envoyer" : "Send"}
          className={`${COMMUNITY_SEND_BTN} h-10 w-10 disabled:opacity-40`}
        >
          <IconSend size={18} />
        </button>
      </div>
    </div>
  );
}
