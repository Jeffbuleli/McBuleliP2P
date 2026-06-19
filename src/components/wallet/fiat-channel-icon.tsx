/** Channel icons for fiat history rows (generic marks, not official logos). */

export type FiatChannelId = "airtel" | "orange" | "mpesa" | "africell" | "card" | "momo";

export function resolveFiatChannelId(args: {
  provider?: string | null;
  rail?: "momo" | "card";
}): FiatChannelId {
  if (args.rail === "card" || args.provider === "card") return "card";
  const p = (args.provider ?? "").toLowerCase();
  if (p.includes("airtel")) return "airtel";
  if (p.includes("orange")) return "orange";
  if (p.includes("mpesa") || p.includes("vodacom")) return "mpesa";
  if (p.includes("africell") || p.includes("afrimoney")) return "africell";
  return "momo";
}

const CHANNEL_STYLE: Record<FiatChannelId, { bg: string; fg: string; mark: string }> = {
  airtel: { bg: "#E40000", fg: "#fff", mark: "A" },
  orange: { bg: "#FF7900", fg: "#fff", mark: "O" },
  mpesa: { bg: "#E60000", fg: "#fff", mark: "M" },
  africell: { bg: "#E30613", fg: "#fff", mark: "Af" },
  card: { bg: "#1A1F71", fg: "#fff", mark: "V" },
  momo: { bg: "var(--fd-brown)", fg: "#fff", mark: "₣" },
};

export function FiatChannelIcon({
  channel,
  className = "h-5 w-5",
}: {
  channel: FiatChannelId;
  className?: string;
}) {
  const s = CHANNEL_STYLE[channel];
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold ${className}`}
      style={{ backgroundColor: s.bg, color: s.fg, fontSize: channel === "africell" ? "0.45rem" : "0.55rem" }}
      aria-hidden
    >
      {s.mark}
    </span>
  );
}
