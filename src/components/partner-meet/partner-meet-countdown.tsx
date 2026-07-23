"use client";

import { useEffect, useState } from "react";
import { PARTNER_MEET_GUEST_JOIN_WINDOW_MS } from "@/lib/partner-meet/timing";
import styles from "./partner-meet-countdown.module.css";

type Parts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
};

function diffParts(targetMs: number, nowMs: number): Parts {
  const totalMs = targetMs - nowMs;
  if (totalMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs };
  }
  const sec = Math.floor(totalMs / 1000);
  const days = Math.floor(sec / 86400);
  const hours = Math.floor((sec % 86400) / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = sec % 60;
  return { days, hours, minutes, seconds, totalMs };
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function PartnerMeetCountdown({
  scheduledAt,
}: {
  scheduledAt: string | Date;
}) {
  const target = new Date(scheduledAt).getTime();
  const [parts, setParts] = useState<Parts>(() =>
    diffParts(target, Date.now()),
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
    const tick = () => setParts(diffParts(target, Date.now()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [target]);

  if (!Number.isFinite(target)) return null;

  const started = parts.totalMs <= 0;
  const stillLive =
    started && Date.now() - target < PARTNER_MEET_GUEST_JOIN_WINDOW_MS;
  const ended = started && !stillLive;

  return (
    <aside
      className={styles.countdown}
      aria-live="polite"
      aria-label={
        ended
          ? "RDV terminé"
          : stillLive
            ? "RDV en cours"
            : `Compte à rebours ${pad(parts.days)} jours ${pad(parts.hours)} heures ${pad(parts.minutes)} minutes ${pad(parts.seconds)} secondes`
      }
    >
      {ended ? (
        <p className={styles.status}>Terminé</p>
      ) : stillLive ? (
        <p className={styles.status}>En cours</p>
      ) : ready ? (
        <div className={styles.digits} role="timer">
          {parts.days > 0 ? (
            <>
              <span className={styles.unit}>
                <strong>{pad(parts.days)}</strong>
                <em>j</em>
              </span>
              <span className={styles.sep} aria-hidden>
                :
              </span>
            </>
          ) : null}
          <span className={styles.unit}>
            <strong>{pad(parts.hours)}</strong>
            <em>h</em>
          </span>
          <span className={styles.sep} aria-hidden>
            :
          </span>
          <span className={styles.unit}>
            <strong>{pad(parts.minutes)}</strong>
            <em>m</em>
          </span>
          <span className={styles.sep} aria-hidden>
            :
          </span>
          <span className={styles.unit}>
            <strong>{pad(parts.seconds)}</strong>
            <em>s</em>
          </span>
        </div>
      ) : null}
    </aside>
  );
}
