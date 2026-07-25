"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import type { HubPayloadOk } from "@/lib/hackathon/hub-types";
import {
  HkBtn,
  HkError,
  HkInput,
  HkLabel,
  HkPage,
  HkSection,
  HkShell,
  HkStatusPill,
  HkTextarea,
  paymentTone,
  useHkLocale,
} from "@/components/hackathon/hk-ui";

export function HackathonEspaceClient({
  initial,
}: {
  initial: HubPayloadOk;
}) {
  const isFr = useHkLocale();
  const [data, setData] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamName, setTeamName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [isSolo, setIsSolo] = useState(false);
  const [mentorTopic, setMentorTopic] = useState("");
  const [subForm, setSubForm] = useState({
    demoUrl: initial.submission?.demoUrl ?? "",
    githubUrl: initial.submission?.githubUrl ?? "",
    figmaUrl: initial.submission?.figmaUrl ?? "",
    pitchPdfUrl: initial.submission?.pitchPdfUrl ?? "",
    notes: initial.submission?.notes ?? "",
  });

  const isLead = data.memberRole === "lead";
  const deadline = data.edition.submissionDeadlineAt
    ? new Date(data.edition.submissionDeadlineAt)
    : null;

  const refresh = useCallback(async () => {
    const res = await fetch("/api/hackathon/hub");
    if (!res.ok) return;
    const json = (await res.json()) as HubPayloadOk & { error?: string };
    if (!json.error) setData(json);
  }, []);

  async function postAction(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/hackathon/hub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "error");
        return;
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function saveSubmission(action: "save" | "submit") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/hackathon/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...subForm }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "error");
        return;
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function uploadPitch(file: File) {
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch("/api/hackathon/submissions/upload", {
        method: "POST",
        body: fd,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "upload_failed");
        return;
      }
      setSubForm((s) => ({ ...s, pitchPdfUrl: json.url }));
    } finally {
      setBusy(false);
    }
  }

  const countdown = useMemo(() => {
    if (!deadline) return null;
    const ms = deadline.getTime() - Date.now();
    if (ms <= 0) return isFr ? "Deadline passée" : "Deadline passed";
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return isFr ? `${h}h ${m}m restantes` : `${h}h ${m}m left`;
  }, [deadline, isFr]);

  return (
    <HkShell authReturnPath="/hackathon/espace">
      <HkPage
        eyebrow={isFr ? "Espace participant" : "Participant hub"}
        title={data.edition.nameFr}
        lede={
          isFr
            ? "Équipe, défi, livrables et annonces - tout au même endroit."
            : "Team, challenge, deliverables and announcements in one place."
        }
        actions={
          <Link
            href="/hackathon/live"
            className="rounded-xl bg-[color:var(--hk-soft,var(--fd-mint))] px-4 py-2.5 text-sm font-bold text-[color:var(--hk-accent,var(--fd-primary))]"
          >
            Live wall
          </Link>
        }
      >
        <HkError message={error} />

        <HkSection
          title={isFr ? "Inscription" : "Registration"}
          action={
            data.registration ? (
              <HkStatusPill tone={paymentTone(data.registration.paymentStatus)}>
                {data.registration.paymentStatus}
              </HkStatusPill>
            ) : null
          }
        >
          {!data.registration ? (
            <p className="text-sm text-[color:var(--hk-muted,var(--fd-muted))]">
              {isFr ? "Pas encore inscrit." : "Not registered yet."}{" "}
              <Link
                href="/hackathon#register"
                className="font-semibold text-[color:var(--hk-accent,var(--fd-primary))]"
              >
                {isFr ? "S'inscrire" : "Register"}
              </Link>
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-[color:var(--hk-text,var(--fd-text))]">
                <span className="font-bold">
                  {data.registration.firstName} {data.registration.lastName}
                </span>
                <span className="text-[color:var(--hk-muted,var(--fd-muted))]">
                  {" "}
                  · {isFr ? "présence" : "presence"}:{" "}
                  {data.registration.presenceStatus}
                </span>
              </p>
              <div className="flex flex-wrap gap-2">
                {data.registration.passUrl ? (
                  <Link
                    href={data.registration.passUrl}
                    className="rounded-xl bg-[color:var(--hk-accent,var(--fd-primary))] px-4 py-2.5 text-sm font-bold text-white"
                  >
                    {isFr ? "Mon badge QR" : "My QR badge"}
                  </Link>
                ) : null}
                {!data.isPaid && data.registration.payUrl ? (
                  <Link
                    href={data.registration.payUrl}
                    className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-white"
                  >
                    {isFr ? "Finaliser le paiement" : "Complete payment"}
                  </Link>
                ) : null}
              </div>
            </div>
          )}
        </HkSection>

        {data.announcements.length > 0 ? (
          <HkSection title={isFr ? "Annonces" : "Announcements"}>
            {data.announcements.slice(0, 5).map((a) => (
              <article
                key={a.id}
                className="rounded-xl bg-[color:var(--hk-page,var(--fd-bg))] px-4 py-3 ring-1 ring-[color:var(--hk-border,var(--fd-border))]"
              >
                <div className="flex flex-wrap items-center gap-2">
                  {a.pinned ? <HkStatusPill tone="accent">Pin</HkStatusPill> : null}
                  <p className="font-bold text-[color:var(--hk-text,var(--fd-text))]">
                    {a.title}
                  </p>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-[color:var(--hk-muted,var(--fd-muted))]">
                  {a.body}
                </p>
              </article>
            ))}
          </HkSection>
        ) : null}

        <HkSection
          title={isFr ? "Équipe" : "Team"}
          hint={
            !data.isPaid
              ? isFr
                ? "Paiement requis pour créer ou rejoindre."
                : "Payment required to create or join."
              : undefined
          }
          action={
            data.team ? (
              <HkStatusPill tone="accent">{data.team.status}</HkStatusPill>
            ) : null
          }
        >
          {!data.isPaid ? null : !data.team ? (
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-3">
                <HkLabel>{isFr ? "Créer une équipe" : "Create a team"}</HkLabel>
                <HkInput
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder={isFr ? "Nom de l'équipe" : "Team name"}
                />
                <label className="flex items-center gap-2 text-sm text-[color:var(--hk-text,var(--fd-text))]">
                  <input
                    type="checkbox"
                    checked={isSolo}
                    onChange={(e) => setIsSolo(e.target.checked)}
                    className="rounded border-[color:var(--hk-border,var(--fd-border))]"
                  />
                  {isFr ? "Je participe en solo" : "I'm going solo"}
                </label>
                <HkBtn
                  disabled={busy || teamName.trim().length < 2}
                  onClick={() =>
                    postAction({ action: "create", name: teamName, isSolo })
                  }
                >
                  {isFr ? "Créer" : "Create"}
                </HkBtn>
              </div>
              <div className="space-y-3 border-t border-[color:var(--hk-border,var(--fd-border))] pt-6 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
                <HkLabel>{isFr ? "Rejoindre" : "Join"}</HkLabel>
                <HkInput
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="MBT-…"
                  className="uppercase"
                />
                <HkBtn
                  variant="secondary"
                  disabled={busy || inviteCode.trim().length < 4}
                  onClick={() =>
                    postAction({
                      action: "join",
                      inviteCode: inviteCode.trim(),
                    })
                  }
                >
                  {isFr ? "Rejoindre" : "Join"}
                </HkBtn>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-lg font-black text-[color:var(--hk-text,var(--fd-text))]">
                  {data.team.name}
                </p>
                <p className="mt-1 text-sm text-[color:var(--hk-muted,var(--fd-muted))]">
                  {isFr ? "Code invitation" : "Invite code"}:{" "}
                  <code className="rounded-lg bg-[color:var(--hk-soft,var(--fd-mint))] px-2 py-0.5 font-mono font-bold text-[color:var(--hk-accent,var(--fd-primary))]">
                    {data.team.inviteCode}
                  </code>
                </p>
              </div>
              <ul className="space-y-1.5">
                {data.team.members.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between rounded-xl bg-[color:var(--hk-page,var(--fd-bg))] px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-[color:var(--hk-text,var(--fd-text))]">
                      {m.firstName} {m.lastName}
                    </span>
                    <HkStatusPill>{m.role}</HkStatusPill>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2">
                {isLead && !data.team.rulesAcceptedAt ? (
                  <HkBtn
                    disabled={busy}
                    onClick={() => postAction({ action: "accept_rules" })}
                  >
                    {isFr ? "Accepter le règlement" : "Accept the rules"}
                  </HkBtn>
                ) : data.team.rulesAcceptedAt ? (
                  <HkStatusPill tone="ok">
                    {isFr ? "Règlement OK" : "Rules OK"}
                  </HkStatusPill>
                ) : null}
                <HkBtn
                  variant="secondary"
                  disabled={busy}
                  onClick={() => postAction({ action: "mark_building" })}
                >
                  {isFr ? "Démarrer le build" : "Start building"}
                </HkBtn>
                <HkBtn
                  variant="danger"
                  disabled={busy}
                  onClick={() => postAction({ action: "leave" })}
                >
                  {isFr ? "Quitter" : "Leave"}
                </HkBtn>
              </div>
            </div>
          )}
        </HkSection>

        {data.team && data.isPaid ? (
          <HkSection
            title={isFr ? "Défi" : "Challenge"}
            hint={
              isLead
                ? undefined
                : isFr
                  ? "Seul le lead peut changer le défi."
                  : "Only the lead can change the challenge."
            }
            action={
              data.team.challenge ? (
                <HkStatusPill tone="accent">
                  {data.team.challenge.labelFr}
                </HkStatusPill>
              ) : null
            }
          >
            {isLead ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {data.challenges.map((c) => {
                  const active = data.team?.challengeId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        postAction({ action: "challenge", challengeId: c.id })
                      }
                      className={`rounded-xl px-3.5 py-3 text-left transition ring-1 ${
                        active
                          ? "bg-[color:var(--hk-soft,var(--fd-mint))] ring-[color:var(--hk-accent,var(--fd-primary))]"
                          : "bg-[color:var(--hk-page,var(--fd-bg))] ring-[color:var(--hk-border,var(--fd-border))] hover:ring-[color:var(--hk-accent,var(--fd-primary))]/40"
                      }`}
                    >
                      <span className="block text-sm font-bold text-[color:var(--hk-text,var(--fd-text))]">
                        {isFr ? c.labelFr : c.labelEn}
                      </span>
                      {c.blurbFr ? (
                        <span className="mt-1 block text-xs text-[color:var(--hk-muted,var(--fd-muted))]">
                          {isFr ? c.blurbFr : c.blurbEn}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ) : data.team.challenge ? (
              <p className="text-sm text-[color:var(--hk-text,var(--fd-text))]">
                {data.team.challenge.labelFr}
              </p>
            ) : (
              <p className="text-sm text-[color:var(--hk-muted,var(--fd-muted))]">
                {isFr ? "Pas encore de défi." : "No challenge yet."}
              </p>
            )}
          </HkSection>
        ) : null}

        {data.team && data.isPaid ? (
          <HkSection
            title={isFr ? "Livrables" : "Deliverables"}
            action={
              <div className="flex flex-wrap items-center gap-2">
                <HkStatusPill>
                  {data.submission?.status ?? "draft"}
                </HkStatusPill>
                {countdown ? (
                  <span className="text-xs font-bold text-[color:var(--hk-muted,var(--fd-muted))]">
                    {countdown}
                  </span>
                ) : null}
              </div>
            }
          >
            {(
              [
                ["demoUrl", isFr ? "URL démo" : "Demo URL"],
                ["githubUrl", "GitHub"],
                ["figmaUrl", isFr ? "Figma / maquettes" : "Figma / mockups"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="space-y-1.5">
                <HkLabel>{label}</HkLabel>
                <HkInput
                  value={subForm[key]}
                  onChange={(e) =>
                    setSubForm((s) => ({ ...s, [key]: e.target.value }))
                  }
                  placeholder="https://"
                />
              </div>
            ))}
            <div className="space-y-1.5">
              <HkLabel>{isFr ? "Pitch PDF" : "Pitch PDF"}</HkLabel>
              <input
                type="file"
                accept="application/pdf,image/*"
                className="block w-full text-sm text-[color:var(--hk-muted,var(--fd-muted))]"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void uploadPitch(f);
                }}
              />
              {subForm.pitchPdfUrl ? (
                <a
                  href={subForm.pitchPdfUrl}
                  className="inline-block text-sm font-semibold text-[color:var(--hk-accent,var(--fd-primary))]"
                  target="_blank"
                  rel="noreferrer"
                >
                  {isFr ? "Fichier actuel" : "Current file"}
                </a>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <HkLabel>Notes</HkLabel>
              <HkTextarea
                value={subForm.notes}
                onChange={(e) =>
                  setSubForm((s) => ({ ...s, notes: e.target.value }))
                }
                rows={3}
              />
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <HkBtn
                variant="secondary"
                disabled={busy}
                onClick={() => saveSubmission("save")}
              >
                {isFr ? "Brouillon" : "Save draft"}
              </HkBtn>
              <HkBtn disabled={busy} onClick={() => saveSubmission("submit")}>
                {isFr ? "Soumettre" : "Submit"}
              </HkBtn>
            </div>
          </HkSection>
        ) : null}

        {data.team && data.isPaid ? (
          <HkSection title={isFr ? "Mentorat" : "Mentorship"}>
            <div className="flex flex-col gap-2 sm:flex-row">
              <HkInput
                value={mentorTopic}
                onChange={(e) => setMentorTopic(e.target.value)}
                placeholder={
                  isFr ? "Sujet (ex. UX, API pawaPay)" : "Topic (e.g. UX, APIs)"
                }
                className="flex-1"
              />
              <HkBtn
                disabled={busy || mentorTopic.trim().length < 2}
                onClick={() => {
                  void postAction({
                    action: "mentor_request",
                    topic: mentorTopic,
                  }).then(() => setMentorTopic(""));
                }}
              >
                {isFr ? "Demander" : "Request"}
              </HkBtn>
            </div>
            {data.mentorRequests.length > 0 ? (
              <ul className="space-y-1.5">
                {data.mentorRequests.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between rounded-xl bg-[color:var(--hk-page,var(--fd-bg))] px-3 py-2 text-sm"
                  >
                    <span>{m.topic}</span>
                    <HkStatusPill>{m.status}</HkStatusPill>
                  </li>
                ))}
              </ul>
            ) : null}
          </HkSection>
        ) : null}

        <HkSection title={isFr ? "Programme" : "Program"}>
          {data.program.map((day) => (
            <div key={day.day} className="space-y-2">
              <p className="text-sm font-bold text-[color:var(--hk-text,var(--fd-text))]">
                {isFr ? day.labelFr : day.labelEn}
              </p>
              <ul className="space-y-1.5">
                {day.slots.map((s) => (
                  <li
                    key={s.time}
                    className="grid grid-cols-[7.5rem_1fr] gap-2 text-sm"
                  >
                    <span className="font-mono text-xs text-[color:var(--hk-accent,var(--fd-primary))]">
                      {s.time}
                    </span>
                    <span className="text-[color:var(--hk-muted,var(--fd-muted))]">
                      {isFr ? s.activityFr : s.activityEn}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </HkSection>
      </HkPage>
    </HkShell>
  );
}
