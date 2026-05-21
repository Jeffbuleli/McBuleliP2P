import {
  IconAnalysis,
  IconBot,
  IconChevronRight,
  IconCron,
} from "@/components/trade/bot-visual-icons";

type GuideStep = {
  icon: typeof IconCron;
  label: string;
  hint: string;
};

export function BotsAiGuideVisual({ steps }: { steps: GuideStep[] }) {
  return (
    <div className="fd-card rounded-2xl p-4">
      <div className="flex items-center justify-center gap-1">
        {steps.map((step, i) => (
          <span key={step.label} className="flex items-center gap-1">
            {i > 0 ? (
              <span className="text-[color:var(--fd-muted)] opacity-40" aria-hidden>
                <IconChevronRight size={14} />
              </span>
            ) : null}
            <div
              className="flex flex-col items-center gap-1 rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-mint)]/30 px-3 py-2.5"
              title={step.hint}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[color:var(--fd-primary)] shadow-sm">
                <step.icon size={22} />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
                {step.label}
              </span>
            </div>
          </span>
        ))}
      </div>
    </div>
  );
}

export function BotsAiGuideCard({
  icon: Icon,
  title,
  hint,
}: {
  icon: typeof IconCron;
  title: string;
  hint: string;
}) {
  return (
    <li className="fd-card flex gap-3 rounded-2xl p-4">
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)]"
        aria-hidden
      >
        <Icon size={24} />
      </span>
      <div className="min-w-0">
        <h2 className="text-sm font-bold text-[color:var(--fd-text)]">{title}</h2>
        <p className="mt-1 text-xs leading-snug text-[color:var(--fd-muted)]">{hint}</p>
      </div>
    </li>
  );
}
