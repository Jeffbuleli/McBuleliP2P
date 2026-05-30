"use client";

import { motion } from "framer-motion";

export function AssistantAvatar({ size = 40, pulse = false }: { size?: number; pulse?: boolean }) {
  return (
    <div
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      {pulse ? (
        <motion.span
          className="absolute inset-0 rounded-full bg-[#305f33]/30"
          animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
      ) : null}
      <motion.div
        className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full border border-white/20 bg-gradient-to-br from-[#305f33] via-[#3d7a42] to-[#1e3d21] shadow-lg shadow-[#305f33]/40"
        animate={{ rotate: pulse ? [0, 2, -2, 0] : 0 }}
        transition={{ duration: 4, repeat: pulse ? Infinity : 0, ease: "easeInOut" }}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          className="h-[58%] w-[58%]"
          aria-hidden
        >
          <path
            d="M16 6c-3.2 0-5.8 2.4-6 5.5-.1 1.2.2 2.3.8 3.2L8 18h16l-2.8-3.3c.6-.9.9-2 .8-3.2-.2-3.1-2.8-5.5-6-5.5z"
            fill="white"
            fillOpacity="0.95"
          />
          <circle cx="12" cy="13" r="1.5" fill="#1e3d21" />
          <circle cx="20" cy="13" r="1.5" fill="#1e3d21" />
          <path
            d="M12 16.5c1.2 1.5 2.8 2.3 4 2.3s2.8-.8 4-2.3"
            stroke="#1e3d21"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path
            d="M10 22h12"
            stroke="white"
            strokeOpacity="0.5"
            strokeWidth="1"
            strokeLinecap="round"
          />
        </svg>
      </motion.div>
    </div>
  );
}
