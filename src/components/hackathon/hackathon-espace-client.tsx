"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  HackathonPhaseStepper,
  deriveCurrentPhaseId,
} from "@/components/hackathon/hackathon-phase-stepper";
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
import type { HubPayloadOk } from "@/lib/hackathon/hub-types";
import { phaseUnlocks } from "@/lib/hackathon/phases";

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
  const [now, setNow] = useState<number | null>(null);
  const [subForm, setSubForm] = useState({
    demoUrl: initial.submission?.demoUrl ?? "",
    githubUrl: initial.submission?.githubUrl ?? "",
    figmaUrl: initial.submission?.figmaUrl ?? "",
    pitchPdfUrl: initial.submission?.pitchPdfUrl ?? "",
    notes: initial.submission?.notes ?? "",
  });

  const isLead = data.memberRole === "lead";
  const currentPhase = deriveCurrentPhaseId({
    isPaid: data.isPaid,
    hasRegistration: Boolean(data.registration),
    teamStatus: data.team?.status ?? null,
    hasChallenge: Boolean(data.team?.challengeId),
    rulesAccepted: Boolean(data.team?.rulesAcceptedAt),
    hasOpenMentorRequest: data.mentorRequests.some(
      (m) => m.status === "open" || m.status === "accepted",
    ),
  });
  const unlocks = phaseUnlocks({
    isPaid: data.isPaid,
    teamStatus: data.team?.status ?? null,
    hasChallenge: Boolean(data.team?.challengeId),
    rulesAccepted: Boolean(data.team?.rulesAcceptedAt),
  });

  useEffect(() => {
    const updateNow = () => setNow(Date.now());
    updateNow();
    const timer = window.setInterval(updateNow, 60_000);
    return () => window.clearInterval(timer);
  }, []);

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
      const formData = new FormData();
      formData.set("file", file);
      const res = await fetch("/api/hackathon/submissions/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "upload_failed");
        return;
      }
      setSubForm((form) => ({ ...form, pitchPdfUrl: json.url }));
    } finally {
      setBusy(false);
    }
  }

  const countdown = useMemo(() => {
    if (!data.edition.submissionDeadlineAt || now === null) return null;
    const deadline = new Date(data.edition.submissionDeadlineAt);
    const ms = deadline.getTime() - now;
    if (ms <= 0) return isFr ? "Deadline passée" : "Deadline passed";
    const hours = Math.floor(ms / 3_600_000);
    const minutes = Math.floor((ms % 3_600_000) / 60_000);
    return isFr ? `${hours}h ${minutes}m restantes` : `${hours}h ${minutes}m left`;
  }, [data.edition.submissionDeadlineAt, isFr, now]);

  const isSubmitted = data.team?.status === "submitted";
  const isPresented = data.team?.status === "presented";
  const isJudged = data.team?.status === "judged";

  return (
    <HkShell authReturnPath="/hackathon/espace">
      <HkPage
        eyebrow={isFr ? "Espace participant" : "Participant hub"}
        title={isFr ? data.edition.nameFr : data.edition.nameEn}
        lede={
          isFr
            ? "Votre parcours, votre équipe et vos livrables réunis au même endroit."
            : "Your journey, team and deliverables in one place."
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

        <div id="phase-registration">
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
                {isFr ? "Vous n'êtes pas encore inscrit." : "You are not registered yet."}{" "}
                <Link
                  href="/hackathon#register"
                  className="font-semibold text-[color:var(--hk-accent,var(--fd-primary))] hover:underline"
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
                    - {isFr ? "présence" : "presence"}: {data.registration.presenceStatus}
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
        </div>

        <HkSection
          title={isFr ? "Parcours" : "Journey"}
          hint={
            isFr
              ? "Suivez les étapes du hackathon et accédez directement à la prochaine action."
              : "Follow the hackathon stages and jump directly to your next action."
          }
        >
          <HackathonPhaseStepper isFr={isFr} currentId={currentPhase} />
        </HkSection>

        {data.announcements.length > 0 ? (
          <HkSection title={isFr ? "Annonces" : "Announcements"}>
            {data.announcements.slice(0, 5).map((announcement) => (
              <article
                key={announcement.id}
                className="rounded-xl bg-[color:var(--hk-page,var(--fd-bg))] px-4 py-3 ring-1 ring-[color:var(--hk-border,var(--fd-border))]"
              >
                <div className="flex flex-wrap items-center gap-2">
                  {announcement.pinned ? (
                    <HkStatusPill tone="accent">
                      {isFr ? "Épinglé" : "Pinned"}
                    </HkStatusPill>
                  ) : null}
                  <p className="font-bold text-[color:var(--hk-text,var(--fd-text))]">
                    {announcement.title}
                  </p>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-[color:var(--hk-muted,var(--fd-muted))]">
                  {announcement.body}
                </p>
              </article>
            ))}
          </HkSection>
        ) : null}

        <div id="phase-bootcamp">
          <HkSection title={isFr ? "Programme" : "Program"}>
            {data.program.map((day) => (
              <div key={day.day} className="space-y-2">
                <div>
                  <p className="text-sm font-bold text-[color:var(--hk-text,var(--fd-text))]">
                    {isFr ? day.labelFr : day.labelEn}
                  </p>
                  <p className="text-xs text-[color:var(--hk-muted,var(--fd-muted))]">
                    {isFr ? day.subtitleFr : day.subtitleEn}
                  </p>
                </div>
                <ul className="space-y-1.5">
                  {day.slots.map((slot) => (
                    <li
                      key={slot.time}
                      className="grid grid-cols-[7.5rem_1fr] gap-2 text-sm"
                    >
                      <span className="font-mono text-xs text-[color:var(--hk-accent,var(--fd-primary))]">
                        {slot.time}
                      </span>
                      <span className="text-[color:var(--hk-muted,var(--fd-muted))]">
                        {isFr ? slot.activityFr : slot.activityEn}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </HkSection>
        </div>

        <div id="phase-teams" className="space-y-5">
          <HkSection
            title={isFr ? "Équipe" : "Team"}
            hint={
              !data.isPaid
                ? isFr
                  ? "Le paiement est requis pour créer ou rejoindre une équipe."
                  : "Payment is required to create or join a team."
                : undefined
            }
            action={
              data.team ? (
                <HkStatusPill tone="accent">{data.team.status}</HkStatusPill>
              ) : null
            }
          >
            {!data.team ? (
              <div className="grid gap-6 sm:grid-cols-2">
                {unlocks.canFormTeam ? (
                  <div className="space-y-3">
                    <HkLabel>{isFr ? "Créer une équipe" : "Create a team"}</HkLabel>
                    <HkInput
                      value={teamName}
                      onChange={(event) => setTeamName(event.target.value)}
                      placeholder={isFr ? "Nom de l'équipe" : "Team name"}
                    />
                    <label className="flex items-center gap-2 text-sm text-[color:var(--hk-text,var(--fd-text))]">
                      <input
                        type="checkbox"
                        checked={isSolo}
                        onChange={(event) => setIsSolo(event.target.checked)}
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
                      {isFr ? "Créer l'équipe" : "Create team"}
                    </HkBtn>
                  </div>
                ) : null}
                <div
                  className={
                    unlocks.canFormTeam
                      ? "space-y-3 border-t border-[color:var(--hk-border,var(--fd-border))] pt-6 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0"
                      : "space-y-3 sm:col-span-2"
                  }
                >
                  <HkLabel>{isFr ? "Rejoindre une équipe" : "Join a team"}</HkLabel>
                  <HkInput
                    value={inviteCode}
                    onChange={(event) => setInviteCode(event.target.value)}
                    placeholder="MBT-..."
                    className="uppercase"
                    disabled={!data.isPaid}
                  />
                  <HkBtn
                    variant="secondary"
                    disabled={!data.isPaid || busy || inviteCode.trim().length < 4}
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
                  {data.team.members.map((member) => (
                    <li
                      key={member.id}
                      className="flex items-center justify-between rounded-xl bg-[color:var(--hk-page,var(--fd-bg))] px-3 py-2 text-sm"
                    >
                      <span className="font-medium text-[color:var(--hk-text,var(--fd-text))]">
                        {member.firstName} {member.lastName}
                      </span>
                      <HkStatusPill>{member.role}</HkStatusPill>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap items-center gap-2">
                  {isLead && !data.team.rulesAcceptedAt ? (
                    <HkBtn
                      disabled={busy}
                      onClick={() => postAction({ action: "accept_rules" })}
                    >
                      {isFr ? "Accepter le règlement" : "Accept the rules"}
                    </HkBtn>
                  ) : null}
                  {data.team.rulesAcceptedAt ? (
                    <HkStatusPill tone="ok">
                      {isFr ? "Règlement accepté" : "Rules accepted"}
                    </HkStatusPill>
                  ) : null}
                  <div>
                    <HkBtn
                      variant="secondary"
                      disabled={busy || !unlocks.canStartBuild}
                      onClick={() => postAction({ action: "mark_building" })}
                    >
                      {isFr ? "Démarrer le build" : "Start building"}
                    </HkBtn>
                    {!unlocks.canStartBuild ? (
                      <p className="mt-1 text-xs text-[color:var(--hk-muted,var(--fd-muted))]">
                        {isFr
                          ? "Choisissez un défi et acceptez le règlement d'abord"
                          : "Choose a challenge and accept the rules first"}
                      </p>
                    ) : null}
                  </div>
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
                    {isFr ? data.team.challenge.labelFr : data.team.challenge.labelEn}
                  </HkStatusPill>
                ) : null
              }
            >
              {isLead ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {data.challenges.map((challenge) => {
                    const active = data.team?.challengeId === challenge.id;
                    return (
                      <button
                        key={challenge.id}
                        type="button"
                        disabled={busy || !unlocks.canPickChallenge}
                        onClick={() =>
                          postAction({
                            action: "challenge",
                            challengeId: challenge.id,
                          })
                        }
                        className={`rounded-xl px-3.5 py-3 text-left transition ring-1 disabled:cursor-not-allowed disabled:opacity-50 ${
                          active
                            ? "bg-[color:var(--hk-soft,var(--fd-mint))] ring-[color:var(--hk-accent,var(--fd-primary))]"
                            : "bg-[color:var(--hk-page,var(--fd-bg))] ring-[color:var(--hk-border,var(--fd-border))] hover:ring-[color:var(--hk-accent,var(--fd-primary))]/40"
                        }`}
                      >
                        <span className="block text-sm font-bold text-[color:var(--hk-text,var(--fd-text))]">
                          {isFr ? challenge.labelFr : challenge.labelEn}
                        </span>
                        {(isFr ? challenge.blurbFr : challenge.blurbEn) ? (
                          <span className="mt-1 block text-xs text-[color:var(--hk-muted,var(--fd-muted))]">
                            {isFr ? challenge.blurbFr : challenge.blurbEn}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ) : data.team.challenge ? (
                <p className="text-sm text-[color:var(--hk-text,var(--fd-text))]">
                  {isFr ? data.team.challenge.labelFr : data.team.challenge.labelEn}
                </p>
              ) : (
                <p className="text-sm text-[color:var(--hk-muted,var(--fd-muted))]">
                  {isFr ? "Pas encore de défi." : "No challenge selected yet."}
                </p>
              )}
            </HkSection>
          ) : null}
        </div>

        {data.team && data.isPaid ? (
          <div id="phase-development">
            <HkSection
              title={isFr ? "Développement et livrables" : "Development and deliverables"}
              hint={
                isFr
                  ? "Ajoutez les liens de votre prototype. Le mentorat vient ensuite pour vous aider à avancer."
                  : "Add your prototype links. Mentoring comes next to help you move forward."
              }
              action={
                <div className="flex flex-wrap items-center gap-2">
                  <HkStatusPill>{data.submission?.status ?? "draft"}</HkStatusPill>
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
                    onChange={(event) =>
                      setSubForm((form) => ({ ...form, [key]: event.target.value }))
                    }
                    placeholder="https://"
                  />
                </div>
              ))}
              <div className="space-y-1.5">
                <HkLabel>Pitch PDF</HkLabel>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  className="block w-full text-sm text-[color:var(--hk-muted,var(--fd-muted))]"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadPitch(file);
                  }}
                />
                {subForm.pitchPdfUrl ? (
                  <a
                    href={subForm.pitchPdfUrl}
                    className="inline-block text-sm font-semibold text-[color:var(--hk-accent,var(--fd-primary))] hover:underline"
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
                  onChange={(event) =>
                    setSubForm((form) => ({ ...form, notes: event.target.value }))
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
                  {isFr ? "Enregistrer le brouillon" : "Save draft"}
                </HkBtn>
                <HkBtn
                  disabled={busy || !unlocks.canSubmitDeliverables}
                  onClick={() => saveSubmission("submit")}
                >
                  {isFr ? "Soumettre" : "Submit"}
                </HkBtn>
              </div>
            </HkSection>
          </div>
        ) : null}

        {data.team && data.isPaid ? (
          <div id="phase-mentoring">
            <HkSection
              title={isFr ? "Mentorat" : "Mentorship"}
              hint={
                !unlocks.canRequestMentor
                  ? isFr
                    ? "Le mentorat est disponible après le choix du défi et l'acceptation du règlement."
                    : "Mentorship becomes available after selecting a challenge and accepting the rules."
                  : undefined
              }
            >
              <div className="flex flex-col gap-2 sm:flex-row">
                <HkInput
                  value={mentorTopic}
                  onChange={(event) => setMentorTopic(event.target.value)}
                  placeholder={
                    isFr ? "Sujet - ex. UX, API pawaPay" : "Topic - e.g. UX, APIs"
                  }
                  className="flex-1"
                  disabled={!unlocks.canRequestMentor}
                />
                <HkBtn
                  disabled={
                    busy ||
                    !unlocks.canRequestMentor ||
                    mentorTopic.trim().length < 2
                  }
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
                  {data.mentorRequests.map((request) => (
                    <li
                      key={request.id}
                      className="flex items-center justify-between rounded-xl bg-[color:var(--hk-page,var(--fd-bg))] px-3 py-2 text-sm"
                    >
                      <span>{request.topic}</span>
                      <HkStatusPill>{request.status}</HkStatusPill>
                    </li>
                  ))}
                </ul>
              ) : null}
            </HkSection>
          </div>
        ) : null}

        <div id="phase-pitch">
          <HkSection
            title={isFr ? "Pitch" : "Pitch"}
            hint={
              isSubmitted
                ? isFr
                  ? "Vos livrables sont soumis - préparez votre présentation Demo Day."
                  : "Your deliverables are submitted - prepare your Demo Day presentation."
                : isFr
                  ? "Soumettez vos livrables pour passer à l'étape pitch."
                  : "Submit your deliverables to move on to the pitch stage."
            }
            action={
              isSubmitted ? (
                <HkStatusPill tone="ok">
                  {isFr ? "Soumis" : "Submitted"}
                </HkStatusPill>
              ) : null
            }
          >
            <p className="text-sm text-[color:var(--hk-muted,var(--fd-muted))]">
              {isSubmitted
                ? isFr
                  ? "Votre équipe est dans la file de présentation."
                  : "Your team is in the presentation queue."
                : isFr
                  ? "Le statut de soumission apparaîtra ici une fois les livrables envoyés."
                  : "Your submission status will appear here once deliverables are sent."}
            </p>
          </HkSection>
        </div>

        <div id="phase-deliberation">
          <HkSection
            title={isFr ? "Délibération du jury" : "Jury deliberation"}
            hint={
              isPresented || isJudged
                ? isFr
                  ? "Le jury évalue les projets selon la grille officielle."
                  : "The jury is evaluating projects against the official rubric."
                : isFr
                  ? "Cette étape s'ouvre après votre pitch."
                  : "This stage opens after your pitch."
            }
          >
            <p className="text-sm text-[color:var(--hk-muted,var(--fd-muted))]">
              {isFr
                ? "Les résultats seront communiqués par l'organisation."
                : "Results will be communicated by the organizers."}
              {unlocks.showJuryLink ? (
                <>
                  {" "}
                  <Link
                    href="/hackathon/jury"
                    className="font-semibold text-[color:var(--hk-accent,var(--fd-primary))] hover:underline"
                  >
                    {isFr ? "Voir l'espace jury" : "View jury space"}
                  </Link>
                </>
              ) : null}
            </p>
          </HkSection>
        </div>

        <div id="phase-awards">
          <HkSection
            title={isFr ? "Remise des prix" : "Awards"}
            hint={
              isJudged
                ? isFr
                  ? "Votre parcours de jury est terminé."
                  : "Your jury journey is complete."
                : isFr
                  ? "Les gagnants seront annoncés après la délibération."
                  : "Winners will be announced after deliberation."
            }
          >
            <p className="text-sm text-[color:var(--hk-muted,var(--fd-muted))]">
              {isJudged
                ? isFr
                  ? "Restez attentif aux annonces pour la remise des prix et les prochaines opportunités."
                  : "Watch announcements for awards and next opportunities."
                : isFr
                  ? "Les annonces et le live wall partageront les résultats."
                  : "Announcements and the live wall will share the results."}
              {unlocks.showJuryLink ? (
                <>
                  {" "}
                  <Link
                    href="/hackathon/jury"
                    className="font-semibold text-[color:var(--hk-accent,var(--fd-primary))] hover:underline"
                  >
                    {isFr ? "Espace jury" : "Jury space"}
                  </Link>
                </>
              ) : null}
            </p>
          </HkSection>
        </div>
      </HkPage>
    </HkShell>
  );
}
