// ─── Shared Meeting Types ─────────────────────────────────────────────────────

export type MeetingStatus = "scheduled" | "completed" | "cancelled";
export type MeetingFilter = "all" | "upcoming" | "past";

export interface Meeting {
  id: string; clientId: string;
  freelancerId: string; freelancerName: string; freelancerAvatarInitials: string;
  projectId: string; projectName: string;
  date: string;   // "YYYY-MM-DD"
  time: string;   // "HH:MM" 24h
  duration: number; // minutes
  meetingLink: string;
  notes: string;
  status: MeetingStatus;
  createdAt: string;
}

// ─── Display helpers ──────────────────────────────────────────────────────────

export const STATUS_META: Record<MeetingStatus, { label: string; bg: string; text: string; border: string }> = {
  scheduled:  { label: "Scheduled",  bg: "bg-blue-500/10",    text: "text-blue-400",   border: "border-blue-500/30" },
  completed:  { label: "Completed",  bg: "bg-success/10",     text: "text-success",    border: "border-success/30" },
  cancelled:  { label: "Cancelled",  bg: "bg-slate-500/10",   text: "text-slate-400",  border: "border-slate-500/30" },
};

export const DURATION_OPTIONS = [
  { value: 15,  label: "15 min" },
  { value: 30,  label: "30 min" },
  { value: 45,  label: "45 min" },
  { value: 60,  label: "1 hour" },
  { value: 90,  label: "1.5 hours" },
  { value: 120, label: "2 hours" },
];

export function formatMeetingTime(date: string, time: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  return new Date(y, m - 1, d, h, min).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60); const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h} hour${h > 1 ? "s" : ""}`;
}

export function isUpcoming(date: string, time: string): boolean {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, m] = time.split(":").map(Number);
  return new Date(y, mo - 1, d, h, m) > new Date();
}

export function isSoon(date: string, time: string): boolean {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, m] = time.split(":").map(Number);
  const diff = new Date(y, mo - 1, d, h, m).getTime() - Date.now();
  return diff >= 0 && diff <= 30 * 60 * 1000; // within 30 min
}

export const MEETING_FILTER_OPTIONS: { value: MeetingFilter; label: string }[] = [
  { value: "all",      label: "All" },
  { value: "upcoming", label: "Upcoming" },
  { value: "past",     label: "Past" },
];
