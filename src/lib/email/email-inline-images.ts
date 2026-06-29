import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { EmailIllustration } from "@/lib/email/config";

export const EMAIL_LOGO_CID = "mcbuleli-logo";

export function emailIllustrationCid(kind: EmailIllustration): string {
  return `mcbuleli-illus-${kind}`;
}

export type ResendInlineAttachment = {
  filename: string;
  content: string;
  content_id: string;
  content_type: string;
};

export type ResendFileAttachment = {
  filename: string;
  content: string;
  content_type?: string;
};

const PUBLIC = join(process.cwd(), "public");

const ILLUSTRATION_FILES: Record<EmailIllustration, string> = {
  verify: "email/email-verify.png",
  reset: "email/email-reset.png",
  change: "email/email-change.png",
  security: "email/email-security.png",
  depositUsdt: "email/email-deposit-usdt.png",
  depositPi: "email/email-deposit-pi.png",
  withdrawUsdt: "email/email-withdraw-usdt.png",
  withdrawPi: "email/email-withdraw-pi.png",
};

function readPngAttachment(relativePath: string, contentId: string): ResendInlineAttachment {
  const abs = join(PUBLIC, relativePath);
  const content = readFileSync(abs).toString("base64");
  const filename = relativePath.split("/").pop() ?? "image.png";
  return {
    filename,
    content,
    content_id: contentId,
    content_type: "image/png",
  };
}

/** Resend CID inline images - works in Gmail, Outlook, mobile (unlike data: URIs). */
export function buildMcBuleliInlineAttachments(
  illustration: EmailIllustration,
): ResendInlineAttachment[] {
  return [
    readPngAttachment("brand/logo-256.png", EMAIL_LOGO_CID),
    readPngAttachment(ILLUSTRATION_FILES[illustration], emailIllustrationCid(illustration)),
  ];
}
