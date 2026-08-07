"use client";

import { useMemo, useState, useTransition } from "react";
import {
  ACTION_OPTIONS,
  ACTIVITY_OPTIONS,
  AGE_OPTIONS,
  EMPLOYEES_OPTIONS,
  IMPACT_DOMAIN_OPTIONS,
  IMPACT_ORG_OPTIONS,
  LIKERT_ITEMS,
  OBSTACLE_ITEMS,
  OBSTACLE_LEVELS,
  REFORM_ITEMS,
  SECTION_META,
  SEX_OPTIONS,
  SURVEY_INTRO,
  YEARS_OPTIONS,
  YES_NO,
  YES_NO_UNCERTAIN,
  emptyRdpiAnswers,
  type RdpiSurveyAnswers,
} from "@/lib/rdpi/survey-questions";
import {
  RdpiIlluCheck,
  RdpiIlluDoc,
  RdpiIlluSunburst,
  RdpiSectionIllu,
} from "@/components/rdpi/rdpi-illustrations";

const TOTAL_STEPS = SECTION_META.length;

function SectionTitle({
  sectionId,
  children,
}: {
  sectionId: (typeof SECTION_META)[number]["id"];
  children: React.ReactNode;
}) {
  return (
    <div className="mb-1 flex items-start gap-3">
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#E5E5E0] bg-white shadow-sm">
        <RdpiSectionIllu sectionId={sectionId} className="h-10 w-10" />
      </span>
      <h2 className="pt-1 font-[family-name:var(--font-rdpi-display)] text-xl font-semibold leading-snug text-[#0c0a09]">
        {children}
      </h2>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-2.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-[#78716c]">
      {children}
    </label>
  );
}


function VisualCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[22px] border border-[#E5E5E0] bg-[#FAFAF8]/95 p-4 shadow-[0_18px_48px_-28px_rgba(34,34,34,0.45)] backdrop-blur-sm sm:p-5 ${className}`}
    >
      {children}
    </div>
  );
}

function ChoiceGrid({
  options,
  value,
  onChange,
  name,
}: {
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
  name: string;
}) {
  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      {options.map((opt) => {
        const active = value === opt;
        return (
          <label
            key={opt}
            className={`group relative flex cursor-pointer items-start gap-3 overflow-hidden rounded-2xl border px-3.5 py-3.5 text-sm transition ${
              active
                ? "border-[color:var(--rdpi-blue)] bg-[color:var(--rdpi-blue)]/[0.07] shadow-[0_0_0_1px_rgba(30,94,255,0.28)]"
                : "border-[#E5E5E0] bg-white hover:border-[#cfcfc8] hover:bg-[#FFFEFB]"
            }`}
          >
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
                active
                  ? "border-[color:var(--rdpi-blue)] bg-[color:var(--rdpi-blue)]"
                  : "border-[#d6d3d1] bg-white group-hover:border-[#a8a29e]"
              }`}
            >
              {active ? (
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
                  <circle cx="6" cy="6" r="2.5" fill="white" />
                </svg>
              ) : null}
            </span>
            <input
              type="radio"
              className="sr-only"
              name={name}
              checked={active}
              onChange={() => onChange(opt)}
            />
            <span className="leading-snug text-[#1c1917]">{opt}</span>
          </label>
        );
      })}
    </div>
  );
}

function MultiChoice({
  options,
  values,
  onChange,
}: {
  options: readonly string[];
  values: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      {options.map((opt) => {
        const active = values.includes(opt);
        return (
          <label
            key={opt}
            className={`group flex cursor-pointer items-start gap-3 rounded-2xl border px-3.5 py-3.5 text-sm transition ${
              active
                ? "border-[color:var(--rdpi-gold)] bg-[color:var(--rdpi-gold)]/[0.12] shadow-[0_0_0_1px_rgba(232,185,35,0.35)]"
                : "border-[#E5E5E0] bg-white hover:border-[#cfcfc8]"
            }`}
          >
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition ${
                active
                  ? "border-[color:var(--rdpi-gold)] bg-[color:var(--rdpi-gold)]"
                  : "border-[#d6d3d1] bg-white"
              }`}
            >
              {active ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                  <path
                    d="M2.5 6.2l2.4 2.4 4.6-5"
                    stroke="#0A0A0A"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : null}
            </span>
            <input
              type="checkbox"
              className="sr-only"
              checked={active}
              onChange={() => {
                onChange(
                  active ? values.filter((v) => v !== opt) : [...values, opt],
                );
              }}
            />
            <span className="leading-snug text-[#1c1917]">{opt}</span>
          </label>
        );
      })}
    </div>
  );
}

