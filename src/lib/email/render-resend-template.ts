import { getEmailCopy } from "@/lib/email/copy";
import { renderMcBuleliEmail } from "@/lib/email/layout";
import type { EmailLocale } from "@/lib/email/locale";
import {
  findTemplateDef,
  type McBuleliTemplateKind,
} from "@/lib/email/template-definitions";

export function renderResendTemplateHtml(args: {
  kind: McBuleliTemplateKind;
  locale: EmailLocale;
}): string {
  const def = findTemplateDef(args.kind, args.locale);
  if (!def) throw new Error(`template_not_found:${args.kind}:${args.locale}`);

  let copy = getEmailCopy(def.copyKey, args.locale);
  if (def.kind === "emailChangeAlert") {
    const body =
      args.locale === "fr"
        ? `${copy.body} Nouvelle adresse demandée : {{{NEW_EMAIL}}}.`
        : `${copy.body} Requested address: {{{NEW_EMAIL}}}.`;
    copy = { ...copy, body };
  }

  const { html } = renderMcBuleliEmail({
    copy,
    actionUrl: "{{{ACTION_URL}}}",
    illustration: def.illustration,
    locale: args.locale,
    resendVariables: true,
  });
  return html;
}
