"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ComposePhotos } from "@/components/compose-photos";
import { IconShield, IconSpark } from "@/components/icons";
import { PolishButton } from "@/components/polish-button";
import { PoweredByMcbuleli } from "@/components/powered-by-mcbuleli";
import { TrustedContactsEditor } from "@/components/trusted-contacts-editor";
import { VoiceButton } from "@/components/voice-button";
import { useCitizenLocale } from "@/hooks/use-citizen-locale";
import { COMPOSE_MAX_CHARS } from "@/lib/compose/limits";
import { uploadPendingMedia } from "@/lib/compose/upload-pending";
import { messages } from "@/lib/i18n";
import type { SchoolConcernType } from "@/lib/school/types";
import { readLocalTrustedContacts } from "@/lib/trusted-contacts/client-store";
import { citizenShellMaxWidth, useDeviceClass } from "@/lib/ui/device";

type Step = "concern" | "tell" | "place";

type ProvinceOption = {
  id: string;
  name: string;
  cities: Array<{ id: string; name: string }>;
};

const CONCERNS: SchoolConcernType[] = [
  "harassment",
  "violence",
  "abuse",
  "cyber",
  "other",
];

export function SchoolFlow({ initialLocale }: { initialLocale?: string }) {
  const router = useRouter();
  const { locale, href } = useCitizenLocale(initialLocale);
  const t = messages[locale];
  const device = useDeviceClass();

  const [step, setStep] = useState<Step>("concern");
  const [concernType, setConcernType] = useState<SchoolConcernType | "">("");
  const [establishment, setEstablishment] = useState("");
  const [message, setMessage] = useState("");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [provinces, setProvinces] = useState<ProvinceOption[]>([]);
  const [provinceId, setProvinceId] = useState("");
  const [cityId, setCityId] = useState("");

  const cities = useMemo(() => {
    const p = provinces.find((x) => x.id === provinceId);
    return p?.cities ?? [];
  }, [provinces, provinceId]);

  const canSend =
    message.trim().length >= 3 || Boolean(audioBlob) || photos.length > 0;
  const canUsePlace = Boolean(provinceId);

  const concernLabels: Record<SchoolConcernType, string> = {
    harassment: t.schoolConcernHarassment,
    violence: t.schoolConcernViolence,
    abuse: t.schoolConcernAbuse,
    cyber: t.schoolConcernCyber,
    other: t.schoolConcernOther,
  };

  useEffect(() => {
    void fetch("/api/location/resolve")
      .then((r) => r.json())
      .then((d) => setProvinces(d.provinces ?? []))
      .catch(() => setProvinces([]));
  }, []);

  async function submit(opts: {
    shareLocation?: boolean;
    lat?: number;
    lng?: number;
    provinceId?: string;
    cityId?: string;
  }) {
    if (!concernType) return;
    setBusy(true);
    setError(null);
    try {
      const trustedContacts = readLocalTrustedContacts();
      const trimmed = message.trim().slice(0, COMPOSE_MAX_CHARS);
      const bodyMessage =
        trimmed.length >= 1 ? trimmed : audioBlob || photos.length ? "·" : trimmed;
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: bodyMessage,
          locale,
          source: "school",
          shareLocation: Boolean(opts.shareLocation),
          lat: opts.lat ?? null,
          lng: opts.lng ?? null,
          provinceId: opts.provinceId || null,
          cityId: opts.cityId || null,
          trustedContacts,
          schoolContext: {
            concernType,
            establishmentHint: establishment.trim() || null,
            isMinor: true,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.id) {
        setError(t.errorGeneric);
        setBusy(false);
        return;
      }
      await uploadPendingMedia({
        sessionId: data.id,
        audio: audioBlob,
        photos,
      });
      router.push(href(`/session/${data.id}`));
    } catch {
      setError(t.errorGeneric);
      setBusy(false);
    }
  }

  function requestGps() {
    if (!navigator.geolocation) {
      setHint(t.gpsUnavailable);
      return;
    }
    setBusy(true);
    setError(null);
    setHint(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await submit({
          shareLocation: true,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        setBusy(false);
        setHint(t.gpsDenied);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  }

  return (
    <main
      className={`ng-shell mx-auto flex min-h-dvh flex-col pb-8 pt-5 ${citizenShellMaxWidth(device)}`}
    >
      <header className="flex items-center justify-between gap-3">
        <Link href={href("/")} className="text-sm font-medium text-ng-muted">
          {t.back}
        </Link>
        <div className="flex flex-col items-end gap-0.5">
          <div className="inline-flex items-center gap-1.5 text-ng-primary">
            <IconSpark className="size-3.5" />
            <span className="text-[11px] font-semibold">{t.aiListening}</span>
          </div>
          <div className="inline-flex items-center gap-1.5 text-ng-primary">
            <IconShield className="size-3.5" />
            <span className="text-[10px] font-bold tracking-wide">{t.school}</span>
          </div>
        </div>
      </header>

      <p className="mt-4 rounded-xl bg-ng-primary-muted px-3 py-2 text-xs font-medium leading-relaxed text-ng-primary">
        {t.schoolSafety}
      </p>
      <p className="mt-2 text-xs text-ng-muted">{t.schoolAnonymousNote}</p>

      {step === "concern" ? (
        <section className="mt-6 flex flex-1 flex-col gap-4">
          <h1 className="text-xl font-semibold text-ng-primary">{t.schoolTitle}</h1>
          <p className="text-sm text-ng-muted">{t.schoolSubtitle}</p>
          <p className="text-xs font-semibold text-ng-muted">{t.schoolConcernPick}</p>
          <div className="flex flex-col gap-2">
            {CONCERNS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setConcernType(c)}
                className={`min-h-11 rounded-xl border px-3 text-left text-sm font-semibold ${
                  concernType === c
                    ? "border-ng-primary bg-ng-primary-muted text-ng-primary"
                    : "border-[var(--ng-border)] bg-ng-surface text-ng-text"
                }`}
              >
                {concernLabels[c]}
              </button>
            ))}
          </div>
          <label className="text-xs font-semibold text-ng-muted">
            {t.schoolEstablishment}
            <input
              value={establishment}
              onChange={(e) => setEstablishment(e.target.value)}
              placeholder={t.schoolEstablishmentPlaceholder}
              className="mt-1.5 min-h-11 w-full rounded-xl border border-[var(--ng-border)] bg-ng-surface px-3 text-sm text-ng-text"
            />
          </label>
          <button
            type="button"
            disabled={!concernType}
            onClick={() => setStep("tell")}
            className="mt-auto min-h-12 rounded-2xl bg-ng-primary px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            {t.send}
          </button>
        </section>
      ) : step === "tell" ? (
        <section className="mt-6 flex flex-1 flex-col gap-3">
          <h1 className="text-xl font-semibold text-ng-primary">{t.schoolTell}</h1>
          <div className="relative">
            <textarea
              value={message}
              onChange={(e) =>
                setMessage(e.target.value.slice(0, COMPOSE_MAX_CHARS))
              }
              placeholder={t.placeholder}
              rows={5}
              maxLength={COMPOSE_MAX_CHARS}
              className="w-full resize-none rounded-2xl border border-[var(--ng-border)] bg-ng-surface p-4 pb-8 text-base leading-relaxed text-ng-text outline-none focus:ring-2 ring-ng-primary"
              autoFocus
            />
            <span className="pointer-events-none absolute bottom-2.5 right-3 text-[11px] tabular-nums text-ng-muted">
              {message.length}/{COMPOSE_MAX_CHARS}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <VoiceButton
              locale={locale}
              label={t.voice}
              listeningLabel={t.voiceListening}
              unsupportedLabel={t.voiceUnsupported}
              onText={(text) =>
                setMessage((prev) => {
                  const next = prev ? `${prev} ${text}` : text;
                  return next.slice(0, COMPOSE_MAX_CHARS);
                })
              }
              onAudioChange={setAudioBlob}
            />
            <ComposePhotos
              photos={photos}
              onChange={setPhotos}
              label={t.addMedia}
            />
            <PolishButton
              text={message}
              locale={locale}
              label={t.polish}
              busyLabel={t.polishing}
              disabled={busy}
              onPolished={(text) =>
                setMessage(text.slice(0, COMPOSE_MAX_CHARS))
              }
            />
          </div>
          {error ? (
            <p className="text-sm font-medium text-ng-urgent">{error}</p>
          ) : null}
          <button
            type="button"
            disabled={!canSend || busy}
            onClick={() => setStep("place")}
            className="mt-auto min-h-12 rounded-2xl bg-ng-urgent px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            {t.send}
          </button>
        </section>
      ) : (
        <section className="mt-6 flex flex-1 flex-col gap-4">
          <h1 className="text-xl font-semibold text-ng-primary">{t.gpsAsk}</h1>
          <p className="text-sm text-ng-muted line-clamp-3">{message}</p>
          {hint ? (
            <p className="text-sm font-medium text-ng-warning">{hint}</p>
          ) : null}
          {error ? (
            <p className="text-sm font-medium text-ng-urgent">{error}</p>
          ) : null}

          <label className="text-xs font-semibold text-ng-muted">
            {t.province}
            <select
              value={provinceId}
              onChange={(e) => {
                setProvinceId(e.target.value);
                setCityId("");
                setHint(null);
              }}
              className="mt-1.5 min-h-11 w-full rounded-xl border border-[var(--ng-border)] bg-ng-surface px-3 text-sm text-ng-text"
            >
              <option value="">{t.provincePick}</option>
              {provinces.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs font-semibold text-ng-muted">
            {t.city}
            <select
              value={cityId}
              disabled={!provinceId || cities.length === 0}
              onChange={(e) => setCityId(e.target.value)}
              className="mt-1.5 min-h-11 w-full rounded-xl border border-[var(--ng-border)] bg-ng-surface px-3 text-sm text-ng-text disabled:opacity-50"
            >
              <option value="">{t.cityPick}</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <TrustedContactsEditor />

          <div className="mt-auto flex flex-col gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={requestGps}
              className="min-h-12 rounded-2xl bg-ng-primary px-4 text-sm font-semibold text-white disabled:opacity-50"
            >
              {busy ? t.sending : t.shareGps}
            </button>
            <button
              type="button"
              disabled={busy || !canUsePlace}
              onClick={() =>
                void submit({
                  provinceId,
                  cityId: cityId || undefined,
                })
              }
              className="min-h-12 rounded-2xl border border-[var(--ng-border)] bg-ng-surface px-4 text-sm font-semibold text-ng-primary disabled:opacity-50"
            >
              {t.usePlace}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void submit({})}
              className="min-h-11 text-sm font-medium text-ng-muted"
            >
              {t.skipGps}
            </button>
          </div>
        </section>
      )}
      <PoweredByMcbuleli />
    </main>
  );
}
