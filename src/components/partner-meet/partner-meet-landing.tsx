import Link from "next/link";
import type { PartnerMeetRow } from "@/lib/partner-meet";
import styles from "./partner-meet-landing.module.css";

const STATUS_LABEL: Record<string, string> = {
  proposed: "Créneau à confirmer",
  confirmed: "Confirmé",
  done: "Terminé",
  cancelled: "Annulé",
};

function formatWhen(meet: PartnerMeetRow): string | null {
  if (!meet.scheduledAt) return null;
  try {
    return new Intl.DateTimeFormat("fr-CD", {
      timeZone: meet.timezone || "Africa/Kinshasa",
      weekday: "short",
      day: "numeric",
      month: "short",
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
  const status = STATUS_LABEL[meet.status] ?? meet.status;

  return (
    <div className={styles.meetRoot}>
      <div className={styles.atmosphere} aria-hidden>
        <div className={styles.mesh} />
        <div className={styles.beam} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className={styles.watermark}
          src="/brand/mcbuleli-meet-watermark.png"
          alt=""
          width={720}
          height={720}
        />
      </div>

      <div className={styles.stage}>
        <header className={styles.hero}>
          <div className={styles.brandBlock}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className={styles.brandMark}
              src="/brand/mcbuleli-meet-logo.png"
              width={72}
              height={72}
              alt=""
            />
            <p className={styles.brandName}>McBuleli Meet</p>
          </div>

          <h1 className={styles.headline}>
            Avec <em>{meet.partnerName}</em>
          </h1>
          <p className={styles.lede}>
            {meet.durationMinutes} minutes pour aligner le partenariat hackathon
            - salle sécurisée McBuleli.
          </p>

          <p className={styles.facts}>
            <span>{status}</span>
            <span className={styles.dot} aria-hidden />
            <span>
              {when
                ? when
                : `${meet.durationMinutes} min · Kinshasa`}
            </span>
          </p>

          <div className={styles.ctaGroup}>
            <Link href={joinHref} className={styles.cta}>
              Rejoindre la salle
            </Link>
            {showHostLink ? (
              <Link href={hostHref} className={styles.ctaGhost}>
                Entrée hôte
              </Link>
            ) : null}
          </div>
        </header>

        {agenda.length > 0 ? (
          <section className={styles.agenda} aria-labelledby="meet-agenda">
            <h2 id="meet-agenda">Au programme</h2>
            <ol>
              {agenda.map((item, i) => (
                <li key={item}>
                  <span className={styles.agendaIndex}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        <footer className={styles.foot}>
          <p>
            Hôte ·{" "}
            <a href={`mailto:${meet.hostEmail}`}>{meet.hostEmail}</a>
          </p>
          <p className={styles.footNote}>
            Compte McBuleli requis · ne partagez pas d&apos;URL live nue
          </p>
          <p className={styles.legal}>
            McBuleli · RCCM CD/KNG/RCCM/26-A-00382
          </p>
        </footer>
      </div>
    </div>
  );
}
