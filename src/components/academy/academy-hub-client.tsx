"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { interpolate } from "@/i18n/messages";
import { fetchWithDeadline } from "@/lib/fetch-with-deadline";
import {
  ACADEMY_EDITION_JUNE_2026,
  ACADEMY_PROGRAM_LAUNCH,
} from "@/lib/academy-config";
import { academyCls } from "@/components/academy/academy-ui";

type FormationLead = {
  registeredOnFormation: boolean;
  enrolledInLaunch: boolean;
  fullName: string | null;
};

type Hub = {
  viewer: "learner" | "staff";
  formationLead: FormationLead;
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
  const [dbPending, setDbPending] = useState(false);
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
        if (res.status === 503 && j.error === "academy_db_not_migrated") {
          setDbPending(true);
          setErr(t("academy_db_not_ready"));
        } else {
          setDbPending(false);
          setErr(t("academy_error_load"));
        }
        return;
      }
      setDbPending(false);
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

  const isStaff = hub?.viewer === "staff";
  const showFormationEnroll =
    hub?.formationLead.registeredOnFormation &&
    !hub?.formationLead.enrolledInLaunch &&
    launchEdition &&
    !launchEdition.enrolled;

  return (
    <div className={`space-y-4 pb-6 ${academyCls.root}`}>
      <header>
        <h1 className="text-xl font-extrabold text-[color:var(--fd-text)]">
          {isStaff ? t("academy_title_staff") : t("academy_title")}
        </h1>
        <p className="mt-1 text-sm text-[color:var(--fd-muted)]">
          {isStaff ? t("academy_subtitle_staff") : t("academy_subtitle")}
        </p>
      </header>

      {isStaff ? (
        <section className="rounded-2xl border-2 border-amber-600/30 bg-amber-50 p-4">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900">
            {t("academy_staff_badge")}
          </p>
          <p className="mt-1 text-xs text-amber-950">{t("academy_staff_hint")}</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Link
              href="/admin/academy"
              className="inline-flex justify-center rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-bold text-white"
            >
              {t("academy_staff_ops")} →
            </Link>
            <Link
              href="/admin/training-registrations"
              className="inline-flex justify-center rounded-xl border border-amber-800/30 bg-white px-4 py-2.5 text-sm font-bold text-amber-950"
            >
              {t("academy_staff_formation_list")} →
            </Link>
            <Link
              href="/app/profile/ops"
              className="inline-flex justify-center rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-xs font-bold text-stone-700"
            >
              {t("academy_staff_ops_hub")} →
            </Link>
          </div>
        </section>
      ) : null}

      {err ? (
        <div
          className={`rounded-xl px-3 py-2 text-sm font-semibold ${
            dbPending
              ? "bg-amber-50 text-amber-900"
              : "bg-rose-50 text-rose-800"
          }`}
        >
          <p>{err}</p>
          {dbPending ? (
            <button
              type="button"
              onClick={() => void load()}
              className="mt-2 text-xs font-extrabold underline"
            >
              {t("academy_retry")}
            </button>
          ) : null}
        </div>
      ) : null}

      {!hub ? (
        <p className="text-sm text-[color:var(--fd-muted)]">…</p>
      ) : (
        <>
          {showFormationEnroll ? (
            <section className="rounded-2xl border border-[color:var(--fd-primary)]/40 bg-[#e8f3ee] p-4">
              <p className="text-sm font-bold text-[#305f33]">
                {t("academy_formation_linked_title")}
              </p>
              <p className="mt-1 text-xs text-[#1a2e1c]">
                {hub.formationLead.fullName
                  ? interpolate(t("academy_formation_linked_body_named"), {
                      name: hub.formationLead.fullName,
                    })
                  : t("academy_formation_linked_body")}
              </p>
              <button
                type="button"
                disabled={enrolling}
                onClick={() =>
                  void enroll(launchEdition.slug, launchEdition.programSlug)
                }
                className="mt-3 w-full rounded-xl bg-[#305f33] px-4 py-2.5 text-sm font-extrabold text-white disabled:opacity-60"
              >
                {t("academy_formation_activate")}
              </button>
            </section>
          ) : null}

          {!isStaff && launchEdition ? (
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
                    {t("academy_enter_cohort")} →
                  </Link>
                ) : showFormationEnroll ? null : (
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

          {hub.editions.some((e) => e.enrolled) ? (
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
          ) : !isStaff ? (
            <section className="rounded-xl border border-dashed border-[color:var(--fd-border)] bg-white p-4 text-center">
              <p className="text-sm font-semibold text-[color:var(--fd-text)]">
                {t("academy_no_cohort_yet")}
              </p>
              <p className="mt-1 text-xs text-[color:var(--fd-muted)]">
                {t("academy_no_cohort_hint")}
              </p>
              <Link
                href="/formation"
                className="mt-3 inline-flex text-sm font-bold text-[color:var(--fd-primary)] underline"
              >
                {t("academy_go_formation")} →
              </Link>
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
                    <div className="mt-1 flex flex-wrap gap-3">
                      <Link
                        href={`/verify/${c.verifyCode}`}
                        className="text-xs font-semibold text-[color:var(--fd-primary)]"
                      >
                        {t("academy_verify_link")} →
                      </Link>
                      {!c.revoked ? (
                        <a
                          href={`/api/academy/verify/${c.verifyCode}/openbadge`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-[color:var(--fd-muted)]"
                        >
                          {t("academy_openbadge_json")} ↗
                        </a>
                      ) : null}
                    </div>
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
