"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  computeWeightedScore,
  JURY_CRITERIA,
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
    readmeUrl: string | null;
    notes: string | null;
    submittedAt: string | null;
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

type PitchQueue = {
  active: boolean;
  current: { teamId: string; teamName: string } | null;
  entries: Array<{ teamId: string; teamName: string }>;
};

function scoreProgress(
  draft: Partial<Record<JuryCriterionId, number>>,
): { filled: number; total: number } {
  let filled = 0;
  for (const c of JURY_CRITERIA) {
    const v = draft[c.id];
    if (typeof v === "number" && v >= 0) filled += 1;
  }
  return { filled, total: JURY_CRITERIA.length };
}

function SubmissionPreview({
  submission,
  isFr,
}: {
  submission: JuryItem["submission"];
  isFr: boolean;
}) {
  const links = [
    { url: submission.demoUrl, label: isFr ? "Démo live" : "Live demo", primary: true },
    { url: submission.githubUrl, label: "GitHub", primary: false },
    { url: submission.pitchPdfUrl, label: "Pitch PDF", primary: false },
    { url: submission.figmaUrl, label: "Figma", primary: false },
    { url: submission.readmeUrl, label: "Readme", primary: false },
  ].filter((l) => Boolean(l.url));

  if (!links.length && !submission.notes) {
    return (
      <p className="text-sm text-[color:var(--hk-muted,var(--fd-muted))]">
        {isFr ? "Aucun lien de démo." : "No demo links."}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {links.map((link) => (
          <a
            key={link.label}
            href={link.url!}
            target="_blank"
            rel="noreferrer"
            className={`rounded-xl px-4 py-2.5 text-sm font-bold ${
              link.primary
                ? "bg-[color:var(--hk-accent,var(--fd-primary))] text-white"
                : "bg-[color:var(--hk-page,var(--fd-bg))] text-[color:var(--hk-accent,var(--fd-primary))] ring-1 ring-[color:var(--hk-border,var(--fd-border))]"
            }`}
          >
            {link.label}
          </a>
        ))}
      </div>
      {submission.notes ? (
        <p className="rounded-xl bg-[color:var(--hk-page,var(--fd-bg))] px-3.5 py-3 text-sm leading-relaxed text-[color:var(--hk-muted,var(--fd-muted))]">
          {submission.notes}
        </p>
      ) : null}
      {submission.submittedAt ? (
        <p className="text-xs text-[color:var(--hk-muted,var(--fd-muted))]">
          {isFr ? "Soumis" : "Submitted"}:{" "}
          {new Date(submission.submittedAt).toLocaleString(isFr ? "fr-FR" : "en-GB")}
        </p>
      ) : null}
    </div>
  );
}

export function HackathonJuryClient() {
  const isFr = useHkLocale();
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [items, setItems] = useState<JuryItem[]>([]);
  const [pitchQueue, setPitchQueue] = useState<PitchQueue | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [drafts, setDrafts] = useState<
    Record<string, Partial<Record<JuryCriterionId, number>>>
  >({});

  const load = useCallback(async () => {
    const [juryRes, queueRes] = await Promise.all([
      fetch("/api/hackathon/jury", { cache: "no-store" }),
      fetch("/api/hackathon/pitch-queue", { cache: "no-store" }),
    ]);
    const json = await juryRes.json().catch(() => ({}));
    if (!juryRes.ok) {
      setError(json.error ?? "forbidden");
      return;
    }
    const queueJson = await queueRes.json().catch(() => ({}));
    setPitchQueue(queueJson.queue ?? null);
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
    const t = setInterval(() => void load(), 20_000);
    return () => clearInterval(t);
  }, [load]);

  const sortedItems = useMemo(() => {
    if (!pitchQueue?.entries.length) return items;
    const order = new Map(
      pitchQueue.entries.map((e, i) => [e.teamId, i] as const),
    );
    return [...items].sort((a, b) => {
      const ai = order.get(a.team.id) ?? 999;
      const bi = order.get(b.team.id) ?? 999;
      return ai - bi;
    });
  }, [items, pitchQueue]);

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
                ? "Demandez à l'organisation de lier votre userId dans Admin - Jury / Mentors."
                : "Ask the organizers to link your userId in Admin - Jury / Mentors."}
            </p>
          </HkSection>
        </HkPage>
      </HkShell>
    );
  }

  const lockedCount = sortedItems.filter((i) => i.myLocked).length;

  return (
    <HkShell authReturnPath="/hackathon/jury">
      <HkPage
        eyebrow="Jury"
        title={isFr ? "Notation" : "Scoring"}
        lede={
          isFr
            ? "Innovation 25% - Impact 25% - Tech 20% - Business 15% - Présentation 15% (notes 0-10)."
            : "Innovation 25% - Impact 25% - Tech 20% - Business 15% - Presentation 15% (scores 0-10)."
        }
        actions={
          <HkStatusPill tone="neutral">
            {isFr ? "Verrouillés" : "Locked"}: {lockedCount}/{sortedItems.length}
          </HkStatusPill>
        }
      >
        <HkError message={error && error !== "forbidden" ? error : null} />

        {pitchQueue?.active && pitchQueue.current ? (
          <div className="mb-4 rounded-2xl border border-amber-400/40 bg-amber-50 px-4 py-3 dark:bg-amber-950/20">
            <p className="text-[10px] font-bold uppercase tracking-wide text-amber-800">
              {isFr ? "En scène (file pitch)" : "On stage (pitch queue)"}
            </p>
            <p className="mt-1 text-xl font-black text-[color:var(--hk-text)]">
              {pitchQueue.current.teamName}
            </p>
          </div>
        ) : null}

        {sortedItems.length === 0 ? (
          <HkSection title={isFr ? "File d'attente" : "Queue"}>
            <p className="text-sm text-[color:var(--hk-muted,var(--fd-muted))]">
              {isFr ? "Aucun livrable soumis." : "No submissions yet."}
            </p>
          </HkSection>
        ) : null}

        {sortedItems.map((item, index) => {
          const draft = drafts[item.submission.id] ?? {};
          const total = computeWeightedScore(draft);
          const progress = scoreProgress(draft);
          const onStage = pitchQueue?.current?.teamId === item.team.id;
          const queuePos = pitchQueue?.entries.findIndex(
            (e) => e.teamId === item.team.id,
          );

          return (
            <HkSection
              key={item.submission.id}
              title={
                queuePos != null && queuePos >= 0
                  ? `${queuePos + 1}. ${item.team.name}`
                  : `${index + 1}. ${item.team.name}`
              }
              hint={item.team.status}
              action={
                <div className="flex flex-wrap items-center gap-2">
                  {onStage ? (
                    <HkStatusPill tone="accent">
                      {isFr ? "En scène" : "On stage"}
                    </HkStatusPill>
                  ) : null}
                  {item.myLocked ? (
                    <HkStatusPill tone="ok">
                      {isFr ? "Verrouillé" : "Locked"}
                    </HkStatusPill>
                  ) : (
                    <HkStatusPill tone="neutral">
                      {progress.filled}/{progress.total}{" "}
                      {isFr ? "critères" : "criteria"}
                    </HkStatusPill>
                  )}
                  {item.average != null ? (
                    <HkStatusPill tone="accent">avg {item.average}</HkStatusPill>
                  ) : null}
                  <span className="font-mono text-sm font-bold text-[color:var(--hk-text,var(--fd-text))]">
                    {total ?? "--"}
                  </span>
                </div>
              }
            >
              <SubmissionPreview submission={item.submission} isFr={isFr} />

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
                <div className="mt-4 flex flex-wrap gap-2">
                  <HkBtn
                    variant="secondary"
                    disabled={busy}
                    onClick={() => save(item.submission.id, false)}
                  >
                    {isFr ? "Enregistrer" : "Save"}
                  </HkBtn>
                  <HkBtn
                    disabled={busy || progress.filled < progress.total}
                    onClick={() => save(item.submission.id, true)}
                  >
                    {isFr ? "Verrouiller" : "Lock"}
                  </HkBtn>
                </div>
              ) : null}
            </HkSection>
          );
        })}
      </HkPage>
    </HkShell>
  );
}
