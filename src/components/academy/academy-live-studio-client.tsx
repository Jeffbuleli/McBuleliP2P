"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import type { Messages } from "@/i18n/messages";

const LIVE_STUDIO_ERR_KEYS = [
  "academy_live_invalid_plan",
  "academy_live_purchase_active",
  "academy_live_purchase_failed",
  "academy_live_insufficient_balance",
  "academy_live_no_credits",
  "academy_live_create_failed",
  "academy_db_not_migrated",
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
};

type Tab = "plans" | "publish" | "mine" | "catalog";

export function AcademyLiveStudioClient() {
  const { t } = useI18n();
  const [tab, setTab] = useState<Tab>("catalog");
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [mine, setMine] = useState<MineRow[]>([]);
  const [catalog, setCatalog] = useState<PublishedWebinarRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [dbPending, setDbPending] = useState(false);

  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
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
    setDbPending(false);
    setErr(null);
    if (j.purchase) setTab((t0) => (t0 === "plans" ? "publish" : t0));
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
      setTab("publish");
    } finally {
      setBusy(null);
    }
  }

  async function publishWebinar() {
    if (!title.trim() || !startsAt) return;
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
      await load();
      setTab("mine");
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

  const tabs: { id: Tab; icon: "live" | "calendar" | "video" | "wallet" }[] = [
    { id: "catalog", icon: "live" },
    { id: "plans", icon: "wallet" },
    { id: "publish", icon: "calendar" },
    { id: "mine", icon: "video" },
  ];

  return (
    <div className={`space-y-3 pb-8 ${academyCls.root}`}>
      <Link href="/app/academy" className="text-sm font-semibold text-[#305f33]">
        ← {t("academy_title")}
      </Link>

      <header className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#305f33] shadow-md ring-4 ring-[#e8f3ee]">
          <AcademyIcon name="live" className="h-7 w-7 !text-white" />
        </div>
        <h1 className="mt-2 text-lg font-black">{t("academy_live_studio_title")}</h1>
      </header>

      <AcademyLiveAccessFlow />

      <nav className="grid grid-cols-4 gap-1 rounded-xl bg-[#e8f3ee]/80 p-1">
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
          {dbPending ? (
            <button type="button" onClick={() => void load()} className="mt-1 text-xs underline">
              {t("academy_retry")}
            </button>
          ) : null}
        </div>
      ) : null}

      {tab === "catalog" ? (
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
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                    w.isLiveNow ? "bg-rose-100" : "bg-[#e8f3ee]"
                  }`}
                >
                  <AcademyIcon name="live" className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{w.title}</p>
                  <p className="text-[10px] text-[color:var(--fd-muted)]">
                    {w.themeLabel} · {w.hostPseudo}
                  </p>
                </div>
                <Link
                  href={`/app/academy/${w.editionSlug}/live/${w.sessionSlug}?program=${encodeURIComponent(w.programSlug)}`}
                  className="shrink-0 rounded-lg bg-[#305f33] px-2.5 py-1.5 text-[10px] font-extrabold text-white"
                >
                  {t("academy_webinar_join")}
                </Link>
              </li>
            ))
          )}
        </ul>
      ) : null}

      {tab === "plans" && !purchase ? (
        <ul className="space-y-2">
          {(Object.keys(ACADEMY_LIVE_PLANS) as AcademyLivePlanId[]).map((id) => {
            const p = ACADEMY_LIVE_PLANS[id];
            return (
              <li key={id}>
                <button
                  type="button"
                  disabled={!!busy}
                  onClick={() => void buy(id)}
                  className="flex w-full items-center gap-3 rounded-2xl border-2 border-[color:var(--fd-border)] bg-white px-4 py-3 text-left shadow-sm disabled:opacity-60"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#e8f3ee]">
                    <AcademyIcon name={planIcons[id]} className="h-6 w-6" />
                  </span>
                  <div className="flex-1">
                    <p className="text-lg font-black text-[#305f33]">{p.priceUsdt} USDT</p>
                    <p className="text-[10px] text-[color:var(--fd-muted)]">
                      {p.sessionsPerPeriod} live · {p.maxParticipants} pers.
                    </p>
                  </div>
                  <span className="text-xs font-bold">{busy === id ? "…" : "→"}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {tab === "publish" && purchase ? (
        <section className="space-y-2 rounded-2xl border border-[color:var(--fd-border)] bg-white p-3">
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
        </section>
      ) : tab === "publish" && !purchase ? (
        <p className="text-center text-xs text-[color:var(--fd-muted)]">
          {t("academy_webinar_need_plan")}
        </p>
      ) : null}

      {tab === "mine" ? (
        <ul className="space-y-2">
          {mine.length === 0 ? (
            <li className="py-4 text-center text-xs text-[color:var(--fd-muted)]">
              {t("academy_webinar_mine_empty")}
            </li>
          ) : (
            mine.map((m) => (
              <li key={m.editionSlug} className="rounded-xl border bg-white p-3">
                <p className="text-sm font-bold">{m.title}</p>
                <p className="text-[10px] text-[color:var(--fd-muted)]">
                  {m.registrationCount} {t("academy_webinar_inscrits")} ·{" "}
                  {new Date(m.startsAt).toLocaleString()}
                </p>
                {m.publicUrl ? (
                  <p className="mt-1 truncate text-[10px] font-semibold text-[#305f33]">
                    {m.publicUrl}
                  </p>
                ) : null}
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void loadRegistrations(m.editionSlug)}
                    className="rounded-lg border px-2 py-1 text-[10px] font-bold"
                  >
                    {t("academy_webinar_see_inscrits")}
                  </button>
                  {m.publicUrl ? (
                    <button
                      type="button"
                      onClick={() => void navigator.clipboard.writeText(m.publicUrl!)}
                      className="rounded-lg bg-[#e8f3ee] px-2 py-1 text-[10px] font-bold text-[#305f33]"
                    >
                      {t("academy_webinar_copy_link")}
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
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
