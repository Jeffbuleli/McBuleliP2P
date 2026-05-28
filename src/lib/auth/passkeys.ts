import type { AuthenticatorTransportFuture } from "@simplewebauthn/server";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import { and, eq, gt, isNull } from "drizzle-orm";
import { authChallenges, getDb, userPasskeys, users } from "@/db";
import {
  createAuthChallenge,
  getActiveChallengeById,
  markChallengeUsed,
} from "@/lib/auth/challenges";
import {
  webAuthnOrigin,
  webAuthnRpId,
  webAuthnRpName,
} from "@/lib/auth/passkeys-config";

export async function passkeyRegisterOptions(userId: string, deviceName?: string) {
  const db = getDb();
  const [u] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!u) throw new Error("not_found");

  const existing = await db
    .select({
      credentialId: userPasskeys.credentialId,
      transports: userPasskeys.transports,
    })
    .from(userPasskeys)
    .where(eq(userPasskeys.userId, userId));

  const options = await generateRegistrationOptions({
    rpName: webAuthnRpName(),
    rpID: webAuthnRpId(),
    userName: u.email,
    userDisplayName: u.email,
    attestationType: "none",
    excludeCredentials: existing.map((pk) => ({
      id: pk.credentialId,
      transports: (pk.transports ?? undefined) as AuthenticatorTransportFuture[] | undefined,
    })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
  });

  const { id: challengeId } = await createAuthChallenge({
    userId,
    purpose: "passkey_register",
    meta: { challenge: options.challenge, deviceName: deviceName?.trim() || null },
  });

  return { options, challengeId };
}

export async function passkeyRegisterVerify(args: {
  userId: string;
  challengeId: string;
  response: unknown;
}) {
  const row = await getActiveChallengeById({
    challengeId: args.challengeId,
    purpose: "passkey_register",
    userId: args.userId,
  });
  if (!row) return { ok: false as const, error: "challenge_expired" };

  const expectedChallenge =
    typeof (row.meta as Record<string, unknown> | null)?.challenge === "string"
      ? ((row.meta as Record<string, unknown>).challenge as string)
      : null;
  if (!expectedChallenge) return { ok: false as const, error: "challenge_invalid" };

  const verification = await verifyRegistrationResponse({
    response: args.response as Parameters<typeof verifyRegistrationResponse>[0]["response"],
    expectedChallenge,
    expectedOrigin: webAuthnOrigin(),
    expectedRPID: webAuthnRpId(),
    requireUserVerification: false,
  });

  if (!verification.verified || !verification.registrationInfo) {
    return { ok: false as const, error: "passkey_invalid" };
  }

  const { credential } = verification.registrationInfo;
  const deviceName =
    typeof (row.meta as Record<string, unknown> | null)?.deviceName === "string"
      ? ((row.meta as Record<string, unknown>).deviceName as string)
      : null;

  const db = getDb();
  await db.insert(userPasskeys).values({
    userId: args.userId,
    credentialId: credential.id,
    publicKey: Buffer.from(credential.publicKey).toString("base64url"),
    counter: credential.counter,
    deviceName,
    transports: credential.transports ?? null,
  });

  await markChallengeUsed(row.id);
  return { ok: true as const };
}

export async function passkeyLoginOptions(email?: string) {
  const db = getDb();
  let userId: string | null = null;
  let allowCredentials: { id: string; transports?: AuthenticatorTransportFuture[] }[] | undefined;

  if (email) {
    const normalized = email.trim().toLowerCase();
    const [u] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalized))
      .limit(1);
    if (u) {
      userId = u.id;
      const passkeys = await db
        .select({
          credentialId: userPasskeys.credentialId,
          transports: userPasskeys.transports,
        })
        .from(userPasskeys)
        .where(eq(userPasskeys.userId, u.id));
      allowCredentials = passkeys.map((pk) => ({
        id: pk.credentialId,
        transports: (pk.transports ?? undefined) as AuthenticatorTransportFuture[] | undefined,
      }));
    }
  }

  const options = await generateAuthenticationOptions({
    rpID: webAuthnRpId(),
    allowCredentials,
    userVerification: "preferred",
  });

  const { id: challengeId } = await createAuthChallenge({
    userId,
    purpose: "passkey_login",
    meta: { challenge: options.challenge, email: email?.trim().toLowerCase() ?? null },
  });

  return { options, challengeId, userId };
}

