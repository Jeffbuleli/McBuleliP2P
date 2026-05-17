import { and, eq } from "drizzle-orm";
import { getDb, userBinanceApiCredentials } from "@/db";
import type { BotEnvironment } from "@/lib/bot-config";
import {
  apiKeyHint,
  decryptBinanceCredentials,
  encryptBinanceCredentials,
  type StoredBinanceCredentials,
} from "@/lib/bot-keys-crypto";
import {
  validateBinanceApiPermissions,
  type BinancePermissionCheck,
} from "@/lib/binance-api-validate";

export type CredentialPublicRow = {
  environment: BotEnvironment;
  apiKeyHint: string;
  spotOk: boolean;
  futuresOk: boolean;
  futuresApiKind: "fapi" | "papi" | null;
  validatedAt: string | null;
  lastValidationError: string | null;
};

export async function listUserBinanceCredentials(
  userId: string,
): Promise<CredentialPublicRow[]> {
  const db = getDb();
  const rows = await db
    .select({
      environment: userBinanceApiCredentials.environment,
      apiKeyHint: userBinanceApiCredentials.apiKeyHint,
      spotOk: userBinanceApiCredentials.spotOk,
      futuresOk: userBinanceApiCredentials.futuresOk,
      futuresApiKind: userBinanceApiCredentials.futuresApiKind,
      validatedAt: userBinanceApiCredentials.validatedAt,
      lastValidationError: userBinanceApiCredentials.lastValidationError,
    })
    .from(userBinanceApiCredentials)
    .where(eq(userBinanceApiCredentials.userId, userId));

  return rows.map((r) => ({
    environment: r.environment as BotEnvironment,
    apiKeyHint: r.apiKeyHint,
    spotOk: r.spotOk,
    futuresOk: r.futuresOk,
    futuresApiKind:
      r.futuresApiKind === "fapi" || r.futuresApiKind === "papi"
        ? r.futuresApiKind
        : null,
    validatedAt: r.validatedAt?.toISOString() ?? null,
    lastValidationError: r.lastValidationError,
  }));
}

export async function saveUserBinanceCredentials(args: {
  userId: string;
  environment: BotEnvironment;
  creds: StoredBinanceCredentials;
  check: BinancePermissionCheck;
}): Promise<CredentialPublicRow> {
  const db = getDb();
  const hint = apiKeyHint(args.creds.apiKey);
  const ciphertext = encryptBinanceCredentials(args.creds);
  const validationError =
    !args.check.spotOk && args.check.spotError
      ? args.check.spotError
      : !args.check.futuresOk && args.check.futuresError
        ? args.check.futuresError
        : null;
  const now = new Date();

  const [row] = await db
    .insert(userBinanceApiCredentials)
    .values({
      userId: args.userId,
      environment: args.environment,
      apiKeyHint: hint,
      credentialsCiphertext: ciphertext,
      spotOk: args.check.spotOk,
      futuresOk: args.check.futuresOk,
      futuresApiKind: args.check.futuresApiKind,
      lastValidationError: validationError,
      validatedAt: args.check.spotOk || args.check.futuresOk ? now : null,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [
        userBinanceApiCredentials.userId,
        userBinanceApiCredentials.environment,
      ],
      set: {
        apiKeyHint: hint,
        credentialsCiphertext: ciphertext,
        spotOk: args.check.spotOk,
        futuresOk: args.check.futuresOk,
        futuresApiKind: args.check.futuresApiKind,
        lastValidationError: validationError,
        validatedAt: args.check.spotOk || args.check.futuresOk ? now : null,
        updatedAt: now,
      },
    })
    .returning({
      environment: userBinanceApiCredentials.environment,
      apiKeyHint: userBinanceApiCredentials.apiKeyHint,
      spotOk: userBinanceApiCredentials.spotOk,
      futuresOk: userBinanceApiCredentials.futuresOk,
      futuresApiKind: userBinanceApiCredentials.futuresApiKind,
      validatedAt: userBinanceApiCredentials.validatedAt,
      lastValidationError: userBinanceApiCredentials.lastValidationError,
    });

  return {
    environment: row.environment as BotEnvironment,
    apiKeyHint: row.apiKeyHint,
    spotOk: row.spotOk,
    futuresOk: row.futuresOk,
    futuresApiKind:
      row.futuresApiKind === "fapi" || row.futuresApiKind === "papi"
        ? row.futuresApiKind
        : null,
    validatedAt: row.validatedAt?.toISOString() ?? null,
    lastValidationError: row.lastValidationError,
  };
}

export async function deleteUserBinanceCredentials(
  userId: string,
  environment: BotEnvironment,
): Promise<boolean> {
  const db = getDb();
  const r = await db
    .delete(userBinanceApiCredentials)
    .where(
      and(
        eq(userBinanceApiCredentials.userId, userId),
        eq(userBinanceApiCredentials.environment, environment),
      ),
    )
    .returning({ id: userBinanceApiCredentials.id });
  return r.length > 0;
}

export async function loadUserBinanceCredentials(
  userId: string,
  environment: BotEnvironment,
): Promise<StoredBinanceCredentials | null> {
  const db = getDb();
  const [row] = await db
    .select({
      credentialsCiphertext: userBinanceApiCredentials.credentialsCiphertext,
    })
    .from(userBinanceApiCredentials)
    .where(
      and(
        eq(userBinanceApiCredentials.userId, userId),
        eq(userBinanceApiCredentials.environment, environment),
      ),
    )
    .limit(1);
  if (!row) return null;
  return decryptBinanceCredentials(row.credentialsCiphertext);
}
