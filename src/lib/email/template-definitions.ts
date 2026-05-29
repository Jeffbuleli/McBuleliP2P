import type { EmailCopyKey } from "@/lib/email/copy";
import type { EmailIllustration } from "@/lib/email/config";
import type { EmailLocale } from "@/lib/email/locale";
import { walletTemplateVariables } from "@/lib/email/wallet-email-details";

export type McBuleliTemplateKind =
  | "verify"
  | "passwordReset"
  | "emailChange"
  | "emailChangeAlert"
  | "passwordChanged"
  | "depositUsdt"
  | "depositPi"
  | "withdrawUsdt"
  | "withdrawPi"
  | "withdrawQueuedUsdt"
  | "withdrawQueuedPi";

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
  depositUsdt: "deposit-usdt",
  depositPi: "deposit-pi",
  withdrawUsdt: "withdraw-usdt",
  withdrawPi: "withdraw-pi",
  withdrawQueuedUsdt: "withdraw-queued-usdt",
  withdrawQueuedPi: "withdraw-queued-pi",
};

export function mcbuleliTemplateAlias(
  kind: McBuleliTemplateKind,
  locale: EmailLocale,
): string {
  return `mcbuleli-${ALIAS[kind]}-${locale}`;
}

const AUTH_TEMPLATES = [
  {
    kind: "verify" as const,
    copyKey: "verify" as const,
    illustration: "verify" as const,
    variables: ["ACTION_URL"],
  },
  {
    kind: "passwordReset" as const,
    copyKey: "passwordReset" as const,
    illustration: "reset" as const,
    variables: ["ACTION_URL"],
  },
  {
    kind: "emailChange" as const,
    copyKey: "emailChange" as const,
    illustration: "change" as const,
    variables: ["ACTION_URL"],
  },
  {
    kind: "emailChangeAlert" as const,
    copyKey: "emailChangeAlert" as const,
    illustration: "security" as const,
    variables: ["ACTION_URL", "NEW_EMAIL"],
  },
  {
    kind: "passwordChanged" as const,
    copyKey: "passwordChanged" as const,
    illustration: "security" as const,
    variables: ["ACTION_URL"],
  },
];

const WALLET_TEMPLATES = [
  {
    kind: "depositUsdt" as const,
    copyKey: "depositUsdt" as const,
    illustration: "depositUsdt" as const,
  },
  {
    kind: "depositPi" as const,
    copyKey: "depositPi" as const,
    illustration: "depositPi" as const,
  },
  {
    kind: "withdrawUsdt" as const,
    copyKey: "withdrawUsdt" as const,
    illustration: "withdrawUsdt" as const,
  },
  {
    kind: "withdrawPi" as const,
    copyKey: "withdrawPi" as const,
    illustration: "withdrawPi" as const,
  },
  {
    kind: "withdrawQueuedUsdt" as const,
    copyKey: "withdrawQueuedUsdt" as const,
    illustration: "withdrawUsdt" as const,
  },
  {
    kind: "withdrawQueuedPi" as const,
    copyKey: "withdrawQueuedPi" as const,
    illustration: "withdrawPi" as const,
  },
];

export const MC_BULELI_EMAIL_TEMPLATES: McBuleliTemplateDef[] = [
  ...AUTH_TEMPLATES,
  ...WALLET_TEMPLATES,
].flatMap((base) =>
  (["fr", "en"] as EmailLocale[]).map(
    (locale): McBuleliTemplateDef => ({
      ...base,
      locale,
      alias: mcbuleliTemplateAlias(base.kind, locale),
      variables:
        "variables" in base
          ? [...base.variables]
          : walletTemplateVariables(base.kind),
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
