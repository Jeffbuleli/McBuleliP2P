"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { AcademyIcon } from "@/components/academy/academy-icon";
import { academyCls } from "@/components/academy/academy-ui";
import { fetchWithDeadline } from "@/lib/fetch-with-deadline";
import { loginHrefFor, registerHrefFor } from "@/lib/auth-return-path";

type Webinar = {
  publicSlug: string;
  editionSlug: string;
  sessionSlug: string;
  programSlug: string;
  title: string;
  themeLabel: string;
  subThemeLabel: string;
  coordinatesLabel: string | null;
  startsAt: string;
  hostPseudo: string;
};

export function AcademyWebinarPublicClient({
  publicSlug,
  nextPath,
}: {
  publicSlug: string;
  nextPath: string;
}) {
  const { t } = useI18n();
  const [webinar, setWebinar] = useState<Webinar | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const load = useCallback(async () => {
    const res = await fetchWithDeadline(
      `/api/academy/live/webinars/${encodeURIComponent(publicSlug)}`,
      { cache: "no-store" },
      15_000,
    );
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(t("academy_webinar_not_found"));
      return;
    }
    setWebinar(j.webinar as Webinar);
    setErr(null);
  }, [publicSlug, t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function register() {
    setBusy(true);
    try {
      const res = await fetchWithDeadline(
        `/api/academy/live/webinars/${encodeURIComponent(publicSlug)}/register`,
        { method: "POST", credentials: "include" },
        15_000,
      );
      if (res.status === 401) {
        window.location.href = loginHrefFor(nextPath);
        return;
      }
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(t("academy_enroll_failed"));
        return;
      }
      setDone(true);
    } finally {
      setBusy(false);
    }
  }

  if (err && !webinar) {
    return (
      <div className={`px-4 py-8 text-center ${academyCls.root}`}>
        <p className="text-sm text-rose-700">{err}</p>
        <Link href="/app/academy" className="mt-3 inline-block text-sm font-bold text-[#305f33]">
          Academy →
        </Link>
      </div>
    );
  }

  if (!webinar) {
    return <div className="h-32 animate-pulse rounded-2xl bg-[#e8f3ee] m-4" />;
  }

  const liveHref = `/app/academy/${webinar.editionSlug}/live/${webinar.sessionSlug}?program=${encodeURIComponent(webinar.programSlug)}`;

  return (
    <div className={`mx-auto max-w-md space-y-4 px-4 py-8 ${academyCls.root}`}>
      <div className="text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#305f33]/10 ring-4 ring-[#305f33]/20">
          <AcademyIcon name="live" className="h-8 w-8" />
        </span>
        <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-[#305f33]">
          {webinar.themeLabel} · {webinar.subThemeLabel}
        </p>
        <h1 className="mt-1 text-xl font-black">{webinar.title}</h1>
        <p className="mt-1 text-xs text-[color:var(--fd-muted)]">
          {webinar.hostPseudo} · {new Date(webinar.startsAt).toLocaleString()}
        </p>
        {webinar.coordinatesLabel ? (
          <p className="mt-1 text-[10px] text-[color:var(--fd-muted)]">📍 {webinar.coordinatesLabel}</p>
        ) : null}
      </div>

      {done ? (
        <Link
          href={liveHref}
          className="flex w-full justify-center rounded-xl bg-[#305f33] py-3 text-sm font-extrabold text-white"
        >
          {t("academy_webinar_join_live")} →
        </Link>
      ) : (
        <>
          <button
            type="button"
            disabled={busy}
            onClick={() => void register()}
            className="w-full rounded-xl bg-[#305f33] py-3 text-sm font-extrabold text-white disabled:opacity-60"
          >
            {busy ? "…" : t("academy_webinar_register")}
          </button>
          <p className="text-center text-[10px] text-[color:var(--fd-muted)]">
            {t("academy_webinar_account_hint")}
          </p>
          <div className="flex justify-center gap-3 text-xs font-bold">
            <Link href={loginHrefFor(nextPath)} className="text-[#305f33]">
              {t("home_login")}
            </Link>
            <Link href={registerHrefFor(nextPath)} className="text-[#305f33]">
              {t("home_register")}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
