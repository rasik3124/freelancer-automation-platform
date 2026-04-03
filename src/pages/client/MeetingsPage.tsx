import React, { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import { CalendarPlus, LayoutList, CalendarDays } from "lucide-react";
import { Meeting, MeetingFilter, MEETING_FILTER_OPTIONS } from "../../types/meeting";
import { MeetingListView } from "../../components/meetings/MeetingListView";
import { MeetingCalendarView } from "../../components/meetings/MeetingCalendarView";
import { ScheduleMeetingModal } from "../../components/meetings/ScheduleMeetingModal";
import api from "../../services/api";
import { useLocation } from "react-router-dom";
import { cn } from "../../lib/utils";

// ─── MeetingsPage ─────────────────────────────────────────────────────────────

/**
 * MeetingsPage — /dashboard/client/meetings
 *
 * State:
 *   meetings        — fetched from GET /api/meetings?filter=…
 *   viewMode        — "list" | "calendar"
 *   filter          — "all" | "upcoming" | "past"
 *   showSchedule    — ScheduleMeetingModal toggle
 *
 * Also reads ?freelancer= from query string to pre-populate the modal
 * (redirected from AcceptProposalModal).
 */
export const MeetingsPage: React.FC = () => {
  const location = useLocation();
  const preselectedFreelancerId = new URLSearchParams(location.search).get("freelancer") ?? undefined;

  const [meetings, setMeetings]       = useState<Meeting[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [fetchError, setFetchError]   = useState<string | null>(null);
  const [viewMode, setViewMode]       = useState<"list" | "calendar">("list");
  const [filter, setFilter]           = useState<MeetingFilter>("upcoming");
  const [showSchedule, setShowSchedule] = useState(!!preselectedFreelancerId);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchMeetings = useCallback(async (f: MeetingFilter) => {
    setIsLoading(true); setFetchError(null);
    try {
      const res = await api.get<{ data: Meeting[] }>("/api/meetings", { params: { filter: f } });
      setMeetings(res.data.data);
    } catch {
      setFetchError("Could not load meetings. Please refresh.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchMeetings(filter); }, [filter, fetchMeetings]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleScheduled = (m: Meeting) => {
    setMeetings(prev => [m, ...prev].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)));
    setShowSchedule(false);
  };

  const handleCancelled = (id: string) =>
    setMeetings(prev => prev.map(m => m.id === id ? { ...m, status: "cancelled" as const } : m));

  // ── Stats ─────────────────────────────────────────────────────────────────
  const allMeetings = meetings;
  const upcomingCount = allMeetings.filter(m => m.status === "scheduled").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-0.5">
          <h2 className="font-display text-2xl font-bold text-textPrimary">Meetings</h2>
          <p className="text-sm text-textMuted">
            {isLoading ? "Loading…" : `${upcomingCount} upcoming meeting${upcomingCount !== 1 ? "s" : ""} scheduled`}
          </p>
        </div>
        <button
          id="schedule-meeting-btn"
          onClick={() => setShowSchedule(true)}
          className="flex items-center gap-2 self-start rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-white shadow-glow hover:bg-accent/90 transition-colors sm:self-auto"
        >
          <CalendarPlus className="h-4 w-4" />
          Schedule New Meeting
        </button>
      </motion.div>

      {/* Toolbar: filter pills + view toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Filter pills */}
        <div className="flex gap-1.5">
          {MEETING_FILTER_OPTIONS.map((o) => (
            <button key={o.value} onClick={() => setFilter(o.value)}
              className={cn("rounded-full border px-3 py-1 text-[11px] font-bold transition-all",
                filter === o.value
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border text-textDisabled hover:border-accent/30 hover:text-textMuted")}>
              {o.label}
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div className="flex items-center rounded-xl border border-border overflow-hidden">
          {(["list","calendar"] as const).map((v) => (
            <button key={v} onClick={() => setViewMode(v)} id={`meetings-${v}-view`}
              className={cn("flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition-colors",
                viewMode === v ? "bg-accent text-white" : "text-textMuted hover:text-textPrimary")}>
              {v === "list" ? <LayoutList className="h-3.5 w-3.5" /> : <CalendarDays className="h-3.5 w-3.5" />}
              {v === "list" ? "List" : "Calendar"}
            </button>
          ))}
        </div>
      </div>

      {/* Fetch error */}
      {fetchError && (
        <div className="flex items-center justify-between rounded-2xl border border-error/20 bg-error/5 px-5 py-4">
          <p className="text-sm text-error">{fetchError}</p>
          <button onClick={() => fetchMeetings(filter)} className="rounded-lg bg-error/10 px-3 py-1.5 text-xs font-bold text-error hover:bg-error/20 transition-colors">Retry</button>
        </div>
      )}

      {/* View */}
      {viewMode === "list" ? (
        <MeetingListView
          meetings={meetings}
          isLoading={isLoading}
          onCancelled={handleCancelled}
          onScheduleNew={() => setShowSchedule(true)}
        />
      ) : (
        <MeetingCalendarView
          meetings={meetings}
          onScheduleNew={() => setShowSchedule(true)}
        />
      )}

      {/* Schedule modal */}
      {showSchedule && (
        <ScheduleMeetingModal
          onClose={() => setShowSchedule(false)}
          onScheduled={handleScheduled}
          preselectedFreelancerId={preselectedFreelancerId}
        />
      )}
    </div>
  );
};
