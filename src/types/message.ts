// ─── Shared Messaging Types ───────────────────────────────────────────────────

export interface Conversation {
  id: string; clientId: string;
  freelancerId: string; freelancerName: string; freelancerAvatarInitials: string;
  lastMessage: string; lastMessageAt: string; unreadCount: number; topic: string;
  createdAt: string;
}

export interface Message {
  id: string; conversationId: string;
  senderId: string;
  senderType: "client" | "freelancer";
  senderName: string; senderAvatarInitials: string;
  text: string; createdAt: string; read: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function relativeTimestamp(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function dateGroupLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined });
}

/** Group messages into { label, messages } by calendar day */
export function groupMessagesByDate(messages: Message[]): { label: string; messages: Message[] }[] {
  const groups: { label: string; messages: Message[] }[] = [];
  let currentLabel = "";
  for (const m of messages) {
    const label = dateGroupLabel(m.createdAt);
    if (label !== currentLabel) {
      currentLabel = label;
      groups.push({ label, messages: [m] });
    } else {
      groups[groups.length - 1].messages.push(m);
    }
  }
  return groups;
}

export const AVATAR_GRADIENTS = [
  "from-accent to-violet-600", "from-blue-500 to-cyan-400",
  "from-emerald-500 to-teal-400", "from-orange-500 to-pink-500",
];

export const avatarGrad = (id: string) =>
  AVATAR_GRADIENTS[id.charCodeAt(id.length - 1) % AVATAR_GRADIENTS.length];
