import Link from "next/link";

type Action = {
  href: string;
  labelFr: string;
  labelEn: string;
  accent?: boolean;
  live?: boolean;
};

const ACTIONS: Action[] = [
  { href: "/app/deposit", labelFr: "Dépôt", labelEn: "Deposit", accent: true },
  { href: "/app/p2p", labelFr: "P2P", labelEn: "P2P" },
  { href: "/app/trade/bots", labelFr: "Trade", labelEn: "Trade" },
  { href: "/app/community", labelFr: "Communauté", labelEn: "Community" },
  { href: "/app/community/formations", labelFr: "Lives", labelEn: "Live" },
  { href: "/app/community/signals", labelFr: "Signaux", labelEn: "Signals" },
];

export function HomeQuickActions({
  fr,
  liveActive,
}: {
  fr: boolean;
  liveActive?: boolean;
}) {
  return (
    <section className="fd-card p-3" aria-label={fr ? "Actions rapides" : "Quick actions"}>
      <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
        {fr ? "Actions rapides" : "Quick actions"}
      </h2>
      <div className="grid grid-cols-3 gap-2">
        {ACTIONS.map((action) => {
          const isLiveTile = action.href === "/app/community/formations" && liveActive;
          const label = fr ? action.labelFr : action.labelEn;
          return (
            <Link
              key={action.href}
              href={action.href}
              className={`relative flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-2xl border px-2 py-2.5 text-center transition active:scale-[0.98] ${
                action.accent
                  ? "border-[color:var(--fd-primary)] bg-[color:var(--fd-mint)]"
                  : isLiveTile
                    ? "border-rose-200 bg-rose-50"
                    : "border-[color:var(--fd-border)] bg-white hover:bg-[color:var(--fd-mint)]/40"
              }`}
            >
              {isLiveTile ? (
                <span
                  className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white"
                  aria-hidden
                />
              ) : null}
              <ActionIcon href={action.href} accent={action.accent} live={isLiveTile} />
              <span
                className={`text-[11px] font-extrabold leading-tight ${
                  action.accent
                    ? "text-[color:var(--fd-primary)]"
                    : isLiveTile
                      ? "text-rose-700"
                      : "text-[color:var(--fd-text)]"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function ActionIcon({
  href,
  accent,
  live,
}: {
  href: string;
  accent?: boolean;
  live?: boolean;
}) {
  const cls = accent
    ? "text-[color:var(--fd-primary)]"
    : live
      ? "text-rose-600"
      : "text-[color:var(--fd-primary)]";

  if (href === "/app/deposit") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={cls} aria-hidden>
        <path d="M12 4v12M7 11l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M5 20h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (href === "/app/p2p") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={cls} aria-hidden>
        <path d="M7 16V4L3 8m4-4 4 4M17 8v12l4-4m-4 4-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (href.includes("/trade")) {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={cls} aria-hidden>
        <path d="M4 18l4-8 4 4 4-10 4 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (href === "/app/community") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={cls} aria-hidden>
        <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="2" />
        <circle cx="16" cy="10" r="2.5" stroke="currentColor" strokeWidth="2" />
        <path d="M4 19c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (href.includes("formations")) {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={cls} aria-hidden>
        <rect x="2" y="5" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="2" />
        <path d="M16 8l6-3v10l-6-3" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className={cls} aria-hidden>
      <path d="M4 18l4-8 4 4 4-10 4 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
