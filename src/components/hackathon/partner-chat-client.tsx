"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";
import {
  HackathonPartnerStatusBadge,
  HackathonPartnerStatusLegend,
  partnerStatusLabel,
} from "@/components/hackathon/hackathon-partner-status-badge";
import { HackathonCountdown } from "@/components/hackathon/hackathon-countdown";
import type { PartnerOrgStatus } from "@/lib/hackathon/partner-chat";
import {
  HACKATHON_DATES_LABEL_EN,
  HACKATHON_DATES_LABEL_FR,
  HACKATHON_HOURS_COMPACT_EN,
  HACKATHON_HOURS_COMPACT_FR,
  HACKATHON_VENUE_SHORT,
} from "@/lib/hackathon/event-content";
import { BRAND_LOGO_MARK_256 } from "@/lib/brand-logo";
import { SUPPORT_EMAIL } from "@/lib/support-contact";

type Org = {
  id: string;
  slug: string;
  orgName: string;
  shortName: string;
  logoUrl: string | null;
  website: string | null;
  status: PartnerOrgStatus;
  contactEmail?: string | null;
};

type MatchedOrg = {
  id: string;
  shortName: string;
  orgName: string;
  status: PartnerOrgStatus;
  logoUrl: string | null;
};

type Msg = {
  id: string;
  orgId: string | null;
  senderLabel: string;
  displayName: string;
  orgStatus: PartnerOrgStatus | null;
  orgLogoUrl: string | null;
  body: string;
  imageUrl?: string | null;
  messageType: string;
  createdAt: string;
};

type Participant = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  whatsapp: string | null;
  whatsappUrl: string | null;
  paymentStatus: string;
  ticketCode: string | null;
  confirmed: boolean;
  createdAt: string;
};

type Tab = "vue" | "membres" | "dialogue" | "participants";

type Dashboard = {
  editionId: string | null;
  stats: {
    total: number;
    confirmed: number;
    inProgress: number;
    undetermined: number;
  };
  messageCount: number;
  orgs: Org[];
  participants: Participant[];
  auth: {
    verified: boolean;
    needLogin: boolean;
    forbidden: boolean;
    staff: boolean;
    displayName: string | null;
    orgId: string | null;
    orgShortName: string | null;
    matchedOrgs: MatchedOrg[];
    loginHref: string;
  };
};

function OrgLogo({
  org,
  size = 28,
}: {
  org: { orgName?: string; logoUrl: string | null; shortName: string };
  size?: number;
}) {
  if (org.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={org.logoUrl}
        alt=""
        width={size}
        height={size}
        className="rounded-lg object-cover ring-1 ring-[color:var(--hk-border)]"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="inline-flex items-center justify-center rounded-lg bg-[color:var(--hk-soft)] text-[10px] font-extrabold uppercase text-[color:var(--hk-accent)]"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {org.shortName.slice(0, 2)}
    </span>
  );
}

function Kpi({
  label,
  value,
  pct,
  tone,
}: {
  label: string;
  value: number;
  pct?: number | null;
  tone?: "ok" | "warn" | "muted";
}) {
  const toneCls =
    tone === "ok"
      ? "text-[color:var(--hk-ok-text)]"
      : tone === "warn"
        ? "text-[color:var(--hk-warn-muted)]"
        : "text-[color:var(--hk-text)]";
  return (
    <div className="rounded-2xl border border-[color:var(--hk-border)] bg-[color:var(--hk-surface)] px-4 py-3.5 shadow-[0_10px_28px_-18px_var(--hk-shadow)]">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--hk-muted)]">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-extrabold tabular-nums ${toneCls}`}>
        {value}
      </p>
      {pct != null ? (
        <p className="mt-0.5 text-[11px] font-semibold tabular-nums text-[color:var(--hk-muted)]">
          {pct}%
        </p>
      ) : null}
    </div>
  );
}

