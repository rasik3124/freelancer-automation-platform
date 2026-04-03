/**
 * useChat.ts — Crescent Black Chat State Hook
 *
 * Manages the entire chat lifecycle:
 *   - In-memory message list
 *   - Session creation / switching
 *   - API call orchestration (sendMessage, loadSessions, triggerAction)
 *   - Loading / thinking / error states
 */

import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";

import {
  callChat,
  loadSessions,
  loadMessages,
  triggerAction,
  deleteSession,
  type FreelancerMatch,
  type ProjectContext,
  type SessionSummary,
  type ActionType,
  type ActionParams,
  type UserRole,
} from "../services/chatService";

// ─── Local message type (richer than the server SessionMessage) ───────────────

export interface ChatMessage {
  id:           string;
  role:         "user" | "assistant" | "system";
  content:      string;
  timestamp:    Date;
  intent?:      string;
  matches?:     FreelancerMatch[];
  meetingLink?: string;
  projectInfo?: ProjectContext;
  quickActions?: string[];
  status?:      "pending" | "sent" | "n8n_triggered" | "error";
}

export interface UseChatReturn {
  // State
  messages:      ChatMessage[];
  sessions:      SessionSummary[];
  matches:       FreelancerMatch[];
  projectInfo:   ProjectContext | undefined;
  isLoading:     boolean;
  isAIThinking:  boolean;
  error:         string | null;

  // Actions
  sendMessage:    (text: string, sessionId: string, userRole: UserRole) => Promise<string | null>;
  loadUserSessions: () => Promise<void>;
  switchSession:  (sessionId: string) => Promise<void>;
  removeSession:  (sessionId: string) => Promise<void>;
  dispatchAction: (action: ActionType, sessionId: string, params?: ActionParams) => Promise<string | null>;
  clearError:     () => void;
  setMessages:    Dispatch<SetStateAction<ChatMessage[]>>;

}

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _msgCounter = 0;
function makeMsgId() {
  return `msg-${Date.now()}-${++_msgCounter}`;
}

// ─── useChat ─────────────────────────────────────────────────────────────────

export function useChat(): UseChatReturn {
  const [messages,    setMessages]    = useState<ChatMessage[]>([]);
  const [sessions,    setSessions]    = useState<SessionSummary[]>([]);
  const [matches,     setMatches]     = useState<FreelancerMatch[]>([]);
  const [projectInfo, setProjectInfo] = useState<ProjectContext | undefined>();
  const [isLoading,   setIsLoading]   = useState(false);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  // Keep a stable ref to prevent stale closures in callbacks
  const messagesRef = useRef(messages);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // ── sendMessage ────────────────────────────────────────────────────────────

  const sendMessage = useCallback(async (
    text:      string,
    sessionId: string,
    userRole:  UserRole
  ): Promise<string | null> => {
    if (!text.trim()) return null;

    const userMsgId = makeMsgId();

    // 1. Optimistically append user message
    const userMsg: ChatMessage = {
      id:        userMsgId,
      role:      "user",
      content:   text.trim(),
      timestamp: new Date(),
      status:    "pending",
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsAIThinking(true);
    setError(null);

    try {
      // 2. POST /api/chat
      const res = await callChat(text.trim(), sessionId, userRole);

      // 3. Mark user message as sent
      setMessages((prev) =>
        prev.map((m) => m.id === userMsgId ? { ...m, status: "sent" } : m)
      );

      // 4. Update right-panel state
      if (res.matches && res.matches.length > 0) setMatches(res.matches);
      if (res.projectInfo) setProjectInfo(res.projectInfo);

      // 5. Append AI reply
      const aiMsgId = makeMsgId();
      const aiMsg: ChatMessage = {
        id:          aiMsgId,
        role:        "assistant",
        content:     res.reply,
        timestamp:   new Date(),
        intent:      res.intent,
        matches:     res.matches,
        meetingLink: res.meetingLink,
        projectInfo: res.projectInfo,
        quickActions: res.quickActions,
        status:      "n8n_triggered",
      };
      setMessages((prev) => [...prev, aiMsg]);

      return aiMsgId;
    } catch (err: any) {
      const msg = err?.response?.data?.error ?? err?.message ?? "Failed to send message";
      setError(msg);

      // Mark user message as errored
      setMessages((prev) =>
        prev.map((m) => m.id === userMsgId ? { ...m, status: "error" } : m)
      );

      // Append error system message
      setMessages((prev) => [
        ...prev,
        {
          id:        makeMsgId(),
          role:      "system",
          content:   "⚠️ Message failed. Please try again.",
          timestamp: new Date(),
          status:    "error",
        },
      ]);

      return null;
    } finally {
      setIsAIThinking(false);
    }
  }, []);

  // ── loadUserSessions ───────────────────────────────────────────────────────

  const loadUserSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await loadSessions();
      setSessions(data);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Failed to load sessions");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── switchSession ──────────────────────────────────────────────────────────

  const switchSession = useCallback(async (sessionId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const detail = await loadMessages(sessionId);
      const hydrated: ChatMessage[] = detail.messages.map((m, i) => ({
        id:        `hist-${i}-${m.role}`,
        role:      m.role,
        content:   m.content,
        timestamp: new Date(detail.createdAt), // approximate
        status:    "sent" as const,
      }));
      setMessages(hydrated);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Failed to load session");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── removeSession ──────────────────────────────────────────────────────────

  const removeSession = useCallback(async (sessionId: string) => {
    try {
      await deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Failed to delete session");
    }
  }, []);

  // ── dispatchAction ─────────────────────────────────────────────────────────

  const dispatchAction = useCallback(async (
    action:    ActionType,
    sessionId: string,
    params:    ActionParams = {}
  ): Promise<string | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await triggerAction(sessionId, action, params);

      // Append the AI follow-up to the chat
      const followUpId = makeMsgId();
      setMessages((prev) => [
        ...prev,
        {
          id:        followUpId,
          role:      "assistant",
          content:   res.nextMessage,
          timestamp: new Date(),
          status:    "n8n_triggered",
          meetingLink: (res.actionResult as any)?.meetingLink,
        },
      ]);

      return followUpId;
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Action failed");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── clearError ─────────────────────────────────────────────────────────────

  const clearError = useCallback(() => setError(null), []);

  return {
    messages,
    sessions,
    matches,
    projectInfo,
    isLoading,
    isAIThinking,
    error,
    sendMessage,
    loadUserSessions,
    switchSession,
    removeSession,
    dispatchAction,
    clearError,
    setMessages,
  };
}
