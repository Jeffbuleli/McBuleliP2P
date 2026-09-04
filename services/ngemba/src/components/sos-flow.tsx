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
import { vibrateDiscreteConfirm } from "@/lib/discrete/vibrate";
import { messages } from "@/lib/i18n";
import { readLocalTrustedContacts } from "@/lib/trusted-contacts/client-store";
import {
  citizenPagePad,
  citizenShellMaxWidth,
  useDeviceClass,
} from "@/lib/ui/device";

type Step = "tell" | "place";
type Source = "sos_button" | "witness";

type ProvinceOption = {
  id: string;
  name: string;
  cities: Array<{ id: string; name: string }>;
};

export function SosFlow({
  initialLocale,
  source = "sos_button",
  discrete = false,
}: {
  initialLocale?: string;
  source?: Source;
  discrete?: boolean;
}) {
  const router = useRouter();
  const { locale, href } = useCitizenLocale(initialLocale);
  const t = messages[locale];
  const device = useDeviceClass();
  const isWitness = source === "witness";

  const [step, setStep] = useState<Step>("tell");
  const [message, setMessage] = useState("");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [provinces, setProvinces] = useState<ProvinceOption[]>([]);
  const [provinceId, setProvinceId] = useState("");
  const [cityId, setCityId] = useState("");
  const [gpsHint, setGpsHint] = useState<string | null>(null);

  const cities = useMemo(() => {
    const p = provinces.find((x) => x.id === provinceId);
    return p?.cities ?? [];
  }, [provinces, provinceId]);

  const canSend = useMemo(
    () =>
      message.trim().length >= 3 ||
      Boolean(audioBlob) ||
      photos.length > 0,
    [message, audioBlob, photos],
  );
  const canUsePlace = Boolean(provinceId);

  useEffect(() => {
    void fetch("/api/location/resolve")
      .then((r) => r.json())
      .then((d) => setProvinces(d.provinces ?? []))
      .catch(() => setProvinces([]));
  }, []);

  useEffect(() => {
    if (!discrete) return;
    document.body.classList.add("ng-discrete");
    return () => document.body.classList.remove("ng-discrete");
  }, [discrete]);

  function composeMessage(): string {
    const trimmed = message.trim().slice(0, COMPOSE_MAX_CHARS);
    if (trimmed.length >= 1) return trimmed;
    if (audioBlob) return "·";
    if (photos.length) return "·";
    return trimmed;
  }

  async function submit(opts: {
    shareLocation?: boolean;
    lat?: number;
    lng?: number;
    provinceId?: string;
    cityId?: string;
  }) {
    setBusy(true);
    setError(null);
    try {
      const trustedContacts = readLocalTrustedContacts();
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          message: composeMessage(),
          locale,
          source,
          shareLocation: Boolean(opts.shareLocation),
          lat: opts.lat ?? null,
          lng: opts.lng ?? null,
          provinceId: opts.provinceId || null,
          cityId: opts.cityId || null,
          discrete,
          trustedContacts,
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
      if (discrete) vibrateDiscreteConfirm();
      router.push(`${href(`/session/${data.id}`)}${discrete ? "&discrete=1" : ""}`);
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
    setGpsHint(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch("/api/location/resolve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mode: "gps",
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            }),
          });
          const data = await res.json();
          if (data.location?.label) setGpsHint(data.location.label);
        } catch {
          // continue with raw coords
        }
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

  function appendVoiceText(text: string) {
    setMessage((prev) => {
      const next = prev ? `${prev} ${text}` : text;
      return next.slice(0, COMPOSE_MAX_CHARS);
    });
  }

  return (
    <main
      className={`ng-shell mx-auto flex min-h-dvh flex-col ${citizenPagePad(device)} ${citizenShellMaxWidth(device)} ${discrete ? "ng-discrete-surface" : ""}`}
    >
      <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <Link
          href={href("/")}
          className={`justify-self-start text-sm font-medium ${discrete ? "ng-discrete-muted" : "text-ng-muted"}`}
        >
          {t.back}
        </Link>
        <div
          className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 ${
            discrete
              ? "bg-white/10 text-[#e8d4e3]"
              : "bg-ng-urgent/10 text-ng-urgent"
          }`}
        >
          <IconShield
            className={device === "desktop" ? "size-5" : "size-4"}
          />
          <span
            className={`font-bold tracking-wide ${
              device === "desktop" ? "text-sm" : "text-xs"
            }`}
          >
            {discrete ? t.discrete : isWitness ? t.witness : t.sos}
          </span>
        </div>
        <div
          className={`inline-flex items-center justify-self-end gap-1.5 ${discrete ? "text-[#c9a0bc]" : "text-ng-primary"}`}
        >
          <IconSpark className="size-3.5" />
          <span className="text-[11px] font-semibold md:text-xs">
            {t.aiListening}
          </span>
        </div>
      </header>

      {isWitness && !discrete ? (
        <p className="mt-4 rounded-xl bg-ng-secondary-muted px-3 py-2 text-xs font-medium leading-relaxed text-ng-secondary md:text-sm">
          {t.witnessSafety}
        </p>
      ) : null}

      {step === "tell" ? (
        <section className="mt-6 flex flex-1 flex-col gap-3 md:gap-4">
          <h1
            className={`font-semibold ${
              device === "desktop" ? "text-2xl" : "text-xl"
            } ${discrete ? "text-[#e8d4e3]" : "text-ng-primary"}`}
          >
            {discrete ? t.discrete : isWitness ? t.witnessTell : t.tell}
          </h1>
          <div className="relative">
            <textarea
              value={message}
              onChange={(e) =>
                setMessage(e.target.value.slice(0, COMPOSE_MAX_CHARS))
              }
              placeholder={t.placeholder}
              rows={discrete ? 4 : 5}
              maxLength={COMPOSE_MAX_CHARS}
              className={`w-full resize-none rounded-2xl border p-4 pb-8 text-base leading-relaxed outline-none focus:ring-2 ${
                discrete
                  ? "ng-discrete-surface border-white/10 text-[#f5f0f4] ring-[#882364]"
                  : "border-[var(--ng-border)] bg-ng-surface text-ng-text ring-ng-primary"
              }`}
              autoFocus
            />
            <span
              className={`pointer-events-none absolute bottom-2.5 right-3 text-[11px] tabular-nums ${
                discrete ? "text-[#c9a0bc]" : "text-ng-muted"
              }`}
            >
              {message.length}/{COMPOSE_MAX_CHARS}
            </span>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-stretch gap-2">
              <VoiceButton
                locale={locale}
                label={t.voice}
                listeningLabel={t.voiceListening}
                unsupportedLabel={t.voiceUnsupported}
                onText={appendVoiceText}
                onAudioChange={setAudioBlob}
                discrete={discrete}
                className="w-[80%] min-w-0"
              />
              <PolishButton
                text={message}
                locale={locale}
                label={t.polish}
                busyLabel={t.polishing}
                discrete={discrete}
                disabled={busy}
                compact
                className="w-[20%] shrink-0"
                onPolished={(text) =>
                  setMessage(text.slice(0, COMPOSE_MAX_CHARS))
                }
              />
            </div>
            <ComposePhotos
              photos={photos}
              onChange={setPhotos}
              label={t.addMedia}
              discrete={discrete}
            />
          </div>
          {error ? (
            <p className="text-sm font-medium text-ng-urgent">{error}</p>
          ) : null}
          <button
            type="button"
            disabled={!canSend || busy}
            onClick={() => (discrete ? void submit({}) : setStep("place"))}
            className={`mt-auto min-h-12 rounded-2xl px-4 text-sm font-semibold text-white disabled:opacity-50 ${
              discrete ? "ng-discrete-btn" : "bg-ng-urgent"
            }`}
          >
            {discrete ? t.discreteSend : t.send}
          </button>
        </section>
      ) : (
        <section className="mt-6 flex flex-1 flex-col gap-4">
          <h1 className="text-xl font-semibold text-ng-primary">{t.gpsAsk}</h1>
          <p className="text-sm text-ng-muted line-clamp-3">{message}</p>
          {gpsHint ? (
            <p className="text-xs font-medium text-ng-primary">{gpsHint}</p>
          ) : null}
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

          {!discrete ? <TrustedContactsEditor /> : null}

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