function ScaleRow({
  label,
  value,
  onChange,
  max = 5,
  labels,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  max?: number;
  labels?: readonly string[];
}) {
  return (
    <div className="rounded-2xl border border-[#E5E5E0] bg-white px-3.5 py-3.5 shadow-[0_10px_28px_-22px_rgba(34,34,34,0.45)] sm:px-4">
      <p className="mb-3 text-sm font-semibold leading-snug text-[#1c1917]">
        {label}
      </p>
      <div
        className={`grid gap-2 ${
          max >= 7
            ? "grid-cols-7"
            : "grid-cols-5 sm:flex sm:flex-wrap"
        }`}
      >
        {Array.from({ length: max }, (_, i) => i + 1).map((n) => {
          const active = value === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={`rounded-xl border py-2.5 text-sm font-bold tabular-nums transition sm:min-w-[2.75rem] sm:px-2.5 ${
                active
                  ? "border-[color:var(--rdpi-blue)] bg-[color:var(--rdpi-blue)] text-white shadow-[0_8px_20px_-10px_rgba(30,94,255,0.7)]"
                  : "border-[#E5E5E0] bg-[#FAFAF8] text-[#1c1917] hover:border-[color:var(--rdpi-blue)]/45"
              }`}
              aria-label={labels?.[n - 1] ?? String(n)}
              title={labels?.[n - 1] ?? String(n)}
            >
              {n}
            </button>
          );
        })}
      </div>
      {labels ? (
        <p className="mt-2.5 text-[11px] text-[#a8a29e]">
          1 = {labels[0]} - {max} = {labels[max - 1]}
        </p>
      ) : null}
    </div>
  );
}

function FieldCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-[#E5E5E0] bg-white p-4 shadow-[0_10px_28px_-22px_rgba(34,34,34,0.45)] ${className}`}
    >
      {children}
    </div>
  );
}

function TextInput(
  props: React.InputHTMLAttributes<HTMLInputElement> & { label: string },
) {
  const { label, className, ...rest } = props;
  return (
    <FieldCard>
      <FieldLabel>{label}</FieldLabel>
      <input
        {...rest}
        className={`mt-2 w-full rounded-xl border border-[#E5E5E0] bg-[#FAFAF8] px-4 py-3 text-sm text-[#1c1917] outline-none transition placeholder:text-[#a8a29e] focus:border-[color:var(--rdpi-blue)] focus:bg-white focus:ring-2 focus:ring-[color:var(--rdpi-blue)]/15 ${className ?? ""}`}
      />
    </FieldCard>
  );
}

function TextArea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string },
) {
  const { label, className, ...rest } = props;
  return (
    <FieldCard>
      <FieldLabel>{label}</FieldLabel>
      <textarea
        {...rest}
        className={`mt-2 min-h-[120px] w-full rounded-xl border border-[#E5E5E0] bg-[#FAFAF8] px-4 py-3 text-sm text-[#1c1917] outline-none transition placeholder:text-[#a8a29e] focus:border-[color:var(--rdpi-blue)] focus:bg-white focus:ring-2 focus:ring-[color:var(--rdpi-blue)]/15 ${className ?? ""}`}
      />
    </FieldCard>
  );
}

