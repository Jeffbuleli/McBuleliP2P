"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";
import {
  HackathonPartnerStatusBadge,
  HackathonPartnerStatusLegend,
  partnerStatusLabel,
} from "@/components/hackathon/hackathon-partner-status-badge";
import type { PartnerOrgStatus } from "@/lib/hackathon/partner-chat";
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
  messageType: string;
  createdAt: string;
};

type Tab = "vue" | "membres" | "dialogue";

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
        className="rounded-lg object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="inline-flex items-center justify-center rounded-lg bg-[color:var(--hk-surface-2,#e7e5e4)] text-[10px] font-extrabold uppercase text-[color:var(--hk-muted)]"
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
  tone,
}: {
  label: string;
  value: number;
  tone?: "ok" | "warn" | "muted";
}) {
  const toneCls =
    tone === "ok"
      ? "text-emerald-600"
      : tone === "warn"
        ? "text-amber-600"
        : "text-[color:var(--hk-fg)]";
  return (
    <div className="rounded-2xl border border-[color:var(--hk-border)] bg-[color:var(--hk-surface)] px-4 py-3 shadow-[0_10px_28px_-18px_var(--hk-shadow)]">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--hk-muted)]">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-extrabold tabular-nums ${toneCls}`}>
        {value}
      </p>
    </div>
  );
}

function StatBar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-[color:var(--hk-muted)]">
        <span>{label}</span>
        <span className="tabular-nums">
          {value} · {pct}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[color:var(--hk-border)]">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

