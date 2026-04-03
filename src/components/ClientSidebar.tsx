import React from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard, FolderOpen, Search, Inbox, Calendar, MessageCircle,
  Receipt, Settings, LogOut, User, X, ChevronLeft, ChevronRight, Bot,
  BarChart2, Star, PlusCircle, CreditCard,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ROUTES, APP_NAME } from "../constants";
import { cn } from "../lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClientSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

// ─── Nav Config ───────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: "dashboard",    label: "Dashboard",       icon: LayoutDashboard, path: ROUTES.DASHBOARD_CLIENT },
  { id: "post-project", label: "Post Project",    icon: PlusCircle,      path: ROUTES.CLIENT_POST_PROJECT },
  { id: "projects",     label: "My Projects",     icon: FolderOpen,      path: ROUTES.CLIENT_PROJECTS },
  { id: "freelancers",  label: "Find Freelancers", icon: Search,         path: ROUTES.CLIENT_FREELANCERS },
  { id: "proposals",    label: "Proposals",        icon: Inbox,          path: ROUTES.CLIENT_PROPOSALS },
  { id: "meetings",     label: "Meetings",         icon: Calendar,       path: ROUTES.CLIENT_MEETINGS },
  { id: "messages",     label: "Messages",         icon: MessageCircle,  path: ROUTES.CLIENT_MESSAGES },
  { id: "ai-chat",      label: "AI Assistant",     icon: Bot,            path: ROUTES.CLIENT_AI_CHAT },
  { id: "invoices",     label: "Invoices",         icon: Receipt,        path: ROUTES.CLIENT_INVOICES },
  { id: "payments",     label: "Payments",         icon: CreditCard,     path: ROUTES.CLIENT_PAYMENTS },
  { id: "analytics",    label: "Analytics",        icon: BarChart2,      path: ROUTES.CLIENT_ANALYTICS },
  { id: "feedback",     label: "Feedback",         icon: Star,           path: ROUTES.CLIENT_FEEDBACK },
  { id: "settings",     label: "Settings",         icon: Settings,       path: ROUTES.CLIENT_SETTINGS },
];


// ─── Helper: user initials ─────────────────────────────────────────────────────

