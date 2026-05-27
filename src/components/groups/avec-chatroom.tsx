"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { UserAvatarMark } from "@/components/profile/user-avatar-mark";
import { avecCls } from "@/components/groups/avec-ui";
import { clientErrorText } from "@/lib/client-error-text";
import { AVATAR_MAX_BYTES } from "@/lib/avatar-image";
import {
  AvecLoanDecisionMessage,
  parseLoanMeta,
} from "@/components/groups/avec-loan-decision-message";
import { AvecClosureDecisionMessage } from "@/components/groups/avec-closure-decision-message";
import {
  AvecPayoutPendingMessage,
  parsePayoutPendingMeta,
} from "@/components/groups/avec-payout-pending-message";
import {
  AvecPayoutDecisionMessage,
  parsePayoutMeta,
} from "@/components/groups/avec-payout-decision-message";
import {
  AvecGovernanceVoteMessage,
  parseGovernanceVoteMeta,
} from "@/components/groups/avec-governance-vote-message";
import {
  AvecSocialAidPaidMessage,
  AvecSocialAidRequestedMessage,
  parseSocialAidMeta,
} from "@/components/groups/avec-social-aid-message";
import { KycVerifiedBadge } from "@/components/kyc/kyc-verified-badge";

type Reaction = { userId: string; emoji: string };

type Msg = {
  id: string;
  senderUserId: string;
  senderEmail: string;
  senderDisplayName: string;
  senderAvatarUrl: string | null;
  senderKycApproved?: boolean;
  body: string;
  messageType: string;
  attachmentUrl: string | null;
  attachmentExpiresAt: string | null;
  reactions: Reaction[];
  meta?: Record<string, unknown> | null;
  hidden?: boolean;
  createdAt: string;
};

type MentionMember = {
  userId: string;
  label: string;
  avatarUrl: string | null;
  email: string;
};

const REACTIONS = ["👍", "❤️", "😂", "🎉", "👏"] as const;

