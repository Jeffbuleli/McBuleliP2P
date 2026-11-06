import { isLocale, type Locale } from "@/lib/i18n";

const SIGNALS: Array<{ locale: Locale; ask: RegExp; words: RegExp }> = [
  {
    locale: "fr",
    ask: /\b(fran[cç]ais|en fran[cç]ais|parle fran|parlez fran)\b/i,
    words:
      /\b(bonjour|salut|merci|aide|je |j'|tu |vous |c'est|école|ecole|oui|non|quoi|comment|suis|besoin)\b/i,
  },
  {
    locale: "en",
    ask: /\b(in english|speak english|english please)\b/i,
    words: /\b(hello|hi|please|thanks|help|i am|i'm|what|where|are you|need)\b/i,
  },
  {
    locale: "ln",
    ask: /\b(lingala|parle lingala)\b/i,
    words: /\b(mbote|sango|nani|wapi|ozali|yango|bolingo|likambo|matondi|nazali)\b/i,
  },
  {
    locale: "sw",
    ask: /\b(kiswahili|swahili)\b/i,
    words: /\b(habari|asante|tafadhali|niko|msaada|sawa|ndiyo|hapana|nini)\b/i,
  },
  {
    locale: "lua",
    ask: /\b(tshiluba|ciluba)\b/i,
    words: /\b(tshiluba|ciluba|udi|moyo|bualu|tudi)\b/i,
  },
  {
    locale: "kg",
    ask: /\b(kikongo)\b/i,
    words: /\b(kikongo|mbote|nge|kele|zola|zaba)\b/i,
  },
];

/** La réponse suit la langue du message : fr, en, ln, sw, lua, kg. */
export function resolveReplyLocale(
  text: string,
  stored?: string | null,
): Locale {
  for (const signal of SIGNALS) {
    if (signal.ask.test(text)) return signal.locale;
  }
  const hits = SIGNALS.filter((signal) => signal.words.test(text));
  if (hits.length === 1) return hits[0].locale;
  if (stored && isLocale(stored)) return stored;
  return "fr";
}

export function englishLeak(locale: Locale, reply: string): boolean {
  if (locale === "en") return false;
  return /\b(are you|right now|i am here|tell me|where are you)\b/i.test(reply);
}
