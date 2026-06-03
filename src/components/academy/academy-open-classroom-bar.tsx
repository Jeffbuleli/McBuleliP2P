"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";

export type OpenClassroomPanel = "chat" | "tutor" | null;

export function AcademyOpenClassroomBar({
  canJoin,
  isHost,
  joinVideoHref,
  joinAudioHref,
  joinHostHref,
  activePanel,
  onPanel,
  backHref,
  tutorEnabled,
}: {
  canJoin: boolean;
  isHost: boolean;
  joinVideoHref: string;
  joinAudioHref: string;
  joinHostHref: string;
  activePanel: OpenClassroomPanel;
  onPanel: (panel: OpenClassroomPanel) => void;
  backHref: string;
  tutorEnabled: boolean;
}) {
  const { t } = useI18n();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[color:var(--fd-border)] bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md"
      aria-label={t("academy_oc_bar_label")}
    >
      <div className="mx-auto flex max-w-lg items-end justify-between gap-1">
        <Link
          href={backHref}
          className="flex min-w-[3.25rem] flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-bold text-[color:var(--fd-muted)]"
        >
          <span className="text-base leading-none" aria-hidden>
            ←
          </span>
          {t("academy_oc_leave")}
        </Link>

        {canJoin ? (
          <>
            <a
              href={joinVideoHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-w-0 flex-1 flex-col items-center rounded-xl bg-[#305f33] px-2 py-2 text-center text-white shadow-md active:scale-[0.98]"
            >
              <span className="text-lg leading-none" aria-hidden>
                ▶
              </span>
              <span className="mt-0.5 truncate text-[10px] font-extrabold">
                {isHost ? t("academy_oc_join_host") : t("academy_join_live")}
              </span>
            </a>
            <a
              href={isHost ? joinHostHref : joinAudioHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-w-[3.25rem] flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-bold text-[#305f33]"
            >
              <span className="text-base leading-none" aria-hidden>
                {isHost ? "🎙" : "🔊"}
              </span>
              {isHost ? t("academy_oc_host_alt") : t("academy_oc_audio_only")}
            </a>
          </>
        ) : (
          <span className="flex-1 py-2 text-center text-[10px] font-semibold text-[color:var(--fd-muted)]">
            {t("academy_oc_waiting")}
          </span>
        )}

        <button
          type="button"
          onClick={() => onPanel(activePanel === "chat" ? null : "chat")}
          className={`flex min-w-[3.25rem] flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-bold ${
            activePanel === "chat"
              ? "bg-[#e8f3ee] text-[#305f33]"
              : "text-[color:var(--fd-muted)]"
          }`}
        >
          <span className="text-base leading-none" aria-hidden>
            💬
          </span>
          {t("academy_oc_chat")}
        </button>

        {tutorEnabled ? (
          <button
            type="button"
            onClick={() => onPanel(activePanel === "tutor" ? null : "tutor")}
            className={`flex min-w-[3.25rem] flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-bold ${
              activePanel === "tutor"
                ? "bg-[#e8f3ee] text-[#305f33]"
                : "text-[color:var(--fd-muted)]"
            }`}
          >
            <span className="text-base leading-none" aria-hidden>
              ✨
            </span>
            {t("academy_oc_ai")}
          </button>
        ) : null}
      </div>
    </nav>
  );
}
