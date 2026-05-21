import Link from "next/link";
import type { ReactNode } from "react";
import type { Messages } from "@/i18n/messages";
import { IconAnalysis } from "@/components/trade/bot-visual-icons";

/** Guide IA + bot — icon button for page header. */
export function BotsAiGuideButton({
  t,
}: {
  t: (key: keyof Messages) => string;
}) {
  return (
    <Link
      href="/app/trade/bots/guide"
      className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[color:var(--fd-border)] bg-white text-[color:var(--fd-primary)] shadow-sm transition hover:bg-[color:var(--fd-mint)]/50"
      title={t("bots_ai_doc_link")}
      aria-label={t("bots_ai_doc_link")}
    >
      <IconAnalysis size={18} />
      <span
        className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[color:var(--fd-primary)] text-[8px] font-bold leading-none text-white"
        aria-hidden
      >
        i
      </span>
    </Link>
  );
}

export type BotsDisclaimerLabels = {
  aria: string;
  orders: string;
  custody: string;
  nfa: string;
};

export function BotsDisclaimerStrip({ labels }: { labels: BotsDisclaimerLabels }) {
  return (
    <div
      className="mt-6 flex items-center justify-center gap-3 rounded-xl border border-[color:var(--fd-border)]/80 bg-white/80 px-3 py-2.5"
      role="note"
      aria-label={labels.aria}
    >
      <DisclaimerChip
        icon={
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M7 12h10M7 8h6M7 16h8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <rect
              x="4"
              y="5"
              width="16"
              height="14"
              rx="2"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        }
        title={labels.orders}
        tone="mint"
      />
      <DisclaimerChip
        icon={
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M8 11V8a4 4 0 118 0v3M6 11h12v9H6v-9z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        }
        title={labels.custody}
        tone="stone"
      />
      <DisclaimerChip
        icon={
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M12 8v5M12 16h.01"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
          </svg>
        }
        title={labels.nfa}
        tone="amber"
      />
    </div>
  );
}

function DisclaimerChip({
  icon,
  title,
  tone,
}: {
  icon: ReactNode;
  title: string;
  tone: "mint" | "stone" | "amber";
}) {
  const bg =
    tone === "mint"
      ? "bg-[color:var(--fd-mint)]/60 text-[color:var(--fd-primary)]"
      : tone === "amber"
        ? "bg-amber-50 text-amber-800"
        : "bg-stone-50 text-stone-600";
  return (
    <span
      className={`flex h-9 w-9 items-center justify-center rounded-lg ${bg}`}
      title={title}
    >
      {icon}
      <span className="sr-only">{title}</span>
    </span>
  );
}
