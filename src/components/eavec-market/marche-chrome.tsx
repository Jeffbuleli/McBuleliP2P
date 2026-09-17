"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export function MarcheChrome({
  title,
  fr,
  showSell = true,
  backTo,
}: {
  title?: string;
  fr: boolean;
  showSell?: boolean;
  /** Override fallback when in-app history.back is not usable. */
  backTo?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isHub = pathname === "/app/marche";
  const fallback = backTo ?? (isHub ? "/app" : "/app/marche");

  function goBack() {
    try {
      if (typeof window !== "undefined" && window.history.length > 1) {
        const ref = document.referrer;
        if (ref) {
          const url = new URL(ref);
          if (
            url.origin === window.location.origin &&
            url.pathname.startsWith("/app")
          ) {
            router.back();
            return;
          }
        }
      }
    } catch {
      /* ignore */
    }
    router.push(fallback);
  }

  return (
    <header className="mk-chrome">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={goBack}
          className="mk-icon-btn shrink-0"
          aria-label={fr ? "Retour" : "Back"}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M15 6l-6 6 6 6"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
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
