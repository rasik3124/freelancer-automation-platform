/**
 * ChatWindow.tsx — Full real-time chat window for a single conversation
 *
 * Features:
 *   - Header: avatar, name, online status, topic
 *   - Date separators (Today / Yesterday / Mar 15)
 *   - Infinite scroll: load older messages on scroll to top
 *   - Real-time messaging via useMessages + Socket.io
 *   - Typing indicator via socket events
 *   - Auto-scroll to bottom on new message
 *   - Auto-mark visible messages as read on window focus
 *   - MessageInput with socket typing events
 */

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  RefreshCw,
  WifiOff,
  ChevronDown,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { TypingIndicator } from "../chat/TypingIndicator";
import { Avatar } from "../chat/Avatar";
import { useMessages } from "../../hooks/useMessages";
import type { TypedSocket } from "../../hooks/useSocket";
import type { Conversation } from "../../hooks/useConversations";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupByDate(messages: { createdAt: string }[]): { label: string; indices: number[] }[] {
  const map = new Map<string, number[]>();
  messages.forEach((m, i) => {
    const d   = new Date(m.createdAt);
    const now = new Date();
    let label: string;
    if (d.toDateString() === now.toDateString()) {
      label = "Today";
    } else {
      const yd = new Date(now);
      yd.setDate(yd.getDate() - 1);
      label = d.toDateString() === yd.toDateString()
        ? "Yesterday"
        : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
    }
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(i);
  });
  return [...map.entries()].map(([label, indices]) => ({ label, indices }));
}

const DateSeparator: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex items-center gap-3 py-3">
    <div className="flex-1 h-px bg-border/40" />
    <span className="text-[10px] font-bold uppercase tracking-widest text-textDisabled px-2">
      {label}
    </span>
    <div className="flex-1 h-px bg-border/40" />
  </div>
);

// ─── Props ────────────────────────────────────────────────────────────────────

