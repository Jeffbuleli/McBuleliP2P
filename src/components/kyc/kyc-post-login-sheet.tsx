"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/components/i18n-provider";
import { IconClose } from "@/components/icons/flow-icons";
import {
  KycHeroStart,
  KycIconFace,
  KycIconId,
  KycIconShield,
} from "@/components/kyc/kyc-illustrations";
import { KYC_STATUS_CHANGED_EVENT } from "@/components/kyc/kyc-status-poller";
import { fetchKycStatus } from "@/lib/kyc-client-sync";
import type { KycStatusPayload } from "@/lib/kyc-status-payload";
import {
  dismissKycPrompt,
  kycPromptDismissed,
} from "@/lib/kyc-prompt-state";

const OPEN_DELAY_MS = 1800;

function shouldOfferKyc(payload: KycStatusPayload): boolean {
  if (!payload.corridor || payload.approved) return false;
  if (payload.kycStatus === "pending" || payload.kycStatus === "manual_review") {
    return false;
  }
  if (payload.sanctionsBlocked) return false;
  return payload.kycStatus === "none" || payload.canRetryKyc;
}

function BenefitTile({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1.5 rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-bg)] px-2 py-3 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)]">
        {icon}
      </span>
      <span className="text-[10px] font-bold leading-tight text-[color:var(--fd-text)]">
        {label}
      </span>
    </div>
  );
}

export function KycPostLoginSheet() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const evaluate = useCallback(async () => {
    if (!pathname.startsWith("/app")) return;
    if (pathname.startsWith("/app/profile/kyc")) return;
    if (kycPromptDismissed()) return;

    const payload = await fetchKycStatus();
    if (!payload || !shouldOfferKyc(payload)) {
      setOpen(false);
      return;
    }
    setOpen(true);
  }, [pathname]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!pathname.startsWith("/app")) {
      setOpen(false);
      return;
    }
    const id = window.setTimeout(() => void evaluate(), OPEN_DELAY_MS);
    return () => clearTimeout(id);
  }, [pathname, evaluate]);

  useEffect(() => {
    const onStatus = (e: Event) => {
      const payload = (e as CustomEvent<KycStatusPayload>).detail;
      if (!payload || !shouldOfferKyc(payload)) setOpen(false);
    };
    window.addEventListener(KYC_STATUS_CHANGED_EVENT, onStatus);
    return () => window.removeEventListener(KYC_STATUS_CHANGED_EVENT, onStatus);
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function close() {
    setOpen(false);
  }

  function onLater() {
    dismissKycPrompt();
    close();
  }

  function onContinue() {
    close();
    router.push("/app/profile/kyc?start=1");
  }

  if (!open || !mounted) return null;

  const panel = (
    <div className="fixed inset-0 z-[9998] flex flex-col justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-stone-900/45 backdrop-blur-[2px]"
        aria-label={t("kyc_prompt_later")}
        onClick={onLater}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="kyc-prompt-title"
        className="notif-drawer-panel relative mx-auto max-h-[50vh] min-h-[42vh] w-full max-w-lg rounded-t-3xl border border-[color:var(--fd-border)] bg-gradient-to-b from-[#EAF7F0] to-[color:var(--fd-card)] shadow-[0_-12px_48px_rgba(14,122,75,0.22)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-stone-300/90" />
        <button
          type="button"
          onClick={onLater}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--fd-border)] bg-white/80 text-[color:var(--fd-muted)] active:scale-95"
          aria-label={t("kyc_prompt_later")}
        >
          <IconClose className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center px-5 pb-4 pt-2 text-center">
          <KycHeroStart className="h-24 w-24 text-[color:var(--fd-primary)]" />
          <h2
            id="kyc-prompt-title"
            className="mt-1 text-lg font-black tracking-tight text-[color:var(--fd-text)]"
          >
            {t("kyc_prompt_title")}
          </h2>
          <p className="mt-1 max-w-[18rem] text-xs font-medium leading-snug text-[color:var(--fd-muted)]">
            {t("kyc_prompt_sub")}
          </p>

          <div className="mt-4 flex w-full gap-2">
            <BenefitTile
              icon={<KycIconShield className="h-6 w-6" />}
              label={t("kyc_prompt_benefit_secure")}
            />
            <BenefitTile
              icon={<KycIconId className="h-6 w-6" />}
              label={t("kyc_prompt_benefit_unlock")}
            />
            <BenefitTile
              icon={<KycIconFace className="h-6 w-6" />}
              label={t("kyc_prompt_benefit_trust")}
            />
          </div>

          <div className="mt-5 flex w-full flex-col gap-2">
            <button
              type="button"
              onClick={onContinue}
              className="w-full rounded-2xl bg-[color:var(--fd-primary)] py-3.5 text-sm font-bold text-white shadow-lg shadow-[color:var(--fd-primary)]/25 active:scale-[0.99]"
            >
              {t("kyc_prompt_continue")}
            </button>
            <button
              type="button"
              onClick={onLater}
              className="w-full rounded-2xl border border-[color:var(--fd-border)] bg-white/70 py-3 text-sm font-semibold text-[color:var(--fd-muted)] active:scale-[0.99]"
            >
              {t("kyc_prompt_later")}
            </button>
          </div>
          <p className="mt-2 text-[10px] text-[color:var(--fd-muted)]/80">
            {t("kyc_prompt_later_hint")}
          </p>
        </div>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </div>
  );

  return createPortal(panel, document.body);
}
