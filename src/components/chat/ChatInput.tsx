/**
 * ChatInput.tsx — Crescent Black Chat Input Bar
 *
 * Features:
 *  - Auto-resize textarea (1–5 lines)
 *  - Character counter with warning at 4 500+
 *  - Send on Enter, new-line on Shift+Enter
 *  - Ctrl/Cmd+K global focus shortcut
 *  - Quick-actions dropdown
 *  - Validation (empty / too long)
 *  - Loading spinner on send button
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight, Paperclip, ChevronDown, Loader2,
  Users, FileText, CalendarDays, FolderOpen,
  Check, MessageSquareDot,
} from "lucide-react";
import { cn } from "../../lib/utils";
import type { UserRole } from "../../services/chatService";

// ─── Quick action definitions ─────────────────────────────────────────────────

const CLIENT_ACTIONS = [
  { label: "Find Freelancer",   icon: Users,           payload: "Find me a skilled freelancer for my project" },
  { label: "Send Proposal",     icon: FileText,        payload: "Help me send a proposal to a freelancer" },
  { label: "Schedule Meeting",  icon: CalendarDays,    payload: "Schedule a meeting with a freelancer" },
  { label: "View Projects",     icon: FolderOpen,      payload: "Show my active projects" },
];

const FREELANCER_ACTIONS = [
  { label: "Browse Jobs",       icon: FolderOpen,      payload: "Show available projects I can apply to" },
  { label: "Accept Job",        icon: Check,           payload: "Accept the latest job offer" },
  { label: "My Schedule",       icon: CalendarDays,    payload: "Show my upcoming meetings" },
  { label: "Message Client",    icon: MessageSquareDot, payload: "Message my current client" },
];

const MAX_CHARS = 5000;
const WARN_AT   = 4500;

// ─── Props ────────────────────────────────────────────────────────────────────

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  isLoading:     boolean;
  error?:        string | null;
  userRole:      UserRole;
}

// ─── ChatInput ────────────────────────────────────────────────────────────────

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  error,
  userRole,
}) => {
  const [value,        setValue]        = useState("");
  const [touched,      setTouched]      = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const textareaRef  = useRef<HTMLTextAreaElement>(null);
  const dropdownRef  = useRef<HTMLDivElement>(null);

  const quickActions = userRole === "client" ? CLIENT_ACTIONS : FREELANCER_ACTIONS;
  const charCount    = value.length;
  const overLimit    = charCount > MAX_CHARS;
  const nearLimit    = charCount >= WARN_AT && !overLimit;

  // ── Auto-resize ──────────────────────────────────────────────────────────────
  const resize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    // 5-line cap at roughly 20px per line + padding
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  }, []);

  useEffect(resize, [value, resize]);

  // ── Ctrl/Cmd+K global focus ───────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        textareaRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // ── Close dropdown on outside click ──────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Send ─────────────────────────────────────────────────────────────────────
  const handleSend = useCallback(() => {
    setTouched(true);
    if (!value.trim() || isLoading || overLimit) return;
    onSendMessage(value.trim());
    setValue("");
    setTouched(false);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }, [value, isLoading, overLimit, onSendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (payload: string) => {
    setValue(payload);
    setShowDropdown(false);
    textareaRef.current?.focus();
  };

  // ── Validation messages ───────────────────────────────────────────────────────
  const showEmptyError  = touched && !value.trim() && !isLoading;
  const showOverLimit   = overLimit;

  return (
    <div className="flex flex-col gap-2 border-t border-border bg-surface/80 p-4 backdrop-blur-sm">

      {/* ── Error toast ── */}
      <AnimatePresence>
        {(error || showEmptyError || showOverLimit) && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y:  0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-[11px] text-error px-1"
          >
            {showOverLimit
              ? `Message exceeds ${MAX_CHARS.toLocaleString()} characters`
              : showEmptyError
              ? "Please enter a message"
              : error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* ── Main row ── */}
      <div className="flex items-end gap-2">

        {/* Quick-actions dropdown button */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowDropdown((v) => !v)}
            className="flex h-10 items-center gap-1 rounded-xl border border-border bg-elevated px-2.5 py-2 text-xs text-textMuted transition-all hover:border-accent/30 hover:text-accent"
            title="Quick actions"
          >
            <span className="hidden sm:inline">Actions</span>
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showDropdown && "rotate-180")} />
          </button>

          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-12 left-0 z-50 w-52 overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
              >
                {quickActions.map((qa) => {
                  const Icon = qa.icon;
                  return (
                    <button
                      key={qa.label}
                      onClick={() => handleQuickAction(qa.payload)}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-textMuted transition-colors hover:bg-elevated hover:text-textPrimary"
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0 text-accent" />
                      {qa.label}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Textarea wrapper */}
        <div
          className={cn(
            "relative flex-1 overflow-hidden rounded-xl border bg-elevated transition-all focus-within:ring-1",
            showEmptyError || showOverLimit
              ? "border-error focus-within:border-error focus-within:ring-error/20"
              : "border-border focus-within:border-accent/50 focus-within:ring-accent/15"
          )}
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            disabled={isLoading}
            onChange={(e) => { setValue(e.target.value); resize(); }}
            onKeyDown={handleKeyDown}
            onBlur={() => setTouched(true)}
            placeholder={
              userRole === "client"
                ? "Describe your project, ask for freelancers, or schedule a meeting… (Enter to send)"
                : "Ask about available projects, check schedule… (Enter to send)"
            }
            className="w-full resize-none bg-transparent px-4 py-3 pr-20 text-sm text-textPrimary placeholder-textDisabled focus:outline-none disabled:opacity-50"
            style={{ maxHeight: 140 }}
          />

          {/* Character counter */}
          <span
            className={cn(
              "absolute bottom-2.5 right-10 text-[10px] tabular-nums transition-colors",
              nearLimit  && "text-yellow-400",
              overLimit  && "text-error",
              !nearLimit && !overLimit && "text-textDisabled"
            )}
          >
            {charCount > 0 || touched
              ? `${charCount.toLocaleString()} / ${MAX_CHARS.toLocaleString()}`
              : null}
          </span>

          {/* Attach button */}
          <button
            type="button"
            className="absolute bottom-2.5 right-2.5 rounded-lg p-1 text-textDisabled transition-colors hover:text-textMuted"
            title="Attach file (coming soon)"
          >
            <Paperclip className="h-4 w-4" />
          </button>
        </div>

        {/* Send button */}
        <motion.button
          type="button"
          onClick={handleSend}
          disabled={!value.trim() || isLoading || overLimit}
          whileTap={{ scale: 0.9 }}
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all",
            value.trim() && !isLoading && !overLimit
              ? "bg-accent text-white shadow-glow hover:bg-accent/90"
              : "cursor-not-allowed border border-border bg-elevated text-textDisabled"
          )}
          title="Send message (Enter)"
        >
          {isLoading
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <ArrowRight className="h-4 w-4" />}
        </motion.button>
      </div>

      {/* ── Hint ── */}
      <p className="text-center text-[10px] text-textDisabled">
        AI assistant · Powered by n8n ·{" "}
        <kbd className="rounded border border-border bg-elevated px-1 py-0.5 text-[9px] text-textMuted">Shift+Enter</kbd>{" "}
        new line &nbsp;·&nbsp;{" "}
        <kbd className="rounded border border-border bg-elevated px-1 py-0.5 text-[9px] text-textMuted">⌘K</kbd>{" "}
        focus
      </p>
    </div>
  );
};
