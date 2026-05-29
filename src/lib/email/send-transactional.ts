import { getEmailCopy, emailSubject } from "@/lib/email/copy";
import { renderMcBuleliEmail } from "@/lib/email/layout";
import type { EmailLocale } from "@/lib/email/locale";
import { sendBrandedEmail } from "@/lib/email/send-branded";
import { sendResendTemplate } from "@/lib/email/send";
import {
  findTemplateDef,
  type McBuleliTemplateKind,
  resendTemplatesEnabled,
  resolveTemplateId,
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
  const variables: Record<string, string> = {
    ACTION_URL: args.actionUrl,
  };
  if (args.newEmail) variables.NEW_EMAIL = args.newEmail;

  if (resendTemplatesEnabled()) {
    const templateId = resolveTemplateId(args.kind, locale);
    const sent = await sendResendTemplate({
      to: args.to,
      subject,
      templateId,
      variables,
    });
    if (sent) return true;
    console.warn("[email] Resend template failed — falling back to inline HTML", {
      kind: args.kind,
      templateId,
    });
  }

  const { html, text } = renderMcBuleliEmail({
    copy,
    actionUrl: args.actionUrl,
    illustration: def.illustration,
    locale,
    imageMode: "cid",
  });

  return sendBrandedEmail({
    to: args.to,
    subject,
    html,
    text,
    illustration: def.illustration,
  });
}
