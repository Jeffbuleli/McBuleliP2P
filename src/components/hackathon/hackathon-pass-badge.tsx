"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import QRCode from "react-qr-code";
import { BRAND_LOGO_256 } from "@/lib/brand-logo";
import {
  BINANCE_PARTNER,
  PAWAPAY_PARTNER,
} from "@/lib/hackathon/event-content";
import { SUPPORT_X } from "@/lib/support-contact";

export type HackathonBadgeKind =
  | "participant"
  | "partner"
  | "speaker"
  | "mentor"
  | "jury"
  | "sponsor"
  | "organizer"
  | "vip"
  | "media"
  | "ticket";

const KIND_META: Record<
  HackathonBadgeKind,
  { labelFr: string; labelEn: string; accent: string; soft: string; ink: string }
> = {
  participant: {
    labelFr: "Participant",
    labelEn: "Participant",
    accent: "#1F6B43",
    soft: "#EAF6EE",
    ink: "#1F6B43",
  },
  partner: {
    labelFr: "Partenaire",
    labelEn: "Partner",
    accent: "#6D28D9",
    soft: "#F3E8FF",
    ink: "#5B21B6",
  },
  speaker: {
    labelFr: "Speaker",
    labelEn: "Speaker",
    accent: "#2563EB",
    soft: "#DBEAFE",
    ink: "#1D4ED8",
  },
  mentor: {
    labelFr: "Mentor",
    labelEn: "Mentor",
    accent: "#0891B2",
    soft: "#CFFAFE",
    ink: "#0E7490",
  },
  jury: {
    labelFr: "Jury",
    labelEn: "Jury",
    accent: "#222222",
    soft: "#F3F4F6",
    ink: "#111111",
  },
  sponsor: {
    labelFr: "Sponsor",
    labelEn: "Sponsor",
    accent: "#EA580C",
    soft: "#FFEDD5",
    ink: "#C2410C",
  },
  organizer: {
    labelFr: "Organisateur",
    labelEn: "Organizer",
    accent: "#1F6B43",
    soft: "#EAF6EE",
    ink: "#14532D",
  },
  vip: {
    labelFr: "VIP",
    labelEn: "VIP",
    accent: "#F24848",
    soft: "#FEE2E2",
    ink: "#B91C1C",
  },
  media: {
    labelFr: "Presse",
    labelEn: "Press",
    accent: "#4F46E5",
    soft: "#E0E7FF",
    ink: "#3730A3",
  },
  ticket: {
    labelFr: "Ticket officiel",
    labelEn: "Official ticket",
    accent: "#1F6B43",
    soft: "#EAF6EE",
    ink: "#1F6B43",
  },
};

