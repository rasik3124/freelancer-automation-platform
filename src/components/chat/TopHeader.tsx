/**
 * TopHeader.tsx — Crescent Black Chat Top Header
 *
 * Shows current session/project info with glass-effect styling.
 */
import React, { memo } from "react";
import { X, Settings2, Bot, Briefcase } from "lucide-react";
import { cn } from "../../lib/utils";
import type { ProjectContext } from "../../services/chatService";
import type { UserRole } from "../../services/chatService";

const STATUS_STYLES: Record<string, string> = {
  new_lead:       "bg-blue-500/10 border-blue-500/25 text-blue-400",
  proposal_sent:  "bg-yellow-500/10 border-yellow-500/25 text-yellow-400",
  accepted:       "bg-success/10 border-success/25 text-success",
  in_progress:    "bg-accent/10 border-accent/25 text-accent",
  completed:      "bg-textDisabled/10 border-border text-textDisabled",
};

const STATUS_LABELS: Record<string, string> = {
  new_lead:       "New",
  proposal_sent:  "Proposal Sent",
  accepted:       "Accepted",
  in_progress:    "In Progress",
  completed:      "Completed",
};

interface TopHeaderProps {
  projectInfo?:  ProjectContext;
  userRole:      UserRole;
  onClose?:      () => void;
  onSettings?:   () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = memo(({
  projectInfo,
  userRole,
  onClose,
  onSettings,
}) => {
  const status = projectInfo?.status ?? "";

  return (
    <div className="flex items-center justify-between border-b border-border bg-surface/80 px-5 py-3 backdrop-blur-sm">

      {/* Left — AI info + project */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-accent/30 bg-accent/15">
          <Bot className="h-4 w-4 text-accent" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-textPrimary">Crescent AI</p>
            {/* Online pill */}
            <span className="flex items-center gap-1 rounded-full border border-success/25 bg-success/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-success">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
              Online
            </span>
          </div>
          <p className="text-[11px] capitalize text-textDisabled">
            {userRole} assistant · n8n connected
          </p>
        </div>
      </div>

      {/* Center — project badge */}
      {projectInfo?.title && (
        <div className="hidden items-center gap-2 sm:flex">
          <Briefcase className="h-3.5 w-3.5 text-textMuted" />
          <span className="max-w-[200px] truncate text-xs text-textMuted">
            {projectInfo.title}
          </span>
          {projectInfo.budget && (
            <span className="text-[11px] text-textDisabled">
              · {projectInfo.budget}
            </span>
          )}
          {status && STATUS_LABELS[status] && (
            <span className={cn(
              "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
              STATUS_STYLES[status] ?? "bg-elevated border-border text-textMuted"
            )}>
              {STATUS_LABELS[status]}
            </span>
          )}
        </div>
      )}

      {/* Right — action buttons */}
      <div className="flex items-center gap-1">
        {onSettings && (
          <button
            onClick={onSettings}
            className="rounded-lg p-2 text-textDisabled transition-colors hover:bg-elevated hover:text-textPrimary"
            title="Settings"
          >
            <Settings2 className="h-4 w-4" />
          </button>
        )}
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-textDisabled transition-colors hover:bg-elevated hover:text-textPrimary"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
});
TopHeader.displayName = "TopHeader";
