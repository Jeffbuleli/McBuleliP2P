"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  authBtnSecondaryClass,
  authErrorClass,
  authInputClass,
  authLabelClass,
} from "@/components/auth/auth-marketing-shell";

type Copy = {
  title: string;
  intro: string;
  webinar: string;
  schedule: string;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  level: string;
  levelBeginner: string;
  levelIntermediate: string;
  levelAdvanced: string;
  interests: string;
  interestCrypto: string;
  interestTrading: string;
  interestIa: string;
  interestP2p: string;
  whatsapp: string;
  submit: string;
  success: string;
  successDup: string;
  error: string;
  errorDb: string;
  accountTitle: string;
  accountBody: string;
  accountCta: string;
  accountLogin: string;
};

const COPY: Record<"fr" | "en", Copy> = {
  fr: {
    title: "Formation gratuite McBuleli",
    intro:
      "Inscrivez-vous pour le lancement et les sessions du 15 au 30 juin (chaque samedi 18h30-20h00, GMT+1).",
    webinar: "Soirée de lancement : 8 juin 2026 à 19h (GMT+1)",
    schedule: "Crypto · Trading · IA · P2P - powered by McBuleli",
    fullName: "Nom complet",
    email: "E-mail",
    phone: "WhatsApp / téléphone",
    city: "Ville (optionnel)",
    level: "Niveau",
    levelBeginner: "Débutant",
    levelIntermediate: "Intermédiaire",
    levelAdvanced: "Avancé",
    interests: "Thèmes qui vous intéressent",
    interestCrypto: "Crypto",
    interestTrading: "Trading",
    interestIa: "IA",
    interestP2p: "P2P",
    whatsapp: "Me rappeler sur WhatsApp",
    submit: "Confirmer mon inscription",
    success: "Inscription enregistrée. À très bientôt !",
    successDup: "Vous êtes déjà inscrit avec cet e-mail.",
    error: "Impossible d'enregistrer. Réessayez ou contactez hi@mcbuleli.org",
    errorDb: "Inscriptions temporairement indisponibles (mise à jour serveur). Réessayez dans quelques minutes.",
    accountTitle: "Créez votre compte McBuleli gratuit",
    accountBody:
      "Utilisez le même e-mail pour rejoindre les lives, le chat de cohorte et les badges dans l'app.",
    accountCta: "Créer mon compte",
    accountLogin: "J'ai déjà un compte - me connecter",
  },
  en: {
    title: "Free McBuleli training",
    intro:
      "Register for the launch and sessions from 15-30 June (every Saturday 6:30-8:00 PM GMT+1).",
    webinar: "Launch session: 8 June 2026 at 7 PM (GMT+1)",
    schedule: "Crypto · Trading · AI · P2P - powered by McBuleli",
    fullName: "Full name",
    email: "Email",
    phone: "WhatsApp / phone",
    city: "City (optional)",
    level: "Level",
    levelBeginner: "Beginner",
    levelIntermediate: "Intermediate",
    levelAdvanced: "Advanced",
    interests: "Topics of interest",
    interestCrypto: "Crypto",
    interestTrading: "Trading",
    interestIa: "AI",
    interestP2p: "P2P",
    whatsapp: "Remind me on WhatsApp",
    submit: "Confirm registration",
    success: "You're registered. See you soon!",
    successDup: "This email is already registered.",
    error: "Could not save. Try again or email hi@mcbuleli.org",
    errorDb:
      "Registration is temporarily unavailable (server update). Try again in a few minutes.",
    accountTitle: "Create your free McBuleli account",
    accountBody:
      "Use the same email to join live sessions, cohort chat and badges in the app.",
    accountCta: "Create my account",
    accountLogin: "I already have an account - sign in",
  },
};

const labelClass = `${authLabelClass} text-xs font-bold text-stone-400`;

