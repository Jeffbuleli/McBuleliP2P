"use client";

import { useI18n } from "@/components/i18n-provider";

export function AcademyLiveEmbed({
  joinUrl,
  title,
}: {
  joinUrl: string;
  title: string;
}) {
  const { t } = useI18n();

  return (
    <section className="space-y-2">
      <p className="text-[10px] font-bold text-[color:var(--fd-muted)]">
        {t("academy_live_embed_hint")}
      </p>
      <div className="aspect-video w-full overflow-hidden rounded-xl border border-[color:var(--fd-border)] bg-black">
        <iframe
          src={joinUrl}
          title={title}
          className="h-full w-full"
          allow="camera; microphone; fullscreen; display-capture"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <a
        href={joinUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block text-center text-xs font-bold text-[color:var(--fd-primary)] underline"
      >
        {t("academy_live_embed_fallback")} ↗
      </a>
    </section>
  );
}
