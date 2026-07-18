import { and, eq } from "drizzle-orm";
import { z } from "zod";
import {
  getDb,
  hackathonEditions,
  hackathonPartners,
  hackathonRegistrations,
  hackathonSponsors,
} from "@/db";
import { getSessionUserId } from "@/lib/session";
import {
  HACKATHON_PARTNERSHIP_TYPES,
  HACKATHON_SPONSOR_PACKS,
} from "@/lib/hackathon/constants";
import {
  initiateHackathonCardPayment,
  initiateHackathonMomoPayment,
} from "@/lib/hackathon/payments";
import { sendHackathonPartnerAckEmail } from "@/lib/email/messages/hackathon";
import { sendHackathonSponsorAckEmail } from "@/lib/email/messages/hackathon";

export const registerBodyZ = z.object({
  editionId: z.string().uuid().optional(),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(6).max(40),
  whatsapp: z.string().trim().max(40).optional(),
  city: z.string().trim().max(120).optional(),
  profession: z.string().trim().max(120).optional(),
  company: z.string().trim().max(160).optional(),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  projectName: z.string().trim().max(200).optional(),
  projectDescription: z.string().trim().max(4000).optional(),
  projectCategory: z.string().trim().max(64).optional(),
  workMode: z.enum(["solo", "team"]).default("solo"),
  ticketPack: z.enum(["day1", "full"]),
  paymentMethod: z.enum(["orange", "mpesa", "airtel", "card", "usdt"]),
  locale: z.enum(["fr", "en"]).default("fr"),
});

export const partnerBodyZ = z.object({
  editionId: z.string().uuid().optional(),
  orgName: z.string().trim().min(1).max(200),
  contactName: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(40).optional(),
  website: z.string().trim().max(255).optional(),
  sector: z.string().trim().max(120).optional(),
  partnershipTypes: z
    .array(z.enum(HACKATHON_PARTNERSHIP_TYPES))
    .min(1)
    .max(12),
  contribution: z.string().trim().max(4000).optional(),
  locale: z.enum(["fr", "en"]).default("fr"),
});

export const sponsorBodyZ = z.object({
  editionId: z.string().uuid().optional(),
  companyName: z.string().trim().min(1).max(200),
  contactName: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(40).optional(),
  website: z.string().trim().max(255).optional(),
  pack: z.enum(HACKATHON_SPONSOR_PACKS),
  budgetNote: z.string().trim().max(2000).optional(),
  comment: z.string().trim().max(4000).optional(),
  locale: z.enum(["fr", "en"]).default("fr"),
});

async function resolveEditionId(editionId?: string) {
  const db = getDb();
  if (editionId) {
    const [row] = await db
      .select({ id: hackathonEditions.id, status: hackathonEditions.status })
      .from(hackathonEditions)
      .where(eq(hackathonEditions.id, editionId))
      .limit(1);
    return row ?? null;
  }
  const [featured] = await db
    .select({
      id: hackathonEditions.id,
      status: hackathonEditions.status,
      priceDay1Usd: hackathonEditions.priceDay1Usd,
      priceFullUsd: hackathonEditions.priceFullUsd,
      maxSeats: hackathonEditions.maxSeats,
    })
    .from(hackathonEditions)
    .where(eq(hackathonEditions.featured, true))
    .limit(1);
  if (featured) return featured;
  const [any] = await db.select().from(hackathonEditions).limit(1);
  return any
    ? {
        id: any.id,
        status: any.status,
        priceDay1Usd: any.priceDay1Usd,
        priceFullUsd: any.priceFullUsd,
        maxSeats: any.maxSeats,
      }
    : null;
}

