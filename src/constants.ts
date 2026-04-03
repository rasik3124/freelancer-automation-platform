export const APP_NAME = "Crescent Black";
export const APP_SUBTITLE = "Freelancing Automation Platform";

export const API_BASE_URL: string =
  import.meta.env.VITE_API_URL ?? "";

export const ROUTES = {
  LANDING: "/",
  AUTH: "/auth",
  ROLE_SELECT: "/role-select",
  ONBOARDING_FREELANCER: "/onboarding/freelancer",
  ONBOARDING_CLIENT: "/onboarding/client",

  // ── Freelancer dashboard ─────────────────────────────────────────────────────
  DASHBOARD_FREELANCER: "/dashboard/freelancer",
  DASHBOARD: "/dashboard/freelancer",
  LEAD_ANALYZER:        "/dashboard/freelancer/lead-analyzer",
  PROPOSAL_GENERATOR:   "/dashboard/freelancer/proposal-generator",
  MEETINGS:             "/dashboard/freelancer/meetings",
  SETTINGS:             "/dashboard/freelancer/settings",
  FREELANCER_AI_CHAT:   "/dashboard/freelancer/ai-chat",
  FREELANCER_ANALYTICS: "/dashboard/freelancer/analytics",
  FREELANCER_FEEDBACK:  "/dashboard/freelancer/feedback",
  FREELANCER_PROJECTS:  "/dashboard/freelancer/projects",
  FREELANCER_INVOICES:  "/dashboard/freelancer/invoices",
  FREELANCER_CLIENTS:   "/dashboard/freelancer/clients",
  FREELANCER_MESSAGES:  "/dashboard/freelancer/messages",

  // ── Client dashboard ─────────────────────────────────────────────────────────
  DASHBOARD_CLIENT:     "/dashboard/client",
  CLIENT_PROJECTS:      "/dashboard/client/projects",
  CLIENT_FREELANCERS:   "/dashboard/client/freelancers",
  CLIENT_PROPOSALS:     "/dashboard/client/proposals",
  CLIENT_MEETINGS:      "/dashboard/client/meetings",
  CLIENT_MESSAGES:      "/dashboard/client/messages",
  CLIENT_INVOICES:      "/dashboard/client/invoices",
  CLIENT_SETTINGS:      "/dashboard/client/settings",
  CLIENT_AI_CHAT:       "/dashboard/client/ai-chat",
  CLIENT_FEEDBACK:      "/dashboard/client/feedback",
  CLIENT_ANALYTICS:     "/dashboard/client/analytics",
  CLIENT_POST_PROJECT:  "/dashboard/client/post-project",
  CLIENT_PAYMENTS:      "/dashboard/client/payments",
};

export const EXPERIENCE_LEVELS = [
  { value: "entry",        label: "Entry Level"    },
  { value: "intermediate", label: "Intermediate"   },
  { value: "expert",       label: "Expert"         },
];

export const FREELANCER_ROLES = [
  "Frontend Developer",
  "Backend Developer",
  "Fullstack Developer",
  "UI/UX Designer",
  "Product Manager",
  "DevOps Engineer",
  "Data Scientist",
  "Mobile Developer",
  "Other",
];

export const SKILLS_SUGGESTIONS = [
  "React", "Node.js", "TypeScript", "TailwindCSS", "Figma",
  "Python", "AWS", "Docker", "Kubernetes", "GraphQL",
  "Next.js", "PostgreSQL", "MongoDB", "Redis", "Jest", "Cypress",
];
