"use client";

import { motion } from "framer-motion";

/**
 * Sound-wave rings + equalizer bars around McBuleli IA avatar.
 * Pumps with speech when `speaking`; soft idle otherwise.
 */
export function McStageVoiceWaves({
  speaking = false,
  size = 160,
}: {
  speaking?: boolean;
  /** Outer diameter of the wave field (px). */
  size?: number;
}) {
  const bars = [0.35, 0.55, 0.85, 1, 0.7, 0.95, 0.5, 0.65, 0.4];
  const ringDelays = [0, 0.35, 0.7];

  return (
    <div
      className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      style={{ width: size, height: size }}
      aria-hidden
    >
      {/* Expanding radio / sound rings */}
      {ringDelays.map((delay, i) => (
        <motion.span
          key={`ring-${i}`}
          className="absolute inset-0 rounded-full border-2 border-[#1F6B43]/35"
          style={{ borderStyle: i === 1 ? "dashed" : "solid" }}
          animate={
            speaking
              ? {
                  scale: [0.55, 1.15 + i * 0.08],
                  opacity: [0.55, 0],
                }
              : {
                  scale: [0.72, 0.95],
                  opacity: [0.18, 0.06, 0.18],
                }
          }
          transition={
            speaking
              ? {
                  duration: 1.15 + i * 0.2,
                  repeat: Infinity,
                  delay,
                  ease: "easeOut",
                }
              : {
                  duration: 3.2 + i * 0.4,
                  repeat: Infinity,
                  delay,
                  ease: "easeInOut",
                }
          }
        />
      ))}

      {/* Soft fill pulse behind bars */}
      <motion.div
        className="absolute left-1/2 top-1/2 h-[42%] w-[42%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#6ee7a0]/15 blur-md"
        animate={{
          scale: speaking ? [1, 1.35, 1] : [1, 1.08, 1],
          opacity: speaking ? [0.35, 0.7, 0.35] : [0.2, 0.35, 0.2],
        }}
        transition={{
          duration: speaking ? 0.55 : 2.8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Equalizer bars — speech rhythm */}
      <div className="absolute inset-0 flex items-center justify-center gap-[3px]">
        {bars.map((peak, i) => {
          const idleH = 6 + peak * 8;
          const speakMin = 8 + peak * 6;
          const speakMax = 18 + peak * 28;
          return (
            <motion.span
              key={`bar-${i}`}
              className="w-[3px] rounded-full bg-gradient-to-t from-[#1F6B43] to-[#6ee7a0]"
              style={{ originY: 0.5 }}
              animate={
                speaking
                  ? {
                      height: [speakMin, speakMax, speakMin * 0.7, speakMax * 0.85, speakMin],
                      opacity: [0.55, 1, 0.7, 1, 0.55],
                    }
                  : {
                      height: [idleH * 0.7, idleH, idleH * 0.75],
                      opacity: [0.25, 0.4, 0.25],
                    }
              }
              transition={
                speaking
                  ? {
                      duration: 0.42 + (i % 4) * 0.08,
                      repeat: Infinity,
                      delay: i * 0.05,
                      ease: "easeInOut",
                    }
                  : {
                      duration: 2.4 + (i % 3) * 0.3,
                      repeat: Infinity,
                      delay: i * 0.12,
                      ease: "easeInOut",
                    }
              }
            />
          );
        })}
      </div>

      {/* Side arc waves (broadcast glyphs) */}
      {([-1, 1] as const).map((side) => (
        <motion.svg
          key={`arc-${side}`}
          viewBox="0 0 40 64"
          className={`absolute top-1/2 h-[58%] w-8 -translate-y-1/2 text-[#1F6B43] ${
            side < 0 ? "left-[4%] -scale-x-100" : "right-[4%]"
          }`}
          fill="none"
        >
          {[0, 1, 2].map((r) => (
            <motion.path
              key={r}
              d={`M ${8 + r * 8} 12 Q ${22 + r * 6} 32 ${8 + r * 8} 52`}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              animate={
                speaking
                  ? { opacity: [0.15, 0.85, 0.15] }
                  : { opacity: [0.08, 0.22, 0.08] }
              }
              transition={{
                duration: speaking ? 0.7 + r * 0.15 : 2.6 + r * 0.3,
                repeat: Infinity,
                delay: r * 0.12,
                ease: "easeInOut",
              }}
            />
          ))}
        </motion.svg>
      ))}
    </div>
  );
}
