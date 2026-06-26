/** Resolve FreshPay sandbox vs production when FRESHPAY_ENV is unset. */
export function resolveFreshpayEnvMode(scope: "card" | "momo" = "momo"): "production" | "sandbox" {
  const scoped =
    scope === "card"
      ? process.env.FRESHPAY_CARD_ENV?.trim().toLowerCase()
      : undefined;
  if (scoped === "prod" || scoped === "production") return "production";
  if (scoped === "sandbox" || scoped === "test") return "sandbox";

  const global = process.env.FRESHPAY_ENV?.trim().toLowerCase();
  if (global === "prod" || global === "production") return "production";
  if (global === "sandbox" || global === "test") return "sandbox";

  const momoBase = process.env.FRESHPAY_API_BASE_URL?.trim().toLowerCase() ?? "";
  if (momoBase.includes("paydrc.gofreshbakery.net")) return "production";

  const cardBase = process.env.FRESHPAY_CARD_API_BASE_URL?.trim().toLowerCase() ?? "";
  if (cardBase.includes("card.gofreshpay.com") && !cardBase.includes("test.")) {
    return "production";
  }

  if (process.env.NODE_ENV === "production") return "production";
  return "sandbox";
}
