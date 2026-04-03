import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Inbox,
  Calendar,
  Sparkles,
  FolderOpen,
  Receipt,
  ArrowUpRight,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { cn } from "../../lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type ActivityType = "proposal" | "meeting" | "match" | "project" | "invoice";

interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  createdAt: string;      // ISO timestamp from server
  actionLabel: string;    // e.g. "View Proposal"
  actionPath: string;     // e.g. "/dashboard/client/proposals"
  isNew?: boolean;
}

// ─── Event type metadata ──────────────────────────────────────────────────────

const EVENT_META: Record<
  ActivityType,
  {
    icon: React.ElementType;
    iconBg: string;       // Tailwind bg class
    iconColor: string;    // Tailwind text class
    dotColor: string;     // Tailwind bg for timeline dot
    actionColor: string;  // Tailwind text for action link
  }
> = {
  proposal: {
    icon: Inbox,
    iconBg: "bg-accent/10",
    iconColor: "text-accent",
    dotColor: "bg-accent",
    actionColor: "text-accent",
  },
  meeting: {
    icon: Calendar,
    iconBg: "bg-yellow-500/10",
    iconColor: "text-yellow-400",
    dotColor: "bg-yellow-400",
    actionColor: "text-yellow-400",
  },
  match: {
    icon: Sparkles,
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-400",
    dotColor: "bg-violet-400",
    actionColor: "text-violet-400",
  },
  project: {
    icon: FolderOpen,
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-400",
    dotColor: "bg-blue-400",
    actionColor: "text-blue-400",
  },
  invoice: {
    icon: Receipt,
    iconBg: "bg-success/10",
    iconColor: "text-success",
    dotColor: "bg-success",
    actionColor: "text-success",
  },
};

