"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useI18n } from "@/components/i18n-provider";
import { AcademyLiveAccessFlow } from "@/components/academy/academy-live-access-flow";
import { AcademyIcon } from "@/components/academy/academy-icon";
import { academyCls } from "@/components/academy/academy-ui";
import { ACADEMY_LIVE_PLANS, type AcademyLivePlanId } from "@/lib/academy-live-plans";
import {
  WEBINAR_SUB_THEMES,
  WEBINAR_THEMES,
  type WebinarThemeId,
} from "@/lib/academy-webinar-themes";
import type { PublishedWebinarRow } from "@/lib/academy-webinar-service";
import { fetchWithDeadline } from "@/lib/fetch-with-deadline";
import { formatWalletHistoryAmount } from "@/lib/wallet-types";
import type { Messages } from "@/i18n/messages";

const LIVE_STUDIO_ERR_KEYS = [
  "academy_live_invalid_plan",
  "academy_live_purchase_active",
  "academy_live_purchase_failed",
  "academy_live_insufficient_balance",
  "academy_live_no_credits",
  "academy_live_create_failed",
  "academy_db_not_migrated",
  "academy_webinar_started",
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
};

type MineRow = {
  editionSlug: string;
  sessionSlug: string;
  title: string;
  publicSlug: string | null;
  publicUrl: string | null;
  startsAt: string;
  registrationCount: number;
  status: string;
};

type Tab = "discover" | "create" | "mine";

