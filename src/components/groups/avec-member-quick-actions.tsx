"use client";

import { useI18n } from "@/components/i18n-provider";
import {
  IlluCollectiveVote,
  IlluMeeting,
  IlluTreasury,
} from "@/components/groups/avec-illustrations";

/**
 * Single member journey on Vue - same labels as tabs (no Épargner/Crédit clash).
 * 3 acts: save in meeting, credit in treasury, decide in dialogue.
 */
export function AvecMemberQuickActions({
  onGoMeeting,
  onGoTreasury,
  onGoDialogue,
  voteLive,
}: {
  onGoMeeting: () => void;
  onGoTreasury: () => void;
  onGoDialogue: () => void;
  voteLive?: boolean;
}) {
  const { t } = useI18n();

  const tiles = [
    {
      id: "meeting",
      label: t("avec_tab_meeting"),
      hint: t("avec_do_save"),
      onClick: onGoMeeting,
      Illu: IlluMeeting,
    },
    {
      id: "treasury",
      label: t("avec_tab_treasury"),
      hint: t("avec_do_credit"),
      onClick: onGoTreasury,
      Illu: IlluTreasury,
    },
    {
      id: "dialogue",
      label: t("avec_tab_dialogue"),
      hint: voteLive ? t("avec_do_vote_live") : t("avec_do_decide"),
      onClick: onGoDialogue,
      Illu: IlluCollectiveVote,
      pulse: voteLive,
    },
  ] as const;

  return (
    <div className="grid grid-cols-3 gap-2">
      {tiles.map((x) => (
        <button
          key={x.id}
          type="button"
          onClick={x.onClick}
          className={`relative flex flex-col items-center gap-1 rounded-2xl border px-1.5 py-3 text-center transition active:scale-[0.98] ${
            "pulse" in x && x.pulse
              ? "border-violet-300 bg-violet-50/80 ring-1 ring-violet-200"
              : "border-[color:var(--fd-border)] bg-[color:var(--fd-card)]"
          }`}
        >
          {"pulse" in x && x.pulse ? (
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-violet-600" aria-hidden />
          ) : null}
          <x.Illu className="h-11 w-16 text-[color:var(--fd-primary)]" />
          <span className="text-[10px] font-black uppercase tracking-wide text-[color:var(--fd-text)]">
            {x.label}
          </span>
          <span className="text-[9px] font-semibold text-[color:var(--fd-muted)]">{x.hint}</span>
        </button>
      ))}
    </div>
  );
}
