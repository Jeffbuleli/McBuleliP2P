"use client";

import { useI18n } from "@/components/i18n-provider";
import { HudOutlineLink, HudPrimaryLink, HudSecondaryLink } from "@/components/landing/landing-hud-ui";
import { useSessionEntryHref } from "@/hooks/use-session-app-href";

export function LandingHeroCta({ marketAnchor = "#rates" }: { marketAnchor?: string }) {
  const { t } = useI18n();
  const entryHref = useSessionEntryHref("/app/wallet");

  return (
    <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-start">
      <HudPrimaryLink href={entryHref}>{t("landing_v2_cta_start")}</HudPrimaryLink>
      <HudSecondaryLink href="/login">{t("landing_cta_login")}</HudSecondaryLink>
      <HudOutlineLink href={marketAnchor}>{t("landing_cta_market")}</HudOutlineLink>
    </div>
  );
}
