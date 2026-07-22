"use client";

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

function BadgeAtmosphere() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 400 720"
      fill="none"
      aria-hidden
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern id="badge-dots" width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="1" fill="#1F6B43" opacity="0.08" />
        </pattern>
        <linearGradient id="badge-wash" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#EAF6EE" stopOpacity="0.9" />
          <stop offset="55%" stopColor="#FAFAF8" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#F3E8FF" stopOpacity="0.35" />
        </linearGradient>
      </defs>
      <rect width="400" height="720" fill="url(#badge-wash)" />
      <rect width="400" height="720" fill="url(#badge-dots)" />
      {/* isometric cubes */}
      <g opacity="0.12" stroke="#1F6B43" strokeWidth="1">
        <path d="M48 120l18-10 18 10v20l-18 10-18-10z" />
        <path d="M66 110v20M48 120l18 10 18-10" />
        <path d="M320 90l14-8 14 8v16l-14 8-14-8z" />
        <path d="M334 82v16M320 90l14 8 14-8" />
        <path d="M70 520l16-9 16 9v18l-16 9-16-9z" />
        <path d="M86 511v18M70 520l16 9 16-9" />
      </g>
      {/* Kinshasa skyline silhouette - very light */}
      <g fill="#1F6B43" opacity="0.06">
        <path d="M0 168h40v-28h18v28h22v-40h16v12h14v-22h20v50h30v-34h18v-18h14v52h26v-26h20v26h40v-44h16v20h22v-30h18v54h36v-38h20v38h48v-24h16v24H400v24H0z" />
        {/* Limete tower hint */}
        <rect x="188" y="98" width="8" height="70" rx="1" />
        <path d="M178 98h28l-6-18h-16z" />
      </g>
      <circle cx="340" cy="240" r="70" stroke="#6D28D9" strokeOpacity="0.08" />
      <circle cx="60" cy="400" r="50" stroke="#1F6B43" strokeOpacity="0.1" />
      <path d="M20 300c40 20 80-10 120 10s70 40 120 10" stroke="#1F6B43" strokeOpacity="0.08" />
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

  const logos = [
    { name: PAWAPAY_PARTNER.name, src: PAWAPAY_PARTNER.logoUrl },
    { name: BINANCE_PARTNER.name, src: BINANCE_PARTNER.logoUrl },
  ];

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto w-full max-w-[420px] overflow-hidden rounded-[28px] border border-[#E5E5E0] bg-[#FAFAF8] shadow-[0_20px_60px_-28px_rgba(34,34,34,0.35)] print:max-w-none print:shadow-none"
      style={{ ["--badge-accent" as string]: meta.accent }}
    >
      <BadgeAtmosphere />

      <div className="relative z-10 px-5 pb-0 pt-5 sm:px-6 sm:pt-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={BRAND_LOGO_256}
              alt="McBuleli"
              width={40}
              height={40}
              className="h-10 w-10 rounded-xl ring-1 ring-[#1F6B43]/15"
            />
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#1F6B43]">
                McBuleli Hackathon
              </p>
              <p className="mt-0.5 max-w-[11rem] truncate text-[11px] text-[#8A8A8A]">
                {editionTitle}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#1F6B43]">
              Kinshasa
            </p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#8A8A8A]">
              {datesLabel}
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[1.65rem] font-black leading-tight tracking-tight text-[#1F6B43] sm:text-[1.85rem]">
              {title}
            </h1>
            <span
              className="mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em]"
              style={{ background: meta.soft, color: meta.ink }}
            >
              <IconUser className="h-3.5 w-3.5" />
              {accessLabel}
            </span>
          </div>
          <div
            className="hidden shrink-0 rounded-2xl px-3 py-2.5 text-white shadow-sm sm:block"
            style={{
              background:
                "linear-gradient(135deg, #1F6B43 0%, #14532D 100%)",
              clipPath: "polygon(12% 0, 100% 0, 100% 100%, 0 100%)",
              paddingLeft: "1.25rem",
            }}
          >
            <div className="flex items-center gap-2">
              <IconCalendar className="h-4 w-4 opacity-90" />
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider opacity-90">
                  {isFr ? "3 jours d'innovation" : "3 days of innovation"}
                </p>
                <p className="text-[10px] font-semibold tracking-wide">
                  Bootcamp - Build - Pitch
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* QR hero */}
        <motion.div
          className="relative mx-auto mt-7 w-fit"
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg
            className="pointer-events-none absolute -inset-6 h-[calc(100%+3rem)] w-[calc(100%+3rem)]"
            viewBox="0 0 240 240"
            aria-hidden
          >
            <circle cx="120" cy="120" r="108" stroke={meta.accent} strokeOpacity="0.12" strokeDasharray="4 8" fill="none" />
            <circle cx="120" cy="120" r="96" stroke={meta.accent} strokeOpacity="0.06" fill="none" />
            <g stroke={meta.accent} strokeOpacity="0.15" strokeWidth="1">
              <path d="M28 70h18M28 70v18M212 70h-18M212 70v18M28 170h18M28 170v-18M212 170h-18M212 170v-18" />
            </g>
          </svg>
          <div className="relative rounded-[22px] border border-white/80 bg-white p-4 shadow-[0_12px_40px_-16px_rgba(31,107,67,0.45)] ring-1 ring-black/[0.03]">
            <QRCode
              value={passUrl}
              size={188}
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
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-lg"
                />
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mx-auto mt-4 w-fit rounded-full border border-[#E5E5E0] bg-white/80 px-4 py-1.5 font-mono text-sm font-extrabold tracking-[0.14em] text-[#1F6B43] shadow-sm backdrop-blur">
          {ticketCode}
        </div>

        <div className="mt-5 text-center">
          <p className="text-xl font-black tracking-tight text-[#222222]">
            {displayName}
          </p>
          <p className="mt-1 text-sm text-[#8A8A8A]">{orgOrEmail}</p>
        </div>

        {/* Info row */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#E5E5E0]/80 bg-white/70 p-3 backdrop-blur-sm">
            <IconShield className="h-4 w-4 text-[#1F6B43]" />
            <p className="mt-2 text-[10px] font-extrabold uppercase tracking-wider text-[#222222]">
              {statusLabel}
            </p>
          </div>
          <div className="rounded-2xl border border-[#E5E5E0]/80 bg-white/70 p-3 backdrop-blur-sm">
            <IconMapPin className="h-4 w-4 text-[#7C3AED]" />
            <p className="mt-2 text-[10px] font-extrabold uppercase tracking-wider text-[#222222]">
              Silikin Village
            </p>
            <p className="mt-0.5 text-[10px] leading-snug text-[#8A8A8A]">{venue}</p>
          </div>
          <div className="rounded-2xl border border-[#E5E5E0]/80 bg-white/70 p-3 backdrop-blur-sm">
            <IconCalendar className="h-4 w-4 text-[#EA580C]" />
            <p className="mt-2 text-[10px] font-extrabold uppercase tracking-wider text-[#222222]">
              {datesLabel}
            </p>
            <p className="mt-0.5 text-[10px] leading-snug text-[#8A8A8A]">
              {isFr ? "Valable les 3 jours" : "Valid all 3 days"}
            </p>
          </div>
        </div>

        {/* Partners logos only */}
        <div className="mt-7">
          <p className="text-center text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#1F6B43]">
            {isFr ? "Nos partenaires" : "Our partners"}
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
            {logos.map((logo) => (
              <div
                key={logo.name}
                className="flex h-12 w-[7.25rem] items-center justify-center rounded-2xl border border-[#E5E5E0] bg-white px-3 shadow-sm"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logo.src}
                  alt={logo.name}
                  className="max-h-7 max-w-full object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer bar */}
      <div className="relative mt-7 overflow-hidden bg-[#1F6B43] px-5 py-4 text-white sm:px-6">
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-20"
          viewBox="0 0 400 80"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path
            d="M0 40c40-18 80 18 120 0s80-18 120 0 80 18 120 0 40-12 40-12v52H0z"
            fill="#14532D"
          />
        </svg>
        <div className="relative flex items-center justify-between gap-3">
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
