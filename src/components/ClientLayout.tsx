import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Menu, Bell, ChevronRight } from "lucide-react";
import { ClientSidebar } from "./ClientSidebar";
import { ROUTES } from "../constants";

// ─── Page title map ───────────────────────────────────────────────────────────

const PAGE_TITLES: Record<string, string> = {
  [ROUTES.DASHBOARD_CLIENT]: "Overview",
  [ROUTES.CLIENT_PROJECTS]: "My Projects",
  [ROUTES.CLIENT_FREELANCERS]: "Find Freelancers",
  [ROUTES.CLIENT_PROPOSALS]: "Proposals Received",
  [ROUTES.CLIENT_MEETINGS]: "Meetings",
  [ROUTES.CLIENT_MESSAGES]: "Messages",
  [ROUTES.CLIENT_INVOICES]: "Invoices",
  [ROUTES.CLIENT_SETTINGS]: "Settings",
};

// ─── ClientLayout ─────────────────────────────────────────────────────────────

/**
 * ClientLayout — root layout for all /dashboard/client/* routes.
 *
 * Structure:
 * ┌──────────────────────────────────────────────────────────────┐
 * │  ClientSidebar (fixed left, 240px desktop / drawer mobile)   │
 * ├──────────────────────────────────────────────────────────────┤
 * │  Main content area                                            │
 * │  ┌────────────────────────────────────────────────────────┐  │
 * │  │ Topbar  (hamburger on mobile, title, notifications)    │  │
 * │  ├────────────────────────────────────────────────────────┤  │
 * │  │ Page content (Outlet) — overflow-y-auto, p-6           │  │
 * │  └────────────────────────────────────────────────────────┘  │
 * └──────────────────────────────────────────────────────────────┘
 *
 * Responsive logic:
 *   Desktop (≥ md): Sidebar always visible, main content offset by sidebar width
 *   Tablet / Mobile: Sidebar hidden, hamburger button shows/hides drawer
 */
export const ClientLayout: React.FC = () => {
  /** Mobile drawer open state */
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  /** Desktop collapsed (icon-only) state */
  const [isCollapsed, setIsCollapsed] = useState(false);

  const location = useLocation();
  const pageTitle = PAGE_TITLES[location.pathname] ?? "Dashboard";
  const sidebarWidth = isCollapsed ? 60 : 240;

  return (
    <div
      className="flex h-screen w-full bg-base"
      style={{ backgroundColor: "#0a0a0a" }}
    >
      {/* ── ClientSidebar ── */}
      <ClientSidebar
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
      />

      {/* ── Main content — offset by sidebar width on desktop ── */}
      <motion.div
        animate={{ paddingLeft: sidebarWidth }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="hidden md:flex flex-1 flex-col min-w-0 overflow-hidden"
      >
        <Topbar
          pageTitle={pageTitle}
          onMobileMenuOpen={() => setIsMobileOpen(true)}
          location={location.pathname}
        />
        <PageContent />
      </motion.div>

      {/* ── Mobile main content (no left offset) ── */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden md:hidden">
        <Topbar
          pageTitle={pageTitle}
          onMobileMenuOpen={() => setIsMobileOpen(true)}
          location={location.pathname}
        />
        <PageContent />
      </div>
    </div>
  );
};

// ─── Topbar ───────────────────────────────────────────────────────────────────

interface TopbarProps {
  pageTitle: string;
  onMobileMenuOpen: () => void;
  location: string;
}

const Topbar: React.FC<TopbarProps> = ({ pageTitle, onMobileMenuOpen }) => {
  return (
    <header
      className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4 md:px-6 backdrop-blur-md"
      style={{ backgroundColor: "rgba(17,17,17,0.8)" }}
    >
      {/* Left: hamburger (mobile only) + breadcrumb */}
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile / tablet only */}
        <button
          onClick={onMobileMenuOpen}
          className="md:hidden rounded-lg p-2 text-textMuted hover:bg-elevated hover:text-textPrimary transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <span className="hidden sm:inline text-textMuted font-medium">
            Client
          </span>
          <ChevronRight className="hidden sm:inline h-3.5 w-3.5 text-textDisabled" />
          <h1 className="font-display font-bold text-textPrimary">{pageTitle}</h1>
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button
          className="relative rounded-lg p-2 text-textMuted hover:bg-elevated hover:text-textPrimary transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {/* Unread dot */}
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent shadow-glow" />
        </button>
      </div>
    </header>
  );
};

// ─── Page content ─────────────────────────────────────────────────────────────

const PageContent: React.FC = () => {
  const location = useLocation();
  return (
    <main className="flex-1 overflow-y-auto custom-scrollbar">
      {/* Inner padding — 24px as per spec */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="mx-auto max-w-7xl"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
};
