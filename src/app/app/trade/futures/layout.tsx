import { TradeSubNav } from "@/components/trade/trade-sub-nav";

export default function FuturesSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-lg">
      <TradeSubNav />
      {children}
    </div>
  );
}
