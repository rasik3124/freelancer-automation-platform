/**
 * App.tsx — Root routing configuration for Crescent Black
 *
 * Route structure:
 *   /                          LandingPage
 *   /auth                      Auth (login + signup)
 *   /login  /signup            → /auth
 *   /role-select               RoleSelect
 *   /onboarding/freelancer     OnboardingFreelancer (role-guarded)
 *   /onboarding/client         OnboardingClient     (role-guarded)
 *   /dashboard/freelancer/*    DashboardLayout      (role-guarded: freelancer)
 *   /dashboard/client/*        ClientLayout         (role-guarded: client)
 *   /freelancer/*              → /dashboard/freelancer/*  (aliases)
 *   /client/*                  → /dashboard/client/*      (aliases)
 *   /messages                  → /dashboard/client/messages
 *   /settings                  → /dashboard/freelancer/settings
 *   /*                         NotFoundPage
 */

import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AnimatePresence } from "motion/react";
import { ROUTES } from "./constants";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RoleGuard } from "./components/RoleGuard";

// ─── Public pages ─────────────────────────────────────────────────────────────
const Landing              = lazy(() => import("./pages/Landing"));
const Auth                 = lazy(() => import("./pages/Auth").then(m => ({ default: m.Auth })));
const NotFoundPage         = lazy(() => import("./pages/NotFoundPage").then(m => ({ default: m.NotFoundPage })));

// ─── Role selection & onboarding ──────────────────────────────────────────────
const RoleSelect           = lazy(() => import("./pages/RoleSelect").then(m => ({ default: m.RoleSelect })));
const OnboardingFreelancer = lazy(() => import("./pages/OnboardingFreelancer").then(m => ({ default: m.OnboardingFreelancer })));
const OnboardingClient     = lazy(() => import("./pages/OnboardingClient").then(m => ({ default: m.OnboardingClient })));

// ─── Freelancer dashboard ─────────────────────────────────────────────────────
const DashboardLayout      = lazy(() => import("./components/DashboardLayout").then(m => ({ default: m.DashboardLayout })));
const Dashboard            = lazy(() => import("./pages/Dashboard").then(m => ({ default: m.Dashboard })));
const LeadAnalyzer         = lazy(() => import("./pages/LeadAnalyzer").then(m => ({ default: m.LeadAnalyzer })));
const ProposalGenerator    = lazy(() => import("./pages/ProposalGenerator").then(m => ({ default: m.ProposalGenerator })));
const Meetings             = lazy(() => import("./pages/Meetings").then(m => ({ default: m.Meetings })));
const Settings             = lazy(() => import("./pages/Settings").then(m => ({ default: m.Settings })));
const FreelancerAnalytics  = lazy(() => import("./pages/FreelancerAnalytics").then(m => ({ default: m.FreelancerAnalytics })));
const FreelancerFeedback   = lazy(() => import("./pages/FreelancerFeedback").then(m => ({ default: m.FreelancerFeedback })));
const FreelancerProjects   = lazy(() => import("./pages/FreelancerProjects").then(m => ({ default: m.FreelancerProjects })));
const FreelancerInvoices   = lazy(() => import("./pages/FreelancerInvoices").then(m => ({ default: m.FreelancerInvoices })));
const FreelancerClients    = lazy(() => import("./pages/FreelancerClients").then(m => ({ default: m.FreelancerClients })));
const FreelancerMessages   = lazy(() => import("./pages/FreelancerMessages").then(m => ({ default: m.FreelancerMessages })));

// ─── Client dashboard ─────────────────────────────────────────────────────────
const ClientLayout         = lazy(() => import("./components/ClientLayout").then(m => ({ default: m.ClientLayout })));
const ClientDashboard      = lazy(() => import("./components/dashboard/ClientDashboard").then(m => ({ default: m.ClientDashboard })));
const ClientProjects       = lazy(() => import("./pages/client/ClientProjects").then(m => ({ default: m.ClientProjects })));
const ClientFreelancers    = lazy(() => import("./pages/client/FindFreelancersPage").then(m => ({ default: m.FindFreelancersPage })));
const ClientProposals      = lazy(() => import("./pages/client/ProposalsPage").then(m => ({ default: m.ProposalsPage })));
const ClientMeetings       = lazy(() => import("./pages/client/MeetingsPage").then(m => ({ default: m.MeetingsPage })));
const ClientMessages       = lazy(() => import("./pages/client/MessagesPage").then(m => ({ default: m.MessagesPage })));
const ClientInvoices       = lazy(() => import("./pages/client/InvoicesPage").then(m => ({ default: m.InvoicesPage })));
const ClientSettings       = lazy(() => import("./pages/client/SettingsPage").then(m => ({ default: m.SettingsPage })));
const AIChatPage           = lazy(() => import("./pages/client/AIChatPage").then(m => ({ default: m.AIChatPage })));
const ClientFeedback       = lazy(() => import("./pages/client/ClientFeedback").then(m => ({ default: m.ClientFeedback })));
const ClientAnalytics      = lazy(() => import("./pages/client/ClientAnalytics").then(m => ({ default: m.ClientAnalytics })));
const PostProjectPage      = lazy(() => import("./pages/client/PostProjectPage").then(m => ({ default: m.PostProjectPage })));
const ClientPayments       = lazy(() => import("./pages/client/ClientPayments").then(m => ({ default: m.ClientPayments })));

// ─── Full-screen loading spinner ──────────────────────────────────────────────
const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-base">
    <div className="relative flex items-center justify-center">
      <div className="h-14 w-14 animate-spin rounded-full border-4 border-border border-t-accent shadow-glow" />
      <div className="absolute h-4 w-4 rounded-full bg-accent/60 shadow-glow animate-pulse" />
    </div>
  </div>
);

