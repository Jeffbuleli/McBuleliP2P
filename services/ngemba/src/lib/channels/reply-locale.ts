import { isLocale, type Locale } from "@/lib/i18n";

const ASK_FR =
  /\b(fran[cç]ais|en fran[cç]ais|parle fran|parlez fran|en francais)\b/i;
const ASK_EN = /\b(in english|speak english|english please)\b/i;
const FR =
  /\b(bonjour|salut|merci|aide|je |j'|tu |vous |c'est|école|ecole|oui|non|parle|quoi|comment|une |des |suis)\b/i;
const EN =
  /\b(hello|hi there|please|thanks|help me|i am|i'm|what |where |are you)\b/i;

/** La langue de réponse suit le message, pas la langue du téléphone. Défaut : français. */
export function resolveReplyLocale(
  text: string,
  stored?: string | null,
): Locale {
  if (ASK_FR.test(text)) return "fr";
  if (ASK_EN.test(text)) return "en";
  const french = FR.test(text);
  const english = EN.test(text);
  if (french && !english) return "fr";
  if (english && !french) return "en";
  if (stored && isLocale(stored) && stored !== "en") return stored;
  if (stored === "en" && !english) return "fr";
  return "fr";
}

export function englishLeak(locale: Locale, reply: string): boolean {
  if (locale === "en") return false;
  return /\b(are you|right now|i am here|tell me|where are you|safe)\b/i.test(
    reply,
  );
}
