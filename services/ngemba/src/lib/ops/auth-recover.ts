/**
 * Demande de nouveau code ops → email McBuleli (pas d'auto-reset token).
 */
import {
  NGEMBA_EMAIL_ASSETS,
  NGEMBA_EMAIL_FROM,
  NGEMBA_OPS_BCC_DEFAULT,
  NGEMBA_OPS_EMAIL_DEFAULT,
} from "@/lib/email/brand";
import { readEnvKey } from "@/lib/env";
import { listPartners } from "@/lib/partners/directory";

export type OpsRecoverRequest = {
  organization: string;
  email: string;
  phone?: string;
  referent?: string;
  note?: string;
};

function matchPartnerHint(email: string, organization: string): string | null {
  const e = email.trim().toLowerCase();
  const org = organization.trim().toLowerCase();
  for (const p of listPartners()) {
    if (!p.active) continue;
    const hint = (p.contactHint || "").toLowerCase();
    if (e && hint.includes(e)) return `${p.name} (${p.id})`;
    if (
      org &&
      (p.name.toLowerCase().includes(org) ||
        p.slug === org ||
        p.id === org)
    ) {
      return `${p.name} (${p.id})`;
    }
  }
  return null;
}

function escLine(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function sendOpsRecoverRequest(
  input: OpsRecoverRequest,
  meta: { ip: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = readEnvKey("RESEND_API_KEY");
  if (!apiKey) {
    return { ok: false, error: "email_not_configured" };
  }

  const matched = matchPartnerHint(input.email, input.organization);
  const to = [NGEMBA_OPS_EMAIL_DEFAULT, "hi@mcbuleli.org"].filter(
    (v, i, a) => a.indexOf(v) === i,
  );
  const bcc = (
    readEnvKey("NGEMBA_OPS_EMAIL_BCC") || NGEMBA_OPS_BCC_DEFAULT
  )
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
  const from = readEnvKey("NGEMBA_OPS_EMAIL_FROM") || NGEMBA_EMAIL_FROM;
  const replyTo =
    readEnvKey("NGEMBA_OPS_EMAIL_REPLY_TO") ||
    NGEMBA_EMAIL_ASSETS.supportEmail;

  const lines = [
    "NGEMBA OPS — demande de nouveau code opérateur",
    "",
    `Organisation : ${input.organization}`,
    `Email déclaré : ${input.email}`,
    `Téléphone : ${input.phone?.trim() || "—"}`,
    `Référent : ${input.referent?.trim() || "—"}`,
    `Note : ${input.note?.trim() || "—"}`,
    `Match annuaire : ${matched || "aucun (vérifier manuellement)"}`,
    `IP : ${meta.ip}`,
    `Horodatage : ${new Date().toISOString()}`,
    "",
    "Action : vérifier l'identité, openssl rand -hex 20,",
    "mettre à jour NGEMBA_OPS_TOKEN_NGO_* sur le VPS, renvoyer l'email d'accès.",
  ];

  const text = lines.join("\n");
  const html = `<pre style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;line-height:1.5;white-space:pre-wrap;">${lines
    .map((line) => escLine(line))
    .join("\n")}</pre>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        bcc: bcc.length ? bcc : undefined,
        reply_to: input.email.trim() || replyTo,
        subject: `[NGEMBA] Demande nouveau code ops — ${input.organization.slice(0, 60)}`,
        text,
        html,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error("[ngemba] ops recover email failed", res.status, body);
      return { ok: false, error: "email_failed" };
    }
    return { ok: true };
  } catch (err) {
    console.error("[ngemba] ops recover email error", err);
    return { ok: false, error: "email_failed" };
  }
}
