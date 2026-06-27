import Link from "next/link";
import { loginHrefFor, registerHrefFor } from "@/lib/auth-return-path";

export function CommunityShareAuthLinks({
  returnPath,
  fr = true,
}: {
  returnPath: string;
  fr?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2 text-xs font-semibold">
      <Link href={loginHrefFor(returnPath)} className="text-[#57534e] hover:text-[#305f33]">
        {fr ? "Connexion" : "Log in"}
      </Link>
      <span className="text-[#d6d3d1]" aria-hidden>
        ·
      </span>
      <Link
        href={registerHrefFor(returnPath)}
        className="rounded-lg bg-[#305f33] px-3 py-1.5 text-white hover:bg-[#244a27]"
      >
        {fr ? "Créer un compte" : "Sign up"}
      </Link>
    </div>
  );
}
