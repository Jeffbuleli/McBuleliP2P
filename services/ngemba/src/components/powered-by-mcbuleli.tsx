import Link from "next/link";

/** Footer brand strip — same pattern as mcbuleli.org / McBuleliPoweredFooter. */
export function PoweredByMcbuleli({ className = "" }: { className?: string }) {
  return (
    <footer
      className={`mt-auto flex flex-col items-center gap-1.5 pt-6 pb-1 ${className}`}
    >
      <div className="flex items-center gap-2 text-[10px] text-ng-muted">
        <span>Powered by</span>
        <span className="flex size-6 items-center justify-center overflow-hidden rounded-full bg-ng-surface">
          <img
            src="/brand/mcbuleli-mark.png"
            alt=""
            width={24}
            height={24}
            className="size-6 object-contain"
          />
        </span>
        <Link
          href="https://mcbuleli.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-extrabold text-ng-primary hover:underline"
        >
          McBuleli
        </Link>
      </div>
    </footer>
  );
}
