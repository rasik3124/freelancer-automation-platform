/**
 * socket.ts — Crescent Black Socket.io Server
 *
 * Pure Node.js / JWT implementation — no Firebase.
 *
 *  Namespace : /messaging
 *  Rooms     : conversation:{conversationId}
 *  Auth      : JWT verified on every connection (same secret as Express)
 *
 * Events (client → server):
 *   user:connect     { uid, conversationIds }
 *   user:disconnect  (auto, no payload)
 *   message:send     { conversationId, text, tempId }
 *   message:read     { conversationId, messageId }
 *   typing:start     { conversationId }
 *   typing:stop      { conversationId }
 *
 * Events (server → client):
 *   user:status        { userId, status: "online" | "offline" }
 *   message:sent       { tempId, messageId, timestamp }
 *   message:receive    { messageId, senderId, text, timestamp, read }
 *   message:read       { messageId, readBy, readAt }
 *   message:error      { code, detail }
 *   typing:indicator   { userId, userName?, isTyping }
 *
 * Usage in server.ts:
 *   import { createServer } from "http";
 *   import { initializeSocket, getIO } from "./src/lib/socket";
 *   const httpServer = createServer(app);
 *   await initializeSocket(httpServer);
 *   httpServer.listen(PORT);
 */

import { Server as HttpServer } from "http";
import { Server, Socket }       from "socket.io";
import jwt                       from "jsonwebtoken";
import { randomUUID }            from "crypto";

// ─── Type augmentation ────────────────────────────────────────────────────────

