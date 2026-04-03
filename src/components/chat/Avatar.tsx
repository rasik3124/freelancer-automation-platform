/**
 * Avatar.tsx — Reusable Avatar Component
 * Crescent Black design system
 *
 * Props:
 *   uid       — used for deterministic gradient fallback
 *   name      — display initials when no photo
 *   photoUrl  — optional image URL
 *   size      — 'sm' (32px) | 'md' (48px) | 'lg' (64px)
 *   status    — 'online' | 'offline' | null (no dot)
 */

import React from "react";
import { cn } from "../../lib/utils";

// ─── Gradient palette (deterministic by uid hash) ─────────────────────────────

const GRADIENTS = [
  "from-violet-500 to-purple-700",
  "from-orange-400 to-red-600",
  "from-sky-400 to-blue-600",
  "from-emerald-400 to-teal-600",
  "from-pink-400 to-rose-600",
  "from-amber-400 to-orange-600",
  "from-indigo-400 to-violet-600",
  "from-cyan-400 to-sky-600",
];

function hashCode(s: string): number {
  let h = 0;
  for (const c of s) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}

function gradient(uid: string): string {
  return GRADIENTS[hashCode(uid) % GRADIENTS.length];
}

export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? "")
    .join("");
}

// ─── Size map ─────────────────────────────────────────────────────────────────

const SIZE_CLASSES: Record<"sm" | "md" | "lg", { container: string; text: string; dot: string }> = {
  sm: { container: "h-8 w-8",   text: "text-[10px]", dot: "h-2.5 w-2.5" },
  md: { container: "h-12 w-12", text: "text-sm",     dot: "h-3 w-3" },
  lg: { container: "h-16 w-16", text: "text-base",   dot: "h-3.5 w-3.5" },
};

// ─── Props ────────────────────────────────────────────────────────────────────

export interface AvatarProps {
  uid:      string;
  name:     string;
  photoUrl?: string | null;
  size?:    "sm" | "md" | "lg";
  status?:  "online" | "offline" | null;
  className?: string;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

export const Avatar: React.FC<AvatarProps> = ({
  uid,
  name,
  photoUrl,
  size = "md",
  status = null,
  className,
}) => {
  const { container, text, dot } = SIZE_CLASSES[size];
  const grad = gradient(uid);
  const initials = getInitials(name) || "?";

  return (
    <div className={cn("relative shrink-0 inline-flex", className)}>
      {/* Circle */}
      <div
        className={cn(
          "rounded-full overflow-hidden border border-border flex items-center justify-center font-bold text-white",
          container,
          !photoUrl && `bg-gradient-to-br ${grad}`
        )}
      >
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={name}
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className={text}>{initials}</span>
        )}
      </div>

      {/* Status dot */}
      {status && (
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-base",
            dot,
            status === "online" ? "bg-success" : "bg-textDisabled"
          )}
        />
      )}
    </div>
  );
};
