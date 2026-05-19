"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Messages } from "@/i18n/messages";
import { useI18n } from "@/components/i18n-provider";
import { IconBell, IconClose, NotifKindIcon } from "@/components/icons/flow-icons";
import { StatusPill } from "@/components/wallet/transaction-progress";

type Row = {
  id: string;
  kind: string;
  payload: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
};

function notifMeta(
  row: Row,
  t: (key: keyof Messages, vars?: Record<string, string | number>) => string,
): {
  title: string;
  body: string;
  href: string;
  pill: { variant: "success" | "failed" | "pending" | "processing"; label: string };
} {
  const p = row.payload ?? {};
  const str = (k: string) => (typeof p[k] === "string" ? (p[k] as string) : "");
  const asset = str("asset") || "—";
  const amount = str("amount") || str("net") || "";

  switch (row.kind) {
    case "withdrawal_queued":
      return {
        title: t("notif_withdrawal_queued_title", { asset }),
        body: t("notif_withdrawal_queued_body", { asset, amount }),
        href: "/app/wallet/history",
        pill: { variant: "pending", label: t("status_ui_pending") },
      };
    case "withdrawal_claimed":
      return {
        title: t("notif_withdrawal_claimed_title", { asset }),
        body: t("notif_withdrawal_claimed_body", { asset, amount }),
        href: "/app/wallet/history",
        pill: { variant: "processing", label: t("status_ui_processing") },
      };
    case "withdrawal_completed":
      return {
        title: t("notif_withdrawal_completed_title", { asset }),
        body: t("notif_withdrawal_completed_body", { asset, amount }),
        href: "/app/wallet/history",
        pill: { variant: "success", label: t("status_ui_success") },
      };
    case "withdrawal_rejected":
      return {
        title: t("notif_withdrawal_rejected_title", { asset }),
        body: t("notif_withdrawal_rejected_body", {
          asset,
          reason: str("reason") || "—",
        }),
        href: "/app/wallet/history",
        pill: { variant: "failed", label: t("status_ui_failed") },
      };
    case "deposit_confirmed":
      return {
        title: t("notif_deposit_confirmed_title", { asset }),
        body: t("notif_deposit_confirmed_body", {
          asset,
          amount: amount || "—",
        }),
        href: "/app/wallet/history",
        pill: { variant: "success", label: t("status_ui_success") },
      };
    case "deposit_validation_pending":
      return {
        title: t("notif_deposit_validation_pending_title", { asset }),
        body: t("notif_deposit_validation_pending_body", { asset }),
        href: "/app/wallet/history",
        pill: { variant: "pending", label: t("status_ui_pending") },
      };
    default:
      return {
        title: row.kind,
        body: "",
        href: "/app",
        pill: { variant: "pending", label: t("status_ui_pending") },
      };
  }
}

function NotifIconWrap({ kind }: { kind: string }) {
  const tone =
    kind === "deposit_confirmed" || kind === "withdrawal_completed"
      ? "bg-emerald-100 text-emerald-800"
      : kind === "withdrawal_rejected"
        ? "bg-rose-100 text-rose-800"
        : kind === "withdrawal_claimed"
          ? "bg-sky-100 text-sky-800"
          : "bg-amber-100 text-amber-900";
  return (
    <span
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-sm ${tone}`}
      aria-hidden
    >
      <NotifKindIcon kind={kind} className="h-5 w-5" />
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
  onDidClose?: () => void;
}) {
  const { t, locale } = useI18n();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

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

  if (!open || !mounted) return null;

  const loc = locale === "fr" ? "fr-FR" : "en-US";
  const unreadCount = rows?.filter((r) => r.readAt == null).length ?? 0;

  const panel = (
    <div className="fixed inset-0 z-[9999] flex flex-col justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-[2px]"
        aria-label={t("notifications_title")}
        onClick={() => void handleBackdropClose()}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="notif-drawer-title"
        className="notif-drawer-panel relative mx-auto max-h-[82vh] w-full max-w-lg rounded-t-3xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] shadow-[0_-12px_48px_rgba(28,25,23,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-stone-300" />
        <div className="flex items-start justify-between gap-3 border-b border-[color:var(--fd-border)] px-4 pb-3 pt-4">
          <div>
            <h2 id="notif-drawer-title" className="text-lg font-bold text-[color:var(--fd-text)]">
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
            <IconClose className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[62vh] overflow-y-auto px-3 py-2">
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
                className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)]"
                aria-hidden
              >
                <IconBell className="h-7 w-7" />
              </span>
              <p className="text-sm text-[color:var(--fd-muted)]">{t("notifications_empty")}</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2 pb-2">
              {rows.map((row) => {
                const { title, body, href, pill } = notifMeta(row, t);
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
                      <NotifIconWrap kind={row.kind} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold leading-snug text-[color:var(--fd-text)]">
                            {title}
                          </p>
                          <StatusPill variant={pill.variant} label={pill.label} />
                        </div>
                        {body ? (
                          <p className="mt-0.5 font-mono text-xs tabular-nums text-[color:var(--fd-muted)]">
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

  return createPortal(panel, document.body);
}
