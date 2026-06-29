"use client";

import { createPortal } from "react-dom";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { WalletAssetIcon } from "@/components/wallet/wallet-asset-icon";
import {
  cryptoDepositHref,
  cryptoWithdrawHref,
  fiatDepositHref,
  fiatWithdrawHref,
  type WalletMoneyMode,
} from "@/lib/wallet-money-routes";
import { IconMobileMoney } from "@/components/wallet/fiat-icons";

type SheetOption = {
  href: string;
  label: string;
  hint?: string;
  icon: React.ReactNode;
};

type SheetSection = {
  title: string;
  options: SheetOption[];
};

export function WalletMoneySheet({
  open,
  mode,
  onClose,
}: {
  open: boolean;
  mode: WalletMoneyMode;
  onClose: () => void;
}) {
  const { t, locale } = useI18n();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const sections = useMemo((): SheetSection[] => {
    if (mode === "deposit") {
      return [
        {
          title: t("wallet_section_crypto"),
          options: [
            {
              href: cryptoDepositHref("USDT"),
              label: "USDT",
              hint: "Tether · TRC20",
              icon: <WalletAssetIcon asset="USDT" size={36} className="h-9 w-9" />,
            },
            {
              href: cryptoDepositHref("PI"),
              label: t("pi_manual_title"),
              hint: t("pi_manual_hint"),
              icon: <WalletAssetIcon asset="PI" size={36} className="h-9 w-9" />,
            },
          ],
        },
        {
          title: t("wallet_section_fiat"),
          options: [
            {
              href: fiatDepositHref("USD"),
              label: `USD · ${t("wallet_fiat_rail_momo")}`,
              icon: <WalletAssetIcon asset="USD" size={36} className="h-9 w-9" />,
            },
            {
              href: fiatDepositHref("CDF"),
              label: `CDF · ${t("wallet_fiat_rail_momo")}`,
              icon: <WalletAssetIcon asset="CDF" size={36} className="h-9 w-9" />,
            },
            {
              href: fiatDepositHref(undefined, "card"),
              label: t("wallet_fiat_rail_card"),
              hint: t("wallet_fiat_card_checkout_hint"),
              icon: (
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-violet-400/35 bg-violet-500/15 text-violet-300">
                  <CardIcon />
                </span>
              ),
            },
          ],
        },
      ];
    }

    return [
      {
        title: t("wallet_section_crypto"),
        options: [
          {
            href: cryptoWithdrawHref("USDT"),
            label: "USDT",
            hint: "Tether · TRC20",
            icon: <WalletAssetIcon asset="USDT" size={36} className="h-9 w-9" />,
          },
          {
            href: cryptoWithdrawHref("PI"),
            label: t("pi_manual_title"),
            hint: t("pi_manual_hint"),
            icon: <WalletAssetIcon asset="PI" size={36} className="h-9 w-9" />,
          },
        ],
      },
      {
        title: t("wallet_section_fiat"),
        options: [
          {
            href: fiatWithdrawHref("USD"),
            label: `USD · ${t("wallet_fiat_rail_momo")}`,
            icon: (
              <span className="relative">
                <WalletAssetIcon asset="USD" size={36} className="h-9 w-9" />
                <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/80 text-white">
                  <IconMobileMoney className="h-2.5 w-2.5" />
                </span>
              </span>
            ),
          },
          {
            href: fiatWithdrawHref("CDF"),
            label: `CDF · ${t("wallet_fiat_rail_momo")}`,
            icon: (
              <span className="relative">
                <WalletAssetIcon asset="CDF" size={36} className="h-9 w-9" />
                <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/80 text-white">
                  <IconMobileMoney className="h-2.5 w-2.5" />
                </span>
              </span>
            ),
          },
        ],
      },
    ];
  }, [mode, t]);

  if (!open || !mounted) return null;

  const title =
    mode === "deposit" ? t("wallet_action_deposit") : t("wallet_action_withdraw");

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex flex-col justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        aria-label={locale === "fr" ? "Fermer" : "Close"}
        onClick={onClose}
      />
      <div
        className="notif-drawer-panel app-futuristic-portal relative mx-auto max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] p-5 shadow-[0_-12px_48px_rgba(0,0,0,0.45)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
        <p className="text-center text-lg font-bold text-[color:var(--fd-text)]">{title}</p>
        <p className="mt-1 text-center text-xs text-[color:var(--fd-muted)]">
          {t("wallet_fiat_hub_tagline")}
        </p>

        <div className="mt-4 flex flex-col gap-4">
          {sections.map((section) => (
            <div key={section.title}>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
                {section.title}
              </p>
              <ul className="flex flex-col gap-2">
                {section.options.map((opt) => (
                  <li key={opt.href}>
                    <Link
                      href={opt.href}
                      onClick={onClose}
                      className="wallet-money-option flex items-center gap-3 p-3 transition active:scale-[0.99]"
                    >
                      <span className="shrink-0">{opt.icon}</span>
                      <span className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-[color:var(--fd-text)]">
                          {opt.label}
                        </p>
                        {opt.hint ? (
                          <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-[color:var(--fd-muted)]">
                            {opt.hint}
                          </p>
                        ) : null}
                      </span>
                      <span className="shrink-0 text-cyan-400/80" aria-hidden>
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function CardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path d="M2 10h20" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}
