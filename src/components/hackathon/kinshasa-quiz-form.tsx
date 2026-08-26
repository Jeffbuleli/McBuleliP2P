"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  HkBtn,
  HkInput,
  HkSection,
  HkShell,
  HkStatusPill,
  useHkLocale,
} from "@/components/hackathon/hk-ui";
import { HackathonAtmosphere } from "@/components/hackathon/hackathon-atmosphere";
import { fetchWithDeadline } from "@/lib/fetch-with-deadline";
import {
  isValidCodMsisdn,
  normalizeCodPhoneNumber,
} from "@/lib/freshpay/normalize-phone";
import { hackathonFeaturedPartners } from "@/lib/hackathon/event-content";
import {
  partnerLogoBadgeBox,
  partnerLogoTileStyles,
} from "@/lib/hackathon/partner-logo-display";
import { BRAND_LOGO_256 } from "@/lib/brand-logo";
import {
  SUPPORT_EMAIL,
  SUPPORT_WA_PATH,
  SUPPORT_X,
} from "@/lib/support-contact";

/** Keep in sync with KINSHASA_QUIZ_MINUTES (server). */
const QUIZ_MINUTES = 9;
const QUIZ_MS = QUIZ_MINUTES * 60 * 1000;

function formatChrono(msLeft: number): string {
  const s = Math.max(0, Math.ceil(msLeft / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

type QuizQuestion = {
  id: string;
  promptFr: string;
  optionsFr: string[];
};

type StatusPayload = {
  closed: boolean;
  claimed: number;
  remaining: number;
  cap: number;
  passPercent: number;
  questionCount: number;
  quizMinutes?: number;
};

type SubmitResult =
  | {
      ok: true;
      passed: true;
      percent: number;
      correct: number;
      total: number;
      ticketCode: string;
      ticketUrl: string;
      message: string;
    }
  | {
      ok: false;
      passed: false;
      percent: number;
      correct: number;
      total: number;
      passPercent: number;
      message: string;
    };

function KinshasaPartnerLogos({ isFr }: { isFr: boolean }) {
  const logos = hackathonFeaturedPartners().slice(0, 10);
  return (
    <div className="mt-8 border-t border-[color:var(--hk-border)] pt-6">
      <p className="text-center text-[10px] font-extrabold uppercase tracking-[0.18em] text-[color:var(--hk-accent)]">
        {isFr ? "Nos partenaires" : "Our partners"}
      </p>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        {logos.map((logo) => {
          const styles = partnerLogoTileStyles(logo, "badge");
          return (
            <div
              key={logo.id}
              className={`flex h-10 items-center justify-center overflow-hidden rounded-xl ${styles.tile} ${partnerLogoBadgeBox(logo)}`}
              title={logo.name}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logo.logoUrl} alt={logo.name} className={styles.img} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KinshasaTicketFooter() {
  return (
    <div className="relative mt-10 overflow-hidden rounded-2xl bg-[#1F6B43] px-5 py-4 text-white">
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-25"
        viewBox="0 0 400 88"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M0 40c40-16 80 16 120 0s80-16 120 0 80 16 120 0 40-10 40-10v58H0z"
          fill="#14532D"
        />
      </svg>
      <div className="relative flex flex-col items-center gap-2.5 text-center">
        <p className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11px] font-semibold text-white/90">
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="hover:text-white"
          >
            {SUPPORT_EMAIL}
          </a>
          <span className="opacity-50" aria-hidden>
            |
          </span>
          <a
            href={SUPPORT_WA_PATH}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white"
          >
            WhatsApp
          </a>
        </p>
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
            className="h-[22px] w-[22px] rounded-full bg-white p-0.5 ring-1 ring-white/30"
          />
          <span className="font-extrabold">McBuleli</span>
        </a>
      </div>
    </div>
  );
}

export function KinshasaQuizForm({
  utmSource,
}: {
  utmSource?: string | null;
}) {
  const isFr = useHkLocale();
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("243");
  const [city, setCity] = useState("Kinshasa");
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced">(
    "beginner",
  );
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [attemptToken, setAttemptToken] = useState<string | null>(null);
  const [qIndex, setQIndex] = useState(0);
  const [choices, setChoices] = useState<Record<string, number>>({});
  const [step, setStep] = useState<"form" | "quiz" | "done">("form");
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [msLeft, setMsLeft] = useState(QUIZ_MS);
  const quizActiveRef = useRef(false);
  const submittingRef = useRef(false);
  const submitQuizRef = useRef<(timedOut?: boolean) => Promise<void>>(
    async () => {},
  );

  useEffect(() => {
    quizActiveRef.current = step === "quiz";
  }, [step]);

  useEffect(() => {
    if (step !== "quiz" || !endsAt) {
      setMsLeft(QUIZ_MS);
      return;
    }
    const tick = () => {
      const left = endsAt - Date.now();
      setMsLeft(left);
      if (left <= 0 && quizActiveRef.current && !submittingRef.current) {
        void submitQuizRef.current(true);
      }
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [step, endsAt]);

  const cancelQuizForLeave = useCallback(() => {
    if (!quizActiveRef.current) return;
    quizActiveRef.current = false;
    setStep("form");
    setQuestions([]);
    setAttemptToken(null);
    setChoices({});
    setQIndex(0);
    setEndsAt(null);
    setErr(
      isFr
        ? "Candidature annulée : ne quittez pas l'onglet actif pendant le quiz."
        : "Application cancelled: do not leave the active tab during the quiz.",
    );
  }, [isFr]);

  useEffect(() => {
    if (step !== "quiz") return;
    const onVis = () => {
      if (document.visibilityState === "hidden") cancelQuizForLeave();
    };
    const onPageHide = () => cancelQuizForLeave();
    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [step, cancelQuizForLeave]);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await fetchWithDeadline(
        "/api/hackathon/promo/kinshasa",
        { cache: "no-store" },
        20_000,
      );
      const j = (await res.json().catch(() => ({}))) as StatusPayload & {
        error?: string;
      };
      if (!res.ok) {
        setLoadError(
          isFr
            ? "Impossible de charger le quiz."
            : "Could not load the quiz.",
        );
        return;
      }
      setStatus(j);
    } catch {
      setLoadError(isFr ? "Réseau indisponible." : "Network unavailable.");
    }
  }, [isFr]);

  useEffect(() => {
    void load();
  }, [load]);

  async function goQuiz() {
    setErr(null);
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setErr(
        isFr
          ? "Renseignez prénom, nom et e-mail."
          : "Enter first name, last name and email.",
      );
      return;
    }
    const n = normalizeCodPhoneNumber(phone);
    if (!isValidCodMsisdn(n)) {
      setErr(
        isFr
          ? "Téléphone invalide (ex. 2438XXXXXXXX)."
          : "Invalid phone (e.g. 2438XXXXXXXX).",
      );
      return;
    }
    setStarting(true);
    try {
      const res = await fetchWithDeadline(
        "/api/hackathon/promo/kinshasa",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "start",
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            phone: n,
            city: city.trim() || undefined,
            level,
            locale: isFr ? "fr" : "en",
            utmSource: utmSource || undefined,
          }),
        },
        30_000,
      );
      const j = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        questions?: QuizQuestion[];
        attemptToken?: string;
        message?: string;
        error?: string;
      };
      if (!res.ok || !j.ok || !j.questions?.length || !j.attemptToken) {
        setErr(
          typeof j.message === "string"
            ? j.message
            : isFr
              ? "Impossible de démarrer le quiz."
              : "Could not start the quiz.",
        );
        if (j.error === "quota_full" || j.error === "blacklisted") void load();
        return;
      }
      setQuestions(j.questions);
      setAttemptToken(j.attemptToken);
      setChoices({});
      setQIndex(0);
      setEndsAt(Date.now() + QUIZ_MS);
      setMsLeft(QUIZ_MS);
      setStep("quiz");
    } finally {
      setStarting(false);
    }
  }

  const submitQuiz = useCallback(
    async (timedOut = false) => {
      if (!questions.length || !attemptToken) return;
      if (submittingRef.current) return;
      setErr(null);
      if (!timedOut) {
        const unanswered = questions.some(
          (q) => choices[q.id] === undefined,
        );
        if (unanswered) {
          setErr(
            isFr
              ? "Répondez à toutes les questions."
              : "Answer all questions.",
          );
          return;
        }
      }
      submittingRef.current = true;
      setSubmitting(true);
      quizActiveRef.current = false;
      try {
        const answers = questions.map((q) => ({
          questionId: q.id,
          // Unanswered on timeout → last option (usually wrong).
          choiceIndex:
            choices[q.id] !== undefined ? choices[q.id]! : 2,
        }));
        const res = await fetchWithDeadline(
          "/api/hackathon/promo/kinshasa",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "submit",
              attemptToken,
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              email: email.trim(),
              phone: normalizeCodPhoneNumber(phone),
              city: city.trim() || undefined,
              level,
              locale: isFr ? "fr" : "en",
              utmSource: utmSource || undefined,
              answers,
            }),
          },
          30_000,
        );
        const j = (await res.json().catch(() => ({}))) as SubmitResult & {
          error?: string;
          message?: string;
        };
        if (!res.ok) {
          setErr(
            typeof j.message === "string"
              ? j.message
              : isFr
                ? "Échec de l'envoi."
                : "Submit failed.",
          );
          setStep("form");
          setEndsAt(null);
          if (j.error === "quota_full" || j.error === "blacklisted") {
            void load();
          }
          return;
        }
        if ("passed" in j && j.passed === false) {
          setResult({
            ...j,
            message: timedOut
              ? isFr
                ? `Temps écoulé (9 min). ${j.message}`
                : `Time is up (9 min). ${j.message}`
              : j.message,
          });
          setStep("done");
          setEndsAt(null);
          void load();
          return;
        }
        if ("ok" in j && j.ok && j.passed) {
          setResult(j);
          setStep("done");
          setEndsAt(null);
          void load();
          return;
        }
        setErr(isFr ? "Réponse inattendue." : "Unexpected response.");
      } finally {
        submittingRef.current = false;
        setSubmitting(false);
      }
    },
    [
      questions,
      attemptToken,
      choices,
      firstName,
      lastName,
      email,
      phone,
      city,
      level,
      isFr,
      utmSource,
      load,
    ],
  );

  useEffect(() => {
    submitQuizRef.current = submitQuiz;
  }, [submitQuiz]);

  const current = questions[qIndex];
  const isLast = qIndex >= questions.length - 1;
  const quizMinutes = status?.quizMinutes ?? QUIZ_MINUTES;
  const chronoUrgent = msLeft <= 60_000;

  return (
    <HkShell authReturnPath="/hackathon/promo/kinshasa">
      <HackathonAtmosphere variant="page" />
      <main className="relative mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[color:var(--hk-accent)]">
              Promo · KINSHASA
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-[color:var(--hk-text)] sm:text-4xl">
              {isFr
                ? "Place gratuite - quiz informatique"
                : "Free seat - IT quiz"}
            </h1>
            {step === "form" ? (
              <div className="mt-3 max-w-xl space-y-3 text-sm leading-relaxed text-[color:var(--hk-muted)]">
                <p>
                  {isFr
                    ? "Quiz de bases en informatique et programmation avant le hackathon : 10 questions à choix (3 options), une par une. Réussite à 70 % (7/10)."
                    : "Basic IT and programming quiz before the hackathon: 10 multiple-choice questions (3 options), one at a time. Pass at 70% (7/10)."}
                </p>
                <ul className="space-y-1.5 rounded-2xl bg-[color:var(--hk-soft)]/80 px-4 py-3 text-[13px] ring-1 ring-[color:var(--hk-border)]">
                  <li>
                    {isFr
                      ? `Chrono : ${quizMinutes} minutes pour répondre aux 10 questions.`
                      : `Timer: ${quizMinutes} minutes to answer all 10 questions.`}
                  </li>
                  <li>
                    {isFr
                      ? "Restez sur cet onglet après « Continuer vers le quiz » - le quitter annule la candidature."
                      : "Stay on this tab after “Continue to quiz” - leaving cancels your application."}
                  </li>
                  <li>
                    {isFr
                      ? "Une seule tentative par e-mail et téléphone. Le résultat (ticket ou échec) arrive par e-mail."
                      : "One attempt per email and phone. The result (ticket or fail) arrives by email."}
                  </li>
                  <li>
                    {isFr
                      ? "Places limitées (10) - le lien se ferme quand le quota est atteint."
                      : "Limited seats (10) - the link closes when the quota is reached."}
                  </li>
                </ul>
              </div>
            ) : null}
          </div>
          {status ? (
            <HkStatusPill tone={status.closed ? "danger" : "ok"}>
              {status.closed
                ? isFr
                  ? "Clôturé"
                  : "Closed"
                : isFr
                  ? `${status.remaining} / ${status.cap} places`
                  : `${status.remaining} / ${status.cap} seats`}
            </HkStatusPill>
          ) : null}
        </div>

        <div className="mt-8 space-y-5">
          {loadError ? (
            <HkSection title={isFr ? "Erreur" : "Error"}>
              <p className="text-sm text-[color:var(--hk-muted)]">{loadError}</p>
              <HkBtn onClick={() => void load()}>
                {isFr ? "Réessayer" : "Retry"}
              </HkBtn>
            </HkSection>
          ) : null}

          {!status ? (
            <p className="text-sm text-[color:var(--hk-muted)]">…</p>
          ) : status.closed ? (
            <HkSection title={isFr ? "Campagne clôturée" : "Campaign closed"}>
              <p className="text-sm text-[color:var(--hk-muted)]">
                {isFr
                  ? "Les places Kinshasa sont prises."
                  : "Kinshasa seats are taken."}
              </p>
              <Link
                href="/hackathon"
                className="text-sm font-bold text-[color:var(--hk-accent)] hover:underline"
              >
                {isFr ? "Inscription payante →" : "Paid registration →"}
              </Link>
            </HkSection>
          ) : step === "done" && result ? (
            <HkSection
              title={
                result.passed
                  ? isFr
                    ? "Quiz réussi"
                    : "Quiz passed"
                  : isFr
                    ? "Score insuffisant"
                    : "Score too low"
              }
            >
              <p className="text-sm leading-relaxed text-[color:var(--hk-muted)]">
                {result.message}
              </p>
              <p className="text-sm font-bold text-[color:var(--hk-text)]">
                {result.correct}/{result.total} · {result.percent} %
              </p>
              {result.passed && "ticketUrl" in result ? (
                <a
                  href={result.ticketUrl}
                  className="inline-flex rounded-xl bg-[#1F6B43] px-4 py-3 text-sm font-bold text-white"
                >
                  {isFr ? "Ouvrir mon ticket" : "Open my ticket"}
                </a>
              ) : null}
            </HkSection>
          ) : step === "form" ? (
            <HkSection
              title={isFr ? "Vos coordonnées" : "Your details"}
              hint={
                isFr
                  ? "Puis le quiz, question par question."
                  : "Then the quiz, one question at a time."
              }
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-bold uppercase tracking-wide text-[color:var(--hk-muted)]">
                  {isFr ? "Prénom" : "First name"}
                  <HkInput
                    className="mt-1"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    autoComplete="given-name"
                  />
                </label>
                <label className="block text-xs font-bold uppercase tracking-wide text-[color:var(--hk-muted)]">
                  {isFr ? "Nom" : "Last name"}
                  <HkInput
                    className="mt-1"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    autoComplete="family-name"
                  />
                </label>
              </div>
              <label className="block text-xs font-bold uppercase tracking-wide text-[color:var(--hk-muted)]">
                Email
                <HkInput
                  className="mt-1"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </label>
              <label className="block text-xs font-bold uppercase tracking-wide text-[color:var(--hk-muted)]">
                {isFr ? "Téléphone (243…)" : "Phone (243…)"}
                <HkInput
                  className="mt-1"
                  value={phone}
                  onChange={(e) =>
                    setPhone(
                      normalizeCodPhoneNumber(e.target.value) || e.target.value,
                    )
                  }
                  inputMode="tel"
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-bold uppercase tracking-wide text-[color:var(--hk-muted)]">
                  {isFr ? "Ville" : "City"}
                  <HkInput
                    className="mt-1"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </label>
                <label className="block text-xs font-bold uppercase tracking-wide text-[color:var(--hk-muted)]">
                  {isFr ? "Niveau" : "Level"}
                  <select
                    className="mt-1 w-full rounded-xl border border-[color:var(--hk-border)] bg-[color:var(--hk-page)] px-3.5 py-3 text-sm font-medium"
                    value={level}
                    onChange={(e) =>
                      setLevel(
                        e.target.value as
                          | "beginner"
                          | "intermediate"
                          | "advanced",
                      )
                    }
                  >
                    <option value="beginner">
                      {isFr ? "Débutant" : "Beginner"}
                    </option>
                    <option value="intermediate">
                      {isFr ? "Intermédiaire" : "Intermediate"}
                    </option>
                    <option value="advanced">
                      {isFr ? "Avancé" : "Advanced"}
                    </option>
                  </select>
                </label>
              </div>
              {err ? (
                <p className="text-sm font-medium text-red-600">{err}</p>
              ) : null}
              <HkBtn disabled={starting} onClick={() => void goQuiz()}>
                {starting
                  ? isFr
                    ? "Préparation…"
                    : "Preparing…"
                  : isFr
                    ? "Continuer vers le quiz →"
                    : "Continue to quiz →"}
              </HkBtn>
            </HkSection>
          ) : current ? (
            <HkSection
              title={
                isFr
                  ? `Question ${qIndex + 1} / ${questions.length}`
                  : `Question ${qIndex + 1} / ${questions.length}`
              }
              hint={
                isFr
                  ? `Réussite ≥ ${status.passPercent} % · restez sur cet onglet`
                  : `Pass ≥ ${status.passPercent}% · stay on this tab`
              }
              action={
                <div
                  className={`rounded-xl px-3 py-2 font-mono text-lg font-black tracking-wide tabular-nums ${
                    chronoUrgent
                      ? "bg-red-500/15 text-red-700"
                      : "bg-[#1F6B43]/10 text-[#1F6B43]"
                  }`}
                  aria-live="polite"
                >
                  {formatChrono(msLeft)}
                </div>
              }
            >
              <p className="text-xs text-[color:var(--hk-muted)]">
                {isFr
                  ? `${quizMinutes} min pour les 10 questions - le quiz est envoyé automatiquement à 0:00.`
                  : `${quizMinutes} min for 10 questions - auto-submit at 0:00.`}
              </p>
              <fieldset className="space-y-3">
                <legend className="text-base font-bold text-[color:var(--hk-text)]">
                  {current.promptFr}
                </legend>
                <div className="space-y-2">
                  {current.optionsFr.map((opt, oi) => {
                    const selected = choices[current.id] === oi;
                    return (
                      <button
                        key={`${current.id}-${oi}`}
                        type="button"
                        onClick={() =>
                          setChoices((prev) => ({
                            ...prev,
                            [current.id]: oi,
                          }))
                        }
                        className={`flex w-full items-start gap-3 rounded-xl px-3.5 py-3 text-left text-sm ring-1 transition ${
                          selected
                            ? "bg-[#1F6B43]/10 font-semibold ring-[#1F6B43]"
                            : "bg-[color:var(--hk-page)] ring-[color:var(--hk-border)] hover:bg-[color:var(--hk-soft)]"
                        }`}
                      >
                        <span
                          className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                            selected
                              ? "bg-[#1F6B43] text-white"
                              : "bg-[color:var(--hk-soft)] text-[color:var(--hk-muted)]"
                          }`}
                        >
                          {String.fromCharCode(65 + oi)}
                        </span>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
              {err ? (
                <p className="text-sm font-medium text-red-600">{err}</p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {qIndex > 0 ? (
                  <HkBtn
                    variant="secondary"
                    onClick={() => setQIndex((i) => Math.max(0, i - 1))}
                  >
                    {isFr ? "← Précédent" : "← Previous"}
                  </HkBtn>
                ) : null}
                {!isLast ? (
                  <HkBtn
                    disabled={choices[current.id] === undefined}
                    onClick={() => setQIndex((i) => i + 1)}
                  >
                    {isFr ? "Suivant →" : "Next →"}
                  </HkBtn>
                ) : (
                  <HkBtn
                    disabled={
                      submitting || choices[current.id] === undefined
                    }
                    onClick={() => void submitQuiz(false)}
                  >
                    {submitting
                      ? isFr
                        ? "Envoi…"
                        : "Submitting…"
                      : isFr
                        ? "Valider le quiz"
                        : "Submit quiz"}
                  </HkBtn>
                )}
              </div>
            </HkSection>
          ) : null}
        </div>

        {step === "form" || step === "done" ? (
          <KinshasaPartnerLogos isFr={isFr} />
        ) : null}
        {step === "quiz" ? <KinshasaTicketFooter /> : null}

        <p className="mt-8 text-center text-xs text-[color:var(--hk-muted)]">
          <Link
            href="/hackathon"
            className="font-semibold text-[color:var(--hk-accent)] hover:underline"
          >
            ← Hackathon
          </Link>
        </p>
      </main>
    </HkShell>
  );
}
