"use client";

import { useI18n } from "@/components/i18n-provider";
import { HudLegalLink } from "@/components/landing/landing-hud-ui";

export function LandingFooterV2() {
  const { t } = useI18n();

  const links = [
    { href: "/about", label: t("landing_footer_about") },
    { href: "/contact", label: t("landing_footer_contact") },
    { href: "/terms", label: t("landing_footer_terms") },
    { href: "/privacy", label: t("landing_footer_privacy") },
  ] as const;

  return (
    <footer className="border-t border-white/8 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-7xl text-center">
        <p className="text-xs text-stone-400">{t("landing_footer_tagline")}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <span className="rounded-full border border-cyan-500/20 bg-cyan-500/5 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wide text-cyan-400/90">
            P2P escrow
          </span>
          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wide text-emerald-400/90">
            Mobile money
          </span>
          <span className="rounded-full border border-fuchsia-500/20 bg-fuchsia-500/5 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wide text-fuchsia-400/80">
            BSC
          </span>
        </div>
        <nav className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2" aria-label="Footer">
          {links.map((item) => (
            <HudLegalLink key={item.href} href={item.href}>
              {item.label}
            </HudLegalLink>
          ))}
        </nav>
        <p className="mt-4 font-mono text-[10px] text-stone-600">
          © {new Date().getFullYear()} {t("brand")}
        </p>
      </div>
    </footer>
  );
}
