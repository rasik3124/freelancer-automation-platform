import React from "react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";

interface CrescentLogoProps {
  className?: string;
}

export const CrescentLogo: React.FC<CrescentLogoProps> = ({ className }) => {
  return (
    <motion.div
      whileHover={{ rotate: 15, scale: 1.1 }}
      className={cn(
        "flex h-12 w-12 items-center justify-center rounded-xl bg-accent shadow-glow overflow-hidden",
        className
      )}
    >
      <img src="https://picsum.photos/seed/logo/200/200" alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
    </motion.div>
  );
};
