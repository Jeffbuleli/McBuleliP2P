export type TextLocale = "fr" | "en" | "unknown";

const FR_WORDS = new Set([
  "le",
  "la",
  "les",
  "des",
  "une",
  "est",
  "dans",
  "pour",
  "avec",
  "que",
  "qui",
  "pas",
  "vous",
  "nous",
  "sur",
  "mais",
  "cette",
  "comme",
  "plus",
  "très",
  "aussi",
  "tout",
  "sont",
]);

const EN_WORDS = new Set([
  "the",
  "is",
  "are",
  "for",
  "with",
  "this",
  "that",
  "what",
  "how",
  "your",
  "have",
  "not",
  "from",
  "they",
  "will",
  "about",
  "been",
  "just",
]);

/** Lightweight fr/en detection for translation affordance. */
export function detectTextLocale(text: string): TextLocale {
  const sample = text.slice(0, 600);
  if (/[àâäéèêëïîôùûüçœæ]/i.test(sample)) return "fr";

  const words = sample.toLowerCase().split(/\s+/);
  let fr = 0;
  let en = 0;
  for (const w of words) {
    const clean = w.replace(/[^a-zàâäéèêëïîôùûüç]/gi, "");
    if (FR_WORDS.has(clean)) fr += 1;
    if (EN_WORDS.has(clean)) en += 1;
  }
  if (fr > en && fr >= 2) return "fr";
  if (en > fr && en >= 2) return "en";
  return "unknown";
}

export function shouldOfferTranslation(
  text: string,
  userLocale: "en" | "fr",
): boolean {
  const detected = detectTextLocale(text);
  if (detected === "unknown") return false;
  return detected !== userLocale;
}
