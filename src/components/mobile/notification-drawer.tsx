"use client";

import { useEffect } from "react";
import { useI18n } from "@/components/i18n-provider";

export function NotificationDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useI18n();

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      document.body.style.overflow = "hidden";
    });
    return () => {
      cancelAnimationFrame(id);
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative mx-auto max-h-[70vh] w-full max-w-lg rounded-t-3xl border border-stone-700/60 bg-stone-950/85 shadow-2xl shadow-black/60 backdrop-blur-xl">
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-stone-700" />
        <div className="border-b border-stone-800 px-4 pb-3 pt-4">
          <h2 className="text-lg font-bold text-stone-50">{t("notifications_title")}</h2>
        </div>
        <div className="px-4 py-10 text-center text-sm text-stone-400">
          {t("notifications_empty")}
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </div>
  );
}
