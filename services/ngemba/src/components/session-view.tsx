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
  status: string;
  urgency: string;
  category: string;
  immediateDanger: boolean;
  aiSummary: string;
  locationLabel: string | null;
  commune: string | null;
  provider: string;
  aiMode?: string;
  createdAt?: string;
  aiPayload: {
    follow_up_questions?: string[];
    ai_disclaimer?: string;
    summary_user_locale?: string;
    witness_safety_reminder?: string;
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

function statusStep(status: string): number {
  if (status === "closed" || status === "cancelled") return 3;
  if (status === "oriented") return 2;
  return 1;
}

function CitizenProgress({
  status,
  discrete,
  labels,
}: {
  status: string;
  discrete: boolean;
  labels: [string, string, string];
}) {
  const step = statusStep(status);
  return (
    <ol className="grid grid-cols-3 gap-1.5">
      {labels.map((label, i) => {
        const n = i + 1;
        const done = step >= n;
        const current = step === n;
        return (
          <li
            key={label}
            className={`rounded-xl px-2 py-2 text-center text-[10px] font-semibold leading-tight ${
              discrete
                ? done
                  ? current
                    ? "bg-[#882364] text-white"
                    : "bg-white/10 text-[#e8d4e3]"
                  : "bg-white/5 text-[#c9a0bc] ring-1 ring-white/10"
                : done
                  ? current
                    ? "bg-ng-primary text-white"
                    : "bg-ng-primary-muted text-ng-primary"
                  : "bg-ng-bg text-ng-muted ring-1 ring-[var(--ng-border)]"
            }`}
          >
            {n}. {label}
          </li>
        );
      })}
    </ol>
  );
}

function LoadingSkeleton({ discrete }: { discrete: boolean }) {
  return (
    <div className="mt-6 space-y-3 animate-pulse">
      <div
        className={`h-16 rounded-2xl ${discrete ? "bg-white/5" : "bg-ng-primary-muted/60"}`}
      />
      <div
        className={`h-28 rounded-2xl ${discrete ? "bg-white/5" : "bg-ng-primary-muted/40"}`}
      />
      <div
        className={`h-48 rounded-2xl ${discrete ? "bg-white/5" : "bg-ng-primary-muted/30"}`}
      />
    </div>
  );
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

  const shortId = id.slice(0, 8).toUpperCase();
  const progressLabels: [string, string, string] =
    locale === "en"
      ? ["Received", "In care", "Closed"]
      : ["Reçue", "En charge", "Clôturée"];

  return (
    <main
      className={`ng-shell mx-auto flex min-h-dvh flex-col ${citizenPagePad(device)} ${citizenShellMaxWidth(device)} ${discrete ? "ng-discrete-surface" : ""}`}
    >
      <header className="flex shrink-0 items-center justify-between gap-3">
        <Link
          href={href("/")}
          className={`text-sm font-medium ${discrete ? "ng-discrete-muted" : "text-ng-muted"}`}
        >
          {t.home}
        </Link>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-lg px-2 py-1 font-mono text-[10px] font-semibold tracking-wide ${
              discrete
                ? "bg-white/10 text-[#c9a0bc]"
                : "bg-ng-primary-muted text-ng-primary"
            }`}
          >
            {shortId}
          </span>
          <div
            className={`inline-flex items-center gap-1.5 ${discrete ? "text-[#c9a0bc]" : "text-ng-primary"}`}
          >
            <IconSpark className="size-3.5" />
            <span className="text-[11px] font-semibold">{t.powered}</span>
          </div>
        </div>
      </header>

      {error ? (
        <div className="mt-10 rounded-2xl border border-red-200 bg-red-50 px-4 py-5">
          <p className="text-sm font-semibold text-ng-urgent">{t.errorGeneric}</p>
          <Link
            href={href("/")}
            className="mt-3 inline-block text-sm font-medium text-ng-primary underline"
          >
            {t.home}
          </Link>
        </div>
      ) : !session ? (
        <LoadingSkeleton discrete={discrete} />
      ) : (
        <section className="mt-4 flex min-h-0 flex-1 flex-col gap-4 pb-4">
          <div
            className={`relative overflow-hidden rounded-2xl border p-4 ${
              discrete
                ? "border-white/10 bg-white/[0.04]"
                : "border-[var(--ng-border)] bg-ng-surface shadow-[0_12px_32px_-24px_rgba(6,64,43,0.45)]"
            }`}
          >
            <div
              className={`absolute inset-x-0 top-0 h-1 ${
                session.urgency === "critical" || session.urgency === "high"
                  ? "bg-ng-urgent"
                  : session.urgency === "medium"
                    ? "bg-ng-warning"
                    : "bg-ng-primary"
              }`}
            />
            <div className="flex items-start gap-3 pt-1">
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
                    className={`text-lg font-semibold tracking-tight ${discrete ? "text-[#e8d4e3]" : "text-ng-primary"}`}
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
                  className={`mt-1 text-sm ${discrete ? "ng-discrete-muted" : "text-ng-muted"}`}
                >
                  {t.humanSoon}
                </p>
                {(session.locationLabel || session.commune) && (
                  <p
                    className={`mt-2 text-xs font-medium ${discrete ? "text-[#c9a0bc]" : "text-ng-primary"}`}
                  >
                    {t.place} · {session.locationLabel || session.commune}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-4">
              <CitizenProgress
                status={session.status}
                discrete={discrete}
                labels={progressLabels}
              />
            </div>
          </div>

          {session.immediateDanger ? (
            <p
              className={`rounded-xl px-3 py-2.5 text-xs font-semibold leading-relaxed ${
                discrete
                  ? "bg-white/10 text-[#e8d4e3] ring-1 ring-white/15"
                  : "border border-red-200 bg-red-50 text-ng-urgent"
              }`}
            >
              {t.emergencyHint}
            </p>
          ) : null}

          <article
            className={`shrink-0 rounded-2xl border ${
              discrete
                ? "border-white/10 bg-white/[0.04]"
                : "border-[var(--ng-border)] bg-ng-surface"
            }`}
          >
            <div className="flex items-center gap-1.5 border-b border-[var(--ng-border)] px-4 py-3">
              <IconSpark
                className={`size-3.5 ${discrete ? "text-[#c9a0bc]" : "text-ng-primary"}`}
              />
              <h2
                className={`text-sm font-semibold ${discrete ? "text-[#e8d4e3]" : "text-ng-primary"}`}
              >
                {t.orientationTitle}
              </h2>
            </div>
            <div className="space-y-3 px-4 py-3">
              <p
                className={`text-sm leading-relaxed ${discrete ? "text-[#f5f0f4]" : "text-ng-text"}`}
              >
                {session.aiPayload.summary_user_locale || session.aiSummary}
              </p>
              {session.aiPayload.witness_safety_reminder ? (
                <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
                  {session.aiPayload.witness_safety_reminder}
                </p>
              ) : null}
              {session.aiPayload.follow_up_questions?.length ? (
                <ul className="space-y-1.5">
                  {session.aiPayload.follow_up_questions.map((q) => (
                    <li
                      key={q}
                      className={`rounded-xl px-3 py-2 text-xs ${
                        discrete
                          ? "bg-white/10 text-[#e8d4e3]"
                          : "bg-ng-primary-muted/70 text-ng-primary"
                      }`}
                    >
                      {q}
                    </li>
                  ))}
                </ul>
              ) : null}
              {!session.immediateDanger ? (
                <p
                  className={`text-xs leading-relaxed ${discrete ? "ng-discrete-muted" : "text-ng-muted"}`}
                >
                  {t.emergencyHint}
                </p>
              ) : null}
            </div>
          </article>

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
                className={`w-full rounded-xl border border-dashed px-3 py-2.5 text-xs font-semibold transition active:scale-[0.99] ${
                  discrete
                    ? "border-white/20 text-[#c9a0bc]"
                    : "border-[var(--ng-border)] text-ng-primary hover:bg-ng-primary-muted/40"
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
            <p
              className={`shrink-0 pb-2 text-center text-[10px] leading-relaxed ${discrete ? "ng-discrete-muted" : "text-ng-muted"}`}
            >
              {session.aiPayload.ai_disclaimer}
            </p>
          ) : null}
        </section>
      )}
    </main>
  );
}
