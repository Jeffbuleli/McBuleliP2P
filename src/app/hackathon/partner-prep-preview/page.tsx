import {
  PARTNER_TALK_MINUTES,
  partnerDayBriefForSlug,
} from "@/lib/hackathon/partner-day-brief";
import { PARTNER_BADGE_PROFILES } from "@/lib/hackathon/partner-passes";
import { HkPage, HkShell } from "@/components/hackathon/hk-ui";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Aperçu préparation partenaires · Hackathon",
  robots: { index: false, follow: false },
};

const ORG_ORDER = [
  "rdpi",
  "ia-academie-chk",
  "kimia",
  "montana-pay",
  "tyts",
  "kilelo",
  "ilokwe",
  "bienv-photography",
] as const;

function statusLabel(status: string) {
  switch (status) {
    case "confirmed":
      return "Confirmé";
    case "pending_24h":
      return "À confirmer (24h)";
    case "backup":
      return "Selon planning";
    case "media_only":
      return "Photo seule";
    default:
      return "Hors scène";
  }
}

export default function PartnerPrepPreviewPage() {
  return (
    <HkShell authReturnPath="/hackathon/partner-prep-preview">
      <HkPage
        eyebrow="Aperçu local · non indexé"
        title="Préparation partenaires — 28 août"
        lede={`Talks ${PARTNER_TALK_MINUTES} min · Agent IA : cursor.com recommandé. En prod : /hackathon/chat → Préparation.`}
      >
        <div className="space-y-6">
          {ORG_ORDER.map((slug) => {
            const brief = partnerDayBriefForSlug(slug);
            const profile = PARTNER_BADGE_PROFILES[slug];
            const talk = brief.talk;
            return (
              <article
                key={slug}
                className="space-y-4 rounded-2xl border border-[color:var(--hk-border)] bg-[color:var(--hk-surface)] p-4 sm:p-5"
              >
                <div>
                  <h2 className="text-lg font-extrabold text-[color:var(--hk-text)]">
                    {slug}
                  </h2>
                  <p className="text-sm text-[color:var(--hk-muted)]">
                    {profile?.roleLabel ?? "Partenaire"}
                  </p>
                </div>

                <div className="rounded-xl border border-[color:var(--hk-accent)]/35 bg-[color:var(--hk-soft)] px-3.5 py-3">
                  <p className="text-sm font-extrabold text-[color:var(--hk-text)]">
                    {brief.bootcampTitleFr}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-[color:var(--hk-text)]">
                    {brief.bootcampFr}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[color:var(--hk-accent)]">
                    {brief.teamFr}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-[color:var(--hk-text)]">
                    {brief.setupFr}
                  </p>
                </div>

                <div className="rounded-xl bg-[color:var(--hk-page)] px-3.5 py-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-[color:var(--hk-muted)]">
                    Votre créneau
                  </p>
                  {talk && talk.start ? (
                    <>
                      <p className="mt-1 text-2xl font-extrabold tabular-nums text-[color:var(--hk-text)]">
                        {talk.start} – {talk.end}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[color:var(--hk-accent)]">
                        {talk.domainFr}
                      </p>
                      <p className="mt-1 text-xs font-bold uppercase text-[color:var(--hk-muted)]">
                        {statusLabel(talk.status)}
                        {talk.status !== "media_only"
                          ? ` · ${PARTNER_TALK_MINUTES} min`
                          : ""}
                      </p>
                      {talk.noteFr ? (
                        <p className="mt-2 text-sm text-[color:var(--hk-muted)]">
                          {talk.noteFr}
                        </p>
                      ) : null}
                    </>
                  ) : (
                    <p className="mt-1 text-sm text-[color:var(--hk-muted)]">
                      {talk?.noteFr ?? "Pas de slot scène"}
                    </p>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-extrabold text-[color:var(--hk-text)]">
                      À apporter · tech
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-[color:var(--hk-text)]">
                      {brief.bringTechFr.map((item) => (
                        <li key={item}>· {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-[color:var(--hk-text)]">
                      À apporter · visibilité
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-[color:var(--hk-text)]">
                      {brief.bringVisibilityFr.map((item) => (
                        <li key={item}>· {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </HkPage>
    </HkShell>
  );
}
