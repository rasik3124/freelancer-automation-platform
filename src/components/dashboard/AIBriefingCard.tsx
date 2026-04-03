import React, { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bot, RefreshCw, Sparkles, AlertCircle } from "lucide-react";
import api from "../../services/api";

import { cn } from "../../lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AIBriefingCardProps {
  className?: string;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const BriefingSkeleton: React.FC = () => (
  <div className="animate-pulse space-y-3 flex-1">
    <div className="h-4 w-3/4 rounded-full bg-elevated" />
    <div className="h-4 w-full rounded-full bg-elevated" />
    <div className="h-4 w-5/6 rounded-full bg-elevated" />
  </div>
);

// ─── AIBriefingCard ───────────────────────────────────────────────────────────

/**
 * AIBriefingCard — full-width AI-generated briefing at the top of the dashboard.
 *
 * - Fetches from POST /api/dashboard/ai-briefing on mount + on "Regenerate" click.
 * - Shows a 3-line skeleton while loading.
 * - Shows an error state with retry if the API call fails.
 * - Streams in the briefing text with a character-by-character animation.
 */
export const AIBriefingCard: React.FC<AIBriefingCardProps> = ({ className }) => {
  const [briefing, setBriefing] = useState<string>("");
  const [displayed, setDisplayed] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch briefing ──────────────────────────────────────────────────────────
  const fetchBriefing = useCallback(async (isRegen = false) => {
    if (isRegen) setIsRegenerating(true);
    else setIsLoading(true);
    setError(null);
    setDisplayed(""); // clear typed text while fetching

    try {
      const res = await api.post<{ data: { briefing: string } }>(
        "/api/dashboard/ai-briefing"
      );
      setBriefing(res.data.data.briefing);
    } catch {
      setError("Failed to generate briefing. Check your connection and try again.");
    } finally {
      setIsLoading(false);
      setIsRegenerating(false);
    }
  }, []);

  useEffect(() => {
    fetchBriefing();
  }, [fetchBriefing]);

  // ── Typewriter effect ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!briefing) return;
    setDisplayed("");
    let i = 0;
    const SPEED_MS = 18; // ms per character
    const timer = setInterval(() => {
      setDisplayed(briefing.slice(0, i + 1));
      i++;
      if (i >= briefing.length) clearInterval(timer);
    }, SPEED_MS);
    return () => clearInterval(timer);
  }, [briefing]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden rounded-2xl border p-6",
        error
          ? "border-error/20 bg-error/5"
          : "border-accent/20 bg-gradient-to-r from-accent/8 via-surface/50 to-violet/5",
        className
      )}
      style={{ backgroundColor: "rgba(26,26,26,0.9)" }}
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-8 left-1/3 h-32 w-32 rounded-full bg-violet/10 blur-3xl" />

      <div className="relative flex items-start gap-5">
        {/* Icon */}
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border shadow-glow",
            error
              ? "border-error/30 bg-error/10 text-error"
              : "border-accent/30 bg-accent/10 text-accent"
          )}
        >
          {error ? (
            <AlertCircle className="h-5 w-5" />
          ) : (
            <Bot className="h-5 w-5" />
          )}
        </div>

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {/* Header row */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-textPrimary">
                AI Briefing
              </span>
              <span className="flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
                <Sparkles className="h-2.5 w-2.5" />
                live
              </span>
            </div>

            {/* Regenerate button */}
            <button
              onClick={() => fetchBriefing(true)}
              disabled={isLoading || isRegenerating}
              aria-label="Regenerate AI briefing"
              className={cn(
                "flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-bold text-textMuted transition-all hover:border-accent/40 hover:text-accent disabled:cursor-not-allowed disabled:opacity-40",
                "hover:bg-accent/5"
              )}
            >
              <RefreshCw
                className={cn("h-3 w-3", isRegenerating && "animate-spin")}
              />
              {isRegenerating ? "Generating…" : "Regenerate"}
            </button>
          </div>

          {/* Body */}
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <BriefingSkeleton />
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-between gap-4"
              >
                <p className="text-sm text-error leading-relaxed">{error}</p>
                <button
                  onClick={() => fetchBriefing()}
                  className="shrink-0 rounded-lg bg-error/10 px-3 py-1.5 text-xs font-bold text-error hover:bg-error/20 transition-colors"
                >
                  Retry
                </button>
              </motion.div>
            ) : (
              <motion.p
                key="briefing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm leading-relaxed text-textMuted"
              >
                {/* Typewriter output */}
                {displayed}
                {/* Blinking cursor while typing */}
                {displayed.length < briefing.length && (
                  <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-accent align-middle" />
                )}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};
