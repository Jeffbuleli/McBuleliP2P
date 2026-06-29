"use client";

import { AcademyIcon, type AcademyIconName } from "@/components/academy/academy-icon";
import { useI18n } from "@/components/i18n-provider";
import type { Messages } from "@/i18n/messages";

function Step({
  icon,
  label,
  active,
}: {
  icon: AcademyIconName;
  label: string;
  active?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center text-center">
      <span
        className={`flex h-11 w-11 items-center justify-center rounded-full shadow-sm ring-2 ${
          active
            ? "bg-[#305f33] ring-[#305f33]/30"
            : "bg-white ring-[#305f33]/15"
        }`}
      >
        <AcademyIcon
          name={icon}
          className={`h-5 w-5 ${active ? "!text-white" : "text-[#305f33]"}`}
        />
      </span>
      <p className="mt-1.5 text-[9px] font-extrabold leading-tight text-[#1a2e1c]">
        {label}
      </p>
    </div>
  );
}

/** Schéma visuel : cette page (chat/IA) → vidéo en bas. */
export function AcademyLiveCompanionGuide() {
  const { t } = useI18n();
  return (
    <div
      className="rounded-2xl border border-[#305f33]/20 bg-gradient-to-br from-[#e8f3ee] to-white px-3 py-3"
      aria-label={t("academy_live_companion_aria")}
    >
      <div className="flex items-center justify-between gap-1">
        <Step icon="chat" label={t("academy_live_companion_chat")} />
        <Step icon="tutor" label={t("academy_live_companion_ai")} />
        <Step icon="live" label={t("academy_live_companion_here")} active />
      </div>
      <div className="my-2 flex justify-center" aria-hidden>
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#305f33]/50" fill="none">
          <path
            d="M12 5v14M12 19l-4-4M12 19l4-4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="flex justify-center">
        <div className="flex min-w-[5.5rem] flex-col items-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#305f33] shadow-md">
            <AcademyIcon name="video" className="h-6 w-6 !text-white" />
          </span>
          <p className="mt-1.5 text-[9px] font-extrabold text-[#305f33]">
            {t("academy_live_companion_video_btn")}
          </p>
        </div>
      </div>
    </div>
  );
}

const TIP_ICONS = [
  ["mic", "academy_live_tip_mic"],
  ["camera", "academy_live_tip_camera"],
  ["screen", "academy_live_tip_screen"],
  ["hand", "academy_live_tip_hand"],
  ["signal", "academy_live_tip_data"],
] as const;

/** Conseils live - icônes + libellés courts. */
export function AcademyLiveTipsGrid() {
  const { t } = useI18n();
  return (
    <div
      className="rounded-xl border border-[color:var(--fd-border)] bg-white px-2 py-3"
      aria-label={t("academy_live_tips_title")}
    >
      <p className="mb-2 text-center text-[9px] font-extrabold uppercase tracking-wide text-[color:var(--fd-muted)]">
        {t("academy_live_tips_title")}
      </p>
      <div className="flex items-start justify-between gap-0.5">
        {TIP_ICONS.map(([icon, key]) => (
          <div key={key} className="flex min-w-0 flex-1 flex-col items-center text-center">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e8f3ee]">
              <AcademyIcon name={icon} className="h-4 w-4 text-[#305f33]" />
            </span>
            <p className="mt-1 text-[8px] font-bold leading-tight text-[#1a2e1c]">
              {t(key as keyof Messages)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AcademyLiveStatusBanner({
  variant,
}: {
  variant: "host_start" | "waiting_host";
}) {
  const { t } = useI18n();
  const isHost = variant === "host_start";
  return (
    <div
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
        isHost
          ? "border-2 border-amber-300 bg-amber-50"
          : "border-2 border-[#305f33]/25 bg-white"
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          isHost ? "bg-amber-200" : "bg-[#e8f3ee]"
        }`}
      >
        <AcademyIcon
          name={isHost ? "video" : "calendar"}
          className={`h-5 w-5 ${isHost ? "text-amber-900" : "text-[#305f33]"}`}
        />
      </span>
      <p
        className={`text-xs font-extrabold leading-snug ${
          isHost ? "text-amber-950" : "text-[#305f33]"
        }`}
      >
        {t(isHost ? "academy_live_host_start_hint" : "academy_live_waiting_host")}
      </p>
    </div>
  );
}
