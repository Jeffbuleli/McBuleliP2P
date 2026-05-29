import { NextResponse } from "next/server";
import { isValidAddressForNetwork } from "@/lib/address-format";
import { parseNetwork } from "@/lib/networks";
import { resolveUsdtWithdrawQuote } from "@/lib/withdraw-quote";

/** Dynamic USDT withdraw quote: fee + min from Binance config and internal-address detection. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const network = parseNetwork(url.searchParams.get("network") ?? "");
  const address = url.searchParams.get("address")?.trim() ?? "";

  if (!network || !address) {
    return NextResponse.json({ message: "invalid_params" }, { status: 400 });
  }
  if (!isValidAddressForNetwork(address, network)) {
    return NextResponse.json({ message: "invalid_address" }, { status: 400 });
  }

  const quote = await resolveUsdtWithdrawQuote({ network, address });
  return NextResponse.json(quote);
}
