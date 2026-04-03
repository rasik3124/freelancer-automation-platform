/**
 * ClientDashboard — overview page at /dashboard/client
 *
 * Orchestrates 5 independently-loading sections so each section
 * displays its own skeleton and can fail without breaking the others:
 *
 *   1. AIBriefingCard         — POST /api/dashboard/ai-briefing
 *   2. StatsCardsRow          — GET  /api/dashboard/stats
 *   3. PipelineStatus         — static / future: GET /api/dashboard/pipeline
 *   4. AIRecommendations      — GET  /api/dashboard/ai-recommendations
 *   5. RecentActivityTimeline — static / future: GET /api/dashboard/activity
 *
 * Each child component manages its own fetch / loading / error state so
 * the page never shows a global spinner — parts arrive progressively.
 */

import React from "react";
import { motion } from "motion/react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/Button";
import { AIBriefingCard } from "./AIBriefingCard";
import { StatsCardsRow } from "./StatsCardsRow";
import { PipelineStatus } from "./PipelineStatus";
import { AIRecommendations } from "./AIRecommendations";
import { RecentActivityTimeline } from "./RecentActivityTimeline";
import { ROUTES } from "../../constants";

// ─── Section divider ──────────────────────────────────────────────────────────

const SectionDivider: React.FC = () => (
  <div className="h-px w-full bg-border/50" />
);

// ─── ClientDashboard ─────────────────────────────────────────────────────────

export const ClientDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const firstName = user?.fullName?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-8">

      {/* ── Page header ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="space-y-1">
          <h2 className="font-display text-3xl font-bold text-textPrimary">
            Welcome back, {firstName}!
          </h2>
          <p className="text-sm text-textMuted">
            Here's what's happening across your projects today.
          </p>
        </div>

        <Button
          variant="primary"
          className="gap-2 self-start sm:self-auto"
          onClick={() => navigate(ROUTES.CLIENT_PROJECTS)}
          id="post-project-btn"
        >
          <Plus className="h-4 w-4" />
          Post a Project
        </Button>
      </motion.div>

      {/* ── 1. AI Briefing Card (full width) ── */}
      {/*
          Independently fetches POST /api/dashboard/ai-briefing.
          Shows 3-line skeleton while loading, typewriter animation on arrival.
          "Regenerate" button lets the user refresh at any time.
      */}
      <AIBriefingCard />

      <SectionDivider />

      {/* ── 2. Stats Cards Row ── */}
      {/*
          Independently fetches GET /api/dashboard/stats.
          4 cards: Active Projects, Proposals Received, Meetings Scheduled, Total Spent.
          Shows 4 pulse skeleton cards while fetching.
          Grid: 1 col → 2 col (sm) → 4 col (lg)
      */}
      <StatsCardsRow />

      <SectionDivider />

      {/* ── 3. Pipeline Status ── */}
      {/*
          Horizontal CRM pipeline showing freelancer counts per stage.
          Horizontally scrollable on mobile. Each stage has a mini progress bar.
          Future: replace static data with GET /api/dashboard/pipeline.
      */}
      <PipelineStatus />

      <SectionDivider />

      {/* ── 4. AI Freelancer Recommendations ── */}
      {/*
          Independently fetches GET /api/dashboard/ai-recommendations.
          3 freelancer cards: match score badge, skills, rating, hourly rate.
          Grid: 1 col → 2 col (sm) → 3 col (lg)
          Hover-reveals "View Profile" CTA on each card.
      */}
      <AIRecommendations />

      <SectionDivider />

      {/* ── 5. Recent Activity Timeline ── */}
      {/*
          Vertical timeline of recent events (proposals, meetings, matches, etc.).
          Shows first 4 items, expands via "View all N" toggle.
          Each item: icon, title, description, relative timestamp, "New" badge.
          Future: replace static MOCK_ACTIVITY with GET /api/dashboard/activity.
      */}
      <RecentActivityTimeline />

    </div>
  );
};
