import type { ComponentType } from "react";
import {
  IconArrow,
  IconP2P,
  IconSmartphone,
  IconWallet,
} from "@/components/landing/landing-icons";

type StepDef = {
  label: string;
};

function FlowNode({
  icon: Icon,
  label,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--fd-primary)] text-white shadow-md shadow-[color:var(--fd-primary)]/25">
        <Icon className="h-5 w-5" />
      </div>
      <p className="max-w-[4.5rem] text-center text-[10px] font-extrabold leading-snug text-[color:var(--fd-text)] sm:max-w-none sm:text-[11px]">
        {label}
      </p>
    </div>
  );
}

export function LandingFlowDiagram({ steps }: { steps: StepDef[] }) {
  const icons = [IconWallet, IconSmartphone, IconP2P, IconSmartphone] as const;

  return (
    <div className="relative rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-3 py-5 sm:px-6">
      <svg
        className="pointer-events-none absolute inset-x-6 top-[2.65rem] hidden h-3 w-[calc(100%-3rem)] sm:block"
        viewBox="0 0 400 12"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M0 6 H400"
          stroke="var(--fd-primary)"
          strokeWidth="2"
          strokeOpacity="0.18"
          strokeDasharray="8 6"
        />
      </svg>
      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        {steps.map((step, i) => (
          <div key={step.label} className="relative flex flex-col items-center">
            <FlowNode icon={icons[i] ?? IconWallet} label={step.label} />
            {i < steps.length - 1 ? (
              <IconArrow className="mx-auto mt-3 h-4 w-4 text-[color:var(--fd-primary)]/40 sm:hidden" />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
