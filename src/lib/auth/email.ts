const DEFAULT_FROM = "McBuleli <noreply@mcbuleli.org>";

export function appBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ??
    "https://mcbuleli.org"
  );
}

export async function sendAuthEmail(args: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.AUTH_EMAIL_FROM?.trim() || DEFAULT_FROM;

  if (!key) {
    if (process.env.NODE_ENV === "production") {
      console.warn("[auth/email] RESEND_API_KEY missing — email not sent", {
        to: args.to,
        subject: args.subject,
      });
      return false;
    }
    console.info("[auth/email] dev mode", {
      to: args.to,
      subject: args.subject,
      preview: args.text ?? args.html.slice(0, 200),
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
      to: [args.to],
      subject: args.subject,
      html: args.html,
      text: args.text,
    }),
  }).catch((err) => {
    console.error("[auth/email] send failed", err);
    return null;
  });

  if (!res?.ok) {
    const detail = (await res?.text().catch(() => "")) ?? "";
    console.error("[auth/email] resend error", res?.status, detail.slice(0, 300));
    return false;
  }
  return true;
}

export function emailVerifyLink(token: string): string {
  return `${appBaseUrl()}/verify-email?token=${encodeURIComponent(token)}`;
}

export function passwordResetLink(token: string): string {
  return `${appBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`;
}

export function emailChangeLink(token: string): string {
  return `${appBaseUrl()}/confirm-email-change?token=${encodeURIComponent(token)}`;
}
