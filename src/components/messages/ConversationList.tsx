/**
 * ConversationList.tsx — Sidebar conversation list (upgraded)
 *
 * Additions over the previous version:
 *   - Online status dot from socket user:status events
 *   - Live-updated last message + unread via real-time
 *   - Sort toggle: Latest | Unread
 *   - Debounced search (300ms)
 *   - Skeleton loading state
 *   - Animated card entrance
 */

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Plus, MessageSquare, Clock, Bell } from "lucide-react";
import { cn } from "../../lib/utils";
import { Avatar } from "../chat/Avatar";
import { useDebounce } from "../../hooks/useDebounce";
import type { Conversation } from "../../hooks/useConversations";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTimestamp(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)    return "just now";
  if (m < 60)   return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24)   return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7)    return `${d}d`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const ConvSkeleton: React.FC = () => (
  <div className="flex items-start gap-3 px-4 py-3 animate-pulse">
    <div className="h-10 w-10 rounded-full bg-elevated shrink-0" />
    <div className="flex-1 space-y-1.5 pt-1">
      <div className="h-3 w-24 rounded-full bg-elevated" />
      <div className="h-2.5 w-36 rounded-full bg-elevated" />
    </div>
  </div>
);

// ─── Props ────────────────────────────────────────────────────────────────────

interface ConversationListProps {
  conversations: Conversation[];
  isLoading:     boolean;
  activeId:      string | null;
  onSelect:      (id: string) => void;
  onNewMessage:  () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  isLoading,
  activeId,
  onSelect,
  onNewMessage,
}) => {
  const [rawQuery, setRawQuery] = useState("");
  const [sort, setSort]        = useState<"recent" | "unread">("recent");
  const query = useDebounce(rawQuery, 300);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = q
      ? conversations.filter(c =>
          c.freelancerName.toLowerCase().includes(q) ||
          c.clientName?.toLowerCase().includes(q) ||
          c.topic?.toLowerCase().includes(q)
        )
      : [...conversations];

    if (sort === "unread") {
      list = list.sort((a, b) => b.unreadCount - a.unreadCount);
    }
    return list;
  }, [conversations, query, sort]);

  const totalUnread = conversations.reduce((n, c) => n + (c.unreadCount ?? 0), 0);

  return (
    <div className="flex flex-col h-full border-r border-border" style={{ backgroundColor: "#111111" }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-sm font-bold text-textPrimary">Messages</h3>
          {totalUnread > 0 && (
            <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[9px] font-black text-white">
              {totalUnread > 99 ? "99+" : totalUnread}
            </span>
          )}
        </div>
        <button
          onClick={onNewMessage}
          id="new-message-btn"
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 border border-accent/20 text-accent hover:bg-accent/20 transition-colors"
          title="New Message"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2.5 border-b border-border/50 space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-textDisabled pointer-events-none" />
          <input
            type="text"
            value={rawQuery}
            onChange={e => setRawQuery(e.target.value)}
            placeholder="Search conversations…"
            className="w-full rounded-xl border border-border bg-surface pl-8 pr-3 py-2 text-xs text-textPrimary placeholder-textDisabled focus:outline-none focus:ring-1 focus:ring-accent/50 transition-all"
          />
        </div>

        {/* Sort toggle */}
        <div className="flex gap-1">
          {([["recent", "Latest", Clock], ["unread", "Unread", Bell]] as const).map(([val, label, Icon]) => (
            <button
              key={val}
              onClick={() => setSort(val)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1 rounded-lg border py-1 text-[10px] font-semibold transition-all",
                sort === val
                  ? "border-accent/40 bg-accent/10 text-accent"
                  : "border-border text-textDisabled hover:text-textMuted"
              )}
            >
              <Icon className="h-2.5 w-2.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <ConvSkeleton key={i} />)
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center px-4">
            <MessageSquare className="h-8 w-8 text-textDisabled" />
            <p className="text-xs text-textMuted">
              {query ? "No matching conversations." : "No conversations yet."}
            </p>
            {!query && (
              <button
                onClick={onNewMessage}
                className="rounded-xl bg-accent/10 border border-accent/20 px-3 py-1.5 text-[11px] font-bold text-accent hover:bg-accent/20 transition-colors"
              >
                + New Message
              </button>
            )}
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {filtered.map((c, i) => (
              <ConvCard
                key={c.id}
                conv={c}
                index={i}
                isActive={c.id === activeId}
                onSelect={onSelect}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

// ─── Conversation card ─────────────────────────────────────────────────────────

const ConvCard: React.FC<{
  conv:     Conversation;
  index:    number;
  isActive: boolean;
  onSelect: (id: string) => void;
}> = ({ conv: c, index, isActive, onSelect }) => {
  const otherName = c.freelancerName ?? c.clientName ?? "Unknown";
  const otherId   = c.freelancerId  ?? c.clientId   ?? "";

  return (
    <motion.button
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ delay: Math.min(index * 0.03, 0.2) }}
      onClick={() => onSelect(c.id)}
      className={cn(
        "flex w-full items-start gap-3 px-4 py-3 text-left transition-all border-b border-border/30 last:border-0",
        isActive
          ? "bg-accent/10 border-l-2 border-l-accent"
          : "hover:bg-elevated/50 border-l-2 border-l-transparent"
      )}
    >
      {/* Avatar with online dot */}
      <Avatar
        uid={otherId}
        name={otherName}
        size="sm"
        status={c.isOnline ? "online" : null}
      />

      {/* Body */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-1 mb-0.5">
          <p className={cn(
            "text-xs font-bold truncate",
            isActive ? "text-accent" : "text-textPrimary"
          )}>
            {otherName}
          </p>
          <span className="text-[10px] text-textDisabled shrink-0">
            {c.lastMessageAt ? relativeTimestamp(c.lastMessageAt) : ""}
          </span>
        </div>
        {c.topic && (
          <p className="text-[10px] text-textDisabled truncate mb-0.5">{c.topic}</p>
        )}
        <div className="flex items-center justify-between gap-1">
          <p className={cn(
            "text-[11px] truncate",
            c.unreadCount > 0 ? "text-textPrimary font-medium" : "text-textMuted"
          )}>
            {c.lastMessage || "No messages yet"}
          </p>
          {c.unreadCount > 0 && (
            <span className="shrink-0 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent text-[8px] font-black text-white px-1">
              {c.unreadCount > 9 ? "9+" : c.unreadCount}
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
};
