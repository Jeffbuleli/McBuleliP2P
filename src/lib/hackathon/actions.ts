import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import {
  getDb,
  hackathonEditions,
  hackathonPartners,
  hackathonRegistrations,
  hackathonSponsors,
} from "@/db";
import { sendEmailVerification } from "@/lib/auth/email-verification";
import {
  HACKATHON_PARTNERSHIP_TYPES,
  HACKATHON_PRICE_USD,
  HACKATHON_SPONSOR_PACKS,
} from "@/lib/hackathon/constants";
import {
  initiateHackathonMomoPayment,
} from "@/lib/hackathon/payments";
import { ensureHackathonUser } from "@/lib/hackathon/ensure-user";
import {
  generatePaymentToken,
  payLaterPublicUrl,
} from "@/lib/hackathon/service";
import { resolveActivePromo } from "@/lib/hackathon/promo";
import {
  isValidCodMsisdn,
  normalizeCodPhoneNumber,
} from "@/lib/freshpay/normalize-phone";
import { sendHackathonPartnerAckEmail } from "@/lib/email/messages/hackathon";
import { sendHackathonReserveEmail } from "@/lib/email/messages/hackathon";
import { sendHackathonSponsorAckEmail } from "@/lib/email/messages/hackathon";
import type { EmailLocale } from "@/lib/email/locale";

const paymentMethodZ = z.enum(["orange", "mpesa", "airtel", "usdt"]);

export const registerBodyZ = z
  .object({
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
    /** Free seat hold (default) or immediate checkout */
    intent: z.enum(["reserve", "pay_now"]).default("reserve"),
    paymentMethod: paymentMethodZ.optional(),
    /** Partner share link promo (locked client-side; re-validated server-side). */
    promoCode: z.string().trim().max(32).optional(),
    locale: z.enum(["fr", "en"]).default("fr"),
  })
  .superRefine((data, ctx) => {
    if (data.intent === "pay_now" && !data.paymentMethod) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "payment_method_required",
        path: ["paymentMethod"],
      });
    }
  });

export const payTokenBodyZ = z.object({
  paymentMethod: paymentMethodZ,
  phone: z.string().trim().min(6).max(40).optional(),
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
  logoUrl: z
    .string()
    .max(350_000)
    .refine((s) => s.startsWith("data:image/") || /^https?:\/\//i.test(s), {
      message: "invalid_logo",
    })
    .optional(),
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
  logoUrl: z
    .string()
    .max(350_000)
    .refine((s) => s.startsWith("data:image/") || /^https?:\/\//i.test(s), {
      message: "invalid_logo",
    })
    .optional(),
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

async function countHeldSeats(editionId: string) {
  const db = getDb();
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(hackathonRegistrations)
    .where(
      and(
        eq(hackathonRegistrations.editionId, editionId),
        sql`(
          ${hackathonRegistrations.paymentStatus} = 'paid'
          OR ${hackathonRegistrations.paymentStatus} = 'reserved'
        )`,
      ),
    );
  return row?.count ?? 0;
}

