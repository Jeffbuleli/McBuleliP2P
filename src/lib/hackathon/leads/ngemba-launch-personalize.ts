/**
 * NGEMBA post-Hackathon launch email personalized for lead outreach.
 * Source HTML: content/email-broadcasts/ngemba-hackathon-launch-fr.{html,txt}
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { PersonalizedEmail } from "./lead-personalize";

export const NGEMBA_LAUNCH_TEMPLATE_KEY = "ngemba_hackathon_launch";
export const NGEMBA_LAUNCH_SUBJECT =
  "NGEMBA · Paix en Kikongo · solution née du Hackathon";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function loadTemplates(): { html: string; text: string } {
  const base = path.join(process.cwd(), "content/email-broadcasts");
  const htmlPath = path.join(base, "ngemba-hackathon-launch-fr.html");
  const txtPath = path.join(base, "ngemba-hackathon-launch-fr.txt");
  if (!existsSync(htmlPath) || !existsSync(txtPath)) {
    throw new Error("ngemba_launch_templates_missing");
  }
  return {
    html: readFileSync(htmlPath, "utf8"),
    text: readFileSync(txtPath, "utf8"),
  };
}

export function personalizeNgembaLaunchEmail(args: {
  firstName: string;
  unsubscribeUrl: string;
  company?: string | null;
}): PersonalizedEmail {
  const first = (args.firstName || "ami").trim() || "ami";
  const { html: rawHtml, text: rawText } = loadTemplates();
  const html = rawHtml
    .replace(/\{\{\{contact\.first_name\|ami\}\}\}/g, esc(first))
    .replace(/\{\{\{RESEND_UNSUBSCRIBE_URL\}\}\}/g, esc(args.unsubscribeUrl));
  const text = rawText
    .replace(/Bonjour,/g, `Bonjour ${first},`)
    .replace(/\{\{\{RESEND_UNSUBSCRIBE_URL\}\}\}/g, args.unsubscribeUrl);

  return {
    subject: NGEMBA_LAUNCH_SUBJECT,
    html,
    text,
    facts: {
      template: NGEMBA_LAUNCH_TEMPLATE_KEY,
      firstName: first,
      company: args.company ?? "",
    },
    personalizationRate: first.toLowerCase() === "ami" ? 40 : 85,
  };
}
