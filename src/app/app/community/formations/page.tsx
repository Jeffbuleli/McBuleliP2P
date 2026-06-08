import Link from "next/link";

export const dynamic = "force-dynamic";

/** Façade communauté → Academy / Jitsi existant (aucune duplication). */
export default function CommunityFormationsPage() {
  return (
    <div className="community-theme mx-auto max-w-lg px-4 pb-28 pt-4">
      <Link href="/app/community" className="text-sm text-[#305f33]">
        ← Communauté
      </Link>
      <h1 className="mt-3 text-lg font-bold">Formations</h1>
      <p className="mt-2 text-sm text-[#57534e]">
        Calendrier et lives connectés à l&apos;Academy McBuleli.
      </p>
      <Link
        href="/app/academy"
        className="fd-card mt-4 block px-4 py-4 text-sm font-semibold text-[#305f33]"
      >
        Ouvrir l&apos;Academy →
      </Link>
    </div>
  );
}
