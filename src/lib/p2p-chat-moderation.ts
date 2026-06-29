/**
 * P2P order chat - anti-scam heuristics (extends DM rules).
 */

import { moderateDmText, type DmModerationResult } from "@/lib/community/dm-moderation";

const P2P_SCAM_KEYWORDS = [
  "pay outside",
  "off platform",
  "hors plateforme",
  "hors de l'app",
  "release first",
  "libérez d'abord",
  "fake escrow",
  "faux séquestre",
  "binance escrow",
  "okx escrow",
  "whatsapp only",
  "telegram only",
  "contact me on",
  "appeal outside",
  "i am support",
  "je suis support",
  "official agent",
  "agent officiel",
  "send to this address",
  "envoyez à cette adresse",
  "cancel and pay",
  "annulez et payez",
  "double payment",
  "same receipt",
  "même reçu",
];

export type P2pChatModerationResult = DmModerationResult;

export function moderateP2pChatText(body: string): P2pChatModerationResult {
  const base = moderateDmText(body);
  if (!base.allowed) return base;

  const lower = body.trim().toLowerCase();
  for (const kw of P2P_SCAM_KEYWORDS) {
    if (lower.includes(kw)) {
      return {
        allowed: false,
        hidden: true,
        reason: "p2p_scam_keyword",
        sanitizedBody: body.trim(),
      };
    }
  }

  return base;
}
