"use client";

import { useState } from "react";
import { CommunityAuthorHeader } from "@/components/community/community-author-header";
import type { CommentView } from "@/lib/community/feed-service";

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
          {comment.body}
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
          <input
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={fr ? "Réponse… (@pseudo)" : "Reply… (@handle)"}
            className="min-h-[44px] flex-1 rounded-xl border border-[#e8f3ee] bg-white px-3 text-sm"
          />
          <button
            type="button"
            disabled={busy}
            onClick={onSubmitReply}
            className="shrink-0 rounded-xl bg-[#305f33] px-4 text-xs font-bold text-white active:scale-95 disabled:opacity-50"
          >
            {fr ? "Envoyer" : "Send"}
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

  const submit = async (body: string, parentId?: string | null) => {
    if (body.trim().length < 10) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/community/feed/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim(), parentId: parentId ?? null }),
      });
      const j = await res.json();
      if (!res.ok) return;
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
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={fr ? "Commenter… (@pseudo)" : "Comment… (@handle)"}
          className="min-h-[44px] flex-1 rounded-xl border border-[#e8f3ee] bg-white px-3 text-sm"
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => void submit(text)}
          className="shrink-0 rounded-xl bg-[#305f33] px-4 text-xs font-bold text-white active:scale-95 disabled:opacity-50"
        >
          {fr ? "Envoyer" : "Send"}
        </button>
      </div>
    </div>
  );
}
