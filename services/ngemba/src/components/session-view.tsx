"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SessionChat } from "@/components/session-chat";
import {
  SessionMediaList,
  SessionMediaUpload,
} from "@/components/session-media";
import { IconShield, IconSpark } from "@/components/icons";
import { isLocale, messages, type Locale } from "@/lib/i18n";
import { urgencyLabel } from "@/lib/labels";
import { citizenShellMaxWidth, useDeviceClass } from "@/lib/ui/device";

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
  initialLocale: string;
  discrete?: boolean;
}) {
  const locale: Locale = isLocale(initialLocale) ? initialLocale : "fr";
  const t = messages[locale];
  const device = useDeviceClass();
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [media, setMedia] = useState<SessionPayload["media"]>([]);
  const [error, setError] = useState(false);

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
      className={`ng-shell mx-auto flex min-h-dvh flex-col pb-8 pt-5 ${citizenShellMaxWidth(device)} ${discrete ? "ng-discrete-surface" : ""}`}
    >
      <header className="flex items-center justify-between">
        <Link href={`/?lang=${locale}`} className="text-sm font-medium text-ng-muted">
          {t.home}
        </Link>
        <div className="inline-flex items-center gap-1.5 text-ng-primary">
          <IconSpark className="size-3.5" />
          <span className="text-[11px] font-semibold">{t.powered}</span>
        </div>
      </header>

      {error ? (
        <p className="mt-10 text-sm font-medium text-ng-urgent">{t.errorGeneric}</p>
      ) : !session ? (
        <p className="mt-10 text-sm text-ng-muted">{t.sending}</p>
      ) : (
        <section className="mt-8 flex flex-1 flex-col gap-5">
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex size-11 items-center justify-center rounded-2xl ${
                discrete
                  ? "bg-white/5 text-[#c9a0bc]"
                  : "bg-ng-urgent/10 text-ng-urgent"
              }`}
            >
              <IconShield className="size-5" />
            </span>
            <div>
              <h1
                className={`text-lg font-semibold ${discrete ? "text-[#e8d4e3]" : "text-ng-primary"}`}
              >
                {t.alertOk}
              </h1>
              <p className={`text-sm ${discrete ? "ng-discrete-muted" : "text-ng-muted"}`}>
                {t.humanSoon}
              </p>
            </div>
          </div>

          <div
            className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${urgencyClass(session.urgency)}`}
          >
            {t.urgency} - {urgencyLabel(session.urgency, locale)}
          </div>

          <div className="rounded-2xl border border-[var(--ng-border)] bg-ng-surface p-4">
            <p className="text-sm leading-relaxed text-ng-text">
              {session.aiPayload.summary_user_locale || session.aiSummary}
            </p>
            {session.locationLabel || session.commune ? (
              <p className="mt-3 text-xs font-medium text-ng-muted">
                {t.place} - {session.locationLabel || session.commune}
              </p>
            ) : null}
          </div>

          {session.aiPayload.follow_up_questions?.length ? (
            <ul className="space-y-2">
              {session.aiPayload.follow_up_questions.map((q) => (
                <li
                  key={q}
                  className="rounded-xl bg-ng-primary-muted/70 px-3 py-2 text-sm text-ng-primary"
                >
                  - {q}
                </li>
              ))}
            </ul>
          ) : null}

          <p className="text-xs leading-relaxed text-ng-muted">
            {t.emergencyHint}
          </p>

          {session.aiPayload.ai_disclaimer ? (
            <p className="text-[11px] leading-relaxed text-ng-muted">
              {session.aiPayload.ai_disclaimer}
            </p>
          ) : null}

          <SessionMediaUpload
            sessionId={id}
            labels={{
              addMedia: t.addMedia,
              mediaHint: t.mediaHint,
              mediaUploading: t.mediaUploading,
            }}
            onUploaded={setMedia}
          />
          <SessionMediaList sessionId={id} items={media ?? []} />
          <SessionChat
            sessionId={id}
            labels={{
              chatTitle: t.chatTitle,
              chatPlaceholder: t.chatPlaceholder,
              chatSend: t.chatSend,
              chatEmpty: t.chatEmpty,
            }}
          />

          <Link
            href={`/me?lang=${locale}`}
            className="text-center text-sm font-semibold text-ng-primary underline"
          >
            {t.myAlerts}
          </Link>
        </section>
      )}
    </main>
  );
}