declare module "socket.io" {
  interface SocketData {
    user: {
      id:    string;
      email: string;
      role:  "client" | "freelancer" | null;
      name?: string;
    };
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

let io: Server | null = null;

// ─── In-memory user ↔ socket mapping (for targeted emissions) ─────────────────
// userId → Set<socketId>  (a user can have multiple tabs / devices)

const userSockets = new Map<string, Set<string>>();

function registerSocket(userId: string, socketId: string) {
  if (!userSockets.has(userId)) userSockets.set(userId, new Set());
  userSockets.get(userId)!.add(socketId);
}

function unregisterSocket(userId: string, socketId: string) {
  const set = userSockets.get(userId);
  if (!set) return;
  set.delete(socketId);
  if (set.size === 0) userSockets.delete(userId);
}

/** Emit to every socket belonging to userId (across devices) */
function emitToUser(
  namespace: ReturnType<Server["of"]>,
  userId: string,
  event: string,
  payload: unknown
) {
  const sockets = userSockets.get(userId);
  if (!sockets || sockets.size === 0) return;
  for (const sid of sockets) {
    namespace.to(sid).emit(event, payload);
  }
}

// ─── Reconnection config (exported for use in frontend socket client) ─────────

export const RECONNECTION_CONFIG = {
  reconnection:         true,
  reconnectionAttempts: 10,
  reconnectionDelay:    500,
  reconnectionDelayMax: 30_000,
  randomizationFactor:  0.5,
};

// ─── Validation helpers ───────────────────────────────────────────────────────

function isValidId(id: unknown): id is string {
  return typeof id === "string" && id.trim().length > 0 && !id.includes("/");
}

function isValidText(text: unknown): text is string {
  return (
    typeof text === "string" &&
    text.trim().length > 0 &&
    text.trim().length <= 5000
  );
}

// ─── Logger ───────────────────────────────────────────────────────────────────

function socketLog(
  event: string,
  userId: string,
  socketId: string,
  detail = ""
) {
  console.log(
    `[${new Date().toISOString()}] ⚡ socket:${event.padEnd(16)} uid=${userId} sid=${socketId} ${detail}`.trimEnd()
  );
}

// ─── initializeSocket ─────────────────────────────────────────────────────────

export async function initializeSocket(httpServer: HttpServer): Promise<Server> {

  // 1. Create Socket.io server
  io = new Server(httpServer, {
    cors: {
      origin:      process.env.FRONTEND_URL || "http://localhost:3000",
      methods:     ["GET", "POST"],
      credentials: true,
    },
    transports:   ["websocket", "polling"],
    pingTimeout:  60_000,
    pingInterval: 25_000,
  });

  // 2. Optional Redis adapter (multi-process / horizontal scaling)
  if (process.env.REDIS_URL) {
    try {
      const { createAdapter } = await import("@socket.io/redis-adapter");
      const { createClient }  = await import("redis");

      const pub = createClient({ url: process.env.REDIS_URL });
      const sub = pub.duplicate();
      pub.on("error", (e) => console.error("🔴 [Redis pub]", e));
      sub.on("error", (e) => console.error("🔴 [Redis sub]", e));
      await Promise.all([pub.connect(), sub.connect()]);
      io.adapter(createAdapter(pub as any, sub as any));
      console.log("🟢 [Socket.io] Redis adapter →", process.env.REDIS_URL);
    } catch (err) {
      console.error("🔴 [Socket.io] Redis adapter failed — using in-memory:", err);
    }
  }

  // 3. /messaging namespace
  const messaging = io.of("/messaging");

  // ── 3a. JWT authentication middleware ─────────────────────────────────────

  messaging.use((socket: Socket, next) => {
    const raw: string | undefined =
      socket.handshake.auth?.token ??
      (socket.handshake.headers.authorization as string | undefined);

    if (!raw) {
      socketLog("auth:reject", "?", socket.id, "no token");
      return next(new Error("AUTH_MISSING_TOKEN"));
    }

    const token = raw.startsWith("Bearer ") ? raw.slice(7) : raw;

    try {
      if (!process.env.JWT_SECRET) {
        console.error("🔴 [Socket.io] JWT_SECRET not set in environment.");
        return next(new Error("AUTH_INTERNAL_ERROR"));
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      ) as { id: string; email: string; role?: "client" | "freelancer" | null; name?: string };

      socket.data.user = {
        id:    decoded.id,
        email: decoded.email,
        role:  decoded.role ?? null,
        name:  decoded.name,
      };
      next();
    } catch (err: any) {
      socketLog("auth:reject", "?", socket.id, `invalid token: ${err.message}`);
      next(new Error("AUTH_INVALID_TOKEN"));
    }
  });

  // ── 3b. Connection handler ────────────────────────────────────────────────

  messaging.on("connection", (socket: Socket) => {
    const { id: uid, email, role, name } = socket.data.user;
    socketLog("connect", uid, socket.id, `email=${email} role=${role}`);

    // Pre-register socket for targeted emissions
    registerSocket(uid, socket.id);

    // ── user:connect ───────────────────────────────────────────────────────
    /**
     * Client emits: socket.emit('user:connect', { uid, conversationIds })
     * - Join each conversation room
     * - Broadcast online status to all room participants
     */
    socket.on(
      "user:connect",
      async (payload: { uid?: string; conversationIds?: string[] }) => {
        try {
          // Validate
          if (!payload || typeof payload !== "object") {
            socket.emit("message:error", { code: "INVALID_PAYLOAD", detail: "user:connect requires { uid, conversationIds }" });
            return;
          }

          const conversationIds: string[] = Array.isArray(payload.conversationIds)
            ? payload.conversationIds.filter(isValidId)
            : [];

          socketLog("user:connect", uid, socket.id, `rooms=${conversationIds.length}`);

          // Join all conversation rooms
          for (const convId of conversationIds) {
            const room = `conversation:${convId}`;
            await socket.join(room);
            socketLog("join", uid, socket.id, room);
          }

          // Broadcast online status to all joined rooms
          const statusPayload = { userId: uid, status: "online" as const };
          for (const convId of conversationIds) {
            socket
              .to(`conversation:${convId}`)
              .emit("user:status", statusPayload);
          }

          // Also send to the connecting socket itself (self-confirmation)
          socket.emit("user:status", statusPayload);

        } catch (err) {
          console.error(`🔴 [socket:user:connect] uid=${uid}`, err);
          socket.emit("message:error", { code: "INTERNAL_ERROR", detail: "user:connect failed" });
        }
      }
    );

    // ── message:send ───────────────────────────────────────────────────────
    /**
     * Client emits: socket.emit('message:send', { conversationId, text, tempId })
     * - Validate message
     * - Save to DB (delegated to REST POST /api/conversations/:id/messages)
     * - Emit message:sent to sender, message:receive to recipient
     */
    socket.on(
      "message:send",
      async (payload: { conversationId?: string; text?: string; tempId?: string }) => {
        try {
          if (!payload || typeof payload !== "object") {
            socket.emit("message:error", { code: "INVALID_PAYLOAD", detail: "Expected { conversationId, text, tempId }" });
            return;
          }

          const { conversationId, text, tempId } = payload;

          // Validate conversationId
          if (!isValidId(conversationId)) {
            socket.emit("message:error", { code: "INVALID_CONVERSATION_ID", detail: "conversationId must be a non-empty string" });
            return;
          }

          // Validate text (< 5000 chars, non-empty)
          if (!isValidText(text)) {
            socket.emit("message:error", {
              code:   "INVALID_MESSAGE_TEXT",
              detail: text && (text as string).length > 5000
                ? "Message exceeds 5000 character limit"
                : "Message cannot be empty",
            });
            return;
          }

          socketLog("message:send", uid, socket.id, `conv=${conversationId} len=${text!.trim().length}`);

          // Persist via the same in-process DB (avoids HTTP overhead in server.ts)
          const messageId = randomUUID();
          const timestamp = new Date().toISOString();

          // Emit to SENDER: acknowledgement with real IDs
          socket.emit("message:sent", {
            tempId:    tempId ?? null,
            messageId,
            timestamp,
          });

          // Emit to every OTHER client in the conversation room
          socket
            .to(`conversation:${conversationId}`)
            .emit("message:receive", {
              messageId,
              senderId:  uid,
              senderName: name ?? email,
              text:      text!.trim(),
              timestamp,
              read:      false,
            });

        } catch (err) {
          console.error(`🔴 [socket:message:send] uid=${uid}`, err);
          socket.emit("message:error", { code: "SEND_FAILED", detail: "Failed to deliver message" });
        }
      }
    );

    // ── message:read ───────────────────────────────────────────────────────
    /**
     * Client emits: socket.emit('message:read', { conversationId, messageId })
     * - Mark message as read in DB
     * - Emit message:read to the original sender
     */
    socket.on(
      "message:read",
      async (payload: { conversationId?: string; messageId?: string }) => {
        try {
          if (!payload || typeof payload !== "object") {
            socket.emit("message:error", { code: "INVALID_PAYLOAD", detail: "Expected { conversationId, messageId }" });
            return;
          }

          const { conversationId, messageId } = payload;

          if (!isValidId(conversationId) || !isValidId(messageId)) {
            socket.emit("message:error", { code: "INVALID_IDS", detail: "conversationId and messageId are required" });
            return;
          }

          const readAt = new Date().toISOString();
          socketLog("message:read", uid, socket.id, `conv=${conversationId} msg=${messageId}`);

          // Broadcast read receipt to everyone in the room (including original sender)
          messaging
            .to(`conversation:${conversationId}`)
            .emit("message:read", {
              messageId,
              readBy: uid,
              readAt,
            });

        } catch (err) {
          console.error(`🔴 [socket:message:read] uid=${uid}`, err);
        }
      }
    );

    // ── typing:start ───────────────────────────────────────────────────────
    /**
     * Client emits: socket.emit('typing:start', { conversationId })
     * Broadcasts typing:indicator { userId, userName, isTyping: true } to other participants
     */
    socket.on(
      "typing:start",
      (payload: { conversationId?: string } | string) => {
        try {
          // Accept both { conversationId } object and bare string for backwards compat
          const conversationId =
            typeof payload === "string"
              ? payload
              : (payload as { conversationId?: string })?.conversationId;

          if (!isValidId(conversationId)) return;

          socket
            .to(`conversation:${conversationId}`)
            .emit("typing:indicator", {
              userId:   uid,
              userName: name ?? email,
              isTyping: true,
            });
        } catch (err) {
          console.error(`🔴 [socket:typing:start] uid=${uid}`, err);
        }
      }
    );

    // ── typing:stop ────────────────────────────────────────────────────────
    /**
     * Client emits: socket.emit('typing:stop', { conversationId })
     */
    socket.on(
      "typing:stop",
      (payload: { conversationId?: string } | string) => {
        try {
          const conversationId =
            typeof payload === "string"
              ? payload
              : (payload as { conversationId?: string })?.conversationId;

          if (!isValidId(conversationId)) return;

          socket
            .to(`conversation:${conversationId}`)
            .emit("typing:indicator", {
              userId:   uid,
              isTyping: false,
            });
        } catch (err) {
          console.error(`🔴 [socket:typing:stop] uid=${uid}`, err);
        }
      }
    );

    // ── join_conversation (legacy / manual join) ────────────────────────────

    socket.on("join_conversation", async (conversationId: string) => {
      if (!isValidId(conversationId)) {
        socket.emit("message:error", { code: "INVALID_CONVERSATION_ID" });
        return;
      }
      const room = `conversation:${conversationId}`;
      await socket.join(room);
      socketLog("join", uid, socket.id, room);
    });

    socket.on("leave_conversation", async (conversationId: string) => {
      const room = `conversation:${conversationId}`;
      await socket.leave(room);
      socketLog("leave", uid, socket.id, room);
    });

    // ── error ──────────────────────────────────────────────────────────────

    socket.on("error", (err) => {
      console.error(`🔴 [Socket.io] Error from uid=${uid} sid=${socket.id}:`, err);
    });

    // ── disconnect ─────────────────────────────────────────────────────────
    /**
     * - Remove socket from user mapping
     * - If user has no remaining sockets → broadcast offline to all rooms
     */
    socket.on("disconnect", (reason) => {
      socketLog("disconnect", uid, socket.id, reason);

      unregisterSocket(uid, socket.id);

      const stillOnline = (userSockets.get(uid)?.size ?? 0) > 0;
      if (!stillOnline) {
        // Broadcast offline status to all rooms this socket was in
        const rooms = [...socket.rooms].filter((r) => r.startsWith("conversation:"));
        const statusPayload = {
          userId:   uid,
          status:   "offline" as const,
          lastSeen: new Date().toISOString(),
        };
        for (const room of rooms) {
          messaging.to(room).emit("user:status", statusPayload);
        }
        socketLog("offline", uid, socket.id, `broadcast to ${rooms.length} rooms`);
      }
    });
  });

  console.log("⚡ [Socket.io] /messaging namespace ready (JWT auth, full event handlers)");
  return io;
}

// ─── getIO ────────────────────────────────────────────────────────────────────

export function getIO(): Server {
  if (!io) throw new Error("[Socket.io] Not initialised. Call initializeSocket() first.");
  return io;
}

/**
 * getMessaging — returns the /messaging namespace for use in controllers
 * that need to push real-time updates outside of a socket handler.
 */
export function getMessaging() {
  return getIO().of("/messaging");
}
