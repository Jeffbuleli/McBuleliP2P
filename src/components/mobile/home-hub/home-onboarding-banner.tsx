import Link from "next/link";

export function HomeOnboardingBanner({ fr }: { fr: boolean }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[color:var(--fd-primary)]/20 bg-gradient-to-br from-[color:var(--fd-mint)] to-white p-4 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--fd-primary)]">
        {fr ? "Premiers pas" : "Getting started"}
      </p>
      <h2 className="mt-1 text-base font-extrabold text-[color:var(--fd-text)]">
        {fr ? "Bienvenue sur McBuleli" : "Welcome to McBuleli"}
      </h2>
      <ol className="mt-3 space-y-2 text-xs font-semibold text-[color:var(--fd-text)]">
        <li className="flex items-center gap-2">
          <Step n={1} />
          <Link href="/app/profile/kyc" className="underline decoration-[color:var(--fd-primary)]/40">
            {fr ? "Vérifier votre identité (KYC)" : "Verify your identity (KYC)"}
          </Link>
        </li>
        <li className="flex items-center gap-2">
          <Step n={2} />
          <Link href="/app/deposit" className="underline decoration-[color:var(--fd-primary)]/40">
            {fr ? "Effectuer votre premier dépôt" : "Make your first deposit"}
          </Link>
        </li>
        <li className="flex items-center gap-2">
          <Step n={3} />
          <Link href="/app/community" className="underline decoration-[color:var(--fd-primary)]/40">
            {fr ? "Rejoindre la communauté" : "Join the community"}
          </Link>
        </li>
      </ol>
    </section>
  );
}

function Step({ n }: { n: number }) {
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[color:var(--fd-primary)] text-[10px] font-black text-white">
      {n}
    </span>
  );
}
