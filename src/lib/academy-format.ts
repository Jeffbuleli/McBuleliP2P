import { numFromNumeric } from "@/lib/wallet-types";

/** Display USDT price (e.g. 49 not 49.000000000000000000). */
export function formatAcademyUsdtPrice(
  raw: string | number | null | undefined,
): string {
  const n =
    typeof raw === "number" ? raw : numFromNumeric(String(raw ?? "").trim());
  if (!Number.isFinite(n) || n <= 0) return "0";
  const s = n.toFixed(2).replace(/(\.\d*?[1-9])0+$/, "$1").replace(/\.0+$/, "");
  return s;
}
