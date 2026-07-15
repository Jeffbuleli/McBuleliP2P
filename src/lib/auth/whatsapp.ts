import { and, eq, gt, isNull } from "drizzle-orm";
import { authChallenges, getDb, users, waInboundEvents } from "@/db";
import { hashToken } from "@/lib/auth/crypto";
import { markChallengeUsed } from "@/lib/auth/challenges";

const CODE_RE = /McB-[A-Z2-9]{4}/i;

export function extractWaVerifyCode(body: string): string | null {
  const m = body.match(CODE_RE);
  return m ? m[0]!.toUpperCase() : null;
}

export async function processInboundWhatsAppMessage(args: {
  chatId: string;
  phone: string | null;
  body: string;
}): Promise<{ matched: boolean; userId?: string; challengeId?: string }> {
  const db = getDb();
  const [event] = await db
    .insert(waInboundEvents)
    .values({
      chatId: args.chatId,
      phone: args.phone,
      body: args.body.slice(0, 2000),
    })
    .returning({ id: waInboundEvents.id });

  const code = extractWaVerifyCode(args.body);
  if (!code) return { matched: false };

  const [challenge] = await db
    .select()
    .from(authChallenges)
    .where(
      and(
        eq(authChallenges.purpose, "wa_verify"),
        eq(authChallenges.codeHash, hashToken(code)),
        isNull(authChallenges.usedAt),
        gt(authChallenges.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!challenge?.userId) return { matched: false };

  await markChallengeUsed(challenge.id);
  await db
    .update(users)
    .set({
      recoveryWaChatId: args.chatId,
      recoveryWaPhone: args.phone,
      waVerifiedAt: new Date(),
    })
    .where(eq(users.id, challenge.userId));

  if (event?.id) {
    await db
      .update(waInboundEvents)
      .set({
        matchedUserId: challenge.userId,
        matchedChallengeId: challenge.id,
      })
      .where(eq(waInboundEvents.id, event.id));
  }

  return {
    matched: true,
    userId: challenge.userId,
    challengeId: challenge.id,
  };
}

/** Outbound WhatsApp OTP — OpenWA gateway removed; always unavailable. */
export async function sendWhatsAppOtp(_args: {
  chatId: string;
  otp: string;
}): Promise<boolean> {
  return false;
}
