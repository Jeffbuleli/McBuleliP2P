import { randomBytes } from "node:crypto";
import { and, asc, desc, eq } from "drizzle-orm";
import {
  getDb,
  hackathonAccessEvents,
  hackathonEditions,
  hackathonPartnerPasses,
  hackathonPartners,
  hackathonRegistrations,
} from "@/db";
import { CANONICAL_PRODUCTION_ORIGIN } from "@/lib/app-url";
import { getSessionUser } from "@/lib/session-user";

/** Only this McBuleli staff mailbox may open any badge (plus the pass owner). */
export const HACKATHON_BADGE_STAFF_EMAIL = "ceo@mcbuleli.org";

export function isHackathonBadgeStaffEmail(
  email: string | null | undefined,
): boolean {
  return (
    (email?.trim().toLowerCase() ?? "") === HACKATHON_BADGE_STAFF_EMAIL
  );
}

export type PresenceStatus = "absent" | "inside" | "outside";
export type AccessSubjectType = "participant" | "partner";
export type AccessEventType = "in" | "out";
export type PassSource = "registration" | "partner_form" | "partner_seat";

export type ResolvedPass = {
  subjectType: AccessSubjectType;
  subjectId: string;
  editionId: string;
  ticketCode: string;
  displayName: string;
  orgOrEmail: string;
  presenceStatus: PresenceStatus;
  checkedInAt: Date | null;
  valid: boolean;
  invalidReason?: string;
  /** Email allowed to view this badge (exclusive owner gate). */
  ownerEmail: string | null;
  ownerUserId: string | null;
  roleLabel: string | null;
  badgeKind: string | null;
  passSource: PassSource;
};

export function generatePartnerTicketCode(): string {
  return `MBP-${randomBytes(5).toString("hex").toUpperCase()}`;
}

/** Canonical public badge URL (participants + partners). */
export function passPublicUrl(code: string): string {
  const origin =
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ||
    CANONICAL_PRODUCTION_ORIGIN;
  return `${origin}/hackathon/pass/${encodeURIComponent(code)}`;
}

