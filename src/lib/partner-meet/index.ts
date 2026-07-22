import { eq } from "drizzle-orm";
import { getDb, partnerMeets, users } from "@/db";
import { getAppAbsoluteUrl } from "@/lib/app-url";
import {
  appendJitsiJwtToUrl,
  appendJitsiUserToUrl,
  appendMcbLiveReturnUrl,
  isAcademyJitsiJwtEnabled,
  jitsiModeratorForMode,
  liveRoomNameFromSessionSlug,
  signAcademyJitsiToken,
} from "@/lib/academy-jitsi-token";
import { buildJitsiLowBandwidthHash, type LiveJoinMode } from "@/lib/academy-live";
import { recordJitsiAccess } from "@/lib/jitsi-access-audit";
import { UserRole, type UserRoleType } from "@/lib/roles";

export type PartnerMeetStatus =
  | "proposed"
  | "confirmed"
  | "done"
  | "cancelled";

export type PartnerMeetRow = typeof partnerMeets.$inferSelect;

export type CreatePartnerMeetInput = {
  slug: string;
  title: string;
  partnerName: string;
  partnerEmail: string;
  hostEmail: string;
  durationMinutes?: number;
  agenda?: string[];
  allowlistEmails?: string[];
  timezone?: string;
  notes?: string;
  scheduledAt?: Date | null;
  status?: PartnerMeetStatus;
  createdBy?: string | null;
};

function liveBase(): string {
  return (
    process.env.NEXT_PUBLIC_ACADEMY_LIVE_BASE_URL?.trim() ||
    process.env.ACADEMY_LIVE_BASE_URL?.trim() ||
    "https://live.mcbuleli.org"
  ).replace(/\/$/, "");
}

export function partnerMeetRoomSlug(slug: string): string {
  return liveRoomNameFromSessionSlug(`partner-${slug}`);
}

export function partnerMeetLandingPath(slug: string): string {
  return `/meet/${slug}`;
}

export function partnerMeetJoinPath(slug: string): string {
  return `/meet/${slug}/join`;
}

export function partnerMeetHostPath(slug: string): string {
  return `/meet/${slug}/host`;
}

export function partnerMeetPublicUrl(slug: string): string {
  return getAppAbsoluteUrl(partnerMeetLandingPath(slug));
}

function normEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Built-in meets so landing never 404s before DB seed / migration. */
export const PARTNER_MEET_CATALOG: Record<string, CreatePartnerMeetInput> = {
  "kilelo-partenariat": {
    slug: "kilelo-partenariat",
    title: "McBuleli × Kilelo - RDV partenariat",
    partnerName: "Kilelo",
    partnerEmail: "support@kileloapp.com",
    hostEmail: "ceo@mcbuleli.org",
    durationMinutes: 30,
    status: "proposed",
    allowlistEmails: [
      "support@kileloapp.com",
      "ceo@mcbuleli.org",
      "hi@mcbuleli.org",
    ],
    agenda: [
      "Attentes de part et d'autre pour le McBuleli Hackathon",
      "Rôle Kilelo : talk / mentorat marketplace & confiance",
      "Déroulement des 3 jours et logistique Demo Day",
      "Prochaines étapes (logo, créneau talk, contact référent)",
    ],
    notes: "Réponse à Jeancy Kabangu - visio 20-30 min sur McBuleli Meet.",
  },
};

const CATALOG_IDS: Record<string, string> = {
  "kilelo-partenariat": "a1b2c3d4-e5f6-4a70-8b9c-0d1e2f3a4b5c",
};

