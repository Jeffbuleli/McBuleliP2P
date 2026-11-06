"use client";

import Link from "next/link";
import { useState } from "react";
import { useCitizenLocale } from "@/hooks/use-citizen-locale";

type Option = { id: string; label: string };

type Question = {
  key: "concern" | "firstHelp" | "alertUseful" | "communityNeed";
  prompt: string;
  options: Option[];
};

const FR: Question[] = [
  {
    key: "concern",
    prompt: "Qu'est-ce qui vous préoccupe le plus, aujourd'hui ?",
    options: [
      { id: "home", label: "Violence à la maison" },
      { id: "vbg", label: "Violence sexuelle ou VBG" },
      { id: "child", label: "Sécurité d'un enfant" },
      { id: "street", label: "Insécurité dans le quartier" },
      { id: "harassment", label: "Harcèlement" },
      { id: "other", label: "Autre" },
    ],
  },
  {
    key: "firstHelp",
    prompt: "Si un danger arrivait maintenant, vers qui iriez-vous d'abord ?",
    options: [
      { id: "family", label: "La famille" },
      { id: "health", label: "Un service de santé" },
      { id: "police", label: "La police" },
      { id: "org", label: "Une organisation" },
      { id: "ngemba", label: "Ngemba" },
      { id: "unknown", label: "Je ne sais pas" },
    ],
  },
  {
    key: "alertUseful",
    prompt: "Un bouton d'alerte comme SOS vous serait-il utile ?",
    options: [
      { id: "yes", label: "Oui" },
      { id: "not_yet", label: "Pas encore" },
      { id: "unknown", label: "Je ne sais pas" },
    ],
  },
  {
    key: "communityNeed",
    prompt: "Qu'est-ce qui aiderait le plus votre communauté ?",
    options: [
      { id: "listen", label: "Être écouté" },
      { id: "orient", label: "Être orienté vers un service" },
      { id: "alert", label: "Alerter vite si c'est grave" },
      { id: "rights", label: "Comprendre ses droits" },
      { id: "anonymous", label: "Parler sans donner son nom" },
    ],
  },
];

const EN: Question[] = [
  {
    key: "concern",
    prompt: "What worries you most today?",
    options: [
      { id: "home", label: "Violence at home" },
      { id: "vbg", label: "Sexual or gender-based violence" },
      { id: "child", label: "A child's safety" },
      { id: "street", label: "Insecurity in the neighbourhood" },
      { id: "harassment", label: "Harassment" },
      { id: "other", label: "Other" },
    ],
  },
  {
    key: "firstHelp",
    prompt: "If danger happened now, who would you go to first?",
    options: [
      { id: "family", label: "Family" },
      { id: "health", label: "A health service" },
      { id: "police", label: "The police" },
      { id: "org", label: "An organisation" },
      { id: "ngemba", label: "Ngemba" },
      { id: "unknown", label: "I don't know" },
    ],
  },
  {
    key: "alertUseful",
    prompt: "Would an alert button like SOS be useful to you?",
    options: [
      { id: "yes", label: "Yes" },
      { id: "not_yet", label: "Not yet" },
      { id: "unknown", label: "I don't know" },
    ],
  },
  {
    key: "communityNeed",
    prompt: "What would help your community most?",
    options: [
      { id: "listen", label: "Being listened to" },
      { id: "orient", label: "Being guided to a service" },
      { id: "alert", label: "A fast alert when it is serious" },
      { id: "rights", label: "Understanding one's rights" },
      { id: "anonymous", label: "Speaking without giving a name" },
    ],
  },
];

export function CommunitySurvey({ initialLocale }: { initialLocale?: string }) {
  const { href, locale } = useCitizenLocale(initialLocale);
  const en = locale === "en";
  const questions = en ? EN : FR;
  const [picked, setPicked] = useState<Record<string, string>>({});
  const [place, setPlace] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          concern: picked.concern ?? null,
          firstHelp: picked.firstHelp ?? null,
          alertUseful: picked.alertUseful ?? null,
          communityNeed: picked.communityNeed ?? null,
          place,
          note,
        }),
      });
      if (!res.ok) {
        setError(en ? "Could not save. You can try again." : "Enregistrement impossible. Vous pouvez réessayer.");
        return;
      }
      setDone(true);
    } catch {
      setError(en ? "Connection interrupted." : "Connexion interrompue.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 py-5 sm:max-w-xl">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-bold text-ng-text">{en ? "Survey" : "Enquête"}</p>
          <p className="mt-1 text-sm leading-relaxed text-ng-muted">
            {en
              ? "Answer when you want. Skip any question. This is not an alert. It helps Ngemba understand community needs."
              : "Répondez quand vous voulez. Vous pouvez passer une question. Ce n'est pas une alerte. Cela aide Ngemba à comprendre les besoins de la communauté."}
          </p>
        </div>
        <Link href={href("/")} className="shrink-0 text-sm font-semibold text-ng-muted">
          {en ? "Close" : "Fermer"}
        </Link>
      </header>

      {done ? (
        <section className="rounded-2xl border border-black/10 bg-white p-4">
          <p className="text-sm font-semibold text-ng-text">
            {en ? "Thank you. Your answers are saved." : "Merci. Vos réponses sont enregistrées."}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ng-muted">
            {en
              ? "They help improve services and advocacy. If you are in danger now, use SOS."
              : "Elles servent à améliorer les services et les plaidoyers. Si vous êtes en danger maintenant, utilisez SOS."}
          </p>
          <Link
            href={href("/sos")}
            className="mt-4 inline-flex rounded-full bg-ng-urgent px-4 py-2 text-sm font-bold text-white"
          >
            SOS
          </Link>
        </section>
      ) : (
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          {questions.map((question) => (
            <fieldset key={question.key} className="space-y-2">
              <legend className="text-sm font-semibold text-ng-text">{question.prompt}</legend>
              <div className="flex flex-wrap gap-2">
                {question.options.map((option) => {
                  const on = picked[question.key] === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() =>
                        setPicked((prev) => ({
                          ...prev,
                          [question.key]: prev[question.key] === option.id ? "" : option.id,
                        }))
                      }
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                        on
                          ? "border-ng-primary bg-ng-primary text-white"
                          : "border-black/10 bg-white text-ng-text"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}

          <label className="block space-y-1">
            <span className="text-sm font-semibold text-ng-text">
              {en ? "City or commune, optional, no exact address" : "Ville ou commune, facultatif, sans adresse précise"}
            </span>
            <input
              value={place}
              onChange={(event) => setPlace(event.target.value)}
              maxLength={80}
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-semibold text-ng-text">
              {en ? "A few words, optional" : "Quelques mots, facultatif"}
            </span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={400}
              rows={3}
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
            />
          </label>

          {error ? <p className="text-sm font-medium text-ng-urgent">{error}</p> : null}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-ng-primary px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {busy ? (en ? "Sending..." : "Envoi...") : en ? "Send my answers" : "Envoyer mes réponses"}
          </button>
          <p className="text-center text-xs text-ng-muted">
            {en
              ? "If you are in danger now, this form is not the right place."
              : "Si vous êtes en danger maintenant, ce formulaire n'est pas le bon endroit."}{" "}
            <Link href={href("/sos")} className="font-semibold text-ng-urgent">
              SOS
            </Link>
          </p>
        </form>
      )}
    </main>
  );
}
