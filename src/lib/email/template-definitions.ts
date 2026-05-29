import type { EmailCopyKey } from "@/lib/email/copy";
import type { EmailIllustration } from "@/lib/email/config";
import type { EmailLocale } from "@/lib/email/locale";

export type McBuleliTemplateKind =
  | "verify"
  | "passwordReset"
  | "emailChange"
  | "emailChangeAlert"
  | "passwordChanged";

export type McBuleliTemplateDef = {
  kind: McBuleliTemplateKind;
  locale: EmailLocale;
  alias: string;
  copyKey: EmailCopyKey;
  illustration: EmailIllustration;
  /** Resend template variables (UPPER_SNAKE). */
  variables: string[];
};

const ALIAS: Record<McBuleliTemplateKind, string> = {
  verify: "verify",
  passwordReset: "reset",
  emailChange: "email-change",
  emailChangeAlert: "email-alert",
  passwordChanged: "password-changed",
};

export function mcbuleliTemplateAlias(
  kind: McBuleliTemplateKind,
  locale: EmailLocale,
): string {
  return `mcbuleli-${ALIAS[kind]}-${locale}`;
}

export const MC_BULELI_EMAIL_TEMPLATES: McBuleliTemplateDef[] = (
  [
    {
      kind: "verify",
      copyKey: "verify",
      illustration: "verify",
      variables: ["ACTION_URL"],
    },
    {
      kind: "passwordReset",
      copyKey: "passwordReset",
      illustration: "reset",
      variables: ["ACTION_URL"],
    },
    {
      kind: "emailChange",
      copyKey: "emailChange",
      illustration: "change",
      variables: ["ACTION_URL"],
    },
    {
      kind: "emailChangeAlert",
      copyKey: "emailChangeAlert",
      illustration: "security",
      variables: ["ACTION_URL", "NEW_EMAIL"],
    },
    {
      kind: "passwordChanged",
      copyKey: "passwordChanged",
      illustration: "security",
      variables: ["ACTION_URL"],
    },
  ] as const
).flatMap((base) =>
  (["fr", "en"] as EmailLocale[]).map(
    (locale): McBuleliTemplateDef => ({
      ...base,
      locale,
      alias: mcbuleliTemplateAlias(base.kind, locale),
      variables: [...base.variables],
    }),
  ),
);

export function findTemplateDef(
  kind: McBuleliTemplateKind,
  locale: EmailLocale,
): McBuleliTemplateDef | undefined {
  return MC_BULELI_EMAIL_TEMPLATES.find((t) => t.kind === kind && t.locale === locale);
}

/** Override alias via env, e.g. RESEND_TEMPLATE_VERIFY_FR */
export function resolveTemplateId(
  kind: McBuleliTemplateKind,
  locale: EmailLocale,
): string {
  const slug = ALIAS[kind].replace(/-/g, "_").toUpperCase();
  const envKey = `RESEND_TEMPLATE_${slug}_${locale.toUpperCase()}`;
  const override = process.env[envKey]?.trim();
  if (override) return override;
  return mcbuleliTemplateAlias(kind, locale);
}

export function resendTemplatesEnabled(): boolean {
  if (process.env.RESEND_USE_TEMPLATES?.trim() === "false") return false;
  if (process.env.RESEND_USE_TEMPLATES?.trim() === "true") {
    return Boolean(process.env.RESEND_API_KEY?.trim());
  }
  return Boolean(process.env.RESEND_API_KEY?.trim());
}
