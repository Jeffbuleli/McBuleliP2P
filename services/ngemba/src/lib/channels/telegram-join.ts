import { timingSafeEqual } from "crypto";
import { readEnvKey } from "@/lib/env";

export function appBaseUrl(): string {
  return (
    readEnvKey("APP_URL") ||
    readEnvKey("NEXT_PUBLIC_APP_URL") ||
    "https://ngemba-rdc.org"
  ).replace(/\/$/, "");
}

export function telegramAppChatUrl(
  sessionId: string,
  citizenToken: string,
): string {
  const q = new URLSearchParams({ s: sessionId, k: citizenToken });
  return `${appBaseUrl()}/api/channels/telegram/join?${q.toString()}`;
}

export function citizenTokensMatch(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length === 0 || left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function holdReply(locale: string): string {
  if (locale === "en") {
    return "Passed on. The team replies in this conversation.";
  }
  if (locale === "ln") {
    return "Ekomi na ekipi. Ekipi ekozongisa awa.";
  }
  if (locale === "sw") {
    return "Imepelekwa. Timu itajibu katika mazungumzo haya.";
  }
  return "C'est transmis. L'équipe vous répond dans cette conversation.";
}

export function handoffLink(locale: string, url: string): string {
  if (locale === "en") {
    return (
      "To reach the team right away, open the app. It is the same conversation. Write in the chat: the team sees it here and there.\n" +
      url
    );
  }
  if (locale === "ln") {
    return (
      "Po na kokutana na ekipi sikoyo, fungola application. Ezali likambo moko. Koma na chat : ekipi emona yango awa mpe kuna.\n" +
      url
    );
  }
  if (locale === "sw") {
    return (
      "Ili kufikia timu sasa, fungua programu. Ni mazungumzo yale yale. Andika kwenye gumzo: timu inaona hapa na huko.\n" +
      url
    );
  }
  return (
    "Pour rejoindre l'équipe tout de suite, ouvrez l'application. C'est le même échange. Écrivez dans le chat : l'équipe le voit ici et là-bas.\n" +
    url
  );
}
