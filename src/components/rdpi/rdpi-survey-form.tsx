"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
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
  RDPI_BRAND,
  SECTION_META,
  SEX_OPTIONS,
  SURVEY_INTRO,
  YEARS_OPTIONS,
  YES_NO,
  YES_NO_UNCERTAIN,
  emptyRdpiAnswers,
  type RdpiSurveyAnswers,
} from "@/lib/rdpi/survey-questions";

const TOTAL_STEPS = SECTION_META.length; // 7 sections after intro

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--rdpi-muted)]">
      {children}
    </label>
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
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((opt) => {
        const active = value === opt;
        return (
          <label
            key={opt}
            className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-3.5 py-3 text-sm transition ${
              active
                ? "border-[color:var(--rdpi-blue)] bg-[color:var(--rdpi-blue)]/8 text-[color:var(--rdpi-ink)] shadow-[0_0_0_1px_rgba(30,94,255,0.25)]"
                : "border-black/10 bg-white/70 text-[color:var(--rdpi-ink)] hover:border-black/20"
            }`}
          >
            <input
              type="radio"
              className="mt-0.5 accent-[color:var(--rdpi-blue)]"
              name={name}
              checked={active}
              onChange={() => onChange(opt)}
            />
            <span className="leading-snug">{opt}</span>
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
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((opt) => {
        const active = values.includes(opt);
        return (
          <label
            key={opt}
            className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-3.5 py-3 text-sm transition ${
              active
                ? "border-[color:var(--rdpi-gold)] bg-[color:var(--rdpi-gold)]/12"
                : "border-black/10 bg-white/70 hover:border-black/20"
            }`}
          >
            <input
              type="checkbox"
              className="mt-0.5 accent-[color:var(--rdpi-gold)]"
              checked={active}
              onChange={() => {
                onChange(
                  active ? values.filter((v) => v !== opt) : [...values, opt],
                );
              }}
            />
            <span className="leading-snug">{opt}</span>
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
    <div className="rounded-2xl border border-black/8 bg-white/60 px-3 py-3 sm:px-4">
      <p className="mb-3 text-sm font-medium text-[color:var(--rdpi-ink)]">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: max }, (_, i) => i + 1).map((n) => {
          const active = value === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={`min-w-[2.5rem] rounded-xl border px-2.5 py-2 text-sm font-semibold transition ${
                active
                  ? "border-[color:var(--rdpi-blue)] bg-[color:var(--rdpi-blue)] text-white"
                  : "border-black/10 bg-white text-[color:var(--rdpi-ink)] hover:border-[color:var(--rdpi-blue)]/40"
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
        <p className="mt-2 text-[11px] text-[color:var(--rdpi-muted)]">
          1 = {labels[0]} · {max} = {labels[max - 1]}
        </p>
      ) : null}
    </div>
  );
}

function TextInput(
  props: React.InputHTMLAttributes<HTMLInputElement> & { label: string },
) {
  const { label, className, ...rest } = props;
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <input
        {...rest}
        className={`w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm text-[color:var(--rdpi-ink)] outline-none transition placeholder:text-black/35 focus:border-[color:var(--rdpi-blue)] focus:ring-2 focus:ring-[color:var(--rdpi-blue)]/20 ${className ?? ""}`}
      />
    </div>
  );
}

function TextArea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string },
) {
  const { label, className, ...rest } = props;
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <textarea
        {...rest}
        className={`min-h-[110px] w-full rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm text-[color:var(--rdpi-ink)] outline-none transition placeholder:text-black/35 focus:border-[color:var(--rdpi-blue)] focus:ring-2 focus:ring-[color:var(--rdpi-blue)]/20 ${className ?? ""}`}
      />
    </div>
  );
}

export function RdpiSurveyForm() {
  const [step, setStep] = useState(0); // 0 = intro
  const [answers, setAnswers] = useState<RdpiSurveyAnswers>(() =>
    emptyRdpiAnswers(),
  );
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
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
        if (v < 1 || v > 5) return "Répondez à toutes les affirmations (échelle 1–5).";
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
        return "Classez toutes les réformes de 1 à 7.";
      }
      if (new Set(ranks).size !== 7) {
        return "Chaque rang (1–7) ne peut être utilisé qu'une fois.";
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
      } | null;
      if (!res.ok || !json?.ok) {
        setError(
          json?.error === "rate_limited"
            ? "Trop de soumissions. Réessayez dans quelques minutes."
            : "Envoi impossible. Vérifiez vos réponses et réessayez.",
        );
        return;
      }
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  if (done) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--rdpi-blue)]/10">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M5 12.5l4.5 4.5L19 7.5"
              stroke="var(--rdpi-blue)"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2 className="font-[family-name:var(--font-rdpi-display)] text-3xl font-semibold tracking-tight text-[color:var(--rdpi-ink)]">
          Merci pour votre contribution
        </h2>
        <p className="mt-3 text-[color:var(--rdpi-muted)]">
          Vos réponses ont bien été enregistrées. Elles resteront confidentielles
          et serviront uniquement à l&apos;étude RDPI Think Tank.
        </p>
        <Link
          href="https://rdpithinktank.org/"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-[color:var(--rdpi-ink)] px-5 py-2.5 text-sm font-semibold text-white"
        >
          Visiter RDPI Think Tank
        </Link>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-20 pt-8 sm:pt-12">
      {/* Progress */}
      {step > 0 ? (
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--rdpi-muted)]">
            <span>
              {SECTION_META[step - 1]?.short} · Étape {step}/{TOTAL_STEPS}
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
        <section className="space-y-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--rdpi-gold)]">
            Questionnaire d&apos;enquête · {SURVEY_INTRO.duration}
          </p>
          <h1 className="font-[family-name:var(--font-rdpi-display)] text-[1.65rem] font-semibold leading-tight tracking-tight text-[color:var(--rdpi-ink)] sm:text-4xl">
            {SURVEY_INTRO.title}
          </h1>
          <div className="space-y-4 text-[15px] leading-relaxed text-[color:var(--rdpi-muted)]">
            {SURVEY_INTRO.paragraphs.map((p) => (
              <p key={p.slice(0, 40)}>{p}</p>
            ))}
          </div>
          <button
            type="button"
            onClick={next}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[color:var(--rdpi-blue)] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(30,94,255,0.28)] transition hover:brightness-110"
          >
            Commencer le questionnaire
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M5 12h14M13 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </section>
      ) : null}

      {step === 1 ? (
        <section className="space-y-6">
          <h2 className="font-[family-name:var(--font-rdpi-display)] text-2xl font-semibold text-[color:var(--rdpi-ink)]">
            Section I · Profil du répondant
          </h2>
          <TextInput
            label="Nom complet"
            value={answers.fullName}
            onChange={(e) => patch({ fullName: e.target.value })}
            placeholder="Prénom et nom"
            autoComplete="name"
          />
          <div>
            <FieldLabel>Sexe</FieldLabel>
            <ChoiceGrid
              name="sex"
              options={SEX_OPTIONS}
              value={answers.sex}
              onChange={(sex) => patch({ sex: sex as RdpiSurveyAnswers["sex"] })}
            />
          </div>
          <div>
            <FieldLabel>Âge</FieldLabel>
            <ChoiceGrid
              name="age"
              options={AGE_OPTIONS}
              value={answers.age}
              onChange={(age) => patch({ age: age as RdpiSurveyAnswers["age"] })}
            />
          </div>
          <TextInput
            label="Province d'exercice principal"
            value={answers.province}
            onChange={(e) => patch({ province: e.target.value })}
            placeholder="Ex. Kinshasa, Nord-Kivu…"
          />
          <div>
            <FieldLabel>Activité principale</FieldLabel>
            <ChoiceGrid
              name="activity"
              options={ACTIVITY_OPTIONS}
              value={answers.activity}
              onChange={(activity) =>
                patch({ activity: activity as RdpiSurveyAnswers["activity"] })
              }
            />
          </div>
          {answers.activity === "Autre" ? (
            <TextInput
              label="Précisez"
              value={answers.activityOther}
              onChange={(e) => patch({ activityOther: e.target.value })}
            />
          ) : null}
          <div>
            <FieldLabel>Ancienneté dans cette activité</FieldLabel>
            <ChoiceGrid
              name="years"
              options={YEARS_OPTIONS}
              value={answers.yearsActive}
              onChange={(yearsActive) =>
                patch({
                  yearsActive: yearsActive as RdpiSurveyAnswers["yearsActive"],
                })
              }
            />
          </div>
          <div>
            <FieldLabel>Effectif de l&apos;entreprise</FieldLabel>
            <ChoiceGrid
              name="employees"
              options={EMPLOYEES_OPTIONS}
              value={answers.employees}
              onChange={(employees) =>
                patch({
                  employees: employees as RdpiSurveyAnswers["employees"],
                })
              }
            />
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="space-y-5">
          <h2 className="font-[family-name:var(--font-rdpi-display)] text-2xl font-semibold text-[color:var(--rdpi-ink)]">
            Section II · Perception des nouvelles taxes
          </h2>
          <p className="text-sm text-[color:var(--rdpi-muted)]">
            Pour chaque affirmation, indiquez votre niveau d&apos;accord (1 =
            pas du tout d&apos;accord · 5 = tout à fait d&apos;accord).
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
        <section className="space-y-6">
          <h2 className="font-[family-name:var(--font-rdpi-display)] text-2xl font-semibold text-[color:var(--rdpi-ink)]">
            Section D · Impact économique attendu
          </h2>
          <div>
            <FieldLabel>D1. Impact sur votre organisation</FieldLabel>
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
          <div>
            <FieldLabel>D2. Domaine(s) le(s) plus affecté(s)</FieldLabel>
            <MultiChoice
              options={IMPACT_DOMAIN_OPTIONS}
              values={answers.impactDomain}
              onChange={(impactDomain) => patch({ impactDomain })}
            />
          </div>
          <div>
            <FieldLabel>
              D3. Si les taxes restent inchangées, envisagez-vous de…
            </FieldLabel>
            <MultiChoice
              options={ACTION_OPTIONS}
              values={answers.actions}
              onChange={(actions) => patch({ actions })}
            />
          </div>
          <div>
            <FieldLabel>
              D4. Les nouvelles taxes augmenteront-elles le coût des services
              numériques pour les consommateurs ?
            </FieldLabel>
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
          <TextArea
            label="D5. Les nouvelles taxes décourageront-elles les investisseurs étrangers ? Si oui, pourquoi ?"
            value={answers.foreignInvestors}
            onChange={(e) => patch({ foreignInvestors: e.target.value })}
            placeholder="Votre analyse…"
          />
        </section>
      ) : null}

      {step === 4 ? (
        <section className="space-y-5">
          <h2 className="font-[family-name:var(--font-rdpi-display)] text-2xl font-semibold text-[color:var(--rdpi-ink)]">
            Section E · Climat des affaires
          </h2>
          <p className="text-sm text-[color:var(--rdpi-muted)]">
            Classez l&apos;intensité de chaque obstacle (1 = Aucun · 5 = Très
            élevé).
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
        <section className="space-y-6">
          <h2 className="font-[family-name:var(--font-rdpi-display)] text-2xl font-semibold text-[color:var(--rdpi-ink)]">
            Section F · Opportunités
          </h2>
          <div>
            <FieldLabel>
              Ces taxes et redevances présentent-elles une opportunité pour la
              RDC de se positionner comme pays réglementaire du secteur
              numérique ?
            </FieldLabel>
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
          <div>
            <FieldLabel>
              Le Code du numérique prévoit trois régimes (autorisation,
              déclaration, homologation). Leur réglementation favorise-t-elle la
              formalisation et une économie numérique inclusive ?
            </FieldLabel>
            <ChoiceGrid
              name="regimes"
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
        </section>
      ) : null}

      {step === 6 ? (
        <section className="space-y-5">
          <h2 className="font-[family-name:var(--font-rdpi-display)] text-2xl font-semibold text-[color:var(--rdpi-ink)]">
            Section G · Priorités de réforme
          </h2>
          <p className="text-sm text-[color:var(--rdpi-muted)]">
            Classez de 1 (plus importante) à 7 (moins importante). Chaque rang
            unique.
          </p>
          {REFORM_ITEMS.map((item) => (
            <div
              key={item.key}
              className="flex flex-col gap-3 rounded-2xl border border-black/8 bg-white/60 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4"
            >
              <p className="text-sm font-medium text-[color:var(--rdpi-ink)]">
                {item.label}
              </p>
              <select
                className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[color:var(--rdpi-blue)]"
                value={answers.reformRanks[item.key] || ""}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  patch({
                    reformRanks: {
                      ...answers.reformRanks,
                      [item.key]: n,
                    },
                  });
                }}
              >
                <option value="">Rang…</option>
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </section>
      ) : null}

      {step === 7 ? (
        <section className="space-y-5">
          <h2 className="font-[family-name:var(--font-rdpi-display)] text-2xl font-semibold text-[color:var(--rdpi-ink)]">
            Section H · Questions ouvertes
          </h2>
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
          <div>
            <FieldLabel>
              G5. Même en cas de réduction des taxes, cette mesure produirait-elle
              les effets escomptés si le système de perception n&apos;était pas
              entièrement numérisé (corruption, informalité, lourdeurs) ?
            </FieldLabel>
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
          <TextArea
            label="G6. Observations ou recommandations supplémentaires"
            value={answers.extraObservations}
            onChange={(e) => patch({ extraObservations: e.target.value })}
          />
        </section>
      ) : null}

      {error ? (
        <p
          className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {step > 0 ? (
        <div className="mt-10 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={back}
            className="rounded-full border border-black/12 bg-white px-5 py-2.5 text-sm font-semibold text-[color:var(--rdpi-ink)]"
          >
            Retour
          </button>
          {step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={next}
              className="rounded-full bg-[color:var(--rdpi-blue)] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Continuer
            </button>
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={submit}
              className="rounded-full bg-[color:var(--rdpi-ink)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {pending ? "Envoi…" : "Envoyer mes réponses"}
            </button>
          )}
        </div>
      ) : null}

      <footer className="mt-16 border-t border-black/8 pt-8 text-center">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--rdpi-muted)]">
          Powered by
        </p>
        <Link
          href="https://x.com/McBuleli"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-[color:var(--rdpi-muted)] transition hover:text-[color:var(--rdpi-ink)]"
        >
          <Image
            src="/brand/logo-256.png"
            alt="McBuleli"
            width={22}
            height={22}
            className="rounded-full"
          />
          <span className="font-semibold">McBuleli</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.924L1.5 2.25h7.08l4.263 5.686L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </Link>
        <p className="mt-3 text-[11px] text-[color:var(--rdpi-muted)]">
          Plateforme d&apos;enquête pour {RDPI_BRAND.name}
        </p>
      </footer>
    </div>
  );
}
