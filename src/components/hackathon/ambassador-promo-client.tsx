"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AMBASSADOR_CASHBACK_USD,
  AMBASSADOR_DISCOUNT_PERCENT,
} from "@/lib/hackathon/promo-types";
import { HACKATHON_PRICE_USD } from "@/lib/hackathon/constants";

type ExistingPromo = {
  code: string;
  dashboardToken: string;
  dashboardUrl: string;
  shareUrl: string;
  discountPercent: number;
  cashbackUsd: number;
  priceUsd: string;
};

export function AmbassadorPromoClient({
  initialEmail,
  initialDisplayName,
}: {
  initialEmail: string;
  initialDisplayName: string;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [existing, setExisting] = useState<ExistingPromo | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [copied, setCopied] = useState(false);

  const discounted = Math.round(
    (Number(HACKATHON_PRICE_USD) * (100 - AMBASSADOR_DISCOUNT_PERCENT)) / 100,
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/hackathon/ambassador", {
          cache: "no-store",
        });
        if (!res.ok) return;
        const json = (await res.json()) as { promo: ExistingPromo | null };
        if (!cancelled && json.promo) setExisting(json.promo);
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoadingExisting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/hackathon/ambassador", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, displayName }),
      });
      const json = (await res.json()) as {
        error?: string;
        promo?: { dashboardToken: string; dashboardUrl: string };
      };
      if (!res.ok || !json.promo) {
        const map: Record<string, string> = {
          invalid_code: "Code invalide (4-16 lettres/chiffres).",
          invalid_display_name: "Nom public trop court.",
          code_taken: "Ce code est déjà pris. Choisis-en un autre.",
          no_edition: "Aucune édition hackathon active.",
          auth_required: "Connecte-toi pour continuer.",
        };
        setErr(map[json.error ?? ""] ?? "Impossible de créer le code.");
        return;
      }
      router.push(
        `/hackathon/promo/dashboard/${encodeURIComponent(json.promo.dashboardToken)}`,
      );
    } catch {
      setErr("Erreur réseau.");
    } finally {
      setBusy(false);
    }
  }

  async function copyShare() {
    if (!existing?.shareUrl) return;
    try {
      await navigator.clipboard.writeText(existing.shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  if (loadingExisting) {
    return (
      <div className="rounded-2xl bg-white px-5 py-10 text-center shadow-sm ring-1 ring-black/[0.04]">
        <p className="text-sm text-[#5c6b60]">Chargement…</p>
      </div>
    );
  }

  if (existing) {
    return (
      <div className="space-y-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/[0.04]">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1F6B43]">
            Code actif
          </p>
          <p className="mt-2 font-mono text-3xl font-black tracking-[0.08em] text-[#1A1A1A]">
            {existing.code}
          </p>
          <p className="mt-2 text-sm text-[#5c6b60]">
            Tu as déjà un code ambassadeur. Partage ton lien et suis les
            confirmations.
          </p>
        </div>

        <div className="rounded-xl bg-[#EAF6EE] px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#1F6B43]">
            Lien à partager
          </p>
          <p className="mt-1 break-all text-sm font-semibold text-[#1F6B43]">
            {existing.shareUrl}
          </p>
          <button
            type="button"
            onClick={() => void copyShare()}
            className="mt-3 rounded-xl bg-[#1F6B43] px-3.5 py-2 text-xs font-bold text-white transition hover:bg-[#185535]"
          >
            {copied ? "Copié" : "Copier le lien"}
          </button>
        </div>

        <div className="flex flex-wrap gap-3">
          <a
            href={`/hackathon/promo/dashboard/${encodeURIComponent(existing.dashboardToken)}`}
            className="inline-flex flex-1 items-center justify-center rounded-xl bg-[#1F6B43] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#185535]"
          >
            Ouvrir mon dashboard
          </a>
          <a
            href={existing.shareUrl}
            className="inline-flex items-center justify-center rounded-xl bg-[#F3F4F1] px-4 py-3 text-sm font-bold text-[#1A1A1A] transition hover:bg-[#E8E9E4]"
          >
            Voir mon lien
          </a>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/[0.04]"
    >
      <div>
        <label className="text-[11px] font-bold uppercase tracking-wide text-[#6B6B6B]">
          Nom public
        </label>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={80}
          required
          className="mt-1.5 w-full rounded-xl border border-[#E5E7EB] bg-[#FAFAF8] px-3.5 py-3 text-sm font-medium text-[#1A1A1A] outline-none transition focus:border-[#1F6B43] focus:ring-2 focus:ring-[#1F6B43]/15"
          placeholder="Ex. Jeff Buleli"
        />
      </div>
      <div>
        <label className="text-[11px] font-bold uppercase tracking-wide text-[#6B6B6B]">
          Ton code promo
        </label>
        <input
          value={code}
          onChange={(e) =>
            setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
          }
          minLength={4}
          maxLength={16}
          required
          className="mt-1.5 w-full rounded-xl border border-[#E5E7EB] bg-[#FAFAF8] px-3.5 py-3 font-mono text-sm font-bold tracking-wider text-[#1A1A1A] outline-none transition focus:border-[#1F6B43] focus:ring-2 focus:ring-[#1F6B43]/15"
          placeholder="Ex. JEFF243"
          autoCapitalize="characters"
        />
        <p className="mt-1.5 text-xs text-[#6B6B6B]">
          4 à 16 caractères - lettres et chiffres seulement.
        </p>
      </div>

      <div className="rounded-xl bg-[#EAF6EE] px-4 py-3.5 text-sm text-[#1F6B43]">
        <p className="font-bold">
          -{AMBASSADOR_DISCOUNT_PERCENT}% pour tes inscrits ({discounted} USD)
        </p>
        <p className="mt-1">
          +{AMBASSADOR_CASHBACK_USD} USD cashback par paiement confirmé
        </p>
        <p className="mt-2 text-xs text-[#5c6b60]">Compte : {initialEmail}</p>
      </div>

      {err ? (
        <p className="text-sm font-medium text-red-700" role="alert">
          {err}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-[#1F6B43] px-4 py-3.5 text-sm font-bold text-white transition hover:bg-[#185535] disabled:opacity-60"
      >
        {busy ? "Création…" : "Créer mon code"}
      </button>
    </form>
  );
}