// ─── Relative time helper ─────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1)   return "Just now";
  if (diffMins < 60)  return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7)   return `${diffDays} days ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const TimelineSkeleton: React.FC = () => (
  <div className="space-y-0 pl-4">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex gap-4 animate-pulse">
        {/* Dot + line */}
        <div className="relative flex flex-col items-center">
          <div className="h-8 w-8 rounded-full bg-elevated z-10 shrink-0" />
          {i < 4 && (
            <div
              className="w-px flex-1 bg-elevated"
              style={{ minHeight: 40, marginTop: 2 }}
            />
          )}
        </div>
        {/* Content */}
        <div className="flex-1 space-y-2 py-1 pb-8">
          <div className="h-3.5 w-48 rounded-full bg-elevated" />
          <div className="h-3 w-64 rounded-full bg-elevated" />
          <div className="flex gap-4">
            <div className="h-3 w-16 rounded-full bg-elevated opacity-60" />
            <div className="h-3 w-20 rounded-full bg-elevated opacity-40" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

// ─── Single timeline event ────────────────────────────────────────────────────

interface TimelineEventProps {
  item: ActivityItem;
  index: number;
  isLast: boolean;
}

const TimelineEvent: React.FC<TimelineEventProps> = ({ item, index, isLast }) => {
  const meta = EVENT_META[item.type];
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.08 + index * 0.08, duration: 0.28 }}
      className="group flex gap-4"
    >
      {/* ── Left column: dot + vertical connector ── */}
      <div className="relative flex flex-col items-center">
        {/* Icon bubble */}
        <div
          className={cn(
            "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border transition-all duration-200",
            meta.iconBg,
            "group-hover:scale-110 group-hover:shadow-glow"
          )}
        >
          <meta.icon className={cn("h-3.5 w-3.5", meta.iconColor)} />

          {/* "New" pulsing dot overlay */}
          {item.isNew && (
            <span
              className={cn(
                "absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface",
                meta.dotColor
              )}
            >
              <span
                className={cn(
                  "absolute inset-0 rounded-full animate-ping opacity-60",
                  meta.dotColor
                )}
              />
            </span>
          )}
        </div>

        {/* Vertical connector line to next event */}
        {!isLast && (
          <div
            className="mt-1 w-px flex-1 bg-border"
            style={{ minHeight: 32 }}
          />
        )}
      </div>

      {/* ── Right column: content ── */}
      <div className={cn("flex-1 min-w-0", !isLast ? "pb-6" : "pb-0")}>
        {/* Header row: title + new badge + timestamp */}
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-textPrimary leading-snug">
              {item.title}
            </span>
            {item.isNew && (
              <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-accent">
                New
              </span>
            )}
          </div>

          {/* Timestamp */}
          <span className="flex items-center gap-1 whitespace-nowrap text-[10px] text-textDisabled mt-0.5">
            <Clock className="h-2.5 w-2.5" />
            {relativeTime(item.createdAt)}
          </span>
        </div>

        {/* Description */}
        <p className="mt-0.5 text-xs text-textMuted leading-relaxed line-clamp-1">
          {item.description}
        </p>

        {/* Action link */}
        <button
          onClick={() => navigate(item.actionPath)}
          className={cn(
            "mt-1.5 flex items-center gap-1 text-[11px] font-bold transition-all duration-150 hover:underline",
            meta.actionColor,
            "opacity-0 group-hover:opacity-100 focus:opacity-100"
          )}
          aria-label={item.actionLabel}
        >
          {item.actionLabel}
          <ArrowUpRight className="h-3 w-3" />
        </button>
      </div>
    </motion.div>
  );
};

// ─── RecentActivityTimeline ───────────────────────────────────────────────────

/**
 * RecentActivityTimeline — vertical timeline fetching from GET /api/dashboard/activity.
 *
 * Features:
 *  - Left vertical connector line linking all events
 *  - Type-specific icon + colour per event (proposal, meeting, match, project, invoice)
 *  - Pulsing "New" dot for unread events
 *  - Relative timestamp ("2h ago", "Yesterday")
 *  - Hover-reveal action link per event (e.g., "View Proposal →")
 *  - Collapsed to 5 items by default; "View all" expands to full list
 *  - Skeleton loadings while fetching; inline error with retry if fetch fails
 */
export const RecentActivityTimeline: React.FC = () => {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const fetchActivity = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<{ data: ActivityItem[] }>("/api/dashboard/activity");
      // Sort by createdAt descending (most recent first) — mirrors Firestore orderBy
      const sorted = [...res.data.data].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setItems(sorted);
    } catch {
      setError("Could not load recent activity.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, []);

  // Show first 5 by default; expand via toggle
  const LIMIT = 5;
  const displayed = showAll ? items : items.slice(0, LIMIT);
  const hasMore = items.length > LIMIT;

  return (
    <section className="space-y-4" aria-label="Recent activity">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-bold text-textPrimary">
          Recent Activity
        </h3>
        {!isLoading && hasMore && (
          <button
            onClick={() => setShowAll((v) => !v)}
            className="flex items-center gap-1 text-xs font-bold text-accent hover:underline"
          >
            {showAll ? (
              <>Show less <ChevronUp className="h-3 w-3" /></>
            ) : (
              <>View all {items.length} <ChevronDown className="h-3 w-3" /></>
            )}
          </button>
        )}
      </div>

      {/* Card container */}
      <div
        className="rounded-2xl border border-border p-5"
        style={{ backgroundColor: "#111111" }}
      >
        {isLoading ? (
          <TimelineSkeleton />
        ) : error ? (
          <div className="flex items-center justify-between gap-4 rounded-xl bg-error/5 border border-error/20 p-4">
            <p className="text-sm text-error">{error}</p>
            <button
              onClick={fetchActivity}
              className="shrink-0 rounded-lg bg-error/10 px-3 py-1.5 text-xs font-bold text-error hover:bg-error/20 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-textDisabled text-center py-8">
            No recent activity yet.
          </p>
        ) : (
          <AnimatePresence initial={false}>
            <div className="space-y-0">
              {displayed.map((item, i) => (
                <TimelineEvent
                  key={item.id}
                  item={item}
                  index={i}
                  isLast={i === displayed.length - 1}
                />
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </section>
  );
};
