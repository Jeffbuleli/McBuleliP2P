import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AgencesBoard } from "@/components/leads/agences-board";
import { SCAN, TRAVEL_AGENCIES } from "@/lib/leads/travel-agencies";

export const metadata: Metadata = {
  title: "Agences de voyage — Kinshasa",
  description:
    "Première vague de contacts publics d'agences de voyage à Kinshasa, classées par commune, à partir de l'annuaire FEC 2025.",
};

export default function AgencesPage() {
  const kinshasa = TRAVEL_AGENCIES.length;

  return (
    <div className="min-h-dvh bg-[#fafaf9] text-stone-900">
      <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/brand/logo-256.png" alt="" width={32} height={32} className="h-8 w-8 rounded-full ring-2 ring-[#305F33]/20" />
            <span className="text-sm font-extrabold">McBuleli</span>
          </Link>
          <Link href="/" className="text-xs font-semibold text-[#305F33] hover:underline">
            Accueil
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 pb-16">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#305F33]">Leads · RDC</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">Agences de voyage</h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-stone-600">
          Première vague : <strong className="font-semibold text-stone-800">{SCAN.province}</strong>, {kinshasa} fiches.
          Point de départ : {SCAN.fec}. Les fiches ont ensuite été recoupées avec les sites des agences et l&apos;annuaire public Moncongo.
          La commune est celle de l&apos;adresse publiée. {SCAN.model} a servi à poser le classement, sans ajouter de contact.
          Les autres provinces sont prêtes dans le filtre, encore vides.
        </p>
        <p className="mt-2 text-xs text-stone-500">Relevé du {SCAN.scannedOn}. Contacts publics seulement. Vérifier avant d&apos;appeler : un numéro FEC peut être plus ancien que celui du site.</p>

        <div className="mt-6">
          <AgencesBoard />
        </div>
      </main>
    </div>
  );
}