export function partnerMeetFromCatalog(
  slug: string,
): PartnerMeetRow | null {
  const key = liveRoomNameFromSessionSlug(slug);
  const input = PARTNER_MEET_CATALOG[key];
  if (!input) return null;
  const now = new Date();
  return {
    id: CATALOG_IDS[key] ?? "00000000-0000-4000-8000-000000000001",
    slug: key,
    title: input.title,
    partnerName: input.partnerName,
    partnerEmail: normEmail(input.partnerEmail),
    hostEmail: normEmail(input.hostEmail),
    scheduledAt: input.scheduledAt ?? null,
    durationMinutes: input.durationMinutes ?? 30,
    roomSlug: partnerMeetRoomSlug(key),
    status: input.status ?? "proposed",
    agenda: input.agenda ?? [],
    allowlistEmails: (input.allowlistEmails ?? []).map(normEmail),
    timezone: input.timezone ?? "Africa/Kinshasa",
    notes: input.notes ?? null,
    createdBy: null,
    createdAt: now,
    updatedAt: now,
  };
}

export async function getPartnerMeetBySlug(
  slug: string,
): Promise<PartnerMeetRow | null> {
  const key = liveRoomNameFromSessionSlug(slug.trim());
  if (!key) return null;
  try {
    const [row] = await getDb()
      .select()
      .from(partnerMeets)
      .where(eq(partnerMeets.slug, key))
      .limit(1);
    if (row) return row;
  } catch (err) {
    console.warn("[partner-meet] getBySlug failed (table missing?)", err);
  }
  return null;
}

/** DB row if present, else catalog; tries upsert when catalog hit. */
export async function ensurePartnerMeet(
  slug: string,
): Promise<PartnerMeetRow | null> {
  const key = liveRoomNameFromSessionSlug(slug.trim());
  if (!key) return null;

  const existing = await getPartnerMeetBySlug(key);
  if (existing) return existing;

  const catalogInput = PARTNER_MEET_CATALOG[key];
  if (!catalogInput) return null;

  try {
    return await upsertPartnerMeet(catalogInput);
  } catch (err) {
    console.warn("[partner-meet] upsert failed, using catalog fallback", err);
    return partnerMeetFromCatalog(key);
  }
}

export async function createPartnerMeet(
  input: CreatePartnerMeetInput,
): Promise<
  { ok: true; meet: PartnerMeetRow } | { ok: false; code: string }
> {
  const slug = liveRoomNameFromSessionSlug(input.slug);
  if (!slug) return { ok: false, code: "partner_meet_invalid_slug" };

  const existing = await getPartnerMeetBySlug(slug);
  if (existing) return { ok: false, code: "partner_meet_slug_taken" };

  const roomSlug = partnerMeetRoomSlug(slug);
  const [row] = await getDb()
    .insert(partnerMeets)
    .values({
      slug,
      title: input.title.trim(),
      partnerName: input.partnerName.trim(),
      partnerEmail: normEmail(input.partnerEmail),
      hostEmail: normEmail(input.hostEmail),
      durationMinutes: input.durationMinutes ?? 30,
      roomSlug,
      agenda: input.agenda ?? [],
      allowlistEmails: (input.allowlistEmails ?? []).map(normEmail),
      timezone: input.timezone ?? "Africa/Kinshasa",
      notes: input.notes?.trim() || null,
      scheduledAt: input.scheduledAt ?? null,
      status: input.status ?? "proposed",
      createdBy: input.createdBy ?? null,
    })
    .returning();

  if (!row) return { ok: false, code: "partner_meet_create_failed" };
  return { ok: true, meet: row };
}

export async function upsertPartnerMeet(
  input: CreatePartnerMeetInput,
): Promise<PartnerMeetRow> {
  const slug = liveRoomNameFromSessionSlug(input.slug);
  const existing = await getPartnerMeetBySlug(slug);
  if (existing) {
    const [updated] = await getDb()
      .update(partnerMeets)
      .set({
        title: input.title.trim(),
        partnerName: input.partnerName.trim(),
        partnerEmail: normEmail(input.partnerEmail),
        hostEmail: normEmail(input.hostEmail),
        durationMinutes: input.durationMinutes ?? existing.durationMinutes,
        agenda: input.agenda ?? existing.agenda,
        allowlistEmails: (input.allowlistEmails ?? existing.allowlistEmails).map(
          normEmail,
        ),
        timezone: input.timezone ?? existing.timezone,
        notes: input.notes?.trim() ?? existing.notes,
        scheduledAt:
          input.scheduledAt !== undefined
            ? input.scheduledAt
            : existing.scheduledAt,
        status: input.status ?? existing.status,
        updatedAt: new Date(),
      })
      .where(eq(partnerMeets.id, existing.id))
      .returning();
    return updated ?? existing;
  }
  const created = await createPartnerMeet(input);
  if (!created.ok) throw new Error(created.code);
  return created.meet;
}