/** Extract MBH-/MBP- code from raw QR text or bare code. */
export function extractPassCode(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;
  try {
    if (/^https?:\/\//i.test(text)) {
      const u = new URL(text);
      const m = u.pathname.match(
        /\/hackathon\/(?:pass|ticket)\/([^/?#]+)/i,
      );
      if (m?.[1]) return decodeURIComponent(m[1]).trim().toUpperCase();
    }
  } catch {
    /* fall through */
  }
  const bare = text.replace(/\s+/g, "").toUpperCase();
  if (/^(MBH|MBP)-[A-Z0-9]+$/i.test(bare)) return bare;
  if (/^[A-Z0-9-]{6,32}$/i.test(bare)) return bare;
  return null;
}

/** Day 1..2 from edition startDate (Africa/Kinshasa calendar). */
export function eventDayIndex(
  edition: { startDate: Date | null } | null | undefined,
  now = new Date(),
): 1 | 2 {
  if (!edition?.startDate) return 1;
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Kinshasa",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const today = fmt.format(now);
  const start = fmt.format(edition.startDate);
  const t0 = Date.parse(`${start}T00:00:00+01:00`);
  const t1 = Date.parse(`${today}T00:00:00+01:00`);
  if (!Number.isFinite(t0) || !Number.isFinite(t1)) return 1;
  const diffDays = Math.floor((t1 - t0) / 86_400_000);
  if (diffDays <= 0) return 1;
  return 2;
}

export async function resolvePassByCode(
  code: string,
): Promise<ResolvedPass | null> {
  const db = getDb();
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;

  const [reg] = await db
    .select()
    .from(hackathonRegistrations)
    .where(eq(hackathonRegistrations.ticketCode, normalized))
    .limit(1);

  if (reg) {
    const paid = reg.paymentStatus === "paid";
    return {
      subjectType: "participant",
      subjectId: reg.id,
      editionId: reg.editionId,
      ticketCode: normalized,
      displayName: `${reg.firstName} ${reg.lastName}`.trim(),
      orgOrEmail: reg.email,
      presenceStatus: (reg.presenceStatus as PresenceStatus) || "absent",
      checkedInAt: reg.checkedInAt,
      valid: paid,
      invalidReason: paid ? undefined : "unpaid",
      ownerEmail: reg.email,
      ownerUserId: reg.userId,
      roleLabel: null,
      badgeKind: "ticket",
      passSource: "registration",
    };
  }

  const [partner] = await db
    .select()
    .from(hackathonPartners)
    .where(eq(hackathonPartners.ticketCode, normalized))
    .limit(1);

  if (partner) {
    const confirmed = partner.status === "confirmed";
    return {
      subjectType: "partner",
      subjectId: partner.id,
      editionId: partner.editionId,
      ticketCode: normalized,
      displayName: partner.contactName,
      orgOrEmail: partner.orgName,
      presenceStatus: (partner.presenceStatus as PresenceStatus) || "absent",
      checkedInAt: partner.checkedInAt,
      valid: confirmed,
      invalidReason: confirmed ? undefined : "not_confirmed",
      ownerEmail: partner.email,
      ownerUserId: null,
      roleLabel: "Partenaire",
      badgeKind: "partner",
      passSource: "partner_form",
    };
  }

  const { findPassByTicketCode } = await import(
    "@/lib/hackathon/partner-passes"
  );
  const seat = await findPassByTicketCode(normalized);
  if (seat?.pass) {
    const p = seat.pass;
    const active = p.status === "active" && Boolean(p.ticketCode);
    return {
      subjectType: "partner",
      subjectId: p.id,
      editionId: p.editionId,
      ticketCode: normalized,
      displayName: p.holderName || seat.org.shortName,
      orgOrEmail: seat.org.orgName,
      presenceStatus: (p.presenceStatus as PresenceStatus) || "absent",
      checkedInAt: p.checkedInAt,
      valid: active,
      invalidReason: active ? undefined : "not_assigned",
      ownerEmail: p.holderEmail,
      ownerUserId: p.ownerUserId,
      roleLabel: p.roleLabel,
      badgeKind: p.badgeKind,
      passSource: "partner_seat",
    };
  }

  return null;
}

/** Exclusive badge view: pass owner or ceo@mcbuleli.org only (not every agent). */
export async function canViewPass(
  pass: ResolvedPass,
): Promise<{ ok: true; staff: boolean } | { ok: false; reason: "login_required" | "forbidden" }> {
  const session = await getSessionUser();
  if (!session) return { ok: false, reason: "login_required" };

  const sessionEmail = session.email?.trim().toLowerCase() ?? "";
  if (isHackathonBadgeStaffEmail(sessionEmail)) {
    return { ok: true, staff: true };
  }

  if (pass.ownerUserId && pass.ownerUserId === session.id) {
    return { ok: true, staff: false };
  }
  const ownerEmail = pass.ownerEmail?.trim().toLowerCase() ?? "";
  if (sessionEmail && ownerEmail && sessionEmail === ownerEmail) {
    return { ok: true, staff: false };
  }
  return { ok: false, reason: "forbidden" };
}

export async function getPassByCode(code: string) {
  const pass = await resolvePassByCode(code);
  if (!pass) return null;
  const db = getDb();
  const [edition] = await db
    .select()
    .from(hackathonEditions)
    .where(eq(hackathonEditions.id, pass.editionId))
    .limit(1);
  return { pass, edition: edition ?? null };
}

export async function ensurePartnerTicketCode(
  partnerId: string,
): Promise<string | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(hackathonPartners)
    .where(eq(hackathonPartners.id, partnerId))
    .limit(1);
  if (!row) return null;
  if (row.ticketCode) return row.ticketCode;
  if (row.status !== "confirmed") return null;

  let code = generatePartnerTicketCode();
  for (let i = 0; i < 5; i += 1) {
    try {
      await db
        .update(hackathonPartners)
        .set({ ticketCode: code })
        .where(eq(hackathonPartners.id, partnerId));
      return code;
    } catch {
      code = generatePartnerTicketCode();
    }
  }
  return null;
}

export async function recordAccessScan(args: {
  codeOrUrl: string;
  mode: AccessEventType;
  dayIndex: 1 | 2 | 3;
  staffId: string;
  note?: string | null;
}): Promise<
  | {
      ok: true;
      pass: ResolvedPass;
      previousStatus: PresenceStatus;
      presenceStatus: PresenceStatus;
      eventId: string;
    }
  | { ok: false; code: string; message: string }
> {
  const extracted = extractPassCode(args.codeOrUrl);
  if (!extracted) {
    return { ok: false, code: "invalid_code", message: "Code QR invalide" };
  }

  const pass = await resolvePassByCode(extracted);
  if (!pass) {
    return { ok: false, code: "not_found", message: "Badge introuvable" };
  }
  if (!pass.valid) {
    return {
      ok: false,
      code: pass.invalidReason ?? "invalid",
      message:
        pass.invalidReason === "unpaid"
          ? "Participant non payé"
          : "Partenaire non confirmé",
    };
  }

  const previousStatus = pass.presenceStatus;
  const nextStatus: PresenceStatus =
    args.mode === "in" ? "inside" : "outside";

  const db = getDb();
  const [event] = await db
    .insert(hackathonAccessEvents)
    .values({
      editionId: pass.editionId,
      subjectType: pass.subjectType,
      subjectId: pass.subjectId,
      ticketCode: pass.ticketCode,
      dayIndex: args.dayIndex,
      eventType: args.mode,
      scannedBy: args.staffId,
      note: args.note?.trim() || null,
    })
    .returning({ id: hackathonAccessEvents.id });

  const now = new Date();
  if (pass.subjectType === "participant") {
    await db
      .update(hackathonRegistrations)
      .set({
        presenceStatus: nextStatus,
        checkedInAt: pass.checkedInAt ?? (args.mode === "in" ? now : null),
        updatedAt: now,
      })
      .where(eq(hackathonRegistrations.id, pass.subjectId));

    if (args.mode === "in") {
      try {
        const { getMemberForRegistration, markTeamBuilding } = await import(
          "@/lib/hackathon/teams"
        );
        const membership = await getMemberForRegistration(pass.subjectId);
        if (
          membership?.team.challengeId &&
          membership.team.rulesAcceptedAt &&
          (membership.team.status === "forming" ||
            membership.team.status === "ready")
        ) {
          await markTeamBuilding(membership.team.id);
        }
      } catch (e) {
        console.warn("[hackathon] markTeamBuilding on check-in skipped", e);
      }
    }
  } else if (pass.passSource === "partner_seat") {
    await db
      .update(hackathonPartnerPasses)
      .set({
        presenceStatus: nextStatus,
        checkedInAt: pass.checkedInAt ?? (args.mode === "in" ? now : null),
        updatedAt: now,
      })
      .where(eq(hackathonPartnerPasses.id, pass.subjectId));
  } else {
    await db
      .update(hackathonPartners)
      .set({
        presenceStatus: nextStatus,
        checkedInAt: pass.checkedInAt ?? (args.mode === "in" ? now : null),
      })
      .where(eq(hackathonPartners.id, pass.subjectId));
  }

  return {
    ok: true,
    pass: { ...pass, presenceStatus: nextStatus },
    previousStatus,
    presenceStatus: nextStatus,
    eventId: event.id,
  };
}

export async function getAccessRoster(args: {
  editionId: string;
  dayIndex: 1 | 2 | 3;
}) {
  const db = getDb();

  const participants = await db
    .select({
      id: hackathonRegistrations.id,
      ticketCode: hackathonRegistrations.ticketCode,
      firstName: hackathonRegistrations.firstName,
      lastName: hackathonRegistrations.lastName,
      email: hackathonRegistrations.email,
      presenceStatus: hackathonRegistrations.presenceStatus,
      checkedInAt: hackathonRegistrations.checkedInAt,
      paymentStatus: hackathonRegistrations.paymentStatus,
    })
    .from(hackathonRegistrations)
    .where(
      and(
        eq(hackathonRegistrations.editionId, args.editionId),
        eq(hackathonRegistrations.paymentStatus, "paid"),
      ),
    )
    .orderBy(asc(hackathonRegistrations.lastName), asc(hackathonRegistrations.firstName))
    .limit(800);

  const partners = await db
    .select({
      id: hackathonPartners.id,
      ticketCode: hackathonPartners.ticketCode,
      contactName: hackathonPartners.contactName,
      orgName: hackathonPartners.orgName,
      email: hackathonPartners.email,
      presenceStatus: hackathonPartners.presenceStatus,
      checkedInAt: hackathonPartners.checkedInAt,
      status: hackathonPartners.status,
    })
    .from(hackathonPartners)
    .where(
      and(
        eq(hackathonPartners.editionId, args.editionId),
        eq(hackathonPartners.status, "confirmed"),
      ),
    )
    .orderBy(asc(hackathonPartners.orgName))
    .limit(200);

  const recent = await db
    .select()
    .from(hackathonAccessEvents)
    .where(
      and(
        eq(hackathonAccessEvents.editionId, args.editionId),
        eq(hackathonAccessEvents.dayIndex, args.dayIndex),
      ),
    )
    .orderBy(desc(hackathonAccessEvents.scannedAt))
    .limit(40);

  return {
    participants: participants.map((p) => ({
      subjectType: "participant" as const,
      subjectId: p.id,
      ticketCode: p.ticketCode,
      displayName: `${p.firstName} ${p.lastName}`.trim(),
      orgOrEmail: p.email,
      presenceStatus: (p.presenceStatus as PresenceStatus) || "absent",
      checkedInAt: p.checkedInAt,
    })),
    partners: partners.map((p) => ({
      subjectType: "partner" as const,
      subjectId: p.id,
      ticketCode: p.ticketCode,
      displayName: p.contactName,
      orgOrEmail: p.orgName,
      presenceStatus: (p.presenceStatus as PresenceStatus) || "absent",
      checkedInAt: p.checkedInAt,
    })),
    recentEvents: recent,
  };
}

export function rosterBuckets<
  T extends { presenceStatus: PresenceStatus },
>(rows: T[]) {
  return {
    absent: rows.filter((r) => r.presenceStatus === "absent"),
    inside: rows.filter((r) => r.presenceStatus === "inside"),
    outside: rows.filter((r) => r.presenceStatus === "outside"),
  };
}
