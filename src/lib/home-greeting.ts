import { p2pDisplayName } from "@/lib/p2p-display";

export function homeDisplayName(u: {
  email: string;
  displayName: string | null;
  piUsername: string | null;
}): string | null {
  const label = p2pDisplayName({
    email: u.email,
    displayName: u.displayName,
    piUsername: u.piUsername,
    avatarUrl: null,
  });
  if (label === "Trader") return null;
  return label.replace(/^@/, "");
}

/** Bonjour/Bonsoir + pseudo, or Bonjour Trader when unset. */
export function homeGreetingLine(locale: "en" | "fr", name: string | null): string {
  const hour = new Date().getHours();
  const evening = hour >= 18 || hour < 5;
  const who = name ?? (locale === "fr" ? "Trader" : "Trader");

  if (locale === "fr") {
    return evening ? `Bonsoir ${who}` : `Bonjour ${who}`;
  }
  return evening ? `Good evening, ${who}` : `Good morning, ${who}`;
}