function StackedBreakdown({
  confirmed,
  inProgress,
  undetermined,
  total,
  isFr,
}: {
  confirmed: number;
  inProgress: number;
  undetermined: number;
  total: number;
  isFr: boolean;
}) {
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
  const c = pct(confirmed);
  const p = pct(inProgress);
  const u = Math.max(0, 100 - c - p);
  return (
    <div className="rounded-2xl border border-[color:var(--hk-border)] bg-[color:var(--hk-surface)] p-4 shadow-[0_10px_28px_-18px_var(--hk-shadow)]">
      <p className="text-sm font-bold text-[color:var(--hk-text)]">
        {isFr ? "Répartition du roster" : "Roster breakdown"}
      </p>
      <p className="mt-1 text-xs text-[color:var(--hk-muted)]">
        {isFr
          ? `${total} organisations actives (hors rejetés)`
          : `${total} active organisations (excluding rejected)`}
      </p>
      <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-[color:var(--hk-border)]">
        {c > 0 ? (
          <div
            className="h-full bg-emerald-500"
            style={{ width: `${c}%` }}
            title={`${c}%`}
          />
        ) : null}
        {p > 0 ? (
          <div
            className="h-full bg-amber-500"
            style={{ width: `${p}%` }}
            title={`${p}%`}
          />
        ) : null}
        {u > 0 ? (
          <div
            className="h-full bg-stone-400 dark:bg-stone-500"
            style={{ width: `${u}%` }}
            title={`${u}%`}
          />
        ) : null}
      </div>
      <ul className="mt-3 space-y-1.5 text-xs text-[color:var(--hk-muted)]">
        <li className="flex justify-between gap-3">
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {isFr ? "Confirmés" : "Confirmed"}
          </span>
          <span className="tabular-nums font-semibold text-[color:var(--hk-text)]">
            {confirmed} · {c}%
          </span>
        </li>
        <li className="flex justify-between gap-3">
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            {isFr ? "En cours" : "In progress"}
          </span>
          <span className="tabular-nums font-semibold text-[color:var(--hk-text)]">
            {inProgress} · {p}%
          </span>
        </li>
        <li className="flex justify-between gap-3">
          <span className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-stone-400" />
            {isFr ? "Pas encore déterminés" : "Undetermined"}
          </span>
          <span className="tabular-nums font-semibold text-[color:var(--hk-text)]">
            {undetermined} · {u}%
          </span>
        </li>
      </ul>
    </div>
  );
}

function PoweredByFooter() {
  return (
    <footer className="mt-10 border-t border-[color:var(--hk-border)] pt-6 pb-2 text-center">
      <a
        href="https://mcbuleli.org"
        className="inline-flex items-center gap-2 text-[11px] text-[color:var(--hk-muted)] hover:text-[color:var(--hk-text)]"
      >
        <span className="font-medium opacity-80">Powered by</span>
        <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border border-[color:var(--hk-border)] bg-white">
          <Image
            src={BRAND_LOGO_MARK_256}
            alt=""
            width={20}
            height={20}
            className="h-5 w-5 object-contain"
            unoptimized
          />
        </span>
        <span className="font-extrabold text-[color:var(--hk-accent)]">
          McBuleli
        </span>
      </a>
      <p className="mt-2 text-[10px] text-[color:var(--hk-muted)]">
        McBuleli · RCCM CD/KNG/RCCM/26-A-00382
      </p>
    </footer>
  );
}

function paymentStatusLabel(
  status: string,
  confirmed: boolean,
  isFr: boolean,
): string {
  if (confirmed) return isFr ? "Confirmé" : "Confirmed";
  const s = status.toLowerCase();
  if (s === "pending" || s === "processing" || s === "hold") {
    return isFr ? "En attente" : "Pending";
  }
  if (s === "failed" || s === "cancelled" || s === "canceled") {
    return isFr ? "Échoué" : "Failed";
  }
  return status || (isFr ? "En attente" : "Pending");
}

