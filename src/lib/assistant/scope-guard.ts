import type { AssistantLocale } from "@/lib/assistant/messages";

/**
 * Hard refuse clearly off-scope messages (politics / unrelated ChatGPT-style asks)
 * before calling OpenAI — used for guests and logged-in users alike.
 */

const POLITICS_RE =
  /\b(élection|election|élections|elections|présidentiel|presidential|parti\s+politique|political\s+party|campagne\s+électorale|vote\s+pour|who\s+should\s+i\s+vote|pour\s+qui\s+voter|politique\s+(mondiale|internationale|nationale)|géopolitique|geopolitics|trump|biden|macron|putin|poutine|netanyahu|kabila|tshisekedi|sadc|ua\s+africaine)\b/i;

const WAR_NEWS_RE =
  /\b(guerre\s+(en|au|contre)|war\s+in\s+|ukraine|gaza|israel\s+hamas|conflit\s+armé)\b/i;

/** Generic ChatGPT homework / entertainment outside fintech */
const GENERAL_CHATBOT_RE =
  /\b(écris(-|\s)?moi\s+(un\s+)?(poème|poem|roman|story|histoire|essai|dissertation)|write\s+(me\s+)?(a\s+)?(poem|essay|novel|short\s+story)|faire\s+mes\s+devoirs|do\s+my\s+homework|solve\s+this\s+math|résous\s+ce\s+math|code\s+(me\s+)?(a\s+)?(react|python|java)\s+app|générer\s+du\s+code\s+pour)\b/i;

export function isAssistantOffScope(message: string): boolean {
  const t = message.trim();
  if (t.length < 3) return false;
  // If clearly about McBuleli / crypto product, allow even if a political word appears as country context
  if (
    /\b(mcbuleli|usdt|p2p|kyc|wallet|portefeuille|retrait|dépôt|deposit|withdraw|staking|bot\s+ia|trading|mobile\s+money|didit|escrow|academy|formation)\b/i.test(
      t,
    )
  ) {
    return false;
  }
  return POLITICS_RE.test(t) || WAR_NEWS_RE.test(t) || GENERAL_CHATBOT_RE.test(t);
}

export function offScopeRefusal(locale: AssistantLocale): string {
  if (locale === "fr") {
    return `Je suis **McBuleli AI**, l'assistant officiel de la plateforme McBuleli — pas un ChatGPT général.

Je peux vous aider uniquement sur :
- **Wallet** (USDT, Pi, dépôts / retraits)
- **P2P** et mobile money
- **Trading**, bots IA, staking, AVEC
- **KYC**, sécurité du compte
- **Academy** et parcours crypto McBuleli

Je ne traite pas les sujets politiques, les actualités de conflits, ni les demandes hors McBuleli.

Que souhaitez-vous savoir sur McBuleli ? Par exemple : dépôt USDT, P2P, ou inscription.`;
  }
  if (locale === "sw") {
    return `Mimi ni **McBuleli AI**, msaidizi rasmi wa jukwaa la McBuleli — si ChatGPT ya kawaida.

Ninaweza kukusaidia tu kuhusu:
- **Wallet** (USDT, Pi, amana / kutoa)
- **P2P** na pesa ya simu
- **Trading**, boti za AI, staking, AVEC
- **KYC** na usalama wa akaunti
- **Academy** na elimu ya crypto McBuleli

Sishughuliki siasa, habari za vita, wala maswali nje ya McBuleli.

Ungependa kujua nini kuhusu McBuleli? Mfano: amana ya USDT, P2P, au usajili.`;
  }
  return `I am **McBuleli AI**, the official assistant for the McBuleli platform — not a general ChatGPT.

I can only help with:
- **Wallet** (USDT, Pi, deposits / withdrawals)
- **P2P** and mobile money
- **Trading**, AI bots, staking, AVEC
- **KYC** and account security
- **Academy** and McBuleli crypto learning

I do not discuss politics, conflict news, or topics unrelated to McBuleli.

What would you like to know about McBuleli? For example: USDT deposit, P2P, or signing up.`;
}
