"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";
import { AcademyIcon } from "@/components/academy/academy-icon";

/** Above AppBottomNav (app-shell pb 5.25rem). */
const LIVE_BAR_BOTTOM =
  "bottom-[calc(5.25rem+env(safe-area-inset-bottom))]";

function openLiveJoin(url: string, e: React.MouseEvent) {
  e.preventDefault();
  window.open(url, "_blank", "noopener,noreferrer");
}

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
  waitingForHost,
}: {
  canJoin: boolean;
  isHost: boolean;
  waitingForHost?: boolean;
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
      className={`fixed inset-x-0 ${LIVE_BAR_BOTTOM} z-50 border-t border-[color:var(--fd-border)] bg-white/95 px-2 pb-2 pt-2 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur-md`}
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
              onClick={(e) => openLiveJoin(joinVideoHref, e)}
              className="flex min-w-0 flex-1 flex-col items-center rounded-xl bg-[#305f33] px-2 py-2 text-center text-white shadow-md active:scale-[0.98]"
            >
              <AcademyIcon name="video" className="h-5 w-5 !text-white" />
              <span className="mt-0.5 truncate text-[10px] font-extrabold">
                {isHost ? t("academy_oc_join_host") : t("academy_join_live")}
              </span>
            </a>
            <a
              href={isHost ? joinHostHref : joinAudioHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) =>
                openLiveJoin(isHost ? joinHostHref : joinAudioHref, e)
              }
              className="flex min-w-[3.25rem] flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] font-bold text-[#305f33]"
            >
              <AcademyIcon name={isHost ? "mic" : "audio"} className="h-5 w-5" />
              {isHost ? t("academy_oc_host_alt") : t("academy_oc_audio_only")}
            </a>
          </>
        ) : (
          <span className="flex-1 py-2 text-center text-[10px] font-semibold text-[color:var(--fd-muted)]">
            {waitingForHost ? t("academy_oc_waiting_host") : t("academy_oc_waiting")}
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
          <AcademyIcon name="chat" className="h-5 w-5" />
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
            <AcademyIcon name="tutor" className="h-5 w-5" />
            {t("academy_oc_ai")}
          </button>
        ) : null}
      </div>
    </nav>
  );
}
