import React from "react";
import { motion } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import { ROUTES, APP_NAME } from "../constants";
import { Button } from "./ui/Button";

export const Navbar: React.FC = () => {
  const navigate = useNavigate();

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-[100] border-b border-border bg-base/80 backdrop-blur-xl"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to={ROUTES.LANDING} className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-sm bg-accent shadow-glow" />
            <span className="text-sm font-display font-bold tracking-tight text-text-primary uppercase">
              {APP_NAME}
            </span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {["Platform", "Solutions", "AI Engine", "Vision"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(" ", "-")}`}
                className="text-[11px] font-medium uppercase tracking-widest text-text-secondary hover:text-accent transition-colors"
              >
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate(ROUTES.AUTH)}
              className="text-[11px] font-medium uppercase tracking-widest text-text-secondary hover:text-accent transition-colors"
            >
              Login
            </button>
            <Button
              variant="gold"
              size="sm"
              onClick={() => navigate(ROUTES.AUTH)}
              className="px-4 py-1.5 text-[10px] uppercase tracking-widest"
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};
