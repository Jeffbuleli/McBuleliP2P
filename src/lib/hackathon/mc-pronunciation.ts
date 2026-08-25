/**
 * Spoken FR forms for McBuleli IA (browser TTS + OpenAI TTS).
 * Order matters: longer / more specific patterns first.
 */

const PRONUNCIATION: Array<[RegExp, string]> = [
  [/\bMcBuleli IA\b/gi, "Mac Bouléli I A"],
  [/\bMcBuleli P2P\b/gi, "Mac Bouléli Pé deux Pé"],
  [/\bMcBuleli ISP\b/gi, "Mac Bouléli I S P"],
  [/\bMcBuleli Meet\b/gi, "Mac Bouléli Meet"],
  [/\bMcBuleli\b/gi, "Mac Bouléli"],
  [/\bSilikin\b/gi, "Silikine"],
  [/\bTYTS\b/g, "The Young Technology Service"],
  [/\bTHE YOUNG TECHNOLOGY SERVICE\b/gi, "The Young Technology Service"],
  [/\bIA Académie\s*\/\s*CHK\b/gi, "I A Académie"],
  [/\bIA Académie\b/gi, "I A Académie"],
  [/\bCHK\b/g, "C H K"],
  [/\bIA\b/g, "I A"],
  [/\bKilelo\b/gi, "Kilélo"],
  [/\bMontanaPay\b/gi, "Montana Pay"],
  [/\bKIMIA Service\b/gi, "Kimia Service"],
  [/\bKIMIA\b/g, "Kimia"],
  [/\bILOKWE GROUP\b/gi, "Ilokoué Group"],
  [/\bILOKWE\b/gi, "Ilokoué"],
  [/\bpawaPay\b/gi, "Pawa Pay"],
  [/\bBinance\b/gi, "Binance"],
  [/\bDemo Day\b/gi, "Démo Day"],
  [/\bMini Demo\b/gi, "Mini Démo"],
  [/\bVibe Coding\b/gi, "Vaïbe Coding"],
  [/\bCursor\b/gi, "Curseur"],
  [/\bClaude\b/gi, "Claude"],
  [/\bCodex\b/gi, "Codex"],
  [/\bMme Patty Basoga\b/gi, "Madame Patty Basoga"],
  [/\bMadame Patty Basoga\b/gi, "Madame Patty Basoga"],
  [/\bPatty Basoga\b/gi, "Patty Basoga"],
  [/\bMme Patty B\./gi, "Madame Patty Basoga"],
  [/\bMadame Patty Bé\b/gi, "Madame Patty Basoga"],
  [/\bPatty Bé\b/gi, "Patty Basoga"],
  [/\bPatty B\b/gi, "Patty Basoga"],
  [/\bIr Jeff Buleli\b/gi, "Ingénieur Jeff Bouléli"],
  [/\bJeff Buleli\b/gi, "Jeff Bouléli"],
  [/\bAristote Mugisho\b/gi, "Aristote Moughicho"],
  [/\bRodrigue Kashara David\b/gi, "Rodrigue Kachara David"],
  [/\bMike Mulopo\b/gi, "Mike Mulopo"],
  [/\bDelly Montana\b/gi, "Delly Montana"],
  [/\bChristian Ikwele\b/gi, "Christian Ikwélé"],
  [/\bAaron Nsomone\b/gi, "Aaron Nsomoné"],
  [/\bJeancy Kabangu\b/gi, "Djéancy Kabangou"],
  [/\bMr\b/g, "Monsieur"],
  [/\bCyber Alert DRC\b/gi, "Cyber Alert D R C"],
  [/\bSafeFind\b/gi, "Safe Find"],
  [/\bAfrica Insight\b/gi, "Africa Insight"],
  [/·/g, ","],
  [/–|—/g, ","],
];

export function applyMcPronunciation(text: string): string {
  let out = text;
  for (const [re, spoken] of PRONUNCIATION) {
    out = out.replace(re, spoken);
  }
  return out.replace(/\s+/g, " ").trim();
}
