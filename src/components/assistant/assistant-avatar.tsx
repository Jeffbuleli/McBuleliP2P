"use client";

import { motion } from "framer-motion";
import { AssistantBotLogo } from "@/components/assistant/assistant-bot-logo";

export function AssistantAvatar({
  size = 40,
  pulse = false,
}: {
  size?: number;
  pulse?: boolean;
}) {
  return (
    <div
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      {pulse ? (
        <motion.span
          className="absolute inset-0 rounded-full bg-cyan-400/20"
          animate={{ scale: [1, 1.45, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
      ) : null}
      <motion.div
        className="relative"
        animate={{ y: pulse ? [0, -1.5, 0] : 0 }}
        transition={{ duration: 3, repeat: pulse ? Infinity : 0, ease: "easeInOut" }}
      >
        <AssistantBotLogo size={size} animated={pulse} />
      </motion.div>
    </div>
  );
}
