import type { ReactNode } from "react";

type BadgeVariant = "default" | "success" | "muted" | "outline";

const VARIANT: Record<BadgeVariant, string> = {
  default:
    "bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)] ring-1 ring-[color:var(--fd-primary)]/15",
  success:
    "bg-[color:var(--hk-ok-bg,#ecfdf5)] text-[color:var(--hk-ok-text,#065f46)] ring-1 ring-[color:var(--hk-ok-ring,#a7f3d0)]",
  muted: "bg-[color:var(--fd-bg)] text-[color:var(--fd-muted)] ring-1 ring-[color:var(--fd-border)]",
  outline: "bg-[color:var(--fd-card)] text-[color:var(--fd-text)] ring-1 ring-[color:var(--fd-border)]",
};

export function Badge({
  children,
  variant = "default",
  className = "",
}: {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${VARIANT[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
