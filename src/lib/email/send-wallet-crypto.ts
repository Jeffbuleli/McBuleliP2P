import { getEmailCopy, emailSubject } from "@/lib/email/copy";
import { renderMcBuleliEmail } from "@/lib/email/layout";
import type { EmailLocale } from "@/lib/email/locale";
import { sendBrandedEmail } from "@/lib/email/send-branded";
import { sendResendTemplate } from "@/lib/email/send";
import {
  buildWalletDetailRows,
  type EmailDetailRow,
} from "@/lib/email/wallet-email-details";
import {
  findTemplateDef,
  resendTemplatesEnabled,
  resolveTemplateId,
  type McBuleliTemplateKind,
} from "@/lib/email/template-definitions";

export type WalletCryptoEmailVariables = {
  AMOUNT: string;
  ASSET: string;
  NETWORK: string;
  TXID?: string;
  FEE?: string;
  TOTAL?: string;
  ADDRESS?: string;
  REASON?: string;
};

export async function sendMcBuleliWalletCryptoEmail(args: {
  to: string;
  kind: McBuleliTemplateKind;
  locale: EmailLocale;
  actionUrl: string;
  variables: WalletCryptoEmailVariables;
  detailRows: EmailDetailRow[];
}): Promise<boolean> {
  const locale = args.locale;
  const def = findTemplateDef(args.kind, locale);
  if (!def) return false;

  const copy = getEmailCopy(def.copyKey, locale);
  const subject = emailSubject(def.copyKey, locale);

  if (resendTemplatesEnabled()) {
    const variables: Record<string, string> = {
      ACTION_URL: args.actionUrl,
      ...args.variables,
    };
    return sendResendTemplate({
      to: args.to,
      subject,
      templateId: resolveTemplateId(args.kind, locale),
      variables,
    });
  }

  const { html, text } = renderMcBuleliEmail({
    copy,
    actionUrl: args.actionUrl,
    illustration: def.illustration,
    locale,
    detailRows: args.detailRows,
  });

  return sendBrandedEmail({
    to: args.to,
    subject,
    html,
    text,
  });
}

export function walletDetailRowsForTemplate(args: {
  kind: McBuleliTemplateKind;
  locale: EmailLocale;
}): EmailDetailRow[] {
  return buildWalletDetailRows({
    kind: args.kind,
    locale: args.locale,
    resendPlaceholders: true,
    amount: "",
    asset: "",
    networkCanonical: "",
  });
}
