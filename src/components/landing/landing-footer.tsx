"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";

export function LandingFooter() {
  const { t } = useI18n();

  const legal = [
    { href: "/about", label: t("landing_footer_about") },
    { href: "/whitepaper", label: t("landing_footer_whitepaper") },
    { href: "/contact", label: t("landing_footer_contact") },
    { href: "/terms", label: t("landing_footer_terms") },
    { href: "/privacy", label: t("landing_footer_privacy") },
  ];

  return (
    <footer className="border-t border-stone-200 bg-white px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <p className="text-center text-xs text-stone-500">{t("landing_footer_tagline")}</p>
        <nav
          className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-semibold text-stone-600"
          aria-label="Legal"
        >
          {legal.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              className="hover:text-[#305F33]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <p className="mt-5 text-center text-[11px] text-stone-400">
          © {new Date().getFullYear()} {t("brand")}
        </p>
      </div>
    </footer>
  );
}
