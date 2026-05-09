"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Messages } from "@/i18n/messages";
import { useI18n } from "@/components/i18n-provider";

type Row = {
  id: string;
  kind: string;
  payload: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
};

function titleBodyForRow(
  row: Row,
  t: (key: keyof Messages, vars?: Record<string, string | number>) => string,
): { title: string; body: string; href: string } {
  const p = row.payload ?? {};
  const str = (k: string) => (typeof p[k] === "string" ? (p[k] as string) : "");

  switch (row.kind) {
    case "withdrawal_completed":
      return {
        title: t("notif_withdrawal_completed_title"),
        body: t("notif_withdrawal_completed_body", {
          asset: str("asset") || "—",
        }),
        href: "/app/wallet/history",
      };
    case "withdrawal_rejected":
      return {
        title: t("notif_withdrawal_rejected_title"),
        body: t("notif_withdrawal_rejected_body", {
          reason: str("reason") || "—",
        }),
        href: "/app/wallet/history",
      };
    case "deposit_confirmed":
      return {
        title: t("notif_deposit_confirmed_title"),
        body: t("notif_deposit_confirmed_body", {
          asset: str("asset") || "—",
          amount: str("amount") || "—",
        }),
        href: "/app/wallet/history",
      };
    default:
      return {
        title: row.kind,
        body: "",
        href: "/app",
      };
  }
}

export function NotificationDrawer({
  open,
  onClose,
  onDidClose,
}: {
  open: boolean;
  onClose: () => void;
  /** After drawer closes (mark-all-read + parent refresh). */
  onDidClose?: () => void;
}) {
  const { t, locale } = useI18n();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    void fetch("/api/notifications", { credentials: "include", cache: "no-store" })
      .then((r) => r.json())
      .then((j: { notifications?: Row[] }) => {
        setRows(Array.isArray(j.notifications) ? j.notifications : []);
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  async function handleBackdropClose() {
    await fetch("/api/notifications", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    }).catch(() => {});
    onClose();
    onDidClose?.();
  }

  if (!open) return null;

  const loc = locale === "fr" ? "fr-FR" : "en-US";

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        aria-label={t("notifications_title")}
        onClick={() => void handleBackdropClose()}
      />
      <div className="relative mx-auto max-h-[70vh] w-full max-w-lg rounded-t-3xl border border-stone-700/60 bg-stone-950/85 shadow-2xl shadow-black/60 backdrop-blur-xl">
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-stone-700" />
        <div className="border-b border-stone-800 px-4 pb-3 pt-4">
          <h2 className="text-lg font-bold text-stone-50">{t("notifications_title")}</h2>
        </div>
        <div className="max-h-[52vh] overflow-y-auto px-2 py-2">
          {loading ? (
            <p className="py-10 text-center text-sm text-stone-500">
              …
            </p>
          ) : !rows || rows.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-stone-400">
              {t("notifications_empty")}
            </div>
          ) : (
            <ul className="flex flex-col gap-1">
              {rows.map((row) => {
                const { title, body, href } = titleBodyForRow(row, t);
                const unread = row.readAt == null;
                const when = new Date(row.createdAt).toLocaleString(loc, {
                  dateStyle: "short",
                  timeStyle: "short",
                });
                return (
                  <li key={row.id}>
                    <Link
                      href={href}
                      onClick={() => void handleBackdropClose()}
                      className={`block rounded-xl px-3 py-3 transition hover:bg-stone-900/80 ${
                        unread ? "bg-emerald-950/25 ring-1 ring-emerald-800/30" : ""
                      }`}
                    >
                      <p className="text-sm font-semibold text-stone-100">{title}</p>
                      {body ? (
                        <p className="mt-1 text-xs leading-snug text-stone-400">{body}</p>
                      ) : null}
                      <p className="mt-2 text-[10px] text-stone-600">{when}</p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </div>
  );
}
