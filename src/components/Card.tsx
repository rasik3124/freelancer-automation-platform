import React from "react";
import { motion, HTMLMotionProps } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ className, children, ...props }) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={cn(
        "rounded-card border border-border bg-surface/50 p-6 shadow-card transition-all hover:border-violet/30 hover:bg-surface",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};
