/**
 * AIChatPage.tsx — Crescent Black AI Lead Analyzer
 *
 * Full SaaS chatbot UI with:
 *  - Left sidebar: conversation sessions
 *  - Center: chat messages + typing indicator + n8n response cards
 *  - Right panel: project form, matched freelancers, workflow timeline
 *
 * Primary endpoint: POST /api/lead-analyze
 * Webhook: https://angrybaby.app.n8n.cloud/webhook-test/lead-analyze
 */

import React, {
  useCallback, useEffect, useRef, useState,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Bot, Send, Users, FileText, CalendarDays, Star, Clock,
  Sparkles, MapPin, ExternalLink, Check, Circle, Loader2,
  MessageSquarePlus, Trash2, ChevronRight, Zap, X, RefreshCw,
  Briefcase, DollarSign, Timer, User, Mail, AlignLeft, PanelRight,
} from "lucide-react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FreelancerMatch {
  id: string;
  name: string;
  role: string;
  skills: string[];
  matchScore: number;
  rating: number;
  hourlyRate: number;
  availability: string;
  avatarInitials: string;
  location?: string;
  matchReason?: string;
}

interface TimelineStep {
  step: number;
  label: string;
  status: "done" | "pending" | "active";
  time: string | null;
}

interface Analysis {
  projectTitle?: string;
  budget?: string;
  timeline?: string;
  complexity?: string;
  recommendedRoles?: string[];
  estimatedCost?: string;
}

interface LeadResponse {
  reply: string;
  analysis?: Analysis;
  matchedFreelancers?: FreelancerMatch[];
  meetingLink?: string;
  timelineSteps?: TimelineStep[];
  status?: string;
  sessionId?: string;
  quickActions?: string[];
  n8nConnected?: boolean;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  leadResponse?: LeadResponse;
  status?: "pending" | "sent" | "error";
}

interface ProjectForm {
  title: string;
  description: string;
  budget: string;
  timeline: string;
  clientName: string;
  clientEmail: string;
}

interface Session {
  id: string;
  title: string;
  lastMessage: string;
  updatedAt: Date;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _msgId = 0;
const uid = () => `msg-${Date.now()}-${++_msgId}`;

function initials(name?: string) {
  return (name ?? "U").split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
}

function relTime(d: Date) {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

function matchColor(score: number) {
  if (score >= 90) return { badge: "bg-success/10 border-success/30 text-success", bar: "bg-success" };
  if (score >= 80) return { badge: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400", bar: "bg-yellow-400" };
  return { badge: "bg-textDisabled/10 border-border text-textMuted", bar: "bg-textMuted" };
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

const TypingDots = () => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 8 }}
    className="flex items-end gap-2.5 mb-4"
  >
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 border border-accent/30 shrink-0">
      <Bot className="h-4 w-4 text-accent" />
    </div>
    <div className="rounded-2xl rounded-bl-sm bg-elevated border border-border px-4 py-3">
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map(i => (
          <motion.div key={i}
            className="h-1.5 w-1.5 rounded-full bg-accent/60"
            animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18 }}
          />
        ))}
      </div>
    </div>
  </motion.div>
);

// ─── Freelancer card ──────────────────────────────────────────────────────────