export function RdpiSurveyForm() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<RdpiSurveyAnswers>(() =>
    emptyRdpiAnswers(),
  );
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [accountInfo, setAccountInfo] = useState<{
    created: boolean;
    emailVerified: boolean;
    verificationSent: boolean;
  } | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [pending, startTransition] = useTransition();

  const progress = useMemo(() => {
    if (step === 0) return 0;
    return Math.round((step / TOTAL_STEPS) * 100);
  }, [step]);

  function patch(partial: Partial<RdpiSurveyAnswers>) {
    setAnswers((prev) => ({ ...prev, ...partial }));
    setError(null);
  }

  function validateStep(s: number): string | null {
    if (s === 1) {
      if (answers.fullName.trim().length < 2) return "Indiquez votre nom complet.";
      const email = answers.email.trim().toLowerCase();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return "Indiquez une adresse email valide (suivi RDPI).";
      }
      const phoneDigits = answers.phone.replace(/\D/g, "");
      if (phoneDigits.length < 9) {
        return "Indiquez un numéro WhatsApp / téléphone valide (ex. 0812… ou +243…).";
      }
      if (!answers.sex) return "Sélectionnez votre sexe.";
      if (!answers.age) return "Sélectionnez votre tranche d'âge.";
      if (!answers.province.trim()) return "Indiquez votre province.";
      if (!answers.activity) return "Sélectionnez votre activité principale.";
      if (answers.activity === "Autre" && !answers.activityOther.trim()) {
        return "Précisez votre activité.";
      }
      if (!answers.yearsActive || !answers.employees) {
        return "Complétez les informations sur votre activité.";
      }
    }
    if (s === 2) {
      for (const item of LIKERT_ITEMS) {
        const v = answers.likert[item.key] ?? 0;
        if (v < 1 || v > 5) return "Répondez à toutes les affirmations (échelle 1-5).";
      }
    }
    if (s === 3) {
      if (!answers.impactOrg) return "Indiquez l'impact sur votre organisation.";
      if (answers.impactDomain.length === 0) return "Sélectionnez au moins un domaine.";
      if (answers.actions.length === 0) return "Sélectionnez au moins une option.";
      if (!answers.consumerCost) return "Répondez à la question sur les coûts consommateurs.";
    }
    if (s === 4) {
      for (const item of OBSTACLE_ITEMS) {
        const v = answers.obstacles[item.key] ?? 0;
        if (v < 1 || v > 5) return "Classez tous les obstacles.";
      }
    }
    if (s === 5) {
      if (!answers.opportunityRegulation || !answers.threeRegimes) {
        return "Répondez aux deux questions d'opportunités.";
      }
    }
    if (s === 6) {
      const ranks = REFORM_ITEMS.map((r) => answers.reformRanks[r.key] ?? 0);
      if (ranks.some((r) => r < 1 || r > 7)) {
        return "Répondez à chaque réforme (1 à 7).";
      }
    }
    if (s === 7) {
      if (!answers.digitizePerception) {
        return "Répondez à la question sur la numérisation de la perception.";
      }
    }
    return null;
  }

  function next() {
    if (step > 0) {
      const err = validateStep(step);
      if (err) {
        setError(err);
        return;
      }
    }
    setError(null);
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(0, s - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function submit() {
    const err = validateStep(7);
    if (err) {
      setError(err);
      return;
    }
    startTransition(async () => {
      setError(null);
      const res = await fetch("/api/rdpi/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });
      const json = (await res.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
        account?: {
          created?: boolean;
          emailVerified?: boolean;
          verificationSent?: boolean;
        };
      } | null;
      if (!res.ok || !json?.ok) {
        const code = json?.error;
        setError(
          code === "rate_limited"
            ? "Trop de soumissions. Réessayez dans quelques minutes."
            : code === "email_required"
              ? "Indiquez une adresse email valide."
              : code === "phone_required" || code === "phone_invalid"
                ? "Indiquez un numéro WhatsApp / téléphone valide (ex. 0812… ou +243…)."
                : "Envoi impossible. Vérifiez vos réponses et réessayez.",
        );
        return;
      }
      setSubmittedEmail(answers.email.trim().toLowerCase());
      setAccountInfo({
        created: Boolean(json.account?.created),
        emailVerified: Boolean(json.account?.emailVerified),
        verificationSent: Boolean(json.account?.verificationSent),
      });
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg sm:max-w-xl md:max-w-2xl px-4 pb-6 pt-6">
        <VisualCard className="overflow-hidden !p-0">
          <div className="relative bg-gradient-to-br from-[color:var(--rdpi-blue)] to-[#0B2F9F] px-6 pb-8 pt-10 text-center text-white">
            <RdpiIlluSunburst className="pointer-events-none absolute -right-6 -top-4 h-36 w-36 opacity-20" />
            <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center">
              <RdpiIlluCheck className="h-20 w-20 drop-shadow-lg" />
            </div>
            <p className="relative text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--rdpi-gold)]">
              Contribution enregistrée
            </p>
            <h2 className="relative mt-2 font-[family-name:var(--font-rdpi-display)] text-[1.7rem] font-semibold leading-tight tracking-tight">
              Merci pour votre contribution
            </h2>
            <p className="relative mt-3 text-sm leading-relaxed text-white/80">
              Vos réponses ont bien été enregistrées pour RDPI Think Tank.
              {accountInfo?.verificationSent
                ? " Un email de confirmation McBuleli vient de vous être envoyé."
                : accountInfo?.emailVerified
                  ? " Votre compte McBuleli était déjà confirmé."
                  : ""}
            </p>
          </div>
          <div className="space-y-3 bg-[#FAFAF8] px-5 py-5">
            <div className="flex items-start gap-3 rounded-2xl border border-[#E5E5E0] bg-white px-4 py-3 text-left text-sm text-[#57534e]">
              <RdpiIlluDoc className="mt-0.5 h-12 w-10 shrink-0" />
              <p>
                Votre voix nourrit des recommandations fondées sur le terrain pour
                un écosystème numérique plus compétitif en RDC.
              </p>
            </div>
            {accountInfo?.verificationSent && submittedEmail ? (
              <>
                <a
                  href="/verify-email/pending"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--rdpi-blue)] px-5 py-3 text-sm font-bold text-white"
                >
                  Confirmer mon email McBuleli
                </a>
                <p className="text-center text-xs text-[#78716c]">
                  Après confirmation, utilisez « Mot de passe oublié » sur la
                  page de connexion pour définir votre mot de passe.
                </p>
              </>
            ) : null}
            {accountInfo?.emailVerified ? (
              <a
                href="/login"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--rdpi-blue)] px-5 py-3 text-sm font-bold text-white"
              >
                Se connecter à McBuleli
              </a>
            ) : null}
            <a
              href="https://rdpithinktank.org/"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-bold text-white"
            >
              Visiter RDPI Think Tank
            </a>
          </div>
        </VisualCard>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg sm:max-w-xl md:max-w-2xl px-4 pb-6 pt-6 sm:pt-8">
      {step > 0 ? (
        <div className="mb-5">
          <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-[#78716c]">
            <span>
              {SECTION_META[step - 1]?.short} - étape {step}/{TOTAL_STEPS}
            </span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-black/8">
            <div
              className="h-full rounded-full bg-[color:var(--rdpi-blue)] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : null}

      {step === 0 ? (
        <VisualCard className="!p-0 overflow-hidden">
          <div className="relative overflow-hidden border-b border-[#E5E5E0] bg-black px-5 py-5">
            <RdpiIlluSunburst className="pointer-events-none absolute -right-4 -top-2 h-28 w-28 opacity-30" />
            <div className="relative flex items-center gap-3">
              <RdpiIlluDoc className="h-14 w-12 shrink-0" />
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[color:var(--rdpi-gold)]">
                Questionnaire d&apos;enquête - {SURVEY_INTRO.duration}
              </p>
            </div>
          </div>
          <div className="space-y-4 px-5 py-5">
            <h1 className="font-[family-name:var(--font-rdpi-display)] text-[1.55rem] font-semibold leading-tight tracking-tight text-[#0c0a09] sm:text-[1.75rem]">
              {SURVEY_INTRO.title}
            </h1>
            <div className="space-y-3 text-[14px] leading-relaxed text-[#57534e]">
              {SURVEY_INTRO.paragraphs.map((p) => (
                <p key={p.slice(0, 48)}>{p}</p>
              ))}
            </div>
            <button
              type="button"
              onClick={next}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--rdpi-blue)] px-5 py-3.5 text-sm font-bold text-white shadow-[0_14px_34px_-14px_rgba(30,94,255,0.75)] transition hover:brightness-110"
            >
              Commencer le questionnaire
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </VisualCard>
      ) : null}

      {step > 0 ? (
        <VisualCard>
          {step === 1 ? (
            <section className="space-y-5">
              <SectionTitle sectionId="profil">
                Section I - Profil du répondant
              </SectionTitle>
              <TextInput
                label="Nom complet"
                value={answers.fullName}
                onChange={(e) => patch({ fullName: e.target.value })}
                placeholder="Prénom et nom"
                autoComplete="name"
              />
              <TextInput
                label="Email"
                type="email"
                value={answers.email}
                onChange={(e) => patch({ email: e.target.value })}
                placeholder="vous@exemple.com"
                autoComplete="email"
              />
              <TextInput
                label="WhatsApp / téléphone"
                type="tel"
                value={answers.phone}
                onChange={(e) => patch({ phone: e.target.value })}
                placeholder="0812 345 678 ou +243…"
                autoComplete="tel"
              />
              <p className="-mt-1 px-1 text-xs leading-relaxed text-[#78716c]">
                Obligatoire pour RDPI (suivi de l&apos;étude). Un compte McBuleli
                est créé avec votre email à l&apos;envoi - confirmation par
                email si besoin.
              </p>
              <FieldCard>
                <FieldLabel>Sexe</FieldLabel>
                <div className="mt-2">
                  <ChoiceGrid
                    name="sex"
                    options={SEX_OPTIONS}
                    value={answers.sex}
                    onChange={(sex) =>
                      patch({ sex: sex as RdpiSurveyAnswers["sex"] })
                    }
                  />
                </div>
              </FieldCard>
              <FieldCard>
                <FieldLabel>Âge</FieldLabel>
                <div className="mt-2">
                  <ChoiceGrid
                    name="age"
                    options={AGE_OPTIONS}
                    value={answers.age}
                    onChange={(age) =>
                      patch({ age: age as RdpiSurveyAnswers["age"] })
                    }
                  />
                </div>
              </FieldCard>
              <TextInput
                label="Province d'exercice principal"
                value={answers.province}
                onChange={(e) => patch({ province: e.target.value })}
                placeholder="Ex. Kinshasa, Nord-Kivu..."
              />
              <FieldCard>
                <FieldLabel>Activité principale</FieldLabel>
                <div className="mt-2">
                  <ChoiceGrid
                    name="activity"
                    options={ACTIVITY_OPTIONS}
                    value={answers.activity}
                    onChange={(activity) =>
                      patch({
                        activity: activity as RdpiSurveyAnswers["activity"],
                      })
                    }
                  />
                </div>
              </FieldCard>
              {answers.activity === "Autre" ? (
                <TextInput
                  label="Précisez"
                  value={answers.activityOther}
                  onChange={(e) => patch({ activityOther: e.target.value })}
                />
              ) : null}
              <FieldCard>
                <FieldLabel>Ancienneté dans cette activité</FieldLabel>
                <div className="mt-2">
                  <ChoiceGrid
                    name="years"
                    options={YEARS_OPTIONS}
                    value={answers.yearsActive}
                    onChange={(yearsActive) =>
                      patch({
                        yearsActive:
                          yearsActive as RdpiSurveyAnswers["yearsActive"],
                      })
                    }
                  />
                </div>
              </FieldCard>
              <FieldCard>
                <FieldLabel>Effectif de l&apos;entreprise</FieldLabel>
                <div className="mt-2">
                  <ChoiceGrid
                    name="employees"
                    options={EMPLOYEES_OPTIONS}
                    value={answers.employees}
                    onChange={(employees) =>
                      patch({
                        employees:
                          employees as RdpiSurveyAnswers["employees"],
                      })
                    }
                  />
                </div>
              </FieldCard>
            </section>
          ) : null}

          {step === 2 ? (
            <section className="space-y-4">
              <SectionTitle sectionId="perception">
                Section II - Perception des nouvelles taxes
              </SectionTitle>
              <p className="text-sm text-[#78716c]">
                Niveau d&apos;accord (1 = pas du tout d&apos;accord - 5 = tout a
                fait d&apos;accord).
              </p>
              {LIKERT_ITEMS.map((item) => (
                <ScaleRow
                  key={item.key}
                  label={item.label}
                  value={answers.likert[item.key] ?? 0}
                  onChange={(n) =>
                    patch({
                      likert: { ...answers.likert, [item.key]: n },
                    })
                  }
                  labels={[
                    "Pas du tout d'accord",
                    "Pas d'accord",
                    "Neutre",
                    "D'accord",
                    "Tout à fait d'accord",
                  ]}
                />
              ))}
            </section>
          ) : null}

          {step === 3 ? (
            <section className="space-y-5">
              <SectionTitle sectionId="impact">
                Section D - Impact économique attendu
              </SectionTitle>
              <FieldCard>
                <FieldLabel>D1. Impact sur votre organisation</FieldLabel>
                <div className="mt-2">
                  <ChoiceGrid
                    name="impactOrg"
                    options={IMPACT_ORG_OPTIONS}
                    value={answers.impactOrg}
                    onChange={(impactOrg) =>
                      patch({
                        impactOrg: impactOrg as RdpiSurveyAnswers["impactOrg"],
                      })
                    }
                  />
                </div>
              </FieldCard>
              <FieldCard>
                <FieldLabel>D2. Domaine(s) le(s) plus affecté(s)</FieldLabel>
                <div className="mt-2">
                  <MultiChoice
                    options={IMPACT_DOMAIN_OPTIONS}
                    values={answers.impactDomain}
                    onChange={(impactDomain) => patch({ impactDomain })}
                  />
                </div>
              </FieldCard>
              <FieldCard>
                <FieldLabel>
                  D3. Si les taxes restent inchangées, envisagez-vous de...
                </FieldLabel>
                <div className="mt-2">
                  <MultiChoice
                    options={ACTION_OPTIONS}
                    values={answers.actions}
                    onChange={(actions) => patch({ actions })}
                  />
                </div>
              </FieldCard>
              <FieldCard>
                <FieldLabel>
                  D4. Les nouvelles taxes augmenteront-elles le coût des services
                  numériques pour les consommateurs ?
                </FieldLabel>
                <div className="mt-2">
                  <ChoiceGrid
                    name="consumerCost"
                    options={YES_NO_UNCERTAIN}
                    value={answers.consumerCost}
                    onChange={(consumerCost) =>
                      patch({
                        consumerCost:
                          consumerCost as RdpiSurveyAnswers["consumerCost"],
                      })
                    }
                  />
                </div>
              </FieldCard>
              <TextArea
                label="D5. Les nouvelles taxes décourageront-elles les investisseurs étrangers ? Si oui, pourquoi ?"
                value={answers.foreignInvestors}
                onChange={(e) => patch({ foreignInvestors: e.target.value })}
                placeholder="Votre analyse..."
              />
            </section>
          ) : null}

          {step === 4 ? (
            <section className="space-y-4">
              <SectionTitle sectionId="climat">
                Section E - Climat des affaires
              </SectionTitle>
              <p className="text-sm text-[#78716c]">
                Intensité de chaque obstacle (1 = Aucun - 5 = Très élevé).
              </p>
              {OBSTACLE_ITEMS.map((item) => (
                <ScaleRow
                  key={item.key}
                  label={item.label}
                  value={answers.obstacles[item.key] ?? 0}
                  onChange={(n) =>
                    patch({
                      obstacles: { ...answers.obstacles, [item.key]: n },
                    })
                  }
                  labels={OBSTACLE_LEVELS}
                />
              ))}
            </section>
          ) : null}

          {step === 5 ? (
            <section className="space-y-5">
              <SectionTitle sectionId="opportunites">
                Section F - Opportunités
              </SectionTitle>
              <FieldCard>
                <FieldLabel>
                  Ces taxes et redevances présentent-elles une opportunité pour
                  la RDC de se positionner comme pays réglementaire du secteur
                  numérique ?
                </FieldLabel>
                <div className="mt-2">
                  <ChoiceGrid
                    name="opp"
                    options={YES_NO}
                    value={answers.opportunityRegulation}
                    onChange={(opportunityRegulation) =>
                      patch({
                        opportunityRegulation:
                          opportunityRegulation as RdpiSurveyAnswers["opportunityRegulation"],
                      })
                    }
                  />
                </div>
              </FieldCard>
              <FieldCard>
                <FieldLabel>
                  Le Code du numérique prévoit trois régimes (autorisation,
                  déclaration, homologation). Leur réglementation favorise-t-elle
                  la formalisation et une économie numérique inclusive ?
                </FieldLabel>
                <div className="mt-2">
                  <ChoiceGrid
                    name="régimes"
                    options={YES_NO}
                    value={answers.threeRegimes}
                    onChange={(threeRegimes) =>
                      patch({
                        threeRegimes:
                          threeRegimes as RdpiSurveyAnswers["threeRegimes"],
                      })
                    }
                  />
                </div>
              </FieldCard>
            </section>
          ) : null}

          {step === 6 ? (
            <section className="space-y-4">
              <SectionTitle sectionId="reformes">
                Section G - Priorités de réforme
              </SectionTitle>
              {REFORM_ITEMS.map((item) => (
                <ScaleRow
                  key={item.key}
                  label={item.label}
                  value={answers.reformRanks[item.key] ?? 0}
                  max={7}
                  onChange={(n) =>
                    patch({
                      reformRanks: {
                        ...answers.reformRanks,
                        [item.key]: n,
                      },
                    })
                  }
                />
              ))}
            </section>
          ) : null}

          {step === 7 ? (
            <section className="space-y-5">
              <SectionTitle sectionId="ouvertes">
                Section H - Questions ouvertes
              </SectionTitle>
              <TextArea
                label="G1. Quelle disposition du nouvel arrêté vous préoccupe le plus ? Pourquoi ?"
                value={answers.concernDisposition}
                onChange={(e) => patch({ concernDisposition: e.target.value })}
              />
              <TextArea
                label="G2. Quels seront les principaux effets de ces nouvelles taxes sur l'innovation pour les entrepreneurs du secteur numérique en RDC ?"
                value={answers.innovationEffects}
                onChange={(e) => patch({ innovationEffects: e.target.value })}
              />
              <TextArea
                label="G3. Quelles mesures proposeriez-vous pour soutenir davantage les startups numériques en RDC ?"
                value={answers.startupMeasures}
                onChange={(e) => patch({ startupMeasures: e.target.value })}
              />
              <TextArea
                label="G4. Comment le gouvernement peut-il mieux concilier mobilisation fiscale et promotion de l'entrepreneuriat numérique ?"
                value={answers.reconcileFiscal}
                onChange={(e) => patch({ reconcileFiscal: e.target.value })}
              />
              <FieldCard>
                <FieldLabel>
                  G5. Même en cas de réduction des taxes, cette mesure
                  produirait-elle les effets escomptés si le système de
                  perception n&apos;etait pas entièrement numérisé (corruption,
                  informalité, lourdeurs) ?
                </FieldLabel>
                <div className="mt-2">
                  <ChoiceGrid
                    name="digitize"
                    options={YES_NO}
                    value={answers.digitizePerception}
                    onChange={(digitizePerception) =>
                      patch({
                        digitizePerception:
                          digitizePerception as RdpiSurveyAnswers["digitizePerception"],
                      })
                    }
                  />
                </div>
              </FieldCard>
              <TextArea
                label="G6. Observations ou recommandations supplémentaires"
                value={answers.extraObservations}
                onChange={(e) => patch({ extraObservations: e.target.value })}
              />
            </section>
          ) : null}

          {error ? (
            <p
              className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <div className="mt-7 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={back}
              className="rounded-full border border-[#E5E5E0] bg-white px-5 py-2.5 text-sm font-bold text-[#1c1917]"
            >
              Retour
            </button>
            {step < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={next}
                className="rounded-full bg-[color:var(--rdpi-blue)] px-5 py-2.5 text-sm font-bold text-white"
              >
                Continuer
              </button>
            ) : (
              <button
                type="button"
                disabled={pending}
                onClick={submit}
                className="rounded-full bg-black px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                {pending ? "Envoi..." : "Envoyer mes réponses"}
              </button>
            )}
          </div>
        </VisualCard>
      ) : null}
    </div>
  );
}
