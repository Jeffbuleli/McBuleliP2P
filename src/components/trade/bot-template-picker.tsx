"use client";

import type { BotPlanId } from "@/lib/bot-config";
import type { BotTemplateId } from "@/lib/bot-templates";
import type { Messages } from "@/i18n/messages";
import { BotPlanIcon } from "@/components/trade/bot-strategy-icons";

export type BotTemplateView = {
  id: BotTemplateId;
  planId: BotPlanId;
  style: "day" | "swing";
  symbol: string;
  labelKey: string;
  tagKey: string;
};

function TemplateSparkle() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden>
      <path
        d="M10 2l1.2 4.2L15 7l-3.8 1.2L10 12.5 8.8 8.2 5 7l3.8-0.8L10 2z"
        fill="currentColor"
        opacity="0.9"
      />
    </svg>
  );
}

export function BotTemplatePicker({
  planId,
  templates,
  activeId,
  onSelect,
  t,
}: {
  planId: BotPlanId;
  templates: BotTemplateView[];
  activeId: BotTemplateId | null;
  onSelect: (id: BotTemplateId) => void;
  t: (k: keyof Messages) => string;
}) {
  const rows = templates.filter((tpl) => tpl.planId === planId);
  if (!rows.length) return null;

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-extrabold uppercase tracking-wide text-[color:var(--fd-muted)]">
        {t("bots_tpl_title")}
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {rows.map((tpl) => {
          const active = activeId === tpl.id;
          return (
            <button
              key={tpl.id}
              type="button"
              onClick={() => onSelect(tpl.id)}
              className={`flex min-w-[8.5rem] shrink-0 flex-col items-start gap-1.5 rounded-xl border-2 px-3 py-2.5 text-left transition active:scale-[0.98] ${
                active
                  ? "border-[color:var(--fd-primary)] bg-[color:var(--fd-mint)]/60 shadow-sm"
                  : "border-[color:var(--fd-border)] bg-white hover:border-[color:var(--fd-primary)]/40"
              }`}
            >
              <span className="flex w-full items-center justify-between gap-1">
                <BotPlanIcon planId={tpl.planId} className="h-5 w-5 text-[color:var(--fd-primary)]" />
                <span
                  className={`text-[color:var(--fd-primary)] ${active ? "opacity-100" : "opacity-40"}`}
                >
                  <TemplateSparkle />
                </span>
              </span>
              <span className="text-xs font-bold leading-tight text-[color:var(--fd-text)]">
                {t(tpl.labelKey as keyof Messages)}
              </span>
              <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[9px] font-bold uppercase text-[color:var(--fd-muted)]">
                {t(tpl.tagKey as keyof Messages)} · {tpl.symbol.replace("USDT", "")}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
