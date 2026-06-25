import Image from "next/image";
import Link from "next/link";

const X_URL = "https://x.com/McBuleli";

export function CommunityPoweredByStrip({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`flex items-center justify-center gap-1.5 text-[10px] text-[#78716c] ${
        compact ? "pt-2" : "pt-3"
      }`}
    >
      <span className="font-medium">100% Powered by</span>
      <span className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full border border-[#305f33]/15 bg-[#eaf5ee]">
        <Image
          src="/brand/logo.png"
          alt=""
          width={16}
          height={16}
          className="h-4 w-4 object-contain"
          unoptimized
        />
      </span>
      <Link
        href={X_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="font-extrabold text-[#305f33]"
      >
        McBuleli
      </Link>
    </div>
  );
}
