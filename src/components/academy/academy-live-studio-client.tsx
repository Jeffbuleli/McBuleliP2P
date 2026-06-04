"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { AcademyLiveAccessFlow } from "@/components/academy/academy-live-access-flow";
import { AcademyIcon } from "@/components/academy/academy-icon";
import { academyCls } from "@/components/academy/academy-ui";
import { ACADEMY_LIVE_PLANS, type AcademyLivePlanId } from "@/lib/academy-live-plans";
import { fetchWithDeadline } from "@/lib/fetch-with-deadline";
import type { Messages } from "@/i18n/messages";

const LIVE_STUDIO_ERR_KEYS = [
  "academy_live_invalid_plan",
  "academy_live_purchase_active",
  "academy_live_purchase_failed",
  "academy_live_insufficient_balance",
  "academy_live_no_credits",
  "academy_live_create_failed",
] as const satisfies readonly (keyof Messages)[];

function liveStudioErrorMessage(
  code: string,
  t: (key: keyof Messages) => string,
): string {
  if ((LIVE_STUDIO_ERR_KEYS as readonly string[]).includes(code)) {
    return t(code as (typeof LIVE_STUDIO_ERR_KEYS)[number]);
  }
  return t("academy_live_purchase_failed");
}

type Purchase = {
  id: string;
  planId: AcademyLivePlanId;
  sessionsRemaining: number;
  maxParticipants: number;
  expiresAt: string | null;
};

export function AcademyLiveStudioClient() {
  const { t } = useI18n();
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [created, setCreated] = useState<{
    editionSlug: string;
    sessionSlug: string;
    programSlug: string;
  } | null>(null);

  const load = useCallback(async () => {
    const res = await fetchWithDeadline(
      "/api/academy/live/studio",
      { credentials: "include", cache: "no-store" },
      20_000,
    );
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(t("academy_error_load"));
      return;
    }
    setPurchase(j.purchase ?? null);
    setErr(null);
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  async function buy(planId: AcademyLivePlanId) {
    setBusy(planId);
    setErr(null);
    try {
      const res = await fetchWithDeadline(
        "/api/academy/live/studio/purchase",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ planId }),
        },
        20_000,
      );
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(liveStudioErrorMessage((j.error as string) || "", t));
        return;
      }
      setPurchase(j.purchase);
    } finally {
      setBusy(null);
    }
  }

  async function createLive() {
    if (!title.trim() || !startsAt) return;
    setBusy("create");
    setErr(null);
    try {
      const res = await fetchWithDeadline(
        "/api/academy/live/studio/create",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            titleFr: title.trim(),
            startsAt: new Date(startsAt).toISOString(),
          }),
        },
        20_000,
      );
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(liveStudioErrorMessage((j.error as string) || "", t));
        return;
      }
      setCreated({
        editionSlug: j.editionSlug,
        sessionSlug: j.sessionSlug,
        programSlug: j.programSlug,
      });
    } finally {
      setBusy(null);
    }
  }

  const planIcons: Record<AcademyLivePlanId, "calendar" | "live" | "video"> = {
    starter: "calendar",
    community: "live",
    campus: "video",
  };

  return (
    <div className={`space-y-4 pb-8 ${academyCls.root}`}>
      <Link
        href="/app/academy"
        className="text-sm font-semibold text-[color:var(--fd-primary)]"
      >
        ← {t("academy_title")}
      </Link>

      <header className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#305f33] shadow-md">
          <AcademyIcon name="live" className="h-8 w-8 !text-white" />
        </div>
        <h1 className="mt-3 text-xl font-black text-[color:var(--fd-text)]">
          {t("academy_live_studio_title")}
        </h1>
      </header>

      <AcademyLiveAccessFlow />

      {err ? (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800">
          {err}
        </p>
      ) : null}

      {created ? (
        <section className="rounded-2xl border-2 border-[#305f33] bg-white p-4 text-center shadow-sm">
          <p className="text-sm font-bold text-[#305f33]">{t("academy_live_studio_ready")}</p>
          <Link
            href={`/app/academy/${created.editionSlug}/live/${created.sessionSlug}?program=${encodeURIComponent(created.programSlug)}`}
            className="mt-3 inline-flex w-full justify-center rounded-xl bg-[#305f33] px-4 py-3 text-sm font-extrabold text-white"
          >
            {t("academy_live_studio_open_room")} →
          </Link>
        </section>
      ) : purchase ? (
        <section className="space-y-3 rounded-2xl border border-[color:var(--fd-border)] bg-white p-4">
          <p className="text-center text-xs font-bold text-[#305f33]">
            {t("academy_live_studio_credits")}: {purchase.sessionsRemaining}
          </p>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("academy_live_studio_title_ph")}
            className="w-full rounded-xl border border-[color:var(--fd-border)] px-3 py-2.5 text-sm"
          />
          <input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className="w-full rounded-xl border border-[color:var(--fd-border)] px-3 py-2.5 text-sm"
          />
          <button
            type="button"
            disabled={busy === "create" || !title.trim() || !startsAt}
            onClick={() => void createLive()}
            className="w-full rounded-xl bg-[#305f33] py-3 text-sm font-extrabold text-white disabled:opacity-60"
          >
            {busy === "create" ? "…" : t("academy_live_studio_create")}
          </button>
        </section>
      ) : (
        <ul className="space-y-2">
          {(Object.keys(ACADEMY_LIVE_PLANS) as AcademyLivePlanId[]).map((id) => {
            const p = ACADEMY_LIVE_PLANS[id];
            return (
              <li key={id}>
                <button
                  type="button"
                  disabled={!!busy}
                  onClick={() => void buy(id)}
                  className="flex w-full items-center gap-3 rounded-2xl border-2 border-[color:var(--fd-border)] bg-white px-4 py-3 text-left shadow-sm active:scale-[0.99] disabled:opacity-60"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#e8f3ee]">
                    <AcademyIcon name={planIcons[id]} className="h-6 w-6" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-extrabold text-[color:var(--fd-text)]">
                      {p.priceUsdt} USDT
                    </p>
                    <p className="text-[10px] text-[color:var(--fd-muted)]">
                      {p.maxParticipants} · {p.maxMinutesPerSession} min
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#305f33]">
                    {busy === id ? "…" : "→"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-center text-[10px] leading-snug text-[color:var(--fd-muted)]">
        {t("academy_live_studio_foot")}
      </p>
    </div>
  );
}
