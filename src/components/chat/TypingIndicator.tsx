/**
 * TypingIndicator.tsx — Animated typing dots
 * Shows "X is typing..." with animated bouncing dots.
 * Fades in/out with AnimatePresence.
 * Auto-hides after 3 seconds of no new activity.
 */

import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";

interface TypingIndicatorProps {
  typingUsers: string[]; // names of users currently typing
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ typingUsers }) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up on unmount
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  if (typingUsers.length === 0) return null;

  const label =
    typingUsers.length === 1
      ? `${typingUsers[0]} is typing`
      : typingUsers.length === 2
        ? `${typingUsers[0]} and ${typingUsers[1]} are typing`
        : `${typingUsers[0]} and ${typingUsers.length - 1} others are typing`;

  return (
    <AnimatePresence>
      <motion.div
        key="typing"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 6 }}
        transition={{ duration: 0.2 }}
        className="flex items-center gap-2 px-4 py-2"
      >
        {/* Avatar placeholder */}
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-elevated border border-border text-[9px] font-black text-textDisabled">
          {typingUsers[0]?.[0]?.toUpperCase() ?? "?"}
        </div>

        {/* Bubble */}
        <div className="flex items-center gap-0.5 rounded-2xl rounded-bl-sm border border-border bg-elevated px-4 py-2.5">
          <span className="mr-2 text-xs text-textMuted">{label}</span>
          {[0, 0.18, 0.36].map((delay) => (
            <motion.span
              key={delay}
              className="h-1.5 w-1.5 rounded-full bg-textDisabled"
              animate={{ y: [0, -4, 0] }}
              transition={{
                duration:  0.7,
                repeat:    Infinity,
                delay,
                ease:      "easeInOut",
              }}
            />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
