"use client";

import type { ReactNode } from "react";

export type P2pInfoCardVariant = "buy" | "sell" | "info" | "warn";

const VARIANT_CLASS: Record<P2pInfoCardVariant, string> = {
  buy: "p2p-info-card--buy",
  sell: "p2p-info-card--sell",
  info: "p2p-info-card--info",
  warn: "p2p-info-card--warn",
};

type P2pInfoCardProps = {
  variant: P2pInfoCardVariant;
  illustration: ReactNode;
  title: string;
  subtitle?: string;
  /** Tighter horizontal layout (illus left, text right). */
  compact?: boolean;
  className?: string;
};

/** Small rounded rule/tip card - no HUD corner brackets (large panels only). */
export function P2pInfoCard({
  variant,
  illustration,
  title,
  subtitle,
  compact = false,
  className = "",
}: P2pInfoCardProps) {
  return (
    <article
      className={`p2p-info-card ${compact ? "p2p-info-card--compact" : ""} ${VARIANT_CLASS[variant]} ${className}`.trim()}
    >
      <div className="p2p-info-card__illus" aria-hidden>
        {illustration}
      </div>
      <div className="p2p-info-card__body">
        <h3 className="p2p-info-card__title">{title}</h3>
        {subtitle ? <p className="p2p-info-card__subtitle">{subtitle}</p> : null}
      </div>
    </article>
  );
}

type P2pInfoCardGridProps = {
  children: ReactNode;
  columns?: 1 | 2;
  className?: string;
};

export function P2pInfoCardGrid({
  children,
  columns = 2,
  className = "",
}: P2pInfoCardGridProps) {
  return (
    <div
      className={`p2p-info-card-grid ${columns === 1 ? "p2p-info-card-grid--1" : ""} ${className}`.trim()}
    >
      {children}
    </div>
  );
}
