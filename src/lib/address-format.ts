import type { NetworkId } from "./networks";

const EVM = /^0x[a-fA-F0-9]{40}$/;
/** Tron base58 T... length 34 */
const TRON = /^T[a-zA-Z0-9]{33}$/;

export function isValidAddressForNetwork(
  address: string,
  network: NetworkId,
): boolean {
  const a = address.trim();
  if (network === "TRC20") return TRON.test(a);
  if (network === "ERC20" || network === "BEP20") return EVM.test(a);
  return false;
}
