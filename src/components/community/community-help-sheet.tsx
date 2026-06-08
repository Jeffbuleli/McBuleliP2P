"use client";

import { useEffect, type ReactNode } from "react";
import { useI18n } from "@/components/i18n-provider";
import { McBuleliPoweredFooter } from "@/components/brand/mcbuleli-powered-footer";

function HelpSection({
  icon,
  title,
  body,
  bullets,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  bullets?: string[];
}) {
  return (
    <section className="flex gap-3 rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] p-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)]">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-xs font-bold uppercase tracking-wide text-[color:var(--fd-primary)]">
          {title}
        </h3>
        <p className="mt-1 text-[11px] leading-relaxed text-[color:var(--fd-text)]">{body}</p>
        {bullets && bullets.length > 0 ? (
          <ul className="mt-2 space-y-1">
            {bullets.map((b) => (
              <li
                key={b}
                className="flex gap-1.5 text-[11px] leading-snug text-[color:var(--fd-muted)]"
              >
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[color:var(--fd-primary)]" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}

function FeedIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="4" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path d="M7 9h10M7 13h6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function BpIcon() {
  return (
    <span className="text-xs font-extrabold tracking-tight">BP</span>
  );
}

function ModulesIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="9" cy="9" r="3" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="16" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M4 19c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5M13 19c0-1.8 1.5-3.2 3.5-3.2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CommunityHelpSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useI18n();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-3 sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="community-help-title"
        className="max-h-[88vh] w-full max-w-md overflow-hidden rounded-[1.75rem] border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-[color:var(--fd-border)] bg-gradient-to-r from-[color:var(--fd-mint)] to-[color:var(--fd-card)] px-4 py-4">
          <div className="flex items-start gap-3">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--fd-card)] text-[color:var(--fd-primary)] shadow-sm ring-1 ring-[color:var(--fd-primary)]/15">
              <ModulesIcon />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <h2
                id="community-help-title"
                className="text-base font-bold text-[color:var(--fd-text)]"
              >
                {t("community_help_title")}
              </h2>
              <p className="mt-1 text-[11px] leading-relaxed text-[color:var(--fd-muted)]">
                {t("community_help_intro")}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[color:var(--fd-border)] text-[color:var(--fd-muted)] active:scale-95"
              aria-label={t("community_help_close")}
            >
              ×
            </button>
          </div>
        </div>

        <div className="space-y-2 overflow-y-auto px-3 py-3">
          <HelpSection
            icon={<ModulesIcon />}
            title={t("community_help_modules_title")}
            body={t("community_help_modules_body")}
            bullets={[
              t("community_help_primary_1"),
              t("community_help_primary_2"),
              t("community_help_primary_3"),
              t("community_help_explore_1"),
              t("community_help_explore_2"),
              t("community_help_explore_3"),
              t("community_help_explore_4"),
            ]}
          />
          <HelpSection
            icon={<BpIcon />}
            title={t("community_help_bp_title")}
            body={t("community_help_bp_body")}
            bullets={[
              t("community_help_bp_1"),
              t("community_help_bp_2"),
              t("community_help_bp_3"),
            ]}
          />
          <HelpSection
            icon={<FeedIcon />}
            title={t("community_help_tips_title")}
            body={t("community_help_tips_body")}
            bullets={[
              t("community_help_tips_1"),
              t("community_help_tips_2"),
              t("community_help_tips_3"),
            ]}
          />
        </div>

        <div className="border-t border-[color:var(--fd-border)] px-3 pb-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="mb-1 w-full rounded-xl bg-[color:var(--fd-primary)] py-3 text-sm font-bold text-white active:scale-[0.99]"
          >
            {t("community_help_close")}
          </button>
          <McBuleliPoweredFooter />
        </div>
      </div>
    </div>
  );
}

export function CommunityHelpTrigger({ onClick }: { onClick: () => void }) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[color:var(--fd-primary)]/30 bg-[color:var(--fd-mint)] text-[13px] font-bold leading-none text-[color:var(--fd-primary)] shadow-sm transition active:scale-95"
      aria-label={t("community_help_open")}
    >
      ?
    </button>
  );
}
