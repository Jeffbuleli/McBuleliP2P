import Link from "next/link";
import { BotsAiGuideCard, BotsAiGuideVisual } from "@/components/trade/bots-ai-guide-visual";
import {
  IconAnalysis,
  IconBot,
  IconCron,
  IconXLogo,
} from "@/components/trade/bot-visual-icons";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";

export default async function BotsAiGuidePage() {
  const locale = await getLocale();
  const d = getDictionary(locale);

  const flowSteps = [
    { icon: IconCron, label: d.bots_coord_cron, hint: d.bots_ai_doc_flow_step_cron },
    { icon: IconAnalysis, label: d.bots_coord_smart, hint: d.bots_ai_doc_flow_step_ta },
    { icon: IconXLogo, label: d.bots_coord_ai, hint: d.bots_ai_doc_flow_step_ai },
    { icon: IconBot, label: d.bots_coord_bot, hint: d.bots_ai_doc_flow_step_bot },
  ];

  const cards = [
    { icon: IconCron, title: d.bots_ai_doc_start_title },
    { icon: IconAnalysis, title: d.bots_ai_doc_binance_title },
    { icon: IconBot, title: d.bots_ai_doc_okx_title },
  ];

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-12 pt-1">
      <Link
        href="/app/trade/bots"
        className="inline-flex items-center gap-1 text-sm font-semibold text-[color:var(--fd-primary)] underline-offset-4 hover:underline"
        aria-label={d.bots_title}
      >
        <span aria-hidden>←</span>
        <span className="sr-only">{d.bots_title}</span>
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M14 6L8 12l6 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </Link>

      <header className="space-y-1">
        <h1 className="text-xl font-extrabold tracking-tight text-[color:var(--fd-text)]">
          {d.bots_ai_doc_title}
        </h1>
        <p className="text-xs text-[color:var(--fd-muted)]">{d.bots_ai_doc_intro_short}</p>
      </header>

      <BotsAiGuideVisual steps={flowSteps} />

      <ul className="space-y-3">
        {cards.map((c) => (
          <BotsAiGuideCard key={c.title} icon={c.icon} title={c.title} />
        ))}
      </ul>
    </div>
  );
}
