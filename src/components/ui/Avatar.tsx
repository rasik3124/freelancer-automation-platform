import React from "react";
import { cn } from "../../lib/utils";

const GRADIENTS = [
  "from-accent to-violet-600",
  "from-blue-500 to-cyan-400",
  "from-emerald-500 to-teal-400",
  "from-orange-500 to-pink-500",
  "from-rose-500 to-pink-400",
  "from-sky-500 to-blue-400",
];

function pickGrad(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return GRADIENTS[hash % GRADIENTS.length];
}

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

interface AvatarProps {
  /** Displayed as image if provided */
  src?: string | null;
  /** Fallback initials (max 2 chars) */
  initials?: string;
  /** Seed string for deterministic gradient (uses fullName or id) */
  seed?: string;
  size?: AvatarSize;
  /** Whether to show a green online dot */
  online?: boolean;
  className?: string;
  alt?: string;
}

const SIZES: Record<AvatarSize, { container: string; text: string; dot: string }> = {
  xs: { container: "h-6 w-6",    text: "text-[8px]",  dot: "h-2 w-2" },
  sm: { container: "h-8 w-8",    text: "text-[10px]", dot: "h-2.5 w-2.5" },
  md: { container: "h-10 w-10",  text: "text-xs",     dot: "h-3 w-3" },
  lg: { container: "h-14 w-14",  text: "text-base",   dot: "h-3.5 w-3.5" },
  xl: { container: "h-20 w-20",  text: "text-xl",     dot: "h-4 w-4" },
};

export const Avatar: React.FC<AvatarProps> = ({
  src, initials, seed, size = "md", online, className, alt
}) => {
  const s = SIZES[size];
  const grad = pickGrad(seed ?? initials ?? "U");
  const display = initials ? initials.slice(0, 2).toUpperCase() : "?";

  return (
    <div className={cn("relative inline-flex shrink-0", s.container, className)}>
      {src ? (
        <img src={src} alt={alt ?? display}
          className="h-full w-full rounded-full object-cover border border-border" />
      ) : (
        <div className={cn("flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br font-black text-white", grad, s.text)}>
          {display}
        </div>
      )}
      {online && (
        <span className={cn("absolute bottom-0 right-0 rounded-full bg-success ring-2 ring-card", s.dot)} />
      )}
    </div>
  );
};

/** Group of overlapping avatars */
interface AvatarGroupProps { items: { src?: string; initials?: string; seed?: string }[]; size?: AvatarSize; max?: number; }
export const AvatarGroup: React.FC<AvatarGroupProps> = ({ items, size = "sm", max = 4 }) => {
  const visible = items.slice(0, max);
  const extra   = items.length - max;
  return (
    <div className="flex -space-x-2">
      {visible.map((item, i) => (
        <Avatar key={i} {...item} size={size} className="ring-2 ring-card" />
      ))}
      {extra > 0 && (
        <div className={cn("flex items-center justify-center rounded-full bg-elevated ring-2 ring-card font-bold text-textMuted", SIZES[size].container, SIZES[size].text)}>
          +{extra}
        </div>
      )}
    </div>
  );
};
