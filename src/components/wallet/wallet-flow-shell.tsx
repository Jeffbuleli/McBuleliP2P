import Link from "next/link";
import type { ReactNode } from "react";
import { WalletSubpageHeader } from "@/components/wallet/wallet-subpage-header";
import { WalletAssetIcon } from "@/components/wallet/wallet-asset-icon";

export function WalletFlowShell({
  title,
  subtitle,
  step,
  totalSteps = 0,
  backHref = "/app/wallet",
  headerBadge,
  children,
}: {
  title: string;
  subtitle?: string;
  step?: number;
  totalSteps?: number;
  backHref?: string;
  headerBadge?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="wallet-theme px-4 pb-10">
      <WalletSubpageHeader
        title={title}
        subtitle={subtitle}
        backHref={backHref}
        step={step}
        totalSteps={totalSteps}
        badge={headerBadge}
      />
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
  return (
    <div
      className={`rounded-xl border border-white/10 bg-[#0a1018]/90 p-4 backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  );
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
      className="mt-4 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/45 bg-emerald-500/18 text-base font-bold text-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.1)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
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

export function FlowHubLink({
  label,
  href = "/app/wallet",
}: {
  label: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-cyan-400/90 hover:text-cyan-300"
    >
      ← {label}
    </Link>
  );
}

export function flowPickBtnClass(active: boolean) {
  return `rounded-xl border px-3 py-2.5 transition active:scale-[0.99] ${
    active
      ? "border-emerald-400/45 bg-emerald-500/12 shadow-[0_0_12px_rgba(52,211,153,0.08)]"
      : "border-white/10 bg-[#0a1018]/85 hover:border-cyan-400/25"
  }`;
}

export function FlowAssetToggle({
  assets,
  value,
  onChange,
  disabled,
}: {
  assets: readonly string[];
  value: string;
  onChange: (asset: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-2">
      {assets.map((a) => (
        <button
          key={a}
          type="button"
          disabled={disabled}
          onClick={() => onChange(a)}
          className={`flex flex-1 items-center justify-center gap-2 ${flowPickBtnClass(value === a)} disabled:opacity-45`}
        >
          <WalletAssetIcon asset={a as "USDT" | "PI" | "USD" | "CDF"} size={24} />
          <span className="text-sm font-bold text-[color:var(--fd-text)]">{a}</span>
        </button>
      ))}
    </div>
  );
}

export function FlowNavRow({
  onBack,
  onNext,
  nextDisabled,
  nextLabel = "→",
  loading,
}: {
  onBack: () => void;
  onNext?: () => void;
  nextDisabled?: boolean;
  nextLabel?: ReactNode;
  loading?: boolean;
}) {
  return (
    <div className="mt-4 flex gap-2">
      <button
        type="button"
        onClick={onBack}
        className="flex min-h-[52px] flex-1 items-center justify-center rounded-xl border border-white/12 bg-[#0a1018]/85 text-lg font-bold text-cyan-300 active:scale-[0.98]"
      >
        ←
      </button>
      {onNext ? (
        <button
          type="button"
          disabled={nextDisabled || loading}
          onClick={onNext}
          className="flex min-h-[52px] flex-[2] items-center justify-center rounded-xl border border-emerald-400/45 bg-emerald-500/18 text-lg font-bold text-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.1)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {loading ? "…" : nextLabel}
        </button>
      ) : null}
    </div>
  );
}