interface ChatWindowProps {
  conversation:  Conversation | null;
  userId:        string;
  socket:        TypedSocket | null;
  isConnected:   boolean;
  onBack:        () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  userId,
  socket,
  isConnected,
  onBack,
}) => {
  const bottomRef   = useRef<HTMLDivElement>(null);
  const scrollRef   = useRef<HTMLDivElement>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const {
    messages,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    sendMessage,
    markRead,
    resetMessages,
  } = useMessages(conversation?.id ?? null, userId, socket);

  // ── Scroll to bottom on new messages ────────────────────────────────────

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (messages.length > 0) scrollToBottom();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  // ── Detect scroll position to show "scroll to bottom" button ────────────

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    // Show scroll-to-bottom button when user scrolled up
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(distFromBottom > 200);

    // Load more when near top
    if (el.scrollTop < 80 && hasMore && !isLoadingMore) {
      const prevHeight = el.scrollHeight;
      loadMore().then(() => {
        // Restore scroll position so we don't jump
        requestAnimationFrame(() => {
          el.scrollTop = el.scrollHeight - prevHeight;
        });
      });
    }
  }, [hasMore, isLoadingMore, loadMore]);

  // ── Socket: typing indicator ──────────────────────────────────────────────

  useEffect(() => {
    if (!socket) return;

    const timers = new Map<string, ReturnType<typeof setTimeout>>();

    const handler = ({ userId: uid, userName, isTyping }: {
      userId: string; userName?: string; isTyping: boolean;
    }) => {
      if (uid === userId) return; // ignore own typing

      const name = userName ?? uid.slice(0, 8);

      if (isTyping) {
        setTypingUsers(prev => prev.includes(name) ? prev : [...prev, name]);
        // Auto-hide after 4s if no stop event
        if (timers.has(uid)) clearTimeout(timers.get(uid)!);
        timers.set(uid, setTimeout(() => {
          setTypingUsers(prev => prev.filter(n => n !== name));
        }, 4000));
      } else {
        if (timers.has(uid)) { clearTimeout(timers.get(uid)!); timers.delete(uid); }
        setTypingUsers(prev => prev.filter(n => n !== name));
      }
    };

    socket.on("typing:indicator", handler);
    return () => {
      socket.off("typing:indicator", handler);
      timers.forEach(t => clearTimeout(t));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, userId]);

  // ── Socket: join/leave room on conversation change ───────────────────────

  useEffect(() => {
    if (!socket || !conversation?.id) return;
    socket.emit("join_conversation", conversation.id);
    return () => { socket.emit("leave_conversation", conversation.id); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, conversation?.id]);

  // ── Mark visible messages as read on window focus ────────────────────────

  useEffect(() => {
    const onFocus = () => {
      if (!conversation?.id) return;
      messages
        .filter(m => !m.read && m.senderId !== userId)
        .forEach(m => markRead(m.id));
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [conversation?.id, messages, markRead, userId]);

  // ── Cleanup on conversation change ────────────────────────────────────────

  useEffect(() => {
    setTypingUsers([]);
    setShowScrollBtn(false);
  }, [conversation?.id]);

  // ─── Empty state ──────────────────────────────────────────────────────────

  if (!conversation) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center" style={{ backgroundColor: "#0d0d0d" }}>
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 border border-accent/20">
          <ExternalLink className="h-8 w-8 text-accent/50" />
        </div>
        <div className="space-y-1">
          <h3 className="font-display text-base font-bold text-textPrimary">Select a conversation</h3>
          <p className="text-sm text-textMuted max-w-xs">
            Choose a conversation from the sidebar to start messaging.
          </p>
        </div>
      </div>
    );
  }

  // ── Determine other participant ───────────────────────────────────────────

  const otherName    = conversation.freelancerName ?? conversation.clientName ?? "Unknown";
  const otherId      = conversation.freelancerId ?? conversation.clientId ?? "";
  const isOtherOnline = conversation.isOnline ?? false;

  // ── Group messages by date ────────────────────────────────────────────────

  const groups = groupByDate(messages);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-1 flex-col overflow-hidden" style={{ backgroundColor: "#0d0d0d" }}>

      {/* Header */}
      <div className="flex h-14 items-center gap-3 border-b border-border px-4 shrink-0 bg-surface/60 backdrop-blur-sm">
        {/* Mobile back button */}
        <button
          onClick={onBack}
          className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg text-textMuted hover:bg-elevated hover:text-textPrimary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        {/* Avatar */}
        <Avatar
          uid={otherId}
          name={otherName}
          size="sm"
          status={isOtherOnline ? "online" : "offline"}
        />

        {/* Name + status */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-textPrimary truncate">{otherName}</p>
          <p className="text-[10px] text-textDisabled truncate">
            {isOtherOnline
              ? <span className="text-success font-semibold">● Online</span>
              : conversation.topic || "Offline"
            }
          </p>
        </div>

        {/* Socket status badge */}
        {!isConnected && (
          <div className="flex items-center gap-1 rounded-full bg-error/10 border border-error/20 px-2 py-0.5">
            <WifiOff className="h-3 w-3 text-error" />
            <span className="text-[10px] font-semibold text-error">Reconnecting…</span>
          </div>
        )}

        {/* Refresh */}
        <button
          onClick={() => resetMessages()}
          className="rounded-lg p-1.5 text-textDisabled hover:text-textPrimary hover:bg-elevated transition-colors"
          title="Refresh messages"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Message thread */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 space-y-1"
      >
        {/* Load more indicator */}
        {isLoadingMore && (
          <div className="flex justify-center py-3">
            <Loader2 className="h-4 w-4 animate-spin text-accent" />
          </div>
        )}
        {hasMore && !isLoadingMore && (
          <div className="flex justify-center pb-2">
            <button
              onClick={loadMore}
              className="text-[11px] text-textMuted hover:text-accent transition-colors"
            >
              Load earlier messages
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-accent" />
          </div>
        )}

        {/* Error */}
        {!isLoading && error && (
          <p className="text-center text-sm text-error py-8">{error}</p>
        )}

        {/* Empty */}
        {!isLoading && !error && messages.length === 0 && (
          <div className="flex h-36 items-center justify-center">
            <p className="text-sm text-textMuted">
              No messages yet. Say hello! 👋
            </p>
          </div>
        )}

        {/* Messages grouped by date */}
        {!isLoading && groups.map(group => (
          <div key={group.label}>
            <DateSeparator label={group.label} />
            <div className="space-y-1.5">
              {group.indices.map((msgIdx, i) => {
                const m = messages[msgIdx];
                const prev = group.indices[i - 1] !== undefined ? messages[group.indices[i - 1]] : null;
                const showAvatar = !prev || prev.senderId !== m.senderId;
                const isOwn      = m.senderId === userId;

                return (
                  <MessageBubble
                    key={m.id}
                    message={m}
                    isOwn={isOwn}
                    showAvatar={showAvatar}
                    showTimestamp={false}
                  />
                );
              })}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        <TypingIndicator typingUsers={typingUsers} />

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>

      {/* Scroll-to-bottom FAB */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            key="scroll-btn"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToBottom}
            className="absolute bottom-28 right-6 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-accent shadow-glow text-white hover:bg-accent/90 transition-colors"
          >
            <ChevronDown className="h-4 w-4" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Input */}
      <MessageInput
        conversationId={conversation.id}
        onMessageSent={sendMessage}
        socket={socket}
        isLoading={isLoading}
      />
    </div>
  );
};
