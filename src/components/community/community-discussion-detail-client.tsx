"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { CommunityModuleHeader } from "@/components/community/community-module-header";
import type { DiscussionDetail } from "@/lib/community/discussion-service";

export function CommunityDiscussionDetailClient({
  discussionId,
}: {
  discussionId: string;
}) {
  const { locale } = useI18n();
  const fr = locale === "fr";
  const [discussion, setDiscussion] = useState<DiscussionDetail | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const res = await fetch(`/api/community/discussions/${discussionId}`);
    const j = await res.json();
    if (res.ok) setDiscussion(j.discussion as DiscussionDetail);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discussionId]);

  const toggleFollow = async () => {
    if (!discussion) return;
    const method = discussion.followedByMe ? "DELETE" : "POST";
    await fetch(`/api/community/discussions/${discussionId}/follow`, { method });
    await load();
  };

  const submitReply = async () => {
    setBusy(true);
    try {
      const res = await fetch(
        `/api/community/discussions/${discussionId}/replies`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: replyBody.trim() }),
        },
      );
      if (!res.ok) return;
      setReplyBody("");
      await load();
    } finally {
      setBusy(false);
    }
  };

  if (!discussion) {
    return (
      <div className="community-theme mx-auto max-w-lg px-4 py-16 text-center text-sm text-[#78716c]">
        …
      </div>
    );
  }

  return (
    <div className="community-theme mx-auto w-full max-w-lg px-4 pb-28 pt-3">
      <CommunityModuleHeader
        title={fr ? "Discussion" : "Discussion"}
        backHref="/app/community/discussions"
      />

      <article className="fd-card px-4 py-4">
        <h1 className="text-lg font-bold text-[#0c0a09]">{discussion.title}</h1>
        <p className="mt-1 text-xs text-[#78716c]">
          <Link
            href={`/app/community/u/${discussion.author.handle}`}
            className="font-semibold text-[#305f33]"
          >
            @{discussion.author.handle}
          </Link>
        </p>
        <p className="mt-3 whitespace-pre-wrap text-sm text-[#44403c]">
          {discussion.body}
        </p>
        <button
          type="button"
          className={`mt-3 rounded-lg px-3 py-1.5 text-xs font-bold ${
            discussion.followedByMe
              ? "border border-[#d6d3d1] text-[#57534e]"
              : "bg-[#305f33] text-white"
          }`}
          onClick={() => void toggleFollow()}
        >
          {discussion.followedByMe
            ? fr
              ? "Suivi"
              : "Following"
            : fr
              ? "Suivre"
              : "Follow"}
        </button>
      </article>

      <div className="fd-card mt-4 space-y-2 px-4 py-3">
        <textarea
          className="w-full rounded-xl border border-[#e7e5e4] px-3 py-2 text-sm"
          rows={3}
          value={replyBody}
          onChange={(e) => setReplyBody(e.target.value)}
          placeholder={fr ? "Répondre…" : "Reply…"}
        />
        <button
          type="button"
          disabled={busy}
          className="w-full rounded-xl bg-[#305f33] py-2 text-sm font-bold text-white disabled:opacity-50"
          onClick={() => void submitReply()}
        >
          {fr ? "Répondre" : "Reply"}
        </button>
      </div>

      <ul className="mt-4 space-y-2">
        {discussion.replies.map((r) => (
          <li key={r.id} className="fd-card px-4 py-3">
            <p className="text-xs text-[#78716c]">@{r.author.handle}</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-[#44403c]">
              {r.body}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
