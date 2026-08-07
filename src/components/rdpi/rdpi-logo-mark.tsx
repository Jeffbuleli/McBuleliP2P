import { RDPI_BRAND } from "@/lib/rdpi/survey-questions";

/** RDPI mark on black tile - larger, centered-friendly. */
export function RdpiLogoMark({
  className = "",
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg" | "hero";
}) {
  const box =
    size === "sm"
      ? "h-12 max-w-[180px] px-3 py-1.5"
      : size === "lg"
        ? "h-[88px] max-w-[340px] px-5 py-3"
        : size === "hero"
          ? "h-[104px] w-full max-w-[380px] px-5 py-3.5 sm:h-[120px] sm:max-w-[420px]"
          : "h-16 max-w-[260px] px-4 py-2.5";

  return (
    <span
      className={`inline-flex items-center justify-center overflow-hidden rounded-[22px] bg-black shadow-[0_16px_40px_-14px_rgba(0,0,0,0.65)] ring-1 ring-black/50 ${box} ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={RDPI_BRAND.logoUrl}
        alt={RDPI_BRAND.name}
        className="h-full w-auto max-w-full object-contain"
      />
    </span>
  );
}
