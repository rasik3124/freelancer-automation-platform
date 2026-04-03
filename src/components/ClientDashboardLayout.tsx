import React, { useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  FolderOpen,
  Search,
  Inbox,
  Calendar,
  Receipt,
  Settings,
  LogOut,
  User,
  Menu,
  X,
  ChevronRight,
  Bell,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ROUTES, APP_NAME } from "../constants";
import { cn } from "../lib/utils";

export const ClientDashboardLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: "Overview", path: ROUTES.DASHBOARD_CLIENT },
    { icon: FolderOpen, label: "My Projects", path: ROUTES.CLIENT_PROJECTS },
    { icon: Search, label: "Find Freelancers", path: ROUTES.CLIENT_FREELANCERS },
    { icon: Inbox, label: "Proposals", path: ROUTES.CLIENT_PROPOSALS },
    { icon: Calendar, label: "Meetings", path: ROUTES.CLIENT_MEETINGS },
    { icon: Receipt, label: "Invoices", path: ROUTES.CLIENT_INVOICES },
    { icon: Settings, label: "Settings", path: ROUTES.CLIENT_SETTINGS },
  ];

  const currentPageTitle =
    navItems.find((item) => item.path === location.pathname)?.label || "Dashboard";

  return (
    <div className="flex h-screen w-full overflow-hidden bg-base">
      {/* ── Sidebar ── */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="relative z-50 flex h-full flex-col border-r border-border bg-surface/50 backdrop-blur-xl"
      >
        {/* Logo */}
        <div className="flex h-20 items-center justify-between px-6">
          <AnimatePresence mode="wait">
            {isSidebarOpen ? (
              <motion.div
                key="logo-full"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-3"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent shadow-glow overflow-hidden">
                  <img
                    src="https://picsum.photos/seed/logo/200/200"
                    alt="Logo"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span className="text-lg font-display font-bold tracking-tight text-textPrimary">
                  {APP_NAME.split(" ")[0]}
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="logo-mini"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-accent shadow-glow overflow-hidden"
              >
                <img
                  src="https://picsum.photos/seed/logo/200/200"
                  alt="Logo"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Role badge */}
        {isSidebarOpen && (
          <div className="mx-4 mb-2 rounded-lg bg-accent/10 border border-accent/20 px-3 py-1.5 text-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-accent">
              Client Portal
            </span>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-4 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === ROUTES.DASHBOARD_CLIENT}
              className={({ isActive }) =>
                cn(
                  "group relative flex items-center gap-4 rounded-button px-4 py-3 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-accent/10 text-accent shadow-[inset_0_0_20px_rgba(242,125,38,0.05)]"
                    : "text-textMuted hover:bg-elevated hover:text-textPrimary"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={cn(
                      "h-5 w-5 shrink-0",
                      isActive
                        ? "text-accent"
                        : "text-textDisabled group-hover:text-textPrimary"
                    )}
                  />
                  {isSidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="client-sidebar-indicator"
                      className="absolute left-0 h-6 w-1 rounded-r-full bg-accent shadow-glow"
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="border-t border-border p-4">
          <div
            className={cn(
              "flex items-center gap-3 rounded-button bg-elevated/50 p-3",
              !isSidebarOpen && "justify-center"
            )}
          >
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border bg-surface">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-accent/20 text-accent">
                  <User className="h-5 w-5" />
                </div>
              )}
            </div>
            {isSidebarOpen && (
              <div className="flex flex-1 flex-col overflow-hidden">
                <span className="truncate text-sm font-semibold text-textPrimary">
                  {user?.fullName}
                </span>
                <span className="truncate text-xs text-textDisabled capitalize">
                  {user?.role}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={logout}
            className={cn(
              "mt-4 flex w-full items-center gap-4 rounded-button px-4 py-3 text-sm font-medium text-error hover:bg-error/10 transition-colors",
              !isSidebarOpen && "justify-center"
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {isSidebarOpen && <span>Sign Out</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-24 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-elevated text-textMuted hover:text-textPrimary shadow-card transition-colors"
        >
          {isSidebarOpen ? <X className="h-3 w-3" /> : <Menu className="h-3 w-3" />}
        </button>
      </motion.aside>

      {/* ── Main Content ── */}
      <main className="relative flex flex-1 flex-col overflow-hidden">
        <header className="flex h-20 items-center justify-between border-b border-border bg-surface/30 px-8 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-display font-bold text-textPrimary">
              {currentPageTitle}
            </h1>
            <div className="flex items-center gap-2 text-textDisabled">
              <ChevronRight className="h-4 w-4" />
              <span className="text-sm font-medium">Client Workspace</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button className="relative rounded-full p-2 text-textMuted hover:bg-elevated hover:text-textPrimary transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent shadow-glow" />
            </button>
            <div className="h-8 w-[1px] bg-border" />
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold text-textPrimary">
                  {user?.fullName}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
                  Client
                </span>
              </div>
              <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-border shadow-glow">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.fullName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-accent/20 text-accent">
                    <User className="h-5 w-5" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="mx-auto max-w-7xl"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};
