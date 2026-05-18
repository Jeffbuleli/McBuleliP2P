import Link from "next/link";
import type { ReactNode } from "react";
import { WalletSubpageHeader } from "@/components/wallet/wallet-subpage-header";

export function WalletFlowShell({
  title,
  subtitle,
  step,
  totalSteps = 0,
  backHref = "/app/wallet",
  children,
}: {
  title: string;
  subtitle?: string;
  step?: number;
  totalSteps?: number;
  backHref?: string;
  children: ReactNode;
}) {
  return (
    <div className="wallet-theme -mx-1 pb-10">
      <WalletSubpageHeader title={title} subtitle={subtitle} backHref={backHref} />
      {step != null && totalSteps > 0 ? (
        <div className="mb-5 flex items-center justify-center gap-2">
          {Array.from({ length: totalSteps }, (_, i) => {
            const n = i + 1;
            const active = n === step;
            const done = n < step;
            return (
              <span
                key={n}
                className={`h-2 rounded-full transition-all ${
                  active
                    ? "w-8 bg-[color:var(--fd-primary)]"
                    : done
                      ? "w-2 bg-[color:var(--fd-primary)]/50"
                      : "w-2 bg-[color:var(--fd-border)]"
                }`}
                aria-hidden
              />
            );
          })}
        </div>
      ) : null}
      {children}
    </div>
  );
}

export function FlowCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`fd-card p-4 ${className}`}>{children}</div>;
}

export function FlowPrimaryBtn({
  children,
  disabled,
  onClick,
  type = "button",
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className="mt-4 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-[color:var(--fd-primary)] to-[color:var(--fd-primary-dark)] text-base font-bold text-white shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
    >
      {children}
    </button>
  );
}

export function FlowBackLink({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-3 w-full text-center text-sm font-semibold text-[color:var(--fd-muted)]"
    >
      {label}
    </button>
  );
}

export function FlowHubLink({ label }: { label: string }) {
  return (
    <Link
      href="/app/wallet"
      className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-[color:var(--fd-primary)]"
    >
      ← {label}
    </Link>
  );
}

