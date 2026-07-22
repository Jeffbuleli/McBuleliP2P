import Link from "next/link";
import type { PartnerMeetRow } from "@/lib/partner-meet";
import styles from "./partner-meet-landing.module.css";

const STATUS_LABEL: Record<string, string> = {
  proposed: "Créneaux proposés - en attente de confirmation",
  confirmed: "RDV confirmé",
  done: "RDV terminé",
  cancelled: "Annulé",
};

function formatWhen(meet: PartnerMeetRow): string | null {
  if (!meet.scheduledAt) return null;
  try {
    return new Intl.DateTimeFormat("fr-CD", {
      timeZone: meet.timezone || "Africa/Kinshasa",
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(meet.scheduledAt));
  } catch {
    return new Date(meet.scheduledAt).toLocaleString("fr-FR");
  }
}

export function PartnerMeetLanding({
  meet,
  joinHref,
  hostHref,
  showHostLink,
}: {
  meet: PartnerMeetRow;
  joinHref: string;
  hostHref: string;
  showHostLink: boolean;
}) {
  const when = formatWhen(meet);
  const agenda = meet.agenda?.length ? meet.agenda : [];

  return (
    <div className={styles.meetRoot}>
      <div className={styles.shell}>
        <div className={styles.brand}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={styles.brandImg}
            src="/brand/mcbuleli-meet-logo.png"
            width={52}
            height={52}
            alt="McBuleli Meet"
          />
          <div>
            <div className={styles.brandName}>McBuleli Meet</div>
            <div className={styles.brandSub}>Visio sécurisée · live.mcbuleli.org</div>
          </div>
        </div>

        <header className={styles.hero}>
          <span className={styles.kicker}>RDV partenariat</span>
          <h1 className={styles.title}>{meet.title}</h1>
          <p className={styles.lede}>
            Échange de {meet.durationMinutes} minutes avec {meet.partnerName} et
            l&apos;équipe McBuleli, sur notre salle McBuleli Meet.
          </p>
          <div className={styles.status}>
            <span className={styles.statusDot} aria-hidden />
            {STATUS_LABEL[meet.status] ?? meet.status}
          </div>
        </header>

        <div className={styles.meta}>
          <p className={styles.metaRow}>
            <strong>Partenaire</strong> - {meet.partnerName}
          </p>
          {when ? (
            <p className={styles.metaRow}>
              <strong>Quand</strong> - {when} ({meet.timezone})
            </p>
          ) : (
            <p className={styles.metaRow}>
              <strong>Quand</strong> - créneau à confirmer (voir email)
            </p>
          )}
          <p className={styles.metaRow}>
            <strong>Durée</strong> - {meet.durationMinutes} minutes
          </p>
        </div>

        {agenda.length > 0 ? (
          <section className={styles.agenda}>
            <h2>Au programme</h2>
            <ul>
              {agenda.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className={styles.ctaWrap}>
          <Link href={joinHref} className={styles.cta}>
            Rejoindre la salle
          </Link>
          <p className={styles.ctaNote}>
            Un compte McBuleli gratuit est requis. Connectez-vous (ou créez un
            compte), puis vous êtes redirigé vers McBuleli Meet avec un accès
            sécurisé - ne partagez pas d&apos;URL live.mcbuleli.org nue.
          </p>
        </div>

        <aside className={styles.host}>
          <div className={styles.hostLabel}>Hôte McBuleli</div>
          <div className={styles.hostName}>CEO · McBuleli</div>
          <a className={styles.hostMail} href={`mailto:${meet.hostEmail}`}>
            {meet.hostEmail}
          </a>
          {showHostLink ? (
            <Link href={hostHref} className={styles.hostLink}>
              Ouvrir en tant qu&apos;hôte →
            </Link>
          ) : null}
        </aside>

        <p className={styles.foot}>
          McBuleli · RCCM CD/KNG/RCCM/26-A-00382 · mcbuleli.org
        </p>
      </div>
    </div>
  );
}
