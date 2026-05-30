import type { AssistantLocale } from "@/lib/assistant/messages";

const LANG_NAMES: Record<AssistantLocale, string> = {
  en: "English",
  fr: "French",
  sw: "Swahili (Kiswahili)",
};

export function assistantLanguageName(locale: AssistantLocale): string {
  return LANG_NAMES[locale];
}

/** Detect if the user explicitly asks for a language switch in their message. */
export function detectRequestedLanguage(
  text: string,
): AssistantLocale | null {
  const t = text.trim().toLowerCase();
  if (
    /\b(kiswahili|swahili|mu swahili|in swahili|en swahili| kwa kiswahili)\b/i.test(
      t,
    ) ||
    /\bni eleweshe\b.*\b(swahili|kiswahili)\b/i.test(t)
  ) {
    return "sw";
  }
  if (
    /\b(en français|in french|en francais|parle français|explique.*français)\b/i.test(
      t,
    )
  ) {
    return "fr";
  }
  if (
    /\b(in english|en anglais|speak english|explain.*english)\b/i.test(t)
  ) {
    return "en";
  }
  return null;
}

export function resolveReplyLocale(args: {
  uiLocale: AssistantLocale;
  userMessage: string;
}): AssistantLocale {
  return detectRequestedLanguage(args.userMessage) ?? args.uiLocale;
}
