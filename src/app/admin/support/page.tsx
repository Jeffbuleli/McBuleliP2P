"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { UserAvatarMark } from "@/components/profile/user-avatar-mark";
import type { SupportThreadListItem } from "@/lib/support-service";

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
    <div className="space-y-4">
      <Link href="/admin" className="text-sm text-amber-200 underline">
        ← {t("admin_nav_dashboard")}
      </Link>
      <h2 className="text-lg font-bold text-white">{t("admin_support_inbox")}</h2>
      <p className="text-sm text-stone-400">{t("support_subtitle")}</p>

      {err ? (
        <p className="rounded-lg bg-rose-950/50 px-3 py-2 text-sm text-rose-100">{err}</p>
      ) : null}

      {!rows?.length ? (
        <p className="text-sm text-stone-400">{t("admin_support_none")}</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li
              key={r.id}
              className="rounded-xl border border-stone-700 bg-stone-900/80 p-4 text-sm text-stone-100"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <UserAvatarMark
                    email={r.userLabel}
                    avatarUrl={r.userAvatarUrl}
                  />
                  <div className="min-w-0">
                    <p className="font-semibold">{r.userLabel}</p>
                    <p className="mt-0.5 truncate text-xs text-stone-400">{r.preview}</p>
                    <p className="mt-1 text-[10px] text-stone-500">
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
                    className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white"
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
