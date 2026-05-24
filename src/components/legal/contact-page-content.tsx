"use client";

import Link from "next/link";
import { SupportContactPanel } from "@/components/support/support-contact-panel";
import { useI18n } from "@/components/i18n-provider";

export function ContactPageContent() {
  const { t } = useI18n();

  return (
    <div className="home-theme fd-public-light min-h-dvh">
      <div className="mx-auto max-w-lg px-4 py-8 pb-12">
        <Link
          href="/"
          className="text-xs font-semibold text-[color:var(--fd-primary)] hover:underline"
        >
          ← {t("brand")}
        </Link>
        <h1 className="mt-5 text-xl font-black text-[color:var(--fd-text)]">
          {t("legal_contact_title")}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[color:var(--fd-muted)]">
          {t("legal_contact_lead")}
        </p>
        <div className="mt-5">
          <SupportContactPanel />
        </div>
      </div>
    </div>
  );
}
