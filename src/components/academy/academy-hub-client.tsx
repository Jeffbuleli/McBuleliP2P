"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { fetchWithDeadline } from "@/lib/fetch-with-deadline";
import {
  ACADEMY_EDITION_JUNE_2026,
  ACADEMY_PROGRAM_LAUNCH,
} from "@/lib/academy-config";

type Hub = {
  programs: { slug: string; title: string; level: string; priceUsdt: string | null }[];
  editions: {
    id: string;
    slug: string;
    programSlug: string;
    title: string;
    enrolled: boolean;
    startsAt: string | null;
  }[];
  credentials: {
    id: string;
    title: string;
    verifyCode: string;
    revoked: boolean;
  }[];
};

export function AcademyHubClient() {
  const { t } = useI18n();
  const [hub, setHub] = useState<Hub | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const res = await fetchWithDeadline(
        "/api/academy/overview",
        { credentials: "include", cache: "no-store" },
        20_000,
      );
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(t("academy_error_load"));
        return;
      }
      setHub(j as Hub);
    } catch {
      setErr(t("academy_error_load"));
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function enroll(editionSlug: string, programSlug: string) {
    setEnrolling(true);
    try {
      const res = await fetchWithDeadline(
        "/api/academy/enroll",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ editionSlug, programSlug }),
        },
        20_000,
      );
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        const code = typeof j.error === "string" ? j.error : "";
        if (code === "academy_insufficient_balance") {
          setErr(t("academy_insufficient_balance"));
        } else if (code === "academy_kyc_required") {
          setErr(t("academy_kyc_required"));
        } else {
          setErr(t("academy_error_enroll"));
        }
        return;
      }
      await load();
    } finally {
      setEnrolling(false);
    }
  }

  const launchEdition = hub?.editions.find(
    (e) =>
      e.slug === ACADEMY_EDITION_JUNE_2026 &&
      e.programSlug === ACADEMY_PROGRAM_LAUNCH,
  );

  return (
    <div className="space-y-4 pb-6">
      <header>
        <h1 className="text-xl font-extrabold text-[color:var(--fd-text)]">
          {t("academy_title")}
        </h1>
        <p className="mt-1 text-sm text-[color:var(--fd-muted)]">
          {t("academy_subtitle")}
        </p>
      </header>

      {err ? (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">{err}</p>
      ) : null}

      {!hub ? (
        <p className="text-sm text-[color:var(--fd-muted)]">…</p>
      ) : (
        <>
          {launchEdition ? (
            <section className="rounded-2xl border border-[color:var(--fd-primary)]/25 bg-[#305f33] p-4 text-white shadow-md">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#c5e8d0]">
                {t("academy_open_editions")}
              </p>
              <h2 className="mt-1 text-lg font-black">{launchEdition.title}</h2>
              {launchEdition.startsAt ? (
                <p className="mt-1 text-xs text-[#e8f3ee]">
                  {new Date(launchEdition.startsAt).toLocaleDateString()}
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                {launchEdition.enrolled ? (
                  <Link
                    href={`/app/academy/${launchEdition.slug}?program=${launchEdition.programSlug}`}
                    className="inline-flex rounded-xl bg-white px-4 py-2.5 text-sm font-extrabold text-[#305f33]"
                  >
                    {t("academy_enrolled")} →
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled={enrolling}
                    onClick={() =>
                      void enroll(launchEdition.slug, launchEdition.programSlug)
                    }
                    className="inline-flex rounded-xl bg-white px-4 py-2.5 text-sm font-extrabold text-[#305f33] disabled:opacity-60"
                  >
                    {t("academy_enroll")}
                  </button>
                )}
              </div>
            </section>
          ) : null}

          {hub.editions.length > 0 ? (
            <section>
              <h2 className="text-sm font-bold text-[color:var(--fd-text)]">
                {t("academy_my_cohorts")}
              </h2>
              <ul className="mt-2 space-y-2">
                {hub.editions
                  .filter((e) => e.enrolled)
                  .map((e) => (
                    <li key={e.id}>
                      <Link
                        href={`/app/academy/${e.slug}?program=${e.programSlug}`}
                        className="flex items-center justify-between rounded-xl border border-[color:var(--fd-border)] bg-white px-4 py-3 text-sm font-semibold text-[color:var(--fd-text)] shadow-sm"
                      >
                        {e.title}
                        <span aria-hidden>→</span>
                      </Link>
                    </li>
                  ))}
              </ul>
            </section>
          ) : null}

          {hub.credentials.length > 0 ? (
            <section>
              <h2 className="text-sm font-bold text-[color:var(--fd-text)]">
                {t("academy_badges")}
              </h2>
              <ul className="mt-2 space-y-2">
                {hub.credentials.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-xl border border-[color:var(--fd-border)] bg-white px-4 py-3"
                  >
                    <p className="text-sm font-bold text-[color:var(--fd-text)]">
                      {c.title}
                      {c.revoked ? " (revoked)" : ""}
                    </p>
                    <Link
                      href={`/verify/${c.verifyCode}`}
                      className="mt-1 text-xs font-semibold text-[color:var(--fd-primary)]"
                    >
                      {t("academy_verify_link")} →
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
