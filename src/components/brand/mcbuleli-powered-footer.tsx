import Image from "next/image";
import Link from "next/link";
import { BRAND_LOGO_MARK_256 } from "@/lib/brand-logo";

const X_URL = "https://x.com/McBuleli";

export function McBuleliPoweredFooter() {
  return (
    <footer className="mt-8 flex flex-col items-center gap-1.5 pb-4 pt-2">
      <div className="flex items-center gap-2 text-[10px] text-[color:var(--fd-muted)]">
        <span>Powered by</span>
        <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full">
          <Image
            src={BRAND_LOGO_MARK_256}
            alt=""
            width={24}
            height={24}
            className="h-6 w-6 object-contain"
            unoptimized
          />
        </span>
        <Link
          href={X_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-extrabold text-[color:var(--fd-primary)] hover:underline"
        >
          McBuleli
        </Link>
      </div>
    </footer>
  );
}
