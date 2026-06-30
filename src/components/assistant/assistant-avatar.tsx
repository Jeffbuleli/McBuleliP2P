"use client";

import { motion } from "framer-motion";
import { AssistantBotLogo } from "@/components/assistant/assistant-bot-logo";

export function AssistantAvatar({ size = 40, pulse = false }: { size?: number; pulse?: boolean }) {
  return (
    <div
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      {pulse ? (
        <motion.span
          className="absolute inset-0 rounded-full bg-[#6ee7a0]/25"
          animate={{ scale: [1, 1.4, 1], opacity: [0.45, 0, 0.45] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
      ) : null}
      <motion.div
        className="relative flex h-full w-full items-center justify-center"
        animate={{ y: pulse ? [0, -1.5, 0] : 0 }}
        transition={{ duration: 3, repeat: pulse ? Infinity : 0, ease: "easeInOut" }}
      >
        <AssistantBotLogo className="h-full w-full drop-shadow-md drop-shadow-[#305f33]/30" />
      </motion.div>
    </div>
  );
}
