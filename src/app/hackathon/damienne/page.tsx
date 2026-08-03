import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DamienneHubClient } from "@/components/hackathon/damienne-hub-client";
import { canAccessDamienneHub } from "@/lib/hackathon/damienne";
import { getSessionUser } from "@/lib/session-user";
import { UserRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function HackathonDamiennePage() {
  const user = await getSessionUser();
  if (!user) {
    const h = await headers();
    const path = h.get("x-pathname") || "/hackathon/damienne";
    redirect(`/login?next=${encodeURIComponent(path)}`);
  }

  const allowed = canAccessDamienneHub({
    email: user.email,
    role: user.role,
  });
  if (!allowed) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-[color:var(--hk-text,var(--fd-fg))]">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[color:var(--hk-accent)]">
          Formation privée
        </p>
        <h1 className="mt-2 text-2xl font-black">Accès réservé</h1>
        <p className="mt-4 text-sm leading-relaxed text-[color:var(--hk-muted,var(--fd-muted))]">
          Cet espace est réservé à Mme Elisabeth Adilelou et à l&apos;équipe
          McBuleli. Si vous pensez devoir y accéder, contactez{" "}
          <a
            href="mailto:hi@mcbuleli.org"
            className="font-semibold text-[color:var(--hk-accent)]"
          >
            hi@mcbuleli.org
          </a>
          .
        </p>
        <a
          href="/hackathon"
          className="mt-8 inline-block text-sm font-semibold text-[color:var(--hk-accent)] hover:underline"
        >
          ← Hackathon
        </a>
      </main>
    );
  }

  const isStaff =
    user.role === UserRole.AGENT || user.role === UserRole.SUPER_ADMIN;

  return (
    <DamienneHubClient
      isStaff={isStaff || user.email.toLowerCase() === "ceo@mcbuleli.org"}
      displayName={user.email}
    />
  );
}
