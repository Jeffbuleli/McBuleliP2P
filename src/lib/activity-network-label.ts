import { getDictionary } from "@/i18n/messages";
import type { Locale } from "@/i18n/locale";
import { parseNetwork, USDT_NETWORKS } from "@/lib/networks";
import { PI_MAIN_NETWORK_ID } from "@/lib/pi-constants";

/** Human-readable network for activity lists (deposits / withdrawals). */
export function activityNetworkLabel(
  locale: Locale,
  networkCanonical: string,
): string {
  const d = getDictionary(locale);
  if (networkCanonical === PI_MAIN_NETWORK_ID) {
    return d.deposit_network_pi_main;
  }
  const nid = parseNetwork(networkCanonical);
  if (nid) return USDT_NETWORKS[nid].label;
  return networkCanonical;
}
