"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { PROVINCES, TRAVEL_AGENCIES, type ProvinceId, type TravelAgency } from "@/lib/leads/travel-agencies";

export function AgencesBoard() {
  const [province, setProvince] = useState<ProvinceId>("Kinshasa");
  const [commune, setCommune] = useState("Toutes");
  const [query, setQuery] = useState("");

  const inProvince = TRAVEL_AGENCIES.filter((row) => row.province === province);
  const communes = ["Toutes", ...Array.from(new Set(inProvince.map((row) => row.commune))).sort((a, b) => a.localeCompare(b, "fr"))];
  const q = query.trim().toLowerCase();
  const rows = inProvince.filter((row) => {
    if (commune !== "Toutes" && row.commune !== commune) return false;
    if (!q) return true;
    return [row.name, row.activity, row.address, row.commune, ...row.phones, ...row.emails].join(" ").toLowerCase().includes(q);
  });

  const groups = communes
    .filter((name) => name !== "Toutes")
    .map((name) => ({ name, rows: rows.filter((row) => row.commune === name) }))
    .filter((group) => group.rows.length > 0);

  return (
    <div className="min-h-dvh bg-[#f4f1ea] text-stone-900">
      <header className="relative overflow-hidden bg-[#16351c] text-white">
        <RouteLines />
        <div className="relative mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/brand/logo-256.png" alt="" width={32} height={32} className="h-8 w-8 rounded-full" />
            <span className="text-sm font-extrabold">McBuleli</span>
          </Link>
          <Link href="/" className="text-xs font-semibold text-white/80 hover:text-white">
            Accueil
          </Link>
        </div>
        <div className="relative mx-auto max-w-6xl px-4 pb-8 pt-2">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10">
              <PlaneIcon />
            </span>
            <div>
              <h1 className="text-3xl font-black tracking-tight">Agences</h1>
              <p className="text-sm text-white/70">{TRAVEL_AGENCIES.length} bureaux</p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {PROVINCES.map((item) => {
              const count = TRAVEL_AGENCIES.filter((row) => row.province === item.id).length;
              const active = item.id === province;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setProvince(item.id);
                    setCommune("Toutes");
                  }}
                  className={`flex items-center justify-between rounded-2xl border px-4 py-4 text-left ${
                    active ? "border-white bg-white text-[#16351c]" : "border-white/15 bg-white/5 text-white"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <PinIcon className={active ? "text-[#16351c]" : "text-white"} />
                    <span className="text-lg font-black">{item.label}</span>
                  </span>
                  <span className={`text-2xl font-black ${active ? "text-[#305F33]" : "text-white/80"}`}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-stone-200 bg-white px-3 py-2.5">
            <SearchIcon />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nom, rue, numéro"
              className="w-full bg-transparent text-sm outline-none"
            />
          </label>
          <div className="flex gap-2 overflow-x-auto">
            {communes.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setCommune(name)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${
                  commune === name ? "bg-[#16351c] text-white" : "bg-white text-stone-600"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 space-y-8">
          {groups.map((group) => (
            <section key={group.name}>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-[0.14em] text-[#305F33]">
                <PinIcon className="h-4 w-4" />
                {group.name}
                <span className="text-stone-400">{group.rows.length}</span>
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {group.rows.map((row) => (
                  <AgencyCard key={row.id} row={row} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}

function AgencyCard({ row }: { row: TravelAgency }) {
  return (
    <article className="flex flex-col rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-black leading-tight">{row.name}</h3>
          <p className="mt-1 text-xs font-semibold text-[#305F33]">{row.activity}</p>
        </div>
        <TierDot tier={row.tier} />
      </div>
      <p className="mt-3 flex gap-2 text-sm leading-snug text-stone-600">
        <PinIcon className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />
        <span>{row.address}</span>
      </p>
      <div className="mt-3 space-y-1.5 text-sm">
        {row.phones.map((phone) => (
          <a key={phone} href={`tel:${phone.replace(/\s/g, "")}`} className="flex items-center gap-2 font-semibold text-stone-800 hover:text-[#305F33]">
            <PhoneIcon />
            {phone}
          </a>
        ))}
        {row.emails.map((email) => (
          <a key={email} href={`mailto:${email}`} className="flex items-center gap-2 text-stone-600 hover:text-[#305F33]">
            <MailIcon />
            <span className="truncate">{email}</span>
          </a>
        ))}
      </div>
      {row.website ? (
        <a href={row.website} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-[#305F33]">
          <GlobeIcon />
          Site
        </a>
      ) : null}
    </article>
  );
}

function TierDot({ tier }: { tier: TravelAgency["tier"] }) {
  const color = tier === "A" ? "bg-emerald-500" : tier === "B" ? "bg-amber-400" : "bg-stone-300";
  const label = tier === "A" ? "Complet" : tier === "B" ? "Joignable" : "Partiel";
  return <span title={label} className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${color}`} />;
}

function PlaneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path d="M3 13.5 21 4l-7.2 16-2.3-6.2L3 13.5Z" strokeLinejoin="round" />
      <path d="M11.5 13.8 21 4" />
    </svg>
  );
}

function PinIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10Z" />
      <circle cx="12" cy="11" r="2" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path d="M8 3.5h3l1.2 3-1.8 1.1a12 12 0 0 0 5 5L17.5 11 20.5 12.2v3A2 2 0 0 1 18.4 17 15.5 15.5 0 0 1 7 5.6 2 2 0 0 1 8 3.5Z" strokeLinejoin="round" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <circle cx="12" cy="12" r="8" />
      <path d="M4 12h16M12 4c2.2 2.4 3.3 5.1 3.3 8S14.2 17.6 12 20c-2.2-2.4-3.3-5.1-3.3-8S9.8 6.4 12 4Z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-stone-400" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="11" cy="11" r="6" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function RouteLines() {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-30" viewBox="0 0 800 280" fill="none" aria-hidden>
      <path d="M-20 210C120 160 180 80 320 110s180 90 280 40 180-90 260-30" stroke="white" strokeWidth="1.2" />
      <path d="M40 40c80 70 140 30 220 70s150 20 250-20 180 10 260 50" stroke="white" strokeWidth="1.2" />
      <circle cx="320" cy="110" r="4" fill="white" />
      <circle cx="600" cy="150" r="4" fill="white" />
    </svg>
  );
}
