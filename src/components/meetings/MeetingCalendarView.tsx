import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { Meeting, formatMeetingTime, formatDuration } from "../../types/meeting";
import { cn } from "../../lib/utils";

// ─── Calendar helpers ─────────────────────────────────────────────────────────

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_LABELS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function getCalendarGrid(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const last  = new Date(year, month + 1, 0);
  const cells: (Date | null)[] = [];
  // leading nulls
  for (let i = 0; i < first.getDay(); i++) cells.push(null);
  // days
  for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(year, month, d));
  // trailing nulls to fill last row
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

const STATUS_DOT: Record<Meeting["status"], string> = {
  scheduled: "bg-blue-400",
  completed: "bg-success",
  cancelled: "bg-slate-500",
};

// ─── Day meetings popover ─────────────────────────────────────────────────────

const DayPopover: React.FC<{ date: Date; meetings: Meeting[]; onClose: () => void; onSchedule: () => void }> = ({ date, meetings, onClose, onSchedule }) => (
  <div className="absolute z-20 top-full left-1/2 -translate-x-1/2 mt-2 w-72 rounded-2xl border border-border shadow-2xl"
    style={{ backgroundColor: "#0d0d0d" }}>
    <div className="flex items-center justify-between border-b border-border px-4 py-3">
      <p className="text-xs font-bold text-textPrimary">
        {date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
      </p>
      <button onClick={onClose} className="text-textDisabled hover:text-textPrimary transition-colors"><X className="h-3.5 w-3.5" /></button>
    </div>
    <div className="p-3 space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
      {meetings.length === 0 ? (
        <div className="py-6 text-center space-y-2">
          <p className="text-xs text-textMuted">No meetings on this day.</p>
          {date >= new Date(new Date().toDateString()) && (
            <button onClick={() => { onClose(); onSchedule(); }}
              className="rounded-xl bg-accent/10 border border-accent/20 px-3 py-1.5 text-[11px] font-bold text-accent hover:bg-accent/20 transition-colors">
              + Schedule Meeting
            </button>
          )}
        </div>
      ) : (
        meetings.map((m) => (
          <div key={m.id} className="rounded-xl border border-border p-3 space-y-1" style={{ backgroundColor: "#111111" }}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold text-textPrimary truncate">{m.freelancerName}</p>
              <span className={cn("flex h-2 w-2 rounded-full shrink-0", STATUS_DOT[m.status])} />
            </div>
            <p className="text-[10px] text-textMuted">{formatMeetingTime(m.date, m.time)} · {formatDuration(m.duration)}</p>
            <p className="text-[10px] text-textDisabled truncate">{m.projectName}</p>
          </div>
        ))
      )}
    </div>
  </div>
);

// ─── MeetingCalendarView ──────────────────────────────────────────────────────

interface MeetingCalendarViewProps {
  meetings: Meeting[];
  onScheduleNew: () => void;
}

export const MeetingCalendarView: React.FC<MeetingCalendarViewProps> = ({ meetings, onScheduleNew }) => {
  const today = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const prevMonth = () => { if (month === 0) { setYear(y => y-1); setMonth(11); } else setMonth(m => m-1); setSelectedDate(null); };
  const nextMonth = () => { if (month === 11) { setYear(y => y+1); setMonth(0); } else setMonth(m => m+1); setSelectedDate(null); };
  const goToday   = () => { setYear(today.getFullYear()); setMonth(today.getMonth()); setSelectedDate(null); };

  const cells = getCalendarGrid(year, month);
  const todayKey = toDateKey(today);

  // Build date → meetings map
  const meetingsByDate: Record<string, Meeting[]> = {};
  for (const m of meetings) {
    meetingsByDate[m.date] = meetingsByDate[m.date] ? [...meetingsByDate[m.date], m] : [m];
  }

  const selectedKey = selectedDate ? toDateKey(selectedDate) : null;
  const selectedMeetings = selectedKey ? (meetingsByDate[selectedKey] ?? []) : [];

  return (
    <div className="rounded-2xl border border-border overflow-hidden" style={{ backgroundColor: "#111111" }}>
      {/* Calendar header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="flex h-8 w-8 items-center justify-center rounded-xl border border-border text-textMuted hover:bg-elevated hover:text-textPrimary transition-colors" aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h3 className="font-display text-base font-bold text-textPrimary min-w-[160px] text-center">
            {MONTH_NAMES[month]} {year}
          </h3>
          <button onClick={nextMonth} className="flex h-8 w-8 items-center justify-center rounded-xl border border-border text-textMuted hover:bg-elevated hover:text-textPrimary transition-colors" aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={goToday} className="rounded-xl border border-border px-3 py-1.5 text-xs font-bold text-textMuted hover:bg-elevated hover:text-textPrimary transition-colors">Today</button>
          <button onClick={onScheduleNew} className="flex items-center gap-1.5 rounded-xl bg-accent px-3 py-1.5 text-xs font-bold text-white hover:bg-accent/90 shadow-glow transition-colors">
            <Plus className="h-3.5 w-3.5" /> Schedule
          </button>
        </div>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 border-b border-border/50">
        {DAY_LABELS.map((d) => (
          <div key={d} className="py-2 text-center text-[10px] font-black uppercase tracking-widest text-textDisabled">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {cells.map((cell, i) => {
          if (!cell) return <div key={i} className="h-20 border-b border-r border-border/30 last-in-row:border-r-0" />;
          const key = toDateKey(cell);
          const dayMeetings = meetingsByDate[key] ?? [];
          const isToday = key === todayKey;
          const isSelected = key === selectedKey;
          const isPast = cell < new Date(new Date().toDateString());

          return (
            <div key={key} className="relative"
              onClick={() => setSelectedDate(isSelected ? null : cell)}>
              <div className={cn(
                "h-20 border-b border-r border-border/30 p-2 cursor-pointer transition-all group",
                isSelected ? "bg-accent/10" : "hover:bg-elevated/50",
                isPast && "opacity-50",
              )}>
                {/* Day number */}
                <span className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-colors",
                  isToday ? "bg-accent text-white" : isSelected ? "bg-accent/20 text-accent" : "text-textMuted group-hover:text-textPrimary",
                )}>
                  {cell.getDate()}
                </span>

                {/* Meeting dots */}
                {dayMeetings.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-0.5">
                    {dayMeetings.slice(0, 3).map((m) => (
                      <span key={m.id} className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[m.status])} />
                    ))}
                    {dayMeetings.length > 3 && (
                      <span className="text-[9px] text-textDisabled leading-none self-center">+{dayMeetings.length - 3}</span>
                    )}
                  </div>
                )}

                {/* Compact meeting label on large screens */}
                {dayMeetings.length === 1 && (
                  <p className="hidden lg:block mt-1 text-[9px] text-textDisabled truncate">
                    {dayMeetings[0].freelancerName.split(" ")[0]} {dayMeetings[0].time}
                  </p>
                )}
              </div>

              {/* Popover */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div key="popover" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
                    <DayPopover date={cell} meetings={selectedMeetings} onClose={() => setSelectedDate(null)} onSchedule={onScheduleNew} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 border-t border-border/50 px-5 py-3">
        {(["scheduled","completed","cancelled"] as Meeting["status"][]).map((s) => (
          <div key={s} className="flex items-center gap-1.5 text-[10px] text-textDisabled">
            <span className={cn("h-2 w-2 rounded-full", STATUS_DOT[s])} />
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </div>
        ))}
      </div>
    </div>
  );
};
