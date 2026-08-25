"use client";

import { motion } from "framer-motion";

/** Harmonious rings, stars & sparkles around McBuleli IA (projector ambiance). */
export function McStageFuturisticAura({
  active = true,
  intense = false,
}: {
  active?: boolean;
  intense?: boolean;
}) {
  if (!active) return null;

  const stars = [
    { x: "12%", y: "18%", d: 0 },
    { x: "78%", y: "14%", d: 0.4 },
    { x: "88%", y: "62%", d: 0.8 },
    { x: "8%", y: "72%", d: 1.2 },
    { x: "52%", y: "8%", d: 0.6 },
    { x: "34%", y: "84%", d: 1.5 },
  ];

  const shooters = [
    { x: "5%", y: "22%", rotate: -18, delay: 0 },
    { x: "70%", y: "10%", rotate: 12, delay: 2.2 },
    { x: "40%", y: "78%", rotate: -8, delay: 4.1 },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(110,231,160,0.12)_0%,transparent_55%)]" />

      {/* Orbital rings */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={`ring-${i}`}
          className="absolute left-1/2 top-[52%] rounded-full border border-[#1F6B43]/20"
          style={{
            width: `${168 + i * 56}px`,
            height: `${168 + i * 56}px`,
            marginLeft: `${-(84 + i * 28)}px`,
            marginTop: `${-(84 + i * 28)}px`,
            borderStyle: i === 1 ? "dashed" : "solid",
          }}
          animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
          transition={{
            duration: 22 + i * 8,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}

      {/* Inner glow pulse */}
      <motion.div
        className="absolute left-1/2 top-[52%] h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#6ee7a0]/10 blur-2xl"
        animate={{ scale: intense ? [1, 1.25, 1] : [1, 1.12, 1], opacity: [0.35, 0.65, 0.35] }}
        transition={{ duration: intense ? 2.2 : 3.6, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Twinkling stars */}
      {stars.map((s, i) => (
        <motion.span
          key={`star-${i}`}
          className="absolute h-1 w-1 rounded-full bg-[#1F6B43]"
          style={{ left: s.x, top: s.y }}
          animate={{ opacity: [0.15, 0.9, 0.15], scale: [0.6, 1.2, 0.6] }}
          transition={{
            duration: 2.4 + (i % 3) * 0.5,
            repeat: Infinity,
            delay: s.d,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Sparkle blings */}
      {[0, 1, 2, 3].map((i) => (
        <motion.span
          key={`bling-${i}`}
          className="absolute text-[#6ee7a0]"
          style={{
            left: `${18 + i * 20}%`,
            top: `${28 + (i % 2) * 38}%`,
            fontSize: "10px",
          }}
          animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5], rotate: [0, 45, 0] }}
          transition={{
            duration: 2.8,
            repeat: Infinity,
            delay: i * 0.7,
            ease: "easeInOut",
          }}
        >
          ✦
        </motion.span>
      ))}

      {/* Shooting stars */}
      {shooters.map((s, i) => (
        <motion.span
          key={`shoot-${i}`}
          className="absolute h-px w-16 bg-gradient-to-r from-transparent via-[#6ee7a0]/80 to-transparent"
          style={{ left: s.x, top: s.y, rotate: `${s.rotate}deg` }}
          animate={{ x: [0, 120], opacity: [0, 0.85, 0] }}
          transition={{
            duration: 2.6,
            repeat: Infinity,
            delay: s.delay,
            ease: "easeOut",
          }}
        />
      ))}

      {/* Orbiting dot */}
      <motion.div
        className="absolute left-1/2 top-[52%]"
        style={{ width: 0, height: 0 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
      >
        <span className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-[#1F6B43]/45" style={{ left: 92, top: -4 }} />
      </motion.div>
      <motion.div
        className="absolute left-1/2 top-[52%]"
        style={{ width: 0, height: 0 }}
        animate={{ rotate: -360 }}
        transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
      >
        <span className="absolute h-1.5 w-1.5 rounded-full bg-[#6ee7a0]/70" style={{ left: -78, top: 12 }} />
      </motion.div>
    </div>
  );
}
