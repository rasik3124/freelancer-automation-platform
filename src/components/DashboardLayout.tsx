import React, { useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard, Search, FileText, Calendar, Settings, LogOut,
  Bell, User, Menu, X, ChevronRight, Bot, BarChart2, Star,
  FolderOpen, Receipt, MessageCircle, Users2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ROUTES, APP_NAME } from "../constants";
import { cn } from "../lib/utils";


export const DashboardLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: "Overview",          path: ROUTES.DASHBOARD_FREELANCER },
    { icon: Users2,          label: "Clients",           path: ROUTES.FREELANCER_CLIENTS },
    { icon: Search,          label: "Lead Analyzer",     path: ROUTES.LEAD_ANALYZER },
    { icon: FileText,        label: "Proposals",         path: ROUTES.PROPOSAL_GENERATOR },
    { icon: FolderOpen,      label: "Projects",          path: ROUTES.FREELANCER_PROJECTS },
    { icon: Calendar,        label: "Meetings",          path: ROUTES.MEETINGS },
    { icon: MessageCircle,   label: "Messages",          path: ROUTES.FREELANCER_MESSAGES },
    { icon: Receipt,         label: "Invoices",          path: ROUTES.FREELANCER_INVOICES },
    { icon: BarChart2,       label: "Analytics",         path: ROUTES.FREELANCER_ANALYTICS },
    { icon: Star,            label: "Feedback",          path: ROUTES.FREELANCER_FEEDBACK },
    { icon: Bot,             label: "AI Assistant",      path: ROUTES.FREELANCER_AI_CHAT },
    { icon: Settings,        label: "Settings",          path: ROUTES.SETTINGS },
  ];



  const handleLogout = () => logout();


  const currentPageTitle = navItems.find(item => item.path === location.pathname)?.label || "Dashboard";

  return (
    <div className="flex h-screen w-full bg-base">
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="relative z-50 flex h-screen flex-col border-r border-border bg-surface/50 backdrop-blur-xl shrink-0"
        style={{ minWidth: isSidebarOpen ? 280 : 80 }}
      >
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
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg overflow-hidden border border-accent/30 shadow-glow">
                  <img
                    src="https://drive.google.com/uc?export=view&id=1ztNeXJL8_G5zwA03ZCul-WmBBU6SaLJ5"
                    alt="Crescent Black Logo"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={e => { (e.target as HTMLImageElement).src = ''; }}
                  />
                </div>
                <span className="text-lg font-display font-bold tracking-tight text-textPrimary whitespace-nowrap">
                  Crescent Black
                </span>
              </motion.div>

            ) : (
              <motion.div
                key="logo-mini"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden border border-accent/30 shadow-glow"
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
        </div>

        <nav className="flex-1 overflow-y-auto custom-scrollbar space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === ROUTES.DASHBOARD}
              className={({ isActive }) =>
                cn(
                  "group relative flex items-center gap-4 rounded-button px-4 py-3 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-accent/10 text-accent shadow-[inset_0_0_20px_rgba(199,168,109,0.05)]"
                    : "text-textMuted hover:bg-elevated hover:text-textPrimary"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-accent" : "text-textDisabled group-hover:text-textPrimary")} />
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
                      layoutId="sidebar-active-indicator"
                      className="absolute left-0 h-6 w-1 rounded-r-full bg-accent shadow-glow"
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border p-4">
          <div className={cn("flex items-center gap-3 rounded-button bg-elevated/50 p-3", !isSidebarOpen && "justify-center")}>
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border bg-surface">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-accent/20 text-accent">
                  <User className="h-5 w-5" />
                </div>
              )}
            </div>
            {isSidebarOpen && (
              <div className="flex flex-1 flex-col overflow-hidden">
                <span className="truncate text-sm font-semibold text-textPrimary">{user?.fullName}</span>
                <span className="truncate text-xs text-textDisabled">{user?.role}</span>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={cn(
              "mt-4 flex w-full items-center gap-4 rounded-button px-4 py-3 text-sm font-medium text-error hover:bg-error/10 transition-colors",
              !isSidebarOpen && "justify-center"
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {isSidebarOpen && <span>Sign Out</span>}
          </button>
        </div>

        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-24 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-elevated text-textMuted hover:text-textPrimary shadow-card transition-colors"
        >
          {isSidebarOpen ? <X className="h-3 w-3" /> : <Menu className="h-3 w-3" />}
        </button>
      </motion.aside>

      <main className="relative flex flex-1 flex-col min-w-0 overflow-hidden">
        <header className="flex h-20 items-center justify-between border-b border-border bg-surface/30 px-8 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-display font-bold text-textPrimary">{currentPageTitle}</h1>
            <div className="flex items-center gap-2 text-textDisabled">
              <ChevronRight className="h-4 w-4" />
              <span className="text-sm font-medium">Workspace</span>
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
                <span className="text-sm font-semibold text-textPrimary">{user?.fullName}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gold">Premium Plan</span>
              </div>
              <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-border shadow-glow">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-accent/20 text-accent">
                    <User className="h-5 w-5" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
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