function renderBody(body: string, mentionLabels: string[]) {
  const parts = body.split(/(@[\w.\-]+)/g);
  return parts.map((part, i) => {
    if (part.startsWith("@") && mentionLabels.some((l) => part.slice(1) === l || part.includes(l))) {
      return (
        <span key={i} className="font-bold text-[color:var(--fd-primary)]">
          {part}
        </span>
      );
    }
    if (part.startsWith("@")) {
      return (
        <span key={i} className="font-bold text-[color:var(--fd-primary)]">
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function AvecChatroom({
  groupId,
  myUserId,
  canPost,
  canModerate = false,
  mentionMembers,
}: {
  groupId: string;
  myUserId?: string;
  canPost: boolean;
  canModerate?: boolean;
  mentionMembers: MentionMember[];
}) {
  const { t, locale } = useI18n();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [mentionPick, setMentionPick] = useState<MentionMember[]>([]);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [minutesOpen, setMinutesOpen] = useState(false);
  const [minutesBody, setMinutesBody] = useState("");
  const [minutesLabel, setMinutesLabel] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/groups/${groupId}/messages`, { cache: "no-store" });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr((j as { error?: string }).error ?? "group_action_failed");
      return;
    }
    setMessages((j.messages ?? []) as Msg[]);
  }, [groupId]);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 4000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function onDraftChange(v: string) {
    setDraft(v);
    const at = v.lastIndexOf("@");
    if (at >= 0 && (at === 0 || /\s/.test(v[at - 1]!))) {
      const q = v.slice(at + 1).toLowerCase();
      setMentionPick(
        mentionMembers
          .filter((m) => m.userId !== myUserId)
          .filter((m) => !q || m.label.toLowerCase().includes(q))
          .slice(0, 6),
      );
    } else {
      setMentionPick([]);
    }
  }

  function insertMention(m: MentionMember) {
    const at = draft.lastIndexOf("@");
    const next = `${draft.slice(0, at)}@${m.label.replace(/\s/g, "_")} `;
    setDraft(next);
    setMentionPick([]);
  }

  function parseMentionIds(text: string): string[] {
    const ids: string[] = [];
    for (const m of mentionMembers) {
      const token = `@${m.label.replace(/\s/g, "_")}`;
      if (text.includes(token)) ids.push(m.userId);
    }
    return ids;
  }

  async function onImagePick(file: File) {
    if (file.size > AVATAR_MAX_BYTES) {
      setErr("avatar_too_large");
      return;
    }
    if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) {
      setErr("avatar_invalid_type");
      return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.onerror = () => reject(new Error("read failed"));
      r.readAsDataURL(file);
    });
    setPendingImage(dataUrl);
  }

  async function send() {
    const body = draft.trim();
    if ((!body && !pendingImage) || busy || !canPost) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/groups/${groupId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body,
          attachmentUrl: pendingImage,
          mentionUserIds: parseMentionIds(body),
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr((j as { error?: string }).error ?? "group_action_failed");
        return;
      }
      setDraft("");
      setPendingImage(null);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function react(messageId: string, emoji: string) {
    await fetch(`/api/groups/${groupId}/messages/${messageId}/react`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji }),
    });
    await load();
  }

  async function moderateMessage(messageId: string, action: "hide" | "unhide") {
    setErr(null);
    const res = await fetch(
      `/api/groups/${groupId}/messages/${messageId}/moderate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      },
    );
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr((j as { error?: string }).error ?? "group_action_failed");
      return;
    }
    await load();
  }

  async function publishMinutes() {
    const body = minutesBody.trim();
    if (body.length < 10 || busy) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/groups/${groupId}/minutes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body,
          meetingLabel: minutesLabel.trim() || null,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr((j as { error?: string }).error ?? "group_action_failed");
        return;
      }
      setMinutesBody("");
      setMinutesLabel("");
      setMinutesOpen(false);
      await load();
    } finally {
      setBusy(false);
    }
  }

  const loc = locale === "fr" ? "fr-FR" : "en-US";
  const labels = mentionMembers.map((m) => m.label.replace(/\s/g, "_"));

  return (
    <div className={`${avecCls.section} flex flex-col`} style={{ minHeight: "360px" }}>
      <p className="mb-2 text-[10px] text-[color:var(--fd-muted)]">{t("avec_chat_image_ttl")}</p>
      <div className="flex-1 space-y-3 overflow-y-auto pr-1" style={{ maxHeight: "52vh" }}>
        {messages.length === 0 ? (
          <p className="py-12 text-center text-xs text-[color:var(--fd-muted)]">{t("avec_chat_empty")}</p>
        ) : (
          messages.map((m) => {
            const mine = myUserId && m.senderUserId === myUserId;
            const system = m.messageType === "system";
            const payoutPending =
              m.messageType === "payout_pending" ||
              (m.messageType === "system" && m.body.startsWith("PAYOUT_PENDING"));
            if (payoutPending) {
              return (
                <div key={m.id} className="flex justify-center py-1">
                  <AvecPayoutPendingMessage
                    meta={parsePayoutPendingMeta(m.meta ?? null, m.body)}
                    createdAt={m.createdAt}
                    locale={locale}
                  />
                </div>
              );
            }
            const payoutDecision = m.messageType === "payout_decision";
            if (payoutDecision) {
              return (
                <div key={m.id} className="flex justify-center py-1">
                  <AvecPayoutDecisionMessage
                    meta={parsePayoutMeta(m.meta ?? null)}
                    createdAt={m.createdAt}
                    locale={locale}
                  />
                </div>
              );
            }
            if (m.messageType === "loan_decision") {
              return (
                <div key={m.id} className="flex justify-center py-1">
                  <AvecLoanDecisionMessage
                    meta={parseLoanMeta(m.meta ?? null)}
                    createdAt={m.createdAt}
                    locale={locale}
                  />
                </div>
              );
            }
            if (m.messageType === "closure_decision") {
              return (
                <div key={m.id} className="flex justify-center py-1">
                  <AvecClosureDecisionMessage meta={m.meta ?? null} />
                </div>
              );
            }
            if (m.messageType === "social_aid_requested") {
              return (
                <div key={m.id} className="flex justify-center py-1">
                  <AvecSocialAidRequestedMessage
                    meta={parseSocialAidMeta(m.meta ?? null, m.body)}
                    createdAt={m.createdAt}
                    locale={locale}
                  />
                </div>
              );
            }
            if (m.messageType === "social_aid_paid") {
              return (
                <div key={m.id} className="flex justify-center py-1">
                  <AvecSocialAidPaidMessage
                    meta={parseSocialAidMeta(m.meta ?? null, m.body)}
                    createdAt={m.createdAt}
                    locale={locale}
                  />
                </div>
              );
            }
            if (m.messageType === "minutes") {
              const label =
                typeof m.meta?.meetingLabel === "string" && m.meta.meetingLabel
                  ? m.meta.meetingLabel
                  : null;
              return (
                <div key={m.id} className="flex justify-center py-1">
                  <div className="w-full max-w-md rounded-2xl border-2 border-violet-200 bg-violet-50/90 px-3 py-2.5 text-xs text-violet-950">
                    <p className="text-[10px] font-extrabold uppercase tracking-wide text-violet-800">
                      {label
                        ? t("group_dialogue_minutes_title_labeled", { label })
                        : t("group_dialogue_minutes_title")}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
                    <p className="mt-1 text-[9px] text-violet-700/80">
                      {new Date(m.createdAt).toLocaleString(loc)}
                    </p>
                  </div>
                </div>
              );
            }
            if (
              m.messageType === "vote_started" ||
              m.messageType === "vote_progress" ||
              m.messageType === "vote_closed" ||
              m.messageType === "vote_retry" ||
              m.messageType === "vote_executed"
            ) {
              const voteMsgType =
                m.messageType === "vote_retry"
                  ? "vote_started"
                  : m.messageType === "vote_executed"
                    ? "vote_executed"
                    : m.messageType;
              return (
                <div key={m.id} className="flex justify-center py-1">
                  <AvecGovernanceVoteMessage
                    groupId={groupId}
                    myUserId={myUserId}
                    messageType={voteMsgType}
                    isRetry={m.messageType === "vote_retry"}
                    meta={parseGovernanceVoteMeta(m.meta ?? null)}
                    createdAt={m.createdAt}
                    locale={locale}
                    onVoted={() => void load()}
                  />
                </div>
              );
            }
            const chatHidden = Boolean(m.hidden);
            return (
              <div
                key={m.id}
                className={`flex gap-2 ${mine ? "flex-row-reverse" : "flex-row"} ${system ? "justify-center" : ""} ${chatHidden ? "opacity-50" : ""}`}
              >
                {!system ? (
                  <UserAvatarMark
                    email={m.senderEmail}
                    avatarUrl={m.senderAvatarUrl}
                    sizeClass="h-8 w-8 shrink-0"
                  />
                ) : null}
                <div className={`max-w-[82%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
                  <div
                    className={`rounded-2xl px-3 py-2 text-xs ${
                      system
                        ? "border border-dashed border-[color:var(--fd-border)] bg-stone-50 text-[color:var(--fd-muted)]"
                        : mine
                          ? "bg-[color:var(--fd-primary)] text-white"
                          : "border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] text-[color:var(--fd-text)]"
                    }`}
                  >
                    {!system && !mine ? (
                      <p className="mb-0.5 flex items-center gap-1 text-[9px] font-bold opacity-80">
                        <span className="truncate">{m.senderDisplayName}</span>
                        {m.senderKycApproved ? <KycVerifiedBadge compact /> : null}
                      </p>
                    ) : null}
                    <p className="whitespace-pre-wrap break-words">{renderBody(m.body, labels)}</p>
                    {m.attachmentUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.attachmentUrl}
                        alt=""
                        className="mt-2 max-h-40 rounded-xl object-cover"
                      />
                    ) : m.attachmentExpiresAt ? (
                      <p className="mt-1 text-[9px] italic opacity-60">{t("avec_chat_image_expired")}</p>
                    ) : null}
                    <p className="mt-1 text-[9px] opacity-60">
                      {new Date(m.createdAt).toLocaleString(loc)}
                    </p>
                  </div>
                  {!system && canModerate && (m.messageType === "chat" || m.messageType === "proof") ? (
                    <button
                      type="button"
                      onClick={() =>
                        void moderateMessage(m.id, chatHidden ? "unhide" : "hide")
                      }
                      className="mt-0.5 text-[9px] font-bold text-rose-600"
                    >
                      {chatHidden
                        ? t("group_dialogue_unhide")
                        : t("group_dialogue_hide")}
                    </button>
                  ) : null}
                  {!system ? (
                    <div className="mt-1 flex flex-wrap gap-0.5">
                      {REACTIONS.map((e) => {
                        const count = m.reactions.filter((r) => r.emoji === e).length;
                        const mineR = m.reactions.some(
                          (r) => r.userId === myUserId && r.emoji === e,
                        );
                        return (
                          <button
                            key={e}
                            type="button"
                            onClick={() => void react(m.id, e)}
                            className={`rounded-full px-1.5 py-0.5 text-[11px] ${
                              mineR
                                ? "bg-[color:var(--fd-mint)] ring-1 ring-[color:var(--fd-primary)]/30"
                                : "bg-stone-100"
                            }`}
                          >
                            {e}
                            {count > 0 ? (
                              <span className="ml-0.5 text-[9px] font-bold">{count}</span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {err ? <p className="mt-2 text-xs text-rose-700">{clientErrorText(t, err)}</p> : null}

      {canModerate ? (
        <div className="mt-2 rounded-xl border border-violet-200 bg-violet-50/60 p-2">
          <button
            type="button"
            onClick={() => setMinutesOpen((v) => !v)}
            className="text-[10px] font-bold text-violet-900"
          >
            {minutesOpen
              ? t("group_dialogue_minutes_cancel")
              : t("group_dialogue_minutes_publish")}
          </button>
          {minutesOpen ? (
            <div className="mt-2 space-y-2">
              <input
                value={minutesLabel}
                onChange={(e) => setMinutesLabel(e.target.value)}
                placeholder={t("group_dialogue_minutes_label_ph")}
                className="w-full rounded-lg border border-violet-200 bg-white px-2 py-1.5 text-[10px]"
              />
              <textarea
                value={minutesBody}
                onChange={(e) => setMinutesBody(e.target.value)}
                placeholder={t("group_dialogue_minutes_body_ph")}
                rows={4}
                className="w-full rounded-lg border border-violet-200 bg-white px-2 py-1.5 text-xs"
              />
              <button
                type="button"
                disabled={busy || minutesBody.trim().length < 10}
                onClick={() => void publishMinutes()}
                className="rounded-lg bg-violet-800 px-3 py-1.5 text-[10px] font-bold text-white disabled:opacity-50"
              >
                {t("group_dialogue_minutes_submit")}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {canPost ? (
        <div className="relative mt-3 border-t border-[color:var(--fd-border)] pt-3">
          {mentionPick.length > 0 ? (
            <ul className="absolute bottom-full left-0 z-10 mb-1 max-h-32 w-full overflow-y-auto rounded-xl border border-[color:var(--fd-border)] bg-white shadow-lg">
              {mentionPick.map((m) => (
                <li key={m.userId}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-[color:var(--fd-mint)]"
                    onClick={() => insertMention(m)}
                  >
                    <UserAvatarMark email={m.email} avatarUrl={m.avatarUrl} sizeClass="h-6 w-6" />
                    {m.label}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {pendingImage ? (
            <div className="mb-2 flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={pendingImage} alt="" className="h-16 rounded-lg object-cover" />
              <button
                type="button"
                className="text-[10px] font-bold text-rose-600"
                onClick={() => setPendingImage(null)}
              >
                ✕
              </button>
            </div>
          ) : null}
          <div className="flex gap-2">
            <button
              type="button"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[color:var(--fd-border)] text-lg"
              onClick={() => fileRef.current?.click()}
              aria-label={t("avec_chat_add_image")}
            >
              📷
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onImagePick(f);
                e.target.value = "";
              }}
            />
            <input
              value={draft}
              onChange={(e) => onDraftChange(e.target.value)}
              placeholder={t("avec_chat_placeholder")}
              className={`min-w-0 flex-1 ${avecCls.input}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => void send()}
              className={`${avecCls.btnPrimary} !w-auto shrink-0 px-4`}
            >
              →
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-2 text-center text-[10px] text-[color:var(--fd-muted)]">{t("avec_chat_readonly")}</p>
      )}
    </div>
  );
}
