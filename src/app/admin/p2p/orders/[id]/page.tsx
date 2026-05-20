"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useI18n } from "@/components/i18n-provider";
import { ChatAvatarBubble } from "@/components/profile/user-avatar-mark";
import { clientErrorText } from "@/lib/client-error-text";
import { adminCls, AdminBackLink, AdminPageHeader } from "@/components/admin/admin-ui";

type Msg = {
  id: string;
  body: string;
  createdAt: string;
  senderMasked: string;
  senderRole: string;
  senderAvatarUrl: string | null;
};

type OrderMeta = { id: string; status: string; makerId: string; takerId: string };

export default function AdminP2pOrderSupportPage() {
  const params = useParams();
  const orderId = typeof params.id === "string" ? params.id : "";
  const { t, locale } = useI18n();
  const loc = locale === "fr" ? "fr-FR" : "en-US";

  const [order, setOrder] = useState<OrderMeta | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/p2p/orders/${orderId}/messages`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(typeof data.error === "string" ? data.error : "Forbidden");
      setOrder(null);
      setMessages([]);
      return;
    }
    setErr(null);
    setOrder((data.order as OrderMeta) ?? null);
    setMessages((data.messages as Msg[]) ?? []);
  }, [orderId]);

  useEffect(() => {
    if (!orderId) return;
    void load();
    const id = window.setInterval(() => void load(), 10000);
    return () => window.clearInterval(id);
  }, [orderId, load]);

  async function send() {
    const text = draft.trim();
    if (!text) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/p2p/orders/${orderId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(typeof data.error === "string" ? data.error : "p2p_action_not_allowed");
        return;
      }
      setDraft("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  const errMsg = useMemo(() => (err ? clientErrorText(t, err) : null), [err, t]);

  return (
    <div className={adminCls.page}>
      <div className="flex items-start justify-between gap-3">
        <AdminBackLink href="/admin/p2p/inbox">Support inbox</AdminBackLink>
        {order ? (
          <span className="rounded-full bg-[color:var(--fd-mint)] px-3 py-1 text-xs font-semibold text-[color:var(--fd-primary)]">
            {order.status}
          </span>
        ) : null}
      </div>

      <AdminPageHeader title="Order support" subtitle={orderId} />

      {errMsg ? <p className={adminCls.error}>{errMsg}</p> : null}

      <div className="fd-card overflow-hidden rounded-2xl">
        <div className="max-h-[55vh] space-y-2 overflow-y-auto p-3">
          {messages.map((m) => (
            <div key={m.id} className="rounded-xl bg-[color:var(--fd-mint)]/40 p-3 text-sm text-[color:var(--fd-text)]">
              <div className="flex items-start gap-2">
                <ChatAvatarBubble
                  label={m.senderMasked}
                  avatarUrl={m.senderAvatarUrl}
                  own={false}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-semibold text-[color:var(--fd-text)]">
                      {m.senderMasked}
                      {m.senderRole === "agent" || m.senderRole === "super_admin" ? (
                        <span className="ml-2 rounded-full bg-[color:var(--fd-primary)]/10 px-2 py-0.5 text-[10px] font-bold text-[color:var(--fd-primary)]">
                          Support
                        </span>
                      ) : null}
                    </span>
                    <span className={`text-[10px] ${adminCls.muted}`}>
                      {new Date(m.createdAt).toLocaleString(loc, {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
                </div>
              </div>
            </div>
          ))}
          {messages.length === 0 ? (
            <p className={`p-3 text-sm ${adminCls.muted}`}>No messages.</p>
          ) : null}
        </div>
        <div className="flex gap-2 border-t border-[color:var(--fd-border)] p-3">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Reply as Support…"
            className={`min-w-0 flex-1 ${adminCls.input}`}
          />
          <button
            type="button"
            disabled={busy || !draft.trim()}
            onClick={() => void send()}
            className={`${adminCls.btnPrimary} disabled:opacity-40`}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
