"use client";

import { useState } from "react";
import { CommunityAuthorHeader } from "@/components/community/community-author-header";
import { CommunityMentionInput } from "@/components/community/community-mention-input";
import { CommunityMentionText } from "@/components/community/community-mention-text";
import type { CommentView } from "@/lib/community/feed-service";

function CommentSendIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function commentErrorMessage(code: string | undefined, fr: boolean): string {
  switch (code) {
    case "community_comment_length":
      return fr
        ? "Minimum 2 caractères."
        : "At least 2 characters required.";
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

function CommentNode({
  comment,
  fr,
  depth,
  onReply,
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
  replyToId: string | null;
  replyText: string;
  setReplyText: (v: string) => void;
  onSubmitReply: () => void;
  busy: boolean;
}) {
  return (
    <li className={depth > 0 ? "ml-4 border-l border-[#f0f4f2] pl-3" : ""}>
      <div className="rounded-xl bg-[#fafafa] px-3 py-2.5">
        <CommunityAuthorHeader
          author={comment.author}
          publishedAt={comment.createdAt}
          fr={fr}
          compact
        />
        <p className="mt-2 text-sm leading-relaxed text-[#44403c] whitespace-pre-wrap break-words">
          <CommunityMentionText text={comment.body} />
        </p>
        <div className="mt-2 flex items-center gap-3 text-[11px] font-semibold text-[#78716c]">
          <button
            type="button"
            className="min-h-[36px] active:scale-95"
            onClick={() => onReply(comment.id)}
          >
            {fr ? "Répondre" : "Reply"}
          </button>
          <span className="text-[#d6d3d1]">·</span>
          <span>
            {fr ? "J'aime" : "Like"}
            {comment.likeCount > 0 ? ` · ${comment.likeCount}` : ""}
          </span>
        </div>
      </div>

      {replyToId === comment.id ? (
        <div className="mt-2 flex gap-2">
          <CommunityMentionInput
            value={replyText}
            onChange={setReplyText}
            disabled={busy}
            placeholder={fr ? "Réponse… (@pseudo)" : "Reply… (@handle)"}
            className="min-h-[44px] w-full rounded-xl border border-[#e8f3ee] bg-white px-3 text-sm"
            onSubmit={onSubmitReply}
          />
          <button
            type="button"
            disabled={busy || replyText.trim().length < 2}
            onClick={onSubmitReply}
            aria-label={fr ? "Envoyer" : "Send"}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#305f33] text-white active:scale-95 disabled:opacity-50"
          >
            <CommentSendIcon />
          </button>
        </div>
      ) : null}

      {comment.replies.length > 0 ? (
        <ul className="mt-2 space-y-2">
          {comment.replies.map((r) => (
            <CommentNode
              key={r.id}
              comment={r}
              fr={fr}
              depth={depth + 1}
              onReply={onReply}
              replyToId={replyToId}
              replyText={replyText}
              setReplyText={setReplyText}
              onSubmitReply={onSubmitReply}
              busy={busy}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function CommunityCommentThread({
  postId,
  fr,
  initialComments,
  onCountChange,
}: {
  postId: string;
  fr: boolean;
  initialComments: CommentView[];
  onCountChange: (delta: number) => void;
}) {
  const [comments, setComments] = useState(initialComments);
  const [text, setText] = useState("");
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setError(commentErrorMessage(j.error ?? (res.status === 401 ? "Unauthorized" : undefined), fr));
        return;
      }
      const reload = await fetch(`/api/community/feed/${postId}/comments`);
      const rj = await reload.json();
      setComments(rj.comments ?? []);
      onCountChange(1);
      setText("");
      setReplyText("");
      setReplyToId(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border-t border-[#f0f4f2] px-4 py-4">
      {comments.length === 0 ? (
        <p className="mb-3 text-center text-xs text-[#a8a29e]">
          {fr ? "Aucun commentaire — soyez le premier." : "No comments yet — be the first."}
        </p>
      ) : (
        <ul className="mb-4 max-h-72 space-y-3 overflow-y-auto">
          {comments.map((c) => (
            <CommentNode
              key={c.id}
              comment={c}
              fr={fr}
              depth={0}
              onReply={setReplyToId}
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
      <div className="flex gap-2">
        <CommunityMentionInput
          value={text}
          onChange={setText}
          disabled={busy}
          placeholder={fr ? "Commenter… (@pseudo)" : "Comment… (@handle)"}
          className="min-h-[44px] w-full rounded-xl border border-[#e8f3ee] bg-white px-3 text-sm"
          onSubmit={() => void submit(text)}
        />
        <button
          type="button"
          disabled={busy || text.trim().length < 2}
          onClick={() => void submit(text)}
          aria-label={fr ? "Envoyer" : "Send"}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#305f33] text-white active:scale-95 disabled:opacity-50"
        >
          <CommentSendIcon />
        </button>
      </div>
    </div>
  );
}
