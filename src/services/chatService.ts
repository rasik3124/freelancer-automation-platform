/**
 * chatService.ts — Crescent Black Chat API Service
 *
 * Typed wrappers for all chat-related backend endpoints.
 * Uses the shared axios instance from api.ts (auto-attaches JWT).
 *
 * Endpoints:
 *   POST   /api/chat
 *   GET    /api/chat/sessions
 *   GET    /api/chat/sessions/:id
 *   DELETE /api/chat/sessions/:id
 *   POST   /api/chat/actions
 */

import api from "./api";

// ─── Shared types ─────────────────────────────────────────────────────────────

export type UserRole = "client" | "freelancer";

export interface FreelancerMatch {
  id:             string;
  name:           string;
  role:           string;
  skills:         string[];
  matchScore:     number;
  rating:         number;
  hourlyRate:     number;
  availability:   string;
  avatarInitials: string;
  location?:      string;
}

export interface ProjectContext {
  id?:       string;
  title?:    string;
  budget?:   string;
  status?:   string;
  deadline?: string;
}

export interface ChatResponse {
  reply:        string;
  sessionId:    string;
  intent?:      string;
  matches?:     FreelancerMatch[];
  meetingLink?: string;
  projectInfo?: ProjectContext;
  quickActions?: string[];
  status?:      string;
}

export interface SessionSummary {
  sessionId:    string;
  userRole:     UserRole;
  lastMessage:  string;
  createdAt:    string;
  updatedAt:    string;
  messageCount: number;
}

export interface SessionMessage {
  role:    "user" | "assistant";
  content: string;
}

export interface SessionDetail {
  sessionId: string;
  userRole:  UserRole;
  messages:  SessionMessage[];
  context:   Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export type ActionType = "send_proposal" | "schedule_meeting" | "accept_job";

export interface ActionParams {
  freelancerId?: string;
  projectId?:    string;
  meetingTime?:  string;
  [key: string]: unknown;
}

export interface ActionResult {
  success:      boolean;
  actionResult: {
    proposalId?:  string;
    meetingLink?: string;
    meetingId?:   string;
    confirmed?:   boolean;
    n8nStatus?:   string;
    [key: string]: unknown;
  };
  nextMessage:  string;
}

// ─── callChat ─────────────────────────────────────────────────────────────────

/**
 * POST /api/chat
 * Send a user message and receive an AI reply with optional match/meeting data.
 */
export async function callChat(
  message:   string,
  sessionId: string,
  userRole:  UserRole
): Promise<ChatResponse> {
  const { data } = await api.post<ChatResponse>("/api/chat", {
    message,
    sessionId,
    userType: userRole,    // server param is `userType`
  });
  return data;
}

// ─── loadSessions ─────────────────────────────────────────────────────────────

/**
 * GET /api/chat/sessions?limit=&offset=
 * List all sessions for the authenticated user, newest first.
 */
export async function loadSessions(
  limit  = 20,
  offset = 0
): Promise<SessionSummary[]> {
  const { data } = await api.get<{ data: SessionSummary[] }>(
    "/api/chat/sessions",
    { params: { limit, offset } }
  );
  return data.data;
}

// ─── loadMessages ─────────────────────────────────────────────────────────────

/**
 * GET /api/chat/sessions/:sessionId
 * Load full session with all messages.
 */
export async function loadMessages(sessionId: string): Promise<SessionDetail> {
  const { data } = await api.get<{ data: SessionDetail }>(
    `/api/chat/sessions/${sessionId}`
  );
  return data.data;
}

// ─── deleteSession ────────────────────────────────────────────────────────────

/**
 * DELETE /api/chat/sessions/:sessionId
 */
export async function deleteSession(sessionId: string): Promise<void> {
  await api.delete(`/api/chat/sessions/${sessionId}`);
}

// ─── triggerAction ────────────────────────────────────────────────────────────

/**
 * POST /api/chat/actions
 * Execute a structured action in the context of a session.
 */
export async function triggerAction(
  sessionId: string,
  action:    ActionType,
  params:    ActionParams = {}
): Promise<ActionResult> {
  const { data } = await api.post<ActionResult>("/api/chat/actions", {
    sessionId,
    action,
    params,
  });
  return data;
}
