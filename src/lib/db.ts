/**
 * db.ts — Crescent Black Persistent Data Layer
 *
 * Pure Node.js JSON-file persistence. No external database required
 * for development. The same interface can be swapped for PostgreSQL /
 * MongoDB by replacing the implementations below without touching
 * any controller code.
 *
 * Storage location: <project-root>/.data/
 *   .data/users.json         — users (written by server.ts)
 *   .data/conversations.json — messaging conversations
 *   .data/messages.json      — all messages (indexed by conversationId)
 */

import fs   from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR  = path.resolve(__dirname, "../../.data");

// ─── Low-level helpers ────────────────────────────────────────────────────────

function filePath(name: string) {
  return path.join(DATA_DIR, `${name}.json`);
}

function readAll<T>(name: string): T[] {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    const p = filePath(name);
    if (!fs.existsSync(p)) return [];
    return JSON.parse(fs.readFileSync(p, "utf-8")) as T[];
  } catch {
    return [];
  }
}

function writeAll<T>(name: string, data: T[]): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(filePath(name), JSON.stringify(data, null, 2));
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Conversation {
  conversationId: string;
  /** Always [clientId, freelancerId] */
  participants:   [string, string];
  projectId:      string;
  createdAt:      string; // ISO-8601
  lastMessage:    string | null;
  /** { [userId]: unreadCount } */
  unreadCount:    Record<string, number>;
}

export interface Message {
  messageId:    string;
  conversationId: string;
  senderId:     string;
  senderRole:   "client" | "freelancer";
  text:         string;
  timestamp:    string; // ISO-8601
  read:         boolean;
  readAt:       string | null; // ISO-8601 or null
}

// ─── Conversations ────────────────────────────────────────────────────────────

export const conversations = {
  findAll(): Conversation[] {
    return readAll<Conversation>("conversations");
  },

  findById(id: string): Conversation | undefined {
    return this.findAll().find((c) => c.conversationId === id);
  },

  findByParticipant(userId: string): Conversation[] {
    return this.findAll().filter((c) => c.participants.includes(userId));
  },

  create(
    clientId: string,
    freelancerId: string,
    projectId: string
  ): Conversation {
    const all = this.findAll();
    const conv: Conversation = {
      conversationId: randomUUID(),
      participants:   [clientId, freelancerId],
      projectId,
      createdAt:      new Date().toISOString(),
      lastMessage:    null,
      unreadCount:    { [clientId]: 0, [freelancerId]: 0 },
    };
    writeAll("conversations", [...all, conv]);
    return conv;
  },

  update(id: string, patch: Partial<Conversation>): Conversation | null {
    const all     = this.findAll();
    const idx     = all.findIndex((c) => c.conversationId === id);
    if (idx === -1) return null;
    const updated = { ...all[idx], ...patch };
    all[idx]      = updated;
    writeAll("conversations", all);
    return updated;
  },
};

// ─── Messages ────────────────────────────────────────────────────────────────

export const messages = {
  findByConversation(conversationId: string): Message[] {
    return readAll<Message>("messages")
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  },

  add(
    conversationId: string,
    senderId: string,
    senderRole: "client" | "freelancer",
    text: string,
    recipientId: string
  ): Message {
    const all = readAll<Message>("messages");

    const msg: Message = {
      messageId:      randomUUID(),
      conversationId,
      senderId,
      senderRole,
      text:           text.trim(),
      timestamp:      new Date().toISOString(),
      read:           false,
      readAt:         null,
    };
    writeAll("messages", [...all, msg]);

    // Denormalise lastMessage + increment unread on the conversation
    const conv = conversations.findById(conversationId);
    if (conv) {
      const unread = { ...conv.unreadCount };
      unread[recipientId] = (unread[recipientId] ?? 0) + 1;
      conversations.update(conversationId, {
        lastMessage: text.trim(),
        unreadCount: unread,
      });
    }

    return msg;
  },

  markRead(conversationId: string, readerUserId: string): void {
    const all     = readAll<Message>("messages");
    const now     = new Date().toISOString();
    let changed   = false;

    const updated = all.map((m) => {
      if (
        m.conversationId === conversationId &&
        m.senderId !== readerUserId &&
        !m.read
      ) {
        changed = true;
        return { ...m, read: true, readAt: now };
      }
      return m;
    });

    if (changed) {
      writeAll("messages", updated);
      // Reset unread counter for this reader
      const conv = conversations.findById(conversationId);
      if (conv) {
        conversations.update(conversationId, {
          unreadCount: { ...conv.unreadCount, [readerUserId]: 0 },
        });
      }
    }
  },
};