export async function passkeyLoginVerify(args: {
  challengeId: string;
  response: unknown;
}) {
  const db = getDb();
  const [challenge] = await db
    .select()
    .from(authChallenges)
    .where(
      and(
        eq(authChallenges.id, args.challengeId),
        eq(authChallenges.purpose, "passkey_login"),
        isNull(authChallenges.usedAt),
        gt(authChallenges.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!challenge) return { ok: false as const, error: "challenge_expired" };

  const expectedChallenge =
    typeof (challenge.meta as Record<string, unknown> | null)?.challenge === "string"
      ? ((challenge.meta as Record<string, unknown>).challenge as string)
      : null;
  if (!expectedChallenge) return { ok: false as const, error: "challenge_invalid" };

  const response = args.response as Parameters<typeof verifyAuthenticationResponse>[0]["response"];
  const credentialId = response.id;

  const [passkey] = await db
    .select()
    .from(userPasskeys)
    .where(eq(userPasskeys.credentialId, credentialId))
    .limit(1);
  if (!passkey) return { ok: false as const, error: "passkey_not_found" };

  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge,
    expectedOrigin: webAuthnOrigin(),
    expectedRPID: webAuthnRpId(),
    credential: {
      id: passkey.credentialId,
      publicKey: Buffer.from(passkey.publicKey, "base64url"),
      counter: passkey.counter,
      transports: (passkey.transports ?? undefined) as AuthenticatorTransportFuture[] | undefined,
    },
    requireUserVerification: false,
  });

  if (!verification.verified) {
    return { ok: false as const, error: "passkey_invalid" };
  }

  await db
    .update(userPasskeys)
    .set({
      counter: verification.authenticationInfo.newCounter,
      lastUsedAt: new Date(),
    })
    .where(eq(userPasskeys.id, passkey.id));

  await markChallengeUsed(challenge.id);

  const [u] = await db
    .select({ sessionVersion: users.sessionVersion })
    .from(users)
    .where(eq(users.id, passkey.userId))
    .limit(1);

  return {
    ok: true as const,
    userId: passkey.userId,
    sessionVersion: u?.sessionVersion ?? 0,
  };
}

export async function passkeyStepUpOptions(userId: string) {
  const db = getDb();
  const passkeys = await db
    .select({
      credentialId: userPasskeys.credentialId,
      transports: userPasskeys.transports,
    })
    .from(userPasskeys)
    .where(eq(userPasskeys.userId, userId));
  if (!passkeys.length) {
    throw new Error("passkey_not_found");
  }

  const options = await generateAuthenticationOptions({
    rpID: webAuthnRpId(),
    allowCredentials: passkeys.map((pk) => ({
      id: pk.credentialId,
      transports: (pk.transports ?? undefined) as AuthenticatorTransportFuture[] | undefined,
    })),
    userVerification: "preferred",
  });

  const { id: challengeId } = await createAuthChallenge({
    userId,
    purpose: "passkey_step_up",
    meta: { challenge: options.challenge },
  });

  return { options, challengeId };
}

export async function passkeyStepUpVerify(args: {
  userId: string;
  challengeId: string;
  response: unknown;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const row = await getActiveChallengeById({
    challengeId: args.challengeId,
    purpose: "passkey_step_up",
    userId: args.userId,
  });
  if (!row) return { ok: false, error: "challenge_expired" };

  const expectedChallenge =
    typeof (row.meta as Record<string, unknown> | null)?.challenge === "string"
      ? ((row.meta as Record<string, unknown>).challenge as string)
      : null;
  if (!expectedChallenge) return { ok: false, error: "challenge_invalid" };

  const response = args.response as Parameters<typeof verifyAuthenticationResponse>[0]["response"];
  const credentialId = response.id;

  const db = getDb();
  const [passkey] = await db
    .select()
    .from(userPasskeys)
    .where(
      and(eq(userPasskeys.credentialId, credentialId), eq(userPasskeys.userId, args.userId)),
    )
    .limit(1);
  if (!passkey) return { ok: false, error: "passkey_not_found" };

  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge,
    expectedOrigin: webAuthnOrigin(),
    expectedRPID: webAuthnRpId(),
    credential: {
      id: passkey.credentialId,
      publicKey: Buffer.from(passkey.publicKey, "base64url"),
      counter: passkey.counter,
      transports: (passkey.transports ?? undefined) as AuthenticatorTransportFuture[] | undefined,
    },
    requireUserVerification: false,
  });

  if (!verification.verified) {
    return { ok: false, error: "passkey_invalid" };
  }

  await db
    .update(userPasskeys)
    .set({
      counter: verification.authenticationInfo.newCounter,
      lastUsedAt: new Date(),
    })
    .where(eq(userPasskeys.id, passkey.id));

  await markChallengeUsed(row.id);
  return { ok: true };
}
