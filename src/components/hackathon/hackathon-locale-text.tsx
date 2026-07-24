"use client";

import type { ReactNode } from "react";
import { useI18n } from "@/components/i18n-provider";

/** Renders FR/EN copy that updates immediately when LangSwitch changes. */
export function HackathonLocaleText({
  fr,
  en,
}: {
  fr: ReactNode;
  en: ReactNode;
}) {
  const { locale } = useI18n();
  return <>{locale === "fr" ? fr : en}</>;
}
