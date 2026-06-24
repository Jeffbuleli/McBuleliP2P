import type { NetworkId } from "./networks";
import { PI_MAIN_NETWORK_ID } from "@/lib/pi-constants";

const EVM = /^0x[a-fA-F0-9]{40}$/;
/** Tron base58 T... length 34 */
const TRON = /^T[a-zA-Z0-9]{33}$/;

export function isValidAddressForNetwork(
  address: string,
  network: NetworkId | typeof PI_MAIN_NETWORK_ID,
): boolean {
  const a = address.trim();
  if (network === PI_MAIN_NETWORK_ID) {
    const a = address.trim();
    // Pi Network mainnet (G…) and alternate (M…) wallet addresses
    return /^[GM][A-Za-z0-9]{19,127}$/.test(a);
  }
  if (network === "TRC20") return TRON.test(a);
  if (network === "ERC20" || network === "BEP20") return EVM.test(a);
  return false;
}
