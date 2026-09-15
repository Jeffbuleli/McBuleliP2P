"use client";

import { useI18n } from "@/components/i18n-provider";

function IconSave({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 4v12m0 0l-4-4m4 4l4-4M5 19h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconLoan({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
function IconRepay({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 12a8 8 0 0114.5-4.5M20 12a8 8 0 01-14.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M18 3v5h-5M6 21v-5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconHistory({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8v4l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function AvecMemberQuickActions({
  groupId,
  onGoMeeting,
  onGoTreasury,
}: {
  groupId: string;
  onGoMeeting: () => void;
  onGoTreasury: () => void;
}) {
  const { t } = useI18n();
  const btn =
    "flex flex-col items-center gap-1 rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-2 py-2.5 text-center active:scale-[0.98]";

  return (
    <div className="grid grid-cols-4 gap-2">
      <button type="button" className={btn} onClick={onGoMeeting}>
        <IconSave className="h-5 w-5 text-[color:var(--fd-primary)]" />
        <span className="text-[9px] font-bold text-[color:var(--fd-text)]">{t("avec_action_save")}</span>
      </button>
      <button type="button" className={btn} onClick={onGoTreasury}>
        <IconLoan className="h-5 w-5 text-[color:var(--fd-primary)]" />
        <span className="text-[9px] font-bold text-[color:var(--fd-text)]">{t("avec_action_loan")}</span>
      </button>
      <button type="button" className={btn} onClick={onGoTreasury}>
        <IconRepay className="h-5 w-5 text-[color:var(--fd-primary)]" />
        <span className="text-[9px] font-bold text-[color:var(--fd-text)]">{t("avec_action_repay")}</span>
      </button>
      <button
        type="button"
        className={btn}
        onClick={() => document.getElementById("avec-passport")?.scrollIntoView({ behavior: "smooth" })}
      >
        <IconHistory className="h-5 w-5 text-[color:var(--fd-primary)]" />
        <span className="text-[9px] font-bold text-[color:var(--fd-text)]">{t("avec_action_history")}</span>
      </button>
      <span className="sr-only">{groupId}</span>
    </div>
  );
}
