/**
 * useConversations.ts — Crescent Black Conversations Hook
 *
 * Fetches the user's conversation list and keeps it live via socket events.
 * The socket pushes "message:receive" which we intercept to update
 * last-message + unread count without a full refetch.
 */

import { useCallback, useEffect, useState } from "react";
import api from "../services/api";
import type { TypedSocket, ServerMessage } from "./useSocket";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Conversation {
  id:                      string;
  clientId:                string;
  freelancerId:            string;
  freelancerName:          string;
  freelancerAvatarInitials:string;
  /** Optional — not all endpoints return this */
  clientName?:             string;
  clientAvatarInitials?:   string;
  topic:                   string;
  lastMessage:             string;
  lastMessageAt:           string;
  unreadCount:             number;
  status?:                  "active" | "archived" | "pending";
  createdAt?:              string;
  /** Real-time overlay — socket-managed */
  isOnline?:               boolean;
}

interface UseConversationsReturn {
  conversations:    Conversation[];
  isLoading:        boolean;
  error:            string | null;
  refetch:          () => Promise<void>;
  /** Called after successfully sending — bumps last message locally */
  bumpLastMessage:  (convId: string, text: string) => void;
  /** Called when user opens a conversation — clears unread locally */
  clearUnread:      (convId: string) => void;
  /** Merge a newly created conversation to the top of the list */
  prependConversation: (conv: Conversation) => void;
  /** Update online status of a participant */
  setParticipantOnline: (userId: string, isOnline: boolean) => void;
}

// ─── useConversations ─────────────────────────────────────────────────────────

export function useConversations(
  socket: TypedSocket | null,
  /** Id of the currently open conversation (skip unread bump for it) */
  activeConversationId: string | null = null
): UseConversationsReturn {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading,     setIsLoading]     = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  // ── Fetch ────────────────────────────────────────────────────────────────

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<{ data: Conversation[] }>("/api/conversations");
      const list = res.data.data ?? (res.data as unknown as Conversation[]);
      setConversations(Array.isArray(list) ? list : []);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } }; message?: string })
        ?.response?.data?.error ?? (e as Error)?.message ?? "Failed to load conversations";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => { refetch(); }, [refetch]);

  // ── Socket: incoming message → bump last message + unread ─────────────

  useEffect(() => {
    if (!socket) return;

    const handler = (data: ServerMessage & { conversationId?: string }) => {
      const convId = data.conversationId;
      if (!convId) return;

      setConversations(prev => {
        const idx = prev.findIndex(c => c.id === convId);
        if (idx === -1) {
          // Unknown conversation — trigger a refetch to get the new one
          setTimeout(refetch, 500);
          return prev;
        }
        const updated = { ...prev[idx] };
        updated.lastMessage   = data.text.slice(0, 80);
        updated.lastMessageAt = data.timestamp;

        // Only bump unread if this conversation is not the active one
        if (convId !== activeConversationId) {
          updated.unreadCount = (updated.unreadCount ?? 0) + 1;
        }

        // Move to top
        const next = [...prev];
        next.splice(idx, 1);
        return [updated, ...next];
      });
    };

    socket.on("message:receive", handler);
    return () => { socket.off("message:receive", handler); };
  }, [socket, activeConversationId, refetch]);

  // ── Socket: online/offline status ────────────────────────────────────────

  useEffect(() => {
    if (!socket) return;

    const handler = ({ userId, status }: { userId: string; status: "online" | "offline" }) => {
      setConversations(prev =>
        prev.map(c => {
          if (c.freelancerId === userId || c.clientId === userId) {
            return { ...c, isOnline: status === "online" };
          }
          return c;
        })
      );
    };

    socket.on("user:status", handler);
    return () => { socket.off("user:status", handler); };
  }, [socket]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const bumpLastMessage = useCallback((convId: string, text: string) => {
    setConversations(prev => {
      const idx = prev.findIndex(c => c.id === convId);
      if (idx === -1) return prev;
      const updated = {
        ...prev[idx],
        lastMessage:   text.slice(0, 80),
        lastMessageAt: new Date().toISOString(),
      };
      const next = [...prev];
      next.splice(idx, 1);
      return [updated, ...next];
    });
  }, []);

  const clearUnread = useCallback((convId: string) => {
    setConversations(prev =>
      prev.map(c => c.id === convId ? { ...c, unreadCount: 0 } : c)
    );
    // Also notify server
    api.patch(`/api/conversations/${convId}/read`).catch(() => {});
  }, []);

  const prependConversation = useCallback((conv: Conversation) => {
    setConversations(prev => {
      if (prev.some(c => c.id === conv.id)) return prev;
      return [conv, ...prev];
    });
  }, []);

  const setParticipantOnline = useCallback((userId: string, isOnline: boolean) => {
    setConversations(prev =>
      prev.map(c =>
        c.freelancerId === userId || c.clientId === userId
          ? { ...c, isOnline }
          : c
      )
    );
  }, []);

  return {
    conversations,
    isLoading,
    error,
    refetch,
    bumpLastMessage,
    clearUnread,
    prependConversation,
    setParticipantOnline,
  };
}
