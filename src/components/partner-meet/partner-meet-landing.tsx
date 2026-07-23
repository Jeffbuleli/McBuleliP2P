import Link from "next/link";
import type { PartnerMeetRow } from "@/lib/partner-meet";
import {
  isPartnerMeetGuestJoinExpired,
  normalizeMeetDisplayText,
} from "@/lib/partner-meet/timing";
import { McBuleliPoweredFooter } from "@/components/brand/mcbuleli-powered-footer";
import { PartnerMeetCountdown } from "@/components/partner-meet/partner-meet-countdown";
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
    const raw = new Intl.DateTimeFormat("fr-CD", {
      timeZone: meet.timezone || "Africa/Kinshasa",
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(meet.scheduledAt));
    return normalizeMeetDisplayText(raw);
  } catch {
    return normalizeMeetDisplayText(
      new Date(meet.scheduledAt).toLocaleString("fr-FR"),
    );
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
  const guestJoinExpired = isPartnerMeetGuestJoinExpired(meet);
  const status =
    guestJoinExpired && meet.status === "confirmed"
      ? "Terminé"
      : (STATUS_LABEL[meet.status] ?? meet.status);
  const showCountdown =
    (meet.status === "confirmed" || meet.status === "done") &&
    Boolean(meet.scheduledAt);
  const canGuestJoin = !guestJoinExpired && meet.status === "confirmed";

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

      {showCountdown && meet.scheduledAt ? (
        <PartnerMeetCountdown scheduledAt={meet.scheduledAt} />
      ) : null}

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
            Avec <em>{normalizeMeetDisplayText(meet.partnerName)}</em>
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
                : `${meet.durationMinutes} min - Kinshasa`}
            </span>
          </p>

          <div className={styles.ctaGroup}>
            {canGuestJoin ? (
              <Link href={joinHref} className={styles.cta}>
                Rejoindre la salle
              </Link>
            ) : (
              <span className={styles.ctaDisabled} aria-disabled="true">
                {guestJoinExpired ? "Salle fermée" : status}
              </span>
            )}
            {showHostLink ? (
              <Link href={hostHref} className={styles.ctaGhost}>
                {guestJoinExpired ? "Relancer (hôte)" : "Entrée hôte"}
              </Link>
            ) : null}
          </div>
          {guestJoinExpired && !showHostLink ? (
            <p className={styles.closedHint}>
              RDV terminé (plus d&apos;1 h). Seul l&apos;hôte ou un admin peut
              relancer la salle.
            </p>
          ) : null}
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
                  <span>{normalizeMeetDisplayText(item)}</span>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        <footer className={styles.foot}>
          <p>
            Hôte -{" "}
            <a href={`mailto:${meet.hostEmail}`}>{meet.hostEmail}</a>
          </p>
          <p className={styles.footNote}>
            Compte McBuleli requis - ne partagez pas d&apos;URL live nue
          </p>
          <p className={styles.legal}>
            McBuleli - RCCM CD/KNG/RCCM/26-A-00382
          </p>
        </footer>

        <div className={styles.powered}>
          <McBuleliPoweredFooter />
        </div>
      </div>
    </div>
  );
}
