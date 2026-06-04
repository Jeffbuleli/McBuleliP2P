"use client";

import { useI18n } from "@/components/i18n-provider";
import { ACADEMY_JITSI_APP_NAME } from "@/lib/academy-jitsi-brand";

export function AcademyLiveEmbed({
  joinUrl,
  title,
}: {
  joinUrl: string;
  title: string;
}) {
  const { t } = useI18n();

  return (
    <section className="overflow-hidden rounded-2xl border-2 border-[#305f33] bg-[#0f1f12] shadow-lg">
      <div className="flex items-center gap-2 border-b border-[#305f33]/60 bg-gradient-to-r from-[#305f33] to-[#1a4a22] px-3 py-2.5">
        <span className="flex h-2 w-2 animate-pulse rounded-full bg-emerald-400" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-extrabold uppercase tracking-wide text-white/90">
            {ACADEMY_JITSI_APP_NAME}
          </p>
          <p className="truncate text-xs font-bold text-white">{title}</p>
        </div>
      </div>
      <p className="px-3 pt-2 text-[10px] font-medium text-emerald-100/80">
        {t("academy_live_embed_hint")}
      </p>
      <div className="aspect-video w-full bg-black p-2 pt-1">
        <iframe
          src={joinUrl}
          title={title}
          className="h-full w-full rounded-lg"
          allow="camera; microphone; fullscreen; display-capture"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <a
        href={joinUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block border-t border-[#305f33]/40 py-2.5 text-center text-xs font-bold text-emerald-200 underline decoration-emerald-400/60"
      >
        {t("academy_live_embed_fallback")} ↗
      </a>
    </section>
  );
}