/** Drop city suffix so titles never truncate as "… - Kinsh". */
export function cleanHackathonEditionTitle(raw: string): string {
  return raw
    .replace(/\s*[—–-]\s*Kinshasa\b/gi, "")
    .replace(/\bKinshasa\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function IconUser({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function IconCalendar({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
function IconShield({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
function IconMapPin({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
function IconGlobe({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20" />
    </svg>
  );
}

function MetaChip({
  icon,
  label,
  iconClass,
}: {
  icon: ReactNode;
  label: string;
  iconClass: string;
}) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#E5E5E0]/90 bg-white/75 px-2.5 py-1 text-[10px] font-bold tracking-wide text-[#222222] shadow-sm backdrop-blur-sm">
      <span className={iconClass}>{icon}</span>
      <span className="truncate">{label}</span>
    </span>
  );
}

function BadgeAtmosphere() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 400 680"
      fill="none"
      aria-hidden
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern id="badge-dots" width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="1.2" cy="1.2" r="0.9" fill="#1F6B43" opacity="0.07" />
        </pattern>
        <linearGradient id="badge-wash" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#EAF6EE" stopOpacity="0.95" />
          <stop offset="50%" stopColor="#FAFAF8" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#EEF2FF" stopOpacity="0.28" />
        </linearGradient>
        <pattern id="badge-hex" width="28" height="24" patternUnits="userSpaceOnUse">
          <path
            d="M14 2l10 6v8l-10 6L4 16V8z"
            stroke="#1F6B43"
            strokeOpacity="0.05"
            fill="none"
          />
        </pattern>
      </defs>
      <rect width="400" height="680" fill="url(#badge-wash)" />
      <rect width="400" height="680" fill="url(#badge-dots)" />
      <rect width="400" height="680" fill="url(#badge-hex)" />
      <g opacity="0.1" stroke="#1F6B43" strokeWidth="1">
        <path d="M42 108l16-9 16 9v18l-16 9-16-9z" />
        <path d="M58 99v18M42 108l16 9 16-9" />
        <path d="M328 86l12-7 12 7v14l-12 7-12-7z" />
        <path d="M340 79v14M328 86l12 7 12-7" />
      </g>
      <g fill="#1F6B43" opacity="0.05">
        <path d="M0 150h36v-24h16v24h20v-36h14v10h12v-18h18v46h26v-30h16v-14h12v44h22v-22h18v22h36v-40h14v18h20v-26h16v48h32v-34h18v34h44v-20h14v20H400v20H0z" />
        <rect x="186" y="88" width="7" height="62" rx="1" />
        <path d="M176 88h27l-5-16h-17z" />
      </g>
      <circle cx="348" cy="220" r="64" stroke="#6D28D9" strokeOpacity="0.07" />
      <circle cx="52" cy="380" r="46" stroke="#1F6B43" strokeOpacity="0.09" />
    </svg>
  );
}

export function HackathonPassBadge({
  kind,
  isFr,
  passUrl,
  ticketCode,
  displayName,
  orgOrEmail,
  venue,
  datesLabel,
  editionTitle,
}: {
  kind: HackathonBadgeKind;
  isFr: boolean;
  passUrl: string;
  ticketCode: string;
  displayName: string;
  orgOrEmail: string;
  venue: string;
  datesLabel: string;
  editionTitle: string;
}) {
  const meta = KIND_META[kind];
  const cleanEdition = cleanHackathonEditionTitle(editionTitle);
  const title =
    kind === "ticket"
      ? isFr
        ? "Ticket officiel"
        : "Official ticket"
      : isFr
        ? `Badge ${meta.labelFr}`
        : `${meta.labelEn} badge`;
  const accessLabel = isFr ? "Accès 3 jours" : "3-day access";
  const statusLabel =
    kind === "partner"
      ? isFr
        ? "Partenaire confirmé"
        : "Confirmed partner"
      : kind === "ticket" || kind === "participant"
        ? isFr
          ? "Participant confirmé"
          : "Confirmed participant"
        : isFr
          ? `${meta.labelFr} confirmé`
          : `Confirmed ${meta.labelEn.toLowerCase()}`;

  const venueShort = /silikin/i.test(venue) ? "Silikin Village" : venue;

  const logos = [
    { name: PAWAPAY_PARTNER.name, src: PAWAPAY_PARTNER.logoUrl },
    { name: BINANCE_PARTNER.name, src: BINANCE_PARTNER.logoUrl },
  ];

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto w-full max-w-[420px] overflow-hidden rounded-[28px] border border-[#E5E5E0] bg-[#FAFAF8] shadow-[0_24px_64px_-30px_rgba(34,34,34,0.4)] print:max-w-none print:shadow-none"
      style={{ ["--badge-accent" as string]: meta.accent }}
    >
      <BadgeAtmosphere />

      <div className="relative z-10 px-5 pb-0 pt-5 sm:px-6 sm:pt-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={BRAND_LOGO_256}
              alt="McBuleli"
              width={40}
              height={40}
              className="h-10 w-10 shrink-0 rounded-xl ring-1 ring-[#1F6B43]/15"
            />
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#1F6B43]">
                McBuleli Hackathon
              </p>
              {cleanEdition ? (
                <p className="mt-0.5 truncate text-[11px] text-[#8A8A8A]">
                  {cleanEdition}
                </p>
              ) : null}
            </div>
          </div>
          <span
            className="shrink-0 rounded-full px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.12em]"
            style={{ background: meta.soft, color: meta.ink }}
          >
            {isFr ? meta.labelFr : meta.labelEn}
          </span>
        </div>

        <div className="mt-5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="text-[1.7rem] font-black leading-none tracking-tight text-[#1F6B43] sm:text-[1.9rem]">
              {title}
            </h1>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.1em]"
              style={{ background: meta.soft, color: meta.ink }}
            >
              <IconUser className="h-3.5 w-3.5" />
              {accessLabel}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <MetaChip
              icon={<IconMapPin className="h-3.5 w-3.5" />}
              label={venueShort}
              iconClass="text-[#7C3AED]"
            />
            <MetaChip
              icon={<IconCalendar className="h-3.5 w-3.5" />}
              label={datesLabel}
              iconClass="text-[#EA580C]"
            />
            <MetaChip
              icon={<IconShield className="h-3.5 w-3.5" />}
              label={statusLabel}
              iconClass="text-[#1F6B43]"
            />
          </div>
        </div>

        <motion.div
          className="relative mx-auto mt-7 w-fit"
          animate={{ y: [0, -2.5, 0] }}
          transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg
            className="pointer-events-none absolute -inset-7 h-[calc(100%+3.5rem)] w-[calc(100%+3.5rem)]"
            viewBox="0 0 240 240"
            aria-hidden
          >
            <circle
              cx="120"
              cy="120"
              r="110"
              stroke={meta.accent}
              strokeOpacity="0.14"
              strokeDasharray="3 7"
              fill="none"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 120 120"
                to="360 120 120"
                dur="28s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="120" cy="120" r="98" stroke={meta.accent} strokeOpacity="0.05" fill="none" />
            <g stroke={meta.accent} strokeOpacity="0.18" strokeWidth="1.25">
              <path d="M26 68h20M26 68v20M214 68h-20M214 68v20M26 172h20M26 172v-20M214 172h-20M214 172v-20" />
            </g>
          </svg>
          <div className="relative rounded-[22px] border border-white/90 bg-white p-3.5 shadow-[0_14px_44px_-14px_rgba(31,107,67,0.5)] ring-1 ring-black/[0.04]">
            <QRCode
              value={passUrl}
              size={196}
              bgColor="#ffffff"
              fgColor="#1F6B43"
              level="H"
            />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="rounded-xl bg-white p-1.5 shadow-md ring-1 ring-[#E5E5E0]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={BRAND_LOGO_256}
                  alt=""
                  width={30}
                  height={30}
                  className="h-[30px] w-[30px] rounded-lg"
                />
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mx-auto mt-4 w-fit rounded-full border border-[#E5E5E0] bg-white/85 px-4 py-1.5 font-mono text-sm font-extrabold tracking-[0.14em] text-[#1F6B43] shadow-sm backdrop-blur">
          {ticketCode}
        </div>

        <div className="mt-5 text-center">
          <p className="text-xl font-black tracking-tight text-[#222222]">
            {displayName}
          </p>
          <p className="mt-1 text-sm text-[#8A8A8A]">{orgOrEmail}</p>
        </div>

        <div className="mt-7">
          <p className="text-center text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#1F6B43]">
            {isFr ? "Nos partenaires" : "Our partners"}
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
            {logos.map((logo) => (
              <div
                key={logo.name}
                className="flex h-11 w-[6.75rem] items-center justify-center rounded-2xl border border-[#E5E5E0] bg-white px-3 shadow-sm"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logo.src}
                  alt={logo.name}
                  className="max-h-6 max-w-full object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative mt-7 overflow-hidden bg-[#1F6B43] px-5 py-3.5 text-white sm:px-6">
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-25"
          viewBox="0 0 400 72"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d="M0 36c40-16 80 16 120 0s80-16 120 0 80 16 120 0 40-10 40-10v46H0z"
            fill="#14532D"
          />
        </svg>
        <div className="relative flex flex-wrap items-center justify-between gap-2">
          <a
            href="https://mcbuleli.org/hackathon"
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white/90 hover:text-white"
          >
            <IconGlobe className="h-3.5 w-3.5" />
            mcbuleli.org/hackathon
          </a>
          <a
            href={SUPPORT_X}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[11px] font-semibold text-white/90 hover:text-white"
          >
            <span className="opacity-80">Powered by</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={BRAND_LOGO_256}
              alt=""
              width={22}
              height={22}
              className="h-[22px] w-[22px] rounded-full bg-white/10 p-0.5 ring-1 ring-white/25"
            />
            <span className="font-extrabold">McBuleli</span>
          </a>
        </div>
      </div>
    </motion.article>
  );
}