const FreelancerCard: React.FC<{
  match: FreelancerMatch;
  index: number;
  onProposal: (id: string) => void;
  onSchedule: (id: string) => void;
}> = ({ match, index, onProposal, onSchedule }) => {
  const mc = matchColor(match.matchScore);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      whileHover={{ y: -2, scale: 1.01 }}
      className="rounded-xl border border-border bg-surface p-4 hover:border-accent/30 hover:shadow-[0_0_20px_rgba(242,125,38,0.08)] transition-all"
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="h-11 w-11 shrink-0 rounded-full bg-accent/15 border border-accent/25 flex items-center justify-center text-sm font-bold text-accent">
          {match.avatarInitials}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-textPrimary text-sm truncate">{match.name}</p>
            <span className={cn("shrink-0 flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold", mc.badge)}>
              <Sparkles className="h-2.5 w-2.5" /> {match.matchScore}%
            </span>
          </div>
          <p className="text-[11px] text-textMuted truncate">{match.role}</p>

          {/* Match score bar */}
          <div className="mt-1.5 h-1 w-full rounded-full bg-elevated overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${match.matchScore}%` }}
              transition={{ duration: 0.6, delay: index * 0.08 + 0.2 }}
              className={cn("h-full rounded-full", mc.bar)}
            />
          </div>

          <div className="mt-1.5 flex items-center gap-2 text-[11px] text-textDisabled">
            <span className="flex items-center gap-0.5"><Star className="h-3 w-3 fill-gold text-gold" /> {match.rating}</span>
            <span>·</span>
            <span>${match.hourlyRate}/hr</span>
            <span>·</span>
            <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" /> {match.availability}</span>
            {match.location && <><span>·</span><span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{match.location}</span></>}
          </div>

          {match.matchReason && (
            <p className="mt-1 text-[11px] text-textDisabled italic truncate">{match.matchReason}</p>
          )}
        </div>
      </div>

      {/* Skills */}
      <div className="mt-2.5 flex flex-wrap gap-1">
        {match.skills.slice(0, 4).map(s => (
          <span key={s} className="rounded-md border border-border bg-elevated px-1.5 py-0.5 text-[10px] text-textSecondary">{s}</span>
        ))}
        {match.skills.length > 4 && (
          <span className="rounded-md border border-border bg-elevated px-1.5 py-0.5 text-[10px] text-textDisabled">+{match.skills.length - 4}</span>
        )}
      </div>

      {/* Actions */}
      <div className="mt-3 flex gap-2">
        <button onClick={() => onProposal(match.id)}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-accent/25 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/20 transition-all">
          <FileText className="h-3 w-3" /> Send Proposal
        </button>
        <button onClick={() => onSchedule(match.id)}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-border bg-elevated px-3 py-1.5 text-xs font-medium text-textPrimary hover:bg-border transition-all">
          <CalendarDays className="h-3 w-3" /> Schedule
        </button>
      </div>
    </motion.div>
  );
};

// ─── Timeline ─────────────────────────────────────────────────────────────────

const WorkflowTimeline: React.FC<{ steps: TimelineStep[] }> = ({ steps }) => (
  <div className="space-y-2">
    {steps.map((step, i) => (
      <div key={step.step} className="flex items-center gap-3">
        <div className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold",
          step.status === "done"    ? "border-success/40 bg-success/15 text-success" :
          step.status === "active"  ? "border-accent/40 bg-accent/15 text-accent" :
                                      "border-border bg-elevated text-textDisabled"
        )}>
          {step.status === "done" ? <Check className="h-3 w-3" /> :
           step.status === "active" ? <Loader2 className="h-3 w-3 animate-spin" /> :
           <Circle className="h-3 w-3" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn("text-xs font-medium", step.status === "done" ? "text-textPrimary" : "text-textDisabled")}>
            {step.label}
          </p>
          {step.time && (
            <p className="text-[10px] text-textDisabled">{new Date(step.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
          )}
        </div>
        {i < steps.length - 1 && (
          <div className={cn("absolute left-3 mt-6 h-4 w-px", step.status === "done" ? "bg-success/30" : "bg-border")} style={{ position: "relative", left: -2, top: 2, height: 8 }} />
        )}
      </div>
    ))}
  </div>
);

// ─── Lead response card (inside chat) ─────────────────────────────────────────

