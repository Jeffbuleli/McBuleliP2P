import { renderMcBuleliEmail } from "@/lib/email/layout";
import { sendBrandedEmail } from "@/lib/email/send-branded";
import {
  getPlatformSetting,
  PlatformSettingKey,
  setPlatformSetting,
} from "@/lib/platform-settings";
import { SUPPORT_EMAIL } from "@/lib/support-contact";
import type { HouseRiskSnapshot } from "@/lib/trade-house-risk";

const COOLDOWN_MS = 6 * 60 * 60 * 1000;
const WARN_UTIL = 0.7;

function opsAlertEmails(): string[] {
  const raw =
    process.env.OPS_ALERT_EMAIL?.trim() ||
    process.env.TRADE_HOUSE_ALERT_EMAIL?.trim() ||
    SUPPORT_EMAIL;
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function maybeSendHouseStressAlert(
  snap: HouseRiskSnapshot,
): Promise<void> {
  const shouldAlert =
    snap.circuitTripped || snap.stressUtilizationPct >= WARN_UTIL;
  if (!shouldAlert) return;

  const last = await getPlatformSetting(PlatformSettingKey.TRADE_HOUSE_ALERT_LAST);
  if (last) {
    const t = Date.parse(last);
    if (Number.isFinite(t) && Date.now() - t < COOLDOWN_MS) return;
  }

  const pct = Math.round(snap.stressUtilizationPct * 100);
  const subject = snap.circuitTripped
    ? `[McBuleli OPS] Futures live CIRCUIT — stress ${pct}%`
    : `[McBuleli OPS] Futures house stress ${pct}%`;

  const body = [
    `Reserve: ${snap.reserveUsdt.toFixed(2)} USDT`,
    `Treasury: ${snap.reserveBreakdown.treasuryBalanceUsdt.toFixed(2)} USDT`,
    `Live fees pool: ${snap.reserveBreakdown.liveFeesUsdt.toFixed(2)} USDT`,
    `Mark-to-market liability: ${snap.markToMarketLiabilityUsdt.toFixed(2)} USDT`,
    `Stress liability (+${(snap.stressMovePct * 100).toFixed(1)}%): ${snap.stressLiabilityUsdt.toFixed(2)} USDT`,
    `Circuit: ${snap.circuitTripped ? "TRIPPED" : "ok"}`,
    `Max leverage while stressed: ${snap.maxLeverageWhileStressed}×`,
    "",
    "Admin: /admin/trade/futures",
  ].join("\n");

  const { html, text } = renderMcBuleliEmail({
    copy: {
      subject,
      preheader: subject,
      title: subject,
      body,
      cta: "Open solvency dashboard",
      footerHelp: "McBuleli OPS",
      footerContact: SUPPORT_EMAIL,
    },
    actionUrl: "https://mcbuleli.org/admin/trade/futures",
    illustration: "security",
    locale: "en",
    useInlineImages: true,
  });

  for (const to of opsAlertEmails()) {
    await sendBrandedEmail({ to, subject, html, text }).catch(() => undefined);
  }

  await setPlatformSetting(
    PlatformSettingKey.TRADE_HOUSE_ALERT_LAST,
    new Date().toISOString(),
  );
}