export function FormationRegisterForm({
  locale,
  isLoggedIn = false,
}: {
  locale: "fr" | "en";
  isLoggedIn?: boolean;
}) {
  const c = COPY[locale];
  const search = useSearchParams();
  const [status, setStatus] = useState<"idle" | "ok" | "dup" | "err" | "db">("idle");
  const [loading, setLoading] = useState(false);
  const [interests, setInterests] = useState<string[]>([]);
  const [submittedEmail, setSubmittedEmail] = useState("");

  function toggleInterest(v: string) {
    setInterests((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v],
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setStatus("idle");
    const fd = new FormData(e.currentTarget);
    const body = {
      fullName: String(fd.get("fullName") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      city: String(fd.get("city") ?? "") || undefined,
      locale,
      experienceLevel: String(fd.get("experienceLevel") ?? "") || undefined,
      interests,
      whatsappOptIn: fd.get("whatsappOptIn") === "on",
      utmSource: search.get("utm_source") ?? undefined,
      utmMedium: search.get("utm_medium") ?? undefined,
      utmCampaign: search.get("utm_campaign") ?? undefined,
    };

    try {
      const res = await fetch("/api/training/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus(
          res.status === 503 && j.error === "academy_db_not_migrated" ? "db" : "err",
        );
        return;
      }
      const email = body.email.trim().toLowerCase();
      setSubmittedEmail(email);
      setStatus(j.duplicate ? "dup" : "ok");
    } catch {
      setStatus("err");
    } finally {
      setLoading(false);
    }
  }

  const interestOpts = [
    { v: "crypto", label: c.interestCrypto },
    { v: "trading", label: c.interestTrading },
    { v: "ia", label: c.interestIa },
    { v: "p2p", label: c.interestP2p },
  ] as const;

  return (
    <form onSubmit={onSubmit} className="auth-form mt-6 space-y-4">
      <label className={labelClass}>
        {c.fullName}
        <input name="fullName" required className={authInputClass} />
      </label>
      <label className={labelClass}>
        {c.email}
        <input name="email" type="email" required className={authInputClass} />
      </label>
      <label className={labelClass}>
        {c.phone}
        <input name="phone" type="tel" required className={authInputClass} />
      </label>
      <label className={labelClass}>
        {c.city}
        <input name="city" className={authInputClass} />
      </label>
      <label className={labelClass}>
        {c.level}
        <select name="experienceLevel" className={authInputClass}>
          <option value="">-</option>
          <option value="beginner">{c.levelBeginner}</option>
          <option value="intermediate">{c.levelIntermediate}</option>
          <option value="advanced">{c.levelAdvanced}</option>
        </select>
      </label>
      <fieldset>
        <legend className="text-xs font-bold text-stone-400">{c.interests}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {interestOpts.map(({ v, label }) => (
            <button
              key={v}
              type="button"
              onClick={() => toggleInterest(v)}
              className={`rounded-full px-3 py-1 text-xs font-bold ring-1 transition ${
                interests.includes(v)
                  ? "bg-emerald-500/15 text-emerald-300 ring-emerald-400/35"
                  : "bg-white/[0.03] text-stone-300 ring-white/12 hover:ring-cyan-500/25"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>
      <label className="flex items-center gap-2 text-sm text-stone-400">
        <input
          name="whatsappOptIn"
          type="checkbox"
          defaultChecked
          className="rounded border-white/20 bg-[#050810] text-emerald-500"
        />
        <span>{c.whatsapp}</span>
      </label>
      <button
        type="submit"
        disabled={loading}
        className="auth-btn-primary w-full rounded-xl py-3 text-sm font-extrabold disabled:opacity-60"
      >
        {loading ? "…" : c.submit}
      </button>
      {status === "ok" || status === "dup" ? (
        <div className="space-y-3">
          <p
            className={`rounded-xl px-3 py-2 text-sm font-semibold ${
              status === "ok"
                ? "border border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
                : "border border-amber-500/25 bg-amber-500/10 text-amber-200"
            }`}
          >
            {status === "ok" ? c.success : c.successDup}
          </p>
          {!isLoggedIn && submittedEmail ? (
            <div className="border border-emerald-500/25 bg-emerald-500/8 p-4">
              <p className="text-sm font-extrabold text-emerald-300">{c.accountTitle}</p>
              <p className="mt-1 text-xs leading-relaxed text-stone-400">{c.accountBody}</p>
              <p className="mt-2 font-mono text-[10px] text-stone-500">{submittedEmail}</p>
              <div className="mt-3 flex flex-col gap-2">
                <Link
                  href={`/register?email=${encodeURIComponent(submittedEmail)}&next=${encodeURIComponent("/app/academy")}`}
                  className="inline-flex justify-center rounded-xl border border-emerald-400/35 bg-emerald-500/10 px-4 py-2.5 text-sm font-extrabold text-emerald-300"
                >
                  {c.accountCta} →
                </Link>
                <Link
                  href={`/login?email=${encodeURIComponent(submittedEmail)}&next=${encodeURIComponent("/app/academy")}`}
                  className={`text-center ${authBtnSecondaryClass} min-h-[44px] text-xs`}
                >
                  {c.accountLogin}
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
      {status === "err" || status === "db" ? (
        <p className={authErrorClass}>{status === "db" ? c.errorDb : c.error}</p>
      ) : null}
    </form>
  );
}