export function AcademyLiveStudioClient() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as Tab | null) ?? "create";
  const [tab, setTab] = useState<Tab>(
    ["discover", "create", "mine"].includes(initialTab) ? initialTab : "create",
  );
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [mine, setMine] = useState<MineRow[]>([]);
  const [catalog, setCatalog] = useState<PublishedWebinarRow[]>([]);
  const [balanceUsdt, setBalanceUsdt] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dbPending, setDbPending] = useState(false);
  const [confirmPlan, setConfirmPlan] = useState<AcademyLivePlanId | null>(null);

  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [durationMin, setDurationMin] = useState(90);
  const [theme, setTheme] = useState<WebinarThemeId>("crypto");
  const [subTheme, setSubTheme] = useState("wallet");
  const [coordinates, setCoordinates] = useState("");
  const [published, setPublished] = useState<{
    publicUrl: string;
    editionSlug: string;
    sessionSlug: string;
    programSlug: string;
  } | null>(null);

  const [ownerEdition, setOwnerEdition] = useState<string | null>(null);
  const [registrations, setRegistrations] = useState<
    { pseudo: string; emailMasked: string; enrolledAt: string }[]
  >([]);

  const subThemes = useMemo(
    () => WEBINAR_SUB_THEMES[theme] ?? [],
    [theme],
  );

  const load = useCallback(async () => {
    const res = await fetchWithDeadline(
      "/api/academy/live/studio",
      { credentials: "include", cache: "no-store" },
      20_000,
    );
    const j = await res.json().catch(() => ({}));
    if (res.status === 503 && j.error === "academy_db_not_migrated") {
      setDbPending(true);
      setErr(t("academy_db_not_migrated"));
      return;
    }
    if (!res.ok) {
      setErr(t("academy_error_load"));
      return;
    }
    setPurchase(j.purchase ?? null);
    setMine(j.mine ?? []);
    setCatalog(j.catalog ?? []);
    setBalanceUsdt(Number(j.balanceUsdt) || 0);
    setDbPending(false);
    setErr(null);
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  function startBuy(planId: AcademyLivePlanId) {
    setErr(null);
    setSuccess(null);
    const price = ACADEMY_LIVE_PLANS[planId].priceUsdt;
    if (balanceUsdt + 1e-9 < price) {
      setErr(t("academy_live_insufficient_balance"));
      return;
    }
    setConfirmPlan(planId);
  }

  async function buy(planId: AcademyLivePlanId) {
    setConfirmPlan(null);
    setBusy(planId);
    setErr(null);
    setSuccess(null);
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
      if (res.status === 503 && j.error === "academy_db_not_migrated") {
        setDbPending(true);
        setErr(t("academy_db_not_migrated"));
        return;
      }
      if (!res.ok) {
        setErr(liveStudioErrorMessage((j.error as string) || "", t));
        return;
      }
      setPurchase(j.purchase);
      setBalanceUsdt((b) =>
        Math.max(0, b - ACADEMY_LIVE_PLANS[planId].priceUsdt),
      );
      setSuccess(t("academy_live_pay_success"));
    } finally {
      setBusy(null);
    }
  }

  async function publishWebinar() {
    if (!title.trim() || !startsAt || !purchase) return;
    setBusy("publish");
    setErr(null);
    try {
      const res = await fetchWithDeadline(
        "/api/academy/live/studio/publish",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            titleFr: title.trim(),
            startsAt: new Date(startsAt).toISOString(),
            durationMin,
            theme,
            subTheme,
            coordinatesLabel: coordinates.trim() || undefined,
          }),
        },
        20_000,
      );
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(liveStudioErrorMessage((j.error as string) || "", t));
        return;
      }
      setPublished({
        publicUrl: j.publicUrl as string,
        editionSlug: j.editionSlug,
        sessionSlug: j.sessionSlug,
        programSlug: j.programSlug,
      });
      setSuccess(t("academy_webinar_publish_ok"));
      setTitle("");
      setStartsAt("");
      await load();
      setTab("mine");
    } finally {
      setBusy(null);
    }
  }

  async function cancelWebinar(editionSlug: string) {
    setBusy(`cancel-${editionSlug}`);
    setErr(null);
    try {
      const res = await fetchWithDeadline(
        `/api/academy/live/studio/${encodeURIComponent(editionSlug)}`,
        { method: "DELETE", credentials: "include" },
        15_000,
      );
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(liveStudioErrorMessage((j.error as string) || "", t));
        return;
      }
      setSuccess(t("academy_webinar_cancel_ok"));
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function loadRegistrations(editionSlug: string) {
    setOwnerEdition(editionSlug);
    const res = await fetchWithDeadline(
      `/api/academy/live/studio/${encodeURIComponent(editionSlug)}/registrations`,
      { credentials: "include", cache: "no-store" },
      15_000,
    );
    const j = await res.json().catch(() => ({}));
    setRegistrations(res.ok ? (j.registrations ?? []) : []);
  }

  const planIcons: Record<AcademyLivePlanId, "calendar" | "live" | "video"> = {
    starter: "calendar",
    community: "live",
    campus: "video",
  };

  const tabs: { id: Tab; icon: "live" | "calendar" | "video" }[] = [
    { id: "create", icon: "calendar" },
    { id: "mine", icon: "video" },
    { id: "discover", icon: "live" },
  ];

  const activeMine = mine.filter((m) => m.status !== "closed");

  return (
    <div className={`space-y-3 pb-8 ${academyCls.root}`}>
      <Link href="/app/academy" className="text-sm font-semibold text-[#305f33]">
        ← {t("academy_title")}
      </Link>

      <header className="flex items-center gap-3">
        <img src="/academy/event-live.svg" alt="" className="h-12 w-12" />
        <div>
          <h1 className="text-lg font-black">{t("academy_live_studio_title")}</h1>
          <p className="text-[10px] text-[color:var(--fd-muted)]">
            {t("academy_studio_flow_hint")}
          </p>
        </div>
      </header>

      <AcademyLiveAccessFlow />

      <nav className="grid grid-cols-3 gap-1 rounded-xl bg-[#e8f3ee]/80 p-1">
        {tabs.map(({ id, icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex flex-col items-center rounded-lg py-2 text-[9px] font-extrabold ${
              tab === id ? "bg-white text-[#305f33] shadow-sm" : "text-stone-600"
            }`}
          >
            <AcademyIcon name={icon} className="h-4 w-4" />
            {t(`academy_studio_tab_${id}` as keyof Messages)}
          </button>
        ))}
      </nav>

      {err ? (
        <div className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800">
          <p>{err}</p>
          {err === t("academy_live_insufficient_balance") ? (
            <Link href="/app/wallet" className="mt-1 inline-block text-xs font-bold underline">
              {t("academy_live_pay_go_wallet")} →
            </Link>
          ) : null}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-xl bg-[#e8f3ee] px-3 py-2 text-sm font-semibold text-[#305f33]">
          {success}
        </div>
      ) : null}

      {tab === "discover" ? (
        <ul className="space-y-2">
          {catalog.length === 0 ? (
            <li className="rounded-xl bg-white px-3 py-6 text-center text-xs text-[color:var(--fd-muted)]">
              {t("academy_webinar_catalog_empty")}
            </li>
          ) : (
            catalog.map((w) => (
              <li
                key={w.publicSlug}
                className="flex items-center gap-3 rounded-2xl border border-[color:var(--fd-border)] bg-white px-3 py-3"
              >
                <AcademyIcon name="live" className="h-5 w-5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{w.title}</p>
                  <p className="text-[10px] text-[color:var(--fd-muted)]">
                    {w.themeLabel} · {new Date(w.startsAt).toLocaleString()}
                  </p>
                </div>
                <Link
                  href={`/app/academy/${w.editionSlug}/event/${w.sessionSlug}?program=${encodeURIComponent(w.programSlug)}`}
                  className="shrink-0 rounded-lg bg-[#305f33] px-2.5 py-1.5 text-[10px] font-extrabold text-white"
                >
                  {t("academy_webinar_join")}
                </Link>
              </li>
            ))
          )}
        </ul>
      ) : null}

      {tab === "create" ? (
        <section className="space-y-3">
          {!purchase ? (
            <>
              <div className="rounded-2xl border border-[#c5dcc9] bg-[#f4faf6] p-3 text-center">
                <p className="text-xs font-extrabold text-[#305f33]">
                  {t("academy_live_pay_guide_title")}
                </p>
                <p className="mt-1 text-[10px] text-[color:var(--fd-muted)]">
                  {formatWalletHistoryAmount("USDT", String(balanceUsdt))} USDT
                </p>
              </div>
              {confirmPlan ? (
                <div className="rounded-2xl border-2 border-[#305f33] bg-white p-3 text-center">
                  <p className="text-sm font-bold text-[#305f33]">
                    {t("academy_live_pay_confirm").replace(
                      "{price}",
                      String(ACADEMY_LIVE_PLANS[confirmPlan].priceUsdt),
                    )}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmPlan(null)}
                      className="flex-1 rounded-xl border py-2 text-xs font-bold"
                    >
                      {t("academy_live_pay_cancel")}
                    </button>
                    <button
                      type="button"
                      disabled={!!busy}
                      onClick={() => void buy(confirmPlan)}
                      className="flex-1 rounded-xl bg-[#305f33] py-2 text-xs font-extrabold text-white"
                    >
                      {busy === confirmPlan ? "…" : t("academy_live_pay_confirm_btn")}
                    </button>
                  </div>
                </div>
              ) : null}
              <ul className="space-y-2">
                {(Object.keys(ACADEMY_LIVE_PLANS) as AcademyLivePlanId[]).map((id) => {
                  const p = ACADEMY_LIVE_PLANS[id];
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        disabled={!!busy}
                        onClick={() => startBuy(id)}
                        className="flex w-full items-center gap-3 rounded-2xl border bg-white px-3 py-3 text-left"
                      >
                        <AcademyIcon name={planIcons[id]} className="h-6 w-6" />
                        <span className="flex-1 text-sm font-bold">{p.labelFr}</span>
                        <span className="text-sm font-black text-[#305f33]">
                          {p.priceUsdt} USDT
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <div className="space-y-2 rounded-2xl border bg-white p-3">
              <p className="text-center text-[10px] font-bold text-[#305f33]">
                {t("academy_live_studio_credits")}: {purchase.sessionsRemaining}
              </p>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("academy_live_studio_title_ph")}
                className="w-full rounded-xl border px-3 py-2 text-sm"
              />
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm"
              />
              <select
                value={durationMin}
                onChange={(e) => setDurationMin(Number(e.target.value))}
                className="w-full rounded-xl border px-3 py-2 text-sm font-bold"
              >
                <option value={60}>60 min</option>
                <option value={90}>90 min</option>
                <option value={120}>120 min</option>
              </select>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={theme}
                  onChange={(e) => {
                    const th = e.target.value as WebinarThemeId;
                    setTheme(th);
                    setSubTheme(WEBINAR_SUB_THEMES[th][0]?.id ?? "webinar");
                  }}
                  className="rounded-xl border px-2 py-2 text-xs font-bold"
                >
                  {WEBINAR_THEMES.map((th) => (
                    <option key={th.id} value={th.id}>
                      {th.labelFr}
                    </option>
                  ))}
                </select>
                <select
                  value={subTheme}
                  onChange={(e) => setSubTheme(e.target.value)}
                  className="rounded-xl border px-2 py-2 text-xs font-bold"
                >
                  {subThemes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.labelFr}
                    </option>
                  ))}
                </select>
              </div>
              <input
                value={coordinates}
                onChange={(e) => setCoordinates(e.target.value)}
                placeholder={t("academy_webinar_coords_ph")}
                className="w-full rounded-xl border px-3 py-2 text-sm"
              />
              <button
                type="button"
                disabled={busy === "publish" || !title.trim() || !startsAt}
                onClick={() => void publishWebinar()}
                className="w-full rounded-xl bg-[#305f33] py-3 text-sm font-extrabold text-white disabled:opacity-60"
              >
                {busy === "publish" ? "…" : t("academy_webinar_publish")}
              </button>
              {published ? (
                <p className="break-all text-center text-[10px] font-bold text-[#305f33]">
                  {published.publicUrl}
                </p>
              ) : null}
            </div>
          )}
        </section>
      ) : null}

      {tab === "mine" ? (
        <ul className="space-y-2">
          {activeMine.length === 0 ? (
            <li className="py-4 text-center text-xs text-[color:var(--fd-muted)]">
              {t("academy_webinar_mine_empty")}
            </li>
          ) : (
            activeMine.map((m) => {
              const canCancel = new Date(m.startsAt).getTime() > Date.now();
              return (
                <li key={m.editionSlug} className="rounded-xl border bg-white p-3">
                  <div className="flex items-start gap-2">
                    <AcademyIcon name="live" className="mt-0.5 h-5 w-5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold">{m.title}</p>
                      <p className="text-[10px] text-[color:var(--fd-muted)]">
                        {m.registrationCount} {t("academy_webinar_inscrits")} ·{" "}
                        {new Date(m.startsAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Link
                      href={`/app/academy/${m.editionSlug}/event/${m.sessionSlug}?program=live-studio`}
                      className="rounded-lg bg-[#305f33] px-2 py-1 text-[10px] font-bold text-white"
                    >
                      McBuleli Live
                    </Link>
                    <button
                      type="button"
                      onClick={() => void loadRegistrations(m.editionSlug)}
                      className="rounded-lg border px-2 py-1 text-[10px] font-bold"
                    >
                      {t("academy_webinar_see_inscrits")}
                    </button>
                    {canCancel ? (
                      <button
                        type="button"
                        disabled={busy === `cancel-${m.editionSlug}`}
                        onClick={() => void cancelWebinar(m.editionSlug)}
                        className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-800"
                      >
                        {t("academy_webinar_cancel")}
                      </button>
                    ) : null}
                  </div>
                  {ownerEdition === m.editionSlug && registrations.length > 0 ? (
                    <ul className="mt-2 space-y-1 border-t pt-2 text-[10px]">
                      {registrations.map((r, i) => (
                        <li key={i} className="flex justify-between">
                          <span className="font-bold">{r.pseudo}</span>
                          <span className="text-[color:var(--fd-muted)]">{r.emailMasked}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })
          )}
        </ul>
      ) : null}

      <p className="text-center text-[10px] text-[color:var(--fd-muted)]">
        {t("academy_live_studio_foot")}
      </p>
    </div>
  );
}
