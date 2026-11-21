"use client";

import { useState } from "react";
import {
  DRC_PROVINCES,
  TRAVEL_AGENCIES,
  type LeadTier,
  type TravelAgency,
} from "@/lib/leads/travel-agencies";

const TIER_LABEL: Record<LeadTier, string> = {
  A: "Complet",
  B: "Joignable",
  C: "À compléter",
};

function join(values: string[]): string {
  return values.length ? values.join(" · ") : "—";
}

export function AgencesBoard() {
  const [province, setProvince] = useState<(typeof DRC_PROVINCES)[number]>("Kinshasa");
  const [commune, setCommune] = useState("Toutes");
  const [tier, setTier] = useState<"Tous" | LeadTier>("Tous");
  const [query, setQuery] = useState("");

  const inProvince = TRAVEL_AGENCIES.filter((row) => row.province === province);
  const communes = ["Toutes", ...Array.from(new Set(inProvince.map((row) => row.commune))).sort()];

  const q = query.trim().toLowerCase();
  const rows = inProvince
    .filter((row) => (commune === "Toutes" ? true : row.commune === commune))
    .filter((row) => (tier === "Tous" ? true : row.tier === tier))
    .filter((row) => {
      if (!q) return true;
      const blob = [
        row.name,
        row.activity,
        row.address,
        row.commune,
        row.representative ?? "",
        ...row.phones,
        ...row.emails,
      ]
        .join(" ")
        .toLowerCase();
      return blob.includes(q);
    })
    .sort((a, b) => a.commune.localeCompare(b.commune, "fr") || a.name.localeCompare(b.name, "fr"));

  const counts = {
    total: inProvince.length,
    complete: inProvince.filter((row) => row.tier === "A").length,
    gombe: inProvince.filter((row) => row.commune === "Gombe").length,
  };

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {DRC_PROVINCES.map((name) => {
          const n = TRAVEL_AGENCIES.filter((row) => row.province === name).length;
          const active = name === province;
          return (
            <button
              key={name}
              type="button"
              onClick={() => {
                setProvince(name);
                setCommune("Toutes");
              }}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                active
                  ? "border-[#305F33] bg-[#305F33] text-white"
                  : "border-stone-200 bg-white text-stone-600"
              }`}
            >
              {name}
              <span className={active ? "text-white/80" : "text-stone-400"}> · {n || "—"}</span>
            </button>
          );
        })}
      </div>

      {inProvince.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-stone-300 bg-white px-4 py-8 text-center text-sm text-stone-600">
          {province} n&apos;est pas encore scanné. La première vague est Kinshasa.
        </p>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Stat label="Fiches" value={String(counts.total)} />
            <Stat label="Contact complet" value={String(counts.complete)} />
            <Stat label="Gombe" value={String(counts.gombe)} />
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nom, téléphone, e-mail, rue…"
              className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none ring-[#305F33] focus:ring-2"
            />
            <select
              value={commune}
              onChange={(event) => setCommune(event.target.value)}
              className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm"
            >
              {communes.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
            <select
              value={tier}
              onChange={(event) => setTier(event.target.value as "Tous" | LeadTier)}
              className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm"
            >
              <option value="Tous">Toutes les fiches</option>
              <option value="A">Complet</option>
              <option value="B">Joignable</option>
              <option value="C">À compléter</option>
            </select>
          </div>

          <p className="mt-3 text-xs text-stone-500">{rows.length} fiche{rows.length > 1 ? "s" : ""} affichée{rows.length > 1 ? "s" : ""}</p>

          <div className="mt-3 hidden overflow-x-auto rounded-2xl border border-stone-200 bg-white md:block">
            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-3 py-3 font-semibold">Agence</th>
                  <th className="px-3 py-3 font-semibold">Commune</th>
                  <th className="px-3 py-3 font-semibold">Activité</th>
                  <th className="px-3 py-3 font-semibold">Adresse</th>
                  <th className="px-3 py-3 font-semibold">Téléphone</th>
                  <th className="px-3 py-3 font-semibold">E-mail</th>
                  <th className="px-3 py-3 font-semibold">Fiche</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-stone-100 align-top">
                    <td className="px-3 py-3">
                      <div className="font-semibold text-stone-900">{row.name}</div>
                      {row.representative ? (
                        <div className="mt-1 text-xs text-stone-500">FEC · {row.representative}</div>
                      ) : null}
                      <Tier tier={row.tier} />
                    </td>
                    <td className="px-3 py-3 text-stone-700">{row.commune}</td>
                    <td className="px-3 py-3 text-stone-700">{row.activity}</td>
                    <td className="px-3 py-3 text-stone-700">{row.address}</td>
                    <td className="px-3 py-3">
                      <Lines values={row.phones} kind="tel" />
                    </td>
                    <td className="px-3 py-3">
                      <Lines values={row.emails} kind="mail" />
                    </td>
                    <td className="px-3 py-3">
                      <Sources row={row} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 space-y-3 md:hidden">
            {rows.map((row) => (
              <article key={row.id} className="rounded-2xl border border-stone-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-base font-bold">{row.name}</h2>
                  <Tier tier={row.tier} />
                </div>
                <p className="mt-1 text-xs font-semibold text-[#305F33]">
                  {row.commune} · {row.activity}
                </p>
                <p className="mt-2 text-sm text-stone-700">{row.address}</p>
                <p className="mt-2 text-sm">{join(row.phones)}</p>
                <p className="text-sm text-stone-700">{join(row.emails)}</p>
                {row.representative ? (
                  <p className="mt-1 text-xs text-stone-500">Interlocuteur FEC · {row.representative}</p>
                ) : null}
                {row.note ? <p className="mt-2 text-xs leading-relaxed text-stone-500">{row.note}</p> : null}
                <div className="mt-2">
                  <Sources row={row} />
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white px-3 py-3">
      <div className="text-lg font-black text-[#305F33]">{value}</div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">{label}</div>
    </div>
  );
}

function Tier({ tier }: { tier: LeadTier }) {
  const tone =
    tier === "A"
      ? "bg-emerald-50 text-emerald-800"
      : tier === "B"
        ? "bg-amber-50 text-amber-800"
        : "bg-stone-100 text-stone-600";
  return (
    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${tone}`}>
      {TIER_LABEL[tier]}
    </span>
  );
}

function Lines({ values, kind }: { values: string[]; kind: "tel" | "mail" }) {
  if (!values.length) return <span className="text-stone-400">—</span>;
  return (
    <div className="space-y-1">
      {values.map((value) => (
        <a
          key={value}
          href={kind === "tel" ? `tel:${value.replace(/\s/g, "")}` : `mailto:${value}`}
          className="block text-[#305F33] hover:underline"
        >
          {value}
        </a>
      ))}
    </div>
  );
}

function Sources({ row }: { row: TravelAgency }) {
  return (
    <div className="space-y-1 text-xs">
      {row.website ? (
        <a href={row.website} className="block font-semibold text-[#305F33] hover:underline" target="_blank" rel="noreferrer">
          Site
        </a>
      ) : null}
      {row.sources.map((source) => (
        <a key={source.href + source.label} href={source.href} className="block text-stone-500 hover:underline" target="_blank" rel="noreferrer">
          {source.label}
        </a>
      ))}
      {row.note ? <p className="pt-1 leading-relaxed text-stone-400">{row.note}</p> : null}
    </div>
  );
}
