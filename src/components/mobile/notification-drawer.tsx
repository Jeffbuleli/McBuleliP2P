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
    case "withdrawal_queued":
      return {
        title: t("notif_withdrawal_queued_title"),
        body: t("notif_withdrawal_queued_body", {
          asset: str("asset") || "—",
        }),
        href: "/app/wallet/history",
      };
    case "withdrawal_claimed":
      return {
        title: t("notif_withdrawal_claimed_title"),
        body: t("notif_withdrawal_claimed_body", {
          asset: str("asset") || "—",
        }),
        href: "/app/wallet/history",
      };
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
    case "deposit_validation_pending":
      return {
        title: t("notif_deposit_validation_pending_title"),
        body: t("notif_deposit_validation_pending_body", {
          asset: str("asset") || "—",
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

function NotifIcon({ kind }: { kind: string }) {
  const base =
    "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg shadow-sm";
  switch (kind) {
    case "deposit_confirmed":
      return (
        <span className={`${base} bg-emerald-100 text-emerald-800`} aria-hidden>
          ↓
        </span>
      );
    case "deposit_validation_pending":
      return (
        <span className={`${base} bg-amber-100 text-amber-800`} aria-hidden>
          ⏳
        </span>
      );
    case "withdrawal_completed":
      return (
        <span className={`${base} bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)]`} aria-hidden>
          ✓
        </span>
      );
    case "withdrawal_rejected":
      return (
        <span className={`${base} bg-rose-100 text-rose-700`} aria-hidden>
          ↩
        </span>
      );
    case "withdrawal_claimed":
      return (
        <span className={`${base} bg-sky-100 text-sky-800`} aria-hidden>
          →
        </span>
      );
  }
  return (
    <span className={`${base} bg-stone-100 text-stone-600`} aria-hidden>
      ↑
    </span>
  );
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
  const unreadCount = rows?.filter((r) => r.readAt == null).length ?? 0;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-stone-900/35 backdrop-blur-[2px]"
        aria-label={t("notifications_title")}
        onClick={() => void handleBackdropClose()}
      />
      <div className="relative mx-auto max-h-[78vh] w-full max-w-lg rounded-t-3xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] shadow-[0_-8px_40px_rgba(28,25,23,0.12)]">
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-stone-300" />
        <div className="flex items-start justify-between gap-3 border-b border-[color:var(--fd-border)] px-4 pb-3 pt-4">
          <div>
            <h2 className="text-lg font-bold text-[color:var(--fd-text)]">
              {t("notifications_title")}
            </h2>
            {unreadCount > 0 ? (
              <p className="mt-0.5 text-xs font-medium text-[color:var(--fd-primary)]">
                {unreadCount} {locale === "fr" ? "non lue(s)" : "unread"}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => void handleBackdropClose()}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--fd-border)] text-[color:var(--fd-muted)] active:scale-95"
            aria-label={t("notifications_title")}
          >
            ✕
          </button>
        </div>
        <div className="max-h-[58vh] overflow-y-auto px-3 py-2">
          {loading ? (
            <div className="space-y-2 py-6" aria-hidden>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-2xl bg-[color:var(--fd-mint)]/50"
                />
              ))}
            </div>
          ) : !rows || rows.length === 0 ? (
            <div className="flex flex-col items-center px-4 py-12 text-center">
              <span
                className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--fd-mint)] text-2xl"
                aria-hidden
              >
                🔔
              </span>
              <p className="text-sm text-[color:var(--fd-muted)]">{t("notifications_empty")}</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2 pb-2">
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
                      className={`flex gap-3 rounded-2xl border px-3 py-3 transition active:scale-[0.99] ${
                        unread
                          ? "border-[color:var(--fd-primary)]/25 bg-[color:var(--fd-mint)]/70"
                          : "border-[color:var(--fd-border)] bg-[color:var(--fd-bg)] hover:bg-[color:var(--fd-mint)]/40"
                      }`}
                    >
                      <NotifIcon kind={row.kind} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold leading-snug text-[color:var(--fd-text)]">
                            {title}
                          </p>
                          {unread ? (
                            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[color:var(--fd-primary)]" />
                          ) : null}
                        </div>
                        {body ? (
                          <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-[color:var(--fd-muted)]">
                            {body}
                          </p>
                        ) : null}
                        <p className="mt-1.5 text-[10px] font-medium text-[color:var(--fd-muted)]/80">
                          {when}
                        </p>
                      </div>
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
