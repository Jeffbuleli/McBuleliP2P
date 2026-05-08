"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useI18n } from "@/components/i18n-provider";
import { clientErrorText } from "@/lib/client-error-text";

type Msg = {
  id: string;
  body: string;
  createdAt: string;
  senderMasked: string;
  senderRole: string;
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
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <Link href="/admin/p2p/inbox" className="text-sm text-amber-200 underline">
          ← Support inbox
        </Link>
        {order ? (
          <span className="rounded-full bg-stone-800 px-3 py-1 text-xs font-semibold text-stone-200">
            {order.status}
          </span>
        ) : null}
      </div>

      <h2 className="text-lg font-bold text-white">Order support</h2>
      <p className="font-mono text-xs text-stone-500">{orderId}</p>

      {errMsg ? (
        <p className="rounded-lg bg-rose-950/50 px-3 py-2 text-sm text-rose-100">{errMsg}</p>
      ) : null}

      <div className="rounded-2xl border border-stone-700 bg-stone-950/40">
        <div className="max-h-[55vh] space-y-2 overflow-y-auto p-3">
          {messages.map((m) => (
            <div key={m.id} className="rounded-xl bg-stone-900/70 p-3 text-sm text-stone-100">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-semibold text-stone-300">
                  {m.senderMasked}
                  {m.senderRole === "agent" || m.senderRole === "super_admin" ? (
                    <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-200">
                      Support
                    </span>
                  ) : null}
                </span>
                <span className="text-[10px] text-stone-500">
                  {new Date(m.createdAt).toLocaleString(loc, { dateStyle: "short", timeStyle: "short" })}
                </span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-stone-100">{m.body}</p>
            </div>
          ))}
          {messages.length === 0 ? (
            <p className="p-3 text-sm text-stone-500">No messages.</p>
          ) : null}
        </div>
        <div className="flex gap-2 border-t border-stone-800 p-3">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Reply as Support…"
            className="min-w-0 flex-1 rounded-xl border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-stone-100 outline-none"
          />
          <button
            type="button"
            disabled={busy || !draft.trim()}
            onClick={() => void send()}
            className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

