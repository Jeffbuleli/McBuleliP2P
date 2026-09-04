"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SessionChat } from "@/components/session-chat";
import {
  SessionMediaList,
  SessionMediaUpload,
} from "@/components/session-media";
import { IconShield, IconSpark } from "@/components/icons";
import { useCitizenLocale } from "@/hooks/use-citizen-locale";
import { messages } from "@/lib/i18n";
import { urgencyLabel } from "@/lib/labels";
import {
  citizenPagePad,
  citizenShellMaxWidth,
  useDeviceClass,
} from "@/lib/ui/device";

type SessionPayload = {
  id: string;
  urgency: string;
  category: string;
  immediateDanger: boolean;
  aiSummary: string;
  locationLabel: string | null;
  commune: string | null;
  provider: string;
  aiMode?: string;
  aiPayload: {
    follow_up_questions?: string[];
    ai_disclaimer?: string;
    summary_user_locale?: string;
  };
  routingQueue: string;
  lat: number | null;
  lng: number | null;
  media?: Array<{
    id: string;
    kind: string;
    fileName: string;
    transcription: string | null;
    publicUrl?: string | null;
  }>;
};

function urgencyClass(u: string) {
  if (u === "critical" || u === "high") return "bg-red-50 text-ng-urgent";
  if (u === "medium") return "bg-amber-50 text-ng-warning";
  return "bg-ng-primary-muted text-ng-primary";
}

export function SessionView({
  id,
  initialLocale,
  discrete = false,
}: {
  id: string;
  initialLocale?: string;
  discrete?: boolean;
}) {
  const { locale, href } = useCitizenLocale(initialLocale);
  const t = messages[locale];
  const device = useDeviceClass();
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [media, setMedia] = useState<SessionPayload["media"]>([]);
  const [error, setError] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    if (!discrete) return;
    document.body.classList.add("ng-discrete");
    return () => document.body.classList.remove("ng-discrete");
  }, [discrete]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/alerts/${id}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok || !data.session) {
          if (!cancelled) setError(true);
          return;
        }
        if (!cancelled) {
          setSession(data.session);
          setMedia(data.session.media ?? []);
        }
      } catch {
        if (!cancelled) setError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <main
      className={`ng-shell mx-auto flex min-h-dvh flex-col ${citizenPagePad(device)} ${citizenShellMaxWidth(device)} ${discrete ? "ng-discrete-surface" : ""}`}
    >
      <header className="flex shrink-0 items-center justify-between">
        <Link
          href={href("/")}
          className={`text-sm font-medium ${discrete ? "ng-discrete-muted" : "text-ng-muted"}`}
        >
          {t.home}
        </Link>
        <div
          className={`inline-flex items-center gap-1.5 ${discrete ? "text-[#c9a0bc]" : "text-ng-primary"}`}
        >
          <IconSpark className="size-3.5" />
          <span className="text-[11px] font-semibold">{t.powered}</span>
        </div>
      </header>

      {error ? (
        <p className="mt-10 text-sm font-medium text-ng-urgent">
          {t.errorGeneric}
        </p>
      ) : !session ? (
        <p className="mt-10 text-sm text-ng-muted">{t.sending}</p>
      ) : (
        <section className="mt-4 flex min-h-0 flex-1 flex-col gap-4">
          <div className="flex shrink-0 items-start gap-3">
            <span
              className={`inline-flex size-11 shrink-0 items-center justify-center rounded-2xl ${
                discrete
                  ? "bg-white/5 text-[#c9a0bc]"
                  : "bg-ng-urgent/10 text-ng-urgent"
              }`}
            >
              <IconShield className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1
                  className={`text-lg font-semibold ${discrete ? "text-[#e8d4e3]" : "text-ng-primary"}`}
                >
                  {t.alertOk}
                </h1>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${urgencyClass(session.urgency)}`}
                >
                  {urgencyLabel(session.urgency, locale)}
                </span>
              </div>
              <p
                className={`mt-0.5 text-sm ${discrete ? "ng-discrete-muted" : "text-ng-muted"}`}
              >
                {t.humanSoon}
              </p>
            </div>
          </div>

          <details className="shrink-0 rounded-2xl border border-[var(--ng-border)] bg-ng-surface open:shadow-sm">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-ng-primary">
              <span className="inline-flex items-center gap-1.5">
                <IconSpark className="size-3.5" />
                Orientation Ngemba IA
              </span>
            </summary>
            <div className="border-t border-[var(--ng-border)] px-4 py-3">
              <p className="text-sm leading-relaxed text-ng-text">
                {session.aiPayload.summary_user_locale || session.aiSummary}
              </p>
              {session.locationLabel || session.commune ? (
                <p className="mt-2 text-xs font-medium text-ng-muted">
                  {t.place} - {session.locationLabel || session.commune}
                </p>
              ) : null}
              {session.aiPayload.follow_up_questions?.length ? (
                <ul className="mt-3 space-y-1.5">
                  {session.aiPayload.follow_up_questions.map((q) => (
                    <li
                      key={q}
                      className="rounded-xl bg-ng-primary-muted/70 px-3 py-2 text-xs text-ng-primary"
                    >
                      {q}
                    </li>
                  ))}
                </ul>
              ) : null}
              <p className="mt-3 text-xs leading-relaxed text-ng-muted">
                {t.emergencyHint}
              </p>
            </div>
          </details>

          {(media?.length ?? 0) > 0 ? (
            <div className="shrink-0">
              <SessionMediaList sessionId={id} items={media ?? []} dense />
            </div>
          ) : null}

          <div className="shrink-0">
            {showUpload ? (
              <SessionMediaUpload
                sessionId={id}
                labels={{
                  addMedia: t.addMedia,
                  mediaHint: t.mediaHint,
                  mediaUploading: t.mediaUploading,
                }}
                onUploaded={(items) => {
                  setMedia(items);
                  setShowUpload(false);
                }}
              />
            ) : (
              <button
                type="button"
                onClick={() => setShowUpload(true)}
                className={`w-full rounded-xl border border-dashed px-3 py-2 text-xs font-semibold ${
                  discrete
                    ? "border-white/20 text-[#c9a0bc]"
                    : "border-[var(--ng-border)] text-ng-primary"
                }`}
              >
                + {t.addMedia}
              </button>
            )}
          </div>

          <div className="min-h-0 flex-1">
            <SessionChat
              sessionId={id}
              viewerRole="citizen"
              discrete={discrete}
              locale={locale}
              labels={{
                chatTitle: t.chatTitle,
                chatPlaceholder: t.chatPlaceholder,
                chatSend: t.chatSend,
                chatEmpty: t.chatEmpty,
              }}
            />
          </div>

          {session.aiPayload.ai_disclaimer ? (
            <p className="shrink-0 pb-2 text-center text-[10px] leading-relaxed text-ng-muted">
              {session.aiPayload.ai_disclaimer}
            </p>
          ) : null}
        </section>
      )}
    </main>
  );
}
