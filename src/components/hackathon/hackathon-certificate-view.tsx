"use client";

import type { CertificatePublic } from "@/lib/hackathon/certificate-types";

export function HackathonCertificateView({
  cert,
  isFr,
  autoPrint,
}: {
  cert: CertificatePublic;
  isFr: boolean;
  autoPrint?: boolean;
}) {
  const title = isFr ? cert.titleFr : cert.titleEn;
  const eventLabel = isFr ? cert.eventLabelFr : cert.eventLabelEn;
  const kindLabel =
    cert.kind === "distinction"
      ? "Distinction"
      : isFr
        ? "Participation"
        : "Participation";

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 print:max-w-none print:px-0 print:py-0">
      {autoPrint ? (
        <script
          dangerouslySetInnerHTML={{
            __html: `window.addEventListener('load',()=>setTimeout(()=>window.print(),400));`,
          }}
        />
      ) : null}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <a
          href="/hackathon/espace"
          className="text-sm font-semibold text-[#305f33] hover:underline"
        >
          {isFr ? "← Mon espace" : "← My hub"}
        </a>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-lg bg-[#305f33] px-4 py-2 text-sm font-bold text-white"
        >
          {isFr ? "Imprimer / PDF" : "Print / PDF"}
        </button>
      </div>

      <article
        className={`relative overflow-hidden rounded-3xl border-2 bg-white p-8 shadow-lg sm:p-12 ${
          cert.revoked
            ? "border-rose-300"
            : cert.kind === "distinction"
              ? "border-amber-400"
              : "border-[#305f33]/40"
        }`}
        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#305f33,transparent_45%),radial-gradient(circle_at_80%_80%,#d4a017,transparent_40%)] opacity-[0.07]" />

        <header className="relative text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#305f33]">
            McBuleli
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-wider text-stone-500">
            {kindLabel}
            {cert.rank ? ` · #${cert.rank}` : ""}
          </p>
          <h1 className="mt-6 text-2xl font-black leading-tight text-stone-900 sm:text-3xl">
            {title}
          </h1>
        </header>

        <div className="relative mt-10 text-center">
          <p className="text-sm text-stone-500">
            {isFr ? "Décerné à" : "Awarded to"}
          </p>
          <p className="mt-2 text-3xl font-black text-stone-900">
            {cert.holderName}
          </p>
          {cert.teamName ? (
            <p className="mt-2 text-base font-semibold text-[#305f33]">
              {isFr ? "Équipe" : "Team"} {cert.teamName}
            </p>
          ) : null}
        </div>

        <p className="relative mx-auto mt-8 max-w-xl text-center text-sm leading-relaxed text-stone-600">
          {isFr
            ? `Pour sa participation au ${eventLabel} à ${cert.venue}, Kinshasa.`
            : `For participation in the ${eventLabel} at ${cert.venue}, Kinshasa.`}
        </p>

        <footer className="relative mt-12 flex flex-wrap items-end justify-between gap-6 border-t border-stone-200 pt-6 text-xs text-stone-500">
          <div>
            <p className="font-semibold text-stone-700">
              {new Date(cert.issuedAt).toLocaleDateString(
                isFr ? "fr-FR" : "en-US",
                { dateStyle: "long" },
              )}
            </p>
            <p className="mt-1">
              {isFr ? "Code" : "Code"} : {cert.verifyCode}
            </p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-[#305f33]">mcbuleli.org</p>
            <p className="mt-1 max-w-[14rem] break-all text-[10px]">
              {cert.verifyUrl}
            </p>
          </div>
        </footer>

        {cert.revoked ? (
          <p className="relative mt-6 rounded-lg bg-rose-50 px-3 py-2 text-center text-sm font-bold text-rose-800">
            {isFr ? "Certificat révoqué" : "Certificate revoked"}
          </p>
        ) : (
          <p className="relative mt-6 text-center text-[11px] font-semibold text-emerald-800">
            {isFr ? "✓ Certificat valide" : "✓ Valid certificate"}
          </p>
        )}
      </article>
    </main>
  );
}
