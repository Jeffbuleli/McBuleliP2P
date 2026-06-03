"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { academyCls } from "@/components/academy/academy-ui";
import { fetchWithDeadline } from "@/lib/fetch-with-deadline";

type Msg = {
  id: string;
  senderDisplay: string;
  body: string;
  messageType: string;
  createdAt: string;
  own: boolean;
};

export function AcademyCohortChat({
  editionSlug,
  programSlug,
}: {
  editionSlug: string;
  programSlug: string;
}) {
  const { t } = useI18n();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);
  const [inviteErr, setInviteErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const cohortPath = `/app/academy/${editionSlug}?program=${encodeURIComponent(programSlug)}`;

  const load = useCallback(async () => {
    const q = new URLSearchParams({ program: programSlug });
    const res = await fetchWithDeadline(
      `/api/academy/editions/${editionSlug}/messages?${q}`,
      { credentials: "include", cache: "no-store" },
      15_000,
    );
    const j = await res.json().catch(() => ({}));
    if (res.ok) setMessages((j.messages as Msg[]) ?? []);
  }, [editionSlug, programSlug]);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 12_000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    const body = draft.trim();
    if (!body || busy) return;
    setBusy(true);
    try {
      const res = await fetchWithDeadline(
        `/api/academy/editions/${editionSlug}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ body, programSlug }),
        },
        15_000,
      );
      if (res.ok) {
        setDraft("");
        await load();
      }
    } finally {
      setBusy(false);
    }
  }

  async function inviteByEmail() {
    const email = inviteEmail.trim();
    if (!email || inviteBusy) return;
    setInviteBusy(true);
    setInviteMsg(null);
    setInviteErr(null);
    try {
      const res = await fetchWithDeadline(
        `/api/academy/editions/${editionSlug}/invite`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, programSlug }),
        },
        15_000,
      );
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        const code = typeof j.error === "string" ? j.error : "";
        if (code === "academy_invitee_not_found") {
          setInviteErr(t("academy_invite_not_found"));
        } else if (
          code === "academy_invitee_already_enrolled" ||
          code === "academy_invite_already"
        ) {
          setInviteErr(t("academy_invite_already"));
        } else if (code === "academy_invite_self") {
          setInviteErr(t("academy_invite_self"));
        } else if (code === "academy_invite_email_invalid") {
          setInviteErr(t("academy_invite_email_invalid"));
        } else if (code === "academy_not_enrolled") {
          setInviteErr(t("academy_invite_not_enrolled"));
        } else {
          setInviteErr(t("academy_invite_error"));
        }
        return;
      }
      setInviteEmail("");
      setInviteMsg(
        j.outcome === "enrolled"
          ? t("academy_invite_enrolled")
          : j.outcome === "already_enrolled"
            ? t("academy_invite_already_ok")
            : t("academy_invite_notified"),
      );
    } finally {
      setInviteBusy(false);
    }
  }

  async function copyCohortLink() {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}${cohortPath}`
        : cohortPath;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="rounded-2xl border border-[color:var(--fd-border)] bg-white overflow-hidden">
      <div className="border-b border-[color:var(--fd-border)] px-3 py-2">
        <h2 className="text-sm font-bold text-[color:var(--fd-text)]">
          {t("academy_cohort_chat")}
        </h2>
      </div>

      <div className="border-b border-[color:var(--fd-border)] bg-[#f8faf8] px-3 py-2.5">
        <p className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
          {t("academy_invite_title")}
        </p>
        <p className="mt-0.5 text-[10px] text-[color:var(--fd-muted)]">
          {t("academy_invite_hint")}
        </p>
        <div className="mt-2 flex gap-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder={t("academy_invite_email_placeholder")}
            className={`min-w-0 flex-1 ${academyCls.input}`}
          />
          <button
            type="button"
            disabled={inviteBusy || !inviteEmail.trim()}
            onClick={() => void inviteByEmail()}
            className={`shrink-0 ${academyCls.btnPrimary}`}
          >
            {inviteBusy ? "…" : t("academy_invite_send")}
          </button>
        </div>
        <button
          type="button"
          onClick={() => void copyCohortLink()}
          className="mt-2 text-[10px] font-bold text-[color:var(--fd-primary)] underline"
        >
          {copied ? t("academy_invite_link_copied") : t("academy_invite_copy_link")}
        </button>
        {inviteMsg ? (
          <p className="mt-1.5 text-xs font-semibold text-[#305f33]">{inviteMsg}</p>
        ) : null}
        {inviteErr ? (
          <p className="mt-1.5 text-xs text-rose-700">{inviteErr}</p>
        ) : null}
      </div>

      <div className="max-h-64 overflow-y-auto px-3 py-2 space-y-2">
        {messages.length === 0 ? (
          <p className="text-xs text-[color:var(--fd-muted)]">{t("academy_chat_empty")}</p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`text-sm ${
                m.messageType === "announcement"
                  ? "rounded-lg bg-[#e8f3ee] px-2 py-1.5"
                  : m.own
                    ? "rounded-lg bg-[#f4f6f5] px-2 py-1.5"
                    : ""
              }`}
            >
              <p className="text-[10px] font-bold text-[color:var(--fd-muted)]">
                {m.senderDisplay}
                {m.messageType === "announcement" ? " · 📢" : ""}
              </p>
              <p className="whitespace-pre-wrap text-[color:var(--fd-text)]">{m.body}</p>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2 border-t border-[color:var(--fd-border)] p-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          placeholder={t("academy_chat_placeholder")}
          className={`min-w-0 flex-1 ${academyCls.input}`}
          maxLength={2000}
        />
        <button
          type="button"
          disabled={busy || !draft.trim()}
          onClick={() => void send()}
          className={`shrink-0 ${academyCls.btnPrimary}`}
        >
          →
        </button>
      </div>
    </section>
  );
}