const getInitials = (name?: string): string => {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

// ─── Sidebar content (shared between all breakpoints) ────────────────────────

interface SidebarContentProps {
  isCollapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
}

const SidebarContent: React.FC<SidebarContentProps> = ({
  isCollapsed,
  onClose,
  onToggleCollapse,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(ROUTES.AUTH);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* ── Logo header ── */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border">
        <AnimatePresence mode="wait">
          {!isCollapsed ? (
            <motion.div
              key="logo-full"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
            >
              <Link
                to={ROUTES.DASHBOARD_CLIENT}
                className="flex items-center gap-2.5 hover:opacity-90 transition-opacity"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg overflow-hidden border border-accent/30 shadow-glow">
                  <img
                    src="https://drive.google.com/uc?export=view&id=1ztNeXJL8_G5zwA03ZCul-WmBBU6SaLJ5"
                    alt="Crescent Black"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span className="font-display text-base font-bold text-textPrimary tracking-tight whitespace-nowrap">
                  Crescent Black
                </span>
              </Link>
            </motion.div>

          ) : (
            <motion.div
              key="logo-icon"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              className="mx-auto flex h-7 w-7 items-center justify-center rounded-lg overflow-hidden border border-accent/30 shadow-glow"
            >
              <img
                src="https://drive.google.com/uc?export=view&id=1ztNeXJL8_G5zwA03ZCul-WmBBU6SaLJ5"
                alt="CB"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </motion.div>

          )}
        </AnimatePresence>

        {/* Close on mobile (X) / Collapse toggle on desktop (chevron) */}
        <div className="flex items-center gap-1">
          {/* X button — visible on mobile only */}
          <button
            onClick={onClose}
            className="md:hidden rounded-lg p-1.5 text-textMuted hover:bg-elevated hover:text-textPrimary transition-colors"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Chevron toggle — visible on desktop (md+) only */}
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex rounded-lg p-1.5 text-textMuted hover:bg-elevated hover:text-textPrimary transition-colors"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* ── Role badge ── */}
      {!isCollapsed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mx-3 mt-3 mb-1 rounded-lg bg-accent/10 border border-accent/20 px-3 py-1.5 text-center"
        >
          <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
            Client Portal
          </span>
        </motion.div>
      )}

      {/* ── Navigation ── */}
      <nav
        className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5 custom-scrollbar"
        aria-label="Client navigation"
      >
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            end={item.path === ROUTES.DASHBOARD_CLIENT}
            onClick={onClose} // close mobile drawer on nav
            className={({ isActive }) =>
              cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isCollapsed && "justify-center px-2",
                isActive
                  ? "bg-accent/10 text-accent"
                  : "text-textMuted hover:bg-elevated hover:text-textPrimary"
              )
            }
            aria-label={item.label}
          >
            {({ isActive }) => (
              <>
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="client-nav-indicator"
                    className="absolute left-0 top-2 h-[calc(100%-16px)] w-0.5 rounded-r-full bg-accent shadow-glow"
                  />
                )}
                <item.icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0 transition-colors",
                    isActive
                      ? "text-accent"
                      : "text-textDisabled group-hover:text-textPrimary"
                  )}
                />
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.15 }}
                      className="truncate overflow-hidden whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="pointer-events-none absolute left-full ml-2 z-50 hidden group-hover:block">
                    <div className="rounded-lg bg-elevated border border-border px-2.5 py-1.5 text-xs font-medium text-textPrimary shadow-xl whitespace-nowrap">
                      {item.label}
                    </div>
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── User section ── */}
      <div className="border-t border-border p-3 space-y-1">
        {/* User info */}
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg p-2",
            isCollapsed && "justify-center"
          )}
        >
          {/* Avatar */}
          <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-border bg-surface">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.fullName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-accent/20 text-accent text-xs font-bold">
                {getInitials(user?.fullName)}
              </div>
            )}
          </div>

          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="flex min-w-0 flex-col overflow-hidden"
              >
                <span className="truncate text-sm font-semibold text-textPrimary leading-tight">
                  {user?.fullName ?? "Client"}
                </span>
                <span className="truncate text-[10px] text-textDisabled capitalize leading-tight">
                  {user?.role ?? "client"}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-error hover:bg-error/10 transition-colors",
            isCollapsed && "justify-center px-2"
          )}
          aria-label="Sign out"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden whitespace-nowrap"
              >
                Sign Out
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </div>
  );
};

// ─── ClientSidebar ────────────────────────────────────────────────────────────

/**
 * ClientSidebar — responsive sidebar for the client dashboard.
 *
 * Breakpoint behaviour:
 *   Desktop (≥ 768px / md):
 *     - Always visible, width transitions between 240px and 60px (icon-only)
 *     - Controlled by `isCollapsed`
 *
 *   Tablet / Mobile (< 768px):
 *     - Hidden off-screen as a drawer, slides in when `isOpen = true`
 *     - Full-screen backdrop overlay when open
 *     - Controlled by `isOpen`
 */
export const ClientSidebar: React.FC<ClientSidebarProps> = ({
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
}) => {
  return (
    <>
      {/* ── DESKTOP: Static sidebar (md+) ── */}
      <motion.div
        animate={{ width: isCollapsed ? 60 : 240 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="hidden md:flex flex-col h-screen bg-surface/60 border-r border-border backdrop-blur-xl fixed left-0 top-0 z-40 shrink-0"
        style={{ minWidth: isCollapsed ? 60 : 240 }}
      >
        <SidebarContent
          isCollapsed={isCollapsed}
          onClose={onClose}
          onToggleCollapse={onToggleCollapse}
        />
      </motion.div>

      {/* ── MOBILE: Full-screen drawer overlay (< md) ── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="mobile-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden"
              onClick={onClose}
              aria-hidden
            />

            {/* Drawer */}
            <motion.div
              key="mobile-drawer"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 left-0 z-[60] w-[260px] bg-surface border-r border-border shadow-2xl md:hidden"
            >
              <SidebarContent
                isCollapsed={false}
                onClose={onClose}
                onToggleCollapse={onToggleCollapse}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
