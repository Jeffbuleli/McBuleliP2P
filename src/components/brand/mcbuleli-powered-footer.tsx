import Link from "next/link";
import { McBuleliLogoMark } from "@/components/brand/mcbuleli-logo-mark";

const X_URL = "https://x.com/McBuleli";

export function McBuleliPoweredFooter({ compact = true }: { compact?: boolean }) {
  const textCls = compact ? "text-[10px]" : "text-xs";

  return (
    <footer className={`flex flex-col items-center ${compact ? "gap-1 py-2" : "gap-1.5 pb-4 pt-2"} mt-8`}>
      <div className={`flex items-center gap-2 ${textCls} text-[color:var(--fd-muted)]`}>
        <span className="leading-none">Powered by</span>
        <McBuleliLogoMark size={compact ? 18 : 24} />
        <Link
          href={X_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`font-extrabold leading-none text-emerald-400 hover:underline ${textCls}`}
        >
          McBuleli
        </Link>
      </div>
    </footer>
  );
}
