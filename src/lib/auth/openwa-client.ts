/** OpenWA was removed from McBuleli — stubs keep call sites compiling. */

export function isOpenWaConfigured(): boolean {
  return false;
}

export function readOpenWaConfig(): null {
  return null;
}

export async function getOpenWaMcBuleliPhone(): Promise<string | null> {
  return null;
}

export async function fetchOpenWaSessionStatus(): Promise<{
  ok: false;
  status: number;
  message: string;
}> {
  return { ok: false, status: 410, message: "openwa_removed" };
}
