import {
  getPlatformSetting,
  PlatformSettingKey,
} from "@/lib/platform-settings";

/** Pi on-chain receive address configured by super-admin (manual deposits). */
export async function getPiReceiveAddressForDeposits(): Promise<string | null> {
  const real = await getPlatformSetting(
    PlatformSettingKey.PI_RECEIVE_ADDRESS_REAL,
  );
  const trimmed = real?.trim();
  return trimmed && trimmed.length >= 20 ? trimmed : null;
}

export async function isPiManualDepositEnabled(): Promise<boolean> {
  return (await getPiReceiveAddressForDeposits()) !== null;
}
