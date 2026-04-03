/**
 * useMessages.ts — Crescent Black Real-time Messages Hook
 *
 * Manages message history for a single conversation:
 *   - Fetch initial page from REST API
 *   - Infinite scroll (load older messages on scroll-up)
 *   - Receive new messages via socket event
 *   - Mark messages read via socket + REST
 *   - Optimistic send with rollback on error
 */

import { useCallback, useEffect, useRef, useState } from "react";
import api from "../services/api";
import type { TypedSocket, ServerMessage } from "./useSocket";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Message {
  id:              string;
  conversationId:  string;
  senderId:        string;
  senderType:      "client" | "freelancer";
  senderName:      string;
  senderAvatarInitials: string;
  text:            string;
  createdAt:       string;
  read:            boolean;
  /** UI-only states */
  status?:         "pending" | "sent" | "error";
  isOptimistic?:   boolean;
}

interface UseMessagesReturn {
  messages:    Message[];
  isLoading:   boolean;
  isLoadingMore: boolean;
  hasMore:     boolean;
  error:       string | null;
  loadMore:    () => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  markRead:    (messageId: string) => void;
  resetMessages: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 30;

// ─── Helper: normalise api response ───────────────────────────────────────────

function normaliseMessage(m: Partial<Message>): Message {
  return {
    id:                   m.id ?? `msg-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
    conversationId:       m.conversationId ?? "",
    senderId:             m.senderId ?? "",
    senderType:           m.senderType ?? "client",
    senderName:           m.senderName ?? "Unknown",
    senderAvatarInitials: m.senderAvatarInitials ?? "?",
    text:                 m.text ?? "",
    createdAt:            m.createdAt ?? new Date().toISOString(),
    read:                 m.read ?? false,
    status:               "sent",
  };
}

// ─── useMessages ─────────────────────────────────────────────────────────────

export function useMessages(
  conversationId: string | null,
  userId: string | null,
  socket: TypedSocket | null
): UseMessagesReturn {
  const [messages,      setMessages]      = useState<Message[]>([]);
  const [isLoading,     setIsLoading]     = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore,       setHasMore]       = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [offset,        setOffset]        = useState(0);

  const offsetRef       = useRef(offset);
  const messagesRef     = useRef(messages);
  const conversationRef = useRef(conversationId);

  useEffect(() => { offsetRef.current       = offset;        }, [offset]);
  useEffect(() => { messagesRef.current     = messages;      }, [messages]);
  useEffect(() => { conversationRef.current = conversationId;}, [conversationId]);

  // ── Fetch a page of messages ─────────────────────────────────────────────

  const fetchPage = useCallback(async (convId: string, pageOffset: number, prepend: boolean) => {
    try {
      const res = await api.get<{ data: Message[]; total: number }>(
        `/api/conversations/${convId}/messages`,
        { params: { limit: PAGE_SIZE, offset: pageOffset } }
      );
      const raw  = (res.data.data ?? (res.data as unknown as Message[])) as Message[];
      const page = raw.map(normaliseMessage);
      const total = (res.data as unknown as { total?: number }).total ?? page.length;

      setMessages(prev => prepend ? [...page, ...prev] : page);
      setOffset(pageOffset + page.length);
      setHasMore(pageOffset + page.length < total);
      setError(null);
      return page;
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } }; message?: string })
        ?.response?.data?.error ?? (e as Error)?.message ?? "Could not load messages";
      setError(msg);
      return [];
    }
  }, []);

  // ── Load initial messages on conversationId change ───────────────────────

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setOffset(0);
      setHasMore(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setIsLoading(true);
      setOffset(0);
      setMessages([]);
      if (!cancelled) await fetchPage(conversationId, 0, false);
      if (!cancelled) setIsLoading(false);
    })();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // ── Load more (older) messages — called on scroll-to-top ────────────────

  const loadMore = useCallback(async () => {
    if (!conversationId || isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    await fetchPage(conversationId, offsetRef.current, true);
    setIsLoadingMore(false);
  }, [conversationId, isLoadingMore, hasMore, fetchPage]);

  // ── Socket: receive new message ──────────────────────────────────────────

  useEffect(() => {
    if (!socket || !conversationId) return;

    const handler = (data: ServerMessage) => {
      if (!conversationRef.current) return;

      const incomingConvId = (data as ServerMessage & { conversationId?: string }).conversationId;
      if (incomingConvId && incomingConvId !== conversationRef.current) return;

      const msg: Message = {
        id:                   data.messageId,
        conversationId:       conversationRef.current,
        senderId:             data.senderId,
        senderType:           data.senderId === userId ? "client" : "freelancer",
        senderName:           data.senderName ?? "Unknown",
        senderAvatarInitials: (data.senderName ?? "?")[0].toUpperCase(),
        text:                 data.text,
        createdAt:            data.timestamp,
        read:                 false,
        status:               "sent",
      };

      setMessages(prev => {
        // Avoid duplicates
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });

      // Auto-mark read if window is focused
      if (document.visibilityState === "visible") {
        socket.emit("message:read", { conversationId: conversationRef.current!, messageId: msg.id });
        api.patch(`/api/conversations/${conversationRef.current}/read`).catch(() => {});
      }
    };

    socket.on("message:receive", handler);
    return () => { socket.off("message:receive", handler); };
  }, [socket, conversationId, userId]);

  // ── Socket: read receipt ─────────────────────────────────────────────────

  useEffect(() => {
    if (!socket) return;

    const handler = ({ messageId }: { messageId: string; readBy: string; readAt: string }) => {
      setMessages(prev =>
        prev.map(m => m.id === messageId ? { ...m, read: true } : m)
      );
    };

    socket.on("message:read", handler);
    return () => { socket.off("message:read", handler); };
  }, [socket]);

  // ── Socket: listen for own sent confirmation ─────────────────────────────

  useEffect(() => {
    if (!socket) return;

    const handler = ({ tempId, messageId, timestamp }: { tempId: string | null; messageId: string; timestamp: string }) => {
      if (!tempId) return;
      setMessages(prev =>
        prev.map(m =>
          m.id === tempId
            ? { ...m, id: messageId, createdAt: timestamp, status: "sent", isOptimistic: false }
            : m
        )
      );
    };

    socket.on("message:sent", handler);
    return () => { socket.off("message:sent", handler); };
  }, [socket]);

  // ── sendMessage — optimistic + real ──────────────────────────────────────

  const sendMessage = useCallback(async (text: string) => {
    if (!conversationId || !text.trim()) return;

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;

    // Optimistic message
    const optimistic: Message = {
      id:                   tempId,
      conversationId,
      senderId:             userId ?? "me",
      senderType:           "client",
      senderName:           "You",
      senderAvatarInitials: "ME",
      text:                 text.trim(),
      createdAt:            new Date().toISOString(),
      read:                 true,
      status:               "pending",
      isOptimistic:         true,
    };

    setMessages(prev => [...prev, optimistic]);

    // Try socket first (fastest path)
    if (socket?.connected) {
      socket.emit("message:send", { conversationId, text: text.trim(), tempId });
      return; // server will emit "message:sent" to confirm, we'll update there
    }

    // Fallback: REST API
    try {
      const res = await api.post<{ data: Message }>(
        `/api/conversations/${conversationId}/messages`,
        { text: text.trim() }
      );
      const saved = normaliseMessage(res.data.data);
      setMessages(prev =>
        prev.map(m => m.id === tempId ? { ...saved, status: "sent" } : m)
      );
    } catch {
      setMessages(prev =>
        prev.map(m => m.id === tempId ? { ...m, status: "error" } : m)
      );
    }
  }, [conversationId, userId, socket]);

  // ── markRead ─────────────────────────────────────────────────────────────

  const markRead = useCallback((messageId: string) => {
    if (!conversationId) return;
    socket?.emit("message:read", { conversationId, messageId });
    setMessages(prev =>
      prev.map(m => m.id === messageId ? { ...m, read: true } : m)
    );
  }, [conversationId, socket]);

  // ── resetMessages ─────────────────────────────────────────────────────────

  const resetMessages = useCallback(() => {
    setMessages([]);
    setOffset(0);
    setHasMore(false);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    sendMessage,
    markRead,
    resetMessages,
  };
}
