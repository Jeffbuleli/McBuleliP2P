"use client";

import { useI18n } from "@/components/i18n-provider";
import { SupportAgentIcon } from "@/components/icons/support-agent-icon";
import { HUD_PANEL_LG, HudFrame } from "@/components/ui/hud-frame";
import {
  SUPPORT_EMAIL,
  SUPPORT_WA_PATH,
  SUPPORT_WA_PHONE,
  SUPPORT_X,
} from "@/lib/support-contact";

export function SupportContactPanel({
  showIcon = true,
  variant = "light",
}: {
  showIcon?: boolean;
  variant?: "light" | "dark";
}) {
  const { t } = useI18n();
  const dark = variant === "dark";

  const content = (
    <>
      {showIcon ? (
        <div
          className={
            dark
              ? "mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-400"
              : "mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)] ring-1 ring-[color:var(--fd-primary)]/15"
          }
        >
          <SupportAgentIcon className="h-5 w-5" />
        </div>
      ) : null}
      <p
        className={
          dark
            ? "font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-stone-500"
            : "text-xs font-bold uppercase tracking-[0.16em] text-[color:var(--fd-muted)]"
        }
      >
        {t("forgot_support_heading")}
      </p>
      <ul className="mt-3 space-y-2.5 text-sm">
        <li>
          <span
            className={
              dark
                ? "block font-mono text-[9px] font-semibold uppercase tracking-wide text-stone-600"
                : "block text-[10px] font-semibold uppercase tracking-wide text-[color:var(--fd-muted)]"
            }
          >
            {t("forgot_support_email_label")}
          </span>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className={
              dark
                ? "font-semibold text-cyan-400 underline-offset-4 hover:text-cyan-300 hover:underline"
                : "font-semibold text-[color:var(--fd-primary)] underline-offset-4 hover:underline"
            }
          >
            {SUPPORT_EMAIL}
          </a>
        </li>
        <li>
          <span
            className={
              dark
                ? "block font-mono text-[9px] font-semibold uppercase tracking-wide text-stone-600"
                : "block text-[10px] font-semibold uppercase tracking-wide text-[color:var(--fd-muted)]"
            }
          >
            {t("forgot_support_wa_label")}
          </span>
          <a
            href={SUPPORT_WA_PATH}
            target="_blank"
            rel="noopener noreferrer"
            className={
              dark
                ? "font-semibold text-emerald-400 underline-offset-4 hover:underline"
                : "font-semibold text-[color:var(--fd-primary)] underline-offset-4 hover:underline"
            }
          >
            wa.me/mcbuleli
          </a>
          <span className={dark ? "mx-1 text-stone-600" : "mx-1 text-[color:var(--fd-muted)]"}>·</span>
          <a
            href={SUPPORT_WA_PHONE}
            target="_blank"
            rel="noopener noreferrer"
            className={
              dark
                ? "font-semibold text-emerald-400 underline-offset-4 hover:underline"
                : "font-semibold text-[color:var(--fd-primary)] underline-offset-4 hover:underline"
            }
          >
            +243 997 366 736
          </a>
        </li>
        <li>
          <span
            className={
              dark
                ? "block font-mono text-[9px] font-semibold uppercase tracking-wide text-stone-600"
                : "block text-[10px] font-semibold uppercase tracking-wide text-[color:var(--fd-muted)]"
            }
          >
            {t("forgot_support_x_label")}
          </span>
          <a
            href={SUPPORT_X}
            target="_blank"
            rel="noopener noreferrer"
            className={
              dark
                ? "font-semibold text-cyan-400 underline-offset-4 hover:underline"
                : "font-semibold text-[color:var(--fd-primary)] underline-offset-4 hover:underline"
            }
          >
            x.com/McBuleli
          </a>
        </li>
      </ul>
    </>
  );

  if (dark) {
    return (
      <HudFrame accent="cyan" className={`${HUD_PANEL_LG} p-4`}>
        {content}
      </HudFrame>
    );
  }

  return (
    <div className="rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-mint)]/40 p-4">
      {content}
    </div>
  );
}
