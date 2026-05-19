import { TradeSubNav } from "@/components/trade/trade-sub-nav";

export default function FuturesSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="wallet-theme trade-futures-theme mx-auto max-w-lg">
      <TradeSubNav />
      {children}
    </div>
  );
}