// ─── App ─────────────────────────────────────────────────────────────────────
const App: React.FC = () => (
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <Suspense fallback={<PageLoader />}>
      <AnimatePresence mode="wait">
        <Routes>

          {/* ── Public ─────────────────────────────────────────────────────── */}
          <Route path={ROUTES.LANDING} element={<Landing />} />
          <Route path={ROUTES.AUTH}    element={<Auth />} />
          <Route path="/login"         element={<Navigate to={ROUTES.AUTH} replace />} />
          <Route path="/signup"        element={<Navigate to={ROUTES.AUTH} replace />} />

          {/* ── Role selection ──────────────────────────────────────────────── */}
          <Route path={ROUTES.ROLE_SELECT} element={<RoleSelect />} />

          {/* ── Onboarding (requires auth + correct role) ───────────────────── */}
          <Route path={ROUTES.ONBOARDING_FREELANCER} element={
            <ProtectedRoute>
              <RoleGuard requiredRole="freelancer">
                <OnboardingFreelancer />
              </RoleGuard>
            </ProtectedRoute>
          } />
          <Route path={ROUTES.ONBOARDING_CLIENT} element={
            <ProtectedRoute>
              <RoleGuard requiredRole="client">
                <OnboardingClient />
              </RoleGuard>
            </ProtectedRoute>
          } />

          {/* ── Freelancer dashboard (role-guarded) ─────────────────────────── */}
          <Route path="/dashboard/freelancer" element={
            <ProtectedRoute>
              <RoleGuard requiredRole="freelancer">
                <DashboardLayout />
              </RoleGuard>
            </ProtectedRoute>
          }>
            <Route index                       element={<Dashboard />} />
            <Route path="clients"              element={<FreelancerClients />} />
            <Route path="lead-analyzer"        element={<LeadAnalyzer />} />
            <Route path="proposal-generator"   element={<ProposalGenerator />} />
            <Route path="projects"             element={<FreelancerProjects />} />
            <Route path="meetings"             element={<Meetings />} />
            <Route path="messages"             element={<FreelancerMessages />} />
            <Route path="invoices"             element={<FreelancerInvoices />} />
            <Route path="analytics"            element={<FreelancerAnalytics />} />
            <Route path="feedback"             element={<FreelancerFeedback />} />
            <Route path="ai-chat"              element={<AIChatPage />} />
            <Route path="settings"             element={<Settings />} />
          </Route>

          {/* ── Client dashboard (role-guarded) ────────────────────────────── */}
          <Route path="/dashboard/client" element={
            <ProtectedRoute>
              <RoleGuard requiredRole="client">
                <ClientLayout />
              </RoleGuard>
            </ProtectedRoute>
          }>
            <Route index                   element={<ClientDashboard />} />
            <Route path="post-project"     element={<PostProjectPage />} />
            <Route path="projects"         element={<ClientProjects />} />
            <Route path="freelancers"      element={<ClientFreelancers />} />
            <Route path="proposals"        element={<ClientProposals />} />
            <Route path="meetings"         element={<ClientMeetings />} />
            <Route path="messages"         element={<ClientMessages />} />
            <Route path="ai-chat"          element={<AIChatPage />} />
            <Route path="invoices"         element={<ClientInvoices />} />
            <Route path="payments"         element={<ClientPayments />} />
            <Route path="analytics"        element={<ClientAnalytics />} />
            <Route path="feedback"         element={<ClientFeedback />} />
            <Route path="settings"         element={<ClientSettings />} />
          </Route>

          {/* ── Alias routes (short URLs → dashboard paths) ─────────────────── */}
          <Route path="/dashboard"                   element={<Navigate to="/dashboard/freelancer" replace />} />

          {/* Freelancer aliases */}
          <Route path="/freelancer/clients"          element={<Navigate to="/dashboard/freelancer/clients" replace />} />
          <Route path="/freelancer/proposals"        element={<Navigate to="/dashboard/freelancer/proposal-generator" replace />} />
          <Route path="/freelancer/projects"         element={<Navigate to="/dashboard/freelancer/projects" replace />} />
          <Route path="/freelancer/meetings"         element={<Navigate to="/dashboard/freelancer/meetings" replace />} />
          <Route path="/freelancer/invoices"         element={<Navigate to="/dashboard/freelancer/invoices" replace />} />
          <Route path="/freelancer/analytics"        element={<Navigate to="/dashboard/freelancer/analytics" replace />} />

          {/* Client aliases */}
          <Route path="/client/post-project"         element={<Navigate to="/dashboard/client/post-project" replace />} />
          <Route path="/client/find-talent"          element={<Navigate to="/dashboard/client/freelancers" replace />} />
          <Route path="/client/proposals"            element={<Navigate to="/dashboard/client/proposals" replace />} />
          <Route path="/client/projects"             element={<Navigate to="/dashboard/client/projects" replace />} />
          <Route path="/client/meetings"             element={<Navigate to="/dashboard/client/meetings" replace />} />
          <Route path="/client/payments"             element={<Navigate to="/dashboard/client/payments" replace />} />
          <Route path="/client/analytics"            element={<Navigate to="/dashboard/client/analytics" replace />} />

          {/* Shared aliases */}
          <Route path="/messages"                    element={<Navigate to="/dashboard/client/messages" replace />} />
          <Route path="/messages/:id"                element={<Navigate to="/dashboard/client/messages" replace />} />
          <Route path="/settings"                    element={<Navigate to="/dashboard/freelancer/settings" replace />} />

          {/* ── 404 ──────────────────────────────────────────────────────────── */}
          <Route path="*" element={<NotFoundPage />} />

        </Routes>
      </AnimatePresence>
    </Suspense>
  </BrowserRouter>
);

export default App;
