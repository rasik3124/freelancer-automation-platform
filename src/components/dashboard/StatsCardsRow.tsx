import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  FolderOpen,
  Inbox,
  Calendar,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import api from "../../services/api";
import { cn } from "../../lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardStats {
  activeProjects: number;
  proposalsReceived: number;
  meetingsScheduled: number;
  totalSpent: number;
  projectsDelta: string;
  proposalsDelta: string;
  meetingsDelta: string;
  spentDelta: string;
}

// ─── Card config ──────────────────────────────────────────────────────────────

const CARD_CONFIG = [
  {
    key: "activeProjects" as const,
    label: "Active Projects",
    deltaKey: "projectsDelta" as const,
    icon: FolderOpen,
    format: (v: number) => String(v),
    trend: "up",
  },
  {
    key: "proposalsReceived" as const,
    label: "Proposals Received",
    deltaKey: "proposalsDelta" as const,
    icon: Inbox,
    format: (v: number) => String(v),
    trend: "up",
  },
  {
    key: "meetingsScheduled" as const,
    label: "Meetings Scheduled",
    deltaKey: "meetingsDelta" as const,
    icon: Calendar,
    format: (v: number) => String(v),
    trend: "neutral",
  },
  {
    key: "totalSpent" as const,
    label: "Total Spent",
    deltaKey: "spentDelta" as const,
    icon: CreditCard,
    format: (v: number) =>
      `₹${v.toLocaleString("en-IN", { minimumFractionDigits: 0 })}`,

    trend: "neutral",
  },
];

// ─── Skeleton card ────────────────────────────────────────────────────────────

const StatCardSkeleton: React.FC = () => (
  <div className="animate-pulse rounded-2xl border border-border bg-surface/50 p-6 space-y-4">
    <div className="flex items-center justify-between">
      <div className="h-10 w-10 rounded-xl bg-elevated" />
      <div className="h-4 w-4 rounded-full bg-elevated" />
    </div>
    <div className="space-y-2">
      <div className="h-3 w-24 rounded-full bg-elevated" />
      <div className="h-7 w-16 rounded-full bg-elevated" />
      <div className="h-3 w-28 rounded-full bg-elevated" />
    </div>
  </div>
);

// ─── Trend icon ───────────────────────────────────────────────────────────────

const TrendIcon: React.FC<{ trend: string }> = ({ trend }) => {
  if (trend === "up")
    return <TrendingUp className="h-4 w-4 text-success" aria-label="Trending up" />;
  if (trend === "down")
    return <TrendingDown className="h-4 w-4 text-error" aria-label="Trending down" />;
  return <Minus className="h-4 w-4 text-textDisabled" aria-label="Stable" />;
};

// ─── Single stat card ─────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  delta: string;
  icon: React.ElementType;
  trend: string;
  index: number;
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  delta,
  icon: Icon,
  trend,
  index,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.08, duration: 0.3 }}
    className={cn(
      "group relative overflow-hidden rounded-2xl border border-border p-6 transition-all duration-200",
      "hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5"
    )}
    style={{ backgroundColor: "#111111" }}
  >
    {/* Subtle hover glow */}
    <div className="pointer-events-none absolute -bottom-6 -right-6 h-20 w-20 rounded-full bg-accent/5 blur-2xl transition-all duration-300 group-hover:bg-accent/10 group-hover:scale-150" />

    {/* Top row: icon + trend */}
    <div className="flex items-center justify-between">
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl border border-accent/20 bg-accent/10 text-accent",
          "transition-all duration-200 group-hover:bg-accent group-hover:text-white group-hover:shadow-glow"
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <TrendIcon trend={trend} />
    </div>

    {/* Stats */}
    <div className="mt-4 space-y-0.5">
      <p className="text-xs font-semibold uppercase tracking-wider text-textMuted">
        {label}
      </p>
      <p className="text-2xl font-display font-bold text-textPrimary"
        style={{ color: "#8b5cf6" }}
      >
        {value}
      </p>
      <p className="text-[11px] text-textDisabled">{delta}</p>
    </div>
  </motion.div>
);

// ─── StatsCardsRow ────────────────────────────────────────────────────────────

/**
 * StatsCardsRow — 4-card responsive grid fetching from GET /api/dashboard/stats.
 *
 * Grid: 1 col mobile → 2 col tablet (sm) → 4 col desktop (lg)
 * Loading: 4 skeleton cards with pulse animation
 * Error: soft error message (non-blocking — rest of dashboard still loads)
 */
export const StatsCardsRow: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get<{ data: DashboardStats }>("/api/dashboard/stats");
        if (mounted) setStats(res.data.data);
      } catch {
        if (mounted) setError("Could not load stats.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Loading
  if (isLoading) {
    return (
      <div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        aria-label="Loading stats"
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Non-blocking error
  if (error || !stats) {
    return (
      <div className="rounded-2xl border border-error/20 bg-error/5 p-4 text-sm text-error">
        {error ?? "Stats unavailable."}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {CARD_CONFIG.map((cfg, i) => (
        <StatCard
          key={cfg.key}
          label={cfg.label}
          value={cfg.format(stats[cfg.key])}
          delta={stats[cfg.deltaKey]}
          icon={cfg.icon}
          trend={cfg.trend}
          index={i}
        />
      ))}
    </div>
  );
};