async function startCheckout(args: {
  registrationId: string;
  priceUsd: string;
  phone: string;
  paymentMethod: "orange" | "mpesa" | "airtel";
}) {
  const pay = await initiateHackathonMomoPayment({
    registrationId: args.registrationId,
    amountUsd: args.priceUsd,
    phoneNumber: args.phone,
    paymentMethod: args.paymentMethod,
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
    registrationId: args.registrationId,
    reference: pay.reference,
    amountUsd: args.priceUsd,
  };
}

export async function registerParticipant(raw: unknown) {
  const parsed = registerBodyZ.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: "invalid_body", status: 400 };
  }
  const data = parsed.data;
  const intent = data.intent;

  const phone = normalizeCodPhoneNumber(data.phone);
  if (!isValidCodMsisdn(phone)) {
    return { ok: false as const, error: "invalid_phone", status: 400 };
  }

  if (intent === "pay_now" && data.paymentMethod === "usdt") {
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

  // Single 2-day program - ignore day1 pack from clients
  const ticketPack = "full" as const;

  const promo = data.promoCode
    ? await resolveActivePromo({
        code: data.promoCode,
        editionId: fullEdition.id,
      })
    : null;
  if (data.promoCode?.trim() && !promo) {
    return { ok: false as const, error: "invalid_promo", status: 400 };
  }

  const priceUsd = promo?.priceUsd ?? HACKATHON_PRICE_USD;

  const email = data.email.toLowerCase();
  // Always resolve the McBuleli user by registration email (never borrow a
  // logged-in session user for a different email — that duplicated userIds in OPS).
  const account = await ensureHackathonUser({
    email,
    firstName: data.firstName,
    lastName: data.lastName,
  });
  const userId = account.id;
  const emailVerified = Boolean(account.emailVerifiedAt);

  const existing = await db
    .select()
    .from(hackathonRegistrations)
    .where(
      and(
        eq(hackathonRegistrations.editionId, fullEdition.id),
        eq(hackathonRegistrations.email, email),
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

  const existingActiveHold = existing[0]?.paymentStatus === "reserved";

  if (!existingActiveHold) {
    const held = await countHeldSeats(fullEdition.id);
    if (held >= fullEdition.maxSeats) {
      return { ok: false as const, error: "sold_out", status: 409 };
    }
  }

  const profile = {
    firstName: data.firstName,
    lastName: data.lastName,
    phone,
    whatsapp: data.whatsapp ? normalizeCodPhoneNumber(data.whatsapp) || phone : phone,
    city: data.city || null,
    profession: data.profession || null,
    company: data.company || null,
    level: data.level,
    projectName: data.projectName || null,
    projectDescription: data.projectDescription || null,
    projectCategory: data.projectCategory || null,
    workMode: data.workMode,
    ticketPack,
    priceUsd,
    locale: data.locale,
    userId,
    promoCodeId: promo?.id ?? null,
    promoCode: promo?.code ?? null,
    cashbackUsd: promo ? String(promo.cashbackUsd) : null,
  };

  if (intent === "reserve") {
    // Active hold: return existing pay link (idempotent re-submit).
    if (existingActiveHold && existing[0]?.paymentToken) {
      return {
        ok: true as const,
        mode: "reserved" as const,
        registrationId: existing[0].id,
        paymentToken: existing[0].paymentToken,
        payUrl: payLaterPublicUrl(existing[0].paymentToken),
        holdExpiresAt: null,
        holdHours: null,
        amountUsd: priceUsd,
        existingAccount: !account.created,
      };
    }

    // Email not verified yet → ask confirmation first; seat hold starts after verify.
    if (!emailVerified) {
      let registrationId = existing[0]?.id;
      if (registrationId) {
        await db
          .update(hackathonRegistrations)
          .set({
            ...profile,
            paymentMethod: data.paymentMethod ?? existing[0]?.paymentMethod ?? null,
            paymentStatus: "pending_verify",
            paymentToken: null,
            holdExpiresAt: null,
            holdReminderSentAt: null,
            updatedAt: new Date(),
          })
          .where(eq(hackathonRegistrations.id, registrationId));
      } else {
        const [created] = await db
          .insert(hackathonRegistrations)
          .values({
            editionId: fullEdition.id,
            email,
            ...profile,
            paymentMethod: data.paymentMethod ?? null,
            paymentStatus: "pending_verify",
          })
          .returning({ id: hackathonRegistrations.id });
        registrationId = created.id;
      }

      void sendEmailVerification(
        userId,
        email,
        data.locale as EmailLocale,
        { hackathonRegistrationId: registrationId },
      ).catch(() => null);

      return {
        ok: true as const,
        mode: "pending_verify" as const,
        registrationId,
        existingAccount: !account.created,
        amountUsd: priceUsd,
      };
    }

    // Verified account (new or returning) → open-ended seat hold + reservation email.
    const token = generatePaymentToken();

    let registrationId = existing[0]?.id;
    if (registrationId) {
      await db
        .update(hackathonRegistrations)
        .set({
          ...profile,
          paymentMethod: data.paymentMethod ?? existing[0]?.paymentMethod ?? null,
          paymentStatus: "reserved",
          paymentToken: token,
          holdExpiresAt: null,
          holdReminderSentAt: null,
          updatedAt: new Date(),
        })
        .where(eq(hackathonRegistrations.id, registrationId));
    } else {
      const [created] = await db
        .insert(hackathonRegistrations)
        .values({
          editionId: fullEdition.id,
          email,
          ...profile,
          paymentMethod: data.paymentMethod ?? null,
          paymentStatus: "reserved",
          paymentToken: token,
          holdExpiresAt: null,
        })
        .returning({ id: hackathonRegistrations.id });
      registrationId = created.id;
    }

    const payUrl = payLaterPublicUrl(token);
    void sendHackathonReserveEmail({
      registrationId: registrationId!,
    }).catch(() => null);

    return {
      ok: true as const,
      mode: "reserved" as const,
      registrationId,
      paymentToken: token,
      payUrl,
      holdExpiresAt: null,
      holdHours: null,
      amountUsd: priceUsd,
      existingAccount: !account.created,
    };
  }

  // pay_now — require verified email first (same gate as reserve).
  if (!emailVerified) {
    let registrationId = existing[0]?.id;
    if (registrationId) {
      await db
        .update(hackathonRegistrations)
        .set({
          ...profile,
          paymentMethod: data.paymentMethod ?? existing[0]?.paymentMethod ?? null,
          paymentStatus: "pending_verify",
          paymentToken: null,
          holdExpiresAt: null,
          holdReminderSentAt: null,
          updatedAt: new Date(),
        })
        .where(eq(hackathonRegistrations.id, registrationId));
    } else {
      const [created] = await db
        .insert(hackathonRegistrations)
        .values({
          editionId: fullEdition.id,
          email,
          ...profile,
          paymentMethod: data.paymentMethod ?? null,
          paymentStatus: "pending_verify",
        })
        .returning({ id: hackathonRegistrations.id });
      registrationId = created.id;
    }

    void sendEmailVerification(
      userId,
      email,
      data.locale as EmailLocale,
      { hackathonRegistrationId: registrationId },
    ).catch(() => null);

    return {
      ok: true as const,
      mode: "pending_verify" as const,
      registrationId,
      existingAccount: !account.created,
      amountUsd: priceUsd,
    };
  }

  const paymentMethod = data.paymentMethod!;
  let registrationId = existing[0]?.id;
  if (registrationId) {
    await db
      .update(hackathonRegistrations)
      .set({
        ...profile,
        paymentMethod,
        paymentStatus: "pending",
        paymentToken: null,
        holdExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(hackathonRegistrations.id, registrationId));
  } else {
    const [created] = await db
      .insert(hackathonRegistrations)
      .values({
        editionId: fullEdition.id,
        email,
        ...profile,
        paymentMethod,
        paymentStatus: "pending",
      })
      .returning({ id: hackathonRegistrations.id });
    registrationId = created.id;
  }

  return startCheckout({
    registrationId: registrationId!,
    priceUsd,
    phone,
    paymentMethod: paymentMethod as "orange" | "mpesa" | "airtel",
  });
}

export async function payReservedRegistration(token: string, raw: unknown) {
  const parsed = payTokenBodyZ.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: "invalid_body", status: 400 };
  }
  const data = parsed.data;

  if (data.paymentMethod === "usdt") {
    return { ok: false as const, error: "usdt_coming_soon", status: 400 };
  }

  const phone = normalizeCodPhoneNumber(data.phone || "");
  // phone optional in body — fall back to registration phone below after load

  const db = getDb();
  const [reg] = await db
    .select()
    .from(hackathonRegistrations)
    .where(eq(hackathonRegistrations.paymentToken, token.trim()))
    .limit(1);

  if (!reg) {
    return { ok: false as const, error: "not_found", status: 404 };
  }
  if (reg.paymentStatus === "paid") {
    return {
      ok: false as const,
      error: "already_registered",
      status: 409,
      ticketCode: reg.ticketCode,
    };
  }
  if (
    reg.paymentStatus === "reserved" &&
    reg.holdExpiresAt &&
    reg.holdExpiresAt.getTime() <= Date.now()
  ) {
    // Legacy rows that still have an expiry: clear it instead of blocking payment.
    await db
      .update(hackathonRegistrations)
      .set({ holdExpiresAt: null, updatedAt: new Date() })
      .where(eq(hackathonRegistrations.id, reg.id));
  }
  if (reg.paymentStatus !== "reserved" && reg.paymentStatus !== "pending" && reg.paymentStatus !== "failed") {
    return { ok: false as const, error: "invalid_status", status: 409 };
  }

  const payPhone = phone && isValidCodMsisdn(phone)
    ? phone
    : normalizeCodPhoneNumber(reg.phone);
  if (!isValidCodMsisdn(payPhone)) {
    return { ok: false as const, error: "invalid_phone", status: 400 };
  }

  await db
    .update(hackathonRegistrations)
    .set({
      phone: payPhone,
      paymentMethod: data.paymentMethod,
      paymentStatus: "pending",
      updatedAt: new Date(),
    })
    .where(eq(hackathonRegistrations.id, reg.id));

  return startCheckout({
    registrationId: reg.id,
    priceUsd: String(reg.priceUsd),
    phone: payPhone,
    paymentMethod: data.paymentMethod as "orange" | "mpesa" | "airtel",
  });
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
      logoUrl: data.logoUrl || null,
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
      logoUrl: data.logoUrl || null,
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
