import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-[color:var(--fd-border)] bg-white p-5 shadow-[0_1px_0_rgba(12,10,9,0.04)] ${className}`}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h3 className={`text-base font-semibold text-[color:var(--fd-text)] ${className}`}>
      {children}
    </h3>
  );
}

export function CardDescription({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={`mt-2 text-sm leading-relaxed text-[color:var(--fd-muted)] ${className}`}>
      {children}
    </p>
  );
}
