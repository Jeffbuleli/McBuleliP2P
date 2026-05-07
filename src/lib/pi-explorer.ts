const PI_MAINNET_TX_BASE = "https://blockexplorer.minepi.com/mainnet/tx";
const PI_MAINNET_TX_BASE_ALT = "https://blockexplorer.minepi.com/mainnet/transactions";

export function parsePiTxidOrUrl(inputRaw: string): { txid: string; url: string } | null {
  const input = (inputRaw ?? "").trim();
  if (!input) return null;

  // Remove whitespace and common wrappers.
  const s = input.replace(/\s+/g, "");

  // If user pasted a URL, extract the last path segment.
  if (s.startsWith("http://") || s.startsWith("https://")) {
    try {
      const u = new URL(s);
      const parts = u.pathname.split("/").filter(Boolean);
      const last = parts[parts.length - 1] ?? "";
      const txid = last.split("?")[0]?.split("#")[0] ?? "";
      const norm = normalizeTxid(txid);
      return norm ? { txid: norm, url: `${PI_MAINNET_TX_BASE}/${norm}` } : null;
    } catch {
      return null;
    }
  }

  const norm = normalizeTxid(s);
  return norm ? { txid: norm, url: `${PI_MAINNET_TX_BASE}/${norm}` } : null;
}

function normalizeTxid(v: string): string | null {
  const txid = (v ?? "").trim().toLowerCase();
  // Pi explorer tx hashes are typically 64 hex chars.
  if (!/^[0-9a-f]{64}$/.test(txid)) return null;
  return txid;
}

export function piExplorerUrlFromTxid(txid: string): string {
  const norm = (txid ?? "").trim().toLowerCase();
  return `${PI_MAINNET_TX_BASE}/${norm}`;
}

export function piExplorerUrlFromTxidAlt(txid: string): string {
  const norm = (txid ?? "").trim().toLowerCase();
  return `${PI_MAINNET_TX_BASE_ALT}/${norm}`;
}

