/**
 * MessageBubble.tsx — Crescent Black Chat Message Bubble
 *
 * Memoized for performance in long chat histories.
 * Supports user / assistant / system message variants.
 */

import React, { memo } from "react";
import { motion } from "motion/react";
import { Bot, Zap, AlertCircle } from "lucide-react";
import { cn } from "../../lib/utils";
import type { ChatMessage } from "../../hooks/useChat";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(date: Date): string {
  const diffMs  = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60)  return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60)  return `${diffMin}m ago`;
  const diffHr  = Math.floor(diffMin / 60);
  if (diffHr  < 24)  return `${diffHr}h ago`;
  return date.toLocaleDateString();
}

const INTENT_LABELS: Record<string, string> = {
  find_freelancer:  "🔍 Find Freelancer",
  send_proposal:    "📄 Proposal",
  schedule_meeting: "📅 Meeting",
  accept_job:       "✅ Accept Job",
  general:          "💬 General",
  rate_limited:     "⏳ Rate Limit",
};

// ─── Intent badge ─────────────────────────────────────────────────────────────

const IntentBadge: React.FC<{ intent: string }> = memo(({ intent }) => (
  <span className="inline-flex items-center gap-1 rounded-full border border-accent/25 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
    {INTENT_LABELS[intent] ?? intent}
  </span>
));

// ─── Props ────────────────────────────────────────────────────────────────────

interface MessageBubbleProps {
  message:       ChatMessage;
  userInitials:  string;
  showAvatar?:   boolean;
  showTimestamp?: boolean;
  onSendProposal?: (id: string) => void;
  onSchedule?:   (id: string) => void;
  onQuickAction?: (action: string) => void;
}

// ─── MessageBubble ────────────────────────────────────────────────────────────

export const MessageBubble: React.FC<MessageBubbleProps> = memo(({
  message,
  userInitials,
  showAvatar    = true,
  showTimestamp = true,
  onQuickAction,
}) => {
  const isUser   = message.role === "user";
  const isSystem = message.role === "system";

  // ── System bar ──────────────────────────────────────────────────────────────
  if (isSystem) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-center my-2"
      >
        <span className="flex items-center gap-1.5 rounded-full border border-border bg-elevated px-3 py-1 text-[11px] text-textMuted">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {message.content}
        </span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "flex items-end gap-2.5 mb-4",
        isUser && "flex-row-reverse"
      )}
    >
      {/* ── Avatar ── */}
      {showAvatar ? (
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
            isUser
              ? "bg-accent/20 border border-accent/30 text-accent"
              : "bg-elevated border border-border"
          )}
        >
          {isUser
            ? userInitials
            : <Bot className="h-4 w-4 text-accent" />
          }
        </div>
      ) : (
        /* Placeholder to keep alignment */
        <div className="h-8 w-8 shrink-0" />
      )}

      {/* ── Bubble content ── */}
      <div
        className={cn(
          "flex flex-col gap-1.5",
          isUser ? "items-end" : "items-start",
          "max-w-[70%] sm:max-w-[85%] md:max-w-[70%]"   // 85% mobile, 70% desktop
        )}
      >
        {/* Intent badge (AI only) */}
        {!isUser && message.intent && message.intent !== "general" && (
          <IntentBadge intent={message.intent} />
        )}

        {/* Text bubble */}
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed",
            isUser
              ? "bg-accent text-white rounded-br-sm shadow-glow"
              : "bg-elevated border border-border text-textPrimary rounded-bl-sm"
          )}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>

        {/* Meeting link */}
        {message.meetingLink && (
          <motion.a
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            href={message.meetingLink}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-4 py-2 text-xs font-semibold text-success transition-all hover:bg-success/15 hover:border-success/50"
          >
            📅 Join Meeting — {message.meetingLink}
          </motion.a>
        )}

        {/* Quick-action chips */}
        {!isUser && message.quickActions && message.quickActions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-0.5">
            {message.quickActions.map((action) => (
              <button
                key={action}
                onClick={() => onQuickAction?.(action)}
                className="rounded-full border border-border bg-elevated px-3 py-1 text-[11px] text-textMuted transition-all hover:border-accent/40 hover:text-accent"
              >
                {action}
              </button>
            ))}
          </div>
        )}

        {/* Timestamp + n8n status */}
        {showTimestamp && (
          <div className="flex items-center gap-1.5 px-1">
            <span className="text-[10px] text-textDisabled">
              {relativeTime(message.timestamp)}
            </span>
            {isUser && message.status === "n8n_triggered" && (
              <span className="flex items-center gap-0.5 text-[10px] text-accent">
                <Zap className="h-2.5 w-2.5" /> n8n
              </span>
            )}
            {message.status === "error" && (
              <span className="text-[10px] text-error">⚠ failed</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
});

MessageBubble.displayName = "MessageBubble";
