import {
  appBaseUrl,
  emailFromAddress,
  emailReplyTo,
} from "@/lib/email/config";

export { appBaseUrl };

export async function sendEmail(args: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = emailFromAddress();
  const replyTo = emailReplyTo();

  if (!key) {
    if (process.env.NODE_ENV === "production") {
      console.warn("[email] RESEND_API_KEY missing — email not sent", {
        to: args.to,
        subject: args.subject,
      });
      return false;
    }
    console.info("[email] dev preview", {
      to: args.to,
      subject: args.subject,
      preview: args.text ?? args.html.slice(0, 240),
    });
    return true;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      reply_to: replyTo,
      to: [args.to],
      subject: args.subject,
      html: args.html,
      text: args.text,
    }),
  }).catch((err) => {
    console.error("[email] send failed", err);
    return null;
  });

  if (!res?.ok) {
    const detail = (await res?.text().catch(() => "")) ?? "";
    console.error("[email] resend error", res?.status, detail.slice(0, 400));
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
