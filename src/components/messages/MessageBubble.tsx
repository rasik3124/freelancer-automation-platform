/**
 * MessageBubble.tsx — Individual chat message (memoized)
 *
 * Props:
 *   message        — Message object
 *   isOwn          — true if sent by the current user
 *   showAvatar     — show avatar on left/right (first in a run)
 *   showTimestamp  — always show timestamp below bubble
 */

import React, { memo } from "react";
import { Check, CheckCheck, Clock, RotateCcw } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../../lib/utils";
import { Avatar } from "../chat/Avatar";
import type { Message } from "../../hooks/useMessages";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour:   "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatLink(text: string): React.ReactNode[] {
  const URL_RE = /(https?:\/\/[^\s]+)/g;
  const parts  = text.split(URL_RE);
  return parts.map((part, i) =>
    URL_RE.test(part)
      ? <a key={i} href={part} target="_blank" rel="noreferrer"
             className="underline opacity-90 hover:opacity-100 break-all">{part}</a>
      : <span key={i}>{part}</span>
  );
}

// ─── Read indicator ───────────────────────────────────────────────────────────

const ReadIndicator: React.FC<{ status?: string; read: boolean }> = ({ status, read }) => {
  if (status === "pending") return <Clock className="h-3 w-3 opacity-60" />;
  if (status === "error")   return <span className="text-[10px] text-error">!</span>;
  if (read)  return <CheckCheck className="h-3 w-3 text-sky-300" />;
  return <Check className="h-3 w-3 opacity-60" />;
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface MessageBubbleProps {
  message:        Message;
  isOwn:          boolean;
  showAvatar:     boolean;
  showTimestamp?: boolean;
  onRetry?:       (msg: Message) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const MessageBubble: React.FC<MessageBubbleProps> = memo(
  ({ message: m, isOwn, showAvatar, showTimestamp = false, onRetry }) => {
    const isError = m.status === "error";

    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className={cn(
          "group flex items-end gap-2",
          isOwn ? "flex-row-reverse" : "flex-row"
        )}
      >
        {/* Avatar — 32px placeholder to maintain alignment */}
        <div className="w-8 shrink-0 self-end">
          {showAvatar && !isOwn ? (
            <Avatar
              uid={m.senderId}
              name={m.senderName}
              size="sm"
            />
          ) : null}
        </div>

        {/* Bubble + meta */}
        <div
          className={cn(
            "flex flex-col gap-0.5",
            isOwn ? "items-end" : "items-start",
            "max-w-[70%] sm:max-w-[65%]"
          )}
        >
          {/* Sender name — only for others, first in run */}
          {!isOwn && showAvatar && (
            <span className="ml-1 text-[10px] font-semibold text-textMuted">
              {m.senderName}
            </span>
          )}

          {/* Bubble */}
          <div
            className={cn(
              "relative rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm break-words",
              isOwn
                ? "rounded-br-sm bg-accent text-white"
                : "rounded-bl-sm border border-border bg-elevated text-textPrimary",
              isError && "border-error/40 bg-error/10 text-error"
            )}
          >
            <p className="whitespace-pre-wrap">{formatLink(m.text)}</p>
          </div>

          {/* Timestamp + read status */}
          {(showTimestamp || m.status === "error") && (
            <div
              className={cn(
                "flex items-center gap-1 px-1",
                isOwn ? "flex-row-reverse" : "flex-row"
              )}
            >
              <span className="text-[10px] text-textDisabled">
                {formatTime(m.createdAt)}
              </span>
              {isOwn && (
                <ReadIndicator status={m.status} read={m.read} />
              )}
              {isError && onRetry && (
                <button
                  onClick={() => onRetry(m)}
                  className="flex items-center gap-0.5 text-[10px] text-error hover:text-error/80 transition-colors ml-1"
                >
                  <RotateCcw className="h-2.5 w-2.5" /> Retry
                </button>
              )}
            </div>
          )}

          {/* Hover timestamp (shows on hover when not always shown) */}
          {!showTimestamp && !isError && (
            <span
              className={cn(
                "text-[10px] text-textDisabled opacity-0 group-hover:opacity-100 transition-opacity px-1",
                isOwn ? "text-right" : "text-left"
              )}
            >
              {formatTime(m.createdAt)}
            </span>
          )}
        </div>
      </motion.div>
    );
  },
  // Custom comparator — only re-render if content changes
  (prev, next) =>
    prev.message.id      === next.message.id &&
    prev.message.read    === next.message.read &&
    prev.message.status  === next.message.status &&
    prev.message.text    === next.message.text &&
    prev.isOwn           === next.isOwn &&
    prev.showAvatar      === next.showAvatar &&
    prev.showTimestamp   === next.showTimestamp
);

MessageBubble.displayName = "MessageBubble";
