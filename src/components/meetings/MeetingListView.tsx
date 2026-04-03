import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Video, ExternalLink, Copy, CheckCheck, Calendar, Clock,
  Trash2, MoreHorizontal, Tag, Check,
} from "lucide-react";
import {
  Meeting, STATUS_META, formatMeetingTime, formatDuration, isUpcoming, isSoon,
} from "../../types/meeting";
import api from "../../services/api";
import { cn } from "../../lib/utils";

// ─── Avatar gradients ─────────────────────────────────────────────────────────
const GRADS = ["from-accent to-violet-600","from-blue-500 to-cyan-400","from-emerald-500 to-teal-400","from-orange-500 to-pink-500"];
const grad = (id: string) => GRADS[id.charCodeAt(id.length - 1) % GRADS.length];

// ─── Status badge ─────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: Meeting["status"] }> = ({ status }) => {
  const m = STATUS_META[status];
  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", m.bg, m.text, m.border)}>
      {m.label}
    </span>
  );
};

// ─── Copy link button ─────────────────────────────────────────────────────────
const CopyLink: React.FC<{ link: string }> = ({ link }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold text-textDisabled hover:text-textPrimary hover:bg-elevated transition-all"
      title="Copy link"
    >
      {copied ? <CheckCheck className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
};

// ─── Meeting card ─────────────────────────────────────────────────────────────

interface MeetingListViewProps {
  meetings: Meeting[];
  isLoading: boolean;
  onCancelled: (id: string) => void;
  onScheduleNew: () => void;
}

const MeetingCard: React.FC<{ meeting: Meeting; index: number; onCancel: (id: string) => void }> = ({ meeting: m, index, onCancel }) => {
  const soon = isSoon(m.date, m.time);
  const upcoming = isUpcoming(m.date, m.time);
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    if (!confirm("Cancel this meeting?")) return;
    setCancelling(true);
    try {
      await api.patch(`/api/meetings/${m.id}`, { status: "cancelled" });
      onCancel(m.id);
    } finally { setCancelling(false); }
  };

  // iCal download link (simple format)
  const addToCalUrl = () => {
    const [y, mo, d] = m.date.split("-");
    const [h, min] = m.time.split(":");
    const pad = (n: string) => n.padStart(2, "0");
    const start = `${y}${pad(mo)}${pad(d)}T${pad(h)}${pad(min)}00`;
    const end = new Date(parseInt(y), parseInt(mo)-1, parseInt(d), parseInt(h), parseInt(min) + m.duration);
    const endStr = `${end.getFullYear()}${pad(String(end.getMonth()+1))}${pad(String(end.getDate()))}T${pad(String(end.getHours()))}${pad(String(end.getMinutes()))}00`;
    const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:Meeting with ${m.freelancerName} — ${m.projectName}\nDTSTART:${start}\nDTEND:${endStr}\nLOCATION:${m.meetingLink}\nDESCRIPTION:${m.notes}\nEND:VEVENT\nEND:VCALENDAR`;
    return "data:text/calendar;charset=utf8," + encodeURIComponent(ics);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.22 }}
      className={cn(
        "group relative flex flex-col gap-4 rounded-2xl border p-5 transition-all duration-200 sm:flex-row sm:items-start",
        soon ? "border-accent/40 shadow-lg shadow-accent/10" : "border-border",
        m.status === "cancelled" ? "opacity-60" : "hover:border-accent/20"
      )}
      style={{ backgroundColor: "#111111" }}
    >
      {/* Pulse dot for soon */}
      {soon && (
        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-50" />
          <span className="relative inline-flex rounded-full h-4 w-4 bg-accent" />
        </span>
      )}

      {/* Avatar */}
      <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-black text-white", grad(m.freelancerId))}>
        {m.freelancerAvatarInitials}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-sm font-bold text-textPrimary">{m.freelancerName}</p>
            <p className="text-[11px] text-textMuted flex items-center gap-1"><Tag className="h-2.5 w-2.5" />{m.projectName}</p>
          </div>
          <StatusBadge status={m.status} />
        </div>

        {/* Date/time/duration */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-textMuted">
          <span className="flex items-center gap-1 font-semibold text-textPrimary"><Calendar className="h-3 w-3 text-accent" />{formatMeetingTime(m.date, m.time)}</span>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDuration(m.duration)}</span>
        </div>

        {/* Notes */}
        {m.notes && <p className="text-xs text-textDisabled line-clamp-1">{m.notes}</p>}

        {/* Link row */}
        {m.meetingLink && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-textDisabled truncate max-w-[200px]">{m.meetingLink}</span>
            <CopyLink link={m.meetingLink} />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Join (if upcoming/soon) */}
        {upcoming && m.status === "scheduled" && m.meetingLink && (
          <a href={m.meetingLink} target="_blank" rel="noopener noreferrer"
            className={cn("flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-white transition-colors",
              soon ? "bg-accent shadow-glow animate-pulse" : "bg-accent/80 hover:bg-accent")}>
            <Video className="h-3.5 w-3.5" />{soon ? "Join Now" : "Join"}
          </a>
        )}

        {/* Add to Calendar */}
        {m.status === "scheduled" && (
          <a href={addToCalUrl()} download={`meeting-${m.id}.ics`}
            className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-bold text-textMuted hover:bg-elevated hover:text-textPrimary transition-colors"
            title="Add to Calendar">
            <Calendar className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Calendar</span>
          </a>
        )}

        {/* Cancel */}
        {m.status === "scheduled" && (
          <button onClick={handleCancel} disabled={cancelling}
            className="flex items-center gap-1 rounded-xl border border-error/30 bg-error/5 px-2.5 py-2 text-xs font-bold text-error hover:bg-error/15 transition-colors disabled:opacity-40">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const MeetingCardSkeleton: React.FC = () => (
  <div className="animate-pulse flex gap-4 rounded-2xl border border-border p-5" style={{ backgroundColor: "#111111" }}>
    <div className="h-12 w-12 rounded-xl bg-elevated shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-3.5 w-32 rounded-full bg-elevated" />
      <div className="h-3 w-48 rounded-full bg-elevated" />
      <div className="h-3 w-40 rounded-full bg-elevated" />
    </div>
    <div className="h-8 w-20 rounded-xl bg-elevated shrink-0" />
  </div>
);

// ─── MeetingListView ──────────────────────────────────────────────────────────

export const MeetingListView: React.FC<MeetingListViewProps> = ({ meetings, isLoading, onCancelled, onScheduleNew }) => {
  if (isLoading) return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => <MeetingCardSkeleton key={i} />)}
    </div>
  );

  if (meetings.length === 0) return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
        <Calendar className="h-7 w-7 text-accent" />
      </div>
      <div className="space-y-1">
        <h4 className="font-display text-base font-bold text-textPrimary">No meetings found</h4>
        <p className="text-sm text-textMuted max-w-xs">Schedule your first meeting with a freelancer to get started.</p>
      </div>
      <button onClick={onScheduleNew} className="rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-white hover:bg-accent/90 shadow-glow transition-colors">
        Schedule Now
      </button>
    </div>
  );

  return (
    <div className="space-y-3">
      {meetings.map((m, i) => (
        <MeetingCard key={m.id} meeting={m} index={i} onCancel={onCancelled} />
      ))}
    </div>
  );
};
