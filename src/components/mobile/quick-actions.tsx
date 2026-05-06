import Link from "next/link";
import { getDictionary } from "@/i18n/messages";
import type { Locale } from "@/i18n/locale";

const actions = [
  { href: "/app/deposit", key: "quick_deposit" as const, icon: PlusIn },
  { href: "/app/withdraw", key: "quick_withdraw" as const, icon: MinusOut },
  { href: "/app/wallet/transfer", key: "quick_send" as const, icon: SendIcon },
  { href: "/app/p2p", key: "quick_p2p" as const, icon: P2PGrid },
] as const;

export function QuickActions({ locale }: { locale: Locale }) {
  const d = getDictionary(locale);

  return (
    <div className="grid grid-cols-4 gap-2">
      {actions.map(({ href, key, icon: Icon }) => (
        <Link
          key={key}
          href={href}
          className="flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-2xl border border-stone-700/50 bg-stone-950/60 py-3 shadow-lg shadow-black/30 backdrop-blur-md transition active:scale-[0.97] hover:bg-stone-900/60"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full border border-emerald-700/30 bg-emerald-950/40 text-emerald-200 shadow-md shadow-black/20">
            <Icon />
          </span>
          <span className="max-w-full truncate px-1 text-center text-[11px] font-bold leading-tight text-stone-100">
            {d[key]}
          </span>
        </Link>
      ))}
    </div>
  );
}

function PlusIn() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MinusOut() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 17V7M17 17V7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 12h6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function P2PGrid() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 7h13M8 12h13M8 17h13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="4" cy="7" r="1" fill="currentColor" />
      <circle cx="4" cy="12" r="1" fill="currentColor" />
      <circle cx="4" cy="17" r="1" fill="currentColor" />
    </svg>
  );
}