const LeadResponseCard: React.FC<{
  data: LeadResponse;
  onProposal: (id: string) => void;
  onSchedule: (id: string) => void;
  onQuickAction: (action: string) => void;
}> = ({ data, onProposal, onSchedule, onQuickAction }) => (
  <div className="w-full space-y-3 mt-2">
    {/* Analysis summary */}
    {data.analysis && (
      <div className="rounded-xl border border-accent/20 bg-accent/5 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-accent" />
          <p className="text-xs font-bold uppercase tracking-widest text-accent">AI Analysis</p>
          {data.n8nConnected && (
            <span className="flex items-center gap-1 rounded-full bg-success/10 border border-success/20 px-1.5 py-0.5 text-[9px] font-bold text-success">
              <Zap className="h-2.5 w-2.5" /> n8n
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          {data.analysis.complexity && (
            <div className="col-span-2 space-y-0.5">
              <p className="text-textDisabled">Complexity</p>
              <p className="text-textPrimary capitalize font-medium">{data.analysis.complexity}</p>
            </div>
          )}
          {data.analysis.budget && (
            <div>
              <p className="text-textDisabled">Budget</p>
              <p className="text-textPrimary font-medium">{data.analysis.budget}</p>
            </div>
          )}
          {data.analysis.timeline && (
            <div>
              <p className="text-textDisabled">Timeline</p>
              <p className="text-textPrimary font-medium">{data.analysis.timeline}</p>
            </div>
          )}
          {data.analysis.recommendedRoles?.length ? (
            <div className="col-span-2">
              <p className="text-textDisabled mb-1">Recommended Roles</p>
              <div className="flex flex-wrap gap-1">
                {data.analysis.recommendedRoles.map(r => (
                  <span key={r} className="rounded-md border border-accent/20 bg-accent/10 px-2 py-0.5 text-[10px] text-accent">{r}</span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    )}

    {/* Matched freelancers */}
    {data.matchedFreelancers && data.matchedFreelancers.length > 0 && (
      <div>
        <p className="px-1 mb-2 text-[10px] font-bold uppercase tracking-widest text-textDisabled">
          {data.matchedFreelancers.length} Matched Freelancers
        </p>
        <div className="space-y-2">
          {data.matchedFreelancers.map((m, i) => (
            <FreelancerCard key={m.id} match={m} index={i} onProposal={onProposal} onSchedule={onSchedule} />
          ))}
        </div>
      </div>
    )}

    {/* Meeting link */}
    {data.meetingLink && (
      <a href={data.meetingLink} target="_blank" rel="noreferrer"
        className="flex items-center gap-3 rounded-xl border border-success/25 bg-success/8 px-4 py-3 text-success hover:bg-success/15 transition-all group">
        <CalendarDays className="h-5 w-5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold">Discovery Call Ready</p>
          <p className="text-[10px] text-success/70 truncate">{data.meetingLink}</p>
        </div>
        <ExternalLink className="h-4 w-4 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
      </a>
    )}

    {/* Workflow timeline */}
    {data.timelineSteps && data.timelineSteps.length > 0 && (
      <div className="rounded-xl border border-border bg-elevated p-4">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-textDisabled">Workflow Progress</p>
        <WorkflowTimeline steps={data.timelineSteps} />
      </div>
    )}

    {/* Quick actions */}
    {data.quickActions && data.quickActions.length > 0 && (
      <div className="flex flex-wrap gap-1.5">
        {data.quickActions.map(a => (
          <button key={a} onClick={() => onQuickAction(a)}
            className="flex items-center gap-1 rounded-full border border-border bg-elevated px-3 py-1 text-[11px] text-textMuted hover:border-accent/40 hover:text-accent transition-all">
            <ChevronRight className="h-3 w-3" /> {a}
          </button>
        ))}
      </div>
    )}
  </div>
);

// ─── Message bubble ───────────────────────────────────────────────────────────

const MessageBubble: React.FC<{
  msg: ChatMessage;
  userInitials: string;
  onProposal: (id: string) => void;
  onSchedule: (id: string) => void;
  onQuickAction: (action: string) => void;
}> = React.memo(({ msg, userInitials, onProposal, onSchedule, onQuickAction }) => {
  const isUser   = msg.role === "user";
  const isSystem = msg.role === "system";

  if (isSystem) return (
    <div className="flex justify-center my-1">
      <span className="flex items-center gap-1.5 rounded-full border border-border bg-elevated px-3 py-1 text-[11px] text-textMuted">
        {msg.content}
      </span>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn("flex items-end gap-2.5 mb-4", isUser && "flex-row-reverse")}
    >
      {/* Avatar */}
      <div className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
        isUser ? "bg-accent/20 border border-accent/30 text-accent"
               : "bg-elevated border border-border"
      )}>
        {isUser ? userInitials : <Bot className="h-4 w-4 text-accent" />}
      </div>

      <div className={cn("flex max-w-[75%] flex-col gap-2", isUser && "items-end")}>
        {/* Text bubble */}
        <div className={cn(
          "rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser ? "bg-accent text-white rounded-br-sm shadow-[0_0_20px_rgba(242,125,38,0.3)]"
                 : "bg-elevated border border-border text-textPrimary rounded-bl-sm"
        )}>
          <p className="whitespace-pre-wrap">{msg.content}</p>
        </div>

        {/* Rich n8n response card */}
        {!isUser && msg.leadResponse && (
          <LeadResponseCard
            data={msg.leadResponse}
            onProposal={onProposal}
            onSchedule={onSchedule}
            onQuickAction={onQuickAction}
          />
        )}

        {/* Timestamp */}
        <div className="flex items-center gap-1.5 px-1">
          <span className="text-[10px] text-textDisabled">{relTime(msg.timestamp)}</span>
          {msg.status === "error" && <span className="text-[10px] text-error">⚠ failed</span>}
          {!isUser && msg.leadResponse?.n8nConnected && (
            <span className="flex items-center gap-0.5 text-[10px] text-accent"><Zap className="h-2.5 w-2.5" /> n8n</span>
          )}
        </div>
      </div>
    </motion.div>
  );
});

// ─── Project form (right panel input section) ─────────────────────────────────

const ProjectFormPanel: React.FC<{
  form: ProjectForm;
  onChange: (k: keyof ProjectForm, v: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
}> = ({ form, onChange, onAnalyze, isLoading }) => {
  const fields: { key: keyof ProjectForm; label: string; icon: React.FC<any>; type?: string; rows?: number; placeholder: string }[] = [
    { key: "title",       label: "Project Title",   icon: Briefcase,  placeholder: "e.g. Build a React SaaS App" },
    { key: "description", label: "Description",     icon: AlignLeft,  placeholder: "What do you need built? Be specific…", rows: 3 },
    { key: "budget",      label: "Budget",          icon: DollarSign, placeholder: "e.g. $5,000 or $20-40/hr" },
    { key: "timeline",    label: "Timeline",        icon: Timer,      placeholder: "e.g. 4 weeks, 3 months" },
    { key: "clientName",  label: "Your Name",       icon: User,       placeholder: "Jane Smith" },
    { key: "clientEmail", label: "Email",           icon: Mail,       type: "email", placeholder: "jane@company.com" },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-5 py-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-textDisabled">Project Brief</p>
        <h3 className="mt-0.5 font-display text-sm font-semibold text-textPrimary">Lead Analyzer</h3>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 space-y-3">
        {fields.map(f => {
          const Icon = f.icon;
          return (
            <div key={f.key} className="space-y-1">
              <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-textDisabled">
                <Icon className="h-3 w-3" /> {f.label}
              </label>
              {f.rows ? (
                <textarea
                  rows={f.rows}
                  value={form[f.key]}
                  onChange={e => onChange(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full resize-none rounded-xl border border-border bg-elevated px-3 py-2 text-xs text-textPrimary placeholder-textDisabled focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/20 transition-all"
                />
              ) : (
                <input
                  type={f.type || "text"}
                  value={form[f.key]}
                  onChange={e => onChange(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full rounded-xl border border-border bg-elevated px-3 py-2 text-xs text-textPrimary placeholder-textDisabled focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/20 transition-all"
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="border-t border-border p-4 space-y-2">
        <motion.button
          onClick={onAnalyze}
          disabled={isLoading || !form.description.trim()}
          whileTap={{ scale: 0.97 }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-bold text-white shadow-glow hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
          {isLoading ? "Analyzing with n8n…" : "Analyze with AI"}
        </motion.button>
        <p className="text-center text-[10px] text-textDisabled">
          Powered by <span className="text-accent font-semibold">n8n automation</span>
        </p>
      </div>
    </div>
  );
};

// ─── Left session sidebar ─────────────────────────────────────────────────────

const SessionSidebar: React.FC<{
  sessions: Session[];
  activeId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}> = ({ sessions, activeId, onSelect, onNew, onDelete }) => (
  <div className="flex h-full flex-col">
    <div className="flex items-center justify-between border-b border-border px-4 py-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-textDisabled">Sessions</p>
        <h2 className="mt-0.5 font-display text-sm font-semibold text-textPrimary">AI Assistant</h2>
      </div>
      <button onClick={onNew}
        className="h-7 w-7 flex items-center justify-center rounded-lg border border-accent/25 bg-accent/10 text-accent hover:bg-accent/20 transition-all">
        <MessageSquarePlus className="h-3.5 w-3.5" />
      </button>
    </div>

    <div className="flex-1 overflow-y-auto custom-scrollbar py-1">
      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <Bot className="h-7 w-7 text-textDisabled mb-2" />
          <p className="text-xs text-textDisabled">Start your first lead analysis</p>
        </div>
      ) : sessions.map(s => (
        <button key={s.id} onClick={() => onSelect(s.id)}
          className={cn(
            "group relative w-full border-l-2 px-4 py-3 text-left transition-all",
            activeId === s.id ? "border-accent bg-elevated" : "border-transparent hover:bg-elevated/50"
          )}>
          <div className="flex items-start justify-between gap-1">
            <p className={cn("truncate text-xs font-semibold", activeId === s.id ? "text-accent" : "text-textPrimary")}>
              {s.title}
            </p>
            <button onClick={e => { e.stopPropagation(); onDelete(s.id); }}
              className="hidden group-hover:flex items-center justify-center rounded p-0.5 text-textDisabled hover:text-error transition-colors">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
          <p className="mt-0.5 truncate text-[11px] text-textDisabled">{s.lastMessage}</p>
          <p className="mt-0.5 text-[10px] text-textDisabled">{relTime(s.updatedAt)}</p>
        </button>
      ))}
    </div>

    <div className="border-t border-border px-4 py-2.5">
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
        <p className="text-[11px] text-textMuted">n8n webhook live</p>
      </div>
    </div>
  </div>
);

// ─── QUICK ACTIONS ────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { label: "Find Freelancer",   icon: Users,        payload: "Find me a skilled freelancer for my project" },
  { label: "Send Proposal",     icon: FileText,     payload: "Send a proposal to the matched freelancers" },
  { label: "Schedule Meeting",  icon: CalendarDays, payload: "Schedule a discovery call with top matches" },
];

// ─── Main AIChatPage ──────────────────────────────────────────────────────────

let _sessCounter = 0;
const newSessionId = () => `session-${Date.now()}-${++_sessCounter}`;

export const AIChatPage: React.FC = () => {
  const { user } = useAuth();
  const userType   = (user?.role as "client" | "freelancer") ?? "client";
  const userInit   = initials(user?.fullName);

  // ── State ──────────────────────────────────────────────────────────────────
  const [sessions,   setSessions]   = useState<Session[]>([]);
  const [activeId,   setActiveId]   = useState("");
  const [messages,   setMessages]   = useState<ChatMessage[]>([]);
  const [isTyping,   setIsTyping]   = useState(false);
  const [rightPanel, setRightPanel] = useState<"form" | "context">("form");
  const [showRight,  setShowRight]  = useState(true);

  const [form, setForm] = useState<ProjectForm>({
    title: "", description: "", budget: "",
    timeline: "", clientName: user?.fullName ?? "", clientEmail: user?.email ?? "",
  });

  const bottomRef = useRef<HTMLDivElement>(null);

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // ── Init session ───────────────────────────────────────────────────────────
  const createSession = useCallback(() => {
    const id = newSessionId();
    const welcome: ChatMessage = {
      id: uid(), role: "assistant", timestamp: new Date(), status: "sent",
      content: userType === "client"
        ? "👋 Hi! I'm the **Crescent Black AI**.\n\nFill in your project brief on the right and click **Analyze with AI** — I'll forward it to our n8n workflow and match the best freelancers for you instantly.\n\nOr use the quick actions below to get started."
        : "👋 Welcome! I'm your AI assistant. I can help you find new projects, manage your schedule, and connect with clients.\n\nWhat would you like to do today?",
    };
    setMessages([welcome]);
    setActiveId(id);
    setSessions(prev => [{ id, title: "New Lead Analysis", lastMessage: "AI assistant ready", updatedAt: new Date() }, ...prev]);
  }, [userType]);

  useEffect(() => { createSession(); }, []); // eslint-disable-line

  // ── Lead analyze ───────────────────────────────────────────────────────────
  const analyzeProject = useCallback(async () => {
    if (!form.description.trim()) return;

    const userText = [
      form.title && `**${form.title}**`,
      form.description,
      form.budget && `Budget: ${form.budget}`,
      form.timeline && `Timeline: ${form.timeline}`,
    ].filter(Boolean).join("\n");

    const userMsg: ChatMessage = {
      id: uid(), role: "user", content: userText, timestamp: new Date(), status: "pending",
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);
    setSessions(prev => prev.map(s => s.id === activeId
      ? { ...s, title: form.title || "Lead Analysis", lastMessage: form.description.slice(0, 50), updatedAt: new Date() }
      : s));

    try {
      const res = await api.post<LeadResponse & { n8nConnected?: boolean }>("/api/lead-analyze", {
        ...form,
        sessionId: activeId,
      });

      const data = res.data;
      setMessages(prev => [
        ...prev.slice(0, -1).concat({ ...prev[prev.length - 1]!, status: "sent" }),
        {
          id: uid(),
          role: "assistant",
          content: data.reply,
          timestamp: new Date(),
          status: "sent",
          leadResponse: data,
        },
      ]);

      // Switch right panel to context view after analysis
      setRightPanel("context");
    } catch (e: any) {
      setMessages(prev => [
        ...prev,
        {
          id: uid(), role: "assistant",
          content: "⚠️ Lead analysis failed. Please check your connection and try again.",
          timestamp: new Date(), status: "error",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [form, activeId]);

  // ── Quick chat message ──────────────────────────────────────────────────────
  const sendChat = useCallback(async (text: string) => {
    const userMsg: ChatMessage = {
      id: uid(), role: "user", content: text, timestamp: new Date(), status: "pending",
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const res = await api.post<LeadResponse>("/api/chat", {
        message: text, sessionId: activeId, userType,
      });
      const data = res.data;
      setMessages(prev => [
        ...prev.slice(0, -1).concat({ ...prev[prev.length - 1]!, status: "sent" }),
        {
          id: uid(), role: "assistant",
          content: data.reply, timestamp: new Date(), status: "sent",
          leadResponse: data.matchedFreelancers ? data : undefined,
        },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        { id: uid(), role: "assistant", content: "⚠️ Failed to respond. Please try again.", timestamp: new Date(), status: "error" },
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [activeId, userType]);

  const handleProposal  = useCallback((id: string) => sendChat(`Send proposal to freelancer ${id}`), [sendChat]);
  const handleSchedule  = useCallback((id: string) => sendChat(`Schedule meeting with freelancer ${id}`), [sendChat]);
  const handleQuick     = useCallback((a: string)  => sendChat(a), [sendChat]);

  // ── Input state ─────────────────────────────────────────────────────────────
  const [chatInput, setChatInput] = useState("");
  const handleChatSend = () => { if (!chatInput.trim() || isTyping) return; sendChat(chatInput.trim()); setChatInput(""); };

  // ── Delete session ──────────────────────────────────────────────────────────
  const deleteSession = useCallback((id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeId === id) createSession();
  }, [activeId, createSession]);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="flex overflow-hidden rounded-2xl border border-border shadow-2xl bg-base"
      style={{ height: "calc(100vh - 130px)", minHeight: 560 }}
    >

      {/* ── Column 1: Session sidebar ── */}
      <div className="w-56 shrink-0 hidden lg:flex flex-col border-r border-border bg-surface/60">
        <SessionSidebar
          sessions={sessions}
          activeId={activeId}
          onSelect={setActiveId}
          onNew={createSession}
          onDelete={deleteSession}
        />
      </div>

      {/* ── Column 2: Chat panel ── */}
      <div className="flex flex-1 flex-col min-w-0">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-surface/80 px-5 py-3 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-accent/30 bg-accent/15">
              <Bot className="h-4 w-4 text-accent" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-textPrimary">Crescent AI</p>
                <span className="flex items-center gap-1 rounded-full border border-success/25 bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success">
                  <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> Online
                </span>
              </div>
              <p className="text-[11px] text-textDisabled capitalize">{userType} assistant · n8n webhook live</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Quick actions */}
            <div className="hidden sm:flex items-center gap-1">
              {QUICK_ACTIONS.map(qa => {
                const Icon = qa.icon;
                return (
                  <button key={qa.label} onClick={() => sendChat(qa.payload)} disabled={isTyping}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-elevated px-2.5 py-1.5 text-[11px] text-textMuted hover:border-accent/40 hover:text-accent disabled:opacity-40 transition-all">
                    <Icon className="h-3 w-3" /> {qa.label}
                  </button>
                );
              })}
            </div>
            <button onClick={() => setShowRight(v => !v)}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-elevated px-2.5 py-1.5 text-[11px] text-textMuted hover:text-accent hover:border-accent/40 transition-all">
              <PanelRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4">
          <AnimatePresence initial={false}>
            {messages.map(msg => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                userInitials={userInit}
                onProposal={handleProposal}
                onSchedule={handleSchedule}
                onQuickAction={handleQuick}
              />
            ))}
          </AnimatePresence>
          <AnimatePresence>{isTyping && <TypingDots />}</AnimatePresence>
          <div ref={bottomRef} />
        </div>

        {/* Chat input */}
        <div className="border-t border-border bg-surface/80 p-4 backdrop-blur-sm">
          <div className="flex items-end gap-2">
            <div className="relative flex-1 overflow-hidden rounded-xl border border-border bg-elevated focus-within:border-accent/50 focus-within:ring-1 focus-within:ring-accent/15 transition-all">
              <textarea
                rows={1}
                value={chatInput}
                disabled={isTyping}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChatSend(); } }}
                placeholder="Ask a follow-up question, or use the form on the right to analyze a project…"
                className="w-full resize-none bg-transparent px-4 py-3 text-sm text-textPrimary placeholder-textDisabled focus:outline-none disabled:opacity-50"
                style={{ maxHeight: 100 }}
              />
            </div>
            <motion.button
              onClick={handleChatSend}
              disabled={!chatInput.trim() || isTyping}
              whileTap={{ scale: 0.9 }}
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all",
                chatInput.trim() && !isTyping
                  ? "bg-accent text-white shadow-glow hover:bg-accent/90"
                  : "border border-border bg-elevated text-textDisabled cursor-not-allowed"
              )}>
              {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </motion.button>
          </div>
          <p className="mt-2 text-center text-[10px] text-textDisabled">
            Powered by <span className="text-accent font-medium">n8n</span> at angrybaby.app.n8n.cloud · <kbd className="rounded border border-border bg-elevated px-1 py-0.5 text-[9px]">Enter</kbd> to send
          </p>
        </div>
      </div>

      {/* ── Column 3: Right panel ── */}
      <AnimatePresence>
        {showRight && (
          <motion.div
            key="right"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="shrink-0 hidden xl:flex flex-col border-l border-border bg-surface/50 overflow-hidden"
            style={{ minWidth: 0 }}
          >
            {/* Panel tab switcher */}
            <div className="flex border-b border-border">
              {(["form", "context"] as const).map(tab => (
                <button key={tab} onClick={() => setRightPanel(tab)}
                  className={cn(
                    "flex-1 py-2.5 text-[11px] font-semibold capitalize transition-colors",
                    rightPanel === tab
                      ? "border-b-2 border-accent text-accent"
                      : "text-textMuted hover:text-textPrimary"
                  )}>
                  {tab === "form" ? "Project Brief" : "Analysis"}
                </button>
              ))}
            </div>

            {rightPanel === "form" ? (
              <ProjectFormPanel
                form={form}
                onChange={(k, v) => setForm(prev => ({ ...prev, [k]: v }))}
                onAnalyze={analyzeProject}
                isLoading={isTyping}
              />
            ) : (
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-textDisabled">Latest Results</p>
                {/* Pull last AI response with lead data from messages */}
                {(() => {
                  const last = [...messages].reverse().find(m => m.leadResponse);
                  if (!last?.leadResponse) return (
                    <div className="flex flex-col items-center py-10 text-center">
                      <Sparkles className="h-7 w-7 text-textDisabled mb-2" />
                      <p className="text-xs text-textDisabled">No analysis yet.</p>
                      <p className="text-[11px] text-textDisabled mt-0.5">Fill the brief and click Analyze.</p>
                    </div>
                  );
                  return (
                    <LeadResponseCard
                      data={last.leadResponse}
                      onProposal={handleProposal}
                      onSchedule={handleSchedule}
                      onQuickAction={handleQuick}
                    />
                  );
                })()}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
