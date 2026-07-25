"use client";

import { useCallback, useEffect, useState } from "react";
import {
  computeWeightedScore,
  type JuryCriterionId,
} from "@/lib/hackathon/team-status";
import {
  HkBtn,
  HkError,
  HkInput,
  HkLabel,
  HkPage,
  HkSection,
  HkShell,
  HkStatusPill,
  useHkLocale,
} from "@/components/hackathon/hk-ui";

type Criterion = {
  id: JuryCriterionId;
  weight: number;
  labelFr: string;
  labelEn: string;
};

type JuryItem = {
  team: { id: string; name: string; status: string };
  submission: {
    id: string;
    demoUrl: string | null;
    githubUrl: string | null;
    figmaUrl: string | null;
    pitchPdfUrl: string | null;
    notes: string | null;
  };
  myScores: Array<{
    criterion: string;
    score: number;
    comment: string | null;
    lockedAt: string | null;
  }>;
  myLocked: boolean;
  average: number | null;
};

export function HackathonJuryClient() {
  const isFr = useHkLocale();
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [items, setItems] = useState<JuryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [drafts, setDrafts] = useState<
    Record<string, Partial<Record<JuryCriterionId, number>>>
  >({});

  const load = useCallback(async () => {
    const res = await fetch("/api/hackathon/jury");
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json.error ?? "forbidden");
      return;
    }
    setCriteria(json.criteria ?? []);
    setItems(json.items ?? []);
    const next: Record<string, Partial<Record<JuryCriterionId, number>>> = {};
    for (const item of json.items ?? []) {
      const map: Partial<Record<JuryCriterionId, number>> = {};
      for (const s of item.myScores ?? []) {
        map[s.criterion as JuryCriterionId] = s.score;
      }
      next[item.submission.id] = map;
    }
    setDrafts(next);
    setError(null);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(submissionId: string, lock: boolean) {
    setBusy(true);
    setError(null);
    try {
      const scores = criteria.map((c) => ({
        criterion: c.id,
        score: drafts[submissionId]?.[c.id] ?? 0,
      }));
      const res = await fetch("/api/hackathon/jury", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: lock ? "lock" : "save",
          submissionId,
          scores,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "error");
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (error === "forbidden" || error === "unauthorized") {
    return (
      <HkShell authReturnPath="/hackathon/jury">
        <HkPage
          eyebrow="Jury"
          title={isFr ? "Accès restreint" : "Restricted access"}
          lede={
            isFr
              ? "Réservé aux membres du jury liés à un compte McBuleli."
              : "Reserved for jury members linked to a McBuleli account."
          }
        >
          <HkSection title={isFr ? "Que faire ?" : "Next steps"}>
            <p className="text-sm text-[color:var(--hk-muted,var(--fd-muted))]">
              {isFr
                ? "Demandez à l'organisation de lier votre userId dans Admin → Jury / Mentors."
                : "Ask the organizers to link your userId in Admin → Jury / Mentors."}
            </p>
          </HkSection>
        </HkPage>
      </HkShell>
    );
  }

  return (
    <HkShell authReturnPath="/hackathon/jury">
      <HkPage
        eyebrow="Jury"
        title={isFr ? "Notation" : "Scoring"}
        lede={
          isFr
            ? "Innovation 25% · Impact 25% · Tech 20% · Business 15% · Présentation 15% (notes 0–10)."
            : "Innovation 25% · Impact 25% · Tech 20% · Business 15% · Presentation 15% (scores 0–10)."
        }
      >
        <HkError message={error && error !== "forbidden" ? error : null} />

        {items.length === 0 ? (
          <HkSection title={isFr ? "File d'attente" : "Queue"}>
            <p className="text-sm text-[color:var(--hk-muted,var(--fd-muted))]">
              {isFr ? "Aucun livrable soumis." : "No submissions yet."}
            </p>
          </HkSection>
        ) : null}

        {items.map((item) => {
          const draft = drafts[item.submission.id] ?? {};
          const total = computeWeightedScore(draft);
          return (
            <HkSection
              key={item.submission.id}
              title={item.team.name}
              hint={item.team.status}
              action={
                <div className="flex flex-wrap items-center gap-2">
                  {item.average != null ? (
                    <HkStatusPill tone="accent">
                      avg {item.average}
                    </HkStatusPill>
                  ) : null}
                  <span className="font-mono text-sm font-bold text-[color:var(--hk-text,var(--fd-text))]">
                    {total ?? "--"}
                  </span>
                </div>
              }
            >
              <div className="flex flex-wrap gap-3 text-sm">
                {(
                  [
                    [item.submission.demoUrl, isFr ? "Démo" : "Demo"],
                    [item.submission.githubUrl, "GitHub"],
                    [item.submission.pitchPdfUrl, "Pitch"],
                    [item.submission.figmaUrl, "Figma"],
                  ] as const
                ).map(([url, label]) =>
                  url ? (
                    <a
                      key={label}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-[color:var(--hk-accent,var(--fd-primary))] hover:underline"
                    >
                      {label}
                    </a>
                  ) : null,
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {criteria.map((c) => (
                  <div key={c.id} className="space-y-1.5">
                    <HkLabel>
                      {isFr ? c.labelFr : c.labelEn} ({Math.round(c.weight * 100)}
                      %)
                    </HkLabel>
                    <HkInput
                      type="number"
                      min={0}
                      max={10}
                      disabled={item.myLocked || busy}
                      value={draft[c.id] ?? 0}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setDrafts((d) => ({
                          ...d,
                          [item.submission.id]: {
                            ...d[item.submission.id],
                            [c.id]: v,
                          },
                        }));
                      }}
                    />
                  </div>
                ))}
              </div>

              {!item.myLocked ? (
                <div className="flex flex-wrap gap-2">
                  <HkBtn
                    variant="secondary"
                    disabled={busy}
                    onClick={() => save(item.submission.id, false)}
                  >
                    {isFr ? "Enregistrer" : "Save"}
                  </HkBtn>
                  <HkBtn
                    disabled={busy}
                    onClick={() => save(item.submission.id, true)}
                  >
                    {isFr ? "Verrouiller" : "Lock"}
                  </HkBtn>
                </div>
              ) : (
                <HkStatusPill tone="ok">
                  {isFr ? "Notes verrouillées" : "Scores locked"}
                </HkStatusPill>
              )}
            </HkSection>
          );
        })}
      </HkPage>
    </HkShell>
  );
}
