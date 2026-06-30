import Image from "next/image";
import Link from "next/link";

const X_URL = "https://x.com/McBuleli";

export function McBuleliPoweredFooter() {
  return (
    <footer className="mt-8 flex flex-col items-center gap-1.5 pb-4 pt-2">
      <div className="flex items-center gap-2 text-[10px] text-[color:var(--fd-muted)]">
        <span>Powered by</span>
        <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border border-[color:var(--fd-primary)]/20 bg-[color:var(--fd-mint)]">
          <Image
            src="/brand/logo.png"
            alt=""
            width={20}
            height={20}
            className="h-5 w-5 object-contain"
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
