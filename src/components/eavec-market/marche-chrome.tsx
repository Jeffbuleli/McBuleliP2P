"use client";

import Link from "next/link";

export function MarcheChrome({
  title,
  fr,
  showSell = true,
}: {
  title?: string;
  fr: boolean;
  showSell?: boolean;
}) {
  return (
    <header className="mk-chrome">
      <div className="min-w-0">
        <Link href="/app/marche" className="mk-chrome-brand">
          Marché
        </Link>
        {title ? (
          <p className="truncate text-[11px] font-semibold text-[color:var(--mk-muted)]">
            {title}
          </p>
        ) : null}
      </div>
      <div className="mk-chrome-actions">
        {showSell ? (
          <Link
            href="/app/marche/new"
            className="inline-flex min-h-10 items-center rounded-full bg-[color:var(--mk-ink)] px-3.5 text-xs font-bold text-[#f4f7f6]"
          >
            {fr ? "Vendre" : "Sell"}
          </Link>
        ) : null}
        <Link href="/app/marche/orders" className="mk-icon-btn" aria-label={fr ? "Commandes" : "Orders"}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M7 7h14l-1.4 10.2a2 2 0 0 1-2 1.8H8.4a2 2 0 0 1-2-1.8L5 4H2"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </div>
    </header>
  );
}
