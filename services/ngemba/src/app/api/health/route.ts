/** Revue du 6 novembre 2026. */
import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/db";
import { listDirectoryServices, listOrganizationsView } from "@/lib/directory";
import { TRIAGE_PROMPT_VERSION } from "@/lib/ai/triage-schema";
import { RESPONSE_POLICY_VERSION } from "@/lib/response-engine";
import { sessionStoreInfo } from "@/lib/sessions/store";
import { unitStats } from "@/lib/units";
import { llmProviderForHealth } from "@/lib/ai/llm-text";
import { ngembaWebhookConfigured } from "@/lib/ops/n8n-webhook";
import { readEnvKey } from "@/lib/env";
import { telegramBotToken } from "@/lib/channels/telegram-reply";

export async function GET() {
  const store = sessionStoreInfo();
  const units = unitStats();
  const llm = llmProviderForHealth();
  return NextResponse.json({
    ok: true,
    service: "ngemba",
    phase: "5",
    domain: "ngemba-rdc.org",
    time: new Date().toISOString(),
    incidentCore: {
      databaseConfigured: isDatabaseConfigured(),
      sessionPrimary: store.primary,
      pgEnabled: store.pgEnabled,
      jsonCount: store.jsonCount,
    },
    ai: {
      promptVersion: TRIAGE_PROMPT_VERSION,
      policyVersion: RESPONSE_POLICY_VERSION,
      llmProvider: llm.provider,
      llmModel: llm.model,
      aiMode: readEnvKey("NGEMBA_AI_MODE") || "hybrid",
    },
    channels: {
      telegram: Boolean(telegramBotToken()),
      n8nWebhook: ngembaWebhookConfigured(),
      n8nSigning: Boolean(readEnvKey("NGEMBA_N8N_WEBHOOK_SECRET")),
    },
    access: {
      model: "rbac+abac",
      bridge: "legacy_token",
    },
    directory: {
      organizations: listOrganizationsView().length,
      services: listDirectoryServices().length,
    },
    units: {
      total: units.total,
      available: units.available,
      assigned: units.assigned,
    },
  });
}
