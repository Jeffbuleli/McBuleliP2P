"use client";

import { useI18n } from "@/components/i18n-provider";
import { ChatAvatarBubble } from "@/components/profile/user-avatar-mark";
import { SupportMessageBody } from "@/components/support/support-message-body";
import type { SupportMessageDto } from "@/lib/support-service";

function formatWhen(iso: string, locale: string): string {
  const loc = locale === "fr" ? "fr-FR" : "en-US";
  const d = new Date(iso);
  const date = d.toLocaleDateString(loc, { day: "numeric", month: "short" });
  const time = d.toLocaleTimeString(loc, { hour: "2-digit", minute: "2-digit" });
  return `${date} • ${time}`;
}

function ReadStatusIcon({ read }: { read: boolean }) {
  if (read) {
    return (
      <span
        className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"
        aria-hidden
      >
        <svg viewBox="0 0 16 16" className="h-3 w-3" fill="currentColor">
          <path d="M6.2 11.2L3.4 8.4l-.9.9 3.7 3.7 7.4-7.4-.9-.9-6.5 6.5z" />
        </svg>
      </span>
    );
  }
  return (
    <span
      className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-800"
      title="Unread"
      aria-hidden
    >
      <span className="h-2 w-2 rounded-full bg-amber-600" />
    </span>
  );
}

function systemCopy(
  kind: string | null,
  t: (k: "support_welcome" | "support_closed_satisfied" | "support_closed_inactive") => string,
): string {
  if (kind === "welcome") return t("support_welcome");
  if (kind === "closed_satisfied") return t("support_closed_satisfied");
  if (kind === "closed_inactive") return t("support_closed_inactive");
  return t("support_welcome");
}

export function SupportMessageRow({
  message: m,
  mentionHandles,
  locale,
}: {
  message: SupportMessageDto;
  mentionHandles: Map<string, string>;
  locale: string;
}) {
  const { t } = useI18n();

  if (m.isSystem) {
    return (
      <li className="flex justify-center py-1.5">
        <p className="max-w-[92%] rounded-2xl border border-[color:var(--fd-border)]/60 bg-white/95 px-4 py-2.5 text-center text-xs leading-relaxed text-[color:var(--fd-text)] shadow-sm">
          {systemCopy(m.systemKind, t)}
        </p>
      </li>
    );
  }

  const when = formatWhen(m.createdAt, locale);
  const isAgent = m.senderRole === "agent" || m.senderRole === "super_admin";
  const hasImage = (m.attachments ?? []).some((a) => a.type === "image");
  const bodyTrim = m.body.trim();
  const showBody = bodyTrim && bodyTrim !== "";

  return (
    <li>
      <article
        className={`fd-card flex gap-3 p-3 ${
          m.own ? "ring-1 ring-[color:var(--fd-primary)]/25" : ""
        }`}
      >
        <ChatAvatarBubble
          label={m.senderLabel}
          avatarUrl={m.senderAvatarUrl}
          own={false}
        />

        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[color:var(--fd-text)]">
                {m.own ? t("support_you") : m.senderLabel}
                {isAgent ? (
                  <span className="ml-1.5 rounded-full bg-[color:var(--fd-mint)] px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-[color:var(--fd-primary)]">
                    Agent
                  </span>
                ) : null}
              </p>
              <p className="text-[10px] text-[color:var(--fd-muted)]">@{m.senderHandle}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              {!m.own ? (
                <ReadStatusIcon read={!m.unreadForViewer} />
              ) : m.readBy.length > 0 ? (
                <ReadStatusIcon read />
              ) : (
                <ReadStatusIcon read={false} />
              )}
              <time
                className="whitespace-nowrap text-[10px] tabular-nums text-[color:var(--fd-muted)]"
                dateTime={m.createdAt}
              >
                {when}
              </time>
            </div>
          </div>

          {showBody ? (
            <div className="mt-1.5">
              <SupportMessageBody body={m.body} mentionHandles={mentionHandles} />
            </div>
          ) : null}

          {(hasImage || m.hadExpiredImages || m.hasLink) && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {hasImage ? (
                <span className="rounded-full bg-[color:var(--fd-mint)] px-2 py-0.5 text-[10px] font-semibold text-[color:var(--fd-primary)]">
                  {t("support_attach_image")}
                </span>
              ) : null}
              {m.hadExpiredImages ? (
                <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] text-stone-600">
                  {t("support_image_expired")}
                </span>
              ) : null}
              {m.hasLink ? (
                <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-800">
                  {t("support_has_link")}
                </span>
              ) : null}
            </div>
          )}

          {m.attachments?.map((a, i) =>
            a.type === "image" ? (
              <div
                key={i}
                className="relative mt-2 overflow-hidden rounded-xl border border-[color:var(--fd-border)]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={a.dataUrl}
                  alt=""
                  className="mx-auto max-h-56 max-w-full rounded-lg object-contain"
                />
              </div>
            ) : null,
          )}

          {m.readBy.length > 0 ? (
            <p
              className="mt-2 text-[10px] text-[color:var(--fd-muted)]"
              title={m.readBy.map((r) => r.label).join(", ")}
            >
              <span className="font-semibold text-[color:var(--fd-text)]">
                {t("support_read_by")}
              </span>
              {": "}
              {m.readBy
                .slice(0, 4)
                .map((r) => r.label)
                .join(", ")}
              {m.readBy.length > 4 ? ` +${m.readBy.length - 4}` : ""}
            </p>
          ) : m.own ? (
            <p className="mt-2 text-[10px] font-medium text-amber-700">{t("support_unread")}</p>
          ) : null}
        </div>
      </article>
    </li>
  );
}
