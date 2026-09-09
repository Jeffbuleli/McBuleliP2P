/**
 * Demande de nouveau code ops → email McBuleli (pas d'auto-reset token).
 */
import {
  NGEMBA_EMAIL_ASSETS,
  NGEMBA_EMAIL_FROM,
  NGEMBA_OPS_BCC_DEFAULT,
  NGEMBA_OPS_EMAIL_DEFAULT,
} from "@/lib/email/brand";
import { renderOpsAlertEmail } from "@/lib/email/ops-alert-layout";
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
    input.email.trim() ||
    readEnvKey("NGEMBA_OPS_EMAIL_REPLY_TO") ||
    NGEMBA_EMAIL_ASSETS.supportEmail;

  const { html, text } = renderOpsAlertEmail({
    title: `Nouveau code demandé — ${input.organization}`,
    preheader: `Vérifier ${input.email} puis régénérer le token ops`,
    greeting: "Bonjour McBuleli,",
    body:
      "Un opérateur a demandé un nouveau code depuis /ops/login. " +
      "Vérifiez l’identité (email / téléphone / référent), générez un nouveau token, " +
      "mettez à jour le VPS, puis renvoyez l’email d’accès.",
    tone: "info",
    badge: "Accès",
    actionUrl: `${NGEMBA_EMAIL_ASSETS.site}/ops/partners`,
    cta: "Ouvrir l’annuaire partenaires",
    footerNote:
      "Action : openssl rand -hex 20 → NGEMBA_OPS_TOKEN_NGO_* → redeploy → email accès.",
    detailRows: [
      { label: "Organisation", value: input.organization },
      { label: "Email", value: input.email },
      { label: "Téléphone", value: input.phone?.trim() || "—" },
      { label: "Référent", value: input.referent?.trim() || "—" },
      { label: "Note", value: input.note?.trim() || "—" },
      {
        label: "Match annuaire",
        value: matched || "aucun — vérifier manuellement",
      },
      { label: "IP", value: meta.ip },
      { label: "Horodatage", value: new Date().toISOString() },
    ],
  });

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
        reply_to: replyTo,
        subject: `[NGEMBA] Nouveau code ops — ${input.organization.slice(0, 60)}`,
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
