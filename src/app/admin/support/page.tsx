"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { UserAvatarMark } from "@/components/profile/user-avatar-mark";
import type { SupportThreadListItem } from "@/lib/support-service";
import { adminCls, AdminBackLink, AdminPageHeader } from "@/components/admin/admin-ui";

export default function AdminSupportInboxPage() {
  const { t, locale } = useI18n();
  const [rows, setRows] = useState<SupportThreadListItem[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const loc = locale === "fr" ? "fr-FR" : "en-US";

  const load = useCallback(async () => {
    setErr(null);
    const res = await fetch("/api/admin/support/threads", {
      credentials: "include",
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setRows([]);
      setErr(typeof data.error === "string" ? data.error : "Forbidden");
      return;
    }
    setRows((data.threads as SupportThreadListItem[]) ?? []);
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 12000);
    return () => window.clearInterval(id);
  }, [load]);

  return (
    <div className={adminCls.page}>
      <AdminBackLink>{t("admin_nav_dashboard")}</AdminBackLink>
      <AdminPageHeader title={t("admin_support_inbox")} subtitle={t("support_subtitle")} />

      {err ? <p className={adminCls.error}>{err}</p> : null}

      {!rows?.length ? (
        <p className={adminCls.empty}>{t("admin_support_none")}</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.id} className={adminCls.card}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <UserAvatarMark
                    email={r.userLabel}
                    avatarUrl={r.userAvatarUrl}
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-[color:var(--fd-text)]">{r.userLabel}</p>
                    <p className={`mt-0.5 truncate text-xs ${adminCls.muted}`}>{r.preview}</p>
                    <p className={`mt-1 text-[10px] ${adminCls.muted}`}>
                      {new Date(r.lastMessageAt).toLocaleString(loc)}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  {r.unreadCount > 0 ? (
                    <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">
                      {r.unreadCount}
                    </span>
                  ) : null}
                  <Link
                    href={`/admin/support/${encodeURIComponent(r.id)}`}
                    className={adminCls.btnPrimary}
                  >
                    {t("admin_support_open")}
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
