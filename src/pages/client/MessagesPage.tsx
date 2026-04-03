/**
 * MessagesPage.tsx — Real-time messaging hub
 * Route: /dashboard/client/messages  (also used for /dashboard/freelancer/messages)
 *
 * Layout:
 *   Desktop  (≥ md): Left sidebar (280px) + ChatWindow (flex-1)
 *   Tablet   (sm):   Sidebar collapses, hamburger to toggle
 *   Mobile   (< sm): Stacked — list OR chat (back button switches)
 *
 * Real-time stack:
 *   useSocket        → singleton Socket.io client with JWT auth
 *   useConversations → conversation list, socket-updated last message + unread
 *   ChatWindow       → renders messages, typing indicator, sends via useMessages
 *
 * Socket lifecycle:
 *   1. Connect on mount with JWT from localStorage
 *   2. Emit user:connect with all conversation IDs → join rooms
 *   3. Receive message:receive → bump conversation + show in ChatWindow
 *   4. Receive user:status → show online dot
 *   5. Disconnect on unmount
 */

import React, { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Menu, WifiOff, X } from "lucide-react";
import { ConversationList } from "../../components/messages/ConversationList";
import { ChatWindow } from "../../components/messages/ChatWindow";
import { NewMessageModal } from "../../components/messages/NewMessageModal";
import { useSocket } from "../../hooks/useSocket";
import { useConversations, type Conversation } from "../../hooks/useConversations";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../lib/utils";

// ─── MessagesPage ─────────────────────────────────────────────────────────────

export const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const userId   = user?.id ?? null;

  // ── Socket ──────────────────────────────────────────────────────────────
  const {
    socket,
    isConnected,
    isConnecting,
    status: socketStatus,
    error: socketError,
    emit,
  } = useSocket();

  // ── Conversations ───────────────────────────────────────────────────────
  const [activeId, setActiveId] = useState<string | null>(null);

  const {
    conversations,
    isLoading,
    error: convError,
    clearUnread,
    prependConversation,
    bumpLastMessage,
  } = useConversations(socket, activeId);

  // ── Sidebar mobile toggle ───────────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showModal,   setShowModal]   = useState(false);

  // ── Join all conversation rooms once connected ───────────────────────────
  useEffect(() => {
    if (!isConnected || !userId || conversations.length === 0) return;
    emit("user:connect", {
      uid:             userId,
      conversationIds: conversations.map(c => c.id),
    });
  }, [isConnected, userId, conversations.length, emit]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-select first conversation on desktop ─────────────────────────────
  useEffect(() => {
    if (!activeId && conversations.length > 0 && window.innerWidth >= 768) {
      setActiveId(conversations[0].id);
    }
  }, [conversations.length, activeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSelect = useCallback((id: string) => {
    setActiveId(id);
    clearUnread(id);
    setSidebarOpen(false); // close drawer on mobile
  }, [clearUnread]);

  const handleNewConversation = useCallback((conv: Conversation) => {
    prependConversation(conv);
    setActiveId(conv.id);
    setShowModal(false);
  }, [prependConversation]);

  const activeConversation = conversations.find(c => c.id === activeId) ?? null;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      className="relative flex overflow-hidden rounded-2xl border border-border shadow-xl bg-base"
      style={{ height: "calc(100vh - 140px)", minHeight: 500 }}
    >
      {/* ─── Connection banner ─────────────────────────────────────── */}
      <AnimatePresence>
        {socketStatus === "error" && socketError && (
          <motion.div
            key="socket-error"
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            className="absolute top-0 left-0 right-0 z-50 flex items-center gap-2 bg-error/90 px-4 py-2 text-xs font-semibold text-white"
          >
            <WifiOff className="h-3.5 w-3.5 shrink-0" />
            {socketError} — messages will send via REST while reconnecting.
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Mobile: hamburger ────────────────────────────────────── */}
      <div className="absolute left-0 top-0 z-40 md:hidden">
        <button
          onClick={() => setSidebarOpen(v => !v)}
          className="m-2 flex h-9 w-9 items-center justify-center rounded-xl bg-surface border border-border text-textMuted hover:text-textPrimary transition-colors shadow-card"
        >
          {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {/* ─── Left: Conversation list ──────────────────────────────── */}

      {/* Desktop: always visible */}
      <div className="hidden md:flex flex-col w-72 xl:w-80 shrink-0">
        <ConversationList
          conversations={conversations}
          isLoading={isLoading}
          activeId={activeId}
          onSelect={handleSelect}
          onNewMessage={() => setShowModal(true)}
        />
      </div>

      {/* Mobile: drawer overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            key="sidebar-drawer"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 32 }}
            className="absolute inset-y-0 left-0 z-30 w-72 flex flex-col md:hidden shadow-2xl"
          >
            <ConversationList
              conversations={conversations}
              isLoading={isLoading}
              activeId={activeId}
              onSelect={handleSelect}
              onNewMessage={() => { setShowModal(true); setSidebarOpen(false); }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop for mobile drawer */}
      {sidebarOpen && (
        <div
          className="absolute inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─── Right: Chat window ────────────────────────────────────── */}
      <div className={cn(
        "flex flex-1 flex-col min-w-0 overflow-hidden relative",
      )}>
        {/* Socket connecting indicator */}
        {isConnecting && (
          <div className="absolute top-0 left-0 right-0 h-0.5 z-10">
            <div className="h-full bg-accent animate-pulse" />
          </div>
        )}

        <ChatWindow
          conversation={activeConversation}
          userId={userId ?? ""}
          socket={socket}
          isConnected={isConnected}
          onBack={() => setActiveId(null)}
        />
      </div>

      {/* ─── New message modal ────────────────────────────────────── */}
      {showModal && (
        <NewMessageModal
          onClose={() => setShowModal(false)}
          onCreated={handleNewConversation as (conv: unknown) => void}
        />
      )}
    </div>
  );
};
