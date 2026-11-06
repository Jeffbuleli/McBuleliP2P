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

const LN: Question[] = [
  {
    key: "concern",
    prompt: "Nini ezali kopesa yo mawa lelo?",
    options: [
      { id: "home", label: "Likama na ndako" },
      { id: "vbg", label: "Likama ya nzoto to VBG" },
      { id: "child", label: "Kimia ya mwana" },
      { id: "street", label: "Likama na quartier" },
      { id: "harassment", label: "Kofinga" },
      { id: "other", label: "Mosusu" },
    ],
  },
  {
    key: "firstHelp",
    prompt: "Soki likama ekoki sikoyo, okokende liboso epai ya nani?",
    options: [
      { id: "family", label: "Libota" },
      { id: "health", label: "Esika ya monganga" },
      { id: "police", label: "Police" },
      { id: "org", label: "Organisation" },
      { id: "ngemba", label: "Ngemba" },
      { id: "unknown", label: "Nayebi te" },
    ],
  },
  {
    key: "alertUseful",
    prompt: "Bouton ya alerte lokola SOS ekosalisa yo?",
    options: [
      { id: "yes", label: "Iyo" },
      { id: "not_yet", label: "Naino te" },
      { id: "unknown", label: "Nayebi te" },
    ],
  },
  {
    key: "communityNeed",
    prompt: "Nini ekosalisa communauté na yo koleka?",
    options: [
      { id: "listen", label: "Koyoka yo" },
      { id: "orient", label: "Kotinda yo na esika ya lisalisi" },
      { id: "alert", label: "Kobenga noki soki ezali makasi" },
      { id: "rights", label: "Koyeba makoki na yo" },
      { id: "anonymous", label: "Koloba nkombo te" },
    ],
  },
];

