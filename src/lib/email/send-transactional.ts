import { getEmailCopy, emailSubject } from "@/lib/email/copy";
import { renderMcBuleliEmail } from "@/lib/email/layout";
import type { EmailLocale } from "@/lib/email/locale";
import { sendBrandedEmail } from "@/lib/email/send-branded";
import {
  findTemplateDef,
  type McBuleliTemplateKind,
} from "@/lib/email/template-definitions";

function copyKeyForKind(kind: McBuleliTemplateKind) {
  return findTemplateDef(kind, "fr")!.copyKey;
}

function alertBody(copy: ReturnType<typeof getEmailCopy>, newEmail: string, locale: EmailLocale) {
  return locale === "fr"
    ? `${copy.body} Nouvelle adresse demandée : ${newEmail}.`
    : `${copy.body} Requested address: ${newEmail}.`;
}

export async function sendMcBuleliTransactionalEmail(args: {
  to: string;
  kind: McBuleliTemplateKind;
  locale: EmailLocale;
  actionUrl: string;
  newEmail?: string;
}): Promise<boolean> {
  const locale = args.locale;
  const def = findTemplateDef(args.kind, locale);
  if (!def) return false;

  const copyKey = copyKeyForKind(args.kind);
  const copyBase = getEmailCopy(copyKey, locale);
  const copy =
    args.kind === "emailChangeAlert" && args.newEmail
      ? { ...copyBase, body: alertBody(copyBase, args.newEmail, locale) }
      : copyBase;

  const subject = emailSubject(copyKey, locale);

  // Always send inline HTML with https://mcbuleli.org images (dashboard templates omit assets).
  const { html, text } = renderMcBuleliEmail({
    copy,
    actionUrl: args.actionUrl,
    illustration: def.illustration,
    locale,
  });

  return sendBrandedEmail({
    to: args.to,
    subject,
    html,
    text,
  });
}
