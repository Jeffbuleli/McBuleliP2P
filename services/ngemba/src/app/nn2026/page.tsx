import type { Metadata } from "next";
import Link from "next/link";

const VIDEO =
  "https://media.cyberalert-rdc.org/ngemba/nn2026/presentation-1080p.mp4";
const POSTER =
  "https://media.cyberalert-rdc.org/ngemba/nn2026/poster-1080p.jpg";

export const metadata: Metadata = {
  title: "Ngemba — présentation",
  description:
    "Écouter d'abord. Présentation de Ngemba : l'application, la voix, et le moment où l'équipe reprend.",
};

export default function PresentationPage() {
  return (
    <main className="min-h-dvh bg-[#f4f7f5] px-4 py-8 text-[#0c1a14] md:py-12">
      <div className="mx-auto w-full max-w-5xl">
        <Link href="/" className="text-sm font-semibold text-[#5c6b63]">
          ← Ngemba
        </Link>
        <p className="mt-6 text-xs font-semibold tracking-[0.16em] text-[#06402b] uppercase">
          Ngemba · NN2026
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[#06402b] md:text-4xl">
          Écouter d&apos;abord
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#3d4f46] md:text-base">
          L&apos;application comprend la situation avant d&apos;appeler
          l&apos;équipe. Quatre portes, deux canaux, une voix.
        </p>
        <video
          className="mt-6 aspect-video w-full overflow-hidden rounded-2xl bg-[#06402b] shadow-[0_18px_40px_-28px_rgba(6,64,43,0.7)]"
          controls
          playsInline
          preload="metadata"
          poster={POSTER}
          src={VIDEO}
        >
          <a href={VIDEO}>Voir la présentation</a>
        </video>
        <p className="mt-3 text-xs text-[#5c6b63]">
          Deux minutes vingt-huit. La présentation du jury.
        </p>
      </div>
    </main>
  );
}