export function PartnerChatClient() {
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const [tab, setTab] = useState<Tab>("vue");
  const [dash, setDash] = useState<Dashboard | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [msgBusy, setMsgBusy] = useState(false);
  const [msgErr, setMsgErr] = useState<string | null>(null);
  const [switchBusy, setSwitchBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollBoxRef = useRef<HTMLDivElement>(null);
  const stickBottomRef = useRef(true);

  const loadDash = useCallback(async () => {
    setLoadErr(null);
    try {
      const res = await fetch("/api/hackathon/chat", { cache: "no-store" });
      if (!res.ok) {
        setLoadErr(
          isFr
            ? "Impossible de charger l'espace d'échange."
            : "Could not load the exchange space.",
        );
        return;
      }
      const data = (await res.json()) as Dashboard;
      setDash({
        ...data,
        participants: data.participants ?? [],
      });
    } catch {
      setLoadErr(
        isFr ? "Erreur réseau. Réessayez." : "Network error. Try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [isFr]);

  const loadMessages = useCallback(async () => {
    const res = await fetch("/api/hackathon/chat/messages", {
      cache: "no-store",
    });
    if (res.status === 401 || res.status === 403) {
      await loadDash();
      return;
    }
    if (!res.ok) return;
    const data = (await res.json()) as { messages: Msg[] };
    setMessages(data.messages ?? []);
  }, [loadDash]);

  useEffect(() => {
    void loadDash();
  }, [loadDash]);

  useEffect(() => {
    if (!dash?.auth.verified) return;
    void loadMessages();
    const t = setInterval(() => void loadMessages(), 5000);
    return () => clearInterval(t);
  }, [dash?.auth.verified, loadMessages]);

  useEffect(() => {
    if (tab !== "dialogue") return;
    if (!stickBottomRef.current) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, tab]);

  async function selectOrg(orgId: string) {
    setSwitchBusy(true);
    try {
      const res = await fetch("/api/hackathon/chat/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "select_org", orgId }),
      });
      if (!res.ok) return;
      await loadDash();
    } finally {
      setSwitchBusy(false);
    }
  }

  async function uploadImage(file: File): Promise<string | null> {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/hackathon/chat/upload", {
      method: "POST",
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (err?.error === "r2_not_configured") {
        setMsgErr(
          isFr
            ? "Upload image indisponible (R2)."
            : "Image upload unavailable (R2).",
        );
      } else if (err?.error === "file_too_large") {
        setMsgErr(
          isFr ? "Image trop lourde (max 4 Mo)." : "Image too large (max 4 MB).",
        );
      } else {
        setMsgErr(
          isFr ? "Échec de l'upload." : "Upload failed.",
        );
      }
      return null;
    }
    const data = (await res.json()) as { url?: string };
    return data.url ?? null;
  }

  async function onPickImage(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setMsgErr(null);
    setMsgBusy(true);
    try {
      const url = await uploadImage(file);
      if (url) setPendingImage(url);
    } finally {
      setMsgBusy(false);
    }
  }

  async function sendMessage(e?: FormEvent) {
    e?.preventDefault();
    const body = draft.trim();
    if (!body && !pendingImage) return;
    setMsgBusy(true);
    setMsgErr(null);
    stickBottomRef.current = true;
    try {
      const res = await fetch("/api/hackathon/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, imageUrl: pendingImage }),
      });
      if (res.status === 429) {
        setMsgErr(
          isFr
            ? "Trop rapide - attendez une seconde."
            : "Too fast - wait a second.",
        );
        return;
      }
      if (!res.ok) {
        setMsgErr(isFr ? "Envoi impossible." : "Could not send.");
        return;
      }
      const data = await res.json();
      setMessages(data.messages ?? []);
      setDraft("");
      setPendingImage(null);
    } catch {
      setMsgErr(isFr ? "Erreur réseau." : "Network error.");
    } finally {
      setMsgBusy(false);
    }
  }

  function onComposerKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  }

  function onScrollBox() {
    const el = scrollBoxRef.current;
    if (!el) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickBottomRef.current = dist < 80;
  }

  const verified = Boolean(dash?.auth.verified);
  const youLabel = dash?.auth.staff
    ? "McBuleli"
    : dash?.auth.displayName && dash.auth.orgShortName
      ? `${dash.auth.displayName}/${dash.auth.orgShortName}`
      : dash?.auth.displayName;

  const tabs: { id: Tab; fr: string; en: string }[] = [
    { id: "vue", fr: "Vue", en: "Overview" },
    { id: "membres", fr: "Membres", en: "Members" },
    { id: "dialogue", fr: "Dialogue", en: "Dialogue" },
    { id: "participants", fr: "Participants", en: "Participants" },
  ];

  const dates = isFr ? HACKATHON_DATES_LABEL_FR : HACKATHON_DATES_LABEL_EN;
  const hours = isFr ? HACKATHON_HOURS_COMPACT_FR : HACKATHON_HOURS_COMPACT_EN;
  const total = dash?.stats.total ?? 0;
  const pctOf = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-10 pt-6 sm:px-6">
      <header className="mb-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[color:var(--hk-muted)]">
              McBuleli Hackathon
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[color:var(--hk-text)] sm:text-3xl">
              {isFr ? "Échange partenaires" : "Partner exchange"}
            </h1>
          </div>
          <Link
            href="/hackathon#partenaires"
            className="shrink-0 text-sm font-semibold text-[color:var(--hk-accent)] underline-offset-2 hover:underline"
          >
            {isFr ? "← Hackathon" : "← Hackathon"}
          </Link>
        </div>

        <div className="rounded-2xl border border-[color:var(--hk-border)] bg-[color:var(--hk-surface)] p-4 shadow-[0_10px_28px_-18px_var(--hk-shadow)] sm:p-5">
          <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[color:var(--hk-text)]">
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--hk-muted)]">
                {isFr ? "Date" : "Date"}
              </dt>
              <dd className="mt-0.5 font-semibold">
                {dates.replace(/[–—]/g, "-")} · {hours}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--hk-muted)]">
                {isFr ? "Lieu" : "Venue"}
              </dt>
              <dd className="mt-0.5 font-semibold">{HACKATHON_VENUE_SHORT}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--hk-muted)]">
                {isFr ? "Compte à rebours" : "Countdown"}
              </dt>
              <dd className="mt-1">
                <HackathonCountdown isFr={isFr} bare />
              </dd>
            </div>
          </dl>
          <p className="mt-3 border-t border-[color:var(--hk-border)] pt-3 text-sm leading-relaxed text-[color:var(--hk-muted)]">
            {isFr
              ? "Raison : coordonner les partenaires confirmés et en cours avant l'événement - ateliers, mentorat, jury, logistique et visibilité - dans un espace partagé avec McBuleli."
              : "Purpose: align confirmed and in-progress partners before the event - workshops, mentoring, jury, logistics and visibility - in a shared space with McBuleli."}
          </p>
        </div>
      </header>

      {loading ? (
        <div className="rounded-2xl border border-[color:var(--hk-border)] bg-[color:var(--hk-surface)] px-5 py-12 text-center text-sm text-[color:var(--hk-muted)]">
          {isFr ? "Chargement…" : "Loading…"}
        </div>
      ) : null}

      {!loading && loadErr ? (
        <div className="rounded-2xl border border-[color:var(--hk-border)] bg-[color:var(--hk-surface)] px-5 py-6 text-center">
          <p className="text-sm font-medium text-[color:var(--hk-err)]">
            {loadErr}
          </p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              void loadDash();
            }}
            className="mt-3 rounded-xl bg-[color:var(--hk-accent)] px-4 py-2 text-sm font-bold text-white"
          >
            {isFr ? "Réessayer" : "Retry"}
          </button>
        </div>
      ) : null}

      {!loading && !loadErr && dash?.auth.needLogin ? (
        <section className="rounded-2xl border border-[color:var(--hk-border)] bg-[color:var(--hk-surface)] p-6 shadow-[0_16px_40px_-24px_var(--hk-shadow)] sm:p-8">
          <div className="mx-auto max-w-md text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--hk-soft)]">
              <Image
                src={BRAND_LOGO_MARK_256}
                alt=""
                width={36}
                height={36}
                className="h-9 w-9 object-contain"
                unoptimized
              />
            </div>
            <h2 className="mt-4 text-lg font-bold text-[color:var(--hk-text)]">
              {isFr ? "Connexion requise" : "Sign in required"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[color:var(--hk-muted)]">
              {isFr
                ? "Les administrateurs McBuleli et les comptes partenaires accèdent ici sans code OTP - connectez-vous avec votre compte McBuleli."
                : "McBuleli admins and partner accounts enter here without an OTP - sign in with your McBuleli account."}
            </p>
            <a
              href={dash.auth.loginHref}
              className="mt-6 inline-flex rounded-xl bg-[color:var(--hk-accent)] px-5 py-3 text-sm font-bold text-white"
            >
              {isFr ? "Se connecter" : "Sign in"}
            </a>
            <p className="mt-4 text-xs text-[color:var(--hk-muted)]">
              {isFr ? "Pas encore de compte ?" : "No account yet?"}{" "}
              <a
                href={`/register?next=${encodeURIComponent("/hackathon/chat")}`}
                className="font-semibold text-[color:var(--hk-accent)] underline-offset-2 hover:underline"
              >
                {isFr ? "Créer un compte" : "Create an account"}
              </a>
            </p>
          </div>
        </section>
      ) : null}

      {!loading && !loadErr && dash?.auth.forbidden ? (
        <section className="rounded-2xl border border-[color:var(--hk-border)] bg-[color:var(--hk-surface)] p-6 sm:p-8">
          <h2 className="text-lg font-bold text-[color:var(--hk-text)]">
            {isFr ? "Accès non autorisé" : "Access not granted"}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[color:var(--hk-muted)]">
            {isFr
              ? "Votre compte McBuleli est connecté, mais il n'est pas rattaché à une organisation partenaire de cet espace. Utilisez l'email principal du partenaire, ou contactez l'équipe McBuleli."
              : "You're signed in, but this McBuleli account isn't linked to a partner organisation for this space. Use the partner's primary email, or contact the McBuleli team."}
          </p>
          <p className="mt-4 text-sm">
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="font-semibold text-[color:var(--hk-accent)] underline-offset-2 hover:underline"
            >
              {SUPPORT_EMAIL}
            </a>
          </p>
        </section>
      ) : null}

      {!loading && !loadErr && verified && dash ? (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[color:var(--hk-border)] bg-[color:var(--hk-surface)] px-3 py-2">
            <p className="text-sm text-[color:var(--hk-muted)]">
              {isFr ? "Connecté :" : "Signed in:"}{" "}
              <strong className="text-[color:var(--hk-text)]">{youLabel}</strong>
            </p>
            <nav className="flex flex-wrap gap-1 rounded-lg bg-[color:var(--hk-page)] p-0.5">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
                    tab === t.id
                      ? "bg-[color:var(--hk-accent)] text-white"
                      : "text-[color:var(--hk-muted)] hover:text-[color:var(--hk-text)]"
                  }`}
                >
                  {isFr ? t.fr : t.en}
                </button>
              ))}
            </nav>
          </div>

          {!dash.auth.staff && dash.auth.matchedOrgs.length > 1 ? (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-[color:var(--hk-muted)]">
                {isFr ? "Organisation :" : "Organisation:"}
              </span>
              {dash.auth.matchedOrgs.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  disabled={switchBusy || o.id === dash.auth.orgId}
                  onClick={() => void selectOrg(o.id)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    o.id === dash.auth.orgId
                      ? "border-[color:var(--hk-accent)] bg-[color:var(--hk-soft)] text-[color:var(--hk-accent)]"
                      : "border-[color:var(--hk-border)] text-[color:var(--hk-muted)] hover:border-[color:var(--hk-accent)]"
                  }`}
                >
                  <OrgLogo org={o} size={18} />
                  {o.shortName}
                </button>
              ))}
            </div>
          ) : null}

          {tab === "vue" ? (
            <section className="space-y-5">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Kpi
                  label={isFr ? "Organisations" : "Organisations"}
                  value={dash.stats.total}
                />
                <Kpi
                  label={isFr ? "Confirmés" : "Confirmed"}
                  value={dash.stats.confirmed}
                  pct={pctOf(dash.stats.confirmed)}
                  tone="ok"
                />
                <Kpi
                  label={isFr ? "En cours" : "In progress"}
                  value={dash.stats.inProgress}
                  pct={pctOf(dash.stats.inProgress)}
                  tone="warn"
                />
                <Kpi
                  label={isFr ? "Indéterminés" : "Undetermined"}
                  value={dash.stats.undetermined}
                  pct={pctOf(dash.stats.undetermined)}
                  tone="muted"
                />
              </div>
              <StackedBreakdown
                confirmed={dash.stats.confirmed}
                inProgress={dash.stats.inProgress}
                undetermined={dash.stats.undetermined}
                total={dash.stats.total}
                isFr={isFr}
              />
              <p className="text-xs text-[color:var(--hk-muted)]">
                {isFr ? "Messages dans le dialogue :" : "Dialogue messages:"}{" "}
                <strong className="text-[color:var(--hk-text)]">
                  {dash.messageCount}
                </strong>
              </p>
              <HackathonPartnerStatusLegend isFr={isFr} />
            </section>
          ) : null}

          {tab === "membres" ? (
            <section>
              <div className="overflow-hidden rounded-2xl border border-[color:var(--hk-border)] bg-[color:var(--hk-surface)] shadow-[0_10px_28px_-18px_var(--hk-shadow)]">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-left text-sm">
                    <thead className="bg-[color:var(--hk-page)] text-[11px] uppercase tracking-wide text-[color:var(--hk-muted)]">
                      <tr className="border-b border-[color:var(--hk-border)]">
                        <th className="px-3 py-2.5 font-semibold">
                          {isFr ? "Organisation" : "Organisation"}
                        </th>
                        <th className="px-3 py-2.5 font-semibold">
                          {isFr ? "Statut" : "Status"}
                        </th>
                        <th className="px-3 py-2.5 font-semibold">
                          {isFr ? "Contact" : "Contact"}
                        </th>
                        <th className="px-3 py-2.5 font-semibold">Site</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dash.orgs.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-3 py-8 text-center text-sm text-[color:var(--hk-muted)]"
                          >
                            {isFr
                              ? "Aucune organisation dans le roster pour l'instant."
                              : "No organisations in the roster yet."}
                          </td>
                        </tr>
                      ) : (
                        dash.orgs.map((o) => (
                          <tr
                            key={o.id}
                            className="border-b border-[color:var(--hk-border)]/60 transition last:border-0 hover:bg-[color:var(--hk-page)]"
                          >
                            <td className="px-3 py-2.5">
                              <div className="flex items-center gap-2.5">
                                <OrgLogo org={o} size={32} />
                                <div className="min-w-0">
                                  <p className="truncate font-semibold text-[color:var(--hk-text)]">
                                    {o.orgName}
                                  </p>
                                  <p className="text-[11px] text-[color:var(--hk-muted)]">
                                    {o.shortName}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-2.5">
                              <span className="inline-flex items-center gap-1.5">
                                <HackathonPartnerStatusBadge
                                  status={o.status}
                                  isFr={isFr}
                                />
                                <span className="text-xs font-medium text-[color:var(--hk-muted)]">
                                  {partnerStatusLabel(o.status, isFr)}
                                </span>
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-xs text-[color:var(--hk-muted)]">
                              {o.contactEmail ? (
                                <a
                                  href={`mailto:${o.contactEmail}`}
                                  className="font-medium text-[color:var(--hk-accent)] underline-offset-2 hover:underline"
                                >
                                  {o.contactEmail}
                                </a>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-xs">
                              {o.website ? (
                                <a
                                  href={o.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-medium text-[color:var(--hk-accent)] underline-offset-2 hover:underline"
                                >
                                  {isFr ? "Ouvrir" : "Open"}
                                </a>
                              ) : (
                                <span className="text-[color:var(--hk-muted)]">
                                  -
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <HackathonPartnerStatusLegend isFr={isFr} />
            </section>
          ) : null}

          {tab === "dialogue" ? (
            <section className="flex h-[min(68vh,620px)] min-h-[420px] flex-col overflow-hidden rounded-2xl border border-[color:var(--hk-border)] bg-[color:var(--hk-surface)] shadow-[0_10px_28px_-18px_var(--hk-shadow)]">
              <div className="shrink-0 border-b border-[color:var(--hk-border)] px-4 py-2.5">
                <p className="text-sm font-bold text-[color:var(--hk-text)]">
                  {isFr ? "Salle commune" : "Shared room"}
                </p>
                <p className="text-[11px] text-[color:var(--hk-muted)]">
                  {isFr
                    ? "Tous les partenaires connectés + McBuleli · Entrée = envoyer, Maj+Entrée = ligne"
                    : "All connected partners + McBuleli · Enter = send, Shift+Enter = new line"}
                </p>
              </div>
              <div
                ref={scrollBoxRef}
                onScroll={onScrollBox}
                className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4"
              >
                {messages.length === 0 ? (
                  <p className="py-10 text-center text-sm text-[color:var(--hk-muted)]">
                    {isFr
                      ? "Aucun message pour l'instant. Lancez la conversation."
                      : "No messages yet. Start the conversation."}
                  </p>
                ) : (
                  messages.map((m) => {
                    const mine =
                      m.senderLabel === dash.auth.displayName &&
                      (dash.auth.staff
                        ? !m.orgId
                        : m.orgId === dash.auth.orgId);
                    const bodyText = (m.body || "").trim();
                    return (
                      <div
                        key={m.id}
                        className={`flex ${mine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[min(85%,28rem)] rounded-2xl px-3 py-2 ${
                            mine
                              ? "bg-[color:var(--hk-accent)] text-white"
                              : "bg-[color:var(--hk-page)] text-[color:var(--hk-text)] ring-1 ring-[color:var(--hk-border)]"
                          }`}
                        >
                          {!mine ? (
                            <p className="mb-0.5 flex items-center gap-1.5 text-[10px] font-bold opacity-80">
                              <span className="truncate">{m.displayName}</span>
                              {m.orgStatus ? (
                                <HackathonPartnerStatusBadge
                                  status={m.orgStatus}
                                  compact
                                  isFr={isFr}
                                />
                              ) : null}
                            </p>
                          ) : null}
                          {m.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={m.imageUrl}
                              alt=""
                              className="mb-1.5 max-h-56 w-full rounded-xl object-cover"
                            />
                          ) : null}
                          {bodyText ? (
                            <p className="whitespace-pre-wrap break-words text-sm leading-snug">
                              {bodyText}
                            </p>
                          ) : null}
                          <p
                            className={`mt-1 text-[9px] ${
                              mine
                                ? "text-white/70"
                                : "text-[color:var(--hk-muted)]"
                            }`}
                          >
                            {new Date(m.createdAt).toLocaleString(
                              isFr ? "fr-FR" : "en-GB",
                              {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>
              <form
                onSubmit={(e) => void sendMessage(e)}
                className="shrink-0 border-t border-[color:var(--hk-border)] bg-[color:var(--hk-surface)] p-3"
              >
                {msgErr ? (
                  <p className="mb-2 text-xs font-medium text-[color:var(--hk-err)]">
                    {msgErr}
                  </p>
                ) : null}
                {pendingImage ? (
                  <div className="mb-2 flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={pendingImage}
                      alt=""
                      className="h-14 w-14 rounded-lg object-cover ring-1 ring-[color:var(--hk-border)]"
                    />
                    <button
                      type="button"
                      onClick={() => setPendingImage(null)}
                      className="text-xs font-semibold text-[color:var(--hk-err)]"
                    >
                      {isFr ? "Retirer" : "Remove"}
                    </button>
                  </div>
                ) : null}
                <div className="flex items-end gap-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => void onPickImage(e)}
                  />
                  <button
                    type="button"
                    disabled={msgBusy}
                    onClick={() => fileRef.current?.click()}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[color:var(--hk-border)] text-[color:var(--hk-muted)] hover:border-[color:var(--hk-accent)] hover:text-[color:var(--hk-accent)] disabled:opacity-50"
                    aria-label={isFr ? "Joindre une image" : "Attach image"}
                    title={isFr ? "Joindre une image" : "Attach image"}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      aria-hidden
                    >
                      <path d="M4 16l4.5-4.5a2 2 0 012.8 0L16 16" />
                      <path d="M14 14l1.5-1.5a2 2 0 012.8 0L20 15" />
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <circle cx="8.5" cy="9.5" r="1.2" fill="currentColor" stroke="none" />
                    </svg>
                  </button>
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={onComposerKeyDown}
                    rows={1}
                    placeholder={
                      isFr ? "Écrire un message…" : "Write a message…"
                    }
                    className="max-h-32 min-h-[2.75rem] min-w-0 flex-1 resize-y rounded-xl border border-[color:var(--hk-border)] bg-[color:var(--hk-page)] px-3 py-2.5 text-sm text-[color:var(--hk-text)] outline-none focus:border-[color:var(--hk-accent)]"
                    maxLength={4000}
                  />
                  <button
                    type="submit"
                    disabled={msgBusy || (!draft.trim() && !pendingImage)}
                    className="h-11 shrink-0 rounded-xl bg-[color:var(--hk-accent)] px-4 text-sm font-bold text-white disabled:opacity-50"
                  >
                    {isFr ? "Envoyer" : "Send"}
                  </button>
                </div>
              </form>
            </section>
          ) : null}

          {tab === "participants" ? (
            <section className="overflow-hidden rounded-2xl bg-[color:var(--hk-surface)] shadow-sm ring-1 ring-[color:var(--hk-border)]">
              <div className="border-b border-[color:var(--hk-border)] px-5 py-3.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[color:var(--hk-muted)]">
                  {isFr
                    ? "Inscrits hackathon"
                    : "Hackathon registrations"}
                </p>
                <p className="mt-1 text-xs text-[color:var(--hk-muted)]">
                  {(dash.participants ?? []).length}{" "}
                  {isFr ? "participant(s)" : "participant(s)"}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-[color:var(--hk-page)] text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--hk-muted)]">
                    <tr>
                      <th className="px-4 py-3">
                        {isFr ? "Nom" : "Name"}
                      </th>
                      <th className="px-4 py-3">
                        {isFr ? "Statut" : "Status"}
                      </th>
                      <th className="px-4 py-3">Ticket</th>
                      <th className="px-4 py-3">WhatsApp</th>
                      <th className="px-4 py-3">Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(dash.participants ?? []).length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-12 text-center text-sm text-[color:var(--hk-muted)]"
                        >
                          {isFr
                            ? "Aucun inscrit pour le moment."
                            : "No registrations yet."}
                        </td>
                      </tr>
                    ) : (
                      (dash.participants ?? []).map((s) => (
                        <tr
                          key={s.id}
                          className="border-t border-[color:var(--hk-border)] transition hover:bg-[color:var(--hk-page)]"
                        >
                          <td className="px-4 py-3 font-semibold text-[color:var(--hk-text)]">
                            {s.firstName} {s.lastName}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={
                                s.confirmed
                                  ? "font-bold text-[color:var(--hk-accent)]"
                                  : "font-semibold text-[color:var(--hk-warn-muted)]"
                              }
                            >
                              {paymentStatusLabel(
                                s.paymentStatus,
                                s.confirmed,
                                isFr,
                              )}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-[color:var(--hk-muted)]">
                            {s.ticketCode ?? "-"}
                          </td>
                          <td className="px-4 py-3">
                            {s.whatsappUrl ? (
                              <a
                                href={s.whatsappUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-[color:var(--hk-accent)] underline-offset-2 hover:underline"
                              >
                                {isFr ? "Contacter" : "Contact"}
                              </a>
                            ) : (
                              <span className="text-[color:var(--hk-muted)]">
                                -
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <a
                              href={`mailto:${encodeURIComponent(s.email)}?subject=${encodeURIComponent("McBuleli Hackathon")}`}
                              className="font-semibold text-[color:var(--hk-accent)] underline-offset-2 hover:underline"
                            >
                              {isFr ? "Écrire" : "Message"}
                            </a>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </>
      ) : null}

      <PoweredByFooter />
    </div>
  );
}