function PoweredByFooter() {
  return (
    <footer className="mt-10 border-t border-[color:var(--hk-border)] pt-6 pb-2 text-center">
      <a
        href="https://mcbuleli.org"
        className="inline-flex items-center gap-2 text-[11px] text-[color:var(--hk-muted)] hover:text-[color:var(--hk-fg)]"
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
        <span className="font-extrabold text-[color:var(--hk-primary,#305f33)]">
          McBuleli
        </span>
      </a>
      <p className="mt-2 text-[10px] text-[color:var(--hk-muted)]">
        McBuleli · RCCM CD/KNG/RCCM/26-A-00382
      </p>
    </footer>
  );
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
  const [msgBusy, setMsgBusy] = useState(false);
  const [msgErr, setMsgErr] = useState<string | null>(null);
  const [switchBusy, setSwitchBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

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
      setDash(data);
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
    const t = setInterval(() => void loadMessages(), 4000);
    return () => clearInterval(t);
  }, [dash?.auth.verified, loadMessages]);

  useEffect(() => {
    if (tab !== "dialogue") return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
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

  async function sendMessage(e: FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setMsgBusy(true);
    setMsgErr(null);
    try {
      const res = await fetch("/api/hackathon/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
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
        setMsgErr(
          isFr ? "Envoi impossible." : "Could not send.",
        );
        return;
      }
      const data = await res.json();
      setMessages(data.messages ?? []);
      setDraft("");
    } catch {
      setMsgErr(isFr ? "Erreur réseau." : "Network error.");
    } finally {
      setMsgBusy(false);
    }
  }

  const verified = Boolean(dash?.auth.verified);
  const youLabel =
    dash?.auth.staff
      ? "McBuleli"
      : dash?.auth.displayName && dash.auth.orgShortName
        ? `${dash.auth.displayName}/${dash.auth.orgShortName}`
        : dash?.auth.displayName;

  const tabs: { id: Tab; fr: string; en: string }[] = [
    { id: "vue", fr: "Vue", en: "Overview" },
    { id: "membres", fr: "Membres", en: "Members" },
    { id: "dialogue", fr: "Dialogue", en: "Dialogue" },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-10 pt-6 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[color:var(--hk-muted)]">
            McBuleli Hackathon
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-[color:var(--hk-fg)] sm:text-3xl">
            {isFr ? "Échange partenaires" : "Partner exchange"}
          </h1>
          <p className="mt-1 max-w-xl text-sm text-[color:var(--hk-muted)]">
            {isFr
              ? "Vue, roster et dialogue commun - accès avec votre compte McBuleli."
              : "Overview, roster and shared dialogue - access with your McBuleli account."}
          </p>
        </div>
        <Link
          href="/hackathon#partenaires"
          className="text-sm font-semibold text-[color:var(--hk-primary,#305f33)] underline-offset-2 hover:underline"
        >
          {isFr ? "← Hackathon" : "← Hackathon"}
        </Link>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-[color:var(--hk-border)] bg-[color:var(--hk-surface)] px-5 py-12 text-center text-sm text-[color:var(--hk-muted)]">
          {isFr ? "Chargement…" : "Loading…"}
        </div>
      ) : null}

      {!loading && loadErr ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-6 text-center">
          <p className="text-sm font-medium text-red-700">{loadErr}</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              void loadDash();
            }}
            className="mt-3 rounded-xl bg-[color:var(--hk-primary,#305f33)] px-4 py-2 text-sm font-bold text-white"
          >
            {isFr ? "Réessayer" : "Retry"}
          </button>
        </div>
      ) : null}

      {!loading && !loadErr && dash?.auth.needLogin ? (
        <section className="rounded-2xl border border-[color:var(--hk-border)] bg-[color:var(--hk-surface)] p-6 shadow-[0_16px_40px_-24px_var(--hk-shadow)] sm:p-8">
          <div className="mx-auto max-w-md text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--fd-mint,#eaf5ee)]">
              <Image
                src={BRAND_LOGO_MARK_256}
                alt=""
                width={36}
                height={36}
                className="h-9 w-9 object-contain"
                unoptimized
              />
            </div>
            <h2 className="mt-4 text-lg font-bold text-[color:var(--hk-fg)]">
              {isFr ? "Connexion requise" : "Sign in required"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[color:var(--hk-muted)]">
              {isFr
                ? "Les administrateurs McBuleli et les comptes partenaires accèdent ici sans code OTP - connectez-vous avec votre compte McBuleli."
                : "McBuleli admins and partner accounts enter here without an OTP - sign in with your McBuleli account."}
            </p>
            <a
              href={dash.auth.loginHref}
              className="mt-6 inline-flex rounded-xl bg-[color:var(--hk-primary,#305f33)] px-5 py-3 text-sm font-bold text-white"
            >
              {isFr ? "Se connecter" : "Sign in"}
            </a>
            <p className="mt-4 text-xs text-[color:var(--hk-muted)]">
              {isFr ? "Pas encore de compte ?" : "No account yet?"}{" "}
              <a
                href={`/register?next=${encodeURIComponent("/hackathon/chat")}`}
                className="font-semibold text-[color:var(--hk-primary,#305f33)] underline-offset-2 hover:underline"
              >
                {isFr ? "Créer un compte" : "Create an account"}
              </a>
            </p>
          </div>
        </section>
      ) : null}

      {!loading && !loadErr && dash?.auth.forbidden ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50/80 p-6 sm:p-8">
          <h2 className="text-lg font-bold text-[color:var(--hk-fg)]">
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
              className="font-semibold text-[color:var(--hk-primary,#305f33)] underline-offset-2 hover:underline"
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
              <strong className="text-[color:var(--hk-fg)]">{youLabel}</strong>
            </p>
            <nav className="flex gap-1 rounded-lg bg-[color:var(--hk-bg,#f5f5f4)] p-0.5">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`rounded-md px-3 py-1.5 text-xs font-bold transition ${
                    tab === t.id
                      ? "bg-[color:var(--hk-primary,#305f33)] text-white"
                      : "text-[color:var(--hk-muted)] hover:text-[color:var(--hk-fg)]"
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
                      ? "border-[color:var(--hk-primary,#305f33)] bg-[color:var(--fd-mint,#eaf5ee)] text-[color:var(--hk-primary,#305f33)]"
                      : "border-[color:var(--hk-border)] text-[color:var(--hk-muted)] hover:border-[color:var(--hk-primary,#305f33)]"
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
                  tone="ok"
                />
                <Kpi
                  label={isFr ? "En cours" : "In progress"}
                  value={dash.stats.inProgress}
                  tone="warn"
                />
                <Kpi
                  label={isFr ? "Indéterminés" : "Undetermined"}
                  value={dash.stats.undetermined}
                  tone="muted"
                />
              </div>
              <div className="space-y-3 rounded-2xl border border-[color:var(--hk-border)] bg-[color:var(--hk-surface)] p-4">
                <p className="text-sm font-bold text-[color:var(--hk-fg)]">
                  {isFr ? "Répartition" : "Breakdown"}
                </p>
                <StatBar
                  label={isFr ? "Confirmés" : "Confirmed"}
                  value={dash.stats.confirmed}
                  total={dash.stats.total}
                  color="#059669"
                />
                <StatBar
                  label={isFr ? "En cours" : "In progress"}
                  value={dash.stats.inProgress}
                  total={dash.stats.total}
                  color="#d97706"
                />
                <StatBar
                  label={isFr ? "Pas encore déterminés" : "Undetermined"}
                  value={dash.stats.undetermined}
                  total={dash.stats.total}
                  color="#78716c"
                />
                <p className="pt-2 text-xs text-[color:var(--hk-muted)]">
                  {isFr ? "Messages dans le dialogue :" : "Dialogue messages:"}{" "}
                  <strong className="text-[color:var(--hk-fg)]">
                    {dash.messageCount}
                  </strong>
                </p>
              </div>
              <HackathonPartnerStatusLegend isFr={isFr} />
            </section>
          ) : null}

          {tab === "membres" ? (
            <section>
              <div className="overflow-x-auto rounded-2xl border border-[color:var(--hk-border)] bg-[color:var(--hk-surface)] shadow-[0_10px_28px_-18px_var(--hk-shadow)]">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-[color:var(--hk-border)] text-[11px] uppercase tracking-wide text-[color:var(--hk-muted)]">
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
                          className="border-b border-[color:var(--hk-border)]/60 last:border-0"
                        >
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2.5">
                              <OrgLogo org={o} size={32} />
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-[color:var(--hk-fg)]">
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
                                className="font-medium text-[color:var(--hk-primary,#305f33)] underline-offset-2 hover:underline"
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
                                className="font-medium text-[color:var(--hk-primary,#305f33)] underline-offset-2 hover:underline"
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
              <HackathonPartnerStatusLegend isFr={isFr} />
            </section>
          ) : null}

          {tab === "dialogue" ? (
            <section className="flex h-[min(70vh,640px)] flex-col overflow-hidden rounded-2xl border border-[color:var(--hk-border)] bg-[color:var(--hk-surface)] shadow-[0_10px_28px_-18px_var(--hk-shadow)]">
              <div className="border-b border-[color:var(--hk-border)] px-4 py-2.5">
                <p className="text-sm font-bold text-[color:var(--hk-fg)]">
                  {isFr ? "Salle commune" : "Shared room"}
                </p>
                <p className="text-[11px] text-[color:var(--hk-muted)]">
                  {isFr
                    ? "Tous les partenaires connectés + McBuleli"
                    : "All connected partners + McBuleli"}
                </p>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3 sm:px-4">
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
                    return (
                      <div
                        key={m.id}
                        className={`flex ${mine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-3 py-2 ${
                            mine
                              ? "bg-[color:var(--hk-primary,#305f33)] text-white"
                              : "bg-[color:var(--hk-bg,#f5f5f4)] text-[color:var(--hk-fg)]"
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
                          <p className="whitespace-pre-wrap text-sm leading-snug">
                            {m.body}
                          </p>
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
                onSubmit={sendMessage}
                className="border-t border-[color:var(--hk-border)] p-3"
              >
                {msgErr ? (
                  <p className="mb-2 text-xs font-medium text-red-600">
                    {msgErr}
                  </p>
                ) : null}
                <div className="flex gap-2">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={
                      isFr ? "Écrire un message…" : "Write a message…"
                    }
                    className="min-w-0 flex-1 rounded-xl border border-[color:var(--hk-border)] bg-[color:var(--hk-bg,#fff)] px-3 py-2.5 text-sm text-[color:var(--hk-fg)] outline-none focus:border-[color:var(--hk-primary,#305f33)]"
                    maxLength={4000}
                  />
                  <button
                    type="submit"
                    disabled={msgBusy || !draft.trim()}
                    className="rounded-xl bg-[color:var(--hk-primary,#305f33)] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                  >
                    {isFr ? "Envoyer" : "Send"}
                  </button>
                </div>
              </form>
            </section>
          ) : null}
        </>
      ) : null}

      <PoweredByFooter />
    </div>
  );
}
