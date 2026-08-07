import { RDPI_BRAND } from "@/lib/rdpi/survey-questions";

/** RDPI mark on black tile - logo has baked black bg; contain avoids "broken" crop. */
export function RdpiLogoMark({
  className = "",
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const box =
    size === "sm"
      ? "h-11 max-w-[160px] px-2.5 py-1.5"
      : size === "lg"
        ? "h-[72px] max-w-[280px] px-4 py-2.5"
        : "h-14 max-w-[220px] px-3 py-2";

  return (
    <span
      className={`inline-flex items-center justify-center overflow-hidden rounded-2xl bg-black shadow-[0_8px_28px_-12px_rgba(0,0,0,0.55)] ring-1 ring-black/40 ${box} ${className}`}
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
