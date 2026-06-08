import Link from "next/link";

export const dynamic = "force-dynamic";

export default function CommunityBlogsPage() {
  return (
    <div className="community-theme mx-auto max-w-lg px-4 pb-28 pt-4">
      <Link href="/app/community" className="text-sm text-[#305f33]">
        ← Communauté
      </Link>
      <h1 className="mt-3 text-lg font-bold">Blogs</h1>
      <p className="mt-2 text-sm text-[#57534e]">
        Phase 2 — rédaction mobile, brouillons et catégories.
      </p>
    </div>
  );
}
