import Link from "next/link";
import { HUD_PANEL_LG, HudFrame } from "@/components/ui/hud-frame";

const STEP_TONE = [
  "border-cyan-400/45 bg-cyan-500/15 text-cyan-300",
  "border-emerald-400/45 bg-emerald-500/15 text-emerald-300",
  "border-fuchsia-400/45 bg-fuchsia-500/15 text-fuchsia-300",
] as const;

const STEP_LINK = [
  "text-cyan-300 decoration-cyan-400/40 hover:text-cyan-200",
  "text-emerald-300 decoration-emerald-400/40 hover:text-emerald-200",
  "text-fuchsia-300 decoration-fuchsia-400/40 hover:text-fuchsia-200",
] as const;

export function HomeOnboardingBanner({ fr }: { fr: boolean }) {
  const steps = fr
    ? [
        { href: "/app/profile/kyc", label: "Vérifier votre identité (KYC)" },
        { href: "/app/wallet/deposit", label: "Effectuer votre premier dépôt" },
        { href: "/app/community", label: "Rejoindre la communauté" },
      ]
    : [
        { href: "/app/profile/kyc", label: "Verify your identity (KYC)" },
        { href: "/app/wallet/deposit", label: "Make your first deposit" },
        { href: "/app/community", label: "Join the community" },
      ];

  return (
    <HudFrame accent="cyan" className={`${HUD_PANEL_LG} p-4`}>
      <section aria-label={fr ? "Premiers pas" : "Getting started"}>
        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-amber-300/90">
          {fr ? "Premiers pas" : "Getting started"}
        </p>
        <h2 className="mt-1 text-base font-extrabold text-[color:var(--fd-text)]">
          {fr ? "Bienvenue sur McBuleli" : "Welcome to McBuleli"}
        </h2>
        <ol className="mt-3 space-y-2">
          {steps.map((step, i) => (
            <li
              key={step.href}
              className="flex items-center gap-2.5 rounded-xl border border-white/8 bg-[#0a1018]/70 px-2.5 py-2"
            >
              <Step n={i + 1} tone={STEP_TONE[i]} />
              <Link href={step.href} className={`text-xs font-semibold underline ${STEP_LINK[i]}`}>
                {step.label}
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </HudFrame>
  );
}

function Step({ n, tone }: { n: number; tone: string }) {
  return (
    <span
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-black ${tone}`}
    >
      {n}
    </span>
  );
}