function isStaffRole(role: UserRoleType | null | undefined): boolean {
  return role === UserRole.AGENT || role === UserRole.SUPER_ADMIN;
}

export function canAccessPartnerMeet(args: {
  userEmail: string;
  appRole: UserRoleType | null | undefined;
  meet: PartnerMeetRow;
}): boolean {
  if (isStaffRole(args.appRole)) return true;
  const email = normEmail(args.userEmail);
  if (email === normEmail(args.meet.hostEmail)) return true;
  if (email === normEmail(args.meet.partnerEmail)) return true;
  const allow = args.meet.allowlistEmails ?? [];
  if (allow.some((e) => normEmail(e) === email)) return true;
  return false;
}

export function canHostPartnerMeet(args: {
  userEmail: string;
  appRole: UserRoleType | null | undefined;
  meet: PartnerMeetRow;
}): boolean {
  if (isStaffRole(args.appRole)) return true;
  return normEmail(args.userEmail) === normEmail(args.meet.hostEmail);
}

function buildPartnerRoomUrl(args: {
  roomSlug: string;
  title: string;
  mode: LiveJoinMode;
}): string {
  const room = liveRoomNameFromSessionSlug(args.roomSlug);
  const hash = buildJitsiLowBandwidthHash(args.mode, {
    sessionTitle: args.title,
    sessionSlug: room,
  });
  return `${liveBase()}/${room}${hash}`;
}

export async function resolvePartnerMeetJoinUrl(args: {
  userId: string;
  userEmail: string;
  displayName: string;
  appRole: UserRoleType | null | undefined;
  meet: PartnerMeetRow;
  mode: LiveJoinMode;
  req?: Request | null;
}): Promise<{ ok: true; url: string } | { ok: false; code: string }> {
  if (args.meet.status === "cancelled" || args.meet.status === "done") {
    return { ok: false, code: "partner_meet_closed" };
  }

  const wantsHost = args.mode === "host";
  if (wantsHost) {
    if (!canHostPartnerMeet(args)) {
      return { ok: false, code: "partner_meet_host_forbidden" };
    }
  } else if (!canAccessPartnerMeet(args)) {
    return { ok: false, code: "partner_meet_forbidden" };
  }

  const effectiveMode: LiveJoinMode = wantsHost
    ? "host"
    : args.mode === "audio"
      ? "audio"
      : "learner";

  let url = buildPartnerRoomUrl({
    roomSlug: args.meet.roomSlug,
    title: args.meet.title,
    mode: effectiveMode,
  });

  if (isAcademyJitsiJwtEnabled()) {
    const room = liveRoomNameFromSessionSlug(args.meet.roomSlug);
    const jwt = await signAcademyJitsiToken({
      userId: args.userId,
      displayName: args.displayName,
      room,
      moderator: jitsiModeratorForMode(effectiveMode),
    });
    url = appendJitsiJwtToUrl(url, jwt);
  }

  url = appendJitsiUserToUrl(url, args.displayName);
  url = appendMcbLiveReturnUrl(
    url,
    getAppAbsoluteUrl(partnerMeetLandingPath(args.meet.slug)),
  );

  recordJitsiAccess({
    userId: args.userId,
    room: liveRoomNameFromSessionSlug(args.meet.roomSlug),
    editionId: null,
    sessionSlug: args.meet.slug,
    mode: effectiveMode === "host" ? "host" : effectiveMode === "audio" ? "audio" : "learner",
    moderator: jitsiModeratorForMode(effectiveMode),
    req: args.req,
  });

  return { ok: true, url };
}

export async function resolveUserEmail(userId: string): Promise<string | null> {
  const [row] = await getDb()
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row?.email ?? null;
}
