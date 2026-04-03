// ─── Shared Settings Types ────────────────────────────────────────────────────

export interface NotificationSettings {
  emailNewProposals: boolean; emailProposalReminders: boolean;
  emailMeetingReminders: boolean; emailInvoices: boolean;
  emailProjectUpdates: boolean; emailAiInsights: boolean;
  emailWeeklyDigest: boolean;
  pushNewProposals: boolean; pushMeetingReminders: boolean;
  pushMessages: boolean;
}

export interface ConnectedAccounts {
  google: boolean; github: boolean; outlook: boolean; zapier: boolean;
}

export interface ClientProfile {
  uid: string; fullName: string; email: string;
  phone: string; location: string;
  companyName: string; companyWebsite: string; companySize: string;
  industry: string; companyDescription: string; logoUrl: string;
  notifications: NotificationSettings;
  connectedAccounts: ConnectedAccounts;
  createdAt: string; updatedAt: string;
}

// ─── Shared form components ───────────────────────────────────────────────────

export const COUNTRIES = [
  "United States","United Kingdom","Canada","Australia","Germany","France","India",
  "Singapore","UAE","Netherlands","Brazil","Japan","South Korea","Sweden","Other",
];

export const COMPANY_SIZES = [
  "1 (Solo)","2–10","11–50","51–200","201–500","500+",
];

export const INDUSTRIES = [
  "Technology & Software","E-Commerce & Retail","Finance & FinTech",
  "Healthcare","Education & EdTech","Marketing & Advertising",
  "Media & Entertainment","Real Estate","Manufacturing","Other",
];

export const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  emailNewProposals: true, emailProposalReminders: true, emailMeetingReminders: true,
  emailInvoices: true, emailProjectUpdates: true, emailAiInsights: false, emailWeeklyDigest: true,
  pushNewProposals: true, pushMeetingReminders: true, pushMessages: true,
};
