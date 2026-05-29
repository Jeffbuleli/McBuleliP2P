import {
  appBaseUrl,
  emailFromAddress,
  emailReplyTo,
} from "@/lib/email/config";

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

function maySendViaResendApi(): boolean {
  if (!process.env.RESEND_API_KEY?.trim()) return false;
  if (process.env.NODE_ENV === "production") return true;
  const allow = (process.env.RESEND_ALLOW_SEND ?? "").trim().toLowerCase();
  return allow === "1" || allow === "true" || allow === "yes";
}

function devPreview(args: Record<string, unknown>): boolean {
  if (process.env.NODE_ENV === "production") {
    console.warn("[email] RESEND_API_KEY missing — email not sent", args);
    return false;
  }
  console.info(
    "[email] dev preview (no Resend API call — set RESEND_ALLOW_SEND=true to send)",
    args,
  );
  return true;
}

export async function sendEmail(args: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<boolean> {
  const from = emailFromAddress();
  const replyTo = emailReplyTo();

  if (!maySendViaResendApi()) {
    return devPreview({
      mode: "html",
      to: args.to,
      subject: args.subject,
      preview: args.text ?? args.html.slice(0, 240),
    });
  }

  const res = await resendFetch("/emails", {
    method: "POST",
    body: JSON.stringify({
      from,
      reply_to: replyTo,
      to: [args.to],
      subject: args.subject,
      html: args.html,
      text: args.text,
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

  if (!maySendViaResendApi()) {
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

/** @deprecated use sendEmail — kept for auth imports */
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
    fallback_value: key === "ACTION_URL" ? appBaseUrl() : "—",
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