const SW: Question[] = [
  {
    key: "concern",
    prompt: "Nini inakusumbua zaidi leo?",
    options: [
      { id: "home", label: "Vurugu nyumbani" },
      { id: "vbg", label: "Vurugu ya kingono au VBG" },
      { id: "child", label: "Usalama wa mtoto" },
      { id: "street", label: "Ukosefu wa usalama mtaani" },
      { id: "harassment", label: "Unyanyasaji" },
      { id: "other", label: "Nyingine" },
    ],
  },
  {
    key: "firstHelp",
    prompt: "Hatari ikitokea sasa, ungeenda kwa nani kwanza?",
    options: [
      { id: "family", label: "Familia" },
      { id: "health", label: "Huduma ya afya" },
      { id: "police", label: "Polisi" },
      { id: "org", label: "Shirika" },
      { id: "ngemba", label: "Ngemba" },
      { id: "unknown", label: "Sijui" },
    ],
  },
  {
    key: "alertUseful",
    prompt: "Kitufe cha tahadhari kama SOS kingekusaidia?",
    options: [
      { id: "yes", label: "Ndiyo" },
      { id: "not_yet", label: "Bado" },
      { id: "unknown", label: "Sijui" },
    ],
  },
  {
    key: "communityNeed",
    prompt: "Nini kingesaidia jamii yako zaidi?",
    options: [
      { id: "listen", label: "Kusikilizwa" },
      { id: "orient", label: "Kuelekezwa kwenye huduma" },
      { id: "alert", label: "Tahadhari ya haraka ikiwa ni hatari" },
      { id: "rights", label: "Kuelewa haki" },
      { id: "anonymous", label: "Kuongea bila kutoa jina" },
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
  const pack = locale === "en" ? EN : locale === "ln" ? LN : locale === "sw" ? SW : FR;
  const ui =
    locale === "en"
      ? {
          title: "Survey",
          intro: "Answer when you want. Skip any question. This is not an alert. It helps Ngemba understand community needs.",
          close: "Close",
          thanks: "Thank you. Your answers are saved.",
          thanksBody: "They help improve services and advocacy. If you are in danger now, use SOS.",
          place: "City or commune, optional, no exact address",
          note: "A few words, optional",
          send: "Send my answers",
          sending: "Sending...",
          fail: "Could not save. You can try again.",
          offline: "Connection interrupted.",
          danger: "If you are in danger now, this form is not the right place.",
        }
      : locale === "ln"
        ? {
            title: "Mituna",
            intro: "Yanola tango olingi. Okoki koleka motuna. Oyo ezali alerte te. Esungaka Ngemba ayeba bamposa ya communauté.",
            close: "Kanga",
            thanks: "Matondi. Biyanoli na yo ebombami.",
            thanksBody: "Esungaka kobongisa misala mpe plaidoyer. Soki likama ezali sikoyo, tinda SOS.",
            place: "Engumba to commune, soki olingi, adresse ya sikisiki te",
            note: "Maloba moke, soki olingi",
            send: "Tinda biyanoli",
            sending: "Kotinda...",
            fail: "Ebombami te. Meká lisusu.",
            offline: "Connexion ekati.",
            danger: "Soki likama ezali sikoyo, formulaire oyo ezali esika te.",
          }
        : locale === "sw"
          ? {
              title: "Utafiti",
              intro: "Jibu unapotaka. Unaweza kuruka swali. Hii si tahadhari. Inasaidia Ngemba kuelewa mahitaji ya jamii.",
              close: "Funga",
              thanks: "Asante. Majibu yako yamehifadhiwa.",
              thanksBody: "Yanasaidia kuboresha huduma na uhamasishaji. Ukiwa hatarini sasa, tumia SOS.",
              place: "Mji au commune, hiari, bila anwani kamili",
              note: "Maneno machache, hiari",
              send: "Tuma majibu",
              sending: "Inatumwa...",
              fail: "Imeshindwa kuhifadhi. Unaweza kujaribu tena.",
              offline: "Muunganisho umekatika.",
              danger: "Ukiwa hatarini sasa, fomu hii si mahali sahihi.",
            }
          : {
              title: "Enquête",
              intro: "Répondez quand vous voulez. Vous pouvez passer une question. Ce n'est pas une alerte. Cela aide Ngemba à comprendre les besoins de la communauté.",
              close: "Fermer",
              thanks: "Merci. Vos réponses sont enregistrées.",
              thanksBody: "Elles servent à améliorer les services et les plaidoyers. Si vous êtes en danger maintenant, utilisez SOS.",
              place: "Ville ou commune, facultatif, sans adresse précise",
              note: "Quelques mots, facultatif",
              send: "Envoyer mes réponses",
              sending: "Envoi...",
              fail: "Enregistrement impossible. Vous pouvez réessayer.",
              offline: "Connexion interrompue.",
              danger: "Si vous êtes en danger maintenant, ce formulaire n'est pas le bon endroit.",
            };
  const questions = pack;
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
        setError(ui.fail);
        return;
      }
      setDone(true);
    } catch {
      setError(ui.offline);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 py-5 sm:max-w-xl">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-bold text-ng-text">{ui.title}</p>
          <p className="mt-1 text-sm leading-relaxed text-ng-muted">{ui.intro}</p>
        </div>
        <Link href={href("/")} className="shrink-0 text-sm font-semibold text-ng-muted">
          {ui.close}
        </Link>
      </header>

      {done ? (
        <section className="rounded-2xl border border-black/10 bg-white p-4">
          <p className="text-sm font-semibold text-ng-text">{ui.thanks}</p>
          <p className="mt-2 text-sm leading-relaxed text-ng-muted">{ui.thanksBody}</p>
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
            <span className="text-sm font-semibold text-ng-text">{ui.place}</span>
            <input
              value={place}
              onChange={(event) => setPlace(event.target.value)}
              maxLength={80}
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-semibold text-ng-text">{ui.note}</span>
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
            {busy ? ui.sending : ui.send}
          </button>
          <p className="text-center text-xs text-ng-muted">
            {ui.danger}{" "}
            <Link href={href("/sos")} className="font-semibold text-ng-urgent">
              SOS
            </Link>
          </p>
        </form>
      )}
    </main>
  );
}