export async function registerParticipant(raw: unknown) {
  const parsed = registerBodyZ.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: "invalid_body", status: 400 };
  }
  const data = parsed.data;

  if (data.paymentMethod === "usdt") {
    return { ok: false as const, error: "usdt_coming_soon", status: 400 };
  }

  const edition = await resolveEditionId(data.editionId);
  if (!edition) {
    return { ok: false as const, error: "no_edition", status: 404 };
  }
  if (edition.status === "closed") {
    return { ok: false as const, error: "registration_closed", status: 403 };
  }

  const db = getDb();
  const [fullEdition] = await db
    .select()
    .from(hackathonEditions)
    .where(eq(hackathonEditions.id, edition.id))
    .limit(1);
  if (!fullEdition) {
    return { ok: false as const, error: "no_edition", status: 404 };
  }

  const priceUsd =
    data.ticketPack === "day1"
      ? String(fullEdition.priceDay1Usd)
      : String(fullEdition.priceFullUsd);

  const userId = await getSessionUserId();

  const existing = await db
    .select({
      id: hackathonRegistrations.id,
      paymentStatus: hackathonRegistrations.paymentStatus,
      ticketCode: hackathonRegistrations.ticketCode,
    })
    .from(hackathonRegistrations)
    .where(
      and(
        eq(hackathonRegistrations.editionId, fullEdition.id),
        eq(hackathonRegistrations.email, data.email.toLowerCase()),
      ),
    )
    .limit(1);

  if (existing[0]?.paymentStatus === "paid") {
    return {
      ok: false as const,
      error: "already_registered",
      status: 409,
      ticketCode: existing[0].ticketCode,
    };
  }

  let registrationId = existing[0]?.id;
  if (registrationId) {
    await db
      .update(hackathonRegistrations)
      .set({
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        whatsapp: data.whatsapp || data.phone,
        city: data.city || null,
        profession: data.profession || null,
        company: data.company || null,
        level: data.level,
        projectName: data.projectName || null,
        projectDescription: data.projectDescription || null,
        projectCategory: data.projectCategory || null,
        workMode: data.workMode,
        ticketPack: data.ticketPack,
        priceUsd,
        paymentMethod: data.paymentMethod,
        paymentStatus: "pending",
        locale: data.locale,
        userId: userId ?? null,
        updatedAt: new Date(),
      })
      .where(eq(hackathonRegistrations.id, registrationId));
  } else {
    const [created] = await db
      .insert(hackathonRegistrations)
      .values({
        editionId: fullEdition.id,
        userId: userId ?? null,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email.toLowerCase(),
        phone: data.phone,
        whatsapp: data.whatsapp || data.phone,
        city: data.city || null,
        profession: data.profession || null,
        company: data.company || null,
        level: data.level,
        projectName: data.projectName || null,
        projectDescription: data.projectDescription || null,
        projectCategory: data.projectCategory || null,
        workMode: data.workMode,
        ticketPack: data.ticketPack,
        priceUsd,
        paymentMethod: data.paymentMethod,
        paymentStatus: "pending",
        locale: data.locale,
      })
      .returning({ id: hackathonRegistrations.id });
    registrationId = created.id;
  }

  if (data.paymentMethod === "card") {
    const pay = await initiateHackathonCardPayment({
      registrationId: registrationId!,
      amountUsd: priceUsd,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
    });
    if (!pay.ok) {
      return {
        ok: false as const,
        error: pay.error,
        message: pay.message,
        status: 502,
      };
    }
    return {
      ok: true as const,
      registrationId,
      reference: pay.reference,
      checkoutUrl: pay.checkoutUrl,
      amountUsd: priceUsd,
    };
  }

  const pay = await initiateHackathonMomoPayment({
    registrationId: registrationId!,
    amountUsd: priceUsd,
    phoneNumber: data.phone,
    paymentMethod: data.paymentMethod,
  });
  if (!pay.ok) {
    return {
      ok: false as const,
      error: pay.error,
      message: pay.message,
      status: 502,
    };
  }

  return {
    ok: true as const,
    registrationId,
    reference: pay.reference,
    amountUsd: priceUsd,
  };
}

export async function submitPartner(raw: unknown) {
  const parsed = partnerBodyZ.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: "invalid_body", status: 400 };
  }
  const data = parsed.data;
  const edition = await resolveEditionId(data.editionId);
  if (!edition) {
    return { ok: false as const, error: "no_edition", status: 404 };
  }

  const db = getDb();
  const [row] = await db
    .insert(hackathonPartners)
    .values({
      editionId: edition.id,
      orgName: data.orgName,
      contactName: data.contactName,
      email: data.email.toLowerCase(),
      phone: data.phone || null,
      website: data.website || null,
      sector: data.sector || null,
      partnershipTypes: data.partnershipTypes,
      contribution: data.contribution || null,
      status: "lead",
    })
    .returning({ id: hackathonPartners.id });

  void sendHackathonPartnerAckEmail({
    to: data.email,
    orgName: data.orgName,
    contactName: data.contactName,
    locale: data.locale,
  }).catch(() => null);

  return { ok: true as const, id: row.id };
}

export async function submitSponsor(raw: unknown) {
  const parsed = sponsorBodyZ.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: "invalid_body", status: 400 };
  }
  const data = parsed.data;
  const edition = await resolveEditionId(data.editionId);
  if (!edition) {
    return { ok: false as const, error: "no_edition", status: 404 };
  }

  const db = getDb();
  const [row] = await db
    .insert(hackathonSponsors)
    .values({
      editionId: edition.id,
      companyName: data.companyName,
      contactName: data.contactName,
      email: data.email.toLowerCase(),
      phone: data.phone || null,
      website: data.website || null,
      pack: data.pack,
      budgetNote: data.budgetNote || null,
      comment: data.comment || null,
      status: "lead",
    })
    .returning({ id: hackathonSponsors.id });

  void sendHackathonSponsorAckEmail({
    to: data.email,
    companyName: data.companyName,
    contactName: data.contactName,
    pack: data.pack,
    locale: data.locale,
  }).catch(() => null);

  return { ok: true as const, id: row.id };
}
