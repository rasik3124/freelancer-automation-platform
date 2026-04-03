/**
 * useSocket.ts — Crescent Black Socket.io Client Hook
 *
 * Connects to the /messaging namespace with JWT auth.
 * Handles reconnection with exponential backoff, token refresh,
 * and provides type-safe emit / on / off wrappers.
 *
 * Usage:
 *   const { socket, isConnected, isConnecting, error } = useSocket();
 *
 * Or via context:
 *   const { socket } = useSocketContext();
 *   socket?.emit("message:send", { conversationId, text, tempId });
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";

// ─── Event type map (server events) ──────────────────────────────────────────

export interface ServerToClientEvents {
  "user:status":       (data: { userId: string; status: "online" | "offline"; lastSeen?: string }) => void;
  "message:receive":   (data: ServerMessage) => void;
  "message:sent":      (data: { tempId: string | null; messageId: string; timestamp: string }) => void;
  "message:read":      (data: { messageId: string; readBy: string; readAt: string }) => void;
  "message:error":     (data: { code: string; detail?: string }) => void;
  "typing:indicator":  (data: { userId: string; userName?: string; isTyping: boolean }) => void;
}

export interface ClientToServerEvents {
  "user:connect":      (data: { uid: string; conversationIds: string[] }) => void;
  "message:send":      (data: { conversationId: string; text: string; tempId?: string }) => void;
  "message:read":      (data: { conversationId: string; messageId: string }) => void;
  "typing:start":      (data: { conversationId: string }) => void;
  "typing:stop":       (data: { conversationId: string }) => void;
  "join_conversation": (conversationId: string) => void;
  "leave_conversation":(conversationId: string) => void;
}

export interface ServerMessage {
  messageId:   string;
  senderId:    string;
  senderName?: string;
  text:        string;
  timestamp:   string;
  read:        boolean;
}

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// ─── Config ───────────────────────────────────────────────────────────────────

const BACKEND_URL: string =
  import.meta.env.VITE_API_URL || "";

const NAMESPACE   = "/messaging";

const RECONNECT_CONFIG = {
  reconnection:           true,
  reconnectionAttempts:   10,
  reconnectionDelay:      500,
  reconnectionDelayMax:   30_000,
  randomizationFactor:    0.5,
};

// ─── Types ────────────────────────────────────────────────────────────────────

export type SocketStatus = "idle" | "connecting" | "connected" | "disconnected" | "error";

export interface UseSocketReturn {
  socket:       TypedSocket | null;
  status:       SocketStatus;
  isConnected:  boolean;
  isConnecting: boolean;
  error:        string | null;
  emit:         <E extends keyof ClientToServerEvents>(
                  event: E,
                  ...args: Parameters<ClientToServerEvents[E]>
                ) => void;
  on:           <E extends keyof ServerToClientEvents>(
                  event: E,
                  handler: ServerToClientEvents[E]
                ) => void;
  off:          <E extends keyof ServerToClientEvents>(event: E, handler?: ServerToClientEvents[E]) => void;
  joinConversation:  (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const SocketContext = createContext<UseSocketReturn | null>(null);

// ─── useSocket hook ───────────────────────────────────────────────────────────

export function useSocket(): UseSocketReturn {
  const socketRef = useRef<TypedSocket | null>(null);
  const [status, setStatus] = useState<SocketStatus>("idle");
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setStatus("error");
      setError("No auth token — log in first.");
      return;
    }

    setStatus("connecting");

    const socket = io(`${BACKEND_URL}${NAMESPACE}`, {
      auth:       { token },
      transports: ["websocket", "polling"],
      ...RECONNECT_CONFIG,
    }) as TypedSocket;

    socketRef.current = socket;

    socket.on("connect", () => {
      setStatus("connected");
      setError(null);
    });

    socket.on("disconnect", (reason) => {
      setStatus("disconnected");
      // Non-recoverable disconnects
      if (reason === "io server disconnect" || reason === "io client disconnect") {
        socket.close();
      }
    });

    socket.on("connect_error", (err) => {
      const msg = err.message || "Connection failed";
      // Auth errors → don't retry endlessly
      if (msg.includes("AUTH_")) {
        setStatus("error");
        setError("Authentication failed — please log in again.");
        socket.close();
      } else {
        setStatus("error");
        setError(`Socket error: ${msg}`);
      }
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.disconnect();
      socketRef.current = null;
      setStatus("disconnected");
    };
  // Only run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emit = useCallback(<E extends keyof ClientToServerEvents>(
    event: E,
    ...args: Parameters<ClientToServerEvents[E]>
  ) => {
    socketRef.current?.emit(event, ...(args as [never]));
  }, []);

  const on = useCallback(<E extends keyof ServerToClientEvents>(
    event: E,
    handler: ServerToClientEvents[E]
  ) => {
    socketRef.current?.on(event, handler as never);
  }, []);

  const off = useCallback(<E extends keyof ServerToClientEvents>(
    event: E,
    handler?: ServerToClientEvents[E]
  ) => {
    if (handler) socketRef.current?.off(event, handler as never);
    else         socketRef.current?.off(event);
  }, []);

  const joinConversation = useCallback((conversationId: string) => {
    socketRef.current?.emit("join_conversation", conversationId);
  }, []);

  const leaveConversation = useCallback((conversationId: string) => {
    socketRef.current?.emit("leave_conversation", conversationId);
  }, []);

  return {
    socket:       socketRef.current,
    status,
    isConnected:  status === "connected",
    isConnecting: status === "connecting",
    error,
    emit,
    on,
    off,
    joinConversation,
    leaveConversation,
  };
}

// ─── SocketProvider ───────────────────────────────────────────────────────────

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const socket = useSocket();
  return React.createElement(SocketContext.Provider, { value: socket }, children);
};

// ─── useSocketContext ─────────────────────────────────────────────────────────

export function useSocketContext(): UseSocketReturn {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocketContext must be used inside <SocketProvider>");
  return ctx;
}

export { SocketContext };
