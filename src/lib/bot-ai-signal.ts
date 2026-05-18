import { eq } from "drizzle-orm";
import { getDb, botInstances, platformSettings } from "@/db";

export type AiSignalAction = "LONG" | "SHORT" | "HOLD";

export type StoredAiSignal = {
  version: number;
  symbol: string;
  action: AiSignalAction;
  confidence: number;
  strategy: string;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
  timeframe: string;
  technical_score: number;
  combined_score: number;
  sentiment_score: number;
  reasons: string[];
  ts: string;
  receivedAt: string;
};

const KEY_PREFIX = "bots_ai:";
const DEFAULT_MAX_AGE_MS = 120_000;

function settingKey(instanceId: string): string {
  return `${KEY_PREFIX}${instanceId}`;
}

export async function storeAiSignal(
  instanceId: string,
  signal: Omit<StoredAiSignal, "receivedAt">,
): Promise<StoredAiSignal> {
  const stored: StoredAiSignal = {
    ...signal,
    receivedAt: new Date().toISOString(),
  };
  const db = getDb();
  await db
    .insert(platformSettings)
    .values({ key: settingKey(instanceId), value: JSON.stringify(stored) })
    .onConflictDoUpdate({
      target: platformSettings.key,
      set: { value: JSON.stringify(stored), updatedAt: new Date() },
    });
  return stored;
}

export async function getAiSignal(
  instanceId: string,
  maxAgeMs = DEFAULT_MAX_AGE_MS,
): Promise<StoredAiSignal | null> {
  const db = getDb();
  const [row] = await db
    .select({ value: platformSettings.value })
    .from(platformSettings)
    .where(eq(platformSettings.key, settingKey(instanceId)))
    .limit(1);
  if (!row?.value) return null;
  try {
    const parsed = JSON.parse(row.value) as StoredAiSignal;
    if (typeof parsed.receivedAt !== "string") return null;
    const age = Date.now() - new Date(parsed.receivedAt).getTime();
    if (!Number.isFinite(age) || age > maxAgeMs) return null;
    return parsed;
  } catch {
    return null;
  }
}

export type AiAssistGateResult =
  | { ok: true; signal: StoredAiSignal }
  | { ok: false; reason: string };

export function runAiAssistGate(args: {
  botSide: "LONG" | "SHORT";
  minAiConfidence: number;
  signal: StoredAiSignal | null;
  aiAssistMode: boolean;
}): AiAssistGateResult {
  if (!args.aiAssistMode) {
    return { ok: true, signal: args.signal ?? ({} as StoredAiSignal) };
  }

  const sig = args.signal;
  if (!sig) {
    return { ok: false, reason: "ai_signal_stale" };
  }

  if (sig.action === "HOLD") {
    return { ok: false, reason: "ai_signal_hold" };
  }

  if (sig.confidence < args.minAiConfidence) {
    return { ok: false, reason: "ai_low_confidence" };
  }

  if (sig.risk_level === "HIGH" && sig.confidence < 55) {
    return { ok: false, reason: "ai_high_risk" };
  }

  if (args.botSide === "LONG" && sig.action !== "LONG") {
    return { ok: false, reason: "ai_side_mismatch" };
  }
  if (args.botSide === "SHORT" && sig.action !== "SHORT") {
    return { ok: false, reason: "ai_side_mismatch" };
  }

  return { ok: true, signal: sig };
}

export async function getBotInstanceById(instanceId: string) {
  const db = getDb();
  const [row] = await db
    .select({
      id: botInstances.id,
      userId: botInstances.userId,
      planId: botInstances.planId,
      billing: botInstances.billing,
      status: botInstances.status,
    })
    .from(botInstances)
    .where(eq(botInstances.id, instanceId))
    .limit(1);
  return row ?? null;
}
