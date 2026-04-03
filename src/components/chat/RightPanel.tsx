/**
 * RightPanel.tsx — Crescent Black Chat Right Panel
 *
 * Shows project context, AI-matched freelancers, action buttons,
 * and session metadata. Hidden on mobile (parent toggles visibility).
 */
import React, { memo } from "react";
import {
  Briefcase, Users, Zap, CalendarDays, FileText,
  Check, Clock, Star, Sparkles, ChevronRight,
} from "lucide-react";
import { cn } from "../../lib/utils";
import type { FreelancerMatch, ProjectContext, ActionType } from "../../services/chatService";
import type { UserRole } from "../../services/chatService";

// ─── Match score colour ───────────────────────────────────────────────────────
function matchColor(score: number) {
  if (score >= 90) return "text-success";
  if (score >= 80) return "text-yellow-400";
  return "text-textMuted";
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface RightPanelProps {
  projectInfo?:    ProjectContext;
  matches:         FreelancerMatch[];
  userRole:        UserRole;
  sessionId?:      string;
  messageCount?:   number;
  createdAt?:      string;
  updatedAt?:      string;
  onAction:        (action: ActionType, params?: Record<string, unknown>) => void;
  onSendProposal?: (freelancerId: string) => void;
  onSchedule?:     (freelancerId: string) => void;
}

// ─── RightPanel ───────────────────────────────────────────────────────────────
export const RightPanel: React.FC<RightPanelProps> = memo(({
  projectInfo, matches, userRole, sessionId,
  messageCount, createdAt, updatedAt,
  onAction, onSendProposal, onSchedule,
}) => (
  <div className="flex h-full flex-col overflow-hidden">

    {/* ── Header ── */}
    <div className="border-b border-border px-5 py-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-textDisabled">Context</p>
    </div>

    <div className="flex-1 space-y-px overflow-y-auto custom-scrollbar">

      {/* ── 1. Project details ── */}
      {projectInfo?.title ? (
        <Section icon={<Briefcase className="h-4 w-4 text-accent" />} title="Project">
          <h3 className="text-sm font-semibold text-textPrimary leading-tight">
            {projectInfo.title}
          </h3>
          {projectInfo.budget && (
            <p className="mt-0.5 text-xs text-textMuted">Budget: {projectInfo.budget}</p>
          )}
          {projectInfo.status && (
            <span className="mt-2 inline-block rounded-full border border-success/25 bg-success/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-success">
              {projectInfo.status.replace(/_/g, " ")}
            </span>
          )}
        </Section>
      ) : (
        <Section icon={<Briefcase className="h-4 w-4 text-textDisabled" />} title="Project">
          <p className="text-xs text-textDisabled">No project linked yet.</p>
          <p className="mt-0.5 text-[11px] text-textDisabled">
            Describe a project to the AI to link one automatically.
          </p>
        </Section>
      )}

      {/* ── 2. Matched freelancers ── */}
      <Section icon={<Users className="h-4 w-4 text-accent" />} title="Matched Freelancers">
        {matches.length === 0 ? (
          <div className="flex flex-col items-center py-6 text-center">
            <Sparkles className="mb-2 h-6 w-6 text-textDisabled" />
            <p className="text-xs text-textDisabled">
              Freelancer matches will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {matches.map((m) => (
              <div
                key={m.id}
                className="group flex items-center gap-3 rounded-xl border border-border bg-surface p-3 transition-all hover:border-accent/25"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-accent/25 bg-accent/10 text-xs font-bold text-accent">
                  {m.avatarInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="truncate text-xs font-semibold text-textPrimary">{m.name}</p>
                    <span className={cn("text-[10px] font-bold", matchColor(m.matchScore))}>
                      {m.matchScore}%
                    </span>
                  </div>
                  <p className="truncate text-[11px] text-textMuted">{m.role}</p>
                  <div className="mt-1 flex items-center gap-1.5 text-[10px] text-textDisabled">
                    <Star className="h-3 w-3 fill-gold text-gold" />
                    {m.rating} · ${m.hourlyRate}/hr
                  </div>
                </div>
                <button
                  onClick={() => onSendProposal?.(m.id)}
                  className="shrink-0 rounded-lg border border-accent/20 bg-accent/10 p-1.5 text-accent opacity-0 transition-all hover:bg-accent/20 group-hover:opacity-100"
                  title="Send Proposal"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ── 3. Actions ── */}
      <Section icon={<Zap className="h-4 w-4 text-accent" />} title="Quick Actions">
        <div className="space-y-2">
          <ActionBtn
            icon={<Users className="h-4 w-4" />}
            label="Find Freelancer"
            onClick={() => onAction("find_freelancer" as ActionType)}
          />
          <ActionBtn
            icon={<FileText className="h-4 w-4" />}
            label="Send Proposal"
            primary
            onClick={() => onAction("send_proposal")}
          />
          <ActionBtn
            icon={<CalendarDays className="h-4 w-4" />}
            label="Schedule Meeting"
            onClick={() => onAction("schedule_meeting")}
          />
          {userRole === "freelancer" && (
            <ActionBtn
              icon={<Check className="h-4 w-4" />}
              label="Accept Job"
              onClick={() => onAction("accept_job")}
            />
          )}
        </div>
      </Section>

      {/* ── 4. Session metadata ── */}
      {(sessionId || messageCount !== undefined) && (
        <Section icon={<Clock className="h-4 w-4 text-textDisabled" />} title="Session Info">
          <div className="space-y-1.5 text-[11px] text-textDisabled">
            {sessionId && (
              <p className="truncate font-mono">ID: {sessionId.slice(0, 20)}…</p>
            )}
            {messageCount !== undefined && (
              <p>{messageCount} message{messageCount !== 1 ? "s" : ""}</p>
            )}
            {createdAt && (
              <p>Started: {new Date(createdAt).toLocaleString()}</p>
            )}
            {updatedAt && (
              <p>Updated: {new Date(updatedAt).toLocaleString()}</p>
            )}
          </div>
        </Section>
      )}
    </div>
  </div>
));
RightPanel.displayName = "RightPanel";

// ─── Section wrapper ──────────────────────────────────────────────────────────
const Section: React.FC<{
  icon:     React.ReactNode;
  title:    string;
  children: React.ReactNode;
}> = ({ icon, title, children }) => (
  <div className="px-4 py-4 border-b border-border last:border-0">
    <div className="mb-3 flex items-center gap-2">
      {icon}
      <p className="text-[10px] font-bold uppercase tracking-widest text-textDisabled">
        {title}
      </p>
    </div>
    {children}
  </div>
);

// ─── Action button ────────────────────────────────────────────────────────────
const ActionBtn: React.FC<{
  icon:     React.ReactNode;
  label:    string;
  onClick?: () => void;
  primary?: boolean;
}> = ({ icon, label, onClick, primary }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex w-full items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all",
      primary
        ? "border-accent/25 bg-accent/10 text-accent hover:bg-accent/20 shadow-glow"
        : "border-border bg-elevated text-textMuted hover:bg-border hover:text-textPrimary"
    )}
  >
    {icon}
    {label}
  </button>
);
