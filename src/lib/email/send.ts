import crypto from "node:crypto";
import {
  appBaseUrl,
  emailFromAddress,
  emailReplyTo,
} from "@/lib/email/config";
import type { ResendInlineAttachment, ResendFileAttachment } from "@/lib/email/email-inline-images";

export type { ResendFileAttachment } from "@/lib/email/email-inline-images";

export { appBaseUrl };

async function resendFetch(
  path: string,
  init: RequestInit,
): Promise<{ ok: boolean; status: number; body: string }> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    return { ok: false, status: 0, body: "missing_api_key" };
  }

  const res = await fetch(`https://api.resend.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  }).catch((err) => {
    console.error("[email] resend fetch failed", err);
    return null;
  });

  if (!res) return { ok: false, status: 0, body: "network_error" };
  const body = (await res.text().catch(() => "")) ?? "";
  return { ok: res.ok, status: res.status, body };
}

/** Whether Resend API will be called (prod always; local needs RESEND_ALLOW_SEND). */
export function canSendViaResendApi(): boolean {
  if (!process.env.RESEND_API_KEY?.trim()) return false;
  if (process.env.NODE_ENV === "production") return true;
  const allow = (process.env.RESEND_ALLOW_SEND ?? "").trim().toLowerCase();
  return allow === "1" || allow === "true" || allow === "yes";
}

/** Human-readable reason when canSendViaResendApi() is false. */
export function resendSendBlockedReason(): string | null {
  if (!process.env.RESEND_API_KEY?.trim()) {
    return "RESEND_API_KEY manquant dans .env";
  }
  if (process.env.NODE_ENV === "production") return null;
  const allow = (process.env.RESEND_ALLOW_SEND ?? "").trim().toLowerCase();
  if (allow === "1" || allow === "true" || allow === "yes") return null;
  return "RESEND_ALLOW_SEND=true requis en local (ajoutez dans .env à la racine du projet)";
}

function devPreview(args: Record<string, unknown>): boolean {
  if (process.env.NODE_ENV === "production") {
    console.warn("[email] RESEND_API_KEY missing - email not sent", args);
    return false;
  }
  console.warn(
    "[email] not sent - set RESEND_API_KEY and RESEND_ALLOW_SEND=true in .env",
    args,
  );
  return false;
}

export async function sendEmail(args: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  inlineAttachments?: ResendInlineAttachment[];
  /** PDF/PNG file attachments (no CID - regular attachments). */
  fileAttachments?: ResendFileAttachment[];
  /** Override default noreply@ (e.g. partnership outreach from hi@). */
  from?: string;
  replyTo?: string;
}): Promise<boolean> {
  const from = args.from ?? emailFromAddress();
  const replyTo = args.replyTo ?? emailReplyTo();

  if (!canSendViaResendApi()) {
    return devPreview({
      mode: "html",
      to: args.to,
      from,
      replyTo,
      subject: args.subject,
      preview: args.text ?? args.html.slice(0, 240),
    });
  }

  const inlineAttachments = args.inlineAttachments?.map((a) => ({
    filename: a.filename,
    content: a.content,
    content_id: a.content_id,
    content_type: a.content_type,
  }));

  const fileAttachments = args.fileAttachments?.map((a) => ({
    filename: a.filename,
    content: a.content,
    ...(a.content_type ? { content_type: a.content_type } : {}),
  }));

  const attachments = [
    ...(inlineAttachments ?? []),
    ...(fileAttachments ?? []),
  ];

  const res = await resendFetch("/emails", {
    method: "POST",
    body: JSON.stringify({
      from,
      reply_to: replyTo,
      to: [args.to],
      subject: args.subject,
      html: args.html,
      text: args.text,
      headers: {
        "X-Entity-Ref-ID": crypto.randomUUID(),
      },
      ...(attachments.length ? { attachments } : {}),
    }),
  });

  if (!res.ok) {
    console.error("[email] resend html error", res.status, res.body.slice(0, 400));
    return false;
  }
  return true;
}

export async function sendResendTemplate(args: {
  to: string;
  subject: string;
  templateId: string;
  variables: Record<string, string>;
}): Promise<boolean> {
  const from = emailFromAddress();
  const replyTo = emailReplyTo();

  if (!canSendViaResendApi()) {
    return devPreview({
      mode: "template",
      to: args.to,
      subject: args.subject,
      templateId: args.templateId,
      variables: args.variables,
    });
  }

  const res = await resendFetch("/emails", {
    method: "POST",
    body: JSON.stringify({
      from,
      reply_to: replyTo,
      to: [args.to],
      subject: args.subject,
      template: {
        id: args.templateId,
        variables: args.variables,
      },
    }),
  });

  if (!res.ok) {
    console.error("[email] resend template error", res.status, res.body.slice(0, 400));
    return false;
  }
  return true;
}

/** @deprecated use sendEmail - kept for auth imports */
export const sendAuthEmail = sendEmail;

export function emailVerifyLink(token: string): string {
  return `${appBaseUrl()}/verify-email?token=${encodeURIComponent(token)}`;
}

export function passwordResetLink(token: string): string {
  return `${appBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`;
}

export function emailChangeLink(token: string): string {
  return `${appBaseUrl()}/confirm-email-change?token=${encodeURIComponent(token)}`;
}

export function accountSecurityLink(): string {
  return `${appBaseUrl()}/app/profile/security`;
}

/** Used by scripts/resend-sync-templates.ts */
export async function upsertResendTemplate(args: {
  alias: string;
  name: string;
  subject: string;
  html: string;
  variables: string[];
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const from = emailFromAddress();
  const variableDefs = args.variables.map((key) => ({
    key,
    type: "string" as const,
    fallback_value: key === "ACTION_URL" ? appBaseUrl() : "-",
  }));

  const patch = await resendFetch(`/templates/${encodeURIComponent(args.alias)}`, {
    method: "PATCH",
    body: JSON.stringify({
      name: args.name,
      alias: args.alias,
      from,
      subject: args.subject,
      html: args.html,
      variables: variableDefs,
    }),
  });

  let templateId = args.alias;

  if (patch.status === 404) {
    const created = await resendFetch("/templates", {
      method: "POST",
      body: JSON.stringify({
        name: args.name,
        alias: args.alias,
        from,
        subject: args.subject,
        html: args.html,
        variables: variableDefs,
      }),
    });
    if (!created.ok) {
      return { ok: false, error: created.body.slice(0, 500) };
    }
    try {
      const parsed = JSON.parse(created.body) as { id?: string };
      if (parsed.id) templateId = parsed.id;
    } catch {
      /* alias works for publish */
    }
  } else if (!patch.ok) {
    return { ok: false, error: patch.body.slice(0, 500) };
  }

  const published = await resendFetch(
    `/templates/${encodeURIComponent(args.alias)}/publish`,
    { method: "POST", body: "{}" },
  );

  if (!published.ok) {
    return { ok: false, error: published.body.slice(0, 500) };
  }

  return { ok: true, id: templateId };
}
